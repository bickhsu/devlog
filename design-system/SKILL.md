---
name: devlog-design
description: Use this skill to generate well-branded interfaces and assets for DevLog, either for production or throwaway prototypes/mocks/etc. Contains essential design guidelines, colors, type, fonts, assets, and UI kit components for prototyping. DevLog is a chat-like personal work log for developers — dark, terminal/Linear-flavored, monospace.
user-invocable: true
---

請先閱讀本 skill 內的 `readme.md`，再探索其他可用檔案。

注意語言慣例：**介面（widget／component）內容一律使用英文**（按鈕、標籤、placeholder、範例 log 全為英文）；**文件（readme、SKILL、`.prompt.md`）使用繁體中文**，技術名詞維持原文英文。產出新的介面時，請沿用英文 UI 文案。

若要製作視覺成品（簡報、mock、拋棄式原型等），把素材複製出來、產出靜態 HTML 檔給使用者檢視。若是在處理正式產品程式碼，可複製素材並讀取此處規則，成為使用此品牌設計的專家。

若使用者在沒有其他指示下啟用此 skill，請詢問他們想打造或設計什麼、問幾個問題，並以專家設計師之姿，依需求輸出 HTML 成品 *或* 正式程式碼。

## 這裡有什麼

- `readme.md` —— 設計指南：產品脈絡、內容原則、視覺基礎、圖示與檔案索引。**從這裡開始。**
- `styles.css` —— 唯一要連結的全域樣式表。匯入所有 token + 字型（IBM Plex Mono/Sans + Material Symbols，來自 Google Fonts CDN）。
- `tokens/` —— 色彩、字體排印、間距/圓角/陰影/動態，以及字型的 CSS 自訂屬性。
- `components/core/` —— React 基本元件（`Button`、`ContextBadge`、`Composer`、`CommandList`、`ColumnPicker`、`Dialog`、`LogEntry`、`TreeNav`、`SegmentedControl`、`Switch`、`Tag`、`Icon`、`Logo`…）。每個都有 `.d.ts`（props）與 `.prompt.md`（用法）。
- `ui_kits/devlog-app/` —— DevLog app 的完整互動重建；各元件如何組合的參考範例。
- `guidelines/*.card.html` —— 基礎樣本卡片（colors、type、spacing、brand）。
- `assets/` —— 品牌標記。

## 快速規則（完整內容見 readme.md）

- **基礎：shadcn/ui** token 契約（`--background`、`--primary`、`--ring`、`--radius`…）+ DevLog 克制化 token。**圖示用 Lucide**（`<script src="https://unpkg.com/lucide@latest">` 再用 `<Icon name="copy" />`）。
- **深色優先**，近黑表面（`--bg-app: #08090a`）、冷灰文字、單一 indigo-violet accent（`#7170ff`）。
- **IBM Plex Mono** 是產品的聲音，Inter（cv01/ss03、字重 510）為比例式 chrome。路徑是神聖的：等寬、開頭斜線、kebab 分段。
- 文案 **精簡、偏小寫、技術導向，且一律英文**。不用 emoji。動作用 Title Case，程式碼／路徑用小寫。
- 深度來自 **hairline border**（半透明白）與明度階梯，而非陰影。小圓角。冷靜、迅速的動態。
