import { afterEach, beforeEach, describe, expect, test } from 'bun:test'

import { DomainError, DomainErrorCode } from '../domain/errors'
import type { Entry } from '../domain/models'
import type {
  DateRange,
  EntryRepository,
  UpdateEntryInput,
} from '../repositories/contracts'
import {
  addLocalDays,
  formatLocalDate,
  groupEntriesByLocalDay,
  isSameLocalDay,
  listEntriesOnDay,
  localDayRange,
  parseLocalDate,
  startOfLocalDay,
  updateEntry,
} from './entries'

let originalTimeZone: string | undefined

beforeEach(() => {
  originalTimeZone = process.env.TZ
})

afterEach(() => {
  process.env.TZ = originalTimeZone
})

function entry(id: string, createdAt: Date): Entry {
  return {
    id,
    content: id,
    contextId: null,
    createdAt,
    updatedAt: createdAt,
    deletedAt: null,
  }
}

class RecordingEntryRepository implements EntryRepository {
  updates: UpdateEntryInput[] = []
  ranges: DateRange[] = []

  async findById(): Promise<Entry | null> {
    return null
  }

  async update(input: UpdateEntryInput): Promise<Entry> {
    this.updates.push(input)
    return { ...entry(input.id, new Date(0)), ...input }
  }

  async listBetween(range: DateRange): Promise<Entry[]> {
    this.ranges.push(range)
    return []
  }

  async listByContext(): Promise<Entry[]> {
    return []
  }
}

describe('updateEntry', () => {
  test('normalizes content before it reaches the repository', async () => {
    const repository = new RecordingEntryRepository()

    await updateEntry(repository, { id: 'a', content: '\n  Fixed typo.  \n', contextId: 'ctx' })

    expect(repository.updates).toEqual([{ id: 'a', content: 'Fixed typo.', contextId: 'ctx' }])
  })

  test('rejects empty content without touching storage', async () => {
    const repository = new RecordingEntryRepository()

    const result = updateEntry(repository, { id: 'a', content: ' \n ', contextId: null })

    await expect(result).rejects.toBeInstanceOf(DomainError)
    await expect(result).rejects.toHaveProperty('code', DomainErrorCode.EmptyEntryContent)
    expect(repository.updates).toEqual([])
  })
})

describe('local day ranges', () => {
  test('span local midnight to the next local midnight', () => {
    process.env.TZ = 'Asia/Taipei'

    const range = localDayRange(new Date('2026-07-11T15:59:59.999Z'))

    expect(range.from.toISOString()).toBe('2026-07-10T16:00:00.000Z')
    expect(range.to.toISOString()).toBe('2026-07-11T16:00:00.000Z')
  })

  test('follow the calendar across a daylight-saving start (23-hour day)', () => {
    process.env.TZ = 'America/New_York'

    const range = localDayRange(new Date(2026, 2, 8, 12))

    expect(range.from.toISOString()).toBe('2026-03-08T05:00:00.000Z')
    expect(range.to.toISOString()).toBe('2026-03-09T04:00:00.000Z')
    expect(range.to.getTime() - range.from.getTime()).toBe(23 * 60 * 60 * 1000)
  })

  test('follow the calendar across a daylight-saving end (25-hour day)', () => {
    process.env.TZ = 'America/New_York'

    const range = localDayRange(new Date(2026, 10, 1, 12))

    expect(range.to.getTime() - range.from.getTime()).toBe(25 * 60 * 60 * 1000)
    expect(addLocalDays(range.from, 1).getTime()).toBe(range.to.getTime())
  })

  test('step by calendar days across month and year boundaries', () => {
    process.env.TZ = 'Asia/Taipei'

    expect(formatLocalDate(addLocalDays(new Date(2026, 11, 31, 23), 1))).toBe('2027-01-01')
    expect(formatLocalDate(addLocalDays(new Date(2026, 2, 1), -1))).toBe('2026-02-28')
    expect(startOfLocalDay(new Date(2026, 6, 11, 9, 30)).getHours()).toBe(0)
    expect(isSameLocalDay(new Date(2026, 6, 11, 0), new Date(2026, 6, 11, 23, 59))).toBe(true)
    expect(isSameLocalDay(new Date(2026, 6, 11, 23, 59), new Date(2026, 6, 12))).toBe(false)
  })

  test('listEntriesOnDay queries the local day range', async () => {
    process.env.TZ = 'Asia/Taipei'
    const repository = new RecordingEntryRepository()

    await listEntriesOnDay(repository, new Date('2026-07-11T01:00:00Z'))

    expect(repository.ranges).toEqual([localDayRange(new Date(2026, 6, 11))])
  })
})

describe('parseLocalDate', () => {
  test('parses real calendar dates to local midnight', () => {
    process.env.TZ = 'Asia/Taipei'

    expect(parseLocalDate('2026-07-11')?.getTime()).toBe(new Date(2026, 6, 11).getTime())
  })

  test.each(['', '2026-7-11', '2026-02-30', '2026-13-01', 'today'])(
    'rejects %p',
    (value) => {
      expect(parseLocalDate(value)).toBeNull()
    },
  )
})

describe('groupEntriesByLocalDay', () => {
  test('groups by local date in chronological order', () => {
    process.env.TZ = 'Asia/Taipei'
    const lateNight = entry('b', new Date('2026-07-10T15:59:00Z'))
    const nextMorning = entry('c', new Date('2026-07-10T16:01:00Z'))
    const sameInstant = entry('a', new Date('2026-07-10T15:59:00Z'))

    const groups = groupEntriesByLocalDay([nextMorning, lateNight, sameInstant])

    expect(groups).toEqual([
      { date: '2026-07-10', entries: [sameInstant, lateNight] },
      { date: '2026-07-11', entries: [nextMorning] },
    ])
  })

  test('returns no groups for no entries', () => {
    expect(groupEntriesByLocalDay([])).toEqual([])
  })
})
