# CMS 系統開發／佈署標準作業規範

**Software Development Lifecycle & Secure Delivery Standard**

- **Version：** 1.0
- **主題：** 系統開發優化、資安與佈署
- **適用對象：** RD／新進 RD／委外開發／AI Coding
- **公司：** 國際暢行科技有限公司

---

## 壹、目的

建立公司 CMS 系統一致且可持續維護之軟體開發標準，降低因不同開發人員之程式撰寫習慣、技術背景及個人經驗差異所造成的系統品質與維護風險。

- 建立統一的程式開發及版本管理標準。
- 建立 Coding Rules、Secure Coding、Code Review 與品質檢核機制。
- 建立 Git 分支、Build、Release、部署及 Rollback 標準。
- 降低第三方套件及已知 CVE 弱點所產生之資安風險。
- 降低系統對特定 RD 個人之依賴，提高交接與後續維護效率。
- AI 產生的程式碼與人工程式碼採相同標準檢核。

> 程式品質以共同標準判斷，不以個人撰寫風格判斷。

---

## 貳、背景

系統品質應以需求與 KPI 達成、架構合理性、資安、API 標準化、可維護性、可測試性、版本可追蹤性及交接能力等客觀指標判斷。

- 功能與專案 KPI 是否達成。
- 是否符合 Coding Rules 與 Secure Coding。
- 是否具有適當錯誤處理、Log 與權限控制。
- API、DB Access 與系統架構是否符合公司標準。
- 是否存在重大資安漏洞或 High / Critical CVE。
- 是否可正常 Build、測試、部署及 Rollback。
- 是否具有足夠文件供後續人員維護。

---

## 參、執行原則與障礙

規範的目的不是增加負擔，而是建立「看得懂、做得到、可以被系統自動檢查」的制度。

- **簡單：** RD 能快速理解，不建立大量無實際用途文件。
- **可執行：** 能直接導入目前 CMS 開發流程。
- **可檢查：** 可由 GitHub、CI/CD、SonarQube、CVE Scan 或 Code Review 判斷。
- **可追蹤：** 重要修改具有 Issue、Commit、Pull Request 或版本紀錄。
- **可交接：** 更換 RD 時可依 Repository、文件及版本紀錄接手。
- **自動化優先：** 可由工具檢查者，盡量不依賴人工記憶。

---

## 肆、Git 版本管理與上版程序

公司 CMS 原始碼統一存放於公司指定之 GitHub Repository，Repository 為正式程式碼來源（Source of Truth）。

禁止：

- 僅將最新版程式存放於 RD 個人電腦。
- 使用個人 Repository 作為正式來源。
- 正式版未 Push。
- 未經版本管理直接修改正式站。

### 4.1 分支標準

```text
main
├─ develop
│  ├─ feature/功能名稱
│  └─ bugfix/問題名稱
└─ hotfix/正式站緊急問題
```

- `main`：正式版本，原則上與正式環境一致，禁止直接 Push。
- `develop`：開發整合版本。
- `feature/*`：新功能開發，例如 `feature/member-login`。
- `bugfix/*`：一般錯誤修正。
- `hotfix/*`：正式站重大問題緊急修正，完成後仍須回到正式 Git 流程。

### 4.2 Spec / Issue 開發程序

```text
需求 / Issue
    ↓
Specification
    ↓
Feature Branch
    ↓
Development
    ↓
Commit
    ↓
Push
    ↓
Pull Request
    ↓
Code Review
    ↓
CI Security Check
    ↓
Build
    ↓
Test
    ↓
Merge
```

重大功能不得僅以口頭交辦。

Spec 至少包含：

- 功能目的。
- 使用情境。
- Input / Output。
- 權限。
- API。
- DB 修改。
- 驗收條件。
- 資安注意事項。

---

## 伍、Coding Rules 與 Secure Coding

### 5.1 Coding Rules

- Class、Method、Variable、API、Database Table 採一致且可辨識之命名。
- 避免過度大型 Method、重複程式碼與 Controller 內大量 Business Logic。
- 共用功能適度模組化。
- DB Access 與 API Response 採公司一致架構。
- Connection String、API Key、Password、Token、SMTP Password、Secret 禁止 Hard Code。

### 5.2 Secure Coding

