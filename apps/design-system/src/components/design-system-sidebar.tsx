import {
  type RemixiconComponentType,
  RiFontSansSerif,
  RiHeading,
  RiPaletteLine,
  RiRemixiconLine,
  RiRoundedCorner,
} from "@remixicon/react"

import { designSystemMeta } from "@/config/design-system"

const styleSections = [
  {
    id: "style",
    items: [{ label: "Style", value: designSystemMeta.style, icon: RiPaletteLine }],
  },
  {
    id: "color",
    items: [
      { label: "Base Color", value: designSystemMeta.baseColor, dot: "bg-zinc-400" },
      { label: "Theme", value: designSystemMeta.theme, dot: "bg-primary" },
      { label: "Chart Color", value: designSystemMeta.chartColor, dot: "bg-zinc-400" },
    ],
  },
  {
    id: "typography",
    items: [
      { label: "Heading", value: designSystemMeta.headingFont, icon: RiHeading },
      { label: "Font", value: designSystemMeta.bodyFont, icon: RiFontSansSerif },
    ],
  },
  {
    id: "interface",
    items: [
      { label: "Icon Library", value: designSystemMeta.iconLibrary, icon: RiRemixiconLine },
      { label: "Radius", value: designSystemMeta.radius, icon: RiRoundedCorner },
    ],
  },
] as const

export function DesignSystemSidebar() {
  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border bg-card">
      <div className="border-b p-3">
        <div className="flex h-14 items-center justify-between rounded-2xl border bg-background px-4">
          <span className="text-sm font-medium">DevLog DesignSystem</span>
          <span aria-hidden className="font-heading text-xl text-muted-foreground">
            =
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {styleSections.map((section, index) => (
          <div
            className={`space-y-3 p-3 ${index < styleSections.length - 1 ? "border-b" : ""}`}
            key={section.id}
          >
            {section.items.map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
        ))}
      </div>
    </aside>
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
