import * as React from "react"

import { StyleSidebar } from "@/components/style-sidebar"

type PlaygroundShellProps = {
  children: React.ReactNode
}

export function PlaygroundShell({ children }: PlaygroundShellProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false)

  return (
    <div className="min-h-svh bg-background text-foreground lg:grid lg:h-svh lg:grid-cols-[288px_minmax(0,1fr)] lg:overflow-hidden">
      <button
        aria-label="Close style menu"
        className={`fixed inset-0 z-30 bg-black/60 backdrop-blur-sm transition-opacity lg:hidden ${
          sidebarOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={() => setSidebarOpen(false)}
        type="button"
      />

      <div
        className={`fixed inset-y-0 left-0 z-40 w-72 border-r transition-transform duration-200 lg:static lg:z-auto lg:w-auto lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <StyleSidebar onNavigate={() => setSidebarOpen(false)} />
      </div>

      <section className="min-w-0 lg:h-svh lg:overflow-y-auto">
        <div className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <button
            className="rounded-lg border px-3 py-2 text-xs"
            onClick={() => setSidebarOpen(true)}
            type="button"
          >
            Styles
          </button>
          <span className="font-heading text-xs text-muted-foreground">
            @devlog/ui
          </span>
        </div>
        {children}
      </section>
    </div>
  )
}
