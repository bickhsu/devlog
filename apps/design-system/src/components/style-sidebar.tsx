import { designSystemMeta } from "@devlog/ui/meta"

import { useTheme } from "@/components/theme-provider"

type StyleSidebarProps = {
  onNavigate?: () => void
}

const styleItems = [
  { label: "Style", value: designSystemMeta.style, swatch: "bg-foreground" },
  { label: "Base Color", value: designSystemMeta.baseColor, swatch: "bg-zinc-400" },
  { label: "Chart Color", value: designSystemMeta.chartColor, swatch: "bg-zinc-400" },
  { label: "Heading", value: designSystemMeta.headingFont, mark: "Aa" },
  { label: "Font", value: designSystemMeta.bodyFont, mark: "Aa" },
  { label: "Icon Library", value: designSystemMeta.iconLibrary, mark: "◉" },
  { label: "Radius", value: designSystemMeta.radius, mark: "⌝" },
] as const

export function StyleSidebar({ onNavigate }: StyleSidebarProps) {
  const { theme, setTheme } = useTheme()
  const isDark = theme === "dark"

  return (
    <aside className="flex h-full min-h-0 flex-col bg-card text-card-foreground">
      <div className="border-b p-3">
        <div className="flex h-12 items-center justify-between rounded-xl border bg-background px-3">
          <span className="text-sm font-medium">Menu</span>
          <span aria-hidden className="text-xl leading-none text-muted-foreground">
            =
          </span>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        <nav aria-label="Design system styles" className="divide-y">
          <div className="space-y-3 p-3">
            {styleItems.slice(0, 2).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
            <button
              className="flex w-full items-center justify-between rounded-xl border bg-background p-3 text-left transition-colors hover:bg-accent"
              onClick={() => {
                setTheme(isDark ? "light" : "dark")
                onNavigate?.()
              }}
              type="button"
            >
              <span>
                <span className="block text-xs text-muted-foreground">Theme</span>
                <span className="mt-0.5 block text-sm font-medium">
                  {isDark ? "Dark" : "Light"}
                </span>
              </span>
              <span className="size-5 rounded-full bg-primary ring-4 ring-primary/10" />
            </button>
            {styleItems.slice(2, 3).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>

          <div className="space-y-3 p-3">
            {styleItems.slice(3).map((item) => (
              <StyleItem {...item} key={item.label} />
            ))}
          </div>
        </nav>
      </div>

      <div className="space-y-2 border-t p-3">
        <div className="rounded-xl border bg-background px-3 py-2 text-center font-heading text-xs">
          --preset {designSystemMeta.preset}
        </div>
        <p className="px-1 text-center text-[11px] text-muted-foreground">
          @devlog/ui · component ground truth
        </p>
      </div>
    </aside>
  )
}

function StyleItem({
  label,
  mark,
  swatch,
  value,
}: {
  label: string
  mark?: string
  swatch?: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border bg-background p-3">
      <span>
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="mt-0.5 block text-sm font-medium">{value}</span>
      </span>
      {swatch ? (
        <span className={`size-5 rounded-full border ${swatch}`} />
      ) : (
        <span className="font-heading text-base text-muted-foreground">{mark}</span>
      )}
    </div>
  )
}