應檢查並防範：

- SQL Injection。
- XSS。
- CSRF。
- Broken Access Control。
- Authentication。
- Authorization。
- Input Validation。
- Output Encoding。
- File Upload。
- Path Traversal。
- Sensitive Data Exposure。
- Exception Information Disclosure。
- API Authorization。

禁止直接信任 Client 端傳入資料；所有外部輸入均應進行必要驗證。

---

## 陸、Code Review

重要 Feature 原則上必須透過 Pull Request，並至少由另一位 RD Review。

Review 應確認：

- 是否符合 Spec 與 Coding Rules。
- 是否存在明顯資安問題或不必要第三方套件。
- Exception Handling、Log、DB Query、API 是否合理。
- 是否影響既有功能。
- 是否具備必要測試。

> Code Review 是確認是否符合公司標準，不是比較 RD 個人的寫法。

---

## 柒、CI/CD 編譯與資安檢核

Pull Request 建立後，透過 GitHub CI/CD 自動執行必要檢核。

建議第一階段流程如下：

```text
Pull Request
    ↓
Dependency / CVE Scan
    ↓
SonarQube
    ↓
Build
    ↓
Unit Test
    ↓
Security / Quality Gate
    ↓
Code Review
    ↓
Merge
```

### 7.1 第三方套件與 CVE

NuGet、npm 或其他第三方套件應納入版本與漏洞管理。

可利用：

- GitHub Dependabot：追蹤既有 Dependency 已知漏洞。
- Dependency Review：於 PR 階段檢查新導入的漏洞套件。

| Severity | V1.0 建議處理 |
| --- | --- |
| Critical | 禁止 Merge / Release |
| High | 原則禁止 Merge / Release |
| Medium | 建立改善紀錄 |
| Low | 評估處理 |

High / Critical 若因相容性等因素暫時無法修正，應建立風險例外紀錄，包含：

- CVE / GHSA。
- 影響版本。
- 實際影響。
- 暫不升級原因。
- 補償措施。
- 預計改善版本。

### 7.2 SonarQube

SonarQube 用於 Source Code Quality / Security，包含：

- Bugs。
- Vulnerabilities。
- Security Hotspots。
- Code Smells。
- Duplicate Code。
- Maintainability。

不得以 SonarQube 完全取代第三方套件 CVE 管理。

```text
SonarQube
→ SAST / Source Code Quality

Dependabot / Dependency Review
→ SCA / Third-party CVE
```

### 7.3 Build Gate

```text
PR
├─ Code Review ─ FAIL → BLOCK
├─ CVE Scan ──── FAIL → BLOCK
├─ SonarQube ─── FAIL → BLOCK
├─ Build ─────── FAIL → BLOCK
└─ Test ──────── FAIL → BLOCK
         PASS → Merge
```

`main` 應設定 Branch Protection / Ruleset，避免未經必要檢核直接合併。

---

## 捌、Release 與版本管理

正式發布應建立 Release Version 與 Git Tag，建議採 Semantic Versioning 概念：

```text
vMajor.Minor.Patch
```

- **Major：** 重大架構或不相容變更。
- **Minor：** 新增功能。
- **Patch：** Bug / Security Fix。

每次正式發布應能確認某一客戶正式環境所使用之確切 Source Code 與 Release Package。

---

## 玖、正式站部署與 Rollback

### 9.1 禁止直接修改正式站

```text
Git
 ↓
CI
 ↓
Build
 ↓
Test
 ↓
Release Package
 ↓
Backup
 ↓
Deploy
 ↓
Smoke Test
```

原則上禁止 RD 直接登入正式站修改 Source Code。

緊急修正亦須回補 Git 流程。

### 9.2 保留正式版本

正式環境或公司指定部署儲存位置至少保留「目前版本 + 前兩版」已驗證 Release Package。

```text
/releases
  CMS_2.5.3  ← Current
  CMS_2.5.2  ← Previous
  CMS_2.5.1  ← Previous-2
```

發生重大問題時應優先切回已驗證 Release Package，而非臨時重新 Build，以避免 SDK、Dependency 或 Build Environment 差異。

### 9.3 GitHub 異常之備援

正式部署包不得只存在 GitHub。

公司應於正式環境或指定內部儲存位置保留：

