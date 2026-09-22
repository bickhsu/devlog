import type { ReactNode } from "react"

import { cn } from "@devlog/ui/lib/utils"

export interface EmptyStateProps {
  title: string
  description: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col items-center rounded-xl border border-dashed px-5 py-10 text-center",
        className
      )}
      data-slot="empty-state"
    >
      <p className="font-heading text-sm font-medium wrap-anywhere">{title}</p>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted-foreground wrap-anywhere">
        {description}
      </p>
      {action && (
        <div className="mt-5 flex max-w-full flex-wrap justify-center gap-2">
          {action}
        </div>
      )}
    </div>
  )
}
