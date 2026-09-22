import type { ReactNode } from "react"

import { Button } from "@devlog/ui/components/button"
import {
  ContextBadge,
  type ContextBadgeProps,
} from "@devlog/ui/components/context-badge"
import { cn } from "@devlog/ui/lib/utils"

type EntryState =
  | {
      state?: "default"
      editor?: never
      editingActions?: never
      onEdit?: () => void
    }
  | {
      state: "editing"
      editor: ReactNode
      editingActions: ReactNode
      onEdit?: never
    }

export type EntryItemProps = EntryState & {
  content: string
  timeLabel: string
  dateTime: string
  context?: Pick<ContextBadgeProps, "path"> | null
  className?: string
}

export function EntryItem({
  content,
  timeLabel,
  dateTime,
  context,
  state = "default",
  editor,
  editingActions,
  onEdit,
  className,
}: EntryItemProps) {
  return (
    <article
      className={cn(
        "group/entry min-w-0 rounded-xl border bg-card p-4 text-card-foreground",
        className
      )}
      data-slot="entry-item"
      data-state={state}
    >
      <div className="mb-3 flex min-w-0 items-center gap-2">
        <time
          dateTime={dateTime}
          className="shrink-0 whitespace-nowrap font-heading text-xs text-muted-foreground"
        >
          {timeLabel}
        </time>
        {context && (
          <ContextBadge {...context} className="min-w-0 shrink" />
        )}
        {state === "default" && onEdit && (
          <Button
            className="ml-auto pointer-events-none opacity-0 transition-opacity group-hover/entry:pointer-events-auto group-hover/entry:opacity-100 group-focus-within/entry:pointer-events-auto group-focus-within/entry:opacity-100"
            size="sm"
            variant="ghost"
            onClick={onEdit}
            aria-label={`Edit entry from ${timeLabel}`}
          >
            Edit
          </Button>
        )}
        {state === "editing" && (
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {editingActions}
          </div>
        )}
      </div>
      {state === "editing" ? (
        editor
      ) : (
        <p className="whitespace-pre-wrap text-sm leading-6 wrap-anywhere">
          {content}
        </p>
      )}
    </article>
  )
}
