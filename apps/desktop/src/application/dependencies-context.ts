import { createContext } from "react"

import type { DesktopDependencies } from "@/application/dependencies"

export const DesktopDependenciesContext = createContext<DesktopDependencies | null>(null)
