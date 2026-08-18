# WCMS Auth Session 與 Refresh Token Rotation 架構

> 文件版本：Version 1.0  
> 對標分支：`Feature/Dev`  
> 建立日期：2026-08-18  
> 適用範圍：後台登入 Session、JWT Access Token、Refresh Token Rotation、多分頁 Refresh Coordination、未來 LB + Redis 部署

> [!IMPORTANT]
> 本文件描述 #23 第二階段完成後的 Auth Session／Refresh Token Rotation 架構。Frontend Coordination 用來降低正常 Browser 操作的重複 Refresh；Backend Rotation 才是安全與一致性的最終防線。

---

## 1. 架構目標

Refresh Token Rotation 必須同時解決兩個層次：

```text
Frontend
→ 避免同一 Tab 或同 Browser 的正常流程重複送出 Refresh

Backend
→ 即使 Frontend 協調失效、Request 重送或被人工並行呼叫
→ 同一 old RTID 仍只能成功 Rotation 一次
```

不得把「前端有 Lock」視為 Backend Refresh Token 單次使用的安全保證。

---

## 2. State Scope 與 Source of Truth

目前登入相關狀態分層：

```text
Tab Local
├─ React Auth Context
├─ Request in-flight Promise
├─ Activity Runtime
└─ UI Diagnostics Runtime

Browser / Origin Shared
├─ access Cookie
├─ rtid Cookie
├─ XSRF-TOKEN Cookie
├─ Shared LastActivityAt
└─ Shared LastRefreshCompletedAt

Backend Shared
├─ Refresh Token Owner State
├─ Access Token Blacklist
└─ Permission / Current User State
```

Refresh Token 是否仍可使用，以 Backend `TokenStateCache` 為 Source of Truth。

Browser Cookie 只是目前 Browser 持有的 Token Id；Frontend Shared State 只能協調 Request，不得自行宣告某個 RTID 在 Backend 仍有效。

---

## 3. 2026-08-18 已確認的 Refresh Race

#23 Runtime 驗證曾以同一 Browser Session 同時送出兩支 `/Auth/Refresh`，並確認：

```text
old RTID = R1

Request A：R1 → R2 → 200
Request B：R1 → R3 → 200
```

這代表舊流程：

```text
Get R1
→ Issue New RTID
→ Store New RTID
→ Revoke R1
```

不是 Atomic Rotation，兩支 Request 可同時讀到有效的 R1，再各自建立新 Refresh State。

此問題不只可能造成 Session 被錯誤登出，也可能產生 Browser 未持有、但 Backend 仍保存的 orphan Refresh Token branch。

---

## 4. Frontend Refresh Coordinator

### 4.1 唯一入口

`AuthClient.ts` 的 Activity KeepAlive 與 Axios 401 Interceptor 都必須進入：

```text
AuthAPI.refresh
→ refreshAuthSession
→ AuthRefreshCoordinator
→ 真正 /Auth/Refresh Request
```

不得再建立另一組 `isRefreshing`／`waitQueue` 或 Feature 專用 Refresh Lock。

### 4.2 同 Tab Single-flight

`AuthRefreshCoordinator` 以 module-level in-flight Promise 保護同一 React／JavaScript Runtime：

```text
Activity Refresh ─┐
401 Refresh A ─────┤
401 Refresh B ─────┼→ 同一個 in-flight Promise
401 Refresh C ─────┘
                      ↓
                 只送一支 Request
```

成功或失敗後才清除 in-flight Promise。

### 4.3 同 Browser／Origin Coordination

Browser 支援 Web Locks API 時，使用固定 lock name 序列化同 Origin Refresh：

```text
Tab A ─┐
       ├→ Web Lock：wcms:auth:refresh
Tab B ─┘
```

第一個 Tab Refresh 成功後，只把 `CompletedAt` timestamp 寫入 `localStorage`。

等待 Lock 的其他 Tab 取得 Lock 後，如果發現「自己開始等待之後，已有另一個 Tab 完成 Refresh」，就不再送第二支 Refresh，直接使用 Browser 已更新的 Cookie 繼續原流程。

