import type { ComponentProps } from "react"
import { RiHashtag } from "@remixicon/react"

import { cn } from "@devlog/ui/lib/utils"

export interface ContextBadgeProps extends ComponentProps<"span"> {
  path: string
}

export function ContextBadge({ path, className, ...props }: ContextBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border/40 bg-muted/30 px-2.5 py-1 text-xs text-muted-foreground select-none",
        className
      )}
      data-slot="context-badge"
      title={path}
      {...props}
    >
      <RiHashtag
        aria-hidden="true"
        focusable="false"
        className="size-3.5 shrink-0 opacity-70"
      />
      <span className="min-w-0 truncate text-left opacity-80" dir="rtl">
        <bdi dir="ltr">{path}</bdi>
      </span>
    </span>
  )
}
