# FE1.9.0 / BE1.8.3.2 弱掃複驗追蹤

> 複驗日期：2026-09-09  
> Target：`https://wcms1821.it-easygoapp.com/`  
> 修正主線：`Feature/Dev`  
> Release：`Feature/Release`  
> 本文件最後整理：2026-09-09

> [!IMPORTANT]
> 本文件記錄 2026-09-09 Runtime 與 AppScan 掃描流程 Evidence。CORP 對應測試在掃描流程畫面中已顯示「已通過」；Cookie SameSite 仍有 Finding，因此不可寫成整輪弱掃 `All Clear`。最終完整 PDF 報告若尚未歸檔，仍以最終報告為正式結論。

---

## 1. 本版變更來源

2026-09-08 完整 AppScan 報告 `FE1.9.0 / BE1.8.3.1` 已降至 0 Critical / 0 High，但仍保留 1 筆 CORP Medium。當時一般 HTML、API 與 Static Resource 已可取得：

```text
Cross-Origin-Resource-Policy: same-origin
```

Source 與 Runtime 交叉核對後，Backend 唯一刻意移除 CORP 的 Browser-facing 路徑為：

```text
/Service/FileManagement/Public_Preview/{id}
+ Content-Type: application/pdf
+ wcmsPreview=native
```

因此 2026-09-09 以最小 Release Hotfix 取消 Native PDF 的 CORP Named Exception。

---

## 2. CORP Hotfix

### 2.1 修改方向

Backend CORP Policy 收斂為：

```text
所有 Backend Browser-facing Response
→ Cross-Origin-Resource-Policy: same-origin

wcmsPreview=native
→ 僅保留 Browser Rendering Context 語意
→ 不再移除 CORP
```

本次未修改：

- Frontend `wcmsPreview=native` URL Context。
- FileManagement Preview / Download 實作。
- Node `/Service` Proxy 主流程。
- PDF.js。
- IIS CORP fallback。

### 2.2 Commit Chain

Feature/Dev：

```text
d58c47f5823ac79e343c216950a2f068d8833239
BE Security：移除 Native PDF CORP 例外並統一 same-origin
```

Release Hotfix PR：

```text
PR #166
HOTFIX BE Security：CORP Native PDF 統一 same-origin（BE 1.8.3.2）
```

Feature/Release Merge：

```text
ef5cd68af1a203a5ef0c9da4ac50b24b55e227f4
Merge pull request #166：CORP Native PDF 統一 same-origin
```

版本號：

```text
BE 1.8.3.1
→ BE 1.8.3.2
```

本次只增加 Backend `Patch`；`FeatVersion=8`、`ModelVersion=3` 均不變，未涉及 DB Model 契約。

---

## 3. CORP Runtime Evidence

### 3.1 不存在 InternalId

測試：

```text
/Service/FileManagement/Public_Preview/00000000-0000-0000-0000-000000000000?wcmsPreview=native
```

Browser-facing Response：

```text
HTTP 404
Cross-Origin-Resource-Policy: same-origin
```

此 Case 用來確認 Error Response 仍維持 CORP Policy。

### 3.2 實際存在 PDF

本輪使用 AppScan 曾走訪的 PDF InternalId 進行 Runtime 驗證：

```text
0610535c-2a68-4e08-a881-42847d1a4340
```

Native Preview：

```text
/Service/FileManagement/Public_Preview/0610535c-2a68-4e08-a881-42847d1a4340?wcmsPreview=native
```

Browser-facing Response 已確認：

```text
HTTP 200
Content-Type: application/pdf
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: same-origin
```

一般 Preview／帶 `fileName` 的 PDF Response 同樣已看到：

```text
HTTP 200
Content-Type: application/pdf
Cross-Origin-Resource-Policy: same-origin
```

### 3.3 Browser Regression

Header 已確認由 Browser 最終 Response 實際送出，不只依 Source 判斷。

Native PDF Viewer 仍需以實際多頁 PDF持續留意：

- 開啟。
- 第二頁以上。
- 上一頁／下一頁。
- 縮放。
- 搜尋。
- 下載。
- 列印。

若後續 Browser 版本出現 Native PDF + CORP 相容性 Regression，需重新評估 Viewer 策略，不得直接恢復全 PDF blanket exception。

