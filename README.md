# DevLog

DevLog 是一個用來快速紀錄日常開發碎片的工具。

這個 repo 採用 Bun workspace，包含共用 UI foundations、components 與 Design System preview。

Design System preview 目前只支援 desktop，用來檢查共用 UI foundations 與 components，不是產品 UI。

```text
apps/
  design-system/  # Design System preview
packages/
  ui/             # 共用 theme、utilities 和 components
```

## 開發環境

Repo 固定使用 Bun 1.3.14。先確認本機版本：

```bash
bun --version
```

尚未安裝時，可使用 Bun 官方安裝腳本安裝指定版本：

```bash
curl -fsSL https://bun.com/install | bash -s "bun-v1.3.14"
```

## 日常操作

安裝 dependencies 並啟動 Design System：

```bash
bun install
bun run dev
```

執行 workspace 驗證：

```bash
bun run lint
bun run typecheck
bun run build
```

Root scripts 會操作對應的 workspaces。需要直接執行特定 workspace script 時，使用 package name 過濾：

```bash
bun run --filter @devlog/design-system dev
bun run --filter @devlog/ui lint
```

`--filter` 也接受 glob，例如在所有 DevLog packages 執行現有的 lint script：

```bash
bun run --filter "@devlog/*" --if-present lint
```

## Dependency 管理

Dependency 應加入實際使用它的 workspace，不要預設加在 repo root：

```bash
bun add --cwd apps/design-system <package>
bun add --cwd packages/ui <package>
bun add --dev --cwd packages/ui <package>
bun remove --cwd packages/ui <package>
```

Bun 會同步更新該 workspace 的 `package.json` 與 root `bun.lock`，不要手動編輯 lockfile。

## 新增共用 Component

共用 component 一律放在 `packages/ui`。從 repo 根目錄使用 shadcn 新增 component：

```bash
bun run ui:add button
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
