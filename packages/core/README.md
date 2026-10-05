# Core Repository Contracts

透過 `@devlog/core` 匯入 repository 介面與 inputs。所有方法均回傳 Promise，讓 use case 能以 dependency injection 使用 Desktop adapter 或 in-memory fake。Core 不依賴 React、Tauri、browser storage 或 SQLite implementation。

## 介面與語意

- `EntryRepository`：取得、編輯、依時間區間或 context 查詢 entry。`listBetween` 使用 `[from, to)`，排除 soft-deleted entries，依 `(createdAt, id)` 遞增排序。`listByContext` 支援 descendants 與 archived context 歷史；分組與排序由 consumer 決定。
- `AppStateRepository`：統一管理草稿、預設 context 與提交。`getDefaultContextId()` 讀取新草稿的預選值，初始為 `null`；既有草稿保留自己的 context。依 surface 讀取、保存與捨棄 draft，保留原始文字並允許空白。`submitEntry()` 驗證最新 payload，以單一 transaction 建立 entry、更新預設 context（包含 `null`），且只清除來源 surface 的 draft；失敗不得留下部分變更。
- `ContextRepository`：建立、改名、封存及查詢 context。封存寫入 `archivedAt`；`deletedAt` 保留給未來的刪除，兩者皆為 `null` 才算 active。`list` 預設排除 archived contexts、永不包含 deleted contexts；`findById` 保留歷史查詢能力。Archive 必須原子地封存 subtree、清除受影響的 current／draft context references，並保留 draft content 與歷史 entry relationships。

預設 context 不提供獨立 setter；保存草稿不改變預設值，成功提交才更新，封存時則清除受影響的值。介面合併不改變 domain model 或資料表的分組。

Entry 編輯可修改 content 與 contextId，保留 id 與 createdAt。允許沿用原本已封存的 context，但若切換，只能選 active context 或 `null`。Context 名稱在同一 parent 的 active siblings 間不可重複，ASCII 文字採 case-insensitive 比較。

Repository 負責配置 ID 與時間；domain 日期使用 `Date`，序列化由 adapter 處理。回傳資料應為 snapshot，修改回傳的 `Date` 不應改變儲存狀態。Entry content 與 context name 使用 Core normalization 規則；adapter 仍須在寫入邊界驗證資料完整性。

## Context Use Cases

`src/use-cases/contexts.ts` 是 UI 操作 context 的入口，只依賴 repository 介面：

- `createContext`／`renameContext` 先以 `normalizeContextName` 拒絕空白或含 `/` 的名稱，再交給 repository；同層名稱衝突、parent 不存在或已封存由 repository 判定，因為只有它看得到並行寫入。
- `createContextPath` 以 `parseContextPath` 解析 `/Work/DevLog/New` 這類輸入，交給 repository 的 `createPath`：逐段沿用同名 active context 或建立，整條 path 原子完成，任一段失敗都不留下新 context。
- `archiveContext` 委派給 repository 的原子 subtree archive。
- `listActiveContextTree` 回傳 active tree，同層依名稱排序，每個節點帶完整 path；`listActiveContextPaths` 依同樣順序攤平，供 path picker 與補全使用。
- `findContextPath` 包含 archived contexts，讓歷史 entry 仍能顯示 `/Work/DevLog` 這類 path。`formatContextPath` 輸出 `/A/B`，沒有 context 時為 `/`；名稱禁止 `/` 所以不會混淆。
- `listContextHistory` 查詢 context 與所有 descendants（含 archived）的 entries，依 `(createdAt, id)` 遞增排序。

## Capture Use Case

`src/use-cases/capture.ts` 的 `createCaptureSession({ repository, surface })` 是一個 composer 的草稿生命週期，main 與 quick-capture 各建一個。它不像 context use cases 是單次呼叫的函式，而是持有待保存編輯與 autosave timer 的 session，因為 submit 必須能取消尚未執行的 autosave：

- `load()`：恢復該 surface 的 draft；沒有 draft 時回傳空白內容與預設 context。
- `change(state)`：記錄編輯，debounce 後自動保存（預設 500ms）。
- `flush()`：立即保存尚未送出的編輯，並等待先前的寫入完成；window hide／close 時呼叫。
- `discard()`：取消待保存的編輯並刪除 draft。
- `submit(state)`：先以 `normalizeEntryContent` 驗證，失敗時不碰儲存也保留待保存的編輯；通過後取消待執行的 autosave、排在已開始的 save 之後提交。

Session 內所有 repository 呼叫依呼叫順序執行，因此成功 submit 後不會有 late autosave 重建已清除的 draft；submit 開始後的新編輯則成為下一份 draft。Autosave 沒有呼叫端可 reject，失敗透過 `onAutosaveError` 回報，並在下一次 `flush()` 重試。依 key 序列化的工具 `createKeyedSerialQueue` 放在 `src/lib/`，與業務無關；Desktop adapter 也用它依 surface 排序 IPC。

## 錯誤與執行順序

失敗以 `DomainError` reject：找不到 entry／context 使用 `EntryNotFound`／`ContextNotFound`；不可選取的 archived context 使用 `ContextArchived`；內容、名稱與同層名稱衝突使用對應的 validation codes。Draft 儲存失敗使用 `DraftSaveFailed`，其他儲存失敗使用 `StorageUnavailable`。不可向上層洩漏原始 driver 或 IPC diagnostics。

Desktop adapter 須依 surface 序列化 draft mutations。Submit 前取消尚未執行的 debounce、等待已開始的 save 完成，再提交；成功後不得讓 late save 重建 draft。不同 repository 方法的普通呼叫組合無法保證 submit 與 archive 所需的跨資料原子性，adapter 必須使用底層 transaction。

## Fake 使用範例

`src/repositories/contracts.test.ts` 示範 consumer 從公開入口匯入介面，注入 in-memory fake，驗證查詢邊界、狀態變更與錯誤。這些測試驗證介面使用方式；實際 adapter 仍需自己的 transaction、concurrency、constraints 與 error translation 整合測試。

```bash
bun run --filter @devlog/core test
bun run --filter @devlog/core typecheck
bun run --filter @devlog/core lint
```
