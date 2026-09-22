import { useState } from "react"

import { MessageInputPreview } from "@/components/message-input-preview"
import { EntryItemPreview } from "@/components/entry-item-preview"
import { ProductComponents } from "@/components/product-components"
import { EmptyStatePreview } from "@/components/empty-state-preview"
import { Buttons } from "@/components/buttons"
import { ColorTokens } from "@/components/color-tokens"
import { DesignSystemSidebar } from "@/components/design-system-sidebar"
import { Typography } from "@/components/typography"

export function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)

  return (
    <main
      className="design-system-preview grid h-svh gap-3 overflow-hidden bg-black p-3 text-foreground transition-[grid-template-columns] duration-200 ease-in-out motion-reduce:transition-none"
      style={{
        gridTemplateColumns: `${sidebarCollapsed ? 72 : 288}px minmax(0, 1fr)`,
      }}
    >
      <DesignSystemSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed((collapsed) => !collapsed)}
      />

      <section className="min-h-0 min-w-0 overflow-x-hidden overflow-y-auto rounded-[28px] border bg-background">
        <div className="flex min-w-0 flex-col gap-6 p-6 [&>article]:w-full">
          <MessageInputPreview />
          <EntryItemPreview />
          <ProductComponents />
          <EmptyStatePreview />
          <ColorTokens />
          <Typography />
          <Buttons />
        </div>
      </section>
    </main>
  )
}
