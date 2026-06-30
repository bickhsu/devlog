import { useTheme } from "@/components/theme-provider"
import { PlaygroundShell } from "@/components/playground-shell"

const colors = [
  ["Background", "bg-background"],
  ["Foreground", "bg-foreground"],
  ["Primary", "bg-primary"],
  ["Secondary", "bg-secondary"],
  ["Muted", "bg-muted"],
  ["Accent", "bg-accent"],
  ["Destructive", "bg-destructive"],
] as const

export function App() {
  const { theme, setTheme } = useTheme()
  const nextTheme = theme === "dark" ? "light" : "dark"

  return (
    <PlaygroundShell>
    <main className="min-h-svh bg-background px-6 py-12 text-foreground">
      <div className="mx-auto max-w-5xl space-y-16">
        <header className="flex items-start justify-between gap-6 border-b pb-8">
          <div className="space-y-2">
            <p className="font-heading text-xs text-muted-foreground">
              @devlog/ui
            </p>
            <h1 className="font-heading text-3xl font-medium tracking-tight">
              Design System
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              The component ground truth for DevLog applications.
            </p>
          </div>
          <button
            className="rounded-lg border bg-background px-3 py-2 text-xs hover:bg-accent"
            onClick={() => setTheme(nextTheme)}
            type="button"
          >
            {nextTheme === "dark" ? "Dark" : "Light"} mode
          </button>
        </header>

        <section className="space-y-5">
          <div>
            <p className="font-heading text-xs text-muted-foreground">Foundation</p>
            <h2 className="font-heading text-xl font-medium">Color</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-7">
            {colors.map(([name, className]) => (
              <div className="space-y-2" key={name}>
                <div className={`aspect-square rounded-xl border ${className}`} />
                <p className="text-xs text-muted-foreground">{name}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid gap-10 border-t pt-10 md:grid-cols-2">
          <div className="space-y-5">
            <div>
              <p className="font-heading text-xs text-muted-foreground">Typography</p>
              <h2 className="font-heading text-xl font-medium">Geist</h2>
            </div>
            <p className="text-4xl tracking-tight">Build quiet, precise interfaces.</p>
            <p className="font-heading text-sm text-muted-foreground">
              Geist Mono — context/path/component.tsx
            </p>
          </div>

          <div className="space-y-5">
            <div>
              <p className="font-heading text-xs text-muted-foreground">Shape</p>
              <h2 className="font-heading text-xl font-medium">Radius</h2>
            </div>
            <div className="flex items-end gap-4">
              {["rounded-sm", "rounded-md", "rounded-lg", "rounded-xl"].map(
                (radius) => (
                  <div
                    className={`size-16 border bg-card ${radius}`}
                    key={radius}
                  />
                )
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
    </PlaygroundShell>
  )
}
