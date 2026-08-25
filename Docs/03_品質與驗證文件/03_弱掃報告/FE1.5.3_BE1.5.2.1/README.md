# FE1.5.3 / BE1.5.2.1 弱掃修正追蹤

> 掃描日期：2026-08-20  
> 修正主線：`Feature/Dev`  
> 本文件最後整理：2026-08-25  
> Code 對照 HEAD：`170ab5ee2bd33d36634849462aae4f027aeeec1d`（文件整理前）

> [!IMPORTANT]
> 本文件記錄原始 Finding 與後續 Code mitigation／人工覆核狀態。2026-08-24 這批 Security Commit 完成後尚未取得正式 AppScan 複掃結果，因此不得宣稱 All Clear。

> [!NOTE]
> 共通安全架構以 [`02_前端專案架構.md`](../../../01_研發與技術文件/01_系統架構/02_前端專案架構.md) 與 [`03_後端專案架構.md`](../../../01_研發與技術文件/01_系統架構/03_後端專案架構.md) 為正式來源；跨版本 Finding 修正模式、完整 Commit SHA 與處理方針統一維護於 [`修改歷史與方針.md`](../修改歷史與方針.md)。

---

## 1. 原始報告

本目錄目前包含：

- `20260820_HCL AppScan 360 DAST 2.1 - PublicSite.pdf`
- `20260820_HCL AppScan 360 DAST 2.1 - Server_back.pdf`
- `20260820_Tenable Nessus 10.12.3.html`

AppScan 原始統計：

| Scan | Critical | High | Medium | Low | Informational |
|---|---:|---:|---:|---:|---:|
| PublicSite | 0 | 0 | 3 | 5 | 10 |
| Server_back | 1 | 2 | 6 | 39 | 114 |

目前 Security Hardening 目標是：

> 正式複掃時 Critical／High／Medium／Low 盡可能為 0，只保留可接受的 Informational；但必須建立在相同或更完整 Scan Coverage 上。

---

## 2. 2026-08-24 Security Commit Chain

本輪從掃描後基準到文件整理前 HEAD，Security 修正共有 13 筆線性 Commit：

| 順序 | Commit | 主題 | 主要 Finding／目的 |
|---:|---|---|---|
| 1 | `e3e16a0` | BE 登入：統一 Credential Enumeration 驗證失敗回應 | Credential Enumeration |
| 2 | `65ec797` | BE Security：補齊 Browser Unsafe Method XSRF Token 驗證 | CSRF |
| 3 | `f74e581` | BE Security：修正 DEV HTTP 取得 XSRF Token 500 | XSRF DEV Runtime |
| 4 | `98d96ec` | FE Security：整理前端 Security Hardening 架構 | Security Header 模組化 |
| 5 | `8e60123` | FE Security：補上 COEP require-corp 驗證基準 | COEP |
| 6 | `adc7afb` | FE Security：抽離 COEP Policy 設定 | COEP 架構收斂 |
| 7 | `9ac9618` | Security：修正 Proxy v3 Header Hook 並補齊 Backend COOP | COOP／Proxy Header 實際套用 |
| 8 | `0204ba1` | Security：補齊 CORP same-origin 並排除 PDF | CORP |
| 9 | `893ff14` | FE Security：補上 SSR Host 白名單驗證 | ADNS Blind SSRF／Host Header |
| 10 | `d6ecc2c` | Security：收緊 API frame-ancestors 為 none | frame-ancestors |
| 11 | `4350957` | FE Security：補上正式靜態 Script CSP | Missing CSP |
| 12 | `ed74156` | Security：收斂 XSRF Session Cookie 與登入生命週期 | Permanent XSRF Cookie／XSRF 身分生命週期 |
| 13 | `170ab5e` | FE Security：啟用 Trusted Types 強制模式 | Trusted Types |

> [!NOTE]
> Commit 存在只代表程式已修改；各項正式 Scanner 狀態仍以複掃報告為準。

---

## 3. Medium／Low Finding 對照

### 3.1 PublicSite

| Finding 類型 | 原始數量 | 目前狀態 |
|---|---:|---|
| COEP | 1 Medium | Code mitigation 已完成；待複掃 |
| COOP | 1 Medium | Code mitigation 已完成；待複掃 |
| CORP | 1 Medium | Code mitigation 已完成；PDF 實際 Response 仍應驗證；待複掃 |
| Missing CSP | 1 Low | Production JS／MJS 已補最小 CSP；待複掃 |
| frame-ancestors | 1 Low | API 已收斂 `none`；待複掃 |
| Trusted Types | 3 Low | 已啟用 `require-trusted-types-for 'script'`；Runtime Regression／待複掃 |

### 3.2 Server_back

