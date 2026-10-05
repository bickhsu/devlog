import { normalizeContextName } from '../domain/context-name'
import { DomainError, DomainErrorCode } from '../domain/errors'
import type { Context, Entry } from '../domain/models'
import type {
  ContextRepository,
  CreateContextInput,
  EntryRepository,
  RenameContextInput,
} from '../repositories/contracts'

/** Names cannot contain '/', so paths like `/Work/DevLog` are unambiguous. */
export const CONTEXT_PATH_SEPARATOR = '/'

export type ContextPathOption = {
  readonly context: Context
  /** Ancestors first, ending with this context. */
  readonly path: readonly Context[]
}

export type ContextTreeNode = ContextPathOption & {
  readonly children: readonly ContextTreeNode[]
}

/** Sibling uniqueness is enforced by the repository, which sees concurrent writes. */
export async function createContext(
  contexts: ContextRepository,
  input: CreateContextInput,
): Promise<Context> {
  return contexts.create({
    parentId: input.parentId,
    name: normalizeContextName(input.name),
  })
}

export async function renameContext(
  contexts: ContextRepository,
  input: RenameContextInput,
): Promise<Context> {
  return contexts.rename({ id: input.id, name: normalizeContextName(input.name) })
}

/** Archives the whole subtree; entries keep their context for history. */
export async function archiveContext(
  contexts: ContextRepository,
  id: string,
): Promise<void> {
  await contexts.archive(id)
}

/** Active contexts for pickers, siblings ordered by name. */
export async function listActiveContextTree(
  contexts: ContextRepository,
): Promise<ContextTreeNode[]> {
  return buildContextTree(await contexts.list())
}

/** Active contexts flattened in tree order, for path pickers and completion. */
export async function listActiveContextPaths(
  contexts: ContextRepository,
): Promise<ContextPathOption[]> {
  const options: ContextPathOption[] = []
  const visit = (nodes: readonly ContextTreeNode[]) => {
    for (const { context, path, children } of nodes) {
      options.push({ context, path })
      visit(children)
    }
  }
  visit(await listActiveContextTree(contexts))
  return options
}

/** Resolves archived contexts too, so historical entries keep their path. */
export async function findContextPath(
  contexts: ContextRepository,
  id: string,
): Promise<Context[]> {
  return resolveContextPath(await contexts.list({ includeArchived: true }), id)
}

/** Entries of a context and its descendants, archived or not, oldest first. */
export async function listContextHistory(
  repositories: {
    readonly contexts: ContextRepository
    readonly entries: EntryRepository
  },
  contextId: string,
): Promise<Entry[]> {
  if (!(await repositories.contexts.findById(contextId))) {
    throw new DomainError(DomainErrorCode.ContextNotFound)
  }
  const entries = await repositories.entries.listByContext({
    contextId,
    includeDescendants: true,
  })
  return entries.sort(compareByCreatedAt)
}

/**
 * Archiving cascades and archived parents cannot gain children, so an active
 * context's ancestors are active. A parent missing from the list is treated as
 * absent and the context becomes a root rather than disappearing.
 */
export function buildContextTree(contexts: readonly Context[]): ContextTreeNode[] {
  const ids = new Set(contexts.map((context) => context.id))
  const childrenByParent = new Map<string | null, Context[]>()
  for (const context of contexts) {
    const parentId =
      context.parentId !== null && ids.has(context.parentId) ? context.parentId : null
    const siblings = childrenByParent.get(parentId) ?? []
    siblings.push(context)
    childrenByParent.set(parentId, siblings)
  }

  const build = (parentId: string | null, ancestors: readonly Context[]): ContextTreeNode[] =>
    (childrenByParent.get(parentId) ?? []).sort(compareByName).map((context) => {
      const path = [...ancestors, context]
      return { context, path, children: build(context.id, path) }
    })

  return build(null, [])
}

export function resolveContextPath(contexts: readonly Context[], id: string): Context[] {
  const byId = new Map(contexts.map((context) => [context.id, context]))
  const path: Context[] = []
  const visited = new Set<string>()
  let current = byId.get(id)

  if (!current) throw new DomainError(DomainErrorCode.ContextNotFound)

  while (current && !visited.has(current.id)) {
    visited.add(current.id)
    path.unshift(current)
    current = current.parentId === null ? undefined : byId.get(current.parentId)
  }

  return path
}

/** `/Work/DevLog`; an empty path (no context) is `/`. */
export function formatContextPath(path: readonly Context[]): string {
  return CONTEXT_PATH_SEPARATOR +
    path.map((context) => context.name).join(CONTEXT_PATH_SEPARATOR)
}

/**
 * Parses a typed path into normalized segment names. It must start with `/`;
 * one trailing `/` is allowed, and `/` alone is no context. Every segment
 * follows the context name rules.
 */
export function parseContextPath(path: string): string[] {
  if (!path.startsWith(CONTEXT_PATH_SEPARATOR)) {
    throw new DomainError(DomainErrorCode.ContextNameInvalid)
  }
  if (path === CONTEXT_PATH_SEPARATOR) return []
  const body = path.endsWith(CONTEXT_PATH_SEPARATOR) ? path.slice(1, -1) : path.slice(1)
  return body.split(CONTEXT_PATH_SEPARATOR).map(normalizeContextName)
}

function compareByName(a: Context, b: Context): number {
  return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }) ||
    compareIds(a.id, b.id)
}

function compareByCreatedAt(a: Entry, b: Entry): number {
  return a.createdAt.getTime() - b.createdAt.getTime() || compareIds(a.id, b.id)
}

function compareIds(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
