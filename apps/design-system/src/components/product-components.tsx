import { PreviewCard } from "@/components/preview-card"
import { ContextBadge } from "@devlog/ui/components/context-badge"

export function ProductComponents() {
  return (
    <>
      <ContextBadgePreview />
    </>
  )
}

function ContextBadgePreview() {
  return (
    <PreviewCard
      title="Context Badge"
      description="Subtle context paths with a hash icon and leading ellipsis."
    >
      <section className="flex flex-col items-start gap-3">
        <ContextBadge path="DevLog / Interface / Components" />
        <ContextBadge path="DevLog" />
        <ContextBadge path="Workspace / Projects / DevLog / Interface / Components" />
        <ContextBadge path="Research / A-very-long-unbroken-context-name-for-layout-verification" />
      </section>
    </PreviewCard>
  )
}
