# WCMS 系統軟體開發標準作業規範

**Software Development Lifecycle & Secure Delivery Standard**

- **Version：** 1.1
- **主題：** 系統開發優化、資安、版本管理與佈署治理
- **文件層級：** 公司與專案作業治理規範
- **適用對象：** RD／新進 RD／委外開發／AI Coding／專案相關人員
- **適用專案：** WCMS
- **公司：** 國際暢行科技有限公司

> 本文件定義公司與專案層級應遵循的開發、版本、品質、資安、發布及交接原則。各項技術實作方式、程式架構與工具設定，依專案正式技術文件及 Repository 現況執行。

## 版本修訂紀錄

| Version | 修訂重點 |
| --- | --- |
| 1.0 | 建立 CMS 開發、資安、版本、部署及交接基本規範。 |
| 1.1 | 調整 Git 分支與上版治理方式；補強分階段品質檢核、資安複驗、版本可追溯、專案特定品質要求及 AI 驗證責任。 |

---

## 壹、目的

建立公司 CMS 系統一致且可持續維護之軟體開發標準，降低因不同開發人員之程式撰寫習慣、技術背景及個人經驗差異所造成的系統品質與維護風險。

- 建立統一的程式開發及版本管理原則。
- 建立 Coding Rules、Secure Coding、Code Review 與品質檢核機制。
- 建立 Git、Build、Release、部署及 Rollback 管理原則。
- 降低第三方套件及已知 CVE 弱點所產生之資安風險。
- 降低系統對特定 RD 個人之依賴，提高交接與後續維護效率。
- AI 產生的程式碼與人工程式碼採相同標準檢核。
- 確保需求、修改、版本、部署與驗證結果可追溯。

> 程式品質以共同標準判斷，不以個人撰寫風格判斷。

---

## 貳、背景

系統品質應以需求與 KPI 達成、架構合理性、資安、API 標準化、可維護性、可測試性、版本可追蹤性及交接能力等客觀指標判斷。

- 功能與專案 KPI 是否達成。
- 是否符合 Coding Rules 與 Secure Coding。
- 是否具有適當錯誤處理、Log 與權限控制。
- API、DB Access 與系統架構是否符合專案正式規範。
- 是否存在重大資安漏洞或 High / Critical CVE。
- 是否可正常 Build、測試、部署及 Rollback。
- 是否具有足夠文件供後續人員維護。
- 是否完成專案要求之必要品質、法規或驗證項目。

---

## 參、執行原則與障礙

規範的目的不是增加負擔，而是建立「看得懂、做得到、可以被檢查、能持續改善」的制度。

- **簡單：** RD 能快速理解，不建立大量無實際用途文件。
- **可執行：** 能直接導入目前專案開發流程。
- **可檢查：** 可由版本紀錄、自動化工具、測試或人工 Review 判斷。
- **可追蹤：** 重要修改具有 Issue、Commit、Pull Request、版本或等效紀錄。
- **可交接：** 更換 RD 時可依 Repository、文件及版本紀錄接手。
- **自動化優先：** 可由工具穩定檢查者，逐步降低對人工記憶的依賴。
- **分層管理：** 本文件定義治理要求；實際架構、Coding Style、工具設定與技術流程，以專案正式技術文件為準。

---

## 肆、Git 版本管理與上版程序

公司 CMS 原始碼統一存放於公司指定之 GitHub Repository，Repository 為正式程式碼來源（Source of Truth）。

禁止：

- 僅將最新版程式存放於 RD 個人電腦。
- 使用個人 Repository 作為正式來源。
- 應納入版本管理之正式修改未 Push 或無可追溯紀錄。
- 未經版本管理流程直接修改正式站程式。

### 4.1 分支治理原則

各系統應依實際開發、整合、發布與客製需求定義分支責任。分支名稱可依專案調整，但必須能清楚區分「共用開發」、「發布整合」、「專案客製」及「正式基準」等用途。

WCMS 目前主要分支責任如下：

| 分支 | 主要責任 |
| --- | --- |
| `Feature/Dev` | 共用功能、系統基礎能力、一般功能與架構開發之主要整合分支。 |
| `Feature/Release` | 正式發布前之整合、版本確認、發布準備及必要緊急修正。 |
| `Spec####` | 個別專案或客製需求之開發與維護。 |
| `main` | Repository 預設與穩定基準分支；實際發布與合併時機依專案版本管理流程執行。 |

分支使用應遵循以下原則：

