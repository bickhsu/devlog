import type { ReactNode } from "react"

export type PlaygroundBlockCategory = "foundation" | "component"

export type PlaygroundBlock = {
  id: string
  title: string
  description?: string
  category: PlaygroundBlockCategory
  render: () => ReactNode
}
