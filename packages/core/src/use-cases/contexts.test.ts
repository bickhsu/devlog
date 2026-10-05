import { describe, expect, test } from 'bun:test'

import {
  archiveContext,
  buildContextTree,
  createContext,
  DomainError,
  DomainErrorCode,
  findContextPath,
  formatContextPath,
  listActiveContextTree,
  listContextHistory,
  renameContext,
  type Context,
  type ContextQuery,
  type ContextRepository,
  type ContextTreeNode,
  type CreateContextInput,
  type Entry,
  type EntryRepository,
  type ListEntriesByContextInput,
  type RenameContextInput,
} from '../index'

/** Mirrors the repository contract; the SQLite adapter has its own tests. */
class InMemoryContextRepository implements ContextRepository {
  readonly contexts = new Map<string, Context>()
  readonly received: string[] = []
  private nextId = 1

  async findById(id: string): Promise<Context | null> {
    return structuredClone(this.contexts.get(id) ?? null)
  }

  async list(query?: ContextQuery): Promise<Context[]> {
    return structuredClone([...this.contexts.values()]
      .filter((context) => query?.includeArchived || context.archivedAt === null))
  }

  async create(input: CreateContextInput): Promise<Context> {
    this.received.push(input.name)
    if (input.parentId !== null) this.requireActive(input.parentId)
    this.ensureUniqueSibling(input.parentId, input.name)
    const now = new Date()
    const context: Context = {
      id: `ctx-${this.nextId++}`, parentId: input.parentId, name: input.name,
      createdAt: now, updatedAt: now, archivedAt: null, deletedAt: null,
    }
    this.contexts.set(context.id, context)
    return structuredClone(context)
  }

  async rename(input: RenameContextInput): Promise<Context> {
    this.received.push(input.name)
    const context = this.requireActive(input.id)
    this.ensureUniqueSibling(context.parentId, input.name, context.id)
    const renamed = { ...context, name: input.name, updatedAt: new Date() }
    this.contexts.set(renamed.id, renamed)
    return structuredClone(renamed)
  }

  async archive(id: string): Promise<void> {
    const root = this.contexts.get(id)
    if (!root) throw new DomainError(DomainErrorCode.ContextNotFound)
    if (root.archivedAt !== null) return
    const now = new Date()
    const subtree = new Set([id])
    for (const context of this.contexts.values()) {
      if (ancestorsOf(this.contexts, context).includes(id)) subtree.add(context.id)
    }
    for (const contextId of subtree) {
      const context = this.contexts.get(contextId)!
      if (context.archivedAt === null) {
        this.contexts.set(contextId, { ...context, archivedAt: now, updatedAt: now })
      }
    }
  }

  private requireActive(id: string): Context {
    const context = this.contexts.get(id)
    if (!context) throw new DomainError(DomainErrorCode.ContextNotFound)
    if (context.archivedAt !== null) throw new DomainError(DomainErrorCode.ContextArchived)
    return context
  }

  private ensureUniqueSibling(parentId: string | null, name: string, selfId?: string): void {
    const conflict = [...this.contexts.values()].some((context) =>
      context.id !== selfId && context.archivedAt === null &&
      context.parentId === parentId && context.name.toLowerCase() === name.toLowerCase())
    if (conflict) throw new DomainError(DomainErrorCode.ContextNameConflict)
  }
}

function ancestorsOf(contexts: Map<string, Context>, context: Context): string[] {
  const ancestors: string[] = []
  let parentId = context.parentId
  while (parentId !== null) {
    ancestors.push(parentId)
    parentId = contexts.get(parentId)?.parentId ?? null
  }
  return ancestors
}

class InMemoryEntryRepository implements EntryRepository {
  private readonly entries: Entry[]
  private readonly contexts: InMemoryContextRepository

  constructor(entries: Entry[], contexts: InMemoryContextRepository) {
    this.entries = entries
    this.contexts = contexts
  }

  async findById(id: string): Promise<Entry | null> {
    return this.entries.find((entry) => entry.id === id) ?? null
  }

  async update(): Promise<Entry> {
    throw new Error('Not used by context use cases.')
  }

  async listBetween(): Promise<Entry[]> {
    throw new Error('Not used by context use cases.')
  }

  async listByContext(input: ListEntriesByContextInput): Promise<Entry[]> {
    return this.entries.filter((entry) => {
      if (entry.contextId === null) return false
      if (entry.contextId === input.contextId) return true
      const context = this.contexts.contexts.get(entry.contextId)
      return input.includeDescendants && context !== undefined &&
        ancestorsOf(this.contexts.contexts, context).includes(input.contextId)
    })
  }
}

function entry(id: string, time: number, contextId: string | null): Entry {
  return {
    id, content: id, contextId,
    createdAt: new Date(time), updatedAt: new Date(time), deletedAt: null,
  }
}

function names(nodes: readonly ContextTreeNode[]): unknown[] {
  return nodes.map((node) =>
    node.children.length === 0 ? node.context.name : [node.context.name, names(node.children)])
}

