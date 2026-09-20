# 錯誤回應安全標頭修正與複驗

日期：2026-09-20
分支：Feature/Dev
檢查基準：b9f2721d8b1a4495d9c2378cdfda836f0cef17d6

## 完成項目與原因

ErrorHandlingMiddleware 的 Response.Clear() 清除先前設定的安全標頭。
SecurityHeadersSetup 原本的 OnStarting 只移除伺服器識別資訊，未重新補回政策。
本次在送出前沿用既有 SetCommonSecurityHeaders 與 SetPathSecurityHeaders，
重新套用安全標頭，並將 HTTP 400 以上回應設為禁止快取。

## 異動單元與沿用架構

- SysCore/Security/Hardening/SecurityHeadersSetup.cs：擴充既有中央回應政策，保留 Swagger 路徑例外。
- Features/Diagnostics/SameSite500Verification_API.cs：新增 CookieThenThrow，沿用 Authorize、管理者權限及驗證 Header；診斷 Cookie 建立流程共用。
- Scripts/Verify-ErrorResponseSecurity.py：新增對已部署測試環境執行的標準函式庫回歸測試。
- 本文件：修正範圍、測試方式與交付狀態。

保留 ErrorHandlingMiddleware 的 Response.Clear()，不盲目還原先前的 Set-Cookie。
本次不變更中央 Strict／Secure 政策、資料庫、業務 API 或正式版本號。
僅提交 Feature/Dev；不合併 Feature/Release 或 Spec1821，不執行部署。

## 回歸測試

需 Python 3、已部署本次修正的 HTTPS 測試站，以及具有系統管理者權限的有效測試憑證。
透過執行環境安全注入以下變數，不將實際值寫入程式碼、Git、截圖或共享日誌：

- WCMS_VERIFY_BASE_URL：對外 HTTPS 網址，可包含應用程式基底路徑；不含 /Service。
- WCMS_VERIFY_AUTHORIZATION：完整 Authorization 值，例如 Bearer 加有效測試 Token。
- WCMS_VERIFY_COOKIE：需要時提供完整 Cookie 請求標頭；與 Authorization 至少提供一項。

執行：

```text
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py
```

腳本不追蹤轉址，使用正常 TLS 憑證驗證，不輸出 Cookie 或 Token 值。
此腳本會刻意產生受控 500，並寫入正常例外日誌；只對指定測試環境執行。
若現有認證流程需要 Bearer Token，僅提供 refresh Cookie 並不足以通過登入驗證。
PowerShell 使用者可透過受控工作階段注入環境變數，測試完畢後清除。

| 情境 | 預期 |
|---|---|
| Throw | 500、完整適用安全標頭、no-store、不回傳內部例外 |
| Cookie | 500、完整適用安全標頭、診斷 Cookie 具 Strict／Secure／HttpOnly |
| CookieThenThrow | 500、完整適用安全標頭、no-store、不送出先前待送的診斷 Cookie |
| CookieThenThrow 缺少驗證 Header | 已登入管理者取得 404 |
| CookieThenThrow 匿名請求 | 401 |

另需人工確認：已登入非管理者回傳 403；一般成功、400、409、登入／續期／登出；
PDF 預覽與下載；IIS／Node 自行產生的錯誤回應。CookieThenThrow 清除的是本次回應待送的
Set-Cookie，不代表刪除瀏覽器原有 Cookie。必要的登出 Cookie 刪除須另以實際流程驗證。

## 驗證與限制

- 已完成：指定基準的程式碼與政策呼叫順序靜態檢查、修改差異檢查。
- Python 腳本僅進行語法編譯檢查；未連線執行上述 HTTP 測試。
- 本次執行環境沒有 .NET SDK，未執行 dotnet build 或 ASP.NET Core Runtime 回歸。
- 未部署網站、未執行 AppScan，不能宣稱弱掃通過。
- 僅涵蓋已註冊此安全標頭 Middleware 回呼的回應；IIS／Node 自行產生錯誤仍需另外複驗。
- CWE-1275 的實際成因仍待原始 Finding URL、Cookie 名稱與遮蔽敏感值的 Set-Cookie 證據；
  CWE-923／284 可能是該 Finding 的上層分類。本次安全標頭修正不等同已修復這些 Finding。
