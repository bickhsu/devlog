import { describe, expect, test } from 'bun:test'

import { normalizeEntryContent } from './content'
import { DomainError, DomainErrorCode } from './errors'

describe('normalizeEntryContent', () => {
  test('removes surrounding whitespace and blank lines', () => {
    expect(normalizeEntryContent('\n  Built the capture flow.  \n')).toBe(
      'Built the capture flow.',
    )
  })

  test('preserves internal line breaks and indentation', () => {
    expect(normalizeEntryContent('First line\n  Second line\n\nThird line')).toBe(
      'First line\n  Second line\n\nThird line',
    )
  })

  test.each(['', '   ', '\n\t\n'])('rejects empty content', (content) => {
    expect(() => normalizeEntryContent(content)).toThrow(DomainError)

    try {
      normalizeEntryContent(content)
    } catch (error) {
      expect(error).toHaveProperty('code', DomainErrorCode.EmptyEntryContent)
    }
  })
})