- 共用問題應優先回到共用開發來源處理，避免各專案形成不同修正版。
- 發布整合分支不作為日常一般功能開發用途。
- 客製分支應清楚區分共用能力與專案專用內容。
- 緊急修正完成後，必須確認是否需要同步回共用開發分支及相關專案分支，避免正式版本與後續開發版本分歧。
- 重要合併、發布與回同步應保留 Commit、PR、Issue 或其他可追溯紀錄。
- 不以「分支名稱」本身代表品質狀態；是否可發布仍應以實際 Review、Build、Test、資安與驗證結果判定。

### 4.2 Spec / Issue 開發程序

專案開發程序原則如下：

```text
需求 / Issue
    ↓
Specification / 驗收條件
    ↓
確認目標分支與影響範圍
    ↓
Development
    ↓
Commit / Push
    ↓
Review / 必要品質與資安檢核
    ↓
整合 / Release 準備
    ↓
Build / Test / 驗證
    ↓
發布或合併完成
```

重大功能不得僅以口頭交辦，應具備可追溯之需求或決策紀錄。

Spec 原則上應包含：

- 功能目的。
- 使用情境。
- Input / Output 或主要資料需求。
- 權限或使用限制。
- 主要系統介面與資料異動範圍。
- 驗收條件。
- 資安、無障礙、法規或其他專案特定注意事項。

重要功能與整合至發布版本前，應具備適當 Review 機制；專案已導入 Pull Request 時，原則上優先透過 Pull Request 保留審查與合併紀錄。

---

## 伍、Coding Rules 與 Secure Coding

### 5.1 Coding Rules

- Class、Method、Variable、API、Database Table 採一致且可辨識之命名。
- 避免過度大型 Method、重複程式碼與單一層級承擔過多 Business Logic。
- 共用功能適度模組化，並優先沿用專案既有共用能力。
- DB Access、API Response 與系統資料流依專案一致架構處理。
- Connection String、API Key、Password、Token、SMTP Password、Secret 禁止 Hard Code。
- 程式修改應聚焦本次需求，避免無關的大範圍重構增加交付風險。

### 5.2 Secure Coding

應檢查並防範常見應用程式及 API 資安風險，包括但不限於：

- SQL Injection。
- XSS。
- CSRF。
- Broken Access Control。
- Authentication / Authorization 失效。
- Input Validation / Output Encoding 不足。
- File Upload / Path Traversal。
- Sensitive Data Exposure。
- Exception Information Disclosure。
- API Authorization 缺漏。

禁止直接信任 Client 端或其他外部來源傳入資料；所有外部輸入均應依風險進行必要驗證。

資安責任不得只依賴單一掃描工具；程式、權限、第三方套件、系統設定及正式環境皆應納入整體風險判斷。

### 5.3 專案特定品質要求

專案如具有無障礙、個資、資安、法規、瀏覽器相容性或其他特定要求，應於需求、開發、測試及正式發布前納入驗證範圍。

專案正式技術文件應說明實際執行方式，本文件僅規範其必須被納入管理與驗收。

---

## 陸、Code Review

重要功能與高風險修改原則上應具備 Code Review 或等效審查機制。

Review 應確認：

- 是否符合 Spec、驗收條件與 Coding Rules。
- 是否存在明顯資安問題或不必要第三方套件。
- Exception Handling、Log、DB Query、API 或主要資料流程是否合理。
- 是否影響既有功能。
- 是否具備與風險相符的必要測試或驗證。
- 是否存在不必要的範圍擴張或無關修改。

> Code Review 是確認是否符合公司與專案標準，不是比較 RD 個人的寫法。

---

## 柒、CI/CD 編譯與資安檢核

專案應逐步建立可重複、可追蹤的 Build、Test、品質與資安檢核流程。

自動化程度可依專案成熟度分階段導入；尚未自動化之項目，應以人工 Review、測試、驗證或其他等效機制補足，不得因工具尚未完成導入而省略必要檢核。

目標流程概念如下：

```text
程式修改 / Pull Request
    ↓
Dependency / CVE Check
    ↓
Source Code Quality / Security Check
    ↓
Build
    ↓
必要 Test
    ↓
Security / Quality Review
    ↓
符合條件後整合或發布
```

### 7.1 第三方套件與 CVE

NuGet、npm 或其他第三方套件應納入版本與漏洞管理，可依專案採用 Dependency Scan、Dependabot、Dependency Review 或其他合適工具。

