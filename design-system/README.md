# DevLog — 設計系統

**DevLog** 是一款給開發者使用、像聊天介面的個人工作紀錄（personal work log）。它不走 issue、ticket 或 wiki 的路線，而是讓你把「做了什麼」用訊息的方式，依時間順序記在同一條 thread 裡，並以類似檔案系統的 **context path**（例如 `/metai/cad-agent/adapter`）來分類。整體氣質更接近終端機或 Linear，而非 Notion：深色、安靜、等寬字、快。

核心循環：寫一則 log → 它落在目前 context 底下的 thread 裡 → 像在專案裡 `cd` 一樣切換 context。整個產品都圍繞著「讓這個 context 切換毫不費力」打造。

> **語言慣例（重要）**
> 本系統的 **介面（widget／component）內容一律使用英文** —— 按鈕、標籤、placeholder、log 內容、範例資料全部是英文。
> 而 **文件（本 readme、SKILL.md、各元件的 `.prompt.md` 說明文字）使用繁體中文**，技術名詞與開發慣用語維持英文（`cd`、`Context`、`IR JSON`、`CLI workflow`、`schema`、`repo` 等）。

> **基礎架構**
> 本系統以 **shadcn/ui** 為基礎：採用 shadcn 的 token 契約（`--background`、`--foreground`、`--card`、`--popover`、`--primary`、`--secondary`、`--muted`、`--destructive`、`--border`、`--input`、`--ring`、`--radius`），並套上 DevLog 克制化的 design token（見 `tokens/colors.css` 末段的 shadcn 層）。**例外：** 本系統的 `--accent` 是品牌 accent（indigo），而非 shadcn 原生的 hover 表面；hover 填色請用 `--secondary` / `--muted`。圖示使用 **Lucide**。

---

## 來源

本系統是依使用者提供的 Figma 檔案重建：

- **檔案：** `DevLog.fig`（以唯讀虛擬檔案系統掛載）
- **頁面：** `/Wireframe` — 10 個 frame，1440×1024
- **使用到的 frame：** `main-chat-view`、`slash-change-context`、`cd-change-context-press-tab-key`、`mouse-click-change-context`、`create-context`、`sidebar-open`、`copy-context`、`setting`、`hover-message-show-time-and-context`、`MacBook-Air`
- **檔案內的元件：** `Copy`、`Settings`（Material-Symbol 風格圖示）
- **視覺參考：** Linear 的設計系統（深色模式）—— 等寬／半等寬調性、command bar、hairline 分隔、克制的陰影、紫藍色 accent 都受其啟發。

該 Figma 是 **灰階低保真 wireframe**，定義的是結構與互動，而非完成的視覺。依需求說明（「wireframe 只是結構 —— 視覺可以盡情往前推」），本系統確立了 **深色、終端機／Linear 風格** 的視覺方向。以 wireframe 為準的部分：版面、三種 context 切換互動、側邊欄樹狀結構、設定內容，以及採用 IBM Plex Mono 字體。其餘的調性（色彩、深度、動態、微互動）皆在此設計。

不假設讀者能存取 Figma；結構已完整落在 UI kit 與元件中。

---

## 產品具體樣貌

畫面主體是單欄的 **log thread**。紀錄依時間順序堆疊，並以 `YYYY/MM/DD` 日期分隔列（hairline 細線 + 淡色日期）區隔。底部固定一個 **composer** —— 一個大型圓角輸入框，左上角內嵌 **目前 context badge**（例如 `/metai/cad-agent/adapter`）。可收合的 **側邊欄** 放著 context 的樹狀結構。頂列：左側面板開關、右側複製範圍。

### Context paths
Context 就是路徑，像目錄。目前的工作樹：

```
/metai
  /cad-agent
    /adapter
      /migration-test
      /flowchart-explanation
    /ai-team
    /meeting
  /metgen
  /hython-server
  /building-gen
  /cad-parser
  /kinopio-test
```

