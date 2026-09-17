# 後端安全拒絕診斷與 SameSite 複驗

更新日期：2026-09-17；診斷版本：2026.09.17.1。

## 修改與範圍

沿用 NLogSetup，新增 WCMS.Security Warning 分流，日誌位置為後端執行目錄下 `logs/security/security-yyyy-MM-dd.log`（檔名日期依伺服器時區，JSON TimestampUtc 為 UTC）。記錄 Host、Origin/Referer、Antiforgery 三個自訂防護拒絕點。回應使用伺服器新產生的 `X-WCMS-Trace-Id`，不採信客戶端同名標頭。JSON Route 是伺服器路由樣板，可能為 null，不含請求的實際路由值、Query、Cookie/Token、Origin/Referer/Host 原值、IP、帳密或例外文字。

防護判斷、Cookie 屬性、回應狀態碼與 Body 維持原狀。此變更不代表 SameSite 中風險已排除。授權層、IIS、Node、WAF 產生的 403 不屬於這三個記錄點；缺少本日誌不等於必定是 WAF 拒絕。

## 已完成的驗證

以最新修改的 SecurityHeadersSetup、XsrfProtectionSetup、SecurityRejectionDiagnostics 與既有 Cookie 元件進行 ASP.NET Core 10.0.12 本機隔離測試，10/10 通過：原七個 Cookie/XSRF 案例，加上 Host 拒絕與 Trace 對應、缺少防偽 Cookie 分類及敏感字串不洩漏、成功請求不寫拒絕日誌。所有經測試的 403 皆檢查回應 Trace 能對應捕捉的日誌。

NLog NuGet 下載逾時，因此測試使用 NLogSetup 捕捉替身，沒有驗證真實 NLog 落盤；完整 WCMS Build、IIS、多層 Proxy 與正式站尚未驗證。發布前在開發電腦執行專案正常 Release 建置，部署後完成以下日誌落盤驗證。

## 部署

重新建置及發布後端 WCMS，確認四個程式檔異動已包含在 DLL/EXE。僅複製 .cs 或更新 web.config 不會生效。App Pool 身分需可寫入後端 logs 目錄。此修改不需要新增動態部署參數。前端 Token 403 修正需另外完成前端建置與部署。

## 1. 從外部電腦做可預期的拒絕測試（Windows CMD）

以下使用合法 Host/Origin、不带 Cookie 或 Token，預期在 XSRF 階段 403：

```bat
curl.exe --http1.1 --noproxy "*" --max-time 20 -sS -i "https://aaca.ntua.edu.tw/Service/SiteViewCount/TryCountSiteView" -H "Origin: https://aaca.ntua.edu.tw" -H "Referer: https://aaca.ntua.edu.tw/" -H "Content-Type: application/json" --data-raw "{\"SiteIndex\":\"\"}"
```

預期後端日誌 Stage=Antiforgery、Reason=AntiforgeryHeaderMissing。若未被上游遮蔽，回應可見 X-WCMS-Trace-Id，應與日誌 TraceId 相同。若意外 200，停止追加計次測試，先檢查後端實際來源 IP/Loopback 例外與部署版本。

第二次改成不允許的來源，預期 Stage=Origin、Reason=OriginOrRefererNotAllowed：

```bat
curl.exe --http1.1 --noproxy "*" --max-time 20 -sS -i "https://aaca.ntua.edu.tw/Service/SiteViewCount/TryCountSiteView" -H "Origin: https://untrusted.invalid" -H "Referer: https://untrusted.invalid/" -H "Content-Type: application/json" --data-raw "{\"SiteIndex\":\"\"}"
```

這兩次未授權請求預期不進入計次業務。若被上游先行拒絕，後端不一定收到請求，不保證產生上述日誌。

Host 測試仍可沿用先前的 Host: adns-check.invalid，但前端 IIS 已先拒絕，不應期待後端一定出現 Host 日誌。不要為測試開放後端直連或放寬白名單。

## 2. 在後端伺服器查日誌（PowerShell）

先 cd 到後端發布目錄，再執行：

```powershell
Get-ChildItem .\logs\security\security-*.log | Sort-Object LastWriteTime -Descending | Select-Object -First 1 | Get-Content -Tail 60
```

用回應中實際的 TraceId 搜尋：

```powershell
Select-String -Path .\logs\security\security-*.log -SimpleMatch -Pattern '貼上實際TraceId'
```

若無日誌：確認更新的是正在執行的後端、App Pool 已載入新版本、寫入權限及 Logger 分流；再比對 IIS 的時間、路徑、sc-status/sc-substatus/sc-win32-status。前端 httpErrors existingResponse=Replace 可能替換 Body 或影響可見標頭，不能只靠瀏覽器看不到 Trace 判斷後端沒執行。

Reason 僅作安全分類，不能從 AntiforgeryValidationFailed 單獨判斷究竟是登入身分切換、Token 配對、過期或 Data Protection Key 問題；HasAntiforgeryCookie 表示其中一個受支援名稱存在，不代表內容有效。

## 3. SameSite 的正式站成功案例

使用全新無痕工作階段開啟前台，在 DevTools Network 開啟 Preserve log。確認 GetXsrfToken 成功後，找到前台自然觸發的 TryCountSiteView 請求，檢查成功回應的 Set-Cookie：新 wcms.visitor 應有 SameSite=Strict、Secure、HttpOnly、Path=/。用同一個工作階段驗證；登入或登出後重新取得 Token，不混用其他工作階段資料。

若已有 visitor，成功回應可能不重發，不能當成漏設屬性。請從 Cookie 首次建立的回應取證。保存 HTTP 狀態、時間、Cookie 名稱與屬性；對外分享前遮蔽 Cookie/Token 值，避免直接轉寄含登入憑證的 HAR。

## 判定與回報

- AntiforgeryHeaderMissing：測試是否漏送 Header；表單請求可能另有防偽欄位，所以不僅憑 Header 判斷。
- AntiforgeryCookieMissing：檢查同工作階段是否保留防偽 Cookie。
- AntiforgeryValidationFailed：確認 Token 與 Cookie 同工作階段、登入狀態一致；若多節點再核對 Data Protection Keys。
- OriginOrRefererNotAllowed：核對實際來源與白名單。
- HostNotAllowed：核對後端主機白名單與代理轉送。

先回傳兩次拒絕測試的狀態/TraceId 與對應日誌，以及新 Cookie 成功建立時已遮蔽值的 Set-Cookie。掃描方若仍報中風險，請提供其判定 wcms.visitor 屬性不安全的原始設定回應或探索紀錄；403 且未發 Cookie 的回應本身不足以確認 SameSite 缺漏。