describe('create and rename', () => {
  test('normalize names before reaching the repository', async () => {
    const repository = new InMemoryContextRepository()
    const root = await createContext(repository, { parentId: null, name: '  Work  ' })
    const child = await createContext(repository, { parentId: root.id, name: '\tDevLog\n' })
    const renamed = await renameContext(repository, { id: child.id, name: ' 開發日誌 ' })

    expect(repository.received).toEqual(['Work', 'DevLog', '開發日誌'])
    expect(child.parentId).toBe(root.id)
    expect(renamed).toMatchObject({ id: child.id, name: '開發日誌', createdAt: child.createdAt })
  })

  test.each(['', '   ', 'Work / DevLog'])('reject invalid name %p without calling the repository',
    async (name) => {
      const repository = new InMemoryContextRepository()
      const root = await createContext(repository, { parentId: null, name: 'Work' })
      repository.received.length = 0

      await expect(createContext(repository, { parentId: null, name }))
        .rejects.toMatchObject({ code: DomainErrorCode.ContextNameInvalid })
      await expect(renameContext(repository, { id: root.id, name }))
        .rejects.toMatchObject({ code: DomainErrorCode.ContextNameInvalid })
      expect(repository.received).toEqual([])
    })

  test('surface repository conflicts and missing or archived targets', async () => {
    const repository = new InMemoryContextRepository()
    const root = await createContext(repository, { parentId: null, name: 'Work' })
    await createContext(repository, { parentId: null, name: 'Home' })

    await expect(createContext(repository, { parentId: null, name: ' work ' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextNameConflict })
    await expect(renameContext(repository, { id: root.id, name: 'HOME' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextNameConflict })
    expect((await renameContext(repository, { id: root.id, name: 'WORK' })).name).toBe('WORK')
    await expect(createContext(repository, { parentId: 'missing', name: 'Child' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextNotFound })

    await archiveContext(repository, root.id)
    await expect(createContext(repository, { parentId: root.id, name: 'Child' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextArchived })
    await expect(renameContext(repository, { id: root.id, name: 'Old' }))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextArchived })
  })
})

describe('active context tree', () => {
  test('nests children, orders siblings by name, and carries full paths', async () => {
    const repository = new InMemoryContextRepository()
    const work = await createContext(repository, { parentId: null, name: 'work' })
    const home = await createContext(repository, { parentId: null, name: 'Home' })
    const devlog = await createContext(repository, { parentId: work.id, name: 'DevLog' })
    await createContext(repository, { parentId: work.id, name: 'api' })
    await createContext(repository, { parentId: devlog.id, name: 'Core' })
    await createContext(repository, { parentId: home.id, name: 'Garden' })

    const tree = await listActiveContextTree(repository)
    expect(names(tree)).toEqual([
      ['Home', ['Garden']],
      ['work', ['api', ['DevLog', ['Core']]]],
    ])
    const core = tree[1].children[1].children[0]
    expect(formatContextPath(core.path)).toBe('work / DevLog / Core')
  })

  test('excludes archived subtrees from the picker', async () => {
    const repository = new InMemoryContextRepository()
    const work = await createContext(repository, { parentId: null, name: 'Work' })
    const devlog = await createContext(repository, { parentId: work.id, name: 'DevLog' })
    await createContext(repository, { parentId: devlog.id, name: 'Core' })
    await createContext(repository, { parentId: work.id, name: 'Infra' })

    await archiveContext(repository, devlog.id)
    expect(names(await listActiveContextTree(repository))).toEqual([['Work', ['Infra']]])
  })

  test('keeps contexts whose parent is not in the list as roots', () => {
    const now = new Date(0)
    const orphan: Context = {
      id: 'orphan', parentId: 'gone', name: 'Orphan',
      createdAt: now, updatedAt: now, archivedAt: null, deletedAt: null,
    }
    expect(buildContextTree([orphan]).map((node) => node.path)).toEqual([[orphan]])
  })
})

describe('context path and history', () => {
  test('resolve the path of archived contexts for historical entries', async () => {
    const repository = new InMemoryContextRepository()
    const work = await createContext(repository, { parentId: null, name: 'Work' })
    const devlog = await createContext(repository, { parentId: work.id, name: 'DevLog' })
    await archiveContext(repository, work.id)

    expect(formatContextPath(await findContextPath(repository, devlog.id)))
      .toBe('Work / DevLog')
    await expect(findContextPath(repository, 'missing'))
      .rejects.toBeInstanceOf(DomainError)
  })

  test('list descendant entries oldest first, including archived contexts', async () => {
    const contexts = new InMemoryContextRepository()
    const work = await createContext(contexts, { parentId: null, name: 'Work' })
    const devlog = await createContext(contexts, { parentId: work.id, name: 'DevLog' })
    const core = await createContext(contexts, { parentId: devlog.id, name: 'Core' })
    const home = await createContext(contexts, { parentId: null, name: 'Home' })
    const entries = new InMemoryEntryRepository([
      entry('core-late', 30, core.id), entry('work', 10, work.id),
      entry('devlog-b', 20, devlog.id), entry('devlog-a', 20, devlog.id),
      entry('home', 5, home.id), entry('none', 1, null),
    ], contexts)
    await archiveContext(contexts, devlog.id)

    const history = await listContextHistory({ contexts, entries }, work.id)
    expect(history.map((item) => item.id))
      .toEqual(['work', 'devlog-a', 'devlog-b', 'core-late'])
    expect((await listContextHistory({ contexts, entries }, core.id)).map((item) => item.id))
      .toEqual(['core-late'])
    await expect(listContextHistory({ contexts, entries }, 'missing'))
      .rejects.toMatchObject({ code: DomainErrorCode.ContextNotFound })
  })
})
