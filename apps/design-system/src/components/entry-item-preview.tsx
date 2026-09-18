import { useId, useLayoutEffect, useRef, useState } from "react"

import { Button } from "@devlog/ui/components/button"
import { EntryItem } from "@devlog/ui/components/entry-item"
import { PreviewCard } from "@/components/preview-card"

const originalContent =
  "Connected the entry components.\nNext: check keyboard navigation and narrow layouts."

function EntryContentEditor({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const ref = useRef<HTMLTextAreaElement>(null)

  function resize(node: HTMLTextAreaElement) {
    node.style.height = "auto"
    node.style.height = `${node.scrollHeight}px`
  }

  useLayoutEffect(() => {
    if (ref.current) resize(ref.current)
  }, [value])

  useLayoutEffect(() => {
    const node = ref.current
    if (!node) return
    node.focus()
    let width = node.clientWidth
    const observer = new ResizeObserver(() => {
      if (width === node.clientWidth) return
      width = node.clientWidth
      resize(node)
    })
    observer.observe(node)
    return () => observer.disconnect()
  }, [])

  return (
    <textarea
      ref={ref}
      id={id}
      aria-label="Entry content"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      rows={1}
      className="block w-full resize-none overflow-hidden border-0 bg-transparent p-0 whitespace-pre-wrap text-sm leading-6 text-inherit wrap-anywhere outline-none"
    />
  )
}

export function EntryItemPreview() {
  const [content, setContent] = useState(originalContent)
  const [draft, setDraft] = useState(content)
  const [editing, setEditing] = useState(false)
  const [notice, setNotice] = useState("")
  const entryRef = useRef<HTMLDivElement>(null)
  const inputId = useId()

  function finishEditing(save: boolean) {
    if (save && !draft.trim()) return
    if (save) {
      setContent(draft)
    }
    setEditing(false)
    setNotice(save ? "Preview entry updated." : "Changes discarded.")
    requestAnimationFrame(() =>
      entryRef.current?.querySelector<HTMLButtonElement>("button")?.focus()
    )
  }

  return (
    <PreviewCard
      title="Entry Item"
      description="A single entry with its time, content, context, and editing state."
    >
      <section className="space-y-3">
        <div ref={entryRef}>
          <EntryItem
            content={content}
            timeLabel="09:41"
            dateTime="2026-09-17T09:41:00+08:00"
            context={{ path: "DevLog / Interface / Components" }}
            {...(editing
              ? {
                  state: "editing" as const,
                  editingActions: (
                    <>
                      <Button
                        type="submit"
                        form={`${inputId}-form`}
                        size="sm"
                        disabled={!draft.trim()}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => finishEditing(false)}
                      >
                        Cancel
                      </Button>
                    </>
                  ),
                  editor: (
                    <form
                      id={`${inputId}-form`}
                      onSubmit={(event) => {
                        event.preventDefault()
                        finishEditing(true)
                      }}
                    >
                      <EntryContentEditor
                        id={inputId}
                        value={draft}
                        onChange={setDraft}
                      />
                    </form>
                  ),
                }
              : {
                  state: "default" as const,
                  onEdit: () => {
                    setDraft(content)
                    setEditing(true)
                    setNotice("")
                  },
                })}
          />
        </div>
        <EntryItem
          content="A small note without a context."
          timeLabel="10:12"
          dateTime="2026-09-17T10:12:00+08:00"
        />
        <p role="status" className="text-xs text-muted-foreground">
          {notice}
        </p>
      </section>
    </PreviewCard>
  )
}
