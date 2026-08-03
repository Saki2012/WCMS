# WCMS Git 與 Commit 規範

> 文件版本：Version 1.0  
> 適用 Repository：`Saki2012/WCMS`  
> 適用範圍：`Feature/Dev`、`Feature/Release`、`Spec####`  
> 最後整理：2026-08-03

> [!NOTE]
> 本文件目前只規範 Commit 的建立流程，以及 GitHub Desktop 使用的 `Summary` 與 `Description`。
>
> 分支整合、審查與其他協作流程尚未正式導入，本版不先建立規則。

---

## 1. 基本原則

### 1.1 GitHub 為程式碼主來源

程式碼狀態與修改判斷，以 GitHub 指定分支的最新內容為準。

- 開始修改前，必須確認 Repository、目前分支與任務範圍。
- ZIP 僅作為指定時間點、歷史版本或輔助比對資料。
- 共用問題應優先回到 `Feature/Dev` 修正，不在各 Spec 重複建立不同版本。
- 不得因切錯分支，再以大量人工複製或不明來源檔案補救。

### 1.2 一個 Commit 聚焦一個目的

一個 Commit 應有明確主題，例如：

- 修正一個 Bug。
- 完成一個功能。
- 收斂一個共用底層。
- 處理一組不可分割的前後端契約。
- 完成一個緊急修正。
- 整理一個明確範圍的文件。

> [!WARNING]
> 不得將互不相關的功能、排版整理、重構與 Bug 修正全部混在同一個 Commit。
>
> 若修改內容無法用一句 Summary 清楚說明，通常代表應拆成不同 Commit。

### 1.3 不提交無效或敏感內容

Git 修改遵循 [`01_共通開發規範.md`](./01_共通開發規範.md)：

- 不保留 Obsolete Code。
- 不以註解保存舊實作。
- 不提交臨時測試資料。
- 不提交 Debug Log。
- 不提交 Secret、Token、密碼、連線字串或本機環境資料。
- 不提交與本次修改無關的大量格式變動。

---

## 2. Commit 建立流程

### 2.1 共通流程

```text
確認 Repository 與正確分支
    ↓
Fetch／Pull 最新內容
    ↓
完成修改與必要驗證
    ↓
檢查 Changes 與 Diff
    ↓
填寫 Summary 與 Description
    ↓
Commit 至目前分支
    ↓
Push Origin
    ↓
確認遠端分支已更新
```

建立 Commit 前應確認：

- 目前分支正確。
- 修改檔案皆屬於本次任務。
- 沒有誤刪檔案、無關格式化或本機設定。
- 已執行與修改範圍相符的檢查。
- 未實際執行的驗證，不得寫成已通過。

### 2.2 `Feature/Dev`

適用範圍：

- WCMS 共用 Feature。
- SysCore 與共用 Library。
- 新功能開發。
- 一般 Bug 修正。
- 共用架構與文件調整。

可被多個專案使用的修正，應優先進入 `Feature/Dev`，再依需要同步至各 Spec。

### 2.3 `Feature/Release`

適用範圍：

- 發布候選內容整理。
- 正式版本號與發布資料更新。
- 發布前驗證與文件稽核。
- 已發布版本的必要緊急修正。

建立 Release 或 Hotfix Commit 時，Description 應視情況補充：

- 發布版本號。
- 納入與排除範圍。
- 實際完成的 Build、回歸、AA、SSR／CSR 或弱點掃描結果。
- 已知風險與未完成事項。
- 是否需要將相同修正同步回 `Feature/Dev`。

> [!WARNING]
> `Feature/Release` 不作為日常一般功能開發分支。

### 2.4 `Spec####`

適用範圍：

- 單一專案的 UI、版型與內容。
- Spec 專用功能、Route、Assets 或設定。
- 無法進入共用 Feature 的客製需求。

Spec Commit 的 Description 應視情況補充：

- Spec 編號。
- 是否為純 Spec 客製。
- 是否修改或依賴 Feature 共用能力。
- 是否需要同步其他 Spec。
- 是否影響 Feature／Spec Fallback。

發現問題屬於 Feature、SysCore、Library 或共用 API 契約時，應先回到 `Feature/Dev` 處理，不在 Spec 內複製修正。

---

## 3. Commit Summary 規範

### 3.1 Summary 的用途

Summary 是 Commit 的簡短標題，用來回答：

> 這次修改最主要完成了什麼？

建議格式：

```text
[技術或專案範圍] 功能單元：完成結果（#Issue）
```

範例：

