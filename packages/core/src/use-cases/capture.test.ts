import { describe, expect, test } from 'bun:test'

import {
  DomainError,
  DomainErrorCode,
  createCaptureSession,
  type AppStateRepository,
  type AutosaveTimer,
  type CaptureDraft,
  type CaptureSurface,
  type Entry,
  type SaveCaptureDraftInput,
  type SubmitEntryInput,
} from '../index'

/** Fires autosaves only when the test says so. */
class ManualTimer implements AutosaveTimer {
  private callback: (() => void) | null = null

  set(callback: () => void): unknown {
    this.callback = callback
    return callback
  }

  clear(handle: unknown): void {
    if (this.callback === handle) this.callback = null
  }

  get armed(): boolean {
    return this.callback !== null
  }

  fire(): void {
    const callback = this.callback
    this.callback = null
    callback?.()
  }
}

/**
 * Deliberately not serialized, so these tests prove the session orders its
 * own calls. `holdSaves` keeps saves in flight until `releaseSaves`.
 */
class RecordingRepository implements AppStateRepository {
  readonly drafts = new Map<CaptureSurface, CaptureDraft>()
  readonly entries: Entry[] = []
  readonly log: string[] = []
  defaultContextId: string | null = null
  readonly archivedContextIds = new Set<string>()
  failNext: 'save' | 'submit' | null = null
  private held: (() => void)[] | null = null

  holdSaves(): void {
    this.held = []
  }

  releaseSaves(): void {
    const held = this.held ?? []
    this.held = null
    for (const release of held) release()
  }

  async getDefaultContextId(): Promise<string | null> {
    return this.defaultContextId
  }

  async getDraft(surface: CaptureSurface): Promise<CaptureDraft | null> {
    return this.drafts.get(surface) ?? null
  }

  async saveDraft(input: SaveCaptureDraftInput): Promise<CaptureDraft> {
    this.log.push(`save:start:${input.content}`)
    if (this.held) await new Promise<void>((release) => this.held?.push(release))
    if (this.takeFailure('save')) throw new DomainError(DomainErrorCode.DraftSaveFailed)
    this.rejectArchived(input.contextId)
    const draft = { ...input, updatedAt: new Date() }
    this.drafts.set(input.surface, draft)
    this.log.push(`save:end:${input.content}`)
    return draft
  }

  async discardDraft(surface: CaptureSurface): Promise<void> {
    this.log.push('discard')
    this.drafts.delete(surface)
  }

  async submitEntry(input: SubmitEntryInput): Promise<Entry> {
    this.log.push(`submit:${input.content}`)
    if (this.takeFailure('submit')) throw new DomainError(DomainErrorCode.StorageUnavailable)
    const now = new Date()
    const entry: Entry = {
      id: String(this.entries.length + 1), content: input.content,
      contextId: input.contextId, createdAt: now, updatedAt: now, deletedAt: null,
    }
    this.entries.push(entry)
    this.defaultContextId = input.contextId
    this.drafts.delete(input.surface)
    return entry
  }

  private rejectArchived(contextId: string | null): void {
    if (contextId !== null && this.archivedContextIds.has(contextId)) {
      throw new DomainError(DomainErrorCode.ContextArchived)
    }
  }

  private takeFailure(kind: 'save' | 'submit'): boolean {
    if (this.failNext !== kind) return false
    this.failNext = null
    return true
  }
}

function setup(surface: CaptureSurface = 'main') {
  const repository = new RecordingRepository()
  const timer = new ManualTimer()
  const autosaveErrors: unknown[] = []
  const session = createCaptureSession({
    repository, surface, timer,
    onAutosaveError: (error) => autosaveErrors.push(error),
  })
  return { repository, timer, session, autosaveErrors }
}

/** Let queued promise callbacks run. */
async function settle() {
  for (let i = 0; i < 10; i++) await Promise.resolve()
}

