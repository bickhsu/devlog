import { useContext } from "react"

import { DesktopRepositoriesContext } from "@/application/desktop-repositories-provider"

/** Read repositories provided by DesktopRepositoriesProvider. */
export function useDesktopRepositories() {
  const repositories = useContext(DesktopRepositoriesContext)

  if (!repositories) {
    throw new Error("Desktop feature rendered outside DesktopRepositoriesProvider.")
  }

  return repositories
}
