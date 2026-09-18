import { type ReactNode, useState } from "react"

import { Button } from "@devlog/ui/components/button"

export function PreviewCard({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  const [width, setWidth] = useState("wide")
  return (
    <article className="flex max-h-full min-h-0 w-[560px] shrink-0 flex-col overflow-hidden rounded-[28px] border bg-card p-6">
      <h2 className="font-heading text-2xl font-medium">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      <div
        className="my-5 flex flex-wrap items-center gap-2"
        role="group"
        aria-label={`${title} preview width`}
      >
        <Button
          size="sm"
          variant={width === "wide" ? "secondary" : "ghost"}
          aria-pressed={width === "wide"}
          onClick={() => setWidth("wide")}
        >
          Wide
        </Button>
        <Button
          size="sm"
          variant={width === "narrow" ? "secondary" : "ghost"}
          aria-pressed={width === "narrow"}
          onClick={() => setWidth("narrow")}
        >
          Narrow (280px)
        </Button>
      </div>
      <div className="-mr-5 min-h-0 flex-1 overflow-y-auto pr-6">
        <div
          className="mx-auto space-y-7"
          style={{ maxWidth: width === "narrow" ? 280 : "100%" }}
        >
          {children}
        </div>
      </div>
    </article>
  )
}
