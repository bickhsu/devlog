import { normalizeEntryContent } from '../domain/content'
import type { CaptureSurface, Entry } from '../domain/models'
import type { AppStateRepository } from '../repositories/contracts'
import { createKeyedSerialQueue } from '../lib/serial-queue'

/** What a composer shows: raw text plus its selected context. */
export type CaptureComposerState = {
  readonly content: string
  readonly contextId: string | null
}

/** Injectable so tests can fire autosaves deterministically. */
export type AutosaveTimer = {
  set(callback: () => void, delayMs: number): unknown
  clear(handle: unknown): void
}

export type CaptureSessionOptions = {
  readonly repository: AppStateRepository
  readonly surface: CaptureSurface
  readonly autosaveDelayMs?: number
  readonly timer?: AutosaveTimer
  /** Debounced saves have no caller to reject; failures are reported here. */
  readonly onAutosaveError?: (error: unknown) => void
}

/**
 * One composer's draft lifecycle. Every repository call runs in invocation
 * order, and submit cancels the pending autosave, so an autosave can never
 * recreate the draft that a successful submit cleared.
 */
export type CaptureSession = {
  /** Restore the saved draft, or start empty with the default context. */
  load(): Promise<CaptureComposerState>
  /** Record an edit; it is saved after the autosave delay. */
  change(state: CaptureComposerState): void
  /** Save any pending edit now and wait for earlier writes, e.g. on hide/close. */
  flush(): Promise<void>
  discard(): Promise<void>
  /** Rejects invalid content without touching storage or the pending edit. */
  submit(state: CaptureComposerState): Promise<Entry>
}

export const DEFAULT_AUTOSAVE_DELAY_MS = 500

const defaultTimer: AutosaveTimer = {
  set: (callback, delayMs) => setTimeout(callback, delayMs),
  clear: (handle) => clearTimeout(handle as ReturnType<typeof setTimeout>),
}

export function createCaptureSession({
  repository,
  surface,
  autosaveDelayMs = DEFAULT_AUTOSAVE_DELAY_MS,
  timer = defaultTimer,
  onAutosaveError = () => {},
}: CaptureSessionOptions): CaptureSession {
  const queue = createKeyedSerialQueue<CaptureSurface>()
  let pending: CaptureComposerState | null = null
  let timerHandle: unknown = null

  function cancelAutosave() {
    if (timerHandle !== null) timer.clear(timerHandle)
    timerHandle = null
  }

  /** Put an unsaved edit back unless the user has typed something newer. */
  function restorePending(state: CaptureComposerState) {
    pending ??= state
  }

  function flush(): Promise<void> {
    cancelAutosave()
    const state = pending
    pending = null
    return queue.run(surface, async () => {
      if (state === null) return
      try {
        await repository.saveDraft({ surface, ...state })
      } catch (error) {
        restorePending(state)
        throw error
      }
    })
  }

  return {
    load() {
      return queue.run(surface, async () => {
        const draft = await repository.getDraft(surface)
        if (draft) return { content: draft.content, contextId: draft.contextId }
        return { content: '', contextId: await repository.getDefaultContextId() }
      })
    },

    change(state) {
      pending = state
      cancelAutosave()
      timerHandle = timer.set(() => {
        timerHandle = null
        flush().catch(onAutosaveError)
      }, autosaveDelayMs)
    },

    flush,

    discard() {
      cancelAutosave()
      pending = null
      return queue.run(surface, () => repository.discardDraft(surface))
    },

    async submit(state) {
      const content = normalizeEntryContent(state.content)
      cancelAutosave()
      pending = null
      return await queue.run(surface, async () => {
        try {
          return await repository.submitEntry({
            surface, content, contextId: state.contextId,
          })
        } catch (error) {
          // The edit was never saved as a draft; keep it for the next flush.
          restorePending(state)
          throw error
        }
      })
    },
  }
}
