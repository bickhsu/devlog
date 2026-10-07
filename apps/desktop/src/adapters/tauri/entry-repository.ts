import type {
  DateRange,
  Entry,
  EntryRepository,
  ListEntriesByContextInput,
  UpdateEntryInput,
} from "@devlog/core"

import { entryFromDto, type EntryDto } from "@/adapters/tauri/dto"
import { invokeTauri } from "@/adapters/tauri/invoke"

/**
 * EntryRepository backed by the native entry commands. Content validation
 * and the archived-context rule for edits are enforced again in Rust.
 */
export class TauriEntryRepository implements EntryRepository {
  async findById(id: string): Promise<Entry | null> {
    const dto = await invokeTauri<EntryDto | null, { id: string }>("get_entry", { id })
    return dto === null ? null : entryFromDto(dto)
  }

  async update(input: UpdateEntryInput): Promise<Entry> {
    const dto = await invokeTauri<EntryDto, { input: UpdateEntryInput }>("update_entry", {
      input,
    })
    return entryFromDto(dto)
  }

  async listBetween(range: DateRange): Promise<Entry[]> {
    const dtos = await invokeTauri<EntryDto[], { from: number; to: number }>(
      "list_entries_between",
      { from: range.from.getTime(), to: range.to.getTime() },
    )
    return dtos.map(entryFromDto)
  }

  async listByContext(input: ListEntriesByContextInput): Promise<Entry[]> {
    const dtos = await invokeTauri<
      EntryDto[],
      { contextId: string; includeDescendants: boolean }
    >("list_entries_by_context", {
      contextId: input.contextId,
      includeDescendants: input.includeDescendants,
    })
    return dtos.map(entryFromDto)
  }
}
