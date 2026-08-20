# Browser Shared State／Multi-Tab 專項白箱

> 文件版本：Version 1.2  
> 建立日期：2026-08-14  
> 最後更新：2026-08-20  
> 適用範圍：同裝置、同 Browser／Origin 的多分頁／多視窗共享狀態

> [!NOTE]
> 本 Topic 是 [`02_專項白箱檢測.md`](../02_專項白箱檢測.md) 的執行補充，保存背景、Scope Map、搜尋入口與驗證建議；正式 Rule ID 仍唯一維護於 [`RULE_REGISTRY.yml`](../RULE_REGISTRY.yml)。目前若尚無對應 active Rule，依正式架構與開發規範定位產出 Finding，不臨時建立永久 Rule ID。
>
> Shared State／Auth Session 的正式架構責任已整合回 [`01_整體專案架構.md`](../../../01_研發與技術文件/01_系統架構/01_整體專案架構.md)、[`02_前端專案架構.md`](../../../01_研發與技術文件/01_系統架構/02_前端專案架構.md) 與 [`03_後端專案架構.md`](../../../01_研發與技術文件/01_系統架構/03_後端專案架構.md)，本 Topic 只保留白箱檢測方法與 Runtime 證據邊界。

---

## 1. 觸發條件

命中下列任一情況時，應評估追加本專項：

- Login／Logout／JWT／Cookie／Refresh Token。
- Idle／KeepAlive／Session Timeout／LastActivity。
- Auth Probe／Permission／Account Disabled／Force Logout。
- `localStorage`、IndexedDB 或其他同 Origin 共用狀態。
- Web Locks、`BroadcastChannel`、`storage` event、Shared Worker、Service Worker 等跨 Tab 機制。
- SaaS Tenant／Organization／Membership Context。
- 前台會員登入狀態。
- 購物車／Checkout／Order Draft。
- 通知、編輯鎖、草稿版本或其他跨 Tab 共享狀態。
- Local Cache／Process Lock 未來要切換成 Redis／LB／Multi-instance。

單一 Tab Happy Path 正常，不足以排除本專項。

---

## 2. 必須先建立 State Scope Map

白箱先把狀態分為：

```text
Tab Local
Browser / Origin Shared
Backend Shared
```

### Tab Local 常見證據

- React State／Context。
- Module Variable。
- `useRef`。
- Timer／Interval。
- Request in-flight Promise／Lock。
- `sessionStorage`。

### Browser / Origin Shared 常見證據

- Cookie。
- `localStorage`。
- IndexedDB。
- Web Locks lock name。
- Shared Worker／Service Worker State。

### Backend Shared 常見證據

- Refresh Token State。
- Session Cache。
- Permission Cache。
- Access Blacklist。
- Server-side Cart。
- Tenant／Membership Session。
- Lock／Version／Draft State。
- Redis／Distributed Cache State。

Finding 必須指出「控制 State」與「被控制資源」各自屬於哪一層。

---

## 3. 共通白箱問題

至少確認：

1. Source of Truth 在哪一層？
2. 多個 Tab 是否共同讀寫同一份 Browser／Backend State？
3. Tab Local Timer／Lock／Context 是否錯誤地控制共享資源？
4. Tab A 的修改是否需要同步給 Tab B？
5. Tab B 的失效／Logout 是否會撤銷 Tab A 正在使用的共享 Session？
6. 多個 Tab 是否能同時執行非冪等共享操作？
7. 是否存在 Single-flight、序列化、Atomic、Version 或 Idempotency 保護？
8. Frontend Lock 被繞過時，Backend 是否仍能維持一致性？
9. Background／Visibility／Focus／Reload／Reopen 後是否會重新校正狀態？
10. 是否只在單一 Tab 測試成功就宣告機制正常？
11. 跨 Tab 訊息是否攜帶 Token、Secret 或其他不必要敏感資料？
12. Process-local Lock 是否被錯誤宣稱可以保護 LB／Multi-instance？
13. Distributed Shared State 不可用時是否錯誤 fallback 成各 Instance 自己的 Local State？

---

## 4. Auth／Session 專項路徑

涉及登入時至少沿：

```text
Frontend Auth Context
→ Login Session Start
→ LastActivity
→ Activity Listener
→ AuthSessionCoordinator
→ Idle Timer
→ KeepAlive Refresh
→ Axios 401 Interceptor
→ AuthRefreshCoordinator
→ /Auth/Refresh
→ Refresh Token State
→ Rotation / Revoke
→ Cookie Update
→ /Auth/Logout
→ Cookie Delete / Session Revoke
→ visibilitychange / focus / route auth probe
```

並分別確認：

### 4.1 Idle／LastActivity

