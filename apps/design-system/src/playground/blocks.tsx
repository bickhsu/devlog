import type { PlaygroundBlock } from "@/playground/types"

const colorTokens = [
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

export const playgroundBlocks: readonly PlaygroundBlock[] = [
  {
    id: "color",
    title: "Color tokens",
    description: "Semantic colors shared by every application.",
    category: "foundation",
    render: () => (
      <div className="grid grid-cols-4 gap-x-3 gap-y-5 sm:grid-cols-6 md:grid-cols-4 xl:grid-cols-6">
        {colorTokens.map(([name, className]) => (
          <div className="min-w-0 space-y-2" key={name}>
            <div className={`aspect-square rounded-xl border ${className}`} />
            <p className="truncate font-heading text-[10px] text-muted-foreground">
              --{name}
            </p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "typography",
    title: "Designing with rhythm and hierarchy.",
    description: "Geist Mono for headings. Geist for readable interface copy.",
    category: "foundation",
    render: () => (
      <div className="space-y-6">
        <p className="font-heading text-3xl leading-tight tracking-tight">
          Quiet tools for focused work.
        </p>
        <p className="text-sm leading-6 text-muted-foreground">
          A restrained type system keeps dense product interfaces readable and
          gives technical content a consistent cadence.
        </p>
        <div className="rounded-xl border bg-background p-4 font-heading text-xs text-muted-foreground">
          /context/design-system/typography
        </div>
      </div>
    ),
  },
  {
    id: "radius",
    title: "Radius scale",
    description: "A compact shape language derived from a 0.45rem base radius.",
    category: "foundation",
    render: () => (
      <div className="grid grid-cols-4 gap-4">
        {[
          ["sm", "rounded-sm"],
          ["md", "rounded-md"],
          ["lg", "rounded-lg"],
          ["xl", "rounded-xl"],
        ].map(([name, radius]) => (
          <div className="space-y-2 text-center" key={name}>
            <div className={`aspect-square border bg-primary/15 ${radius}`} />
            <p className="font-heading text-[10px] text-muted-foreground">{name}</p>
          </div>
        ))}
      </div>
    ),
  },
  {
    id: "component-slot",
    title: "Components start here",
    description: "The UI package is intentionally empty until a component is needed.",
    category: "component",
    render: () => (
      <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed bg-background p-8 text-center">
        <div>
          <span className="mx-auto grid size-10 place-items-center rounded-full border font-heading text-lg text-muted-foreground">
            +
          </span>
          <p className="mt-4 text-sm font-medium">Add the first puzzle piece</p>
          <code className="mt-2 block font-heading text-xs text-muted-foreground">
            pnpm ui:add button
          </code>
        </div>
      </div>
    ),
  },
] as const
