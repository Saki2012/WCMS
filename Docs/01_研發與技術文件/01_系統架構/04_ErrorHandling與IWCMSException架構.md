# WCMS ErrorHandling 與 IWCMSException 目標架構

> 文件版本：Version 0.1  
> 對標分支：`Feature/Dev`  
> 決策日期：2026-08-10  
> 狀態：**目標架構已確認，程式收斂進行中**

> [!IMPORTANT]
> 本文件定義 WCMS 後端下一階段 Error Handling 的目標架構與開發方向。
> 目前 `Feature/Dev` 仍可能存在 `BadRequest(...)`、`Unauthorized(...)`、ModelState 自行回應、`HTTP 200 + IsSuccess=false`、直接 `catch` 後回傳錯誤等舊路徑；在程式尚未完成收斂前，文件中的「目標架構」不得被描述為已全面落地。

---

## 1. 設計目標

WCMS 後端錯誤處理收斂後，標準 JSON API 原則分成兩條主線：

```text
成功
→ Controller / API
→ OkResponse<T>
→ ApiResponse<T>
→ 2xx

失敗
→ 已知錯誤：WCMSXXXException + IWCMSException
→ 未知錯誤：原始 Exception
→ ErrorHandlingMiddleware
→ HTTP Status + SysMessage + ApiResponse
```

核心原則：

1. 成功結果由 `OkResponse<T>` 統一建立。
2. 可辨識、可預期、可對外說明的錯誤，原則上使用具體的 `WCMSXXXException` 表達，並實作 `IWCMSException`。
3. 真正未知、無法安全分類的 Exception 不強制包裝，交由 ErrorHandling 視為未知系統異常處理。
4. `ErrorHandlingMiddleware` 統一負責 HTTP Status 與 Error `ApiResponse` 的最終回應。
5. 前端顯示訊息使用 `MessageCode + MessageArgs → ErrorHelper → Resx → SysMessage`。
6. NLog 保存 Exception、InnerException、StackTrace、TraceId 等技術診斷資訊，不直接作為前端顯示內容。
7. Startup / Setup 階段不屬於 HTTP Request Error Handling，由 Program / Startup 流程 Fail Fast 並記錄 Fatal Log。

---

## 2. IWCMSException 契約

`IWCMSException` 的目的不是取代 `System.Exception`，而是標記：

> 「這是一個 WCMS 已能辨識其對外錯誤語意的 Exception。」

第一階段契約保持最小化：

```csharp
/// <summary>
/// 定義 WCMS 可辨識例外的系統訊息契約。
/// </summary>
public interface IWCMSException
{
    string MessageCode { get; }
    object[] MessageArgs { get; }
}
```

### 2.1 不放入 HTTP Status

`IWCMSException` 不直接保存：

```text
StatusCode
HttpStatus
Response
IActionResult
```

原因：HTTP Status 屬於 ErrorHandling 的 Response Mapping 責任，不應由底層 Exception 自行決定 Transport 行為。

### 2.2 不放入前端最終文字

`IWCMSException` 不保存 `UserMessage` 或直接回傳用文字。

前端訊息統一走：

```text
MessageCode + MessageArgs
→ IErrorHelper
→ Resx / I18n
→ SysMessage
```

避免 Exception 內直接寫死中文、英文或其他語系內容。

### 2.3 技術錯誤資訊留在 Exception Chain

原始 Framework / DB / Runtime Exception 應盡可能保存為 `InnerException`：

```text
WCMSXXXException
└─ InnerException
   └─ Framework / DB / Runtime Exception
```

前端只使用安全的 `MessageCode / MessageArgs`；NLog 則保留完整 Exception Chain。

---

## 3. WCMSXXXException 命名與 sealed 原則

WCMS 自訂 Exception 使用具體錯誤語意命名，例如：

```text
WCMSJsonException
WCMSRequestValidationException
WCMSPermissionException
WCMSResourceNotFoundException
WCMSDataConflictException
```

> [!NOTE]
> 上述名稱除 `WCMSJsonException` 為目前優先驗證方向外，其餘為分類示意；只有實際需要時才建立，不預先產生大量未使用 Exception 類別。

### 3.1 預設一律 sealed

具體的 `WCMSXXXException` 預設使用：

```csharp
public sealed class WCMSJsonException : JsonException, IWCMSException
{
}
```

原因：

