# WCMS ErrorHandling 與 IWCMSException 目標架構

> 文件版本：Version 0.2  
> 對標分支：`Feature/Dev`  
> 決策日期：2026-08-10  
> 狀態：**目標架構已確認，程式收斂進行中**

> [!IMPORTANT]
> 本文件定義 WCMS 後端 Error Handling 與 `IWCMSException` 的目標邊界。
> `IWCMSException` 只處理「異常流程」，不取代既有 Biz 正常檢查；Biz 預期內失敗維持 `HTTP 200 + IsSuccess=false + SysMessage`。

---

## 1. 四條主要結果流程

WCMS 標準 JSON API 收斂後，結果分成四類：

```text
A. 成功
→ Controller / API
→ OkResponse<T>
→ ApiResponse<T>
→ 2xx + IsSuccess=true

B. Biz 預期內失敗
→ Biz 正常執行檢查
→ Message / SysMessage
→ ApiResponse<T>
→ HTTP 200 + IsSuccess=false

C. 已知系統性異常
→ WCMSXXXException + IWCMSException
→ ErrorHandlingMiddleware
→ 對應 4xx / 5xx
→ Error ApiResponse + SysMessage

D. 未知系統性異常
→ 原始 Exception
→ ErrorHandlingMiddleware
→ 500
→ 安全 SysMessage + NLog
```

這四條流程不得混為同一種控制方式。

---

## 2. Biz Failure 與 Exception 的邊界

### 2.1 Biz 預期內失敗不是 Exception

下列屬於 Biz 正常檢查結果：

- 必填資料或商業規則不符合。
- 密碼規則不符合。
- 舊密碼錯誤。
- 資料狀態不允許目前操作。
- 儲存前檢查未通過。
- 其他已進入 Biz、且 Biz 能正常判斷的業務結果。

標準流程：

```text
Request 已正常解析
→ Controller / Biz 正常執行
→ Biz 判斷不允許繼續
→ Message.Add...
→ HTTP 200
→ IsSuccess=false
→ SysMessage 說明原因
```

> [!IMPORTANT]
> 不得為了 ErrorHandling 形式統一，將一般 Biz Validation 大量改成 `throw`。
>
> `Message.HasError`、Biz Validation 與 `HTTP 200 + IsSuccess=false` 仍是正常且正式的業務結果機制。

### 2.2 系統性異常才進 IWCMSException / ErrorHandling

下列較屬於異常流程：

- JSON / Request 無法解析。
- Model Binding 的系統型輸入異常。
- Authentication / Authorization 管線異常或失敗。
- DB Constraint、Concurrency、Connection 等已知系統異常。
- File / Cache / External Service 等 Infrastructure 異常。
- Runtime 中可明確分類、但不屬於 Biz 正常結果的異常。

這類錯誤若 WCMS 已能辨識對外語意，原則上使用具體 `WCMSXXXException + IWCMSException`。

---

## 3. IWCMSException 的定位

`IWCMSException` 的目的不是取代 `System.Exception`，而是標記：

> 「這是一個 WCMS 已能辨識其系統異常語意、並能安全對應 MessageCode 的 Exception。」

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

### 3.1 IWCMSException 不承擔 Biz Validation

`IWCMSException` 不作為：

```text
Biz Validation Result
Message.HasError 的替代品
一般表單驗證結果
HTTP 200 + IsSuccess=false 的替代品
```

Biz 正常檢查與 Exception Flow 必須保持分離。

### 3.2 不放入 HTTP Status

`IWCMSException` 不直接保存：

```text
StatusCode
HttpStatus
Response
IActionResult
```

HTTP Status 屬於 `ErrorHandlingMiddleware` 的 Response Mapping 責任。

### 3.3 不放入前端最終文字

`IWCMSException` 不保存 `UserMessage`。

前端顯示訊息統一走：

```text
MessageCode + MessageArgs
→ IErrorHelper
→ Resx / I18n
→ SysMessage
```

### 3.4 技術錯誤資訊保留在 Exception Chain

原始 Framework / DB / Runtime Exception 應盡可能保存為 `InnerException`：

