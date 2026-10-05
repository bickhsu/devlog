import type { AppState, CaptureDraft, Context, Entry } from "@devlog/core"

/** Rust commands send timestamps as Unix epoch milliseconds, the storage format. */
export type EntryDto = Omit<Entry, "createdAt" | "updatedAt" | "deletedAt"> & {
  readonly createdAt: number
  readonly updatedAt: number
  readonly deletedAt: number | null
}

export type ContextDto = Omit<Context, "createdAt" | "updatedAt" | "archivedAt" | "deletedAt"> & {
  readonly createdAt: number
  readonly updatedAt: number
  readonly archivedAt: number | null
  readonly deletedAt: number | null
}

export type CaptureDraftDto = Omit<CaptureDraft, "updatedAt"> & {
  readonly updatedAt: number
}

export type AppStateDto = Omit<AppState, "updatedAt"> & {
  readonly updatedAt: number
}

export function entryFromDto(dto: EntryDto): Entry {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    deletedAt: dto.deletedAt === null ? null : new Date(dto.deletedAt),
  }
}

export function contextFromDto(dto: ContextDto): Context {
  return {
    ...dto,
    createdAt: new Date(dto.createdAt),
    updatedAt: new Date(dto.updatedAt),
    archivedAt: dto.archivedAt === null ? null : new Date(dto.archivedAt),
    deletedAt: dto.deletedAt === null ? null : new Date(dto.deletedAt),
  }
}

export function captureDraftFromDto(dto: CaptureDraftDto): CaptureDraft {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

export function appStateFromDto(dto: AppStateDto): AppState {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}
