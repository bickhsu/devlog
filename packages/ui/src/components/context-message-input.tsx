import { useId, useRef, useState } from "react"

import { ContextBadge } from "@devlog/ui/components/context-badge"
import { ContextPicker, type ContextOption } from "@devlog/ui/components/context-picker"
import { MessageInput, type MessageInputProps } from "@devlog/ui/components/message-input"

export interface ContextMessageInputProps extends Omit<MessageInputProps, "onKeyDown" | "hideSend"> {
  contexts: readonly ContextOption[]
  selectedContext: ContextOption | null
  onCreateContext?: (path: string) => ContextOption | Promise<ContextOption>
  onContextChange: (context: ContextOption | null) => void
}

const root: ContextOption = { id: "", path: "/" }

export function ContextMessageInput({
  contexts,
  selectedContext,
  onContextChange,
  onCreateContext,
  value,
  onValueChange,
  disabled,
  submitting,
  ...props
}: ContextMessageInputProps) {
  const id = useId()
  const anchorRef = useRef<HTMLDivElement>(null)
  const creatingRef = useRef(false)
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState("")
  const [pendingPath, setPendingPath] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)
  const isPath = value.startsWith("/") && !value.includes("\n")
  const visible = open && isPath && !disabled && !submitting && !creating
  const slash = value.lastIndexOf("/")
  const parent = value.slice(0, slash + 1)
  const candidates = [root, ...contexts].filter((option) => {
    if (option.path === "/") return value === "/"
    return option.path.toLowerCase().startsWith(value.toLowerCase()) &&
      !option.path.slice(parent.length).includes("/")
  })
  const normalizedPath = value.replace(/\/$/, "")
  const exact = [root, ...contexts].find((option) =>
    option.path.toLowerCase() === (normalizedPath || "/").toLowerCase()
  )
  const createPath = isPath && !exact && !candidates.length && onCreateContext &&
    normalizedPath.slice(1).split("/").every((segment) => segment.trim().length > 0)
    ? normalizedPath
    : undefined
  const index = Math.min(activeIndex, Math.max(0, candidates.length - 1))

  function prepare(path: string) {
    onValueChange(path)
    setPendingPath(path)
    setOpen(false)
    setActiveIndex(0)
  }

  function select(option: ContextOption) {
    setPendingPath(null)
    onContextChange(option.id === "" ? null : option)
    onValueChange("")
    setOpen(false)
    setActiveIndex(0)
  }

  async function create() {
    if (!createPath || !onCreateContext || creatingRef.current) return
    creatingRef.current = true
    setCreating(true)
    setCreateError("")
    try {
      select(await onCreateContext(createPath))
    } catch {
      setCreateError("Could not create context. Try again.")
    } finally {
      creatingRef.current = false
      setCreating(false)
    }
  }

  return (
    <div ref={anchorRef} className="relative min-w-0 space-y-2" data-slot="context-message-input">
      <div className="px-2">
        <ContextBadge path={selectedContext?.path ?? "/"} />
      </div>
      <MessageInput
        {...props}
        value={value}
        disabled={disabled || creating}
        error={createError || props.error}
        submitting={submitting}
        hideSend={isPath}
        onValueChange={(next) => {
          setPendingPath(null)
          setCreateError("")
          onValueChange(next)
          setActiveIndex(0)
          setOpen(next.startsWith("/") && !next.includes("\n"))
        }}
        onKeyDown={(event) => {
          if (disabled || submitting || creatingRef.current || event.altKey || event.ctrlKey || event.metaKey) return
          if (event.key === "Escape") {
            setPendingPath(null)
            setOpen(false)
            return
          }
          if (event.key === "Tab" && !event.shiftKey && isPath) {
            event.preventDefault()
            if (visible && candidates[index]) {
              const option = candidates[index]
              const hasChildren = option.id !== "" && contexts.some((context) => context.path.startsWith(option.path + "/"))
              const completedPath = option.path + (hasChildren ? "/" : "")
              onValueChange(completedPath)
              setPendingPath(completedPath)
              setActiveIndex(0)
            }
            setOpen(true)
          } else if (visible && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault()
            setPendingPath(null)
            setActiveIndex((index + (event.key === "ArrowDown" ? 1 : -1) + candidates.length) % (candidates.length || 1))
          } else if (isPath && event.key === "Enter" && !event.shiftKey) {
            event.preventDefault()
            if (event.repeat) return
            if (pendingPath === value) {
              if (exact) select(exact)
              else if (createPath) void create()
              else setOpen(true)
            } else if (visible && candidates[index]) prepare(candidates[index].path)
            else if (exact) prepare(exact.path)
            else if (createPath) prepare(createPath)
            else setOpen(true)
          }
        }}
      />
      {visible && (
        <ContextPicker anchorRef={anchorRef} id={id} options={candidates} activeIndex={index} onSelect={(option) => prepare(option.path)} createPath={createPath} onCreate={() => { if (createPath) prepare(createPath) }} />
      )}
    </div>
  )
}
