# 前端開發進度

## 2025/06/23

**前端進度**
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
**前端進度**
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
**前端進度**
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

**前端進度**
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
**前端進度**
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

**前端進度**
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

**前端進度**
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

**前端進度**
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

**前端進度**
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

**前端進度**
- [x] 先處理後端功能流程
**處理細項**
- ✅包a包圖，裏頭alt要清空 (LibData.fixNestedAltInAnchor)
注:尚未測試

---
## 2025/07/10

**前端進度**
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

**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (15%)

**處理細項**
- 設計Page頁面功能的搜尋及新增修改刪除的動作
- 前端資料Model設計

---
## 2025/07/14
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (35%)
- ✅TinyMCE初步導入
**處理細項**
- 規劃前端資料模型設計 (由後端製作DTO/ViewModel)，再透過OpenAPI去動態創建資料模型即可
- 細節化頁面列表/編輯頁面
---
## 2025/07/15
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (75%)
- [ ] TinyMCE完善細項功能 (25%)
- [ ] 多國語系顯示系統 (25%)

**處理細項**
- 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示
    - 拆分輸入控鍵
    - 後端LibDesc多國語言
        - API接收欄位顯示名稱並渲染
        - API接收資料渲染到對應控鍵資料
    - TinyMCE實作
---
## 2025/07/16
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (85%)

**處理細項**
- 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示
    - 後端LibDesc多國語言
        - API接收欄位顯示名稱並渲染
        - API接收資料渲染到對應控鍵資料
    - Hook 頁面打API的Timing與渲染
- 整理前台畫面與結構
---
## 2025/07/17
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (85%)
- [ ] 架設前後端Server至Server 2
**處理細項**
- 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示
    - 後端LibDesc多國語言
        - API接收欄位顯示名稱並渲染
        - API接收資料渲染到對應控鍵資料
    - Hook 頁面打API的Timing與渲染
- ✅整理前台畫面與結構
- ✅主題風格整理與帶入處理
---
## 2025/07/18
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (85%)
- [X] 架設前後端Server至Server 2 (處理DB建置)
- [x] 報告進度:
    - 已架設環境 (前端、後端、DB)
    - 前端元件分割與實作流程(主題注入 / 控件Hook與api對接實例)
**處理細項**
- 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示
    - 後端LibDesc多國語言
        - API接收欄位顯示名稱並渲染
        - API接收資料渲染到對應控鍵資料
    - Hook 頁面打API的Timing與渲染
- 設置Server 2架前後端
---
## 2025/07/21
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (90%)
**處理細項**
- ✅處理Form的Toolbar框架
- ✅透過Toolbar框架hook至api，並成功CRUD
- ✅透過UID去撈資料渲染
---

## 2025/07/22
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (90%)
**處理細項**
- 調整api傳參與接後端api資料格式

---
## 2025/07/24
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (90%)
**處理細項**
- binding資料處理
- 按鈕功能實現(增刪改)

---
## 2025/07/25
**前端進度**
- [ ] 串接API至後端，讓資料能打跟CRUD，以及前台畫面顯示 (95%)
**處理細項**
- binding資料處理
- 按鈕功能實現(增刪改)
- Grid表Paginator可執行分頁動作

---
## 2025/07/28
本周前端預期進度:
1. 新增的東西在前台可見
2. Menu可縮放
3. Toast提示訊息
4. 其餘功能完善
5. 語系

---
## 2025/07/30

**前端處理事項**
- 調整Paginator顯示最多五筆
- 保存成功後立刻回到List
- 將標題顯示至List(暫時寫死條件為中文)
- (後端)Migrate舊資料至新專案db (檔案尚未處理)
- 前台畫面整理(可顯示公告的明細)

## 2025/07/31

**前端處理事項**
- 整理下午報告內容
- 調整公告編輯頁面
- 調整類別/標籤編輯頁面
- 新增前台內文頁



**前端待處理清單**
- [ ] Router的動態相依注入處理
- [ ] SSR渲染問題
- [ ] 動態Header(react-helmet-async)
- [ ] env dev與prod差異處理
    - 設定參數使用log顯示
- [ ] Mock Data做一種假資料，前端啟動時會先初始化，之後也可做增刪改，直到重新啟動系統後回復到原本的假資料
- [ ] Route查id資料時，若查無資料則回傳"查無資料"訊息，且不渲染完整欄位
- [ ] 設計Loading載入時間與讀取畫面
        < 200ms	不顯示 loading（避免閃爍）
        200–500ms	顯示小 loading 或淡入效果
        > 500ms	顯示明確 loading 畫面
- [ ] 執行與提示訊息


**大方向尚未處理:**
- 六大功能模塊
- 檔案管理
- 網站結構(Menu)與動態路由
- 會員登入與角色權限+功能控制
- 提示訊息封裝與Toast呈現(前端與後端)
- 操作日誌與變更日誌
- 多語系切換與資料條件
- 整理前端專案，使之可SSR編譯(供Freego AA檢測)

**細項調整:**
- TinyMCE功能
	-	1. 檔案從本機上傳，可作為連結下載
	-	2. 圖片需要能從本機上傳，並且調整寬度、高度，若空白或100%符合RWD
	-	3. 可以有顯示區塊的功能
	-	4. IFrame崁入youtube或google map，可設寬、高度，標題和完整描述URL
	-	5. 水平線插入、字體刪除線
	-	6. 字體大小、字型
- 前後台的Grid Paginator修正bug
- Menu縮放動畫未呈現Bug
- 讀取畫面會有一點閃爍狀況
- 後端關聯資料(Name)取得方式
- BreadCrumb、Menu的取值與定位
