import { DomainError, DomainErrorCode } from './errors'

export function normalizeContextName(name: string): string {
  const normalizedName = name.trim()

  if (normalizedName.length === 0 || normalizedName.includes('/')) {
    throw new DomainError(DomainErrorCode.ContextNameInvalid)
  }

  return normalizedName
}
