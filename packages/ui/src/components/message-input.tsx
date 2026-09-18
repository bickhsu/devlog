import { useId, useLayoutEffect, useRef } from "react"
import { RiArrowUpLine } from "@remixicon/react"

import { Button } from "@devlog/ui/components/button"
import { cn } from "@devlog/ui/lib/utils"

export interface MessageInputProps {
  value: string
  onValueChange: (value: string) => void
  onSubmit: () => void
  label?: string
  placeholder?: string
  disabled?: boolean
  submitting?: boolean
  error?: string
  className?: string
}

function resizeTextarea(textarea: HTMLTextAreaElement) {
  textarea.style.height = "auto"
  textarea.style.height = `${textarea.scrollHeight}px`
}

export function MessageInput({
  value,
  onValueChange,
  onSubmit,
  label = "Message",
  placeholder = "What are you working on?",
  disabled = false,
  submitting = false,
  error,
  className,
}: MessageInputProps) {
  const id = useId()
  const composing = useRef(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const unavailable = disabled || submitting

  useLayoutEffect(() => {
    if (textareaRef.current) resizeTextarea(textareaRef.current)
  }, [value])

  useLayoutEffect(() => {
    const textarea = textareaRef.current
    if (!textarea) return
    let width = textarea.clientWidth
    const observer = new ResizeObserver(() => {
      if (textarea.clientWidth === width) return
      width = textarea.clientWidth
      resizeTextarea(textarea)
    })
    observer.observe(textarea)
    return () => observer.disconnect()
  }, [])

  return (
    <form
      data-slot="message-input"
      aria-label={label}
      aria-busy={submitting || undefined}
      className={cn("min-w-0", className)}
      onSubmit={(event) => {
        event.preventDefault()
        if (!unavailable && !composing.current && value.trim()) {
          textareaRef.current?.focus()
          onSubmit()
        }
      }}
    >
      <div className="flex items-end gap-2 rounded-2xl border bg-muted/40 p-2 transition-colors focus-within:border-ring dark:bg-background/50">
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <textarea
          ref={textareaRef}
          id={id}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          onCompositionStart={() => {
            composing.current = true
          }}
          onCompositionEnd={() => {
            composing.current = false
          }}
          onKeyDown={(event) => {
            if (
              event.key !== "Enter" ||
              event.shiftKey ||
              event.altKey ||
              event.ctrlKey ||
              event.metaKey
            )
              return
            if (
              composing.current ||
              event.nativeEvent.isComposing ||
              event.nativeEvent.keyCode === 229
            )
              return
            event.preventDefault()
            if (!event.repeat && !unavailable)
              event.currentTarget.form?.requestSubmit()
          }}
          disabled={disabled}
          readOnly={submitting}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${id}-error` : undefined}
          placeholder={placeholder}
          rows={1}
          className="block max-h-64 min-h-9 min-w-0 flex-1 resize-none overflow-y-auto rounded-lg bg-transparent px-2 py-1.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground/70 disabled:cursor-not-allowed disabled:opacity-50"
        />
        {(value.trim().length > 0 || submitting) && (
          <div className="flex shrink-0 items-center">
            <Button
              type="submit"
              size="icon"
              className="rounded-lg"
              aria-label={submitting ? "Sending message" : "Send message"}
              title="Send message"
              disabled={unavailable || !value.trim()}
              loading={submitting}
            >
              {!submitting && <RiArrowUpLine aria-hidden />}
            </Button>
          </div>
        )}
      </div>
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-2 px-4 text-left text-xs text-destructive"
        >
          {error}
        </p>
      )}
    </form>
  )
}
