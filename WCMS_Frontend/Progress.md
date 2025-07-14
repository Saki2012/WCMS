# 前端開發進度

## 2025/06/23

**進度**
- [ ] 將Main Page UI完整套用至新專案上 (25%)
- [ ] 細分元件及套用方式及流程    (20%)

**處理細項**
- 將舊的css套用至新版，導至Main Page上
- 拆分Components
    - Banner Sliders (Banner輪播)
    - Dynamic Menu (動態Menu)
    - CategoryTabs (分類Tabs列表)
    - BaseCarousel (輪播Base元件)
    - IconCardMenu (圖片導覽)
    - Siteinfo (footer使用-基本資訊)
- SpecFeatures (For 1810 台藝大研發處)
    - EventSession (活動資訊區塊)
    - GallerySession (活動花絮區塊)
    - VideoSession (影片專區)
---
## 2025/06/25
**進度**
- [ ] 將Main Page UI完整套用至新專案上 (40%)
- [ ] 新專案RWD顯示都正確        (15%)
- [x] 細分元件及套用方式及流程
- [x] Mock資料建立:最新消息/活動資訊/活動花絮/影片/Menu

**處理細項**
- ✅建立HeaderComp
- 套用Header、Content、Footer到Page、RWD的顯示都一致正常
- ✅建立 1810專案的 Menu/最新消息/活動資訊/活動花絮/影片這五個MockData
- ✅細節整理一下專案元件分類位置
- ✅上git確定哪些資料要先做版控
- ✅重新整理Componets分類
    在此底下建立 xxx_Comp.tsx(Render) / xxx_Hook.ts(區域功能) / xxx_Data.ts(資料取得)
    - Banner
    - 快速導覽 (QuickNavi)
    - 最新消息 (TabsList)
    - 活動資訊 (MediaList)
    - 活動花絮 (MediaList)
    - 影片資訊 (MediaList)
- 舊有的Script分區域和全域，區域的用Hook做處理和整理
---
## 2025/06/26
**進度**
<mark>目標:2025/06/27要能展示Main Page點選按鈕跳到SubPage，並且Main Page的呈現都如現況一樣</mark>
- [ ] 將Main Page UI完整套用至新專案上 (40%)
- [ ] 新專案RWD顯示都正確        (15%)
- [ ] 將Main Page的Legacy script轉接至hook (20%)
- [x] 初步創建SubPage與Route導入SubPage

**處理細項**
- 轉接Main/Sub Page Hook 
    - Header (js/css/meta...)
        - Title
        - Menu
    - Content
        - Banner
        - QuickNavi
        - News
        - Event
        - Gallery
        - Video
    - Footer
        - CustContent
        - SiteInfo
    - Google Analyze
- 確認Main/Sub Page 呈現結果
- ✅Router處理頁面(寫一個轉接動作到Sub page)
- ✅新增SubPage模組
    - ✅Banner
    - ✅Navi Bar
    - ✅Menu
    - ✅Grid
        - ✅Search Bar
    - ✅PageContent
- ✅建立Mock Data (SubPage的最新公告，取News_Data的mock即可)

**額外確認事項**
- css在F12應該看得到實際路徑行項
- Data的格式應取為 interface (尚未整理完畢)
- Components的格式應取為 const (尚未整理完畢)

---
## 2025/06/27
<mark>下一階段:優先開始處理後台前端畫面呈現</mark>
<mark>目前的三個進度先暫停，優先改處理後台畫面元件，以及提到AA的重點</mark>
> (1) 前端改用SSR作法 (2) 包元件

**進度**
- [ ] 將Main Page UI完整套用至新專案上 (50%)
- [ ] 新專案RWD顯示都正確 (15%)
- [ ] 將Main Page的Legacy script轉接至hook (20%)

**處理細項**
- 轉接Main/Sub Page Hook 
    - Header (js/css/meta...)
        - Title
        - Menu
    - Content
        - Banner
        - QuickNavi
        - News
        - Event
        - Gallery
        - Video
    - Footer
        - CustContent
        - SiteInfo
    - Google Analyze
- 確認Main/Sub Page 呈現結果
- ✅Meeting演示進度 (前端渲染畫面、AA注意事項)
- ✅釐清AA細節(規劃即將要處理注意)
    - AA檢測先用Freego執行檢測 (直衝AAA規格)
    - 機器檢測會關閉js，導致React渲染會造成AA失敗->改用 Server-side Rendering（SSR）處理
    - AA檢測到有API連結是否會有異常 (研究中)
    - 為解決AA問題，將基礎元件如 img、a、title，或是組合式的圖片連結(如a+img)都將包裝成新的unit來使用，來強迫帶入符合AA的參數
    - TabIndex找看看什麼方法可以動態產生又符合AA規範
---
## 2025/06/30
**進度**
- [x] 規劃Server後台結構
    - 註:目前缺少會員管理以及其他非1810用到的模塊
- [ ] 確認SSR處理方式 (50%)
    - CSR/SSR參數分別執行OK、剩SSR執行成功與否
- [x] 調整Import作法
    - 可正常運行但vsc無法正確辨識，暫時先停止

**處理細項**
- ✅規劃 Features 的 Client(前台) / Server(後台) 結構
    - Client (前台):
        - HomePage
        - SubPage
        - Header
        - Footer
        - GoogleAnalysis
    - Server (後台):
        - BizFunc
            - Dashboard (系統管理儀表板)
                - Configure (參數設置)
                - Email (Email參數設置)
                - Login (登入系統)
                - SiteInfo (網站資訊)
                - SystemInfo (主機資訊)
            - WebManagement (網站管理功能)
                - Announcement (公告)
                - BannerSlider (廣告輪播)
                - Category (類別管理)
                - FileManage (檔案室)
                - Gallery (相簿)
                - PageManage (頁面)
                - Tags (標籤)
                - WebResource (網路資源)
            - RolePermission (角色權限設置)
                - (暫定)