### 切換 context —— 三種方式（產品的核心）
1. **`/` 指令面板** —— 在 composer 輸入 `/` → 跳出一個扁平下拉，列出所有完整 context path，挑一個即可。（Linear 風格的 command list。）
2. **`cd` + Tab 欄位選擇器** —— 輸入 `cd ` 再按 Tab → composer 上方開啟一個 macOS Finder 風格的 **層疊欄位選擇器**，逐層往下鑽。
3. **點擊 context badge** —— 開啟同一個欄位選擇器。
4. **找不到就建立** —— 若輸入的路徑不存在，跳出 **Create Context** 確認對話框（路徑預覽、`OK` / `Cancel`）。

### 其他畫面
- **側邊欄** —— context 樹、設定齒輪、收合箭頭。
- **設定** —— Theme（淺／深色）+ **Copy Context Range**（`Today` / `Last Week` / `All`）。
- **複製** —— 複製目前 context、所選範圍的 log。
- **滑過某則訊息** —— 顯示它的時間戳與 context。

---

## 內容原則（CONTENT FUNDAMENTALS）

DevLog 怎麼說話。這是一個「開發者對著自己的紀錄說話」的產品，所以語氣 **精簡、技術、低情緒** —— 不行銷腔，不過度熱情。

- **介面語言：英文。** 所有 UI chrome 與微文案都是英文，包括 log 內容與範例資料。文案以開發者的語感為準：像好的 commit message、像終端機提示。（本系統的 *文件* 才是繁體中文。）
- **語氣與人稱。** 使用者是 *寫給自己看* —— 紀錄是片段或裸筆記（"Set up the BuildingSchemaAdapter repo…"、"CAD Agent / shipped fixer utility"）。介面只在必要時用平實的第二人稱對使用者說話（"this context doesn't exist yet — create it?"）。不用 "we"，沒有品牌腔。
- **語調。** 冷靜、就事論事、低情緒。像好的 commit message 或終端機提示。產品退到後面。
- **大小寫。** 動作標籤用 Title Case（`Create Context`、`Copy Context Range`、`OK`、`Cancel`、`Today`、`Last Week`、`All`）；路徑或程式碼形狀的文字一律小寫（`cd`、`/metai/cad-agent`、`--to-hython-schema`）。Context 的每一段用 kebab-case（`migration-test`、`flowchart-explanation`）。除了小型 eyebrow 標籤／鍵盤提示，不用全大寫。
- **路徑是神聖的。** Context path 永遠用等寬字、開頭斜線、kebab 分段呈現。把它們當檔案路徑對待，因為它們就是。
- **數字與日期。** 日期用 `YYYY/MM/DD`（`2026/06/12`）。時間用 24 小時制 `HH:MM`。分隔列不用「3 days ago」這種模糊說法；相對時間只出現在 hover／metadata。
- **精簡。** 用最短而正確的標籤。`OK` 而非 "Confirm and create"。空狀態是一行安靜的小寫文字，例如 `no entries yet — start typing below`。
- **不用 emoji。** 任何地方都不用。需要時用 Lucide 圖示或 unicode 箭頭（`→`、`└`、`➜`）。程式碼片段、檔名、CLI flag 都歡迎、也很對味。
- **混語是常態。** 真實的 log 會把英文敘述和英文技術名詞混在一起；技術名詞維持原文，不要「翻譯」它們。

符合原始素材的紀錄範例：
> `BuildingSchemaAdapter`
> Set up the BuildingSchemaAdapter repo, wired CAD Parser to BuildingGen, and converged it into a runnable CLI workflow.

UI 文案範例：對話框標題 `Create Context`、內文 `/metai/cad-agent/adapter/migration-test/test1`、按鈕 `OK` `Cancel`。

---

## 視覺基礎（VISUAL FOUNDATIONS）

感覺：**一個被用心設計過的安靜終端機。** 深色、扁平、等寬，帶幾個小小的生命力時刻。

