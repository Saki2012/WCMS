# WCMS QA 測試文件

本目錄保存 WCMS QA、RD 與 AI 協作、Issue 開單、修正交付、版本追蹤、Hotfix 部署及 QA 複驗相關文件。

## 正式流程文件

### `01_WCMS_QA_RD_AI協作與開單驗證生命週期.md`

WCMS QA 流程的主要維護文件。

目前正式版本：

- Document ID：`WCMS-QA-GOV-001`
- Version：`1.0.0`
- Status：`active`

主要涵蓋：

- Feature Release 與 QA 探索式驗證。
- QA 開單前的 AI Issue 歷史比對。
- 新開、補充、Reopen 與 Regression 分流。
- RD Branch、Commit、PR 與修正流程。
- RD 修正後的 AI 白箱檢驗。
- Feature Release Hotfix 與部署紀錄。
- `Found In`、`Fixed By`、`Fixed In`、`Deployed In`、`Verified In` 版本鏈。
- QA 複驗、Issue 關閉及回歸測項沉澱。

流程、角色、責任或版本規則如有調整，應優先更新此 Markdown。

## Generate Documents

`Generate Documents/` 保存依 QA 流程內容產生的 PPTX、DOCX、PDF 或其他報告文件。

目前目錄中的三份 v0.1 文件為前期協作與測試方向資料：

- `01_WCMS_QA_RD_AI協作簡報_詳細版_v0.1.pptx`
- `02_Issue與開單流程規範說明_v0.1.pptx`
- `03_WCMS_測試方向與檢查重點_v0.1.docx`

這些文件早於正式 Markdown v1.0.0，尚未完整包含後續新增的版本鏈、Hotfix、AI 歷史比對責任與 AI 白箱 Gate。

未來重新產生 PPTX、DOCX 或 PDF 時，內容應以正式 Markdown 指定版本及 Git Commit 為準。

## 目前落地狀態

目前已建立：

- QA Bug Issue Form。
- Feature／Story Issue Form。
- 部分 GitHub Project 欄位同步 Workflow。
- QA 探索式測試及實際 Issue 開單。
- RD Commit／PR 與 Issue 的部分關聯流程。
- AI 白箱檢測第一版規範。

Issue Template、Project 狀態、版本欄位、QA 複驗格式及 Workflow 自動化，將依正式流程文件分階段落地。