# WCMS Git 與 Commit 規範

> 文件版本：Version 1.1  
> 適用 Repository：`iteasygo/WCMS`  
> 適用範圍：`Feature/Dev`、`Feature/Release`、`Spec####`  
> 最後整理：2026-09-07

> [!NOTE]
> 本文件規範 Commit 建立流程、GitHub Desktop 使用的 `Summary` 與 `Description`，以及完成修改單元時的交付與變更說明。
>
> 分支整合、人工作業審查與完整 PR 協作流程尚未正式導入；已建立的 AI 白箱 Gate 依 [`AI 白箱檢測 README`](../../03_品質與驗證文件/01_AI白箱檢測/README.md) 執行。

---

## 1. 基本原則

### 1.1 GitHub 為程式碼主來源

程式碼狀態與修改判斷，以 GitHub 指定分支的最新內容為準。

- 開始修改前，確認 Repository、分支與任務範圍。
- ZIP 僅作為指定時間點、歷史版本或輔助比對資料。
- 共用問題優先回到 `Feature/Dev` 修正，不在各 Spec 重複建立不同版本。
- 不得因切錯分支，再以大量人工複製或不明來源檔案補救。

### 1.2 一個 Commit 聚焦一個目的

一個 Commit 應有明確主題，例如 Bug 修正、功能完成、共用底層收斂、不可分割的前後端契約、緊急修正或明確範圍的文件整理。

> [!WARNING]
> 不得將互不相關的功能、排版、重構與 Bug 修正混在同一個 Commit。若無法用一句 Summary 清楚說明，通常應拆分。

### 1.3 不提交無效或敏感內容

依 [`01_共通開發規範.md`](./01_共通開發規範.md)：

- 不保留 Obsolete Code 或以註解保存舊實作。
- 不提交臨時測試資料、Debug Log 或無關格式變動。
- 不提交 Secret、Token、密碼、連線字串或本機環境資料。

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
整理交付與變更說明
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
    ↓
準備 PR 時執行 AI 白箱 Gate
```

建立 Commit 前確認：

- 分支正確，修改檔案皆屬本次任務。
- 沒有誤刪、無關格式化或本機設定。
- 已完成交付與變更說明。
- 已執行與修改範圍相符的檢查。
- 未執行的驗證沒有寫成通過。

### 2.2 Push／PR 與 AI 白箱 Gate

Commit 並 Push 後，若準備建立或更新 PR，依 [`AI 白箱檢測 README`](../../03_品質與驗證文件/01_AI白箱檢測/README.md) 執行：

1. **需求與單元 Gate**：每個 PR 原則上必跑。
2. **專項 Gate**：判斷是否觸發 Cache、SSR、AA、API、JWT、Auditing、Feature／Spec 或日期時間等專項。
3. **全專案回歸 Gate**：判斷是否達到大型底層重構、里程碑或 Release 前的觸發條件。

AI 白箱使用已 Commit 且 Push 的版本，並以 Commit SHA 鎖定；AI 只提供分析、證據與建議，最終判定仍由 RD 負責。

> [!NOTE]
> 一般 PR 不代表三種檢測都完整執行，而是都要完成 Gate 判斷。

### 2.3 `Feature/Dev`

適用於共用 Feature、SysCore、Library、新功能、一般 Bug 與共用文件。可被多個專案使用的修正，優先進入 `Feature/Dev`。

### 2.4 `Feature/Release`

適用於發布候選、正式版本號、發布前驗證與必要 Hotfix。Description 視需要補充版本、納入與排除範圍、實際驗證結果、已知風險及是否同步回 `Feature/Dev`。

> [!WARNING]
> `Feature/Release` 不作為日常一般功能開發分支。

### 2.5 `Spec####`

適用於單一專案 UI、版型、內容、Spec 專用功能、Route、Assets 或設定。

Description 視需要補充 Spec 編號、是否純客製、是否修改 Feature、是否同步其他 Spec 及 Fallback／Override 影響。共用問題應回到 `Feature/Dev`，不在 Spec 複製修正。

### 2.6 WCMS 系統版本號與升版規則

WCMS 的系統版本號用來區分 Feature Release、Release Hotfix、Backend DB Model 與 Spec 專案客製版本。版本號必須依實際異動端別與版本責任調整，不得把不同層級的版號混用。

