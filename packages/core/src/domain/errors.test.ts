import { describe, expect, test } from 'bun:test'

import { DomainError, DomainErrorCode } from './errors'

describe('DomainError', () => {
  test('supports every domain error code', () => {
    for (const code of Object.values(DomainErrorCode)) {
      const error = new DomainError(code)

      expect(error).toBeInstanceOf(Error)
      expect(error.name).toBe('DomainError')
      expect(error.code).toBe(code)
      expect(error.message.length).toBeGreaterThan(0)
    }
  })

  test('does not accept implementation details', () => {
    const error = new DomainError(DomainErrorCode.StorageUnavailable)

    expect(error.message).toBe('Storage is unavailable.')
    expect(error.cause).toBeUndefined()
  })
})
