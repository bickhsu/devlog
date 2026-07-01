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

export function ColorTokens() {
  return (
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
  )
}
