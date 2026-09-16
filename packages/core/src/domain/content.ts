import { DomainError, DomainErrorCode } from './errors'

export function normalizeEntryContent(content: string): string {
  const normalizedContent = content.trim()

  if (normalizedContent.length === 0) {
    throw new DomainError(DomainErrorCode.EmptyEntryContent)
  }

  return normalizedContent
}
