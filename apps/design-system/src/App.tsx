import { Buttons } from "@/components/buttons"
import { ColorTokens } from "@/components/color-tokens"
import { DesignSystemSidebar } from "@/components/design-system-sidebar"
import { Iconography } from "@/components/iconography"
import { Typography } from "@/components/typography"

export function App() {
  return (
    <main className="grid h-svh grid-cols-[288px_minmax(0,1fr)] gap-3 overflow-hidden bg-black p-3 text-foreground">
      <DesignSystemSidebar />

      <section className="min-h-0 min-w-0 overflow-x-auto overflow-y-hidden rounded-[28px] border bg-background">
        <div className="flex h-full w-max flex-col flex-wrap content-start items-start gap-6 p-6">
          <ColorTokens />
          <Typography />
          <Buttons />
          <Iconography />
        </div>
      </section>
    </main>
  )
}
