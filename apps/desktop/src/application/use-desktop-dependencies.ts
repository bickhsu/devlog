import { useContext } from "react"

import { DesktopDependenciesContext } from "@/application/dependencies-context"

/** Read the dependencies installed by the desktop composition root. */
export function useDesktopDependencies() {
  const dependencies = useContext(DesktopDependenciesContext)

  if (!dependencies) {
    throw new Error("Desktop feature rendered outside DesktopComposition.")
  }

  return dependencies
}
