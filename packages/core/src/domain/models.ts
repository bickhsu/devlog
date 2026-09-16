export type Entry = {
  readonly id: string
  readonly content: string
  readonly contextId: string | null
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}

export type Context = {
  readonly id: string
  readonly parentId: string | null
  readonly name: string
  readonly createdAt: Date
  readonly updatedAt: Date
  readonly deletedAt: Date | null
}

export type CaptureSurface = 'main' | 'quick-capture'

export type CaptureDraft = {
  readonly surface: CaptureSurface
  readonly content: string
  readonly contextId: string | null
  readonly updatedAt: Date
}

export type AppState = {
  readonly currentContextId: string | null
  readonly updatedAt: Date
}
