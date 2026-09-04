export const DomainErrorCode = {
  EmptyEntryContent: 'EMPTY_ENTRY_CONTENT',
  EntryNotFound: 'ENTRY_NOT_FOUND',
  ContextNotFound: 'CONTEXT_NOT_FOUND',
  ContextArchived: 'CONTEXT_ARCHIVED',
  ContextNameInvalid: 'CONTEXT_NAME_INVALID',
  ContextNameConflict: 'CONTEXT_NAME_CONFLICT',
  DraftSaveFailed: 'DRAFT_SAVE_FAILED',
  StorageUnavailable: 'STORAGE_UNAVAILABLE',
} as const

export type DomainErrorCode =
  (typeof DomainErrorCode)[keyof typeof DomainErrorCode]

const domainErrorMessages: Record<DomainErrorCode, string> = {
  EMPTY_ENTRY_CONTENT: 'Entry content is required.',
  ENTRY_NOT_FOUND: 'Entry was not found.',
  CONTEXT_NOT_FOUND: 'Context was not found.',
  CONTEXT_ARCHIVED: 'Context is archived.',
  CONTEXT_NAME_INVALID: 'Context name is invalid.',
  CONTEXT_NAME_CONFLICT: 'Context name already exists.',
  DRAFT_SAVE_FAILED: 'Draft could not be saved.',
  STORAGE_UNAVAILABLE: 'Storage is unavailable.',
}

export class DomainError extends Error {
  readonly code: DomainErrorCode

  constructor(code: DomainErrorCode) {
    super(domainErrorMessages[code])
    this.name = 'DomainError'
    this.code = code
  }
}