```text
WCMSXXXException
└─ InnerException
   └─ Framework / DB / Runtime Exception
```

前端使用安全的 `MessageCode / MessageArgs`；NLog 保留完整 Exception Chain。

---

## 4. WCMSXXXException 命名與 sealed 原則

具體 WCMS 系統異常使用明確語意命名，例如：

```text
WCMSJsonException
WCMSPermissionException
WCMSDataConflictException
WCMSInfrastructureException
```

> [!NOTE]
> 除已實際需要的 Exception 外，不預先建立大量類別；名稱必須對應真實系統異常語意，而不是一般 Biz Rule。

### 4.1 預設一律 sealed

具體的 `WCMSXXXException` 預設：

```csharp
public sealed class WCMSJsonException : JsonException, IWCMSException
{
}
```

原因：

- Exception Type 應代表明確錯誤語意。
- 避免無限制的 Exception 繼承階層。
- ErrorHandling 可依具體 Type 建立穩定 Mapping。
- 只有未來確定需要作為 Exception 基底類別時，才另案討論是否取消 `sealed`。

---

## 5. Framework Exception 與 WCMS Exception 的關係

WCMS 不要求所有 Framework Exception 都重新包裝。

判斷順序：

```text
發生 Framework / DB / Runtime Exception
        ↓
這是不是 Biz 正常檢查結果？
        ├─ 是 → 不使用 Exception，維持 Biz Message Flow
        └─ 否
            ↓
WCMS 是否已能明確辨識系統異常語意？
        ├─ 否 → 保留原始 Exception，交由 ErrorHandling 視為未知異常
        └─ 是 → 以 WCMSXXXException + IWCMSException 表達
                  並保留原始 InnerException
```

### 5.1 模糊 Framework Exception 不可直接全域 Mapping

例如：

```text
FormatException
ArgumentException
InvalidOperationException
KeyNotFoundException
```

這些 Exception 可能來自 Request，也可能代表程式 Bug，因此不得直接建立：

```text
FormatException → 400
ArgumentException → 400
KeyNotFoundException → 404
```

若最接近錯誤來源的邊界能確認它是系統性 Request / Infrastructure Error，才轉成具體 `WCMSXXXException`。

### 5.2 Framework 特殊處理風險

ASP.NET Core / MVC 可能對特定 Exception 有既定行為，例如：

- JSON Input Formatter。
- ModelState。
- Authentication Challenge。
- Authorization Forbid。

因此 WCMS Exception 是否繼承 Framework Exception，必須以實際 Pipeline 行為驗證。

如果繼承 Framework Exception 後被框架提前攔截，導致未進 `ErrorHandlingMiddleware`，可改成直接繼承 `Exception`。

---

## 6. WCMSJsonException 第一階段驗證

目前弱點掃描的超大數值 Case：

```json
{
  "PageNumber": 99999999999999999999,
  "PageSize": 10
}
```

此 Case 在 JSON → `Int32` 階段即失敗，尚未正常進入 Biz，因此屬於系統性的 Request Parsing Error，而不是 Biz Validation。

第一階段驗證：

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
FormatException / OverflowException / JsonException
→ WCMSJsonException
→ ErrorHandlingMiddleware
→ 400 Bad Request
→ MessageCode / MessageArgs
→ IErrorHelper
→ ApiResponse.SysMessage
```

### 6.1 驗證成功條件

必須實際確認：

```text
WCMSJsonException
→ ErrorHandlingMiddleware catch
→ HTTP 400
→ ApiResponse
→ SysMessage
→ 不回傳原始 Exception.Message
```

### 6.2 若 JsonException 被 MVC 提前攔截

若實測變成：

```text
WCMSJsonException : JsonException
→ MVC Input Formatter / ModelState
→ InvalidModelStateResponseFactory
```

第二方案改為：

```csharp
public sealed class WCMSJsonException : Exception, IWCMSException
{
}
```

> [!IMPORTANT]
> 是否採第二方案以實測結果決定；未驗證前不得宣稱第一方案已能由 Middleware 接住。

---

## 7. ErrorHandlingMiddleware 責任

`ErrorHandlingMiddleware` 是標準 HTTP JSON API「異常流程」的主要收口點，不處理 Biz 正常失敗。

目標流程：

```text
Exception
    ↓