- 調整專案的import結構 
- ❎(尚未實行)封裝AA與html使用方式
- ✅討論後台管理功能以功能結構調整使用者操作流程

---
## 2025/07/01
<mark>本周目標:將六大功能的前端模型拼接成功</mark>

**進度**
- [ ] 拼接功能清單內容 (10%)
- [ ] 拼接功能表單內容 (10%)
- [ ] 整合頁面呈現樣子 (5%)
- [ ] 確認SSR處理方式 (75%)

**處理細項**
- 抽離控件單元
    - Menu
- 調整專案的import結構
    - 一律先把路徑用相對路徑的方式回到/src底下，再來往下找。未來找到方法再用@的方式解決。
- 處理SSR分離執行方式，目前分離成功，但SSR碰到DOM處理時會異常。
因舊有一些Script導致執行上會失效，需要在這方面整理一次那些碰到script的時候需要注意跟調整。

---
## 2025/07/02
<mark>本周目標:將六大功能的前端模型拼接成功，今明兩日著重處理後端Page畫面呈現</mark>

**進度**
- [ ] 拼接功能清單內容 (25%)
- [ ] 抽離元件處理方式 (30%)
    - _Comp
    - _Data
    - _Hook
    - _Clsx

**處理細項**
- 抽離控件單元
    - Menu
    - BreadCrumb
    - Grid
- mockData會移至Feature處理(針對案例處理)

---
## 2025/07/03

**進度**
- [ ] 拼接功能清單內容 (75%)
- [x] 抽離元件處理方式
- [x] 串接舊的css/js
**處理細項**
- 抽離控件單元
    - Grid
    - ✅NaviBar
    - ✅Menu 
    - ✅BreadCrumb
    - SearchBar

- ✅組合成單一頁面(以"頁面"功能為主，新增和列表)
- ✅mockData會移至Feature處理(針對案例處理)
- ✅API/MockData的相依注入處理
- ✅env dev與prod差異處理
    - 設定參數使用mock
    - SSR/CSR啟用參數改至.env上處理
- ✅串接舊的css/js

---
## 2025/07/04
<mark>
今天講解前端進度:

1. 後台的頁面列表/清單顯示
2. 動態渲染產生的結構與方式 - 主子站有個基礎的Feature功能可以直接套用
3. clsx設計多風格結構類型 (同結構不同css這部分需再跟Jess討論)
4. 採用注入式的方式導入Route+Data(特別講api/mock data的做法與無連接的處理)
    - UI的文字顯示相關，皆由參數的方式帶入，來達成多語系切換
    - 功能設計與Route自動對齊的功能接下來會再補上
        - 動態頁面(如新增的文章)，在透過同樣的網址打入後
        會先在Backend做一次身份驗證，再來決定渲染(正常 or 無權限瀏覽...)
5. SSR的進度會在放後擺一點(舊有js的關係)，下周開始對接後端資料處理
6. 下周開始串接後端與api處理及測試流程
    - 後台可以增刪改內容，前台一樣看得到增刪改後的樣式結果
7. ckEdit事宜
    - 即時預覽畫面
    - 套用到既有靜態頁框架
    - 支援 RWD 響應式預覽
</mark>

**進度**
- [ ] 拼接功能清單內容 (75%)
- [x] 評估外包Code程度
**處理細項**
- Menu下拉問題 (style:block因素)
- ✅icon css處理
- 頁面與清單顯示
- 切換功能時畫面會閃的問題

---
## 2025/07/07
<mark> 本週目標:完成前後端資料對接與前台顯示 <mark>

**進度**
- [x] 先處理後端功能流程
**處理細項**
- ✅包a包圖，裏頭alt要清空 (LibData.fixNestedAltInAnchor)
注:尚未測試

---
## 2025/07/10

**進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (10%)

**處理細項**
- 設計Page頁面功能的搜尋及新增修改刪除的動作

---
## 2025/07/11
<mark>
預計下周進度:
1. 呈現頁面新增修改刪除、前後台看得到畫面(原本預計今天)
2. 資料變更日誌系統
3. 操作日誌系統
4. 舊資料Mirgation至新DB -> 採用先撈舊資料->透過後端API原有功能批次導入
5. TinyMCE導入
6. 使用者資料與角色權限登入
7. 多語系系統
8. Message系統
</mark>

**進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (15%)

**處理細項**
- 設計Page頁面功能的搜尋及新增修改刪除的動作
- 前端資料Model設計

---
## 2025/07/14
**進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (35%)
- 
**處理細項**
- 規劃前端資料模型設計 (由後端製作DTO/ViewModel)，再透過OpenAPI去動態創建資料模型即可
- 細節化頁面列表/編輯頁面
---


<mark>
本週重點進度:
1. 呈現頁面新增修改刪除、前後台看得到畫面
2. 舊資料Mirgation至新DB -> 採用先撈舊資料->透過後端API原有功能批次導入
✅3. TinyMCE導入
4. 使用者資料與角色權限登入
5. Message系統與Api Request
</mark>

**待處理清單**
- [ ] 調整專案的import結構 
- [ ] Router的動態相依注入處理
- [ ] SSR渲染問題
- [ ] 動態Header(react-helmet-async)
- [ ] env dev與prod差異處理
    - 設定參數使用log顯示
- [ ] Mock Data做一種假資料，前端啟動時會先初始化，之後也可做增刪改，直到重新啟動系統後回復到原本的假資料
