# DevLog — UI kit

**DevLog** app 的高保真互動重建：一款給開發者、像聊天介面的個人工作紀錄。這是 `components/core` 基本元件組合而成的產品表面。

開啟 **`index.html`** 看完整可點擊的 app。

> 注意：app 內所有介面文案與 log 內容皆為英文（依本系統的語言慣例：widget 內容英文、文件繁中）。

## 畫面與狀態

`index.html` 是單一活的 app（一個真實視圖，不是 storybook）。它展示：

- **主聊天視圖** —— 依時間順序的 log thread、日期分隔列、固定 composer 上方的 context badge、可收合的側邊欄樹、頂列複製動作。
- **`/` 指令面板** —— 在 composer 輸入 `/` → 扁平、可過濾的完整 context path 清單。↑/↓ 移動、↵ 切換。
- **`cd` + Tab 欄位選擇器** —— 輸入 `cd `（可帶部分路徑）再按 **Tab** → macOS Finder 風格的層疊欄位；點擊往下鑽，葉節點即提交。
- **點擊 context badge**（頂列或 composer）→ 開啟同一個欄位選擇器。
- **找不到就建立** —— 在 `/` 面板中，若輸入內容無任何符合項，按 ↵ 開啟 **Create Context** 確認對話框。
- **設定** —— 側邊欄齒輪 → Theme（淺／深色，即時）+ Copy Context Range（Today / Last Week / All）。
- **滑過某則 log** → 顯示時間戳 + context badge + 複製按鈕。
- **新增一則紀錄** —— 輸入筆記後按 ⌘/Ctrl+↵（或送出鈕）；它會以彈性進場附加上去。

## 檔案

- `index.html` —— 入口；載入 React、DS bundle、`data.js` 與各畫面模組。
- `data.js` —— context paths、巢狀樹、側邊欄樹、種子 log 紀錄（`window.DevLogData`）。
- `DevLogApp.jsx` —— 協調器；持有所有互動狀態、串接三種 context 切換流程。
- `Sidebar.jsx` —— 可收合的 context 樹 + 標頭（logo、設定、收合）。
- `Thread.jsx` —— 依日期分組的 log 紀錄 + 空狀態。
- `SettingsModal.jsx` —— 主題 + 複製範圍設定。

## 組成

幾乎全由 `components/core` 構成：`Composer`、`ContextBadge`、`CommandList`、`ColumnPicker`、`Dialog`、`LogEntry`、`DateDivider`、`TreeNav`、`IconButton`、`SegmentedControl`、`Switch`、`Tag`、`Icon`、`Logo`。本 kit 只加入版面與互動的黏合層 —— 不在此重新實作任何基本元件。

所有內容（CAD-agent / hython 工作紀錄、context paths）皆依附件 `DevLog.fig` wireframe 重建。視覺方向（深色、終端機式安靜）為本設計系統所定，依需求說明推進到灰階 wireframe 之外。
