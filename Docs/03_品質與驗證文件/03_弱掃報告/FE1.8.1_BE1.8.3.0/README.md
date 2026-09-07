# FE1.8.1 / BE1.8.3.0 弱掃修正追蹤

> 掃描日期：2026-08-31  
> 修正主線：`Feature/Dev`  
> 本文件最後整理：2026-09-07

> [!IMPORTANT]
> 本文件記錄原始 Finding、Source 分析、Runtime Evidence 與 Code mitigation 狀態。Code 已修改、Runtime 已重現或人工判斷成立，都不等於 AppScan 正式複掃通過；只有相同或更完整 Coverage 的正式複掃確認 Finding 消失後，才能標示「複掃通過」。

---

## 1. 原始報告

本目錄目前包含：

- `https__aaca.ntua.edu.tw_Server_2026-08-31_back.pdf`
- `疑似誤判-Cookie_SameSite_弱掃複驗佐證說明.pdf`

掃描 Target：

```text
https://aaca.ntua.edu.tw
```

本輪分析以 Browser-facing Final Response 為 Header／Cookie Finding 的驗證基準：

```text
Browser
→ IIS / ARR
→ Node SSR
→ Backend
```

---

## 2. Medium：Missing or insecure Cross-Origin-Resource-Policy (CORP) header

**Issue ID**  
`83aa433e-f36b-1410-89cd-00f37f576f24`

**Severity**  
`Medium`

**AppScan Location**  
`https://aaca.ntua.edu.tw/`

**原始 Evidence 限制**  
AppScan 報告的 `Test Requests and Responses` 指出該要求／回應包含二進位內容，因此產生的報告未包含實際 binary Request／Response 內容。故原始 Scanner binary Resource URL 無法僅由 PDF 報告直接確認，不將推定 URL 寫成已證實的 AppScan Request。

### 2.1 Runtime 重現

正式站已確認後台 Navbar 提供的 Frontend static PDF：

```text
/assets/後台操作手冊-*.pdf
```

修改前 Browser-facing Response 可重現：

```http
HTTP 200
Content-Type: application/pdf
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Resource-Policy: <missing>
```

該資源由 Frontend Node Static Asset 提供，不屬 `/Service/FileManagement/Public_Preview`。

### 2.2 問題本質

`SecurityHeaders.ts` 舊版曾以 static path 是否以 `.pdf` 結尾決定是否省略 CORP，造成所有 Frontend static PDF 成為 blanket exception。

此行為與後端目前已收斂的 PDF Native Preview Named Exception 不一致：

```text
Frontend Static Asset
→ 不應因 .pdf 副檔名自動排除 CORP

Backend /Service
→ 預設 CORP: same-origin
→ 只有 Public_Preview + application/pdf + wcmsPreview=native
   才由 Backend Security Policy 明確移除 CORP
```

### 2.3 Code mitigation

Commit：

```text
fcaa26d6991b9e88e9a40c88fe2d146ee28d19c2
FE Security：收斂 Node 靜態資源 CORP same-origin Policy
```

處理內容：

- 移除 Frontend static `.pdf` blanket CORP exception。
- Node-owned HTML 與 Static Asset（JS／CSS／Image／Font／PDF／其他 Static Resource）統一使用 `CORP: same-origin`。
- 不修改 Backend `SecurityHeadersSetup`。
- 不修改 FileManagement Download／Preview 行為。
- 不修改 `/Service` Proxy 的 Backend-controlled PDF Policy。
- 保留 `Public_Preview + application/pdf + wcmsPreview=native` Named Exception。

### 2.4 驗證狀態

**Code mitigation**  
`已完成`

**修改前 Runtime validation**  
`已完成；正式站 /assets/*.pdf 可重現缺少 CORP`

**修改後 Runtime validation**  
`待部署後驗證`

部署後至少確認：

```text
/assets/後台操作手冊-*.pdf
→ Cross-Origin-Resource-Policy: same-origin
→ Chrome Native PDF Viewer 可正常開啟、翻頁、縮放、搜尋、下載、列印
```

並回歸：

```text
/Service/FileManagement/Public_Preview/{id}?wcmsPreview=native
→ 既有 Backend Named Exception 不受影響
```

