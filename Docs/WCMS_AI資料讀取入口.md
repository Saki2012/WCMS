# WCMS AI 專案資料讀取入口

本文件是 AI 進入 WCMS 專案時的資料導向 Prompt，負責指定 GitHub、Docs 與管理資料的讀取順序，以及資料不一致時的判斷原則。

本文件只負責導向與學習順序，不取代正式架構、開發規範、Git／Commit 規範或品質驗證文件。

---

## 1. GitHub Repository

Repository：`https://github.com/Saki2012/WCMS`

主要分支用途：

- `main`：Repository 預設分支，不可直接視為最新開發進度。
- `Feature/Dev`：共用功能與架構開發的主要核對分支。
- `Feature/Release`：版本發布前的整合與發布整理分支。
- `Spec####`：個別專案或客製站台分支，依本次任務確認。

開始分析或修改前，先確認 Repository、來源與目標分支、任務類型及附件基準。若無法存取 GitHub，必須明確說明並請使用者提供指定 Branch 的 ZIP 或必要檔案，不得假裝已核對最新版。

---

## 2. Docs 正式入口

每次新對話、開始大型功能或進行整體 Review 時，依序閱讀：

1. `Docs/README.md`
2. `Docs/AI_INDEX.yml`
3. 對應的系統架構與開發規範
4. 視任務追加 Git／Commit、品質驗證或開發歷程文件

### 2.1 系統架構

- 共通：`Docs/01_研發與技術文件/01_系統架構/01_整體專案架構.md`
- 前端：`Docs/01_研發與技術文件/01_系統架構/02_前端專案架構.md`
- 後端：`Docs/01_研發與技術文件/01_系統架構/03_後端專案架構.md`

### 2.2 開發規範

- 所有程式修改：`Docs/01_研發與技術文件/02_開發規範/01_共通開發規範.md`
- 前端追加：`Docs/01_研發與技術文件/02_開發規範/02_前端開發規範.md`
- 後端追加：`Docs/01_研發與技術文件/02_開發規範/03_後端開發規範.md`
- Commit、Branch、Issue、PR 或 Release：`Docs/01_研發與技術文件/02_開發規範/04_Git與Commit規範.md`

不得用舊對話、舊 Word、舊 Prompt 或 Legacy Code 取代目前有效的 Markdown 規範。

### 2.3 開發歷程與版本紀錄

涉及歷史優化、Release 或對外版本說明時閱讀：

`Docs/01_研發與技術文件/03_開發歷程與版本紀錄/01_開發歷程優化表.csv`

### 2.4 品質與驗證

涉及 AI 白箱、QA、AA、SSR／Freego、弱點掃描、複驗或 Release 驗證時，先閱讀：

`Docs/03_品質與驗證文件/README.md`

AI 白箱任務再依序閱讀：

1. `Docs/03_品質與驗證文件/01_AI白箱檢測/README.md`
2. `Docs/03_品質與驗證文件/01_AI白箱檢測/RULE_REGISTRY.yml`
3. 對應的需求與單元、專項或全專案白箱回歸檢測規範

QA 任務進入：

`Docs/03_品質與驗證文件/02_QA測試/`

尚在討論、草稿或未正式落地的流程，不得描述成已全面執行的正式規則。

### 2.5 專案與交付文件

面向 PM、客服、主管、QA 或客戶的 Word、Excel、PowerPoint、PDF，主要位於：

`Docs/02_專案與交付文件/`

其中的技術事實仍須回頭核對 GitHub 程式碼與 Markdown。

---

## 3. 資料來源責任

資料不一致時，依內容責任判斷：

1. 程式如何運作：GitHub 指定分支的程式碼與設定。
2. 系統應如何設計與開發：Docs 內有效的 Markdown 與正式規則清冊。
3. 修改原因與範圍：Git Commit、PR、Issue 與決策紀錄。
4. 待辦、收斂與複驗狀態：Google Sheet「WCMS_整合收斂管理表」。
5. 發布改善素材：開發歷程優化表、Release PR、Issue 與 Commit。
6. Office、PDF、ZIP：人工閱讀、交付、歷史或指定時間點快照。

發現不一致時，必須分別指出程式實況、文件規範、管理狀態及建議更新來源，不得自行解讀成一致。

---

## 4. 每次開始任務的學習順序

1. 確認 Repository、Branch、任務範圍與附件基準。
2. 閱讀 `Docs/README.md`。
3. 閱讀 `Docs/AI_INDEX.yml`。
4. 閱讀相關架構文件。
5. 閱讀共通與端別開發規範。
6. 視任務閱讀 Git／Commit、品質驗證或開發歷程文件。
7. 白箱任務追加閱讀白箱 README、`RULE_REGISTRY.yml` 與對應檢測模式。
8. 核對指定分支的實際程式碼。
9. 搜尋 SysCore、Library、Helper、Hook、Component、Template、Adapter、FeatureDriver、Service、Repository、Feature 與相近 Spec 的既有實作。
10. 搜尋相關 Issue、PR、Commit 與歷史修正。
11. 再提出問題判斷與修改方案。

不得在未確認既有能力前，直接建立重複 Helper、平行流程或新的架構層。

---

## 5. 分析與修改原則

- 區分已實作、正式規範、已知未整改、規劃中與無法確認。
- 優先沿用 WCMS 現有框架、共用能力、命名與資料流。
- Legacy Code 與新規範不一致時指出差異，不反向修改規範迎合舊程式。
- 修改範圍聚焦本次需求，不順手大幅改動無關檔案。
- 涉及 AA、SSR／CSR、弱點掃描、多語系、Cache、JWT、API 契約或 Spec 行為時，說明影響範圍。
- 複雜需求分階段處理，每次提供可驗證的小步驟。
- 未實際執行 Build、測試、Freego、弱掃或部署時，不得聲稱已通過。

詳細 Code Style、Function、Region、註解、Hook、FeatureDriver、Commit 與 PR 格式，直接遵循 Docs 對應規範。

---

## 6. 文件同步與稽核

架構、規範、流程、資料契約或責任邊界調整時，必須判斷是否影響現有 Markdown、AI_INDEX 或規則清冊。

每完成一輪功能或架構收斂後，檢查：

- 架構與程式是否一致。
- 共通、前端、後端與品質規範是否矛盾。
- 檔名、路徑與相對連結是否有效。
- 完成、處理中、風險與規劃描述是否正確。
- Office／PDF 是否仍引用過期內容。

合併 `Feature/Release` 前，再執行大範圍文件一致性檢查。

---

## 7. 附件與外部資料

- 使用者要求參閱附件時必須實際解析，不得只依檔名或舊對話推測。
- Office、PDF 與 ZIP 應核對版本、日期及適用範圍。
- Markdown 通常作為可版控來源，Office／PDF 作為閱讀、簡報或固定版輸出。
- 公司其他專案資料不得視為 WCMS 技術規範。
- 修改 Google Sheet 前，先讀取目前欄位與選單值。

---

## 8. 回覆與交付

- 使用繁體中文。
- 先說明問題與判斷依據，再提出修改方向。
- 列出異動檔案、修改原因、影響範圍與驗證方式。
- 資料或權限不足時誠實說明。

本文件的核心責任是將 AI 導向正確的 GitHub、Docs 與管理資料；正式規則更新時優先更新 Docs，本入口只維護導向順序。
