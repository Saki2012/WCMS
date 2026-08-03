# WCMS Git 與 PR 規範

> 文件狀態：Draft v0.1  
> 適用 Repository：`Saki2012/WCMS`  
> 適用範圍：Feature、Release Hotfix、Spec  
> 最後整理：2026-08-03

> [!NOTE]
> 本文件規範 WCMS 的 Git 修改類型、Commit Summary／Description、Pull Request 說明與 Issue 關聯方式。
>
> Commit 與 PR 內容除了提供開發者閱讀，也會作為後續 AI 解析專案歷程、問題原因、修正決策與客戶影響的資料來源，因此必須使用固定標題與明確語意。

---

## 1. 基本原則

### 1.1 GitHub 為程式碼主來源

程式碼狀態與修改判斷，以 GitHub 最新分支內容為準。

- ZIP 僅作為歷史版本或輔助比對。
- 開始修改前，必須確認 Repository、來源分支與目標分支。
- 不得在錯誤分支完成修改後，再以大量 Cherry-pick 或人工複製補救。
- 共用問題應回到 Feature 主線修正，不在各 Spec 重複建立不同版本。

### 1.2 一次修改聚焦一個目的

一個 Commit 或 PR 應有明確主題，例如：

- 修正一個 Bug。
- 完成一個功能。
- 收斂一個共用底層。
- 處理一組不可分割的前後端契約。
- 完成一個 Hotfix。

> [!WARNING]
> 不得將互不相關的功能、排版整理、重構與 Bug 修正全部混在同一個 Commit／PR。
>
> 若修改內容無法用一句 Summary 清楚說明，通常代表範圍需要重新拆分。

### 1.3 不保留無效或暫時 Code

Git 修改遵循 `01_共通開發規範.md`：

- 不保留 Obsolete Code。
- 不以註解保留舊實作。
- 不提交臨時測試資料。
- 不提交 Debug Log。
- 不提交 Secret、Token、密碼或本機環境資料。
- 不提交與本次修改無關的大量格式變動。

---

## 2. Git 修改的三種基本類型

### 2.1 Feature／Dev 開發

適用範圍：

- WCMS 共用 Feature 功能。
- SysCore 與共用 Library。
- 新功能開發。
- 一般 Bug 修正。
- 共用架構調整。
- 後續應提供所有 Spec 使用的能力。

基本流程：

```text
確認最新 Feature/Dev
    ↓
建立或切換開發分支
    ↓
完成修改與驗證
    ↓
建立 PR
    ↓
PR Target：Feature/Dev
```

> [!NOTE]
> 可被多個專案重複使用的修正，應優先進入 `Feature/Dev`，再由各 Spec 同步使用，不應只存在單一 Spec。

### 2.2 Feature／Release 發布整合與 Hotfix

適用範圍：

- 已在 `Feature/Dev` 完成、準備進入正式版本的功能與修正。
- 發布版本號、Release 說明、文件與必要驗證的整合。
- 發布前的跨功能回歸與最後確認。
- 已發布版本的緊急錯誤、資安、登入、資料錯誤或服務中斷修正。

一般發布流程：

```text
確認 Feature/Dev 的發布候選範圍
    ↓
建立 Release PR
    ↓
PR Target：Feature/Release
    ↓
補齊版本號與開發歷程資料
    ↓
完成發布前回歸與文件稽核
    ↓
合併並進行正式發布作業
```

Hotfix 流程：

```text
確認正式版本與 Feature/Release
    ↓
建立並限制 Hotfix 修改範圍
    ↓
完成必要回歸
    ↓
PR Target：Feature/Release
    ↓
合併後同步回 Feature/Dev
```

> [!WARNING]
> `Feature/Release` 用於發布候選整合、版本確認與必要 Hotfix，不作為日常一般功能開發分支。
>
> Hotfix 合併後，必須確認相同修正已同步回 `Feature/Dev`，避免下一版重新出現相同問題。

Release PR Description 必須額外說明：

- 發布版本號。
- 本次納入的功能、修正與排除範圍。
- 開發歷程優化表及對外說明整理狀態。
- Build、回歸、AA、SSR／CSR、弱掃或其他實際執行的驗證結果。
- 已知風險、未完成項目與相關文件更新狀態。

Hotfix Description 必須額外說明：

- 正式環境症狀與緊急程度。
- 影響範圍及是否涉及資料修正。
- 回歸測試結果。
- 同步回 `Feature/Dev` 的狀態。

### 2.3 Spec 開發

目前 Spec 分支依專案區分，例如：

```text
Spec1810
Spec1816
Spec1817
Spec1818
Spec1819
Spec1820
Spec1821
```

適用範圍：

