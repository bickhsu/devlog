const colorGroups = [
  {
    title: "Surface",
    colors: [
      ["background", "bg-background"],
      ["foreground", "bg-foreground"],
      ["card", "bg-card"],
      ["card-foreground", "bg-card-foreground"],
      ["popover", "bg-popover"],
      ["popover-foreground", "bg-popover-foreground"],
      ["border", "bg-border"],
    ],
  },
  {
    title: "Brand",
    colors: [
      ["primary", "bg-primary"],
      ["primary-foreground", "bg-primary-foreground"],
      ["secondary", "bg-secondary"],
      ["secondary-foreground", "bg-secondary-foreground"],
      ["accent", "bg-accent"],
      ["accent-foreground", "bg-accent-foreground"],
      ["muted", "bg-muted"],
      ["muted-foreground", "bg-muted-foreground"],
      ["destructive", "bg-destructive"],
    ],
  },
  {
    title: "Sidebar",
    colors: [
      ["sidebar", "bg-sidebar"],
      ["sidebar-foreground", "bg-sidebar-foreground"],
      ["sidebar-primary", "bg-sidebar-primary"],
      ["sidebar-primary-foreground", "bg-sidebar-primary-foreground"],
      ["sidebar-accent", "bg-sidebar-accent"],
      ["sidebar-accent-foreground", "bg-sidebar-accent-foreground"],
      ["sidebar-border", "bg-sidebar-border"],
    ],
  },
] as const

export function ColorTokens() {
  return (
    <article className="flex max-h-full min-h-0 w-[430px] shrink-0 flex-col overflow-hidden rounded-[28px] border bg-card p-6">
      <h1 className="font-heading text-2xl font-medium">Color Tokens</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Semantic colors shared by every DevLog interface.
      </p>

      <div className="mt-6 min-h-0 flex-1 space-y-6 overflow-y-auto pr-1">
        {colorGroups.map((group) => (
          <section className="space-y-3" key={group.title}>
            <h2 className="font-heading text-[10px] font-medium tracking-[0.22em] text-muted-foreground uppercase">
              {group.title}
            </h2>
            <div className="grid grid-cols-5 gap-x-2 gap-y-4">
              {group.colors.map(([name, className]) => (
                <div className="min-w-0 space-y-1.5" key={name}>
                  <div className={`h-12 rounded-lg border ${className}`} />
                  <p className="truncate font-heading text-[9px] leading-3 text-muted-foreground">
                    {name}
                  </p>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </article>
  )
}
