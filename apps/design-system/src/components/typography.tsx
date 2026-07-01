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

export function Typography() {
  return (
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
  )
}