### 4.4 Browser 不支援 Web Locks

若 Browser Runtime 沒有 Web Locks：

- 同 Tab Single-flight 仍有效。
- 跨 Tab Frontend Coordination 降級為 Best Effort。
- Backend `TryRotateRefreshAsync` 仍必須阻止同一 old RTID 重複成功。

因此 Web Locks 是正常流量協調，不是 Security Boundary。

### 4.5 Shared Refresh State 不得存 Token

Browser Shared Refresh State 目前只保存：

```text
wcms:auth:refresh:last-completed-at
→ timestamp
```

不得放入：

- Access Token 原文。
- Refresh Token／RTID 原文。
- XSRF Token 原文。
- JWT Payload 的敏感內容。

---

## 5. Backend Refresh Rotation Contract

### 5.1 穩定契約

Backend 以：

```text
TokenService.TryRotateRefreshAsync
→ TokenStateCache.TryRotateRefreshAsync
```

作為 Refresh Token Rotation 的正式狀態交換入口。

其 Contract 為：

> 指定 old RTID 若仍屬於預期 User，才可建立 new RTID 並撤銷 old RTID；同一 old RTID 只能成功一次。

### 5.2 現階段 Local／Single Process 實作

目前 `IdentityAccessSetup` 將 `TokenStateCache` 註冊為 Singleton。

現階段尚未啟用 Distributed Store 時，Token State 經既有 `CacheRoute` 使用 Local Store。

`TokenStateCache` 以 process-local `SemaphoreSlim` 保護 Rotation Critical Section：

```text
Acquire Process Lock
↓
重新確認 old RTID Owner
↓
Store new RTID
↓
Revoke old RTID
↓
Release Process Lock
```

因此即使兩支 Request 在 Lock 前都曾讀到 old RTID：

```text
R1 ─┬→ Request A：TryRotate Success → R2
    └→ Request B：TryRotate Fail → 401
```

第二支不得再建立 R3。

### 5.3 Lock Scope

目前 Lock 只包住 Token State Rotation，不包：

- DB User 查詢。
- Access Token 簽發。
- Cookie Response 寫入。
- 其他使用者的 Controller 流程。

現階段採單一 process lock 而非 per-RTID lock，目的為優先確保簡單、可證明的 Local 正確性；Critical Section 只包含 Local Cache State 交換，正常持有時間應非常短。

若未來實測 Refresh 高併發造成可觀測瓶頸，再評估 Keyed Lock；不得為效能先犧牲 Rotation Correctness。

---

## 6. Auth Refresh API 流程

修正後 `/Auth/Refresh`：

```text
讀取 old RTID Cookie
↓
驗證 XSRF Header / Cookie
↓
讀取 old RTID Owner
↓
確認 User 仍有效
↓
產生候選 Access / new RTID
↓
TryRotateRefreshAsync
├─ Success → 寫入 new Cookie → 200
└─ Fail    → 不寫 new Cookie → 401 Refresh already consumed
```

候選 Access Token 若 Rotation 失敗，不會被寫入 Browser，也不會成為可使用 Session。

---

## 7. 現階段部署契約

目前 Refresh Rotation 的 Backend Concurrency Guarantee 是：

```text
Single Backend Process
+ Local Token State
+ Singleton TokenStateCache
+ Process-local Rotation Lock
```

此保證不可直接延伸解讀成「已支援 Load Balancer 多 Instance」。

> [!WARNING]
> 在 `TryRotateRefreshAsync` 尚未替換為 Distributed Atomic Implementation 前，不得以多 Backend Instance + LB 上線並宣稱 Refresh Rotation 仍具相同 Atomicity。

---

## 8. 未來 LB + Redis 演進

### 8.1 為什麼 Process Lock 不夠

未來：

```text
             ┌→ Backend A ─ Process Lock A
Browser / LB ┤
             └→ Backend B ─ Process Lock B
                       ↓
                     Redis
```

Backend A 與 Backend B 的 `SemaphoreSlim` 完全互相不可見。

因此多 Instance 時，正確性必須由共享 Store 本身提供。