- **色彩與氛圍。** 深色優先，色值對齊 Linear 的近黑系統。背景是近純黑的 canvas（`--bg-app: #08090a`），面板 `#0f1011`，表面以微小的明度階距往上堆疊（`#141516` → `#191a1b` → `#28282c`）。文字是冷灰色階：主要 `#f7f8f8`（近白，內文絕不用純白）、次要 `#d0d6e0`、淡色 `#8a8f98`、最淡 `#62666d`。整套系統幾乎無彩，只用 **一個 indigo-violet accent**：brand `#5e6ad2`、interactive `#7170ff`、hover `#828fff` —— 承載 focus、選取、作用中的 context 與路徑。狀態色保持克制：綠 `#10b981`（done）、琥珀 `#e2b340`（in-progress）、紅 `#e5484d`（failed）。有淺色主題（設定可切換）。
- **字體。** **IBM Plex Mono** 是產品的聲音 —— log 內文、路徑、composer、樹狀、多數產品 UI，這是 DevLog 的識別。**Inter Variable** 作為比例式 companion（Linear 的招牌做法），全域開啟 OpenType `cv01`、`ss03` 特性，並以 **510 字重**（Linear 介於 regular 與 medium 之間的招牌權重）為強調。字重：400／510／590。log 內文 16px / 行高 1.65。UI chrome 13–15px。eyebrow／鍵盤提示為 11px 大寫、字距 `0.08em`。（理想的等寬字是 Linear 的 Berkeley Mono，非免費；以 IBM Plex Mono 作為替身。）
- **背景。** 沒有圖片、沒有當裝飾的漸層、沒有花紋。扁平色塊。唯一的「紋理」是紀錄之間分隔線帶來的 1px hairline 網格感。深度靠 border 與極淡的表面提升表達，**不靠** 大陰影或光暈。
- **Border 與 hairline。** 定義性的母題，採 Linear 的 **半透明白色 hairline**。`--border-subtle: rgba(255,255,255,0.05)`（預設）、`--border: rgba(255,255,255,0.08)`、`--border-strong: rgba(255,255,255,0.14)`。它們在深色上構成結構卻幾乎無噪訊，像月光下畫的線框。側邊欄與聚焦中的 composer 用 2px border。border 擔起大部分結構工作；這是一套「用線，不用框」的系統。
- **圓角。** 小而一致：input／chip 6px、composer 與卡片 8px、popover／對話框 12px、側邊欄外殼 16px、badge／標籤用 pill。沒有任何直角，也沒有特別圓。
- **卡片與表面。** 「卡片」= `--surface-raised` 填色 + 1px border + 8px 圓角 + 至多 `--shadow-sm`。不用彩色左側 border、不用厚重投影。Popover／對話框加上 `--shadow-popover`（柔和陰影 + 1px ring），並坐在暗色遮罩上。
- **層次（Elevation）。** 對齊 Linear：深色上不靠暗投影，而是靠 **明度階梯 + 白色 hairline ring + inset**。卡片用 `--shadow-sm`（細投影 + 內側白 ring），popover／欄位選擇器／對話框用多層 **Dialog stack**（`--shadow-popover`），凹陷面板用 `--inset-sunken`（`inset 0 0 12px rgba(0,0,0,0.2)`）。陰影是低不透明度的黑，絕不用彩色。
- **透明與模糊。** 少量使用：對話框遮罩是暗色罩（`rgba(0,0,0,0.5)`），可選擇加輕微 `backdrop-filter: blur(2px)`。選取／hover 狀態用半透明 accent 填色（`--blue-bg`、`--selection-bg`），讓底下表面透出。不到處用毛玻璃。
- **動態。** 冷靜而迅速，靠近 Linear 的「精準而非彈跳」。預設 easing `--ease-out`，130–200ms。Popover 淡入並上移 4px。command list 與選擇器欄位以每列數毫秒 **錯落進場**。依本產品需求保留一個極小的 `--ease-spring`（已收斂、不過衝）作為 context badge 按下與新 log 進場的個性時刻 —— 比 Linear 多一分人味，但仍克制。composer 裡有閃爍游標（`▍`）。尊重 `prefers-reduced-motion` —— 進場動畫退化為瞬間完成。
- **Hover 狀態。** 表面列變亮到 `--surface-hover`。文字控制項由 `--text-muted` 變到 `--text-primary`。圖示按鈕後方出現淡淡的 `--surface-hover` 方塊。作用中的 context badge 把 border 往 accent 提亮。
- **按下狀態。** 按鈕略微變暗並縮放到 `0.97` 約 80ms（`--ease-spring`），給出適合終端機產品的「按鍵」觸感。
- **Focus。** 鍵盤 focus = 3px 藍色光暈環（`--shadow-focus`）加上 `--border-strong` 邊。永遠可見，絕不移除。
- **版面規則。** thread 為單一置中閱讀欄（最大約 1100px）。側邊欄固定寬 288px、可收合。composer 固定在內容區底部、同樣最大寬度，context badge 內嵌在它左上角。頂列高 48px，面板開關與複製動作分置兩角。一切對齊 4px 間距網格。
- **圖示氣質。** 細、單線（見 ICONOGRAPHY）。Unicode 樹狀字符（`└`）與箭頭（`→ ➔`）刻意出現在 log 文字與側邊欄樹中。

