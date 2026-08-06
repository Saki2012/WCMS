# 品質與驗證文件

本目錄保存用來確認 WCMS 是否符合架構、規範、功能、無障礙與資安要求的資料。

本分類不專屬 QA，RD、QA、無障礙檢測、資安檢測與 Release 驗收都可共同使用。

## 目前目錄

- [`01_AI白箱檢測`](./01_AI白箱檢測/)：保存由 RD 發起與判定、AI 協助分析的白箱檢測流程與規範，包含需求與單元檢測、專項檢測、全專案白箱回歸檢測，以及 Freego 無法單獨判定的 AA 人工檢測反饋案例。
- [`02_QA測試`](./02_QA測試/)：保存 QA／RD／AI 協作、Issue 開單分流、修正交付、版本追蹤、Hotfix 部署、QA 複驗及回歸測項沉澱流程。

## 正式流程版本

### AI 白箱檢測

- 文件版本：`Version 1.0`
- Rule Registry：`0.2.0`
- 狀態：第一版正式流程，可於 RD／PR 階段使用。

正式入口：[`01_AI白箱檢測/README.md`](./01_AI白箱檢測/README.md)

### QA 開單與驗證生命週期

- Document ID：`WCMS-QA-GOV-001`
- Version：`1.0.0`
- Status：`active`
- 狀態：第一版正式流程，可用於 QA 開單、RD 修正、Hotfix、部署與複驗。

正式入口：[`01_WCMS_QA_RD_AI協作與開單驗證生命週期.md`](./02_QA測試/01_WCMS_QA_RD_AI協作與開單驗證生命週期.md)

## 目前落地邊界

目前已建立 AI 白箱第一版流程、QA 生命週期第一版流程、QA Bug／Feature Story Issue Form，以及部分 GitHub Project 欄位同步 Workflow。

下列項目仍依正式流程分階段落地，不得描述成已全面完成：

- AI 自動開單或關單。
- 完整 CI 品質 Gate。
- `Found In`、`Fixed By`、`Fixed In`、`Deployed In`、`Verified In` 的 GitHub 欄位與自動同步。
- QA 複驗固定格式及 Project 完整狀態流轉。
- 回歸測項清冊與所有專項 Rule。

## 分類原則

- [`01_研發與技術文件`](../01_研發與技術文件/) 定義系統應如何設計與開發。
- 本目錄保存檢查實際程式與功能是否符合技術規範及專案要求的策略、規則、流程與結果。
- [`02_專案與交付文件`](../02_專案與交付文件/) 保存整理後提供 PM、客服、主管或客戶閱讀的正式版本。
- 同一主題可同時包含 Markdown、Word、PowerPoint、Excel 或 PDF；應依主題與用途分類，不依副檔名拆散。
- 正式流程與規則以有效 Markdown 或 Rule Registry 為準；Office／PDF 主要作為簡報、固定版輸出或歷史資料。

## 維護原則

- 流程、責任、版本欄位或狀態調整時，優先更新正式 Markdown。
- Issue Template、Project 欄位、Workflow 或 Release 規則調整時，必須同步核對 QA 生命週期文件。
- 白箱規則調整時，必須同步核對白箱 README、檢測模式與 `RULE_REGISTRY.yml`。
- 未實際執行的 Build、QA、AA、Freego、弱點掃描、部署或實機驗證，不得描述為已通過。