### 8.2 未來替換點

上層契約維持：

```text
AuthController
→ TokenService.TryRotateRefreshAsync
→ TokenStateCache.TryRotateRefreshAsync
```

只替換 `TokenStateCache.TryRotateRefreshAsync` 的底層實作為 Redis Atomic Operation。

理想語意：

```text
if old RTID exists and owner matches
{
    create new RTID with TTL
    delete old RTID
    return success
}

return fail
```

上述檢查、建立與刪除必須由 Redis 以單一 Atomic Operation 完成，例如依正式 Redis Client 能力採 Lua Script、Transaction／CAS 或等價機制；選型於 Redis 導入案確認，不在目前 Local 階段預綁死套件。

### 8.3 Multi-instance 時 Redis 為 Required Dependency

進入 LB／多 Backend Instance 後：

```text
Refresh Token State
→ Redis Required
→ Redis 不可用時 Fail Closed
→ 不得各 Backend 自行 fallback 成 Local Token State
```

否則會形成：

```text
Backend A Local：R1 valid
Backend B Local：R1 valid
```

造成 Token State 分裂。

---

## 9. 驗證矩陣

### 9.1 Backend Race Regression

使用同一 old RTID 並行送兩支 Refresh：

```text
Before
R1 → R2 → 200
R1 → R3 → 200

After Expected
R1 → R2 → 200
R1 → 401 Refresh already consumed
```

不得再觀察到同一 old RTID 產生兩個 Backend 有效 new RTID。

### 9.2 Frontend Single-flight

至少驗證：

- 同 Tab Activity Refresh + API 401 同時發生，只送一支真正 Refresh。
- 同 Tab 多支 API 同時 401，只送一支真正 Refresh，其餘等待後 Replay。
- 雙 Tab 同時觸發 Refresh，支援 Web Locks 的 Browser 正常情況應只送一支真正 Refresh。
- 不支援 Web Locks 或人工繞過 Frontend 時，Backend 仍只能讓同一 old RTID 成功一次。

### 9.3 與 Idle Regression 分開

仍需保留 #23 第一階段已通過的：

```text
Tab A Active + Tab B Idle → 不登出
全部 Tab Idle → 同步登出
任一 Tab Manual Logout → 同步登出
```

不得因 Refresh 修正破壞 Shared Idle／Logout Coordinator。

---

## 10. 已知邊界

本階段已處理：

- 同 Tab Activity／401 Refresh single-flight。
- 支援 Web Locks Browser 的跨 Tab Refresh Coordination。
- 同一 Backend Process／Local Token State 的 old RTID single-use Rotation。

本階段不宣稱已處理：

- LB + 多 Backend Instance 的 Distributed Atomic Rotation。
- Redis Atomic Script／Transaction 實作。
- RequireAuth 的 401／403／5xx／Network／Timeout Error Classification。
- Refresh 與其他 Session Mutation 的所有可能競態；若後續驗證發現 Logout／Disable／Force Logout 需 Session Family／Generation Model，另案擴充。

---

## 11. 主要程式位置

Frontend：

```text
WCMS_Frontend/src/SysCore/Components/Auth/AuthRefreshCoordinator.ts
WCMS_Frontend/src/SysCore/Components/Auth/AuthSessionCoordinator.ts
WCMS_Frontend/src/SysCore/Utils/API/AuthClient.ts
WCMS_Frontend/src/SysCore/Components/Auth/RequireAuth.tsx
```

Backend：

```text
WCMS_Backend/Features/IAM/Auth/Auth_API.cs
WCMS_Backend/SysCore/Security/IdentityAccess/Authentication/TokenService.cs
WCMS_Backend/SysCore/Security/IdentityAccess/Authentication/TokenStateCache.cs
WCMS_Backend/SysCore/Security/IdentityAccess/IdentityAccessSetup.cs
WCMS_Backend/SysCore/PlatformServices/Cache/CacheRoute.cs
```

相關文件：

```text
04_前端同裝置SharedState與多分頁架構.md
05_AuthSession與RefreshTokenRotation架構.md
Topics/BrowserSharedState.md
```