- Release Package。
- 必要設定說明。
- 版本資訊。

以因應 GitHub、帳號權限或 CI/CD 暫時異常。

### 9.4 Database Deployment

程式 Rollback 與 Database Rollback 必須分開考慮。

涉及 Schema 修改時：

- 應保存 Migration / Upgrade Script。
- 可行時準備 Rollback Script。
- 部署前須確認新版 DB 是否仍允許舊版程式運作。

---

## 拾、正式部署前 Checklist

- [ ] PR 已完成。
- [ ] Code Review 已完成。
- [ ] CI Build PASS。
- [ ] SonarQube / Quality Gate 已完成。
- [ ] CVE Security Gate 已完成。
- [ ] 必要測試已完成。
- [ ] Git Tag / Release 已建立。
- [ ] Release Package 已建立。
- [ ] DB Migration 已確認。
- [ ] 正式 DB 與程式備份已確認。
- [ ] Rollback Version 已確認。
- [ ] 部署時間與人員已確認。
- [ ] 部署後 Smoke Test 項目已確認。

---

## 拾壹、部署後 Smoke Test

部署完成不得僅以「首頁打得開」作為成功標準。

至少檢查：

- 首頁。
- 登入。
- 後台登入。
- 主要 CRUD。
- 權限。
- API。
- File Upload。
- Email。
- Log。
- DB Connection。
- 本次新增／修改功能。

---

## 拾貳、Log、第三方套件與 AI Coding

### 12.1 Log 與稽核

重要系統至少保留：

- Login Log。
- Error Log。
- Admin Operation Log。
- Security Log。
- API Error Log。

Log 不得記錄：

- Password。
- 完整 Token。
- Secret。
- 不必要個資。

### 12.2 第三方套件治理

導入第三方套件前應確認：

- 套件來源與 License。
- 是否持續維護及最近更新狀態。
- 是否存在已知 CVE。
- 是否真的需要導入。
- 是否有官方／既有替代方案。

### 12.3 AI Coding

AI 可協助：

- Coding。
- Refactoring。
- Unit Test。
- Documentation。
- Debug。
- Code Review。

AI 產生之程式碼視同 RD 自行撰寫，仍須通過：

- Coding Rules。
- Secure Coding。
- Code Review。
- SonarQube。
- CVE Scan。
- Build。
- Test。

RD 必須理解並對提交內容負責。

禁止將以下資料直接提供予公開 AI 服務：

- 公司 Password。
- API Key。
- 客戶機敏資料。
- 正式資料庫內容。
- 其他未授權資料。

---

## 拾參、系統交接標準

RD 交接不得只交 Source Code。

至少應包含：

- README。
- Architecture。
- Environment。
- Database。
- API。
- Third-party Dependencies。
- Build。
- Deploy。
- Rollback。
- Known Issues。

```text
Clone → Configuration → Build → Run
```

新 RD 應能依文件完成上述流程。

---

## 拾肆、既有系統與例外管理

- **新系統：** 原則上全面適用。
- **既有 CMS：** 逐步改善，不要求一次全面 Rewrite。
- **Legacy System：** 因技術限制無法符合時，建立例外紀錄與改善計畫。

不得因新標準建立而直接認定既有程式全部不合格；應從新功能、新版本及重大修改開始逐步導入。

---

## 拾伍、公司 CMS 開發標準總流程

```text
需求 / Issue
    ↓
Specification
    ↓
Feature Branch
    ↓
Development
    ├─ Coding Rules
    └─ Secure Coding
    ↓
Pull Request
    ├─ Code Review
    ├─ SCA / CVE Scan
    ├─ SonarQube
    ├─ Build
    └─ Test
    ↓
Security / Quality Gate
    ├─ FAIL → 修改 → 重新檢核
    └─ PASS
        ↓
      Merge
        ↓
Git Tag / Release
        ↓
Release Package
        ↓
正式環境備份
        ↓
Deploy
        ↓
Smoke Test
    ├─ FAIL → Rollback
    └─ PASS → 正式發布完成
```

---

## 拾陸、制度核心原則

> 需求有規格、程式有標準、修改有紀錄、程式有人 Review、資安有檢核、版本可以追蹤、部署

---

**CMS 系統軟體開發標準作業規範 V1.0**