---

## 圖示（ICONOGRAPHY）

- **系統：Lucide**（<https://lucide.dev>）。乾淨的 2px 單線描邊，在終端機調性的 UI 裡安靜合群。選 Lucide 是因為它是 shadcn/ui 生態系的預設圖示庫，與本系統的 shadcn 基礎一致。
- **載入：Lucide UMD**（JS，非 webfont）。在頁面載入一次 `<script src="https://unpkg.com/lucide@latest"></script>`（在 `_ds_bundle.js` 之前），`<Icon>` 元件就會從 `window.lucide` 讀取並渲染 SVG。用法 `<Icon name="copy" size={18} />`，名稱用 Lucide 的 kebab-case（`panel-left-open`、`chevron-right`、`at-sign`）或 PascalCase。
- **常用圖示：** `panel-left-open` / `panel-left-close`（側邊欄開關）、`copy`（複製）、`settings`（設定）、`chevron-right`（選擇器往下鑽）、`check`（選取／OK）、`x`（取消／關閉）、`plus` / `circle-plus`（新增／建立 context）、`clock`（時間戳）、`sun` / `moon`（主題切換）、`zap`（指令面板）、`folder` / `folder-open` / `file-text`（樹節點）、`at-sign`（context badge）、`trash-2`（刪除）。
- **Unicode 當圖示（刻意、對味）：** 側邊欄樹用 `└` 分枝字符；log 內文用 `→` 與 `➜` 表流向。這些是「內容」、以等寬字呈現，不是圖示。
- **不用 emoji。** 任何地方。
- **Logo／品牌標記：** 等寬字的 `▍` 游標 + `devlog` 字標，或方括號 `[ devlog ]` 鎖定樣式。見 `assets/` 與 Brand 卡片。

---

## 索引（INDEX）

根目錄清單 —— 各物件位置：

- `styles.css` —— 全域入口（只有 import）。**消費端連結這一個檔案。**
- `tokens/` —— `colors.css`、`typography.css`、`spacing.css`、`fonts.css`。
- `assets/` —— 品牌標記（`devlog-mark.svg` 等）與任何影像。
- `components/core/` —— 可重用基本元件：Button、IconButton、Kbd、ContextBadge、Composer、CommandList、ColumnPicker、Dialog、Tooltip、TreeNav、LogEntry、DateDivider、SegmentedControl、Switch、Tag、Icon、Logo。
- `ui_kits/devlog-app/` —— DevLog app 的完整互動重建（聊天視圖 + 三種 context 切換互動 + 建立對話框 + 側邊欄 + 設定）。
- 基礎 **卡片**（`*.card.html`）—— 填充 Design System 分頁（群組：Colors、Type、Spacing、Brand、Components）。
- `SKILL.md` —— 讓這個資料夾可作為可下載的 Agent Skill 使用。

各元件用法見其 `.prompt.md`；畫面清單見 UI kit 的 `README.md`。