describe('capture session', () => {
  test('loads an existing draft, or an empty composer with the default context', async () => {
    const { repository, session } = setup()
    repository.defaultContextId = 'devlog'
    expect(await session.load()).toEqual({ content: '', contextId: 'devlog' })

    await repository.saveDraft({ surface: 'main', content: ' raw ', contextId: null })
    expect(await session.load()).toEqual({ content: ' raw ', contextId: null })
  })

  test('debounces edits into a single save of the latest state', async () => {
    const { repository, timer, session } = setup()
    session.change({ content: 'a', contextId: null })
    session.change({ content: 'ab', contextId: 'devlog' })
    expect(repository.log).toEqual([])

    timer.fire()
    await settle()
    expect(repository.log).toEqual(['save:start:ab', 'save:end:ab'])
    expect(repository.drafts.get('main')).toMatchObject({ content: 'ab', contextId: 'devlog' })
  })

  test('flush saves a pending edit immediately, e.g. when the window hides', async () => {
    const { repository, timer, session } = setup()
    session.change({ content: 'hide me', contextId: null })
    await session.flush()
    expect(timer.armed).toBe(false)
    expect(repository.drafts.get('main')?.content).toBe('hide me')
  })

  test('submit cancels the pending autosave so it cannot recreate the draft', async () => {
    const { repository, timer, session } = setup()
    session.change({ content: 'typed', contextId: null })

    await session.submit({ content: ' typed ', contextId: 'devlog' })
    timer.fire()
    await settle()

    expect(repository.log).toEqual(['submit:typed'])
    expect(repository.drafts.has('main')).toBe(false)
    expect(repository.entries.map((entry) => entry.content)).toEqual(['typed'])
  })

  test('submit waits for an in-flight save, then clears the draft', async () => {
    const { repository, timer, session } = setup()
    repository.holdSaves()
    session.change({ content: 'draft', contextId: null })
    timer.fire()
    await settle()
    expect(repository.log).toEqual(['save:start:draft'])

    const submitted = session.submit({ content: 'draft', contextId: null })
    await settle()
    expect(repository.log).toEqual(['save:start:draft'])

    repository.releaseSaves()
    await submitted
    expect(repository.log).toEqual(['save:start:draft', 'save:end:draft', 'submit:draft'])
    expect(repository.drafts.has('main')).toBe(false)
  })

  test('edits made after submit starts become the next draft', async () => {
    const { repository, timer, session } = setup()
    const submitted = session.submit({ content: 'first', contextId: null })
    session.change({ content: 'second', contextId: null })
    timer.fire()
    await submitted
    await settle()

    expect(repository.log).toEqual(['submit:first', 'save:start:second', 'save:end:second'])
    expect(repository.drafts.get('main')?.content).toBe('second')
  })

  test('rejects empty content without touching storage or the pending edit', async () => {
    const { repository, timer, session } = setup()
    session.change({ content: '  ', contextId: null })

    await expect(session.submit({ content: '  ', contextId: null }))
      .rejects.toMatchObject({ code: DomainErrorCode.EmptyEntryContent })
    expect(repository.log).toEqual([])
    expect(timer.armed).toBe(true)
  })

  test('a failed submit keeps the edit so the next flush saves it as a draft', async () => {
    const { repository, session } = setup()
    repository.failNext = 'submit'

    await expect(session.submit({ content: 'keep me', contextId: null }))
      .rejects.toMatchObject({ code: DomainErrorCode.StorageUnavailable })
    await session.flush()
    expect(repository.drafts.get('main')?.content).toBe('keep me')
  })

  test('a failed autosave is reported and retried by the next flush', async () => {
    const { repository, timer, session, autosaveErrors } = setup()
    repository.failNext = 'save'
    session.change({ content: 'retry', contextId: null })
    timer.fire()
    await settle()

    expect(autosaveErrors).toEqual([expect.objectContaining({
      code: DomainErrorCode.DraftSaveFailed,
    })])
    await session.flush()
    expect(repository.drafts.get('main')?.content).toBe('retry')
  })

  test.each(['submit', 'discard'] as const)(
    'an in-flight save that fails cannot bring the draft back after %s',
    async (action) => {
      const { repository, timer, session, autosaveErrors } = setup()
      repository.holdSaves()
      session.change({ content: 'draft', contextId: null })
      timer.fire()
      await settle()

      repository.failNext = 'save'
      const done = action === 'submit'
        ? session.submit({ content: 'draft', contextId: null })
        : session.discard()
      repository.releaseSaves()
      await done
      await settle()
      await session.flush()

      expect(autosaveErrors).toHaveLength(1)
      expect(repository.drafts.has('main')).toBe(false)
      expect(repository.log.filter((line) => line.startsWith('save:start'))).toHaveLength(1)
    },
  )

  test('keeps the text without its context when the context was archived elsewhere', async () => {
    const { repository, session } = setup()
    repository.archivedContextIds.add('old')
    session.change({ content: 'keep me', contextId: 'old' })

    await expect(session.flush()).rejects.toMatchObject({ code: DomainErrorCode.ContextArchived })
    expect(repository.drafts.get('main')).toMatchObject({ content: 'keep me', contextId: null })

    await session.flush()
    expect(repository.log.filter((line) => line.startsWith('save:start'))).toHaveLength(2)
  })

  test('discard cancels the pending autosave and removes the draft', async () => {
    const { repository, timer, session } = setup()
    await repository.saveDraft({ surface: 'main', content: 'old', contextId: null })
    session.change({ content: 'newer', contextId: null })

    await session.discard()
    timer.fire()
    await settle()
    expect(repository.drafts.has('main')).toBe(false)
  })

  test('sessions for different surfaces keep separate drafts', async () => {
    const repository = new RecordingRepository()
    const main = createCaptureSession({ repository, surface: 'main' })
    const quick = createCaptureSession({ repository, surface: 'quick-capture' })
    main.change({ content: 'main draft', contextId: null })
    quick.change({ content: 'quick draft', contextId: 'devlog' })
    await Promise.all([main.flush(), quick.flush()])

    await quick.submit({ content: 'quick draft', contextId: 'devlog' })
    expect(repository.drafts.has('quick-capture')).toBe(false)
    expect(await main.load()).toEqual({ content: 'main draft', contextId: null })
    expect(await quick.load()).toEqual({ content: '', contextId: 'devlog' })
  })
})
