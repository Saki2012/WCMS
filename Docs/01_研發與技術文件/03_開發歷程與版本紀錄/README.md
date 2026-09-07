# 開發歷程與版本紀錄

本目錄保存 WCMS 在 RD、PR 與 Release 階段使用的改善紀錄、架構待辦及特定時間點快照。

> [!IMPORTANT]
> 本目錄不是第二套正式架構規範。正式設計仍以 `Docs/01_研發與技術文件/01_系統架構/` 與開發規範為準；待辦、複驗與收斂狀態仍依 GitHub Issue、QA 生命週期與最新整合收斂管理資料判斷。

## `01_開發歷程優化表.csv`

此 CSV 是可由 GitHub 逐行追蹤、並供 AI 整理的開發改善母表。

- 一般開發階段新增紀錄時，版本號可先留空。
- 準備合併至 `Feature/Release` 時，再依實際發布版本補上版本號。
- 細小 Bug、純內部重構或不影響使用者的技術調整，是否納入對外說明應依實際影響判斷。
- 對外版本說明應再核對 Release PR、Issue、Commit 與實際驗證結果。

## `02_WCMS_整合收斂管理表.xlsx`

此檔案僅作為 GitHub 內保存的特定時間點快照，不是最新狀態的唯一來源。

待辦、複驗與收斂狀態仍以 Google Sheet「WCMS_整合收斂管理表」最新內容為準；使用本檔案前必須確認匯出日期與適用範圍。

## `03_待處理架構性_前端.md`

保存前端尚未完成架構收斂、但不應繼續留在舊 Word Roadmap 的事項。

2026-09-07 起依目前 Release／QA 階段重新整理為：

- P0：ApiResponse／Schema／Error Contract、RequireAuth 錯誤分類。
- P1：I18n／Resx／Routing、Form Template、SSR／AA／Runtime、環境參數、Client Cache／Race。
- P2：REST → GraphQL 等不阻塞目前交付的長期架構方向。

單一 UI／RWD／文字或功能 Bug 不重複寫入本文件，仍由 GitHub Issue 與 QA 流程追蹤。

## `04_待處理架構性_後端.md`

保存後端共用契約、資料完整性、Auditing、Cache、UTC、Concurrency 與長期治理待辦。

2026-09-07 起依目前 Release／QA 階段重新整理為：

- P0：API Error／Response Contract、FeatureDriver ReadOnly／System-owned Field Enforcement、FileManagement 資料完整性。
- P1：OperateLog／Tracing、Cache Eviction、UTC／Date-only、Security Runtime／複掃等會被 Bug 或 Release 風險觸發的議題。
- P2：Data ChangeLog、Distributed Atomicity、Setup／Runtime Handler 純整理等不阻塞目前 Bug 收斂的技術債。

## 舊 Word Roadmap 的定位

歷史 Word／Office Roadmap 可保留作為當時開發快照，但不再作為目前架構待辦母表。

若 Word 中的寬泛項目已由正式架構、Issue、品質流程或本目錄的架構待辦接手，可以自 Word 待辦移除；「自 Word 移除」只代表停止維護重複清單，不代表該議題已完成。

目前開發主線以：

```text
QA / Release 問題
→ RD 修正
→ AI 白箱 Gate
→ Hotfix / Release
→ QA 環境部署
→ QA 複驗
```

為優先；不直接阻塞交付的大型架構重構保留於前後端架構待辦，待共用風險、Issue 或後續里程碑觸發時再處理。
