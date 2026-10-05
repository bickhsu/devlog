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
  CreateContextPathInput,
  DateRange,
  EntryRepository,
  ListEntriesByContextInput,
  RenameContextInput,
  SaveCaptureDraftInput,
  SubmitEntryInput,
  UpdateEntryInput,
} from './repositories/contracts'
export {
  createCaptureSession,
  DEFAULT_AUTOSAVE_DELAY_MS,
} from './use-cases/capture'
export type {
  AutosaveTimer,
  CaptureComposerState,
  CaptureSession,
  CaptureSessionOptions,
} from './use-cases/capture'
export {
  archiveContext,
  buildContextTree,
  CONTEXT_PATH_SEPARATOR,
  createContext,
  createContextPath,
  findContextPath,
  formatContextPath,
  listActiveContextPaths,
  listActiveContextTree,
  listContextHistory,
  parseContextPath,
  renameContext,
  resolveContextPath,
} from './use-cases/contexts'
export type { ContextPathOption, ContextTreeNode } from './use-cases/contexts'
