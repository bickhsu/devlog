import type {
  AppStateRepository,
  ContextRepository,
  EntryRepository,
} from "@devlog/core"

/** Services available to desktop features. Composition owns their lifetime. */
export type DesktopDependencies = {
  readonly appState: AppStateRepository
  readonly contexts: ContextRepository
  readonly entries: EntryRepository
}
