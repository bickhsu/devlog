import { designSystemMeta } from "@devlog/ui/meta"

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

export function App() {
  return (
    <main className="grid h-svh grid-cols-[288px_minmax(0,1fr)] gap-6 overflow-hidden bg-black p-3 text-foreground">
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

      <section className="min-w-0 overflow-auto rounded-[28px] border bg-background">
        <div className="min-h-full min-w-[560px] px-16 py-14">
          <div className="w-[430px] space-y-16">
            <article className="rounded-[28px] border bg-card p-6">
              <h1 className="font-heading text-2xl font-medium">
                {designSystemMeta.style} - {designSystemMeta.headingFont}
              </h1>
              <p className="mt-2 truncate text-sm text-muted-foreground">
                The foundation shared by every DevLog interface.
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
              <p className="font-heading text-xs uppercase text-muted-foreground">
                Geist Mono - Geist
              </p>
              <h2 className="mt-4 font-heading text-3xl leading-tight">
                Designing with rhythm and hierarchy.
              </h2>
              <p className="mt-5 text-base leading-7 text-muted-foreground">
                A strong body style keeps long-form content readable and balances
                the visual weight of headings.
              </p>
              <p className="mt-4 text-base leading-7 text-muted-foreground">
                Thoughtful spacing and cadence help paragraphs scan quickly
                without feeling dense.
              </p>
            </article>
          </div>
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