- Exception Type 本身應代表明確錯誤語意。
- 避免後續出現無限制的 Exception 繼承階層。
- ErrorHandling 可直接依具體 Type 建立穩定 Mapping。
- 只有未來確定需要作為 Exception 基底類別時，才另案討論是否取消 `sealed`。

---

## 4. Framework Exception 與 WCMS Exception 的關係

WCMS 不要求所有 Framework Exception 都重新包裝。

判斷順序：

```text
發生 Framework / DB Exception
        ↓
是否已能安全且唯一表達 WCMS 錯誤語意？
        ├─ 否 → 在最接近且最了解上下文的邊界轉成 WCMSXXXException
        │       並保留原始 InnerException
        │
        └─ 是 → 評估 Framework 是否會攔截或改變 WCMS Error Flow
                  ├─ 不會 → 可直接沿用或由 ErrorHandling Mapping
                  └─ 會   → 改以 WCMSXXXException 表達
```

### 4.1 不可直接全域 Mapping 的模糊 Exception

例如：

```text
FormatException
ArgumentException
InvalidOperationException
KeyNotFoundException
```

這些 Exception 可能來自 Request，也可能代表程式 Bug；不得直接建立：

```text
FormatException → 400
ArgumentException → 400
KeyNotFoundException → 404
```

若發生位置能明確判定為 WCMS Request / Business 語意，應在該邊界轉成具體 `WCMSXXXException`。

### 4.2 Framework 特殊處理風險

ASP.NET Core / MVC 可能對特定 Exception 有既定行為，例如 JSON Input Formatter、ModelState、Authentication、Authorization 等。

因此：

> WCMS Exception 是否繼承 Framework Exception，必須以「實際 Pipeline 行為」驗證，不以型別語意推測即可視為完成。

若繼承 Framework Exception 後被框架提前攔截，導致未進入 `ErrorHandlingMiddleware`，則可改為：

```csharp
public sealed class WCMSJsonException : Exception, IWCMSException
{
}
```

以 WCMS 自己的 Exception Type 避開 Framework 的特殊攔截行為。

---

## 5. WCMSJsonException 第一階段驗證

目前弱點掃描已發現超大數值輸入造成 JSON → `Int32` 解析異常，例如：

```json
{
  "PageNumber": 99999999999999999999,
  "PageSize": 10
}
```

底層可能先產生：

```text
FormatException / OverflowException / JsonException
```

第一階段目標實作：

```csharp
/// <summary>
/// 表示 WCMS API JSON 輸入無法依預期格式解析。
/// </summary>
public sealed class WCMSJsonException : JsonException, IWCMSException
{
    public string MessageCode { get; }
    public object[] MessageArgs { get; }
}
```

預期流程：

```text
JSON Convert Error
→ WCMSJsonException
→ ErrorHandlingMiddleware
→ 400 Bad Request
→ IErrorHelper.AddRequestError(MessageCode, MessageArgs)
→ ApiResponse.SysMessage
```

### 5.1 驗證成功條件

必須實際確認：

```text
WCMSJsonException
→ ErrorHandlingMiddleware catch
→ HTTP 400
→ ApiResponse
→ SysMessage
→ 不回傳原始 Exception.Message
```

### 5.2 若 JsonException 被 MVC 提前攔截

若實測流程變成：

```text
WCMSJsonException : JsonException
→ MVC Input Formatter / ModelState
→ InvalidModelStateResponseFactory
```

則第二方案改為：

```csharp
public sealed class WCMSJsonException : Exception, IWCMSException
{
}
```

此時由 WCMS 自己保留 JSON 格式錯誤的語意，不再依賴 `JsonException` 的 Framework 繼承關係。

> [!IMPORTANT]
> 是否採第二方案必須以實測 Pipeline 結果決定；未驗證前不得宣稱第一方案已能由 Middleware 接住。

---

## 6. ErrorHandlingMiddleware 責任

`ErrorHandlingMiddleware` 是標準 HTTP JSON API 失敗回應的最終收口點。

目標流程：

```text
Exception
    ↓
辨識 Exception Type / IWCMSException
    ↓
決定 HTTP Status
    ↓
取得 MessageCode / MessageArgs
    ↓
IErrorHelper
    ↓
ApiResponse.SysMessage
    ↓
回傳 JSON Response
```

Middleware 責任包含：