#### 2.6.1 Frontend Feature 版本

Frontend Feature 版本格式：

```text
1.{ReleaseVersion}.{Patch}
```

各欄位定義：

- `1`：目前 WCMS Major Version。
- `ReleaseVersion`：`Feature/Dev` 整合至 `Feature/Release` 時的 Feature 發布版號。
- `Patch`：已進入 `Feature/Release` 後，直接於 Release 上進行 Hotfix 的修正版號。

Frontend Spec 版本接在 Feature 版本後：

```text
1.{ReleaseVersion}.{Patch}-R{SpecVersion}
```

其中 `SpecVersion` 為該 `Spec####` 的專案修改版號。

#### 2.6.2 Backend Feature 版本

Backend Feature 版本格式：

```text
1.{ReleaseVersion}.{ModelVersion}.{Patch}
```

各欄位定義：

- `1`：目前 WCMS Major Version。
- `ReleaseVersion`：`Feature/Dev` 整合至 `Feature/Release` 時的 Feature 發布版號。
- `ModelVersion`：Backend DB Model 契約版號；只有 DB Model 契約版本異動時才調整。
- `Patch`：已進入 `Feature/Release` 後，直接於 Release 上進行 Hotfix 的修正版號。

Backend Spec 版本接在 Feature 版本後：

```text
1.{ReleaseVersion}.{ModelVersion}.{Patch}-R{SpecVersion}.{SpecModelVersion}
```

其中：

- `SpecVersion`：該 `Spec####` 的專案修改版號。
- `SpecModelVersion`：該 Spec 專用 DB Model 契約版號；只有 Spec DB Model 契約版本異動時才調整。

#### 2.6.3 `Feature/Dev` → `Feature/Release`

每一次新的 `Feature/Dev` 整合至 `Feature/Release` 時：

1. 只對本次實際有程式或功能異動的端別增加 `ReleaseVersion`。
2. 該端別的 `Patch` 一律重設為 `0`，重新開始計算。
3. 未異動的端別維持原正式版本號，不因另一端升版而同步增加。
4. Backend 的 `ModelVersion` 不因一般 Dev → Release 自動增加；只有 DB Model 契約版本實際異動時才調整。

例如：

```text
原正式版本：
FE 1.8.1
BE 1.8.3.0

本次 Dev → Release 只有 Frontend 異動：
FE 1.9.0
BE 1.8.3.0
```

因此 `FE 1.8.1` 在下一次新的 Dev → Release 後應進入 `FE 1.9.0`，不是 `FE 1.8.2`；`1.8.2` 的語意應是同一個 `1.8` Release Line 上的第二次 Release Hotfix。

若 Frontend 與 Backend 都有實際異動，兩端各自增加自己的 `ReleaseVersion`，並將各自 `Patch` 重設為 `0`。

#### 2.6.4 `Feature/Release` Hotfix

已進入 `Feature/Release` 後，若不重新走一個新的 Dev → Release，而是直接針對目前 Release Line 進行 Hotfix：

- `ReleaseVersion` 維持不變。
- `ModelVersion`／`SpecModelVersion` 依各自 DB Model 契約規則判斷，不因一般 Hotfix 自動增加。
- 只有實際異動端別的 `Patch + 1`。

例如：

```text
FE 1.9.0
→ Release Hotfix
→ FE 1.9.1

BE 1.9.3.0
→ Release Hotfix
→ BE 1.9.3.1
```

下一次新的 Dev → Release 時，Patch 不延續累加，而是重新歸零：

```text
FE 1.9.1
→ 下一次 Dev → Release
→ FE 1.10.0
```

#### 2.6.5 Spec 版本

Spec 版本獨立描述單一專案的客製修改，不取代 Feature Version。

Frontend：

```text
FE 1.{ReleaseVersion}.{Patch}-R{SpecVersion}
```

Backend：

```text
BE 1.{ReleaseVersion}.{ModelVersion}.{Patch}-R{SpecVersion}.{SpecModelVersion}
```

Spec 功能修改時調整 `SpecVersion`；Spec DB Model 契約版本異動時調整 `SpecModelVersion`。共用 Feature 問題仍應回到 `Feature/Dev` 修正，不以增加 Spec Version 取代共用主線修正。

---

## 3. Commit Summary 規範

### 3.1 用途與格式

