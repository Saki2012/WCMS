# WCMS 目前環境部署流程

> 文件版本：Version 1.0  
> 適用範圍：WCMS Frontend／Backend／IIS 測試站與正式站  
> 對標分支：`Feature/Dev`  
> 最後整理：2026-08-04  
> 現況：Windows Server + IIS + Node SSR + ASP.NET Core OutOfProcess

---

## 1. 部署拓樸

```text
瀏覽器
  ↓ HTTPS
前端 IIS Site
  ↓ ARR + URL Rewrite
Node SSR
http://127.0.0.1:{SSR_PORT}
  ↓ /Service Proxy
後端 IIS Site
http://127.0.0.1:{BACKEND_PORT}
  ↓
WCMS Backend
  ↓
SQL Server
```

前端 IIS 負責公開網域、HTTPS、ARR 反向代理與維護頁；Node SSR 負責 React SSR、前端靜態資源及 `/Service` API Proxy；後端 IIS 提供固定的本機 Backend Origin。

> [!IMPORTANT]
> IIS Server 層需啟用 ARR Proxy。實際 Proxy 至 SSR Port 的 Rewrite Rule 已寫在前端 `web.config`，不需要再手動建立一份重複規則。

---

## 2. 前端部署

### 2.1 Build 前設定

進入：

```text
WCMS_Frontend/
```

有客製案時，在 `.env.production` 或建置機專用的 `.env.production.local` 設定：

```env
VITE_SPEC_CODE=XXXX
E.x.: VITE_SPEC_CODE=1820
```

純 Feature 模式不設定 `VITE_SPEC_CODE`。

同時確認：

```env
VITE_API_BASE_URL=/Service
VITE_SITE_ORIGIN=https://正式網域/
VITE_AA_SITE=true
```

> [!WARNING]
> `VITE_*` 是 Build 時參數。ZIP 產生後才修改正式機 `.env.production`，不會重新編譯既有 CSR 產物。

### 2.2 建立部署包

```powershell
npm ci
npm run typecheck
npm run build
```

目前 `npm run build` 會執行：

```text
clean:dist
→ build:client
→ build:server
→ bundle:deploy
```

完成後使用 `dist/` 內產生的 ZIP。內容包含：

```text
CSR/
SSR/
SSR-Server.mjs
package.json
package-lock.json
start.bat
stop.bat
WinSW-x64.exe
WinSW-x64.xml
MaintainPage/
web.config.bak
.env.production.bak
```

### 2.3 正式機部署

1. 以系統管理員身分執行舊版 `stop.bat`。
2. 備份目前前端部署目錄。
3. 解壓縮新 ZIP。
4. 將 `.env.production.bak` 複製為 `.env.production`。
5. 設定：

```env
PORT={SSR_PORT}
SSR_API_TARGET=http://127.0.0.1:{BACKEND_PORT}/
SSR_ALLOW_INSECURE_TLS=false
```

6. 將 `web.config.bak` 複製為 `web.config`。
7. 修改 SSR Rewrite Port：

```xml
<action
    type="Rewrite"
    url="http://127.0.0.1:{SSR_PORT}/{R:1}"
    appendQueryString="true" />
```

8. 以系統管理員身分執行：

```powershell
.\start.bat
```

目前 `start.bat` 會檢查管理員權限、在缺少 `node_modules` 時安裝 Production Dependencies，並安裝或更新 WinSW SSR Service。

### 2.4 前端驗證

先於正式機本機確認：

```text
http://127.0.0.1:{SSR_PORT}
```

確認首頁、SSR HTML、CSS／JS、`/Service` Proxy、Windows Service 與 `logs/` 均正常。

---

## 3. 後端部署

### 3.1 編譯用 SpecCode

客製案部署前設定：

```text
WCMS_Backend/appsettings.production.json
```

```json
{
  "AACheck": true,
  "SpecCode": "SpecXXXX"
}
```

此檔案目前主要供 `PublishBackendBySpec.ps1` 讀取 SpecCode 與條件編譯。

> [!IMPORTANT]
> Release 發布包目前不會帶入 `appsettings.production.json`。正式機執行時實際使用部署目錄內的 `appsettings.json`。
>
> 正式 DB、JWT、Whitelist、Captcha、Cache、FilePaths 與其他 Runtime 設定都必須寫入正式機的 `appsettings.json`。

### 3.2 DB 有結構異動時

#### 前置作業

1. 取得正式站最新 DB Backup。
2. 還原至建置機或隔離的 Migration 驗證 DB。
3. 確認還原 DB 就是目前正式站結構。
4. 設定 `appsettings.Development.json`：

