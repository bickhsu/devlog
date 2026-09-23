import { describe, expect, test } from 'bun:test'

import {
  DomainError,
  DomainErrorCode,
  normalizeEntryContent,
  type CaptureDraft,
  type CaptureSurface,
  type SaveCaptureDraftInput,
  type SubmitEntryInput,
  type AppStateRepository,
  type Context,
  type DateRange,
  type Entry,
  type EntryRepository,
  type ListEntriesByContextInput,
  type UpdateEntryInput,
} from '../index'

/** Mutations finish synchronously in this fake; storage adapters need serialization. */
class InMemoryAppStateRepository implements AppStateRepository {
  private defaultContextId: string | null = null
  private readonly drafts = new Map<CaptureSurface, CaptureDraft>()
  readonly entries: Entry[] = []
  private readonly activeContextIds: ReadonlySet<string>

  constructor(activeContextIds: ReadonlySet<string>) {
    this.activeContextIds = activeContextIds
  }

  private validateContext(contextId: string | null): void {
    if (contextId !== null && !this.activeContextIds.has(contextId)) {
      throw new DomainError(DomainErrorCode.ContextNotFound)
    }
  }

  async getDefaultContextId(): Promise<string | null> {
    return this.defaultContextId
  }

  async getDraft(surface: CaptureSurface): Promise<CaptureDraft | null> {
    return structuredClone(this.drafts.get(surface) ?? null)
  }

  async saveDraft(input: SaveCaptureDraftInput): Promise<CaptureDraft> {
    this.validateContext(input.contextId)
    const draft = { ...input, updatedAt: new Date() }
    this.drafts.set(input.surface, draft)
    return structuredClone(draft)
  }

  async discardDraft(surface: CaptureSurface): Promise<void> {
    this.drafts.delete(surface)
  }

  async submitEntry(input: SubmitEntryInput): Promise<Entry> {
    const content = normalizeEntryContent(input.content)
    this.validateContext(input.contextId)
    const now = new Date()
    const submitted: Entry = {
      id: String(this.entries.length + 1), content, contextId: input.contextId,
      createdAt: now, updatedAt: now, deletedAt: null,
    }
    this.entries.push(submitted)
    this.defaultContextId = input.contextId
    this.drafts.delete(input.surface)
    return structuredClone(submitted)
  }
}

// Consumer depends on the public contract and uses defaults only for new drafts.
async function loadComposer(repository: AppStateRepository, surface: CaptureSurface) {
  return await repository.getDraft(surface) ?? {
    surface, content: '', contextId: await repository.getDefaultContextId(),
  }
}

describe('app state repository consumer examples', () => {
  test('uses defaults for new drafts and preserves existing draft selections', async () => {
    const repository: AppStateRepository = new InMemoryAppStateRepository(new Set(['devlog']))
    expect(await repository.getDefaultContextId()).toBeNull()
    await repository.saveDraft({ surface: 'main', content: ' unfinished ', contextId: null })
    await repository.saveDraft({ surface: 'quick-capture', content: 'old', contextId: 'devlog' })
    expect(await repository.getDefaultContextId()).toBeNull()

    const submitted = await repository.submitEntry({
      surface: 'quick-capture', content: ' latest ', contextId: 'devlog',
    })
    expect(submitted.content).toBe('latest')
    expect(await repository.getDraft('quick-capture')).toBeNull()
    expect(await loadComposer(repository, 'quick-capture')).toEqual({
      surface: 'quick-capture', content: '', contextId: 'devlog',
    })
    expect(await loadComposer(repository, 'main')).toMatchObject({
      content: ' unfinished ', contextId: null,
    })
    await repository.submitEntry({ surface: 'main', content: 'done', contextId: null })
    expect(await repository.getDefaultContextId()).toBeNull()
  })

  test.each([
    { content: '   ', contextId: 'devlog', code: DomainErrorCode.EmptyEntryContent },
    { content: 'valid', contextId: 'missing', code: DomainErrorCode.ContextNotFound },
  ])('failed submission preserves entries, default, and draft: $code', async (input) => {
    const fake = new InMemoryAppStateRepository(new Set(['devlog']))
    const repository: AppStateRepository = fake
    await repository.submitEntry({ surface: 'main', content: 'saved', contextId: 'devlog' })
    const draft = await repository.saveDraft({
      surface: 'main', content: 'keep me', contextId: null,
    })
    await expect(repository.submitEntry({
      surface: 'main', content: input.content, contextId: input.contextId,
    })).rejects.toMatchObject({ code: input.code })
    expect(fake.entries).toHaveLength(1)
    expect(await repository.getDefaultContextId()).toBe('devlog')
    expect(await repository.getDraft('main')).toEqual(draft)
  })

  test('discard affects only its surface and leaves the default unchanged', async () => {
    const repository: AppStateRepository = new InMemoryAppStateRepository(new Set(['devlog']))
    await repository.submitEntry({ surface: 'main', content: 'saved', contextId: 'devlog' })
    await repository.saveDraft({ surface: 'main', content: '', contextId: null })
    await repository.saveDraft({ surface: 'quick-capture', content: 'keep', contextId: null })
    await repository.discardDraft('main')
    await repository.discardDraft('main')
    expect(await repository.getDraft('main')).toBeNull()
    expect((await repository.getDraft('quick-capture'))?.content).toBe('keep')
    expect(await repository.getDefaultContextId()).toBe('devlog')
  })

  test('returned draft dates cannot mutate stored drafts', async () => {
    const repository: AppStateRepository = new InMemoryAppStateRepository(new Set())
    const saved = await repository.saveDraft({ surface: 'main', content: '', contextId: null })
    const timestamp = saved.updatedAt.getTime()
    saved.updatedAt.setTime(0)
    const retrieved = await repository.getDraft('main')
    expect(retrieved?.updatedAt.getTime()).toBe(timestamp)
    retrieved?.updatedAt.setTime(0)
    expect((await repository.getDraft('main'))?.updatedAt.getTime()).toBe(timestamp)
  })
})

