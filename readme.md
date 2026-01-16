網站整合管理後台代號：Web Content Management System(WCMS)

一、開發規劃
程式上版使用：GIT
資料庫會因應功能新增欄位、舊資料庫轉置資料庫

二、時程規劃
前期：台藝大研發處換版(6大常用模組+2客製模組)
中期：第一套公版標準規格開發(金流、訂單、課程、購物..等)
後期：專案客製化功能(由專案RD各自開發)
反饋：常用功能回饋標準版、優化功能開發


三、開發工具與環境:
**後端:**
- .net core 8.0
    - Entity Framwork DTO (透過該方式實現在不同DB上運作)
- Redis

**前端:**
- Vite + React
- Typescript

**UI_UX:**
- Bootstrap
- Javascript
- css

**中介:**
- GraphQL (暫無)(中期)

**環境建置:**
- Docker(後期視需求規劃)

四、系統架構
        ┌──────────────────┐    
        │     Frontend     │ ←  渲染畫面，透過API打入，暫不做任何資料面上的檢查/處理，一率先由後端處理，
        └────────┬─────────┘    在接收data時將有兩種情形:正常、異常，再根據狀況顯示結果或是彈出錯誤訊息
                 ▼
        ┌──────────────────┐
        │ REST Controller  │  ← REST API 入口
        └──────────────────┘
        ┌──────────────────┐
        │ GraphQL Resolver │  ← GraphQL Query / Mutation
        └──────────────────┘
                  ▼
     ┌───────────────────────────┐
     │        Service 層         │  ← 資料驗證、商業邏輯
     └───────────────────────────┘
                  ▼
     ┌───────────────────────────┐
     │       Repository 層       │  ← 只做資料存取
     └───────────────────────────┘
                  ▼
     ┌───────────────────────────┐
     │   資料庫 / Dapper / EF    │
     └───────────────────────────┘
     
     User temp採JWT與Redis處理

後端程式架構
- SysCore
    - Library
    - Enum
    - Model
    - Resx (系統多語系包)
    - BasicRepository (核心資料存取邏輯)
    - IBizService (API導至服務邏輯處理)
- Features
    - BizResx (WCMS功能多語系包)(前期)
    - Finance (金流)(中期)
    - SiteEdit  (客戶自定義網頁設計)
        - Announcement (公告)
        - Banner (廣告輪播)
        - Category (類別)
        - FileArchive (檔案管理)
        - Gallery (相簿管理)
        - PageManagement (頁面管理)
        - PCS_Sites (子母網站設定)
        - Tag (標籤)
        - WebResource (網路資源)
    - SysSetting (網站系統資訊及設定)
        - SiteInfo (網站資訊)
            - EnvConfig (環境參數配置修改)
            - SEO
            - SiteArch (網站架構)
            - SystemInfo (網站系統資訊)
- SpecFeatures (專案客製化功能)
    - 請照對應模塊分類功能
    - 如需在原本功能二次開發，請繼承後討論是否開出Virtual Function處理
    - 新增的任何單元，皆以Spec作為開頭

DB表格欄位版本衝突解決方式:

1. 產生BaseLine版本
dotnet ef migrations add Baseline --context ApplicationDbContext

2. 剛生成的快照Baseline.cs要把Up/Down的內容清空
dotnet ef database update

3. 透過完整連線字串去讀舊DB的當前版本：
$settings = Get-Content .\appsettings.Development.json -Raw | ConvertFrom-Json
$conn = $settings.ConnectionStrings.SqlConnection
dotnet ef dbcontext scaffold "$conn" Microsoft.EntityFrameworkCore.SqlServer --context TempBaselineDbContext --startup-project .\WCMS.csproj --project .\WCMS.csproj --output-dir Migrations/_BaselineScaffold --use-database-names --no-pluralize --schema dbo
dotnet ef migrations add TempSnap_1_1 --context WCMS.Migrations._BaselineScaffold.TempBaselineDbContext --startup-project .\WCMS.csproj --project .\WCMS.csproj --output-dir Migrations/_BaselineScaffold/__TempMigrations

4. 把 v1.1 模型「植入」正式 Snapshot：
A. 開 Migrations/_BaselineScaffold/__TempMigrations/..._TempSnap_1_1.Designer.cs，複製 BuildTargetModel 大括號內全部內容。
B. 開 Migrations/ApplicationDbContextModelSnapshot.cs，把 BuildModel(...) 方法內原有內容 整段換成 第 1 步複製的內容。
C. 建置一次（缺 using 就補：Microsoft.EntityFrameworkCore.*、Metadata 等）。

5. 產生「當前DB → 最新」真正差異遷移並套用：
dotnet ef migrations add Upgrade_1_1_to_Latest --context ApplicationDbContext
dotnet ef database update --context ApplicationDbContext


後端開發規範
1. 所有顯示說明的文字，皆透過.resx做動態多語系處理
2. 禁止在邏輯區寫固定的定義值，若需要仍要用宣告方式處理
3. 務必區分出公開的API時機(Public)、業務流程(Protect)、以及實作過程(Private)
4. 有寫到Try-catch時，除非真的異常結果需要無視後繼續往下走之外，一律throw給ErrorHandlingMiddleware處理
5. 有關時區存儲一律寫UTC作為依據，以作為之後跨區需求
6. Spec的Model/API層用Partial來追加Feature客製需求/Biz用繼承