- Login 成功是否明確建立 Session LastActivity 起點。
- Activity 是否正式同步 Browser Shared LastActivityAt。
- `click` 等既定有效操作是否能重置 Idle；`mousemove` 是否被錯誤當成無限續命來源。
- Timer 到期時是否重新確認 Shared LastActivityAt，而不是直接 Logout。
- Background Tab 的 Idle 是否可能登出整個 Browser Session。
- Reload／F5／新 Tab／Browser Reopen 是否錯誤把 `Date.now()` 當成新 Activity。
- Reload 時是否沿用原 LastActivity／剩餘 Deadline，而非重給完整 Idle Window。
- LastActivity 缺失或已過期時，是否先做 Idle Gate，再決定能否執行 `/Auth/Me`／Refresh。
- `/Auth/Me`、Refresh、focus、visibilitychange 本身是否錯誤延長 Idle。
- Logout 的語意是 Tab、Browser Session 還是 Account／Device Session。
- 其他 Tab 是否能即時收到 Logout／Invalidation。
- 跨 Tab Activity Event 是否會錯誤觸發其他 Tab 的 KeepAlive Refresh。

### 4.2 Refresh

- 同一 Tab 的 Activity Refresh 與 401 Refresh 是否使用同一個真正的 Single-flight。
- 同 Tab 多支 401 是否只建立一個 in-flight Refresh Promise。
- 不同 Tab 的 Refresh Coordination 是否互相可見。
- 若使用 Web Locks，Browser 不支援時的 fallback 語意是否明確。
- Browser Shared Refresh 訊息是否只保存 timestamp／event，不保存 Token 原文。
- Backend Refresh Rotation 是否可保證同一 old RTID 只成功一次。
- 兩支 Refresh 同時讀到 old token 後，最終 Commit 階段是否仍重新驗證 old token。
- Rotation 失敗的 Request 是否禁止寫入 new Cookie。
- Frontend Coordinator 被手工 Request 繞過時，Backend 是否仍安全。

### 4.3 Local／Redis／LB Deployment Scope

若 Backend Concurrency 使用 process-local `SemaphoreSlim`／Lock：

- DI Lifetime 是否能讓同一 Process 的 Request 共用同一把 Lock。
- Critical Section 是否只包必要 State Exchange，避免不必要長時間鎖住。
- 文件是否明確限制為 Single Backend Process。
- LB／Multi-instance 前是否有明確 Redis Atomic Migration Point。

進入 LB + Redis 後至少確認：

```text
Backend A Lock
≠
Backend B Lock
```

所以 old RTID 的：

```text
Check Owner
+ Create New
+ Delete Old
```

必須由 Redis／Shared Store 以單一 Atomic Operation 提供，不得只靠各 Process 的 Lock。

Auth Token State 在 Multi-instance 下若宣告 Redis Required，Redis 不可用時不得靜默 fallback 成各 Backend Local State。

### 4.4 Auth Probe／Error Classification

- `/Auth/Me`、focus、visibilitychange、route probe 的錯誤分類是否一致。
- 401、403、500、Network Error、Timeout 是否被正確區分。
- 暫時性錯誤不得因 Multi-tab Probe 被放大成全 Browser Logout。

> [!NOTE]
> #23 的 Error Classification 已拆至後續 Issue #89；不得因 #23 Session／Refresh 收斂完成而把本檢查項誤標為已完成。

---

## 5. SaaS／會員／購物車專項路徑

### 5.1 Tenant／Membership

確認：

```text
Tab A 切換 Tenant / Organization / Role
→ Browser Shared Context 是否更新
→ Tab B 是否仍持有舊權限／舊 Tenant
→ 下一次 Query / Save 是否能阻止錯誤 Context 寫入
```

### 5.2 Cart／Checkout

確認：

```text
Tab A Add / Remove / Change Quantity
→ Browser / Backend Cart 更新
→ Tab B Cart Indicator / Cart Detail 是否 stale

Tab B Checkout
→ Cart 狀態轉換
→ Tab A 舊 Cart 是否仍可送出修改
```

若採匿名 Cart + 登入 Cart 合併，另外確認 Merge 的 Source of Truth、重試與冪等性。

---

## 6. 靜態可確認與 Runtime 邊界

### 靜態可確認

例如：

- Shared Cookie + per-tab Idle Timer。
- Shared Refresh Token + per-tab Refresh Lock。
- Coordinator mount 直接以 `Date.now()` 覆寫既有 LastActivity。
- 多個 Refresh 入口沒有共用 Single-flight。
- Backend Rotation 是分離的 Get／Set／Remove，沒有 Commit-time Atomic Guard。
- Logout 會撤銷共享 Session，但沒有任何跨 Tab 通知。
- localStorage／Cookie 被多處直接寫入且沒有正式 Coordinator。
- Process-local Lock 被拿來宣稱支援 LB／Multi-instance。

這些可標示「不符合」或「可能不符合」需依正式規範與證據判斷。

### 需要 Runtime

例如：

- Race 是否在目前網路延遲下實際重現。
- 同一 old RTID 並行後實際 Status／Rotation 結果。
- Browser Cookie 最後寫入順序。
- Background Tab Timer throttling 對實際 Timeout 的影響。
- Web Locks／storage event 的 Browser 支援與實際時序。
- 修正後是否真的只送一支 Refresh，或 Backend 是否只允許一支成功。
- Reload／Browser Reopen 是否真的沿用原 Idle Deadline，而非重新取得完整 Timeout。

