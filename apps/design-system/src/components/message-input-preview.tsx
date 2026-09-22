import { useState } from "react"

import { ContextMessageInput } from "@devlog/ui/components/context-message-input"
import { type ContextOption } from "@devlog/ui/components/context-picker"
import { PreviewCard } from "@/components/preview-card"

const initialContexts: ContextOption[] = [
  { id: "devlog", path: "/DevLog" },
  { id: "interface", path: "/DevLog/Interface" },
  { id: "components", path: "/DevLog/Interface/Components" },
  { id: "layouts", path: "/DevLog/Interface/Layouts" },
  { id: "themes", path: "/DevLog/Interface/Themes" },
  { id: "engineering", path: "/DevLog/Engineering" },
  { id: "domain", path: "/DevLog/Engineering/Domain" },
  { id: "storage", path: "/DevLog/Engineering/Storage" },
  { id: "product", path: "/DevLog/Product" },
  { id: "ideas", path: "/DevLog/Product/Ideas" },
  { id: "feedback", path: "/DevLog/Product/Feedback" },
  { id: "daily", path: "/DevLog/Daily" },
  { id: "research", path: "/Research" },
  { id: "accessibility", path: "/Research/Accessibility" },
]

export function MessageInputPreview() {
  const [contexts, setContexts] = useState(initialContexts)

  function createContext(path: string): ContextOption {
    const segments = path.slice(1).split("/")
    const additions = segments.map((_, index) => {
      const ancestorPath = "/" + segments.slice(0, index + 1).join("/")
      return contexts.find((context) => context.path.toLowerCase() === ancestorPath.toLowerCase()) ??
        { id: crypto.randomUUID(), path: ancestorPath }
    })
    setContexts((current) => [
      ...current,
      ...additions.filter((addition) => !current.some((context) => context.id === addition.id)),
    ])
    return additions[additions.length - 1]!
  }

  const [selectedContext, setSelectedContext] = useState<ContextOption | null>(null)
  const [lastContext, setLastContext] = useState("/")
  const [value, setValue] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [failNextSend, setFailNextSend] = useState(false)
  const [error, setError] = useState("")
  const [lastMessage, setLastMessage] = useState("")

  async function submit() {
    if (submitting || !value.trim()) return
    setSubmitting(true)
    setError("")
    await new Promise((resolve) => setTimeout(resolve, 600))
    if (failNextSend) {
      setError("Could not send. Your message is still here — try again.")
      setFailNextSend(false)
    } else {
      setLastMessage(value)
      setLastContext(selectedContext?.path ?? "/")
      setValue("")
    }
    setSubmitting(false)
  }

  return (
    <PreviewCard title="Message Input" description="Write and send a message.">
      <div className="space-y-5">
        <ContextMessageInput
          contexts={contexts}
          onCreateContext={createContext}
          selectedContext={selectedContext}
          onContextChange={setSelectedContext}
          value={value}
          onValueChange={setValue}
          onSubmit={submit}
          submitting={submitting}
          error={error}
        />
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={failNextSend}
            disabled={submitting}
            onChange={(event) => setFailNextSend(event.target.checked)}
            className="accent-primary"
          />
          Simulate a failed send
        </label>
        <div role="status" className="space-y-2 text-sm text-muted-foreground">
          {submitting
            ? "Sending…"
            : lastMessage
              ? `Last sent to ${lastContext}:`
              : "Messages in this preview are not saved."}
          {lastMessage && (
            <p className="whitespace-pre-wrap rounded-xl bg-muted/30 p-3 text-foreground wrap-anywhere">
              {lastMessage}
            </p>
          )}
        </div>
      </div>
    </PreviewCard>
  )
}