**Scanner pass / formal rescan**  
`尚未執行，不得標示複掃通過`

---

## 3. Cookie SameSite Finding

`rtid` 與 `wcms.visitor` 已完成正式站 Runtime 驗證：

```text
rtid Login
→ Secure + SameSite=Strict + HttpOnly

rtid Refresh
→ Secure + SameSite=Strict + HttpOnly

wcms.visitor 首次建立
→ Secure + SameSite=Strict + HttpOnly
```

Browser Cookie Store 亦確認為 Strict／Secure／HttpOnly。

目前狀態：

> 正式 Runtime 無法重現，待弱掃方提供原始 `Set-Cookie` Finding Evidence。

對應人工佐證請見本目錄：

- `疑似誤判-Cookie_SameSite_弱掃複驗佐證說明.pdf`

除非新 Finding 與 Cookie SameSite 有直接關聯，不重新擴張此項分析。

---

## 4. Low：Autocomplete HTML Attribute Not Disabled for Password Field

**Issue ID**  
`f1fc433e-f36b-1410-89cd-00f37f576f24`

**Finding**  
`Autocomplete HTML Attribute Not Disabled for Password Field`

**Location**  
`/Server/Login`

Source 原先為：

```tsx
autoComplete="current-password"
```

PM 已確認後台登入密碼欄可取消 Browser autocomplete，因此已修改為：

```tsx
autoComplete="off"
```

Commit：

```text
84e36aec70119382bd150ab20e46408c95bf3c9f
FE Login：關閉密碼欄瀏覽器自動填寫
```

**Code mitigation**  
`已完成`

**Runtime validation**  
`待部署後確認 SSR HTML 與 Browser 行為`

> 部分 Browser／第三方 Password Manager 可能依自身政策忽略 `autocomplete="off"`；正式驗證仍以實際 SSR HTML、Browser 行為與 Scanner 複掃為準。

**Scanner pass / formal rescan**  
`尚未執行`

---

## 5. Low：Trusted Types in scripts not enforced in CSP

AppScan 曾於 `/Service/SystemAPI/GetXsrfToken` 回報 Trusted Types Low。重新核對 Source 後確認該 Endpoint 只是 Scanner 命中的一個位置；真正修改 Scope 若要補 `require-trusted-types-for 'script'`，會落在 Node `/Service` Proxy 共用 CSP，影響 JSON API、204、File Download／Preview、PDF 等所有 `/Service` Browser-facing Response。

目前決策：

```text
Severity: Low
驗收需求：以 Medium 以上清 0 為主
Code mitigation：暫不執行
理由：不為 Scanner compliance 擴大全 /Service Trusted Types Security Contract，避免增加不必要 Regression Scope
```

此項不得標示為 False Positive 或 Scanner Pass；若後續驗收範圍改變，再重新做 `/Service` CSP Scope 與 Runtime Regression 評估。

---

## 6. 本版目前狀態摘要

| Finding | Severity | Code mitigation | Runtime | Formal rescan |
|---|---|---|---|---|
| CORP Missing / Insecure | Medium | 已完成 `fcaa26d...` | 修改前已重現；修改後待部署 | 待執行 |
| Cookie SameSite | Medium | 既有 Policy 已核對 | 正式站無法重現；已有佐證 | 待弱掃方 Evidence／複驗 |
| Password Autocomplete | Low | 已完成 `84e36ae...` | 待部署 | 待執行 |
| Trusted Types `/Service` CSP | Low | 暫不修改 | Scope 已分析 | 未通過／未複掃 |

---

## 7. 下一步

1. 部署 `fcaa26d...` 後重測 Frontend static PDF CORP 與 Chrome Native PDF Viewer Regression。
2. 回歸 Backend `Public_Preview?...wcmsPreview=native` Named Exception。
3. 部署 `84e36ae...` 後確認 `/Server/Login` Password SSR HTML 為 `autocomplete="off"`。
4. 正式 AppScan 複掃前確認 Login、Auth/Me、XSRF、Crawler 與後台 Coverage 正常。
5. 正式複掃完成前，所有項目均不得使用「弱掃已通過」或 `All Clear` 描述。