| Finding 類型 | 原始數量 | 目前狀態 |
|---|---:|---|
| ADNS Blind SSRF | 1 Medium | Node SSR Host／X-Forwarded-Host 白名單 mitigation 已完成；Runtime／待複掃 |
| CSRF | 1 Medium | ASP.NET Antiforgery + Browser Unsafe Method 驗證已補；DEV 手動流程曾驗證，正式複掃待執行 |
| Credential Enumeration | 1 Medium | Login 驗證失敗統一回應已補；待複掃 |
| COEP | 1 Medium | Code mitigation 已完成；待複掃 |
| COOP | 1 Medium | Backend + Node Proxy mitigation 已完成；待複掃 |
| CORP | 1 Medium | Code mitigation 已完成；PDF 實際 Response 仍應驗證；待複掃 |
| Missing CSP | 1 Low | Code mitigation 已完成；待複掃 |
| frame-ancestors | 1 Low | Code mitigation 已完成；待複掃 |
| Permanent Cookie Contains Sensitive Session Information | 1 Low | Login／Refresh 不再手動建立帶 Expires 的 XSRF-TOKEN；登入／Refresh 後重新取 XSRF；Runtime／待複掃 |
| Trusted Types | 36 Low | Enforcement 已加入；Runtime／待複掃 |

目前 Medium 與 Low 的「Finding 類型」皆已有對應 Code mitigation，但不能將 44 筆 Low 或所有 Medium 直接標成複掃通過。

---

## 4. Critical：Blind SQL Injection 人工覆核方向

原始 Finding 指向 `SpecHomePageApi/Update` 的 `ShortcutCode` 類欄位。

開發端補充背景：

- 掃描當時 Update Response 的 `Data` 曾可能取到更新前／舊資料。
- 這種 Response 差異可能讓 Blind SQL Injection TRUE／FALSE Probe 產生可辨識差異。
- 該 Response 資料問題已另行修正。
- 目前本輪 13 筆 Security Commit 的訊息中沒有足夠明確的「SQLi False Positive 修正」紀錄，因此仍需用 Runtime／SQL Evidence 證明，不直接標為已清除。

### 4.1 應準備的證據

以 Scanner 原始 Payload 重送：

```text
正常值
TRUE-like payload：' AND '1'='1
FALSE-like payload：' AND '1'='2
```

保留：

1. 完整 HTTP Method／Endpoint／欄位。
2. Request Body（去除 Token／Cookie 等敏感資料）。
3. TRUE／FALSE Response Status、Schema、Body 長度與關鍵 Data。
4. DB 實際資料前後狀態。
5. EF／SQL Command 與 Parameter Evidence。

理想 SQL Evidence：

```text
Command Text 使用 @p0 / @p1...
Payload 只出現在 Parameter Value
Payload 不會被拼接進 SQL 語法
```

只有「使用 EF Core」本身不足以當作人工覆核證明。

### 4.2 判斷標準

若修正後 TRUE／FALSE Payload：

- 不改變查詢／更新語意。
- Response 不再因舊 Data 產生真假條件差異。
- SQL 使用 Parameterization。
- DB 狀態沒有 SQL 條件注入效果。

則可整理成疑似 False Positive 證據交由弱掃方人工覆核。

---

## 5. High：Integer Overflow 人工覆核方向

AppScan 曾將極大數字 Payload 打入 `Section3Title`／`Section3SubTitle` 類欄位，例如：

```text
9999999999999999999999999999
```

目前 OpenAPI／1821 資料契約可確認這類欄位是 `string`，`ShortcutCode` 亦為字串；不是 `Int32`／`Int64` 算術欄位。

因此漏洞名稱「Integer Overflow」有疑似誤判可能，但若極端字串可造成 500，仍需處理 Error Handling robustness。

### 5.1 應準備的證據

- Scanner Request 中確認 JSON Value 是 quoted string。
- C# Model／DTO Property Type = `string`。
- OpenAPI Schema = `string`。
- DB Column Type／Length 請另外取正式 DB Schema 證明；未取得前不要自行宣稱一定是 `nvarchar`。
- 重送極端字串，確認 Server 不進行 Integer Cast／Arithmetic。
- 超過允許長度時應穩定進入預期 Validation／4xx，不應由 SQL／EF 未分類 Exception 變成 500。

### 5.2 「半個誤判」處理原則

```text
Scanner 名稱可能判錯
+
Payload 真的能造成 500
=
不能只要求 False Positive
```

應先把 500 的真正 Exception 分類清楚，再提交人工覆核證據。

正式 Error Handling 方向以 [`03_後端專案架構.md`](../../../01_研發與技術文件/01_系統架構/03_後端專案架構.md) 為準；可重用弱掃分類與修改案例見 [`修改歷史與方針.md`](../修改歷史與方針.md)。

---

## 6. 1821 弱掃 Runtime Log 分析摘要

本次另外提供的 `1821弱掃.zip` 不直接提交 Repository；它作為 2026-08-20 掃描期間的 Runtime Log Snapshot 供分析。

主要觀察：

