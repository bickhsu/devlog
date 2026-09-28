import { createContext, type ReactNode } from "react"

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

// This Context belongs with the dependency type and its composition provider.
// eslint-disable-next-line react-refresh/only-export-components
export const DesktopDependenciesContext =
  createContext<DesktopDependencies | null>(null)

export function DesktopComposition({
  dependencies,
  children,
}: {
  readonly dependencies: DesktopDependencies
  readonly children: ReactNode
}) {
  return (
    <DesktopDependenciesContext.Provider value={dependencies}>
      {children}
    </DesktopDependenciesContext.Provider>
  )
}
