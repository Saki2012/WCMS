# WCMS 前端同裝置 Shared State 與多分頁架構

> 文件版本：Version 1.0  
> 對標分支：`Feature/Dev`  
> 建立日期：2026-08-14  
> 適用範圍：前端登入 Session、SaaS 會員狀態、購物車、權限、通知、草稿與其他同 Origin／同裝置共享狀態

> [!NOTE]
> 本文件補充 [`02_前端專案架構.md`](./02_前端專案架構.md) 的 Runtime State Scope。重點是先定義「狀態屬於哪一層、誰可以修改、修改後如何同步」，不強制指定 `BroadcastChannel`、`storage` event 或特定第三方狀態管理工具。

---

## 1. 為什麼需要獨立定義 Shared State Scope

Browser 多分頁／多視窗環境中，同一個 WCMS Origin 可能同時存在多個 React Runtime。

單一 Tab 內看似正確的 Timer、Module Variable、Ref 或 Context，不代表整個 Browser Session 的狀態一致。

典型風險如下：

```text
Tab A
├─ React State A
├─ Idle Timer A
├─ Refresh Lock A
└─ Auth Context A

Tab B
├─ React State B
├─ Idle Timer B
├─ Refresh Lock B
└─ Auth Context B

        ↓ 但可能共用 ↓

Browser / Origin Shared State
├─ Cookie
├─ localStorage / IndexedDB
├─ 同 Origin Cache
└─ Backend Session / Token / Cart State
```

若「控制器」是 per-tab，但「被控制的資源」是 Browser／Backend 共用，就可能發生互相登出、重複 Refresh、狀態覆蓋、購物車不一致或權限漂移。

---

## 2. State Scope 分層

### 2.1 Tab Local

只屬於單一 Browser Tab／Window Runtime 的狀態，例如：

- React State／Context。
- Module Variable。
- `useRef`。
- Timer／Interval。
- 單一 Tab 的 Request in-flight 狀態。
- `sessionStorage`。
- 單一頁籤的 UI 展開、焦點、表單輸入與未儲存狀態。

Tab Local 狀態預設不會自動同步到其他 Tab。

### 2.2 Browser / Origin Shared

同一 Browser、同 Origin 下可能被多個 Tab 共同讀寫的狀態，例如：

- Cookie。
- `localStorage`。
- IndexedDB。
- Service Worker／Shared Worker 可見狀態。
- 同 Origin 的登入、會員或前台 Session 指示狀態。

修改這一層前，必須確認其他 Tab 是否需要收到同步、失效或重載訊號。

### 2.3 Backend Shared

由 Backend 或分散式基礎設施持有、可能被同一使用者多個 Tab／Request 共用的狀態，例如：

- Refresh Token State。
- Access Token Blacklist。
- Permission Cache。
- Backend Session。
- SaaS Tenant／Membership Context。
- Server-side Cart。
- 編輯鎖、草稿版本或其他共享業務狀態。

Backend Shared State 涉及併發修改時，不能只依前端單一 Tab 的 Lock 假設安全。

---

## 3. Shared State 的設計原則

### 3.1 先定義 Source of Truth

每個共享狀態必須先回答：

```text
誰是最終真相？
├─ Tab Local
├─ Browser / Origin Shared
└─ Backend Shared
```

不得同時讓多個 Layer 都各自成為權威來源，而沒有同步或失效規則。

### 3.2 控制 Scope 必須與資源 Scope 對齊

若資源跨 Tab 共用，控制該資源的 Idle、Refresh、Logout、Lock、Version 或 Invalidations 不能只存在於互不協調的 Tab Local State。

例如：

```text
Shared Cookie / Shared Refresh Token
+ per-tab Idle Timer
+ per-tab Refresh Lock
= 高風險 Scope 不對稱
```

### 3.3 非冪等共享操作必須有併發策略

可能改變共享資源的操作，例如：

- Refresh Token Rotation。
- Logout／Session Revoke。
- 購物車數量修改。
- 結帳狀態轉換。
- 編輯鎖取得／釋放。
- 會員／Tenant Context 切換。

必須明確定義至少一種正式保護：

- Single-flight。
- 序列化。
- Version／ETag／Compare-And-Swap。
- Idempotency Key。
- Backend Atomic Operation。
- 其他可證明不會互相覆蓋的協調機制。

不得只以單一 Tab Module Variable 當成跨 Browser Session 的並發保護。

### 3.4 同步事件不得攜帶不必要敏感資料

跨 Tab 同步原則上傳遞「事件與狀態變更訊號」，而不是 Token 原文。

例如可傳遞：

```text
auth:activity
auth:logout
session:invalidated
cart:changed
permission:changed
tenant:changed
```

Access Token、Refresh Token、Secret 或其他敏感原文仍應依既有 Cookie／Backend Security 邊界處理。

### 3.5 不預先綁死同步技術

可依需求選擇：

- `BroadcastChannel`。
- `storage` event。
- Shared Worker／Service Worker。
- Backend Session Coordinator。
- Server Push／Polling。
- 其他正式共用 Runtime Adapter。

選型必須依狀態生命週期、SSR 邊界、Browser 支援、安全性與部署架構決定。

Feature／Spec 不得自行建立另一套平行 Shared State Coordinator。

---