```json
{
  "ConnectionStrings": {
    "SqlConnection": "正式 DB 還原副本的 Connection String"
  },
  "SpecCode": "SpecXXXX"
}
```

> [!WARNING]
> `EfUpgradeFromCurrentDbBySpec.ps1` 讀取的是 `appsettings.Development.json`，不是 `appsettings.production.json`。

#### 只產生 SQL

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Scripts\EfUpgradeFromCurrentDbBySpec.ps1" -GenerateSqlOnly
```

SQL 產生位置：

```text
Migrations/Sql/{UpgradeName}.sql
```

詳細參數參考：

```text
Scripts/EfUpgradeFromCurrentDbBySpec_使用說明.txt
```

第一次升級舊 DB，且尚未有 `SysDbProfile.SpecCode` 時才可使用：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Scripts\EfUpgradeFromCurrentDbBySpec.ps1" -SkipDbSpecCodeCheck -GenerateSqlOnly
```

`-SkipDbSpecCodeCheck` 不得用於後續一般升級。

#### SQL 驗證

產生後需：

1. 檢查非預期的 Drop Table／Drop Column。
2. 確認型別、Nullable、Default、Index、Foreign Key。
3. 先在正式 DB 還原副本執行。
4. 以同版本 Backend 做 CRUD 冒煙測試。
5. 正式套用前再次備份正式 DB。
6. 於維護時段套用 SQL 並留下執行紀錄。

### 3.3 建立後端部署包

客製 Spec 執行：

```powershell
powershell.exe -NoProfile -ExecutionPolicy Bypass -File ".\Scripts\PublishBackendBySpec.ps1"
```

目前流程：

```text
讀取 appsettings.production.json
→ 取得 SpecCode
→ 清空 Publish/
→ dotnet publish Release
→ 套用 本機編譯.pubxml
→ 執行 Zip-PublishedBackend.ps1
→ ZIP 放入 Publish/
```

### 3.4 正式機部署

1. 停止後端 IIS Site 或 Application Pool。
2. 備份目前 Backend 目錄。
3. 解壓縮新 ZIP。
4. 設定正式機 `appsettings.json`。
5. 確認 IIS Identity 對檔案儲存目錄具有必要權限。
6. 啟動 Backend IIS Site。
7. 於本機測試：

```text
http://127.0.0.1:{BACKEND_PORT}
```

正式機 `appsettings.json` 至少確認：

```text
ConnectionStrings.SqlConnection
Jwt
Whitelist.Frontend
Whitelist.Backend
Captcha
Cache
FilePaths
AACheck
SpecCode
```

`Whitelist.Frontend` 應填入使用者實際瀏覽的正式前端網域，不應只填 `127.0.0.1`。

---

## 4. IIS 設定

### 4.1 必要元件

```text
IIS
URL Rewrite
Application Request Routing（ARR）
ASP.NET Core Hosting Bundle
Node.js
```

### 4.2 啟用 ARR Proxy

```text
IIS Manager
→ Server
→ Application Request Routing Cache
→ Server Proxy Settings
→ Enable Proxy
```

### 4.3 允許 Forwarded Server Variables

前端 `web.config` 使用：

```text
HTTP_X_FORWARDED_HOST
HTTP_X_FORWARDED_FOR
HTTP_X_FORWARDED_PROTO
```

需至：

```text
IIS Manager
→ Server 或 Frontend Site
→ URL Rewrite
→ View Server Variables
→ Add
```

加入上述三項。否則 IIS 可能拒絕套用 Rewrite Rule。

### 4.4 Backend IIS Site

| 項目 | 設定 |
|---|---|
| Physical Path | Backend 部署目錄 |
| Binding | `http://127.0.0.1:{BACKEND_PORT}` |
| Application Pool | 獨立 App Pool |
| .NET CLR | No Managed Code |
| Pipeline | Integrated |
| 32-bit | Disabled |
| 公開網路 | 不開放 |

Backend `web.config` 使用 `AspNetCoreModuleV2`、`OutOfProcess` 與 `WCMS.exe`。

### 4.5 Frontend IIS Site

| 項目 | 設定 |
|---|---|
| Physical Path | Frontend SSR 部署目錄 |
| Binding | 正式 Domain + HTTPS |
| Certificate | 正式憑證 |
| Application Pool | No Managed Code |
| Rewrite Target | `http://127.0.0.1:{SSR_PORT}` |

前端 `web.config` 已負責：

- `MaintainPage` 資源略過 Node。
- 其他 Request 反向代理至 Node SSR。
- 設定 `X-Forwarded-*`。
- Node 502／503 時回應維護頁。
- 清除 IIS／ARR 技術標頭。
- 最外層補 HSTS。