---

## 4. AppScan CORP 複驗狀態

2026-09-09 AppScan 全掃流程畫面中，多筆下列 Endpoint 已顯示：

```text
對以下項目的測試
（缺少或不安全的跨來源資源政策 (CORP) 標頭）
已通過
```

包含多筆：

```text
/Service/FileManagement/Public_Preview/{internalId}?fileName=...
```

其中包含本輪人工驗證使用的：

```text
0610535c-2a68-4e08-a881-42847d1a4340
```

因此目前可記錄：

| 項目 | 狀態 |
|---|---|
| Code mitigation | 已完成 |
| Browser Runtime 404 CORP | 已完成 |
| Browser Runtime PDF 200 CORP | 已完成 |
| Native PDF CORP `same-origin` | 已完成 |
| AppScan CORP Target Test | 掃描流程顯示已通過 |
| 最終完整 PDF 報告 | 待歸檔後確認 |

在最終完整報告歸檔前，不將整輪弱掃標示為 `All Clear`。

---

## 5. Cookie SameSite 目前狀態

歷史人工佐證位於：

```text
../FE1.8.1_BE1.8.3.0/疑似誤判-Cookie_SameSite_弱掃複驗佐證說明.pdf
```

先前 Runtime 已確認：

```text
rtid Login
→ Secure + SameSite=Strict + HttpOnly

rtid Refresh
→ Secure + SameSite=Strict + HttpOnly

wcms.visitor
→ Secure + SameSite=Strict + HttpOnly
```

2026-09-09 掃描流程中曾看到 `rtid` SameSite 個別測試顯示「已通過」，但本輪整體掃描結果仍有 SameSite Finding，因此不得依單筆 Live Test 畫面判定正式複掃通過。

目前仍維持：

> `Scanner 仍有 Finding；Source / Runtime 無法重現 SameSite 缺失，持續列為疑似 Scanner Evidence / False Positive，待最終報告與原始 Set-Cookie Finding Evidence 進一步核對。`

目前不因 Scanner Finding 直接重寫 Cookie Policy。

---

## 6. Injection 類結果說明

2026-09-08 完整 AppScan 已未再列出先前的 Blind SQL Injection、Blind LDAP Injection、Blind XPath Injection 與大量 JSON Reflection Finding。

本文件不將其原因硬歸因於單一修正；目前只記錄 Scanner 結果：

> `本輪完整掃描未再發現上述 Injection 類 Finding。`

InternalId／Generic Update 共用防護另已有 Feature/Dev 修正，不以此文件宣稱 Scanner Finding 與單一 Root Cause 已建立一對一因果關係。

---

## 7. 本版目前狀態摘要

| Finding / 驗證項目 | 目前狀態 | 說明 |
|---|---|---|
| CORP | Scanner Live Test 已通過 | Runtime 404／PDF 200／Native PDF 均有 `same-origin`；最終報告待補 |
| Cookie SameSite `rtid` | 仍有 Finding | Source / Runtime 顯示 Strict；持續以疑似 Scanner Evidence / FP 追蹤 |
| Permanent Cookie `rtid` | 依最終報告確認 | 不以單筆 Live Test 畫面宣稱清除 |
| SQL / LDAP / XPath Injection | 2026-09-08 完整掃描未再發現 | 不硬歸因單一修正 |
| 全輪 All Clear | 尚未標記 | SameSite 仍有 Finding，且最終完整報告需歸檔 |

---

## 8. 下一步

1. 完成本輪 AppScan 全掃並產出最終報告。
2. 將最終 PDF 歸檔到本目錄。
3. 依最終 Severity Summary 與 Finding List 更新本 README：
   - CORP 是否可正式標示 `複掃通過`。
   - SameSite 的實際 Finding、Cookie、Response Evidence。
   - 是否出現新的 Medium 以上 Finding。
4. 若 CORP 最終報告確認消失，再同步更新根目錄 `README.md` 與 `修改歷史與方針.md` 的正式狀態。
5. SameSite 除非取得可重現的缺失 `Set-Cookie` Evidence，否則不擴張修改既有中央 Cookie Policy。
6. 螢幕截圖若需對外或入庫，必須先移除／遮蔽 Cookie、Token、XSRF 等敏感資訊。
