import type {
  Context,
  ContextQuery,
  ContextRepository,
  CreateContextInput,
  CreateContextPathInput,
  RenameContextInput,
} from "@devlog/core"

import { contextFromDto, type ContextDto } from "@/adapters/tauri/dto"
import { invokeTauri } from "@/adapters/tauri/invoke"

/**
 * ContextRepository backed by the native context commands. Validation,
 * sibling conflicts, atomic path creation, and the atomic subtree archive
 * happen in Rust.
 */
export class TauriContextRepository implements ContextRepository {
  async findById(id: string): Promise<Context | null> {
    const dto = await invokeTauri<ContextDto | null, { id: string }>("find_context", { id })
    return dto === null ? null : contextFromDto(dto)
  }

  async list(query?: ContextQuery): Promise<Context[]> {
    const dtos = await invokeTauri<ContextDto[], { includeArchived: boolean }>(
      "list_contexts",
      { includeArchived: query?.includeArchived ?? false },
    )
    return dtos.map(contextFromDto)
  }

  async create(input: CreateContextInput): Promise<Context> {
    const dto = await invokeTauri<ContextDto, { input: CreateContextInput }>(
      "create_context",
      { input },
    )
    return contextFromDto(dto)
  }

  async createPath(input: CreateContextPathInput): Promise<Context> {
    const dto = await invokeTauri<ContextDto, { input: CreateContextPathInput }>(
      "create_context_path",
      { input },
    )
    return contextFromDto(dto)
  }

  async rename(input: RenameContextInput): Promise<Context> {
    const dto = await invokeTauri<ContextDto, { input: RenameContextInput }>(
      "rename_context",
      { input },
    )
    return contextFromDto(dto)
  }

  async archive(id: string): Promise<void> {
    await invokeTauri<null, { id: string }>("archive_context", { id })
  }
}