| Severity | V1.1 建議處理 |
| --- | --- |
| Critical | 禁止 Merge / Release，除非完成正式風險例外核准。 |
| High | 原則禁止 Merge / Release；無法立即修正時應建立風險例外紀錄。 |
| Medium | 建立改善紀錄並依風險安排處理。 |
| Low | 評估影響與處理時機。 |

High / Critical 若因相容性、供應商限制或其他因素暫時無法修正，應建立風險例外紀錄，至少包含：

- 弱點或風險識別資訊。
- 影響版本與實際影響。
- 暫不處理原因。
- 補償措施。
- 負責人或追蹤方式。
- 預計改善版本或重新評估時機。

> 程式已修改不等於弱點已正式關閉。涉及正式弱掃、資安檢測或外部 Finding 時，完成修正後仍應依風險進行必要驗證或複驗，並以實際結果作為結案依據。

### 7.2 Source Code Quality / Security

專案可使用 SonarQube 或其他適當工具進行 Source Code Quality / Security 檢查，並搭配第三方套件漏洞管理。

不同工具各有檢測責任，不應以單一工具結果取代所有品質、資安、套件與人工 Review。

### 7.3 Quality Gate

專案應依目前導入程度定義必要 Gate。原則上，下列重大項目出現未處理失敗時，不應直接進入正式發布：

- 必要 Code Review 未完成。
- Critical / High 重大資安風險未處理或未完成正式風險例外。
- Build 失敗。
- 必要 Test 或驗證失敗。
- 影響發布之重大已知問題未完成風險判斷。

自動化 Gate 尚未全面導入時，應由專案流程保留等效人工檢核與紀錄。

---

## 捌、Release 與版本管理

正式發布應建立可識別之 Release Version 與對應版本紀錄，建議採 Semantic Versioning 概念：

```text
vMajor.Minor.Patch
```

- **Major：** 重大架構或不相容變更。
- **Minor：** 新增功能。
- **Patch：** Bug / Security Fix。

每次正式發布應能確認某一客戶正式環境所使用之確切 Source Code 與 Release Package。

正式版本原則上應可追溯：

```text
需求 / Issue
→ 修改紀錄
→ Release Version
→ Release Package
→ 部署版本
→ 驗證結果
```

各專案可依現行工具與管理方式建立對應欄位或紀錄，不要求使用相同技術實作。

---

## 玖、正式站部署與 Rollback

### 9.1 禁止直接修改正式站

正式部署原則如下：

```text
Git / Version Source
 ↓
Build / Test
 ↓
Release Package
 ↓
Backup
 ↓
Deploy
 ↓
Smoke Test / 驗證
```

原則上禁止 RD 直接登入正式站修改 Source Code。

緊急修正仍須回補 Repository、版本紀錄及必要驗證，避免正式環境與後續開發來源分歧。

### 9.2 保留正式版本

正式環境或公司指定部署儲存位置至少保留「目前版本 + 前兩版」已驗證 Release Package，或依專案風險訂定更高保留標準。

```text
/releases
  Current
  Previous
  Previous-2
```

發生重大問題時應優先切回已驗證 Release Package，而非臨時重新 Build，以降低建置環境或套件差異風險。

### 9.3 GitHub 異常之備援

正式部署包不得只存在單一線上版本管理服務。

公司應於正式環境或指定內部儲存位置保留：

- Release Package。
- 必要設定說明。
- 版本資訊。
- 必要的還原或交接資訊。

以因應 GitHub、帳號權限、網路或 CI/CD 暫時異常。

### 9.4 Database Deployment

程式 Rollback 與 Database Rollback 必須分開考慮。

涉及 Database Schema 或重大資料異動時：

- 應保存 Migration / Upgrade Script 或等效變更紀錄。
- 可行時準備 Rollback 或資料復原方案。
- 部署前應評估新版資料結構與舊版程式之相容性。
- 高風險資料異動應先確認備份與復原方式。

---

## 拾、正式部署前 Checklist

依專案實際導入項目確認：

- [ ] 需求、Issue 或發布範圍已確認。
- [ ] 必要 Code Review／PR 或等效審查已完成。
- [ ] Build 已完成並取得有效結果。
- [ ] 適用的品質與資安檢核已完成。
- [ ] 必要測試與專案特定驗證已完成。
- [ ] Release Version／Tag 或等效版本紀錄已建立。
- [ ] Release Package 已建立。
- [ ] DB Migration／資料異動已確認。
- [ ] 正式 DB 與程式備份已確認。
- [ ] Rollback Version 或復原方案已確認。
- [ ] 部署時間、執行人員與責任窗口已確認。
- [ ] 部署後 Smoke Test／驗證項目已確認。
- [ ] 已知風險、例外與未完成項目已被記錄並完成必要核准。