- Exception 分類。
- HTTP Status Mapping。
- `IWCMSException` 的 `MessageCode / MessageArgs` 轉成 `SysMessage`。
- 未知 Exception 加入安全的系統錯誤訊息。
- 依 Logging Policy 記錄 NLog。
- 保留 TraceId 與 Request 診斷資訊。

Middleware 不負責：

- 業務資料加工。
- JSON Property 的欄位規則。
- DB Transaction Rollback。
- Startup / Setup 初始化失敗。
- 直接把 `Exception.Message` 當作前端訊息。

---

## 7. HTTP Status Mapping 原則

第一階段目標分類：

| 錯誤語意 | 建議 HTTP Status |
|---|---:|
| Request / JSON / Model Binding / 格式錯誤 | `400` |
| Authentication 失敗 | `401` |
| Authorization / Permission 失敗 | `403` |
| 指定資源不存在 | `404` |
| 唯一鍵、FK 使用中、版本或併發衝突 | `409` |
| Rate Limit | `429` |
| 未知系統 Exception | `500` |

`502 Bad Gateway` / `504 Gateway Timeout` 只應用於 WCMS 確實扮演 Upstream Proxy / Gateway 的情境，不作為一般 WCMS 程式異常的替代 Status。

> [!NOTE]
> DB Timeout、DB Connection Failure、外部服務中斷等 Infrastructure Status 是否使用 `500`、`503`、`504`，待實際共用 Case 盤點後再正式定義，不在本版先寫死。

---

## 8. SysMessage 與 NLog 分離

同一個錯誤應同時保有兩種資訊，但用途完全不同。

### 8.1 對前端

```text
IWCMSException.MessageCode
IWCMSException.MessageArgs
→ ErrorHelper
→ 多語系 Resx
→ ApiResponse.SysMessage
```

禁止直接輸出：

```text
Exception.Message
InnerException.Message
StackTrace
SQL Statement
Database / Server 詳細資訊
檔案路徑
Runtime 內部資訊
```

### 8.2 對 NLog / 維運

```text
Exception Type
Exception.Message
InnerException
StackTrace
TraceId
User / IP / Lang
HTTP Method / Path
必要的 Runtime 診斷資訊
```

Logging Policy 與前端 MessageCode 必須分離：

> 「是否記錄 NLog、使用哪個 Log Level」由 ErrorHandling / Auditing Policy 決定；不得因為某個錯誤有 `MessageCode` 就直接等同 Error Log 或不記錄 Log。

---

## 9. DB / EF Core Exception 收斂方向

DB Exception 不應全部視為同一類錯誤。

目標分類至少區分：

```text
使用者 / 資料衝突造成的已知 DB Error
→ 轉成具體 WCMSXXXException + IWCMSException
→ 400 / 409 等明確 Status

Infrastructure / Schema / 未知 SQL Error
→ 保留原始 Exception
→ ErrorHandling 視為未知或 Infrastructure Error
→ 安全訊息 + NLog
```

例如：

- 外鍵值格式錯誤。
- 資料仍被 FK 使用。
- Unique / Duplicate Key。
- EF Concurrency Conflict。
- DB Timeout。
- DB Connection Failure。
- SQL / Schema 未知異常。

> [!WARNING]
> 不得將所有 `SqlException`、`DbUpdateException` 或 `DbUpdateConcurrencyException` 一律轉為 `400`。
>
> 只有已能明確判定 WCMS 對外語意的 Case 才建立具體 Exception Mapping；其餘視為未知或 Infrastructure Error。

---

## 10. Transaction / OperateLog 的 catch 原則

不是所有 `try / catch` 都應移除。

### 10.1 可保留

例如 Transaction：

```text
catch
→ Rollback
→ throw
→ ErrorHandlingMiddleware
```

以及 OperateLog：

```text
catch
→ 標記 Fail / Cancel
→ throw
→ ErrorHandlingMiddleware
```

這些 catch 的責任是 Cleanup / Rollback / Auditing，不是自行建立 Error Response，因此可以保留。

### 10.2 應收斂

下列模式應逐步移除：

```csharp
catch (Exception ex)
{
    return BadRequest(ex.Message);
}
```

以及 Controller / Feature 內散落：

```text
BadRequest(...)
Unauthorized(...)
Forbid(...)
NotFound(...)
Conflict(...)
StatusCode(...)
JsonResult + StatusCode
```