- 單一 Spec 專案的 UI、版型與內容。
- Spec 專用功能。
- Spec 專用 Route、Assets 或設定。
- 無法進入共用 Feature 的客製需求。

基本流程：

```text
確認對應 Spec 分支
    ↓
確認是否需要同步最新 Feature/Dev
    ↓
完成 Spec 修改與驗證
    ↓
建立 PR
    ↓
PR Target：對應 Spec#### 分支
```

> [!WARNING]
> 發現問題屬於共用 Feature、SysCore、Library 或 API 契約時，不應只在 Spec 中修補。
>
> 應先回到 `Feature/Dev` 完成共用修正，再將結果同步至需要的 Spec。

Spec Description 必須說明：

- Spec 編號。
- 是否為純 Spec 客製。
- 是否修改或依賴 Feature 共用能力。
- 是否需要同步其他 Spec。
- 是否影響 Feature／Spec Fallback。

---

## 3. Commit Summary 規範

### 3.1 Summary 的用途

Summary 是 Commit 的簡短標題，用來回答：

> 這次修改最主要完成了什麼？

建議格式：

```text
[技術或專案範圍] 功能單元：修改結果（#Issue）
```

範例：

```text
FE 首頁輪播：補齊鍵盤操作與圖片報讀（#123）
BE 問卷：統一刪除失敗回應格式（#456）
FE/BE 帳號管理：修正密碼變更錯誤判斷（#789）
HOTFIX BE 登入：修正 Token 續期失敗（#810）
Spec1816 FE 行事曆：修正語系切換資料錯置（#822）
Docs：新增前端 Code Review 技術規範
```

### 3.2 Summary 撰寫原則

Summary 應：

- 簡短。
- 能辨識前端、後端、前後端或 Spec。
- 指出功能單元。
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

### 4.1 Description 固定結構

Commit Description 使用固定標題：

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
> 四個區塊原則上保留固定名稱，方便 AI 與開發者辨識。
>
> 沒有 Issue 時仍保留欄位並填寫 `無`，不要省略標題。

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

Description 應說明決策與結果，不只列檔名。

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
已完成鍵盤操作、焦點順序與 SSR Build 驗證。
```

### 4.4 AI 可解析性要求

為了讓 Commit／PR 成為可追蹤的 AI 資料來源：

- 使用固定標題。
- 使用完整功能名稱，不只寫「這個」或「那邊」。
- 明確區分問題原因與處理方式。
- 明確寫出已完成與尚未完成。
- 重要決策要說明理由。
- 有 Feature、Spec、AA、SSR、API、型別或弱掃影響時直接標示。
- 不把不同 Issue 混成一段模糊描述。
- 不記錄 Token、密碼、連線字串或其他敏感資料。

---

## 5. Pull Request Summary 規範

PR Summary／Title 延續 Commit Summary 原則，但描述整個 PR 最終完成的結果。

建議格式：

```text
[範圍] 功能單元：完成結果（#Issue）
```

範例：

```text
FE API Adapter：統一 ApiResponse 陣列型別與錯誤處理（#901）
HOTFIX BE Account：修正正式環境密碼變更錯誤流程（#902）
Spec1820 FE 首頁：完成輪播鍵盤操作與 AA 報讀（#903）
FE/BE Survey：統一問卷表單新增與更新契約（#904）
```

> [!WARNING]
> PR Summary 應描述合併後的結果，不以最後一個 Commit 標題代替整體說明。

---

## 6. Pull Request Description 規範

### 6.1 PR Description 固定模板

```md
## 變更摘要

用一至三句說明本次 PR 完成的範圍與結果。

## 修改原因

說明原問題、需求背景、發生條件與為何需要修改。

## 解決方案

說明採用的處理方式、主要流程、共用底層使用方式及重要技術決策。

## 對外效益

說明對使用者或客戶的實際改善，例如：

- 功能可正常使用。
- 操作更直覺。
- 降低資料錯誤。
- 提升穩定性。
- 符合 AA。
- 支援 SSR／Freego。
- 降低弱點掃描風險。
- 改善維運與後續擴充。

## 影響範圍

- 前端：
- 後端：
- Feature：
- Spec：
- API／DB：
- AA／SSR／弱掃：

## 驗證結果

- [ ] 功能操作驗證
- [ ] Typecheck／編譯
- [ ] CSR Build
- [ ] SSR Build
- [ ] API 對接
- [ ] AA 鍵盤與報讀
- [ ] 其他：

## 關聯 Issue

- #123

## 風險與後續