前端程式架構
- src
    - SysCore (WCMS核心)
        - Components (動態渲染元控件)
            - Banner (橫幅)
            - BannerSlider (橫幅跑馬燈)
            - BreadCrumb (網頁導覽)
            - Calendar (行事曆)
            - Grid (資料表格)
            - Header (網站Header，用來設計meta、script等)
            - Marquee (跑馬燈)
            - MediaList (圖文顯示列表)
            - MenuList (菜單列表)
            - NaviBar (導覽列(Menu上用))
            - QuickNaviSlider (快速導覽)
            - SearchBar (搜尋功能)
            - SiteInfo (網站資訊)
            - TabsList (清單分類列表)
        - Theme (主題風格) - 中長期後開始處理
            - 用來組裝每一個環節所用的css風格
        - Utils (自家Library、非第三方包)

    - Features (WCMS系統公版)
        - Assets (資源檔，如.css/.js/圖片等)
            - Client (前台)
            - Server (後台)
        - Hooks (功能)
        - Pages (功能畫面模板)
            - Client (前台)
            - Server (後台)
                - BizFunc (功能)
                    - Teacher (教師外掛 暫定)
                    - Finance (金融相關功能 暫定)
                    - WebManagement (網站功能)
                        - Announcement(公告)
                        - FileArchive (檔案室)
                        - ...
                - Scaffold (畫面框架，如Menu、Header、Footer等)
                    - MainPage (首頁)
                    - SubPages (子頁)
                    - Header
                    - Footer
                    - GoogleAnalysis (Google SEO相關)
                    - Menu
                    - ...
                - Theme (css標籤主題)
    - **SpecFeatures**
        - 專案別名(e.x. 1810 台藝大研發處)
            - Assets (For當前專案才使用的客製資源檔)
            - Hooks
            - Pages
                - Client (前台)
                    - USR計劃
                    - 研究計劃
                - Server (後台)
                    - USR計劃
                    - 研究計劃



    
- public
    - Legacy (底下擺放舊專案原本/file/fonts/image)
        
前端開發規範
1. 在對應元件底下建立功能依序為
    - XXX_Comp.tsx (渲染元件)
        - 主格式為 const
    - XXX_Data.ts (資料來源)
        - 主格式為 interface
    - XXX_Hook.ts (自定義操作行為)
        - 主格式為 const
        - function以 use作為開頭
    - XXX_Clsx.ts (Css風格)
    ...
2. 前端打資料分兩種:API / Mock Data
    - 在xxx_Data 需寫 getData、getMock，並判斷config是否啟用mock來決定平時來源資料為何
3. CSS風格使用clsx來處理?(待研究)
    - 控件風格和主題風格在Features那邊製作，
4. 客製化的Router注入與移除
    - 透過Interface的觀念繼承引用及在app.tsx注入
5. 前端的資料模型透過以下語法在Powershell來獲取後端模型(後端Service需啟動)
    1. Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
    2. $env:NODE_TLS_REJECT_UNAUTHORIZED = "0";
    3. npx openapi-typescript https://localhost:7030/swagger/v1/swagger.json -o src/types/api.d.ts;
    4. 成功後再至types資料夾中執行 npx tsx ./src/types/generate-fields.ts 產生SchemaNameFields
`
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
$env:NODE_TLS_REJECT_UNAUTHORIZED = "0";
npx openapi-typescript https://localhost:7030/swagger/v1/swagger.json -o src/types/api.d.ts;
npx tsx ./src/types/generate-fields.ts
`
6. 若是在前端的系統連結，透過Link to來達到SPA效果，避免不斷刷新造成效能及使用體驗低落
7. 控鍵與資料流程: Component(.tsx) -> Hook(.ts) -> Api(.ts)
    - Component 不寫任何有關useEffect等相關時機
    - 一律由Hook撰寫useEffect等相關時機
    - 當需要額外處理一些DOM渲染，接收到Hook結果後，再從Components撰寫DOM渲染邏輯

部屬流程:
前端:
    1. 執行 Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass;
    2. 執行 npm run build:csr   (#如果是ssr，改為build:ssr)
    3. 會產生dist-csr資料夾，將底下的所有資料打包覆蓋至Server上的部屬環境資料夾
    注意:不要覆蓋掉webconfig
後端:
    1. 執行 if (Test-Path .\Publish) { Remove-Item .\Publish -Recurse -Force }; dotnet publish WCMS.csproj -c Release -r win-x64 -o Publish
    2. 會產生publish資料夾，將底下的所有資料打包覆蓋至Server上的部屬環境資料夾
    注意:不要覆蓋掉webconfig和appsettingjson


IIS與環境設定:
    - 前端站台:
    1. web.config中的url是要導向後端的系統，故路徑要調成對應的port(如http://127.0.0.1:xxxx)
    2. IIS的Url Rewrite須新增兩個伺服器變數
        A. 選取IIS前端站台
        B. 點擊右邊的檢視伺服器變數
        C. 新增 HTTP_X_FORWARDED_PROTO 和 HTTP_X_FORWARDED_HOST 變數
    - 後端站台
    1. 繫結設定http://127.0.0.1:xxxx
    2. appsettings.Production.json 設定 Whitelist (FE和BE設置一樣即可，要填寫的是【前端】對外的網址)
    3. appsettings.Production.json 設定 SqlConnection 指向DB
    IIS站台本身:
    1. 安裝ARR (Application Request Routing Cache)
    2. 啟用Proxy
        A. 點擊右邊 Server Proxy Settings
        B. 打勾 Enable proxy