標準 JSON API 失敗結果應逐步改由 WCMS Exception + ErrorHandling 統一處理。

---

## 11. Startup / Setup 明確排除

下列流程不進 `ErrorHandlingMiddleware`：

```text
XXXSetup.AddServices
Host Build
ApplicationStartupInitializer
IApplicationStartupTask
Program Startup
```

原因：這些流程發生時沒有可回覆的 HTTP Request。

標準流程：

```text
Startup / Setup Exception
→ Program / Host 捕捉
→ Fatal Log
→ Fail Fast / 啟動失敗
```

不得為 Startup Exception 建立假的 `ApiResponse`。

---

## 12. ASP.NET Core 特殊管線收斂

即使目標是 ErrorHandling 統一收口，下列 ASP.NET Core 流程可能在 Middleware catch 之前或之外自行完成 Response：

- JSON Input Formatter。
- ModelState / `InvalidModelStateResponseFactory`。
- Authentication Challenge。
- Authorization Forbid。
- Route / 404 / 405。
- Request Size / Server Limit。
- Rate Limiter。

因此後續收斂原則是：

> 先確認 Framework 實際執行點，再決定以 WCMS Exception、Framework Handler / Adapter 或共用 Error Response Writer 接入 ErrorHandling 體系；不得為了形式統一而大量使用 Exception 作為正常控制流程。

第一優先仍以標準 JSON API 的 Failure Contract 一致為目標。

---

## 13. 與既有 ApiResponse 規則的過渡關係

目前既有程式與 `03_後端開發規範.md` 第 6 章仍包含：

```text
HTTP 200 + IsSuccess=false
→ Biz 預期內錯誤
```

本次決策後的**目標架構**改為優先收斂：

```text
成功
→ OkResponse<T>

失敗
→ 已知 WCMS Exception / 未知 Exception
→ ErrorHandlingMiddleware
→ Error ApiResponse
```

在全後端盤點與實作完成前：

1. 不一次性將所有舊 Biz `Message.HasError` 直接改成 throw。
2. 先從弱掃、安全、直接回傳錯誤、JSON / Model Binding 等明確 Case 開始。
3. 每一類錯誤確認 HTTP Status、MessageCode 與 Logging Policy 後再收斂。
4. 完成主線收斂後，再同步更新 `03_後端開發規範.md` 第 6 章，避免文件把規劃寫成已全面落地。

---

## 14. 後續全後端盤點範圍

正式收斂時至少搜尋：

```text
try
catch
throw
throw new
BadRequest
Unauthorized
Forbid
NotFound
Conflict
StatusCode
JsonResult
InvalidModelStateResponseFactory
Message.HasError
AddRequestError
AddExceptionError
SqlException
DbUpdateException
DbUpdateConcurrencyException
JsonException
FormatException
OperationCanceledException
```

每一個 Case 分成：

```text
A. Cleanup / Rollback / Auditing catch：保留並 rethrow
B. 已知錯誤：轉成 sealed WCMSXXXException + IWCMSException
C. Framework 特殊管線：建立 Handler / Adapter / 對接策略
D. 未知 Exception：不強制包裝，交由 ErrorHandling 500 + NLog
E. Startup / Setup：排除 HTTP ErrorHandling
```

---

## 15. 第一階段實作順序

依目前弱掃與時程優先序：

```text
1. 建立 IWCMSException
2. 建立 sealed WCMSJsonException
3. LibJsonNullDefaultConverter 將已知 JSON Convert Error 轉成 WCMSJsonException
4. ErrorHandlingMiddleware Mapping WCMSJsonException → 400 + SysMessage
5. 實測 WCMSJsonException : JsonException 是否能進 Middleware
6. 若被 MVC 攔截，改為 WCMSJsonException : Exception, IWCMSException
7. 重測 PageNumber / PageSize 超大數值 Case
8. 再開始全後端 Error Flow 盤點與逐類收斂
```

驗證時不得只確認「有 Exception」，必須確認：

```text
HTTP Status 正確
ApiResponse 格式一致
SysMessage 使用 MessageCode / Args
原始 Exception 未洩漏到 Response
NLog / TraceId 能保留需要的診斷資訊
```

> [!IMPORTANT]
> Build、QA、弱點掃描或實機驗證只有實際執行並取得結果後才能記錄為通過。