## 4. Auth／Idle／Refresh 的目前已知案例

2026-08-14 針對 #23 的 Development 雙 Tab 實測已重現：

```text
Tab A 持續操作
Tab B 保持 Idle
        ↓
Tab B Idle 到期
        ↓
呼叫 /Auth/Logout
        ↓
共用 Access / Refresh / XSRF Cookie 被撤銷或刪除
        ↓
Tab A 下一次 API / Save 發生 401 並失去登入狀態
```

因此目前已確認：

- Idle Timer 屬於 Tab Local。
- Auth Cookie／Refresh State 屬於 Browser／Backend Shared。
- Tab A Activity 不會自然重設 Tab B 的 Idle Timer。
- 背景 Tab 的 Idle Logout 會影響仍在操作的其他 Tab。

這是已實測的 #23 問題案例，不代表本文件只適用 Auth。

### 4.1 Refresh 另有多入口與多 Tab 競態風險

Refresh 還需同時考慮：

```text
單一 Tab
├─ Activity KeepAlive Refresh
└─ API 401 Interceptor Refresh

多個 Tab
├─ Tab A Refresh
└─ Tab B Refresh
```

當 Backend 使用 Refresh Token Rotation 時，多個入口若沒有一致的協調與原子性保護，可能同時操作同一份 Refresh State。

此項目前屬靜態可確認的 Race Window；實際 Runtime Root Cause 與最終修正方案仍依 #23 後續驗證與 RD 判定為準。

---

## 5. 未來 SaaS 與前台會員機制

Shared State Scope 不只服務後台登入。

### 5.1 SaaS 會員／Tenant Context

未來若同一 Browser 可切換：

- Tenant。
- Organization。
- Site。
- Role／Membership。

必須確認另一個 Tab 是否仍使用舊 Context，以及切換後是否應同步失效、重新取權限或阻止舊 Context 繼續送出修改。

### 5.2 前台會員與購物車

購物車常同時具有：

```text
Tab Local UI
Browser Shared Cart Indicator
Backend Cart State
```

需要定義：

- Tab A 加入商品後 Tab B 是否更新數量。
- Tab B 結帳後 Tab A 的舊購物車是否立即失效。
- 匿名 Cart 與登入 Cart 合併時誰是 Source of Truth。
- 多 Tab 同時修改數量時如何避免 Last Write Wins 造成資料遺失。
- 登出／會員切換是否應同步清除或重新建立 Cart Context。

### 5.3 其他可能共享狀態

- 通知未讀數。
- 後台權限變更。
- 編輯鎖。
- 草稿版本。
- 即時預覽。
- 長流程 Wizard。
- 帳號停權／強制登出。

設計前都先依本文件建立 State Scope Map。

---

## 6. SSR／CSR 邊界

跨 Tab 協調通常依賴 Browser API，因此仍須遵循前端 SSR 規範：

- 不在模組載入階段直接使用 `window`、`document`、`BroadcastChannel` 或 Storage API。
- Client Coordinator 應在 Client Effect、事件時機或正式 Adapter 內初始化。
- SSR 與 CSR 第一次 Render 不得因 Shared State Coordinator 是否存在而產生不同主要 DOM。
- Hydration 後才同步的共享狀態，必須有明確 Loading／Stale／Ready 契約，避免畫面無提示跳動。

---

## 7. 變更 Shared State 時的基本檢查

涉及共享狀態的修改至少回答：

1. State 屬於 Tab Local、Browser Shared 還是 Backend Shared？
2. Source of Truth 在哪裡？
3. 哪些操作會修改共享狀態？
4. 其他 Tab 如何收到更新、失效或登出訊號？
5. 多 Tab 同時修改是否有 Race？
6. 非冪等操作是否有 Single-flight／Atomic／Version 保護？
7. Tab 關閉、重新整理、Background、Focus 後是否一致？
8. 是否會外洩 Token、Cookie 或敏感資料？
9. SSR 是否安全？
10. 單一 Tab Happy Path 正常是否掩蓋 Multi-tab 問題？

---

## 8. 驗證矩陣

Shared State 功能不能只測單一 Tab。

最低建議矩陣：

```text
Case A：單 Tab 正常操作
Case B：Tab A 操作 + Tab B Idle
Case C：Tab A / B 同時修改共享狀態
Case D：Tab A 修改後 Tab B Focus / Visibility 回復
Case E：其中一個 Tab Logout / Session Invalidated
Case F：Refresh / Save / Checkout 等非冪等操作同時發生
Case G：Refresh Page / Close Tab / Reopen
```

若功能涉及 SaaS Tenant、購物車、會員或權限，應依相同模式增加業務情境。

---

## 9. 目前責任邊界

本文件目前確立的是：

- Shared State Scope 必須被明確設計與檢查。
- 共用資源不能由互不協調的 per-tab Controller 任意修改。
- Multi-tab 必須納入 Auth、SaaS、會員、購物車等共用能力的架構與白箱檢測。

目前尚未確立：

- WCMS 最終統一採用哪一種跨 Tab Coordinator。
- #23 Refresh Token Rotation 的最終 Backend Concurrency 策略。
- 未來 SaaS／購物車是否採 Server Push、Polling 或其他同步方式。

上述項目在實作定案後再同步更新架構與端別開發規範，不將規劃中的能力描述成已完成。
