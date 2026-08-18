# Browser Shared State／Multi-Tab 專項白箱

> 文件版本：Version 1.0  
> 建立日期：2026-08-14  
> 適用範圍：同裝置、同 Browser／Origin 的多分頁／多視窗共享狀態

> [!NOTE]
> 本 Topic 是 [`02_專項白箱檢測.md`](../02_專項白箱檢測.md) 的執行補充，保存背景、Scope Map、搜尋入口與驗證建議；正式 Rule ID 仍唯一維護於 [`RULE_REGISTRY.yml`](../RULE_REGISTRY.yml)。目前若尚無對應 active Rule，依正式架構與開發規範定位產出 Finding，不臨時建立永久 Rule ID。

---

## 1. 觸發條件

命中下列任一情況時，應評估追加本專項：

- Login／Logout／JWT／Cookie／Refresh Token。
- Idle／KeepAlive／Session Timeout。
- Auth Probe／Permission／Account Disabled／Force Logout。
- `localStorage`、IndexedDB 或其他同 Origin 共用狀態。
- `BroadcastChannel`、`storage` event、Shared Worker、Service Worker 等跨 Tab 機制。
- SaaS Tenant／Organization／Membership Context。
- 前台會員登入狀態。
- 購物車／Checkout／Order Draft。
- 通知、編輯鎖、草稿版本或其他跨 Tab 共享狀態。

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
- Request in-flight Lock。
- `sessionStorage`。

### Browser / Origin Shared 常見證據

- Cookie。
- `localStorage`。
- IndexedDB。
- Shared Worker／Service Worker State。

### Backend Shared 常見證據

- Refresh Token State。
- Session Cache。
- Permission Cache。
- Access Blacklist。
- Server-side Cart。
- Tenant／Membership Session。
- Lock／Version／Draft State。

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
8. Background／Visibility／Focus／Reload 後是否會重新校正狀態？
9. 是否只在單一 Tab 測試成功就宣告機制正常？
10. 跨 Tab 訊息是否攜帶 Token、Secret 或其他不必要敏感資料？

---

## 4. Auth／Session 專項路徑

涉及登入時至少沿：

```text
Frontend Auth Context
→ Activity Listener
→ Idle Timer
→ KeepAlive Refresh
→ Axios 401 Interceptor
→ /Auth/Refresh
→ Refresh Token State
→ Rotation / Revoke
→ Cookie Update
→ /Auth/Logout
→ Cookie Delete / Session Revoke
→ visibilitychange / focus / route auth probe
```

並分別確認：

### 4.1 Idle

- Activity 是否只更新目前 Tab。
- Background Tab 的 Idle 是否可能登出整個 Browser Session。
- Logout 的語意是 Tab、Browser Session 還是 Account／Device Session。
- 其他 Tab 是否能即時收到 Logout／Invalidation。

### 4.2 Refresh

- 同一 Tab 的 Activity Refresh 與 401 Refresh 是否使用同一個真正的 Single-flight。
- 不同 Tab 的 Refresh Lock 是否互相可見。
- Backend Refresh Rotation 是否可 Atomic Consume 舊 Refresh State。
- 兩支 Refresh 同時讀到 old token 時的結果是否安全。
- Rotation 後其他 Tab 是否能正確取得新狀態或重新校正。

### 4.3 Auth Probe／Error Classification

- `/Auth/Me`、focus、visibilitychange、route probe 的錯誤分類是否一致。
- 401、403、500、Network Error、Timeout 是否被正確區分。
- 暫時性錯誤不得因 Multi-tab Probe 被放大成全 Browser Logout。

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
- 多個 Refresh 入口沒有共用 Single-flight。
- Logout 會撤銷共享 Session，但沒有任何跨 Tab 通知。
- localStorage／Cookie 被多處直接寫入且沒有正式 Coordinator。

這些可標示「不符合」或「可能不符合」需依正式規範與證據判斷。

### 需要 Runtime

例如：

- Race 是否在目前網路延遲下實際重現。
- Browser Cookie 最後寫入順序。
- Background Tab Timer throttling 對實際 Timeout 的影響。
- Broadcast／storage event 的瀏覽器支援與實際時序。

不得把靜態 Race Window 直接描述成已實機重現。

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
```

Auth 專項另外觀察：

- `/Auth/Refresh` 次數與時間。
- 401／403。
- Refresh Cache HIT／MISS。
- Refresh Owner。
- Token／RTID Fingerprint Rotation。
- Cookie 是否存在。
- Idle Deadline 與 Last Activity。

---

## 8. #23 已知案例

2026-08-14 Development 雙 Tab 實測已重現：

```text
Tab A 持續操作
Tab B Idle
→ Tab B Idle Logout
→ 共用 Session Cookie / Refresh State 被撤銷
→ Tab A 下一次 API / Save 發生 401 / Login
```

因此 #23 的「多分頁 Idle Scope 不一致」已具有 Runtime 證據。

Refresh Multi-tab Race 目前仍應分開標示為靜態 Race Window，直到取得對應 Runtime 證據或 Backend Atomicity 證據。

---

## 9. 報告輸出要求

除一般專項摘要外，Shared State Finding 應額外列出：

```text
【State Scope】
【Source of Truth】
【修改共享狀態的入口】
【跨 Tab 同步機制】
【Concurrency 保護】
【單 Tab / 多 Tab 差異】
【Runtime 是否已重現】
```

若沒有正式同步機制，不能自行把 `BroadcastChannel` 當成唯一修正答案；先描述需要解決的 Scope／Concurrency 問題，再由 RD 決定實作。
