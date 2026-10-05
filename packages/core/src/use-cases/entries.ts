import { normalizeEntryContent } from '../domain/content'
import type { Entry } from '../domain/models'
import type {
  DateRange,
  EntryRepository,
  UpdateEntryInput,
} from '../repositories/contracts'

/**
 * Edits content and context; `id`, `createdAt`, and timeline position never
 * change. Keeping an archived context is allowed, but the repository rejects
 * switching to a different archived one.
 */
export async function updateEntry(
  entries: EntryRepository,
  input: UpdateEntryInput,
): Promise<Entry> {
  return entries.update({
    id: input.id,
    content: normalizeEntryContent(input.content),
    contextId: input.contextId,
  })
}

/** Entries created on the local calendar day containing `day`, oldest first. */
export async function listEntriesOnDay(
  entries: EntryRepository,
  day: Date,
): Promise<Entry[]> {
  return entries.listBetween(localDayRange(day))
}

/** Local midnight that starts the calendar day containing `date`. */
export function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

/**
 * Moves by calendar days, not 24-hour blocks, so a daylight-saving
 * transition never lands on the wrong day. Returns local midnight.
 */
export function addLocalDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days)
}

/**
 * `[local 00:00, next local 00:00)` for the day containing `date`. A DST day
 * is 23 or 25 hours long, which the calendar math above accounts for.
 */
export function localDayRange(date: Date): DateRange {
  return { from: startOfLocalDay(date), to: addLocalDays(date, 1) }
}

export function isSameLocalDay(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
}

/** `YYYY-MM-DD` in local time, for grouping and headings. */
export function formatLocalDate(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${date.getFullYear()}-${month}-${day}`
}

/**
 * Parses a local `YYYY-MM-DD` (e.g. from a date input) to local midnight,
 * or null when it is not a real calendar date.
 */
export function parseLocalDate(value: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null
  const [year, month, day] = match.slice(1).map(Number)
  const date = new Date(year, month - 1, day)
  return formatLocalDate(date) === value ? date : null
}

export type LocalDayGroup = {
  /** `YYYY-MM-DD` in local time. */
  readonly date: string
  readonly entries: readonly Entry[]
}

/**
 * Groups entries by local creation date. Days and the entries within them
 * are ordered by `(createdAt, id)` regardless of input order.
 */
export function groupEntriesByLocalDay(entries: readonly Entry[]): LocalDayGroup[] {
  const groups: { date: string, entries: Entry[] }[] = []
  for (const entry of [...entries].sort(compareEntries)) {
    const date = formatLocalDate(entry.createdAt)
    const last = groups.at(-1)
    if (last?.date === date) last.entries.push(entry)
    else groups.push({ date, entries: [entry] })
  }
  return groups
}

/** Timeline order: `createdAt`, then `id` for entries in the same millisecond. */
export function compareEntries(a: Entry, b: Entry): number {
  return a.createdAt.getTime() - b.createdAt.getTime() ||
    (a.id < b.id ? -1 : a.id > b.id ? 1 : 0)
}
