# 後端開發進度

## 2025/07/07
<mark> 本週目標:完成前後端資料對接與前台顯示 <mark>

**進度**
- [x] BizService與BaseRepository功能相依拆解
- [x] Api與Route

**處理細項**
- 動態映射與Memory載存
- Async CRUD
- 開設ApiResponse

---

## 2025/07/08

**進度**
- [ ] 建立頁面功能的Model (35%)
- [x] Router的動態相依注入處理

**處理細項**
- ✅增添RegisterBizServices自動添加Service注入
- ✅[ApiController, Route(SysParam.ServiceRoute)] 自動導入Router與CRUD
- 建立Model
    - Features
        - 網站功能 (SiteEdit)
            - 橫幅/廣告輪播 (Banner)
            - 公告 (Announcement)
            - 檔案室 (FileArchive)
            - 相簿 (Gallery)
            - 頁面 (PageManagement)
            - 網路資源 (WebResource)
            - ❎ 主子站設定 (PCS_Sites) - 留之後討論Model後再來處理
            - 類別 (Category)
            - 類別 (Tag)
        - 使用者 (User)
            ...
    - SpecFeatures
        - 1810
            - 研究計畫 (Research)
            - USR計畫 (USR)
- ✅ApiDataController添加GetModelDisplayName，動態獲取欄位顯示名稱 (先挖Route、後續實現)

---

## 2025/07/09

**進度**
- [x] 建立六大功能的Model
    - [x] 廣告輪播
    - [x] 公告
    - [x] 類別
    - [x] 標籤
    - [x] 檔案室
    - [x] 相簿
    - [x] 頁面管理
    - [x] 網路資源
    - [x] 1810
        - [x] USR計畫
        - [x] 研究計畫
- [x] 在本地建立DB環境
- [x] 基本功能CRUD執行正常


**處理細項**
- 處理CRUD與基本流程順暢
- 資料模型類型與關聯正確性 (index, foreign Key, 刪主表同時刪除子表)
- 資料變更與操作日誌紀錄
- 建立系統常用訊息包

---

## 2025/07/10

**進度**
- [ ] 串接API至前端，讓資料能打跟CRUD，以及前台畫面顯示 (10%)
- [x] 提示訊息包與ErrorMiddleWare
- [x] try-catch整理，避免遺漏bug (ErrorMiddleware)

**處理細項**
- Query資料處理與串接
- 作廢功能處理
- 

---
## 2025/07/11

**進度**

**處理細項**

---
**後端待處理清單**
- [ ] 後端寫一個db debug用的檢測功能，異常時可以顯示(用於確認是否開發時版本正確):
    - 連接成功與否
    - Table比對是否一致
    - 欄位是否一致
    - db版本
- [ ] Server即時性備份資料檔案
- [ ] dbfirst codefirst
- [ ] 檔案管理系統
- [ ] 多語系系統
    - [ ] 處理LibDesc描述規則
    - [ ] Resx檔案規劃(先只要中文即可，後續再透過AI轉各國語言)
- [ ] 資料變更 (架在BizService上，採用json搭Base64極致壓縮)
- [ ] 操作日誌系統 (架在API上)
- [ ] 舊資料Migration至新的DB
- [ ] 設計後端的資料檢測等邏輯可同步到前端，讓前端一同檢測 (後端產出驗證規則 → 給前端用)
- [ ] 定義欄位儲存長度(☆Key一律 50 varchar)