---

## 拾壹、部署後 Smoke Test

部署完成不得僅以「首頁打得開」作為成功標準。

應依系統功能與本次異動範圍檢查至少包含：

- 主要前台頁面。
- 登入與後台登入。
- 主要 CRUD。
- 權限。
- API 或主要系統介面。
- File Upload、Email 等本次有影響之整合功能。
- Log 與 DB Connection。
- 本次新增／修改功能。
- 專案要求之必要品質、資安或其他驗證項目。

實際 Smoke Test 清單應依專案功能調整，不以本章列舉項目取代正式測試規格。

---

## 拾貳、Log、第三方套件與 AI Coding

### 12.1 Log 與稽核

重要系統應依需求保留必要的操作、錯誤、管理與安全事件紀錄，以支援問題追蹤、稽核與事件處理。

Log 不得記錄：

- Password。
- 完整 Token。
- Secret。
- 非必要敏感資訊或個資。

### 12.2 第三方套件治理

導入第三方套件前應確認：

- 套件來源與 License。
- 是否持續維護及最近更新狀態。
- 是否存在已知 CVE 或重大風險。
- 是否真的需要導入。
- 是否有官方／既有替代方案。
- 是否會增加後續維護、升級或交接負擔。

### 12.3 AI Coding

AI 可協助 Coding、Refactoring、Unit Test、Documentation、Debug 與 Code Review，但 AI 產生之程式碼視同 RD 自行撰寫，仍須依專案要求完成 Coding Rules、Secure Coding、Review、Build、Test 及必要品質與資安檢核。

RD 必須理解並對提交內容負責，不得因程式由 AI 產生而降低 Review 或驗證標準。

> AI 所提供之分析、Code Review、測試建議或檢核結果，不得取代實際 Build、Test、資安檢測、品質驗證或必要人工驗收。未實際執行之檢測不得描述為已通過。

禁止將以下資料直接提供予未經公司授權之公開 AI 服務：

- 公司 Password、API Key、Secret。
- 客戶機敏資料。
- 正式資料庫內容。
- 個資或其他依法、依契約不得外流資料。
- 其他未授權之內部資訊。

---

## 拾參、系統交接標準

RD 交接不得只交 Source Code。

至少應能提供或定位：

- README／專案入口。
- Architecture／主要系統架構。
- Environment／環境與必要設定說明。
- Database／資料庫與版本異動資訊。
- API／主要系統介面。
- Third-party Dependencies。
- Build／Deploy／Rollback 說明。
- 目前正式版本與 Release Package。
- Known Issues、風險例外與未完成事項。

新 RD 應能依文件完成基本的 Clone、Configuration、Build、Run 或等效環境建立流程。

---

## 拾肆、既有系統與例外管理

- **新系統：** 原則上依本規範建立必要流程。
- **既有 CMS：** 逐步改善，不要求一次全面 Rewrite。
- **Legacy System：** 因技術限制無法符合時，建立例外紀錄與改善計畫。

不得因新標準建立而直接認定既有程式全部不合格；應從新功能、新版本及重大修改開始逐步導入。

例外管理應至少說明：

- 無法符合之規範或風險。
- 原因與影響。
- 暫行措施或補償措施。
- 負責人或追蹤方式。
- 預計改善、重新評估或結案條件。

---

## 拾伍、公司 CMS 開發標準總流程

```text
需求 / Issue
    ↓
Specification / 驗收條件
    ↓
確認版本與開發範圍
    ↓
Development
    ├─ Coding Rules
    └─ Secure Coding
    ↓
Commit / Push
    ↓
Review / Quality Check
    ├─ Code Review
    ├─ Dependency / CVE Check
    ├─ Source Code Quality / Security Check
    ├─ Build
    └─ Test / 必要驗證
    ↓
符合發布條件
    ↓
Release Version / Package
    ↓
正式環境備份
    ↓
Deploy
    ↓
Smoke Test / 驗證
    ├─ FAIL → 修正或 Rollback
    └─ PASS → 正式發布完成
```

各專案可依開發模式、工具及成熟度調整中間執行方式，但需求、修改、Review、驗證、版本、部署及結果應保持可追溯。

---

## 拾陸、制度核心原則

> 需求有規格、程式有標準、修改有紀錄、程式有人 Review、資安有檢核、版本可以追蹤、部署可以還原、結果可以驗證。

---

**WCMS 系統軟體開發標準作業規範 V1.1**
