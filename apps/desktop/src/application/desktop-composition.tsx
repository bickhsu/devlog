import type { ReactNode } from "react"

import { DesktopDependenciesContext } from "@/application/dependencies-context"
import type { DesktopDependencies } from "@/application/dependencies"

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
