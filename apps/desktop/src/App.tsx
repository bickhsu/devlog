import devlogLogo from "@devlog/ui/assets/devlog-logo.svg"

export function App() {
  return (
    <main className="flex min-h-svh items-center justify-center bg-background p-8 text-foreground">
      <section className="flex max-w-md flex-col items-center gap-4 text-center">
        <img src={devlogLogo} alt="DevLog" className="size-12" />
        <div className="space-y-2">
          <p className="font-heading text-xs uppercase tracking-[0.2em] text-muted-foreground">
            Desktop foundation
          </p>
          <h1 className="font-heading text-3xl font-semibold">DevLog</h1>
          <p className="text-sm leading-6 text-muted-foreground">
            The native application shell is ready for product features.
          </p>
        </div>
      </section>
    </main>
  )
}
