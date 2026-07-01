import { designSystemMeta } from "@devlog/ui/meta"
import {
  type RemixiconComponentType,
  RiFontSansSerif,
  RiHeading,
  RiPaletteLine,
  RiRemixiconLine,
  RiRoundedCorner,
} from "@remixicon/react"

import { ColorTokens } from "@/components/color-tokens"
import { Iconography } from "@/components/iconography"
import { Typography } from "@/components/typography"

const styles = [
  { label: "Style", value: designSystemMeta.style, icon: RiPaletteLine },
  { label: "Base Color", value: designSystemMeta.baseColor, dot: "bg-zinc-400" },
  { label: "Theme", value: designSystemMeta.theme, dot: "bg-primary" },
  { label: "Chart Color", value: designSystemMeta.chartColor, dot: "bg-zinc-400" },
  { label: "Heading", value: designSystemMeta.headingFont, icon: RiHeading },
  { label: "Font", value: designSystemMeta.bodyFont, icon: RiFontSansSerif },
  { label: "Icon Library", value: designSystemMeta.iconLibrary, icon: RiRemixiconLine },
  { label: "Radius", value: designSystemMeta.radius, icon: RiRoundedCorner },
] as const

export function App() {
  return (
    <main className="grid h-svh grid-cols-[288px_minmax(0,1fr)] gap-3 overflow-hidden bg-black p-3 text-foreground">
      <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border bg-card">
        <div className="border-b p-3">
          <div className="flex h-14 items-center justify-between rounded-2xl border bg-background px-4">
            <span className="text-sm font-medium">Component Playground</span>
            <span aria-hidden className="font-heading text-xl text-muted-foreground">
              =
            </span>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto">
          <div className="space-y-3 border-b p-3">
            {styles.slice(0, 1).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
          <div className="space-y-3 border-b p-3">
            {styles.slice(1, 4).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
          <div className="space-y-3 border-b p-3">
            {styles.slice(4, 6).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
          <div className="space-y-3 p-3">
            {styles.slice(6).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
        </div>
      </aside>

      <section className="min-w-0 overflow-x-auto overflow-y-hidden rounded-[28px] border bg-background">
        <div className="flex min-h-full w-max items-start gap-6 p-6">
          <div className="w-[430px] shrink-0 space-y-6">
            <ColorTokens />
            <Typography />
          </div>
          <Iconography />
        </div>
      </section>
    </main>
  )
}

function StyleItem({
  dot,
  icon: Icon,
  label,
  value,
}: {
  dot?: string
  icon?: RemixiconComponentType
  label: string
  value: string
}) {
  return (
    <div className="flex min-h-20 items-center justify-between rounded-2xl border bg-background px-4 py-3">
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-sm font-medium">{value}</p>
      </div>
      {dot ? (
        <span className={`size-5 rounded-full border ${dot}`} />
      ) : (
        Icon ? <Icon aria-hidden className="text-muted-foreground" size={20} /> : null
      )}
    </div>
  )
}
