import type {
  CaptureDraft,
  CaptureSurface,
  Context,
  Entry,
} from '../domain/models'

export type DateRange = {
  /** Inclusive lower bound on createdAt. */
  readonly from: Date
  /** Exclusive upper bound on createdAt. */
  readonly to: Date
}

export type ListEntriesByContextInput = {
  readonly contextId: string
  readonly includeDescendants: boolean
}

export type UpdateEntryInput = {
  readonly id: string
  /** Content normalized by the caller with normalizeEntryContent. */
  readonly content: string
  /** Keep the original archived context, or select an active context or null. */
  readonly contextId: string | null
}

/** Reads exclude soft-deleted entries; writes reject missing/deleted IDs. */
export interface EntryRepository {
  findById(id: string): Promise<Entry | null>
  update(input: UpdateEntryInput): Promise<Entry>
  /** Excludes soft-deleted entries; ordered by createdAt ascending, then id. */
  listBetween(range: DateRange): Promise<Entry[]>
  /** Includes archived context history. Consumers own grouping and sorting. */
  listByContext(input: ListEntriesByContextInput): Promise<Entry[]>
}

export type SaveCaptureDraftInput = {
  readonly surface: CaptureSurface
  /** Preserve raw content, including empty text and whitespace. */
  readonly content: string
  readonly contextId: string | null
}

export type SubmitEntryInput = {
  readonly surface: CaptureSurface
  /** Content normalized by the caller with normalizeEntryContent. */
  readonly content: string
  readonly contextId: string | null
}

export interface AppStateRepository {
  /** Default for new drafts; initially null. Existing drafts keep their own context. */
  getDefaultContextId(): Promise<string | null>
  getDraft(surface: CaptureSurface): Promise<CaptureDraft | null>
  saveDraft(input: SaveCaptureDraftInput): Promise<CaptureDraft>
  /** Idempotent; affects only the specified surface. */
  discardDraft(surface: CaptureSurface): Promise<void>
  /**
   * Validate the latest payload, then atomically create an entry,
   * set current context (including null), and clear
   * only this surface's draft. Failure must leave all three unchanged.
   * Serialize save/discard/submit in invocation order per surface so an earlier
   * pending save cannot recreate a draft after a successful submit.
   */
  submitEntry(input: SubmitEntryInput): Promise<Entry>
}

export type CreateContextInput = {
  readonly parentId: string | null
  /** Name normalized by the caller with normalizeContextName. */
  readonly name: string
}

export type RenameContextInput = {
  readonly id: string
  /** Name normalized by the caller with normalizeContextName. */
  readonly name: string
}

export type ContextQuery = {
  /** Defaults to false; true includes archived contexts for history/path lookup. */
  readonly includeArchived?: boolean
}

export interface ContextRepository {
  /** Includes archived contexts so historical entry paths remain resolvable. */
  findById(id: string): Promise<Context | null>
  /** Flat hierarchy via parentId; consumers own display ordering. */
  list(query?: ContextQuery): Promise<Context[]>
  create(input: CreateContextInput): Promise<Context>
  rename(input: RenameContextInput): Promise<Context>
  /**
   * Atomically archive the subtree and clear matching current/draft context
   * references, preserving draft content and historical entry relationships.
   * Already archived roots are a no-op; missing roots reject with ContextNotFound.
   */
  archive(id: string): Promise<void>
}