Summary 回答「這次修改最主要完成了什麼？」

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
Docs：建立 AI 白箱檢測第一版流程
```

Summary 應簡短、可辨識端別與功能、描述完成結果，有 Issue 時附上單號；避免「修正問題」、「更新 Code」、「調整前端」等模糊文字。

---

## 4. Commit Description 規範

### 4.1 固定結構

```text
【修改原因】
說明問題與修改必要性。

【處理方式】
說明解法、主要修改位置與技術決策。

【對外效益】
說明對使用者、客戶、維運、AA、SSR、弱掃或穩定性的改善。

【關聯 Issue】
#123；沒有時填寫「無」。
```

複雜修改可追加：

```text
【影響範圍】
【驗證結果】
【風險與後續】
```

### 4.2 AI 可解析性要求

- 使用固定標題與完整功能名稱。
- 區分問題原因、處理方式、已完成與未完成。
- 重要決策說明理由。
- Feature、Spec、AA、SSR、API、型別或弱掃影響直接標示。
- 不混合不同 Issue，不記錄敏感資料。

---

## 5. 開發交付與變更說明

### 5.1 適用時機

完成可獨立交付或驗證的修改單元、回傳修改檔案或 ZIP、完成可驗證階段、建立 Commit 或 Push 時，開發者或 AI 必須提供變更說明。純分析或需求釐清時不必提前產出。

### 5.2 必要交付資訊

- **完成項目**：實際完成的功能或修正結果。
- **異動單元**：新增、修改或刪除的檔案與功能單元。
- **沿用能力與架構**：實際使用的重要 Library、Hook、Component、Template、Adapter、FeatureDriver、Service 或 Repository。
- **共用能力異動**：是否新增或擴充共用能力；沒有時填寫「無」。
- **影響與驗證**：影響範圍，以及已完成、尚未執行或無法確認的驗證。

建議格式：

```text
【完成項目】
【異動單元】
【沿用能力與架構】
【共用能力異動】
【影響與驗證】
```

### 5.3 條件式資訊

視情況追加：

- `【未採用方案】`
- `【單元歸屬】`
- `【契約變更】`
- `【Spec 影響】`
- `【風險與後續】`

沒有實際情況時，不建立空欄位。

### 5.4 搜尋與沿用結果

說明最後實際沿用的能力、影響架構判斷但未採用的相近實作，以及既有能力不足時擴充或獨立建立的理由。不得只寫「已搜尋 Library」等空泛文字。

### 5.5 驗證與真實性

> [!WARNING]
> 不得將未實際執行的 Build、Typecheck、Lint、測試、AA、Freego、弱點掃描、部署或實機操作描述為已通過。

驗證結果必須區分：已完成並取得結果、僅靜態檢查、尚未執行、因環境或權限無法確認。

### 5.6 交付粒度

以一個完成的修改單元為粒度，不要求每則對話重複。純文件錯字、連結或低風險調整可用精簡格式，但仍要說明完成項目、異動檔案與驗證方式。

---

## 6. 關聯 Issue

有需求單、Bug 單、AA 檢測單或 Code Review Issue 時，在 Summary 或 Description 列出單號。未完成驗收或只處理部分需求時，Description 應清楚標示完成範圍。

---

## 7. Commit 前檢查

### Git 與範圍

- [ ] 已確認 Repository 與正確分支。
- [ ] Commit 只有一個明確主題或不可分割修改。
- [ ] 沒有無關格式化、Debug、本機設定或敏感資料。
- [ ] 已檢查 Changes 與 Diff。

### 交付、Summary 與 Description

- [ ] 已完成交付與變更說明。
- [ ] 已列出沿用架構與共用能力異動。
- [ ] Summary 能說明結果。
- [ ] Description 已寫明原因、方式、效益與 Issue。
- [ ] 複雜修改已補充影響、驗證或後續。

### 驗證、同步與 PR

- [ ] 已執行與修改相符的檢查。
- [ ] 未執行的驗證沒有寫成通過。
- [ ] Feature 修改已確認受影響 Spec。
- [ ] Spec 共用問題已回到 Feature 主線。
- [ ] Release／Hotfix 已確認是否同步回 `Feature/Dev`。
- [ ] 準備 PR 時已完成需求與單元 Gate，並判斷專項與全專案回歸 Gate。