不得把靜態 Race Window 直接描述成已實機重現，也不得把 Code 已修改直接描述成 Runtime Regression Passed。

---

## 7. 最低 Runtime 驗證矩陣

若 RD／QA 要驗證本專項，至少包含：

```text
A. 單 Tab Happy Path
B. Tab A 持續操作 + Tab B Idle
C. Tab A / B 同時觸發共享操作
D. Tab B Background → Focus / Visibility 回復
E. 任一 Tab Logout / Session Invalidate
F. Refresh / Save / Checkout 等非冪等操作同時發生
G. Reload / Close / Reopen
H. 繞過 Frontend Coordinator 直接並行呼叫 Backend
```

Auth 專項另外觀察：

- `/Auth/Refresh` 真正 Request 次數與時間。
- 401／403。
- Request 使用的 RTID 是否相同；證據只保留指紋／前綴，不保存完整 Token。
- Response 是否建立不同 new RTID。
- Refresh Cache HIT／MISS。
- Refresh Owner。
- Token／RTID Fingerprint Rotation。
- Cookie 是否存在。
- Idle Deadline 與 Last Activity。
- Reload 前後 Idle Deadline 是否維持原生命週期。
- Browser 是否支援 Web Locks。

---

## 8. #23 已知案例與驗證狀態

### 8.1 Multi-tab Idle

2026-08-14 Development 雙 Tab 實測已重現：

```text
Tab A 持續操作
Tab B Idle
→ Tab B Idle Logout
→ 共用 Session Cookie / Refresh State 被撤銷
→ Tab A 下一次 API / Save 發生 401 / Login
```

修正後已重新 Runtime 驗證：

```text
Tab A Active + Tab B Idle → PASS，不登出
全部 Tab Idle → PASS，同步登出
任一 Tab Manual Logout → PASS，同步登出
```

因此「多分頁 Idle Scope 不一致」目前可標示：

- Runtime Confirmed。
- Fix Implemented。
- Runtime Regression Passed。

### 8.2 Refresh Rotation Race

2026-08-18 已以同一 old RTID 並行送出兩支 `/Auth/Refresh`，確認修正前：

```text
R1 → R2 → 200
R1 → R3 → 200
```

第二階段實作包含：

- `AuthRefreshCoordinator`：同 Tab single-flight。
- Browser 支援時使用 Web Locks 跨 Tab 協調。
- Browser Shared State 只保存 Refresh CompletedAt timestamp。
- Backend `TryRotateRefreshAsync`：目前 Single Process／Local Token State 下以 process-local Lock 保證同一 old RTID 只成功一次。

2026-08-20 實機 Regression 已取得：

```text
同一 old RTID 直接並行
→ 200 + 401

同 Tab AuthAPI.refresh() × 2
→ Network 實際只有 1 支 /Auth/Refresh

雙 Tab 同時要求 Refresh
→ Web Locks 支援
→ 一方 Performed=true
→ 另一方 Performed=false
→ CompletedAt 相同
```

因此本階段可標示：

- Runtime Root Cause Confirmed。
- Fix Implemented。
- Runtime Regression Passed。

### 8.3 LastActivity Reload／Reopen 生命週期

2026-08-20 收斂規則：

```text
Login 成功 → 建立 LastActivity
有效 click / keydown / scroll / touchstart → 延後 Idle
mousemove → 不延後 Idle
Reload / F5 / 新 Tab / Browser Reopen / Me / Refresh → 不得自行延後 Idle
```

程式已改為 Coordinator 啟動先讀既有 LastActivity；缺失或過期時不先執行 Auth Probe／Refresh 續命。

目前狀態：

- Policy Confirmed。
- Fix Implemented。
- Reload／Reopen Runtime Regression Pending。

在實際驗證「剩餘 Idle 時 F5 不重回完整 Timeout」及「Browser 關閉超過 Idle 再開回 Login」前，不得標示 Regression Passed。

---

## 9. 報告輸出要求

除一般專項摘要外，Shared State Finding 應額外列出：

```text
【State Scope】
【Source of Truth】
【修改共享狀態的入口】
【跨 Tab 同步機制】
【Concurrency 保護】
【Deployment Scope：Single Process / Multi-instance】
【Frontend Coordination 是否為 Best Effort】
【Backend Atomic Guarantee】
【單 Tab / 多 Tab 差異】
【Runtime 是否已重現】
【Regression 是否已實測】
```

若沒有正式同步機制，不能自行把 Web Locks、`BroadcastChannel` 或 `storage` event 當成唯一修正答案；先描述需要解決的 Scope／Concurrency 問題，再由 RD 決定實作。

涉及 Refresh Token、Cart Checkout、Tenant Switch 等 Backend Shared 非冪等操作時，白箱不得只驗 Frontend Lock，必須一路追到 Backend／Shared Store 的最終一致性保證。