說明已知限制、未完成項目、需觀察事項、同步分支或後續 Issue；沒有時填寫「無」。
```

### 6.2 三個必要核心

PR Description 最少必須清楚回答：

1. **原因**：為什麼要改？
2. **解方**：實際怎麼解決？
3. **對外效益**：對使用者或客戶好在哪裡？

> [!NOTE]
> `變更摘要` 是結果概覽；`修改原因` 是問題背景；`解決方案` 是技術決策；`對外效益` 是客戶與使用者價值。
>
> 四者不得全部寫成相同內容。

### 6.3 技術細節的撰寫尺度

PR Description 不需要貼完整 Code，但應記錄：

- 重要資料流程。
- 新增或調整的共用入口。
- 是否改變 API 契約。
- 是否涉及 DB 或資料轉換。
- 是否影響 Feature／Spec。
- 是否影響 AA、SSR、弱掃或多國語系。
- 是否有相容性處理。
- 是否需要其他分支同步。

---

## 7. Issue 關聯規範

### 7.1 關聯 Issue 必須列出

有需求單、Bug 單、AA 檢測單或 Code Review Issue 時，Summary 與 Description 應列出單號。

```text
【關聯 Issue】
#123
#456
```

或 PR：

```md
## 關聯 Issue

- #123
- #456
```

### 7.2 Issue 關聯與自動關閉

WCMS 一般 PR 主要 Target 為：

- `Feature/Dev`
- `Feature/Release`
- `Spec####`

這些並非 Repository 預設分支時，不應只依賴 `Closes #123`、`Fixes #123` 等關鍵字自動關聯或關閉 Issue。

一般開發 PR 建議：

```text
Related Issue：#123
```

並在 GitHub PR 側欄手動連結 Issue。

當最終 PR Target 為預設分支，且合併後確定應關閉 Issue 時，才使用：

```text
Closes #123
Fixes #123
Resolves #123
```

> [!WARNING]
> 不得在尚未完成驗收、仍需同步其他分支或只完成部分需求時，提前使用自動關閉語意。

### 7.3 多張 Issue

每張 Issue 分開列出，必要時標示關係：

```md
## 關聯 Issue

- 完成：#123
- 部分處理：#456
- 延伸發現：#789
```

> [!NOTE]
> 「部分處理」或「延伸發現」不得使用 `Closes`／`Fixes`。

---

## 8. 分支同步規範

### 8.1 Feature／Release 與 Feature／Dev 同步

一般 Release PR 應以已完成核對的 `Feature/Dev` 發布候選範圍為基礎。

Hotfix 直接合併至 `Feature/Release` 後：

- 必須確認是否同步至 `Feature/Dev`。
- 有受影響 Spec 時，再確認 Spec 同步。
- PR Description 記錄同步狀態。
- 不允許只修正式分支，讓下一版重新帶回舊問題。

### 8.2 Feature／Dev 同步至 Spec

Feature 共用修正完成後：

- 確認哪些 Spec 受影響。
- 由對應流程同步 Feature 變更。
- 處理 Spec 衝突時，不得破壞 Feature 主線行為。
- Spec 特殊差異應保留在 Spec 擴充點。

### 8.3 Spec 發現共用問題

Spec 開發過程發現共用問題時：

```text
停止在 Spec 複製修正
    ↓
確認問題屬於 Feature／SysCore／Library
    ↓
回 Feature/Dev 修正
    ↓
完成共用驗證
    ↓
再同步回 Spec
```

---

## 9. PR 合併前檢查

### Git 與範圍

- [ ] 已確認正確來源分支與 Target 分支。
- [ ] PR 只處理一個明確主題或一組不可分割的修改。
- [ ] 沒有混入無關格式化、Debug Code 或本機設定。
- [ ] 沒有 Secret、Token、密碼或敏感資料。

### Summary 與 Description

- [ ] Summary 能用一句話說明最終結果。
- [ ] 已寫明修改原因。
- [ ] 已寫明解決方案。
- [ ] 已寫明對外／客戶效益。
- [ ] 已列出影響範圍。
- [ ] 已列出驗證結果。
- [ ] 已列出關聯 Issue 或填寫「無」。
- [ ] 已列出風險、同步狀態與後續事項。

### 分支類型

- [ ] Feature 共用修正 Target 為 `Feature/Dev`。
- [ ] Release 整合或 Hotfix Target 為 `Feature/Release`。
- [ ] Release PR 已補齊版本、發布範圍、驗證與文件狀態；Hotfix 已安排回同步。
- [ ] Spec 修改 Target 為正確的 `Spec####`。
- [ ] Spec 中發現的共用問題已回到 Feature 主線處理。

### AI 可解析性

- [ ] 使用固定標題。
- [ ] 沒有「這個、那邊、一些問題」等模糊描述。
- [ ] 已完成與未完成項目有明確區分。
- [ ] 重要技術決策有說明原因。
- [ ] 未包含敏感資料。
