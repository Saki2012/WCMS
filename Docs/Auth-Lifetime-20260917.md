# 登入有效期調整（2026-09-17）

為驗證長時間弱掃中的登入到期／重新登入是否影響 SameSite 判定、造成可能誤判，一般部署的後台 Idle 與 Access Token 有效期由 30 分鐘統一調整為 24 小時（1440 分鐘）。此調整不是 SameSite 弱點修復或誤判結論。

- 前端 RequireAuth 實際傳入的非 Development Idle、AuthClient 預設值及診斷初始值同步為 24 小時。
- 後端 Jwt:AccessTokenMinutes 設定、TokenService 缺省值、Logout 撤銷清單 TTL 缺省值及診斷缺省值同步為 1440 分鐘。
- access Cookie 的期限沿用簽發的 Access Token 到期時間。
- Development 的前端 2 分鐘 Idle、後端 2 分鐘 Access Token 維持不變；分支名稱 Feature/Dev 不代表執行環境為 Development。
- Refresh Token 與 rtid Cookie 維持 7 天；Refresh 節流、XSRF、SameSite、跨分頁同步及手動登出機制不變。

## 部署與驗證

1. 重新建置並部署前端，部署後端與更新後的 appsettings.json；核對站台環境設定或 Jwt__AccessTokenMinutes 是否覆蓋為其他值。
2. 使用全新瀏覽器工作階段重新登入，避免沿用舊 Token。既有 JWT 不會因設定調整自動延長。
3. 在本機檢查新 JWT 的 exp 與 nbf 差值約為 86400 秒，並確認 access Cookie 的到期時間一致；不要把 Token 原文貼到外部解碼網站或報告。
4. 保留掃描與後端安全日誌，比對跨過原 30 分鐘後的登入失效、Refresh、Logout 與 XSRF 403。兩項期限同時延長只能驗證整體到期路徑的關聯，不能分辨是哪一項造成。
5. Idle 仍只由可信任使用者操作更新；活動紀錄缺失、手動登出、Token 撤銷或續期失敗仍可能使登入提前失效。24 小時不是保證不會登出的固定 Session 長度。

此次變更已完成修改範圍與數值一致性檢查；未執行完整前後端建置或站台弱掃。登入有效時間延長，驗證結束後應重新決定正式期限。
