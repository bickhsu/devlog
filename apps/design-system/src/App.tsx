import { PlaygroundCanvas } from "@/components/playground-canvas"
import { PlaygroundShell } from "@/components/playground-shell"
import { playgroundBlocks } from "@/playground/blocks"

export function App() {
  return (
    <PlaygroundShell>
      <PlaygroundCanvas blocks={playgroundBlocks} />
    </PlaygroundShell>
  )
}
