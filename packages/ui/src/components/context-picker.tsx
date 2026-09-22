import { type RefObject, useLayoutEffect, useRef } from "react"
import { createPortal } from "react-dom"

import { cn } from "@devlog/ui/lib/utils"

export interface ContextOption {
  id: string
  path: string
}

export interface ContextPickerProps {
  id: string
  anchorRef: RefObject<HTMLDivElement | null>
  options: readonly ContextOption[]
  activeIndex: number
  onSelect: (option: ContextOption) => void
  createPath?: string
  onCreate?: () => void
}

export function ContextPicker({ id, anchorRef, options, activeIndex, onSelect, createPath, onCreate }: ContextPickerProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  useLayoutEffect(() => {
    const anchor = anchorRef.current
    const menu = menuRef.current
    if (!anchor || !menu) return

    function position() {
      if (!anchor || !menu) return
      const rect = anchor.getBoundingClientRect()
      const margin = 8
      const gap = 4
      const width = Math.min(rect.width, window.innerWidth - margin * 2)
      menu.style.width = `${width}px`
      menu.style.left = `${Math.max(margin, Math.min(rect.left, window.innerWidth - width - margin))}px`
      const below = Math.max(0, window.innerHeight - rect.bottom - gap - margin)
      const above = Math.max(0, rect.top - gap - margin)
      const height = Math.min(menu.scrollHeight, 224)
      const flip = below < height && above > below
      menu.style.maxHeight = `${Math.min(224, flip ? above : below)}px`
      menu.style.top = `${flip ? Math.max(margin, rect.top - gap - Math.min(height, above)) : rect.bottom + gap}px`
    }

    position()
    const observer = new ResizeObserver(position)
    observer.observe(anchor)
    observer.observe(menu)
    window.addEventListener("resize", position)
    window.addEventListener("scroll", position, true)
    return () => {
      observer.disconnect()
      window.removeEventListener("resize", position)
      window.removeEventListener("scroll", position, true)
    }
  }, [anchorRef])

  return createPortal(
    <div
      ref={menuRef}
      id={id}
      role="listbox"
      aria-label="Context paths"
      data-slot="context-picker"
      className="fixed z-50 max-h-56 overflow-y-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
    >
      {options.length ? options.map((option, index) => (
        <div
          key={option.id}
          id={`${id}-${index}`}
          role="option"
          aria-selected={index === activeIndex}
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => onSelect(option)}
          className={cn(
            "cursor-pointer truncate rounded-lg px-3 py-2 text-sm",
            index === activeIndex ? "bg-muted" : "hover:bg-muted/50"
          )}
          title={option.path}
        >
          {option.path}
        </div>
      )) : createPath ? (
        <div
          id={`${id}-0`}
          role="option"
          aria-selected
          onMouseDown={(event) => event.preventDefault()}
          onClick={onCreate}
          className="cursor-pointer truncate rounded-lg bg-muted px-3 py-2 text-sm"
          title={`Create ${createPath}`}
        >
          Create {createPath}
        </div>
      ) : <p className="px-3 py-2 text-xs text-muted-foreground">No matching contexts.</p>}
    </div>,
    document.body
  )
}
