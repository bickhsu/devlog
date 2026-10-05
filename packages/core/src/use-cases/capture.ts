import { normalizeEntryContent } from '../domain/content'
import { DomainError, DomainErrorCode } from '../domain/errors'
import type { CaptureSurface, Entry } from '../domain/models'
import type { AppStateRepository } from '../repositories/contracts'

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
  /**
   * Save any pending edit now and wait for earlier writes, e.g. on hide/close.
   * If the edit's context was archived or removed elsewhere, the text is saved
   * without it and this still rejects, so the composer can clear its picker.
   */
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
  // Every repository call chains onto this, so calls run one at a time in
  // invocation order. It never rejects, so a failed call does not block later ones.
  let tail: Promise<unknown> = Promise.resolve()
  let pending: CaptureComposerState | null = null
  // Bumped whenever the pending edit is replaced or deliberately cleared, so
  // a failed write restores its edit only if nothing happened since.
  let generation = 0
  let timerHandle: unknown = null

  function enqueue<T>(task: () => Promise<T>): Promise<T> {
    const result = tail.then(task)
    tail = result.catch(() => undefined)
    return result
  }

  function cancelAutosave() {
    if (timerHandle !== null) timer.clear(timerHandle)
    timerHandle = null
  }

  /**
   * Put an unsaved edit back after a failed write, unless the user typed,
   * discarded, or submitted since it was taken.
   */
  function restorePending(state: CaptureComposerState, takenAt: number) {
    if (generation === takenAt) pending = state
  }

  function flush(): Promise<void> {
    cancelAutosave()
    const state = pending
    const takenAt = generation
    pending = null
    return enqueue(async () => {
      if (state === null) return
      try {
        await repository.saveDraft({ surface, ...state })
      } catch (error) {
        if (state.contextId === null || !isUnselectableContext(error)) {
          restorePending(state, takenAt)
          throw error
        }
        try {
          await repository.saveDraft({ surface, content: state.content, contextId: null })
        } catch (fallbackError) {
          restorePending(state, takenAt)
          throw fallbackError
        }
        throw error
      }
    })
  }

  return {
    load() {
      return enqueue(async () => {
        const draft = await repository.getDraft(surface)
        if (draft) return { content: draft.content, contextId: draft.contextId }
        return { content: '', contextId: await repository.getDefaultContextId() }
      })
    },

    change(state) {
      pending = state
      generation += 1
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
      generation += 1
      return enqueue(() => repository.discardDraft(surface))
    },

    async submit(state) {
      const content = normalizeEntryContent(state.content)
      cancelAutosave()
      pending = null
      const takenAt = ++generation
      return await enqueue(async () => {
        try {
          return await repository.submitEntry({
            surface, content, contextId: state.contextId,
          })
        } catch (error) {
          // The edit was never saved as a draft; keep it for the next flush.
          restorePending(state, takenAt)
          throw error
        }
      })
    },
  }
}

function isUnselectableContext(error: unknown): boolean {
  return error instanceof DomainError && (
    error.code === DomainErrorCode.ContextArchived ||
    error.code === DomainErrorCode.ContextNotFound
  )
}
