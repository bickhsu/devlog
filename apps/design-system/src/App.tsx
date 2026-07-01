import { designSystemMeta } from "@devlog/ui/meta"
import {
  RiAddLine,
  RiArrowDownSLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiArrowRightSLine,
  RiCheckLine,
  RiDeleteBinLine,
  RiErrorWarningLine,
  RiFileCopyLine,
  RiHexagonLine,
  RiLoader4Line,
  RiMoreLine,
  RiSearchLine,
  RiShareLine,
  RiShoppingBagLine,
  RiSubtractLine,
} from "@remixicon/react"

const styles = [
  { label: "Style", value: designSystemMeta.style, mark: "⌁" },
  { label: "Base Color", value: designSystemMeta.baseColor, dot: "bg-zinc-400" },
  { label: "Theme", value: designSystemMeta.theme, dot: "bg-primary" },
  { label: "Chart Color", value: designSystemMeta.chartColor, dot: "bg-zinc-400" },
  { label: "Heading", value: designSystemMeta.headingFont, mark: "Aa" },
  { label: "Font", value: designSystemMeta.bodyFont, mark: "Aa" },
  { label: "Icon Library", value: designSystemMeta.iconLibrary, mark: "◉" },
  { label: "Radius", value: designSystemMeta.radius, mark: "⌝" },
] as const

const colors = [
  ["background", "bg-background"],
  ["foreground", "bg-foreground"],
  ["primary", "bg-primary"],
  ["secondary", "bg-secondary"],
  ["muted", "bg-muted"],
  ["accent", "bg-accent"],
  ["border", "bg-border"],
  ["chart-1", "bg-chart-1"],
  ["chart-2", "bg-chart-2"],
  ["chart-3", "bg-chart-3"],
  ["chart-4", "bg-chart-4"],
  ["chart-5", "bg-chart-5"],
] as const

const typeStyles = [
  {
    role: "Heading",
    meta: "Geist Mono · 30 / 36 · 500",
    sample: "Designing with rhythm and hierarchy.",
    className: "font-heading text-[30px] font-medium leading-9",
  },
  {
    role: "Body",
    meta: "Geist · 16 / 24 · 400",
    sample: "Readable interface copy for longer content.",
    className: "text-base leading-6",
  },
  {
    role: "Label",
    meta: "Geist · 14 / 20 · 500",
    sample: "Context",
    className: "text-sm font-medium leading-5",
  },
  {
    role: "Code",
    meta: "Geist Mono · 13 / 20 · 400",
    sample: "pnpm ui:add button",
    className: "font-heading text-[13px] leading-5",
  },
] as const

const icons = [
  RiFileCopyLine,
  RiErrorWarningLine,
  RiDeleteBinLine,
  RiShareLine,
  RiShoppingBagLine,
  RiMoreLine,
  RiLoader4Line,
  RiAddLine,
  RiSubtractLine,
  RiArrowLeftLine,
  RiArrowRightLine,
  RiCheckLine,
  RiArrowDownSLine,
  RiArrowRightSLine,
  RiSearchLine,
  RiHexagonLine,
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
            <article className="rounded-[28px] border bg-card p-6">
              <h1 className="font-heading text-2xl font-medium">Color Tokens</h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Semantic colors shared by every DevLog interface.
              </p>
              <div className="mt-8 grid grid-cols-6 gap-x-3 gap-y-6">
                {colors.map(([name, className]) => (
                  <div className="min-w-0 space-y-2" key={name}>
                    <div className={`aspect-square rounded-xl border ${className}`} />
                    <p className="truncate font-heading text-[10px] text-muted-foreground">
                      --{name}
                    </p>
                  </div>
                ))}
              </div>
            </article>

            <article className="rounded-[28px] border bg-card p-6">
              <h2 className="font-heading text-2xl font-medium">Typography</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Geist Mono for headings. Geist for interface copy.
              </p>
              <div className="mt-8 divide-y border-y">
                {typeStyles.map((style) => (
                  <div className="py-5" key={style.role}>
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-xs font-medium">{style.role}</p>
                      <p className="font-heading text-[10px] text-muted-foreground">
                        {style.meta}
                      </p>
                    </div>
                    <p className={`mt-3 ${style.className}`}>{style.sample}</p>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <article className="w-[580px] shrink-0 rounded-[28px] border bg-card p-6">
              <h2 className="font-heading text-2xl font-medium">Icons</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Remix Icon line symbols used across DevLog interfaces.
              </p>
              <div className="mt-8 grid grid-cols-8 gap-3">
                {icons.map((Icon, index) => (
                  <div
                    className="grid aspect-square place-items-center rounded-xl border bg-background text-foreground"
                    key={index}
                  >
                    <Icon aria-hidden size={22} />
                  </div>
                ))}
              </div>
          </article>
        </div>
      </section>
    </main>
  )
}

function StyleItem({
  dot,
  label,
  mark,
  value,
}: {
  dot?: string
  label: string
  mark?: string
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
        <span className="font-heading text-base text-muted-foreground">{mark}</span>
      )}
    </div>
  )
}
