export type {
  AppState,
  CaptureDraft,
  CaptureSurface,
  Context,
  Entry,
} from './domain/models'
export { DomainError, DomainErrorCode } from './domain/errors'
export { normalizeEntryContent } from './domain/content'
export { normalizeContextName } from './domain/context-name'
export type {
  AppStateRepository,
  ContextQuery,
  ContextRepository,
  CreateContextInput,
  DateRange,
  EntryRepository,
  ListEntriesByContextInput,
  RenameContextInput,
  SaveCaptureDraftInput,
  SubmitEntryInput,
  UpdateEntryInput,
} from './repositories/contracts'
export {
  archiveContext,
  buildContextTree,
  CONTEXT_PATH_SEPARATOR,
  createContext,
  findContextPath,
  formatContextPath,
  listActiveContextTree,
  listContextHistory,
  renameContext,
  resolveContextPath,
} from './use-cases/contexts'
export type { ContextTreeNode } from './use-cases/contexts'
