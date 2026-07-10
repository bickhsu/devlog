# DevLog

DevLog 是一個用來快速紀錄日常開發碎片的工具。

這個 repo 採用 pnpm workspace，包含共用 UI foundations、components 與 Design System preview。

Design System preview 目前只支援 desktop，用來檢查共用 UI foundations 與 components，不是產品 UI。

```text
apps/
  design-system/  # Design System preview
packages/
  ui/             # 共用 theme、utilities 和 components
```

## 開發

安裝 dependencies 並啟動 Design System：

```bash
pnpm install
pnpm dev
```

執行 workspace 驗證：

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 新增共用 Component

共用 component 一律放在 `packages/ui`。從 repo 根目錄使用 shadcn 新增 component：

```bash
pnpm ui:add button
```

新增後，透過 package export 使用：

```tsx
import { Button } from "@devlog/ui/components/button"
```

在 `apps/design-system/src/components` 新增或更新展示內容，確認 component 的 default appearance、重要 variants 和必要 states。預覽與 demo-only state 留在 `apps/design-system`；可重用的 component code 留在 `packages/ui`。

應用程式以 workspace dependency 使用共用 package：

```json
{
  "dependencies": {
    "@devlog/ui": "workspace:*"
  }
}
```

不要在 `packages/ui` 放產品邏輯、Tauri API 或 product-specific state。只有在有多個 consumer 且介面穩定時，才新增新的 shared package。