| 類型 | 約略數量 |
|---|---:|
| HTTP ERROR block | 17,370 |
| Dynamic LINQ `Expression expected` | 13,386 |
| `DbUpdateConcurrencyException` | 2,095 |
| `SpecHomePageApi/Update` Concurrency | 2,073 |
| DB 字串／二進位截斷 | 537 |
| SQL FK Conflict | 約 260 |
| Duplicate Key | 2 |

這說明弱掃期間有大量「可預期的無效輸入／資料衝突」被送到較深層 Framework／EF／SQL 後才 Exception，最後可能落成 500。

後續 Error Handling 不應把所有 Exception 一律改成 400，而是依語意收斂：

```text
Invalid Request → 400
Data State / Unique / Concurrency Conflict → 409
Auth → 401 / 403
Rate Limit → 429
Unknown Server Bug → 500
```

優先候選：

1. Dynamic LINQ Parser Invalid Condition。
2. `DbUpdateConcurrencyException` 實際 Update／Delete Conflict。
3. SiteViewCount Request 長度契約。
4. 其他 DB String Truncation。
5. Duplicate／FK 其他未分類 Case。

截至本文件日期，上述候選是「後續實作方向」，不是已完成項目。

---

## 7. 前端 Security Hardening Runtime 風險

前端安全架構與 IIS／Node SSR／Backend／Browser 責任邊界，正式以 [`02_前端專案架構.md`](../../../01_研發與技術文件/01_系統架構/02_前端專案架構.md) 為準；本節只保留本次弱掃的 Runtime 複驗重點。

複掃前仍須特別驗證：

- IIS → Node SSR → Backend 的最終 Header 是否沒有被覆寫或重複衝突。
- `SSR_ALLOWED_HOSTS` Production 實際值已替換客戶 Domain。
- 惡意 Host／X-Forwarded-Host 回 403，合法 Host 正常。
- API Proxy v3 `on.proxyRes` 確實重寫 Browser-facing Header。
- COEP／CORP 不影響 Google Translate、Turnstile、YouTube、CMS iframe。
- 實際 PDF Response／PDF Viewer 正常。
- Trusted Types Enforcement 下 TinyMCE／PDF Worker／Turnstile／Google Translate 正常。
- Spec1810 雖未在 Trusted Types Commit 直接改檔，但仍受全站 Production CSP 影響。

---

## 8. XSRF／Permanent Cookie 複驗重點

`ed74156` 後應確認：

```text
Login
→ 重新取得 XSRF
→ Unsafe CRUD
→ Access Token Refresh
→ 再取得 XSRF
→ Unsafe CRUD
→ Logout
```

Network／Header 應確認 `XSRF-TOKEN` 由專用 Antiforgery Endpoint 發出時沒有不必要的 `Expires`／`Max-Age`，但 Access／Refresh Token 原有必要生命週期不可因此被誤刪。

另外需確認 `APIBase.__initXsrfOnce` 在登入／Refresh 後實際能重新取得符合目前身分的 Token；目前尚未在本輪文件整理中宣稱此 Runtime 已正式驗證通過。

---

## 9. 正式複掃前 Checklist

### Coverage

- [ ] Scanner Login 成功。
- [ ] `/Auth/Me`／登入 Session 正常。
- [ ] XSRF 不會讓 Crawler 卡在後台入口。
- [ ] Scanner 能進一般 Query／CRUD。
- [ ] Scanner 能到達 `SpecHomePageApi/Update` 或目前對應的 1821 Update Endpoint。
- [ ] Coverage 沒有因 Host Validation／Auth／XSRF 修正而大幅縮水。

### Header／Frontend Runtime

- [ ] 正式 Domain HTML Header 實際檢查。
- [ ] `/Service` API Header 實際檢查。
- [ ] `.js`／`.mjs` 靜態 CSP。
- [ ] COEP／COOP／CORP。
- [ ] API `frame-ancestors 'none'`。
- [ ] PDF 實際預覽。
- [ ] TinyMCE。
- [ ] Turnstile。
- [ ] Google Translate。
- [ ] 一般前台 SSR／Hydration。

### C/H 人工覆核

- [ ] Blind SQLi TRUE／FALSE Payload 重送。
- [ ] EF／SQL Parameter Evidence。
- [ ] 修正後 Response Data 差異確認。
- [ ] Integer Overflow 欄位型別證據。
- [ ] DB Schema 型別／長度證據。
- [ ] 極端字串不再造成未分類 500。

---

## 10. 完成條件

本輪才可標示「AppScan All Clear（僅 Info）」的條件：

1. 正式複掃 Coverage 與原掃描相同或更完整。
2. Critical／High／Medium／Low 已由 Scanner 消失，或經對方正式人工覆核標記 False Positive／Accepted Risk。
3. 不是因 Login、XSRF、Host Validation、Crawler Failure 導致掃不到。
4. Runtime Regression 沒有因 CSP／COEP／CORP／Trusted Types 造成主要功能失效。
5. 報告與版本 README 同步更新實際結果。
