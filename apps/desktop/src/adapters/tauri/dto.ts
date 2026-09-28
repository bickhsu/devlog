import type { AppState, CaptureDraft, Context, Entry } from "@devlog/core"

/** Tauri serializes Rust timestamps as RFC 3339 strings across the IPC boundary. */
export type EntryDto = Omit<Entry, "createdAt" | "updatedAt" | "deletedAt"> & {
  readonly createdAt: string
  readonly updatedAt: string
  readonly deletedAt: string | null
}

export type ContextDto = Omit<Context, "createdAt" | "updatedAt" | "deletedAt"> & {
  readonly createdAt: string
  readonly updatedAt: string
  readonly deletedAt: string | null
}

export type CaptureDraftDto = Omit<CaptureDraft, "updatedAt"> & {
  readonly updatedAt: string
}

export type AppStateDto = Omit<AppState, "updatedAt"> & {
  readonly updatedAt: string
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
    deletedAt: dto.deletedAt === null ? null : new Date(dto.deletedAt),
  }
}

export function captureDraftFromDto(dto: CaptureDraftDto): CaptureDraft {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}

export function appStateFromDto(dto: AppStateDto): AppState {
  return { ...dto, updatedAt: new Date(dto.updatedAt) }
}