class InMemoryEntryRepository implements EntryRepository {
  private readonly entries: Map<string, Entry>
  private readonly contexts: Map<string, Context>

  constructor(entries: Entry[], contexts: Context[]) {
    this.entries = new Map(entries.map((entry) => [entry.id, structuredClone(entry)]))
    this.contexts = new Map(contexts.map((context) => [context.id, structuredClone(context)]))
  }

  async findById(id: string): Promise<Entry | null> {
    const entry = this.entries.get(id)
    return entry && entry.deletedAt === null ? structuredClone(entry) : null
  }

  async listBetween(range: DateRange): Promise<Entry[]> {
    return structuredClone([...this.entries.values()]
      .filter((entry) => entry.deletedAt === null &&
        entry.createdAt >= range.from && entry.createdAt < range.to)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime() ||
        (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)))
  }

  async listByContext(input: ListEntriesByContextInput): Promise<Entry[]> {
    const ids = new Set([input.contextId])
    if (input.includeDescendants) {
      let previousSize = 0
      while (previousSize !== ids.size) {
        previousSize = ids.size
        for (const context of this.contexts.values()) {
          if (context.parentId !== null && ids.has(context.parentId)) ids.add(context.id)
        }
      }
    }
    return structuredClone([...this.entries.values()].filter((entry) =>
      entry.deletedAt === null && entry.contextId !== null && ids.has(entry.contextId)))
  }

  async update(input: UpdateEntryInput): Promise<Entry> {
    const entry = await this.findById(input.id)
    if (!entry) throw new DomainError(DomainErrorCode.EntryNotFound)
    const content = normalizeEntryContent(input.content)
    if (input.contextId !== null) {
      const context = this.contexts.get(input.contextId)
      if (!context) throw new DomainError(DomainErrorCode.ContextNotFound)
      if (context.deletedAt !== null && entry.contextId !== input.contextId) {
        throw new DomainError(DomainErrorCode.ContextArchived)
      }
    }
    const updated = { ...entry, content, contextId: input.contextId, updatedAt: new Date() }
    this.entries.set(entry.id, updated)
    return structuredClone(updated)
  }
}

function entry(id: string, time: number, contextId: string | null = null): Entry {
  return {
    id, content: id, contextId,
    createdAt: new Date(time), updatedAt: new Date(time), deletedAt: null,
  }
}

function context(id: string, parentId: string | null, archived = false): Context {
  return {
    id, name: id, parentId, createdAt: new Date(0), updatedAt: new Date(0),
    deletedAt: archived ? new Date(1) : null,
  }
}

describe('entry repository consumer examples', () => {
  test('queries a half-open period with stable order and no deleted entries', async () => {
    const repository: EntryRepository = new InMemoryEntryRepository([
      entry('end', 20), entry('b', 10), entry('before', 9), entry('a', 10),
      { ...entry('deleted', 15), deletedAt: new Date(16) },
    ], [])

    const result = await repository.listBetween({ from: new Date(10), to: new Date(20) })
    expect(result.map((item) => item.id)).toEqual(['a', 'b'])
    expect(await repository.findById('deleted')).toBeNull()
    expect(await repository.findById('missing')).toBeNull()
  })

  test('queries descendants including archived context history', async () => {
    const repository: EntryRepository = new InMemoryEntryRepository([
      entry('root-entry', 1, 'root'), entry('child-entry', 2, 'child'),
      entry('grandchild-entry', 3, 'grandchild'), entry('unassigned', 4),
    ], [context('grandchild', 'child', true), context('child', 'root', true), context('root', null)])

    expect((await repository.listByContext({ contextId: 'root', includeDescendants: false }))
      .map((item) => item.id)).toEqual(['root-entry'])
    expect((await repository.listByContext({ contextId: 'root', includeDescendants: true }))
      .map((item) => item.id).sort()).toEqual(['child-entry', 'grandchild-entry', 'root-entry'])
  })

  test('retains an archived context but rejects switching to another archived context', async () => {
    const repository: EntryRepository = new InMemoryEntryRepository([
      entry('entry', 1, 'original'),
    ], [context('original', null, true), context('other', null, true)])

    const updated = await repository.update({ id: 'entry', content: ' edited ', contextId: 'original' })
    expect(updated.content).toBe('edited')
    expect(updated.createdAt).toEqual(new Date(1))
    await expect(repository.update({ id: 'entry', content: 'rejected', contextId: 'other' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextArchived })
    expect((await repository.findById('entry'))?.content).toBe('edited')
    expect((await repository.update({ id: 'entry', content: 'cleared', contextId: null }))
      .contextId).toBeNull()
  })
})
