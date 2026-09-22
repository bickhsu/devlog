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
  RiSidebarFoldLine,
  RiSidebarUnfoldLine,
} from "@remixicon/react"
import { useState } from "react"

import { designSystemMeta } from "@/config/design-system"

const styleSections = [
  {
    id: "style",
    items: [
      { label: "Style", value: designSystemMeta.style, icon: RiPaletteLine },
    ],
  },
  {
    id: "color",
    items: [
      {
        label: "Base Color",
        value: designSystemMeta.baseColor,
        dot: "bg-zinc-400",
      },
      { label: "Theme", value: designSystemMeta.theme, dot: "bg-primary" },
    ],
  },
  {
    id: "typography",
    items: [
      {
        label: "Heading",
        value: designSystemMeta.headingFont,
        icon: RiHeading,
      },
      {
        label: "Font",
        value: designSystemMeta.bodyFont,
        icon: RiFontSansSerif,
      },
    ],
  },
  {
    id: "interface",
    items: [
      {
        label: "Icon Library",
        value: designSystemMeta.iconLibrary,
        icon: RiRemixiconLine,
      },
      {
        label: "Radius",
        value: designSystemMeta.radius,
        icon: RiRoundedCorner,
      },
    ],
  },
] as const

export function DesignSystemSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean
  onToggle: () => void
}) {
  const [isDark, setIsDark] = useState(() =>
    document.documentElement.classList.contains("dark")
  )

  function toggleTheme() {
    const nextTheme = isDark ? "light" : "dark"

    document.documentElement.classList.toggle("dark", nextTheme === "dark")
    setIsDark(nextTheme === "dark")
  }

  return (
    <aside
      aria-label="Design system sidebar"
      className="flex min-h-0 flex-col overflow-hidden rounded-[28px] border bg-card"
    >
      <div className="border-b p-3">
        <div
          className={`flex items-center gap-2 overflow-hidden rounded-2xl bg-background transition-[height] duration-200 ease-in-out motion-reduce:transition-none ${collapsed ? "h-24 flex-col py-2" : "h-14 border px-2"}`}
        >
          <Button
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            aria-expanded={!collapsed}
            aria-controls="design-system-sidebar-details"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            onClick={onToggle}
            size="icon"
            variant="ghost"
            className="group relative text-muted-foreground"
          >
            <img
              alt=""
              aria-hidden
              className="size-7 transition-opacity group-hover:opacity-0 group-focus-visible:opacity-0 dark:invert"
              src={devlogLogo}
            />
            <span
              aria-hidden="true"
              className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100"
            >
              {collapsed ? <RiSidebarUnfoldLine /> : <RiSidebarFoldLine />}
            </span>
          </Button>
          {!collapsed && (
            <span className="min-w-0 flex-1 truncate text-sm font-medium">
              DevLog DesignSystem
            </span>
          )}
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

      <div
        id="design-system-sidebar-details"
        hidden={collapsed}
        className="min-h-0 flex-1 overflow-y-auto"
      >
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
      ) : Icon ? (
        <Icon aria-hidden className="text-muted-foreground" size={20} />
      ) : null}
    </div>
  )
}
