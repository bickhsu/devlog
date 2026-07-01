import { Button } from "@devlog/ui/components/button"
import devlogLogo from "@devlog/ui/assets/devlog-logo.svg"
import {
  type RemixiconComponentType,
  RiFontSansSerif,
  RiHeading,
  RiMoonLine,
  RiPaletteLine,
  RiRemixiconLine,
  RiRoundedCorner,
  RiSunLine,
} from "@remixicon/react"
import { useState } from "react"

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
  const [isDark, setIsDark] = useState(() => document.documentElement.classList.contains("dark"))

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark"

    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    localStorage.setItem("devlog-theme", nextTheme)
    setIsDark(nextTheme === "dark")
  }

  return (
    <aside className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border bg-card">
      <div className="border-b p-3">
        <div className="flex h-14 items-center justify-between rounded-2xl border bg-background px-4">
          <span className="flex min-w-0 items-center gap-2 text-sm font-medium">
            <img
              alt=""
              aria-hidden
              className="size-7 shrink-0 dark:invert"
              src={devlogLogo}
            />
            <span className="truncate">DevLog DesignSystem</span>
          </span>
          <Button
            aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
            aria-pressed={isDark}
            className="text-muted-foreground"
            onClick={toggleTheme}
            size="icon"
            title={`Switch to ${isDark ? "light" : "dark"} mode`}
            variant="ghost"
          >
            {isDark ? <RiSunLine /> : <RiMoonLine />}
          </Button>
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
