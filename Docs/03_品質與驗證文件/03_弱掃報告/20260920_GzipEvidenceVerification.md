# gzip 回應取證與登入 403 複驗

日期：2026-09-20
修改來源：Feature/Dev；整合目標：Spec1821。

## 完成項目
僅更新 Verify-ErrorResponseSecurity.py 與本文件：
- Content-Encoding 為 gzip 時先解壓再解析 UTF-8／JSON；identity 與未壓縮回應沿用原流程。
- 壓縮前後限制 1 MiB；損壞、截斷、不支援編碼均以固定訊息報錯。
- 輸出測試案例、狀態、白名單 Content-Type、格式有效的 Trace ID；不輸出本文、帳密、Cookie 或 Token。
- unittest 結果列出成功／失敗，預設 all 保留原測試組。
- xsrf 組不需管理者憑證；admin 組需有效憑證；selftest 完全離線。

## 執行方式
腳本路徑：WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py。

```text
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py --group selftest
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py --group xsrf
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py --group admin
python WCMS_Backend/Scripts/Verify-ErrorResponseSecurity.py --group all
```

xsrf／admin／all 使用 WCMS_VERIFY_BASE_URL 指定 HTTPS 測試站。
admin／all 另需以受控環境變數提供 WCMS_VERIFY_AUTHORIZATION 或 WCMS_VERIFY_COOKIE。
xsrf 的兩筆請求不送上述登入憑證，使用固定無效防偽資料與合法 Origin。
只向既有 GET 診斷路由送 POST，避免測試失敗時執行登入或計次業務；405 視為失敗。
本次僅腳本與文件，不需重建部署網站；在測試機取得新版腳本即可。

## 已有證據
Test_18757、Test_18758 的原始正常登入回應：access、rtid 均有 Strict／Secure／HttpOnly。
Test_2344 原始正常計次回應：wcms.visitor 亦有相同屬性。
三份測試回應為 403，標示 JSON、gzip、長度 75；匯出檔沒有本文，不能推定本文內容。
伺服器截圖對應的日誌為 Service/Auth/Login、Stage=Antiforgery、
Reason=AntiforgeryCookieMissing、HasXsrfHeader=true、HasAntiforgeryCookie=false。
此筆登入拒絕符合防護預期，不作為 SameSite 缺漏證據。

三份報告共用 Trace ID，但目前日誌只證實登入 API。
計次必須取得自己的 Trace 與 Service/SiteViewCount/TryCountSiteView 日誌；
不得拿登入日誌解釋不同路由。原始附件含憑證，不上傳至 Git。

## 後續驗收
1. 對測試站執行 xsrf，依每筆 Trace 對照 logs/security/security-*.log。
2. 同工作階段重新取得 Token／防偽 Cookie，人工確認正常登入與登出。
3. 在測試環境驗證正常計次並取得自己的日誌；計次會改變瀏覽次數。
4. 若僅掃描工作階段混用 Token，調整掃描流程；若一般瀏覽器也重現，才調查前端更新流程。
5. 只有取得不安全的實際 Set-Cookie 才修改發行政策；現有 Strict／Secure、XSRF 與 IIS 設定維持不變。

## 本次驗證
5 項離線測試通過：未壓縮／gzip JSON、無效與截斷資料、大小限制、
HTTPError gzip 與敏感標頭不輸出、xsrf 無憑證執行及 admin 憑證門檻。
沿用既有拒絕與 Trace 唯一性斷言。未執行真實 HTTP、伺服器日誌查詢或 AppScan；
不能宣稱弱掃通過。本次無資料庫或業務程式異動。
