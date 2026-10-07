import { createContext, type ReactNode } from "react"

import type {
  AppStateRepository,
  ContextRepository,
  EntryRepository,
} from "@devlog/core"

import type { InvalidationEvents } from "@/application/invalidation-events"

/** Repositories, plus the signal to reload them, available to desktop features. */
export type DesktopRepositories = {
  readonly appState: AppStateRepository
  readonly contexts: ContextRepository
  readonly entries: EntryRepository
  readonly invalidation: InvalidationEvents
}

// This Context belongs with the dependency type and its composition provider.
// eslint-disable-next-line react-refresh/only-export-components
export const DesktopRepositoriesContext =
  createContext<DesktopRepositories | null>(null)

export function DesktopRepositoriesProvider({
  repositories,
  children,
}: {
  readonly repositories: DesktopRepositories
  readonly children: ReactNode
}) {
  return (
    <DesktopRepositoriesContext.Provider value={repositories}>
      {children}
    </DesktopRepositoriesContext.Provider>
  )
}