```text
FE 首頁輪播：補齊鍵盤操作與圖片報讀（#123）
BE 問卷：統一刪除失敗回應格式（#456）
FE/BE 帳號管理：修正密碼變更錯誤判斷（#789）
HOTFIX BE 登入：修正 Token 續期失敗（#810）
Spec1816 FE 行事曆：修正語系切換資料錯置（#822）
Docs：建立第一版文件架構與資料讀取入口
```

### 3.2 Summary 撰寫原則

Summary 應：

- 簡短且可辨識修改結果。
- 能辨識前端、後端、前後端、文件或 Spec。
- 指出功能單元或影響範圍。
- 使用完成結果，不只寫「調整」或「修改」。
- 有關聯 Issue 時附上單號。

不建議：

```text
修正問題
更新 Code
調整前端
fix bug
修改一些東西
```

建議：

```text
FE PDF Viewer：新增第一頁與最後一頁控制
BE Account：阻止錯誤舊密碼繼續變更
Spec1819 Journal：修正語系切換後資料錯置
```

---

## 4. Commit Description 規範

### 4.1 固定結構

Description 使用下列固定標題：

```text
【修改原因】
說明問題為何發生，以及本次為何需要修改。

【處理方式】
說明實際採用的解法、主要修改位置與重要技術決策。

【對外效益】
說明對使用者、客戶、維運、AA、SSR、弱點掃描或穩定性有何改善。

【關聯 Issue】
#123
```

> [!NOTE]
> 四個區塊原則上保留固定名稱，方便開發者與 AI 辨識。
>
> 沒有 Issue 時仍保留欄位並填寫 `無`。

### 4.2 視需要追加的欄位

修改較複雜時，可以追加：

```text
【影響範圍】
列出受影響的功能、頁面、API、Feature 或 Spec。

【驗證結果】
列出已完成的 Typecheck、Build、操作測試、AA、SSR 或 API 驗證。

【風險與後續】
列出尚未處理、需觀察、需同步或另開 Issue 的事項。
```

### 4.3 Description 撰寫原則

Description 應說明決策與結果，不只列出檔名。

不建議：

```text
修改 A.tsx
修改 B.ts
修正 API
```

建議：

```text
【修改原因】
首頁輪播只能使用滑鼠操作，鍵盤使用者無法取得每張圖片的替代文字。

【處理方式】
補上輪播控制項的鍵盤操作與焦點管理，並在切換投影片時更新可報讀資訊。

【對外效益】
鍵盤與螢幕閱讀器使用者可完整取得輪播內容，降低 AA 檢測退件風險。

【關聯 Issue】
#123

【驗證結果】
已完成鍵盤操作與焦點順序檢查；尚未執行 Freego 正式檢測。
```

### 4.4 AI 可解析性要求

- 使用固定標題。
- 使用完整功能名稱，不只寫「這個」或「那邊」。
- 明確區分問題原因與處理方式。
- 明確寫出已完成與尚未完成。
- 重要決策要說明理由。
- 有 Feature、Spec、AA、SSR、API、型別或弱掃影響時直接標示。
- 不把不同 Issue 混成一段模糊描述。
- 不記錄 Token、密碼、連線字串或其他敏感資料。

---

## 5. 關聯 Issue

有需求單、Bug 單、AA 檢測單或 Code Review Issue 時，在 Summary 或 Description 中列出單號。

```text
【關聯 Issue】
#123
#456
```

尚未完成驗收、只處理部分需求或仍需後續作業時，Description 應清楚寫明目前完成範圍，不得讓 Commit 訊息看起來像已完整結案。

---

## 6. Commit 前檢查

### Git 與範圍

- [ ] 已確認 Repository 與正確分支。
- [ ] 本次 Commit 只有一個明確主題或一組不可分割的修改。
- [ ] 沒有混入無關格式化、Debug Code 或本機設定。
- [ ] 沒有 Secret、Token、密碼或敏感資料。
- [ ] 已檢查 Changes 與 Diff。

### Summary 與 Description

- [ ] Summary 能用一句話說明最終結果。
- [ ] Description 已寫明修改原因。
- [ ] Description 已寫明處理方式。
- [ ] Description 已寫明對外效益。
- [ ] 已列出關聯 Issue 或填寫「無」。
- [ ] 複雜修改已補充影響範圍、驗證結果或風險與後續。

### 驗證與同步

- [ ] 已執行與本次修改相符的檢查。
- [ ] 未執行的驗證沒有寫成已通過。
- [ ] Feature 共用修改已確認可能受影響的 Spec。
- [ ] Spec 中發現的共用問題已回到 Feature 主線處理。
- [ ] Release／Hotfix 修改已確認是否需要同步回 `Feature/Dev`。
