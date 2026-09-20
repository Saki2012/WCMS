# API 403 JSON 保留與 SameSite 複驗補強

日期：2026-09-20
來源分支：Feature/Dev
整合目標：Spec1821
修改基準：fe447c36a81134bbfe2147e44ad4aff650084fb4

## 完成項目與異動單元

1. WCMS_Frontend/web.config：新增 location path="Service"，僅 API 路徑使用
   httpErrors errorMode="Custom" existingResponse="PassThrough"。
   根層維持 Replace 與 502、502.3、503 維護頁映射；部署設定版本更新為 2026.09.20.1。
2. WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py：增加缺少防偽 Cookie、
   無效防偽 Token 的 403 JSON、XSRF 拒絕訊息、Trace ID 格式及跨請求唯一性測試。
   沿用前次 500／Cookie 測試。
3. 本文件：紀錄附件證據、修改邊界及部署後驗證方式。

沿用 IIS 路徑設定、現有 XsrfProtectionSetup、SecurityRejectionDiagnostics 與 NLog。
未修改後端 Cookie Strict／Secure、XSRF 防護、資料庫、登入流程或 Spec 客製功能。
共用能力異動為前端 IIS API 錯誤回應保留；不另建後端防護政策。

## 附件證據判讀

| 檔案 | 正常回應 | 測試回應 | 結論 |
|---|---|---|---|
| Test_19949.txt | Login 200；rtid 具 Secure、SameSite=Strict、HttpOnly | 403 text/html，未列 Set-Cookie；請求缺少防偽 Cookie | 此證據不足以成立 SameSite 缺失；查 AntiforgeryCookieMissing |
| Test_2550.txt | TryCountSiteView 200；wcms.visitor 具 Secure、SameSite=Strict、HttpOnly | 403 text/html，未列 Set-Cookie；有防偽 Cookie 與 Header | 是否配對有效須查日誌；不能僅憑有值判定有效 |

兩份測試回應的 Date、Content-Length 及 Trace ID 相同；須確認掃描匯出與伺服器日誌，
不預先判定為快取、誤判或某個代理故障。原始檔含帳密與 Token，未納入 Git；
本文件只保存 Cookie 名稱與屬性，不保存其值。

後端 XSRF 拒絕使用 JSON，而前端 IIS 原設定為 Replace，因此先補強 API 回應保留。
附件未包含 HTML 本文，不能斷言唯一替換來源或宣稱 SameSite Finding 已修復。

## 設定邊界與部署

- location 的 Service 為應用程式相對路徑；保留既有 Host 白名單與 Node Port 部署替換值。
- 此修改不部署網站。前端打包若只產生 web.config.bak，需依既有部署流程人工合併到正在使用的 web.config。
- 不可用仍含部署占位符的範本直接覆蓋正式設定；確認 IIS 區段可在該位置設定，避免 500.19。
- 非 API 路徑仍使用原有維護頁政策；/Service 的既有 4xx／5xx 本文改為保留。
- /Service 的 Node／ARR 502／503 可能保留既有代理錯誤本文，而非維護頁。
  必須在隔離測試站驗證狀態碼、資訊洩漏及預期顯示；本次不宣稱 API 故障維護頁已通過。
- errorMode 維持 Custom，不啟用 Detailed。若後端 IIS 或其他上游已替換本文，
  前端 PassThrough 無法還原 JSON，須逐層比對後另行處理。

## 執行回歸測試

沿用 WCMS_VERIFY_BASE_URL、WCMS_VERIFY_AUTHORIZATION、WCMS_VERIFY_COOKIE 的受控環境變數設定。
不得將實際 Token 寫入程式碼或共享日誌。

```text
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py
```

新增 XSRF 案例不使用管理者憑證，帶合法 Origin／Referer，POST 至既有僅 GET 的診斷路由。
缺少 Cookie 案例僅帶固定無效 Header；無效 Token 案例加上固定無效防偽 Cookie。
此設計避免防護失效時執行 Login 或網站計次；若收到 405，測試應失敗而非視為通過。
兩筆請求預期均為 403 JSON、success=false、message=Invalid XSRF token.；
有不同的 32 位十六進位 X-WCMS-Trace-Id，且不發行 Cookie。
固定無效資料只驗證拒絕分支，不等同重現有效 Token 因身分切換而失配的情境。

測試允許後端 no-referrer 或 Node strict-origin-when-cross-origin；
允許 IIS 清空的 X-Powered-By，但仍拒絕任何非空伺服器識別值。
此為符合既有對外政策，並非放寬網站設定。

部署後另需：
1. 在後端 logs/security/security-*.log 對照 TraceId 與 Reason，確認缺少 Cookie 及驗證失敗分類。
2. 使用同一新工作階段取得 GetXsrfToken，驗證正常登入、登出、Token 更新及計次；
   確認正常回應 Cookie Strict／Secure／HttpOnly。
3. 驗證普通 400／401／403／404／409／500 狀態碼與 JSON，未意外轉成 200 或 HTML。
4. 在隔離測試站模擬 Node 停止或代理失敗，分別驗證非 API 的維護頁與 API 502／503。
5. 重新產生 AppScan 完整證據，包含實際設定 Cookie 的回應；不因 403 無 Cookie 宣稱掃描通過。

## 本次驗證結果

已完成 Python 語法、合成回應測試（正常 XSRF 拒絕、HTML 替換、Trace 重用、
錯誤拒絕原因）、新測試不送認證憑證檢查，以及 XML 解析／Service 範圍／維護頁映射檢查。
合成回應測試只驗證腳本判斷，不能取代真實 WCMS 執行。

環境沒有 .NET SDK 或 Windows IIS，未執行 dotnet build、IIS 執行期、真實 HTTP、
維護頁故障演練或 AppScan。部署與弱掃驗收仍待執行。
