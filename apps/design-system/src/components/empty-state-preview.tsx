import { useState } from "react"

import { Button } from "@devlog/ui/components/button"
import { EmptyState } from "@devlog/ui/components/empty-state"
import { PreviewCard } from "@/components/preview-card"

export function EmptyStatePreview() {
  const [notice, setNotice] = useState("")

  return (
    <PreviewCard
      title="Empty State"
      description="Empty views with optional actions."
    >
      <section className="space-y-3 pb-2">
        <EmptyState
          title="A fresh day"
          description="No entries yet today. Capture a thought when you are ready."
        />
        <EmptyState
          title="No entries in this context"
          description="Notes assigned to this context will appear here."
        />
        <section className="space-y-3">
          <h3 className="font-heading text-xs text-muted-foreground">
            Single action
          </h3>
          <EmptyState
            title="Capture your first thought"
            description="Start with a small note about what you are working on."
            action={
              <Button onClick={() => setNotice("New entry clicked.")}>
                New entry
              </Button>
            }
          />
        </section>
        <section className="space-y-3">
          <h3 className="font-heading text-xs text-muted-foreground">
            Primary and secondary actions
          </h3>
          <EmptyState
            title="Nothing in this context yet"
            description="Add a note here or browse your existing entries."
            action={
              <>
                <Button onClick={() => setNotice("Add entry clicked.")}>
                  Add entry
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setNotice("View all entries clicked.")}
                >
                  View all entries
                </Button>
              </>
            }
          />
        </section>
        <p role="status" className="text-sm text-muted-foreground">
          {notice}
        </p>
      </section>
    </PreviewCard>
  )
}
