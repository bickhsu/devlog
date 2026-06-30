import type { PlaygroundBlock } from "@/playground/types"

type PlaygroundCanvasProps = {
  blocks: readonly PlaygroundBlock[]
}

export function PlaygroundCanvas({ blocks }: PlaygroundCanvasProps) {
  return (
    <main className="min-h-svh bg-background px-4 py-8 sm:px-8 lg:px-12 lg:py-12">
      <header className="mx-auto mb-10 max-w-7xl border-b pb-8">
        <p className="font-heading text-xs text-muted-foreground">@devlog/ui</p>
        <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-heading text-3xl font-medium tracking-tight">
              Component Playground
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Add one component block at a time. Each piece documents the shared
              UI used by DevLog applications.
            </p>
          </div>
          <span className="rounded-full border bg-card px-3 py-1.5 font-heading text-xs text-muted-foreground">
            {blocks.length} blocks
          </span>
        </div>
      </header>

      <div className="mx-auto columns-1 gap-5 space-y-5 md:columns-2 2xl:max-w-7xl 2xl:columns-3">
        {blocks.map((block) => (
          <article
            className="mb-5 break-inside-avoid overflow-hidden rounded-3xl border bg-card text-card-foreground shadow-sm"
            data-category={block.category}
            key={block.id}
          >
            <div className="border-b px-6 py-5">
              <p className="font-heading text-[11px] uppercase tracking-wider text-muted-foreground">
                {block.category}
              </p>
              <h2 className="mt-1 font-heading text-lg font-medium">{block.title}</h2>
              {block.description ? (
                <p className="mt-1 text-sm text-muted-foreground">
                  {block.description}
                </p>
              ) : null}
            </div>
            <div className="p-6">{block.render()}</div>
          </article>
        ))}
      </div>
    </main>
  )
}