辨識 WCMSXXXException / IWCMSException / Unknown Exception
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

- 系統 Exception 分類。
- HTTP Status Mapping。
- `IWCMSException` 的 `MessageCode / MessageArgs` 轉成 `SysMessage`。
- 未知 Exception 加入安全的系統錯誤訊息。
- 依 Logging Policy 記錄 NLog。
- 保留 TraceId 與 Request 診斷資訊。

Middleware 不負責：

- Biz Validation。
- `Message.HasError` 的正常業務結果。
- 業務資料加工。
- DB Transaction Rollback。
- Startup / Setup 初始化失敗。
- 直接把 `Exception.Message` 當作前端訊息。

---

## 8. HTTP Status 與 IsSuccess 的邊界

### 8.1 Biz 正常失敗

```text
HTTP 200
IsSuccess=false
SysMessage=業務提示
```

這是正常 Biz Result，不代表 HTTP Request 或系統執行失敗。

### 8.2 系統性異常

第一階段目標分類：

| 系統異常語意 | 建議 HTTP Status |
|---|---:|
| Request / JSON / Model Binding / 格式錯誤 | `400` |
| Authentication 失敗 | `401` |
| Authorization / Permission 失敗 | `403` |
| 指定 Resource / Route 不存在 | `404` |
| DB Constraint、版本或併發衝突 | `409` |
| Rate Limit | `429` |
| 未知系統 Exception | `500` |

`502 Bad Gateway` / `504 Gateway Timeout` 只應用於 WCMS 確實扮演 Upstream Proxy / Gateway 的情境。

---

## 9. SysMessage 與 NLog 分離

同一個系統異常保有兩種資訊，但用途不同。

### 9.1 對前端

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

### 9.2 對 NLog / 維運

```text
Exception Type
Exception.Message
InnerException
StackTrace
TraceId
User / IP / Lang
HTTP Method / Path
必要 Runtime 診斷資訊
```

Logging Policy 與前端 `MessageCode` 必須分離。

Biz 預期內失敗則不因 `IsSuccess=false` 自動視為 Error Log；是否記錄操作或業務事件由各 Auditing Policy 決定。

---

## 10. DB / EF Core Exception 收斂方向

DB Case 必須先分辨是 Biz Rule 還是系統性異常。

```text
Biz 已能在正常流程提前判斷
→ Biz Message Flow
→ HTTP 200 + IsSuccess=false

DB / EF 執行時產生的已知系統異常
→ 具體 WCMSXXXException + IWCMSException
→ ErrorHandling
→ 對應 4xx / 5xx

Infrastructure / Schema / 未知 SQL Error
→ 保留原始 Exception
→ ErrorHandling
→ 500 或後續定義的 Infrastructure Status
→ 安全 SysMessage + NLog
```

常見待盤點 Case：

- Foreign Key Constraint。
- Unique / Duplicate Key。
- EF Concurrency Conflict。
- DB Timeout。
- DB Connection Failure。
- Deadlock / Retry Exhausted。
- SQL / Schema 未知異常。

> [!WARNING]
> 不得將所有 `SqlException`、`DbUpdateException` 或 `DbUpdateConcurrencyException` 一律轉為同一 HTTP Status。

---

## 11. Transaction / OperateLog 的 catch 原則

不是所有 `try / catch` 都應移除。

### 11.1 可保留

Transaction：

```text
catch
→ Rollback
→ throw
→ ErrorHandlingMiddleware
```

OperateLog：

```text
catch
→ 標記 Fail / Cancel
→ throw
→ ErrorHandlingMiddleware
```

這些 catch 是 Cleanup / Rollback / Auditing，不是自行建立 Error Response。

### 11.2 應收斂

下列模式應逐步移除：

```csharp
catch (Exception ex)
{
    return BadRequest(ex.Message);
}
```

