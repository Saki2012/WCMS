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

後端開發規範
1. 所有顯示說明的文字，皆透過.resx做動態多語系處理
2. 禁止在邏輯區寫固定的定義值，若需要仍要用宣告方式處理
3. 務必區分出公開的API時機(Public)、業務流程(Protect)、以及實作過程(Private)
4. 有寫到Try-catch時，除非真的異常結果需要無視後繼續往下走之外，一律throw給ErrorHandlingMiddleware處理
5. 有關時區存儲一律寫UTC作為依據，以作為之後跨區需求

前端程式架構
- src
    - SysCore
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

    - Features
        - Header (Header 模板)
        - Page (頁面模板)
        - Footer (Footer 模板)
        - GoogleAnalysis (Google SEO相關)
        - Menu (主Menu 模板)

    - SpecFeatures
        - 專案別名(e.x. 1810 台藝大研發處)
    
    - Style
        - Legacy (舊的css)

    - Assets
        - 未來放專案需要的file/fonts/image
    
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
5. 前端的資料模型透過 npx openapi-typescript https://localhost:7030/swagger/v1/swagger.json -o src/types/api.d.ts來獲取
6. 若是在前端的系統連結，透過Link to來達到SPA效果，避免不斷刷新造成效能及使用體驗低落