import { describe, expect, test } from 'bun:test'

import { normalizeContextName } from './context-name'
import { DomainError, DomainErrorCode } from './errors'

describe('normalizeContextName', () => {
  test('removes surrounding whitespace', () => {
    expect(normalizeContextName('  DevLog  ')).toBe('DevLog')
  })

  test('accepts Unicode names', () => {
    expect(normalizeContextName('開發日誌')).toBe('開發日誌')
  })

  test.each(['', '   ', '/', 'Personal / DevLog'])(
    'rejects invalid names',
    (name) => {
      expect(() => normalizeContextName(name)).toThrow(DomainError)

      try {
        normalizeContextName(name)
      } catch (error) {
        expect(error).toHaveProperty('code', DomainErrorCode.ContextNameInvalid)
      }
    },
  )
})
