import { useState } from "react"

import { MessageInput } from "@devlog/ui/components/message-input"
import { PreviewCard } from "@/components/preview-card"

export function MessageInputPreview() {
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
      setValue("")
    }
    setSubmitting(false)
  }

  return (
    <PreviewCard title="Message Input" description="Write and send a message.">
      <div className="space-y-5">
        <MessageInput
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
              ? "Last sent message:"
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