以及系統性異常時散落的：

```text
BadRequest(...)
Unauthorized(...)
Forbid(...)
NotFound(...)
Conflict(...)
StatusCode(...)
JsonResult + StatusCode
```

> [!NOTE]
> 這裡只針對「系統性異常」與非 Biz HTTP Failure；正常 Biz `Message + HTTP 200 + IsSuccess=false` 不在移除範圍。

---

## 12. Startup / Setup 明確排除

下列流程不進 `ErrorHandlingMiddleware`：

```text
XXXSetup.AddServices
Host Build
ApplicationStartupInitializer
IApplicationStartupTask
Program Startup
```

標準流程：

```text
Startup / Setup Exception
→ Program / Host 捕捉
→ Fatal Log
→ Fail Fast / 啟動失敗
```

Startup 階段沒有可回覆的 HTTP Request，因此不得建立假的 `ApiResponse`。

---

## 13. ASP.NET Core 特殊管線收斂

部分 Framework 流程可能在 Middleware catch 之前或之外自行完成 Response：

- JSON Input Formatter。
- ModelState / `InvalidModelStateResponseFactory`。
- Authentication Challenge。
- Authorization Forbid。
- Route / 404 / 405。
- Request Size / Server Limit。
- Rate Limiter。

後續原則：

> 先確認 Framework 實際執行點，再決定以 WCMS Exception、Framework Handler / Adapter 或共用 Error Response Writer 接入 ErrorHandling 體系；不得把正常 Framework / Biz 流程全部 Exception 化。

---

## 14. 與既有後端開發規範的關係

`03_後端開發規範.md` 第 6 章原本定義：

```text
Biz 預期內檢查失敗
→ HTTP 200 + IsSuccess=false
```

此規則維持有效，不需要因 `IWCMSException` 導入而推翻。

本文件新增的是「系統性異常」的處理契約：

```text
Biz Failure
→ Message / SysMessage
→ 200 + IsSuccess=false

System Exception
→ WCMSXXXException + IWCMSException
→ ErrorHandling
→ 非 2xx 或對應 5xx
```

兩者最後都可產生 `SysMessage`，但控制流程與語意必須分離。

---

## 15. 後續全後端盤點分類

正式盤點 `try / catch / throw / BadRequest / Unauthorized / SqlException / JsonException` 等 Case 時，每一個點分成：

```text
A. Biz 正常檢查
   → 維持 Message Flow / HTTP 200 + IsSuccess=false

B. Cleanup / Rollback / Auditing catch
   → 保留並 rethrow

C. 已知系統性異常
   → sealed WCMSXXXException + IWCMSException

D. Framework 特殊管線
   → Handler / Adapter / Error Response 對接策略

E. 未知系統 Exception
   → 不強制包裝
   → ErrorHandling 500 + NLog

F. Startup / Setup
   → 排除 HTTP ErrorHandling
```

---

## 16. 第一階段實作順序

依目前弱掃與時程優先序：

```text
1. 建立 IWCMSException
2. 建立 sealed WCMSJsonException
3. LibJsonNullDefaultConverter 將 JSON Convert 系統異常轉成 WCMSJsonException
4. ErrorHandlingMiddleware Mapping WCMSJsonException → 400 + SysMessage
5. 實測 WCMSJsonException : JsonException 是否能進 Middleware
6. 若被 MVC 攔截，改為 WCMSJsonException : Exception, IWCMSException
7. 重測 PageNumber / PageSize 超大數值 Case
8. 再盤點其他系統性 Exception
9. Biz Validation Flow 原則上維持既有機制，不納入 Exception 化
```

驗證時必須確認：

```text
HTTP Status 正確
ApiResponse 格式一致
SysMessage 使用 MessageCode / Args
原始 Exception 未洩漏到 Response
NLog / TraceId 能保留需要的診斷資訊
Biz Failure 仍維持正常 200 + IsSuccess=false
```

> [!IMPORTANT]
> Build、QA、弱點掃描或實機驗證只有實際執行並取得結果後才能記錄為通過。