---

## 5. 建議部署順序

```text
1. 公告維護時間
2. 備份正式 DB
3. 備份 Frontend／Backend 目錄
4. 以正式 DB 最新備份建立還原副本
5. 產生並驗證 EF Upgrade SQL
6. 停止 SSR Service
7. 停止 Backend IIS
8. 正式 DB 套用 SQL
9. 部署並啟動 Backend
10. 驗證 Backend 本機 API
11. 部署 Frontend
12. 設定 .env.production 與 web.config
13. 執行 start.bat
14. 驗證 SSR 本機 Port
15. 啟動或 Recycle Frontend IIS
16. 由正式 Domain 執行冒煙測試
17. 結束維護狀態
```

---

## 6. 部署後冒煙測試

### 基礎

- [ ] HTTPS Domain 可開啟。
- [ ] SSR HTML、CSS、JS、圖片正常。
- [ ] `/Service` API 可回應。
- [ ] 502／503 維護頁正常。
- [ ] IIS、SSR Service、Backend 沒有無限重啟。

### API 與安全

- [ ] DB Connection 正常。
- [ ] Frontend Domain 已加入 Backend Whitelist。
- [ ] XSRF Token 可取得。
- [ ] POST／PUT／PATCH／DELETE 可通過 XSRF。
- [ ] 未登入回傳 401。
- [ ] 無權限回傳 403。
- [ ] Swagger 正式環境僅允許本機。
- [ ] Security Headers 正常。
- [ ] 沒有 `Server`、`X-Powered-By` 或 ARR 技術資訊外洩。

### 功能

- [ ] Query List／Query Data。
- [ ] Create／Update／Delete／Invalid。
- [ ] Root／Detail／SubDetail。
- [ ] 檔案上傳、預覽、下載。
- [ ] 多語系。
- [ ] Cache 在異動後沒有讀到舊資料。
- [ ] AA 關鍵頁面與鍵盤操作正常。

---

## 7. Rollback

1. 停止 SSR Service。
2. 停止 Backend IIS。
3. 還原上一版 Frontend／Backend 目錄。
4. DB Schema 無法向前修正時，依部署前 Backup 還原。
5. 啟動 Backend。
6. 啟動 SSR Service。
7. Recycle Frontend IIS。
8. 重新執行冒煙測試。

> [!WARNING]
> 部署後若已有新資料寫入，直接還原舊 DB Backup 可能造成資料遺失。正式部署前必須先確認 DB Rollback 策略。

---

## 8. 目前已知限制與注意事項

### 8.1 `PublishBackendBySpec.ps1`

目前會拒絕空白 SpecCode，因此現階段只適用有客製 Spec 的 Backend 發布。

```text
Spec 部署
→ 使用 PublishBackendBySpec.ps1

純 Feature 部署
→ 暫時使用一般 Publish 流程
→ 或後續調整 Script 支援空白 SpecCode
```

### 8.2 Production 設定用途

```text
appsettings.production.json
→ Publish 時讀取 SpecCode
→ 不進 Release 部署包

appsettings.json
→ 正式機 Runtime 實際使用
```

### 8.3 EF Script

Script 會備份並清空 `Migrations/`，備份位置：

```text
obj/MigrationBackups/Migrations_yyyyMMddHHmmss
```

執行前不得保留尚未提交或未備份的重要 Migration 檔案。

### 8.4 Backend stdout Log

目前 Backend `web.config` 使用：

```xml
stdoutLogEnabled="true"
```

測試站可用於啟動除錯；正式站需設定 Log 保留與清除方式，避免 `logs/stdout*` 長期累積。

### 8.5 機密資訊

以下內容不得沿用開發預設值，也不得提交 Git：

```text
SQL Connection String
JWT Key
Captcha Secret
管理者密碼
Redis Connection
第三方 API Secret
```

---

## 9. 對標檔案

```text
WCMS_Frontend/
├─ .env.production
├─ package.json
├─ bundle-deploy.mjs
├─ web.config
└─ src/SSR/SSR-Server.ts

WCMS_Backend/
├─ appsettings.json
├─ appsettings.production.json
├─ web.config
├─ WCMS.csproj
├─ Properties/PublishProfiles/本機編譯.pubxml
└─ Scripts/
   ├─ EfUpgradeFromCurrentDbBySpec.ps1
   ├─ EfUpgradeFromCurrentDbBySpec_使用說明.txt
   ├─ PublishBackendBySpec.ps1
   └─ Zip-PublishedBackend.ps1
```
