# DevLog

DevLog is a pnpm workspace. The design system is isolated from applications and
acts as their component ground truth.

```text
apps/
  design-system/  # Foundation and component preview
packages/
  ui/             # Shared theme, utilities, and components
```

The future Tauri application belongs in `apps/devlog`, with its React frontend
and `src-tauri` directory colocated inside that app.

## Development

Install dependencies and start the design-system preview:

```bash
pnpm install
pnpm dev
```

Run all workspace checks:

```bash
pnpm typecheck
pnpm lint
pnpm build
```

## Adding UI components

`packages/ui` is the only source of shared UI components. Add shadcn components
from the repository root:

```bash
pnpm ui:add button
```

The generated component is available through the package export:

```tsx
import { Button } from "@devlog/ui/components/button"
```

Applications consume the package with a workspace dependency:

```json
{
  "dependencies": {
    "@devlog/ui": "workspace:*"
  }
}
```

Keep application behavior, Tauri APIs, and product-specific state outside
`packages/ui`. Add a new shared package only after it has multiple consumers and
a stable public interface.
