# WCMS 弱點掃描報告與修正追蹤

本目錄保存 WCMS 各版本的弱點掃描原始報告、修正追蹤、疑似誤判佐證與正式複驗紀錄。

> [!IMPORTANT]
> 原始 AppScan／Nessus 報告是「當次掃描結果」；Markdown 追蹤文件是「後續分析與修正狀態」。不得以修改 Markdown 取代實際複掃，也不得把 Code 已修改直接寫成 Finding 已消失。

跨版本的弱掃修正模式、問題本質、修改方向與完整 Commit SHA，統一整理於：

- [`修改歷史與方針.md`](./修改歷史與方針.md)

---

## 1. 目錄規則

版本目錄採前後端版本識別，例如：

```text
03_弱掃報告/
├─ 修改歷史與方針.md
├─ FE1.2.0_BE1.2.1.0/
└─ FE1.5.3_BE1.5.2.1/
```

每一版原則上保存：

- 原始掃描 PDF／HTML。
- `README.md` 修正追蹤。
- 必要的人工覆核證據說明。
- 複掃後的新報告或結果摘要。

大型 Runtime Log、暫存 ZIP、含敏感資料的 Request Dump 不應直接無條件提交 Repository；需要保留時先做敏感資訊檢查與去識別化。

跨版本重複出現的 Finding、共用安全架構與修正方式，不在每個版本 README 重複長篇維護，改回寫 `修改歷史與方針.md`；版本 README 只保留該版實際掃描、證據與狀態。

---

## 2. Finding 狀態用語

統一使用：

| 狀態 | 定義 |
|---|---|
| 原始 Finding | Scanner 當次報告列出的結果 |
| 待分析 | 尚未完成白箱／Runtime 判斷 |
| Code mitigation 已完成 | 已有對應程式修正，但尚未正式複掃 |
| Runtime 驗證完成 | 已實際重現並取得預期結果；不代表 Scanner 已清除 |
| 疑似 False Positive | 白箱／Runtime 顯示 Scanner 漏洞名稱可能不成立，仍需證據或人工覆核 |
| 複掃通過 | 相同或更完整 Coverage 的正式複掃已確認 Finding 消失 |
| Accepted Risk | 經正式風險決策保留；必須有責任人與理由 |

禁止用「已修好」「All Clear」模糊混合 Code 與 Scanner 狀態。

---

## 3. 弱掃分析 SOP

```text
取得原始 Finding
→ 鎖定版本／Endpoint／Payload
→ 比對實際 Source Code
→ 重現 Request／Response
→ 查 Runtime Log／DB／Proxy Header
→ 分類真正漏洞、Error Handling robustness、疑似誤判
→ 修正或準備證據
→ Production-like Runtime Regression
→ 正式複掃
→ 更新版本 README
→ 若形成可重用方針，再回寫修改歷史與方針
```

### 3.1 特別注意 HTTP 500

若 Scanner 漏洞名稱疑似不正確，但特殊 Payload 可以穩定造成 500：

> 不可直接當作 False Positive 略過。

應先確認該 500 是否其實是：

- 無效 Request 應回 400。
- 資料版本／Unique Conflict 應回 409。
- Authentication／Authorization 應回 401／403。
- Rate Limit 應回 429。
- 真正未知 Server Bug 才回 500。

正式 Error Handling 設計以 [`03_後端專案架構.md`](../../01_研發與技術文件/01_系統架構/03_後端專案架構.md) 的「Auditing 與 Error Handling」章節為準；跨版本弱掃處理案例與修改方針見 [`修改歷史與方針.md`](./修改歷史與方針.md)。

---

## 4. 人工覆核證據原則

疑似 False Positive 至少準備：

- Finding ID／名稱／Severity。
- Endpoint／HTTP Method。
- Scanner Payload。
- Before／After Request／Response。
- DTO／Model／OpenAPI 型別。
- DB Schema 或 Constraint（若相關）。
- ORM／SQL 是否使用 Parameterization（若相關）。
- Runtime Log TraceId。
- 對應修正 Commit。
- 無法由 Code 證明的地方清楚標為待驗證。

不得只提供「我們用 EF Core，所以不會 SQL Injection」或「這欄是 string，所以一定不是 Overflow」等結論；應提供可重現證據。

Commit 請在 `修改歷史與方針.md` 保存完整 40 碼 Commit SHA，版本 README 可視閱讀需要同時顯示 Short SHA。

---

## 5. 複掃 Coverage 原則

複掃前先確認：

```text
Login 成功
→ Auth/Me 成功
→ XSRF 正常
→ Crawler 能進後台
→ Query / CRUD 正常
→ 重要 Spec Endpoint 可到達
```

如果 Finding 從很多筆突然變成很少，但 Login／XSRF／Host Validation 把 Scanner 擋在外面，不能判定為 All Clear。

Header 類 Finding 另需確認最外層：

```text
Browser
→ IIS / ARR
→ Node SSR
→ Backend
```

最終 Response，而非只讀 Source Code。

---

## 6. 目前版本

- [`FE1.5.3_BE1.5.2.1`](./FE1.5.3_BE1.5.2.1/README.md)：2026-08-20 HCL AppScan 360 DAST 2.1 + Tenable Nessus；2026-08-24 完成集中 Security Hardening，2026-08-25 完成第一批 ErrorHandling／Validation／FileManagement Upload Code mitigation，目前進入原 Payload Runtime Replay 與 Critical／High 人工覆核證據準備；正式 AppScan 複掃待執行。
- `FE1.2.0_BE1.2.1.0`：歷史 Authenticated AppScan 報告，目前保留作版本追溯。

後續新版本弱掃開始前，先讀本 README 與 `修改歷史與方針.md`，確認同類 Finding 是否已有 WCMS 共用處理方式，再進入該版本的個別分析。
