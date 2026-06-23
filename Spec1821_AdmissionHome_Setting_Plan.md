# Spec1821 招生首頁設定實作計劃

Status: Ready for implementation planning, not implemented  
Date: 2026-06-23  
Branch: `feature/1821-admission-home-setting`  
Source spec: `E:\workspace\project\Work-GitHub\WCMS\國立臺灣藝術大學招生資訊網首頁設定表單規格表 v1.0.docx`

## Lead

本工作是在既有 `Spec1821` 內實作「國立臺灣藝術大學招生資訊網首頁設定表單」。後端以現有 `SpecHomePage1821*` 承接 Word 規格中的 `SpecAdmissionHomeSetting*`，不另開新的 API owner；前端沿用 `src/SpecFetures/1821`，後台表單參考 1820 寫法，前台視覺延續 1821 現有首頁 section/component/CSS。

實作順序以 backend schema 為源頭：先改 model/DTO/Biz/resx，再 build，接著用既有 EF 工具產 migration，用 `GenerateSchema.bat` 產前端 contract，最後接後台表單與前台 rendering。generated files 不手改。

## 已確認決策

- 客製化功能全部放在 spec layer：
  - backend: `WCMS_Backend/SpecFeatures/Spec1821`
  - frontend: `WCMS_Frontend/src/SpecFetures/1821`
- 後端主體使用 `SpecHomePage1821*`，不新增 `SpecAdmissionHome*` API owner。
- 前端沿用 1821 現有首頁流程，不另開一套 app/route/data flow。
- 這次新功能沒有舊資料，不需要資料轉換。
- DB schema 可以異動，沿用既有 EF migration 工具產生 migration。
- 前端 DTO schema / generated contract 使用 `WCMS_Frontend\GenerateSchema.bat`。
- 後端 DB 欄位與 migration 流程使用 `WCMS_Backend\Scripts\EfUpgradeFromCurrentDbBySpec.ps1`。
- `src/types/api.d.ts` 與 `src/types/SchemaFields.ts` 只由工具生成，不手改。
- 後台功能權限仍掛 `WEB.HomePageSetting`。
- 前台連結一律走 `LangLink`。
- 前端 component 只 render；loader/hook/adapter 負責資料載入、查詢條件、JSON 解析與 view model shaping。

## 實作預設

除非後續明確反向決策，第一版照以下規則實作。

- `ModuleType` 使用 byte enum：
  - `1 = Announcement`
  - `2 = FileArchive`
- `Link` 不列入 `ModuleType`；Link 是 `IsLink=true` 的 Tab 顯示方式。
- `ModuleOptions` 與 `LinkOptions` JSON 統一為：

```json
{
  "categoryIds": "",
  "tagIds": ""
}
```

- `categoryIds` / `tagIds` 使用 comma string，貼近既有 `LibCondition` / query pattern。
- 未勾選的 category/tag 條件不帶入查詢。
- Banner、Tabs、ModuleItem 都新增或使用 `RowNo`，前台依 `RowNo ASC` 顯示。
- Section3 照 Word 規格使用 Header 固定 `Card1 / Card2`，不以 `FeatureCard` detail 作為新流程主資料。
- Word 的 `LinkTitle` / `LinkSubTitle` 沿用既有資料欄位 `Section4Title` / `Section4SubTitle`，只調整後台 display label。
- Section4 以 `WebResource` query 為主，但不引用 WebResource 內頁 list loader/component。
- 既有 `FeatureCard` / `RelatedLink` 不作為新後台表單主流程；是否移除或保留為 legacy cleanup 另案處理。
- Announcement 顯示 6 筆。
- FileArchive 顯示 5 筆。
- Section4 在 `Spec1821` 首頁 loader 內用 `WebResourceAdapter` 讀資料，查詢條件沿用既有 WebResource query pattern，不重寫 shared feature 排序語意。

## 尚需執行前確認

這些不阻擋開始寫 code，但會阻擋工具執行或 DB update。

1. backend 執行時要切 `SpecCode=Spec1821`，或用 build/run 參數臨時指定。
2. frontend 執行時要切 `VITE_SPEC_CODE=1821`。
3. `EfUpgradeFromCurrentDbBySpec.ps1` 本次要先選定執行模式：
   - 只產 SQL：使用 `-GenerateSqlOnly`
   - 產 EF migration：使用工具的標準 migration flow
   - 更新 local DB：只在確認目標 DB 後執行
4. 若要 update DB，需確認目標 DB 的 `SysDbProfile.SpecCode` 為 `Spec1821`。

## 不做範圍

- 不改 `SiteMenu` 作為前台 route source of truth 的原則。
- 不改 shared `Announcement`、`FileArchive`、`WebResource` 的核心資料語意。
- 不把 Spec1821 特規寫進 shared `Features` 或 `SysCore`。
- 不改 auth、JWT、XSRF、`LibApiController`、FileManagement 儲存或下載語意。
- 不新增、移除或升級套件。
- 不碰 IIS、production appsettings、Docker、deploy script。
- 不手動改 generated contract、migration snapshot 或 DB。

## Word 規格對照

### Header

Word: `SpecAdmissionHomeSetting`  
實作 owner: `SpecHomePage1821Model`

| Word 欄位 | 實作欄位 | 狀態 | 備註 |
| --- | --- | --- | --- |
| `HomePageId` | `HomePageId` | existing | Header key |
| `Lang` | `Lang` | existing | 一語系一筆 |
| `Card1_Title` | `Card1Title` | new | Section3 固定卡 1 標題 |
| `Card1_PicId` | `Card1PicId` | new | Section3 固定卡 1 圖片 |
| `Card2_Title` | `Card2Title` | new | Section3 固定卡 2 標題 |
| `Card2_PicId` | `Card2PicId` | new | Section3 固定卡 2 圖片 |
| `LinkTitle` | `Section4Title` | existing | 沿用既有欄位名，display label 對應 Word |
| `LinkSubTitle` | `Section4SubTitle` | existing | 沿用既有欄位名，display label 對應 Word |
| `LinkOptions` | `LinkOptions` | new | JSON `{ categoryIds, tagIds }` |
| `LinkViewMore` | `LinkViewMore` | new | `LangLink` render |

命名原則：Section title 類欄位優先沿用既有 `Section*Title` 命名，避免新增語意重複的 DB/DTO 欄位；Word 欄位名透過 mapping 與 resx/display label 對應。

### Detail: Section1 Banner

Word: `SpecAdmissionHomeBanner`  
實作 owner: `SpecHomePage1821_Banner`

| Word 欄位 | 實作欄位 | 狀態 | 備註 |
| --- | --- | --- | --- |
| `HomePageId` | `HomePageId` | existing | Header FK |
| `RowId` | `RowId` | existing | row key |
| `RowNo` | `RowNo` | new | 前台排序 |
| `PictureId` | `BannerFileId` | existing | 沿用現有命名 |
| `AltText` | `BannerFileDescription` | existing | display label 對應替代文字 |
| `LinkUrl` | `Link` | existing | `LangLink` render |

既有 `Title` / `SubTitle` 可保留，但新後台表單不必作為 Word 必填欄位。前台 alt fallback 順序：`BannerFileDescription` -> `Title` -> safe fallback。

### Detail: Section2 Tabs

Word: `SpecAdmissionHomeTabs`  
實作 owner: `SpecHomePage1821_Shortcut`

| Word 欄位 | 實作欄位 | 狀態 | 備註 |
| --- | --- | --- | --- |
| `HomePageId` | `HomePageId` | existing | Header FK |
| `RowId` | `RowId` | existing | row key |
| `RowNo` | `RowNo` | new | Tab 顯示排序 |
| `IconId` | `IconFileId` | existing | 沿用現有命名 |
| `IconTitle` | `Title` | existing | display label 對應功能標題 |
| `IconSubTitle` | `SubTitle` | existing | display label 對應功能說明 |
| `IsLink` | `IsLink` | new | `true` 時走 Link Tab |
| `LinkUrl` | `Link` | existing | `IsLink=true` 時必填 |
| `LinkPicId` | `LinkPicId` | new | `IsLink=true` 時必填 |
| Link picture alt | `Title` | existing | Word 指定取 IconTitle |

既有 `ActionType` / `ActionValue` 不作為本規格主流程。

### SubDetail: Section2 ModuleItem

Word: `SpecAdmissionHomeTabsModuleItem`  
實作 owner: `SpecHomePage1821_ShortcutModuleItem`

| Word 欄位 | 實作欄位 | 狀態 | 備註 |
| --- | --- | --- | --- |
| `HomePageId` | `HomePageId` | new | Header FK |
| `ParentRowId` | `ParentRowId` | new | 對應 Tab `RowId` |
| `RowId` | `RowId` | new | row key |
| `RowNo` | `RowNo` | new | 同一 Tab 內排序 |
| `Title` | `Title` | new | module 標題 |
| `SubTitle` | `SubTitle` | new | module 副標 |
| `ModuleType` | `ModuleType` | new | `1=Announcement`, `2=FileArchive` |
| `ModuleOptions` | `ModuleOptions` | new | JSON `{ categoryIds, tagIds }` |
| `MoreViewLink` | `MoreViewLink` | new | `LangLink` render |
| `IsHide` | `IsHide` | new | 專案一致性欄位 |

### Section3 Cards

Word 指定 Section3 是 Header 固定兩組 `Card1 / Card2`，不是多筆 detail。第一版以前台與後台都吃 Header 欄位為準。

既有 `SpecHomePage1821_FeatureCard`：
- 第一版不作為新表單主資料。
- 不在本任務主動 drop，避免 migration 包含不必要清理。
- 若要移除 legacy detail，另開 cleanup slice。

### Section4 Links

Word 指定 Section4 由 Header `LinkOptions` 查 `WebResource`，並使用 `LinkViewMore`。

實作結論：
- 不直接引用 `Client_WebResource_List_Loader` 或 `Client_WebResource_List_Comp`。
- `Spec1821` 首頁 loader 自己解析 `LinkOptions`，組出 Section4 專用 `QueryListParam`。
- API 入口複用 `WebResourceAdapter`，不複用內頁列表的搜尋列、分頁、grid props、category map、Style 流程。
- 查詢語意沿用 WebResource 內頁既有規則：語系、上架排除、category/tag、置頂 RankGroups、排序。
- Section4 component 只吃首頁整理好的 view model，負責 render Picture / Title / Url / More View。

| Word 欄位 | 實作欄位 | 狀態 | 備註 |
| --- | --- | --- | --- |
| `LinkTitle` | `Section4Title` | existing | 沿用既有欄位名，後台 label 對應規格 |
| `LinkSubTitle` | `Section4SubTitle` | existing | 沿用既有欄位名，後台 label 對應規格 |
| `LinkOptions` | `LinkOptions` | new | JSON `{ categoryIds, tagIds }` |
| `LinkViewMore` | `LinkViewMore` | new | More View button |
| WebResource result | existing WebResource DTO | shared | 顯示 Picture / Title / Url |

既有 `SpecHomePage1821_RelatedLink`：
- 第一版不作為新表單主資料。
- 不在本任務主動 drop。
- 若需要向下相容，可以在前台作 fallback；因本案無舊資料，fallback 不是必需。

## Backend Plan

### Files

- `WCMS_Backend/SpecFeatures/Spec1821/WEB/SpecHomePage/SpecHomePage1821_Model.cs`
- `WCMS_Backend/SpecFeatures/Spec1821/WEB/SpecHomePage/SpecHomePage1821_DTO.cs`
- `WCMS_Backend/SpecFeatures/Spec1821/WEB/SpecHomePage/SpecHomePage1821_Biz.cs`
- `WCMS_Backend/SpecFeatures/Spec1821/_Resx/SpecModelDisplayName.cs`
- `WCMS_Backend/SpecFeatures/Spec1821/_Resx/SpecModelDisplayName.zh-TW.resx`
- `WCMS_Backend/SpecFeatures/Spec1821/_Resx/SpecModelDisplayName.en.resx`

### Model Changes

`SpecHomePage1821Set`：
- Add `List<SpecHomePage1821_ShortcutModuleItem> SpecHomePage1821_ShortcutModuleItem`.
- Keep existing Banner/Shortcut/FeatureCard/RelatedLink collections unless a cleanup slice is approved.

`SpecHomePage1821Model`：
- Add Card1/Card2 fields.
- Add `LinkOptions`.
- Add `LinkViewMore`.
- Keep existing `Section4Title` / `Section4SubTitle` for Word `LinkTitle` / `LinkSubTitle`; do not add duplicate title fields.

`SpecHomePage1821_Banner`：
- Add `RowNo`.
- Reuse `BannerFileId`, `BannerFileDescription`, `Link`.

`SpecHomePage1821_Shortcut`：
- Add `RowNo`.
- Add `IsLink`.
- Add `LinkPicId`.
- Add `LinkPicDescription` only if backend/admin needs an explicit editable fallback; otherwise LinkPic alt uses `Title`.

`SpecHomePage1821_ShortcutModuleItem`：
- Add entity with `HomePageId`, `ParentRowId`, `RowId`, `RowNo`, `Title`, `SubTitle`, `ModuleType`, `ModuleOptions`, `MoreViewLink`, `IsHide`.
- Relationship: `HomePageId + ParentRowId` points to `SpecHomePage1821_Shortcut`.

### DTO Changes

DTO mirrors model order:
1. Set
2. Header
3. Banner
4. Shortcut
5. ShortcutModuleItem
6. legacy FeatureCard if retained
7. legacy RelatedLink if retained

Do not put helper logic in DTO files.

### Biz Rules

`IsLink=true`:
- `Link` required.
- `LinkPicId` required.
- ModuleItems under that Tab are cleared or rejected before save. Prefer Biz normalization plus validation message if UI sends conflicting data.

`IsLink=false`:
- `Link` and `LinkPicId` cleared before save.
- At least one visible ModuleItem required.

ModuleItem:
- `ModuleType` must be `1` or `2`.
- `ModuleOptions` must parse as JSON.
- Empty `categoryIds` / `tagIds` means condition is not applied.
- `MoreViewLink` required by Word spec.

Row order:
- `RowNo` required for Banner/Tabs/ModuleItem.
- If admin sends empty RowNo, Biz may normalize by current row order to avoid broken rendering.

URL:
- URL fields are validated in Biz.
- Frontend still renders through `LangLink`.

### Backend Verification

```powershell
dotnet restore .\WCMS_Backend\WCMS.sln
dotnet build .\WCMS_Backend\WCMS.sln -c Debug --no-restore
dotnet build .\WCMS_Backend\WCMS.csproj -c Debug /p:SpecCode=Spec1821 /p:UseSpecCodeCompile=true
```

## Migration And Contract Flow

### EF Migration

Run only after backend schema builds successfully.

Recommended first pass:

```powershell
.\WCMS_Backend\Scripts\EfUpgradeFromCurrentDbBySpec.ps1 -GenerateSqlOnly
```

Before running:
- Confirm backend config/build target is `Spec1821`.
- Confirm target DB `SysDbProfile.SpecCode` is `Spec1821`.
- Do not use `-SkipDbSpecCodeCheck` unless this is the first migration that creates `SysDbProfile`.

### Generated Frontend Contract

Run only after backend starts successfully with `Spec1821`.

```powershell
.\WCMS_Frontend\GenerateSchema.bat
```

Optional Swagger URL:

```powershell
.\WCMS_Frontend\GenerateSchema.bat https://localhost:7030/swagger/v1/swagger.json
```

Inspect generated diff:
- `SpecHomePage1821Set_DTO`
- `SpecHomePage1821Model_DTO`
- `SpecHomePage1821_Banner_DTO`
- `SpecHomePage1821_Shortcut_DTO`
- `SpecHomePage1821_ShortcutModuleItem_DTO`
- `PGID.SpecHomePage1821Api`
- No unexpected churn in unrelated specs.

## Frontend Admin Plan

### Files

Use 1820 naming style under the 1821 path:

```text
WCMS_Frontend/src/SpecFetures/1821/Pages/Server/BizFunc/WEB/HomePageSetting/
  Server_HomePageSetting_Form_Comp.tsx
  Server_HomePageSetting_Form_Hook.ts
```

Route extension:

```text
WCMS_Frontend/src/SpecFetures/1821/Pages/Server/Scaffold/ServerModuleRoutesExtData.tsx
```

### Reuse Targets

- `Server_FormTemplate_Comp`
- `Server_FormTemplate_Hook`
- `TabContentComp`
- `EditGrid`
- `useEditGridBinding`
- `useSetTableField`
- `useUploadFile`
- `LibTextBox`
- `LibCheckBox`
- existing select/options field patterns
- `LoadingErrorHandler`
- `SpecHomePage1821Adapter`

### Shared Local Helpers

Keep helpers local to 1821 HomePageSetting unless they become broadly reusable.

- Image upload/edit-grid renderer:
  - Banner picture
  - Tab icon
  - Link picture
  - Card picture
- `OptionsEditor`:
  - edits `{ categoryIds, tagIds }`
  - reused by `ModuleOptions` and `LinkOptions`
- URL field helper:
  - shared label/validation wiring for `Link`, `MoreViewLink`, `LinkViewMore`
- Module type editor:
  - only Announcement/FileArchive in first version
- Row order helper:
  - one RowNo editor/normalizer pattern across Banner/Tabs/ModuleItem

### Form Structure

Outer tabs:
- one tab per supported language.

Inner section tabs:
1. Banner
2. Tabs
3. Module Items
4. Cards
5. Links

Section fields:
- Banner: RowNo, Picture, AltText, LinkUrl, IsHide.
- Tabs: RowNo, Icon, IconTitle, IconSubTitle, IsLink, LinkUrl, LinkPicId, IsHide.
- Module Items: Parent Tab, RowNo, Title, SubTitle, ModuleType, ModuleOptions, MoreViewLink, IsHide.
- Cards: Card1Title, Card1PicId, Card2Title, Card2PicId.
- Links: Section4Title, Section4SubTitle, LinkOptions, LinkViewMore.

UI behavior:
- When `IsLink=true`, hide or disable ModuleItem editing for that Tab.
- When `IsLink=false`, hide or disable LinkPic fields.
- Biz remains the final guard even if UI normalizes values.

## Frontend Client Plan

### Files

- `WCMS_Frontend/src/SpecFetures/1821/Hooks/WEB/HomePage_Api.ts`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/HomePage_Loader.ts`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/HomePage.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section1.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section2.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section2_AnnouncementModule.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section2_FileArchiveModule.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section2_LinkPanel.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section2_Types.ts`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section3.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Index/Section/Section4.tsx`
- `WCMS_Frontend/src/SpecFetures/1821/Assets/Client/Spec/Spec1821_Home.css`
- `WCMS_Frontend/src/SpecFetures/1821/Pages/Client/Scaffold/MainFrame/Header.tsx` only for integration check unless a bug is found.

### Loader Responsibilities

`HomePage_Loader.ts` owns:
- resolving language.
- loading homepage set.
- sorting Banner/Tabs/ModuleItem by `RowNo`.
- filtering `IsHide`.
- parsing `ModuleOptions` and `LinkOptions`.
- building Announcement query.
- building FileArchive query.
- building Section4 WebResource query through `WebResourceAdapter`.
- shaping data into section view models.

Components do not:
- parse JSON.
- build backend conditions.
- call module APIs directly.
- import WebResource inner-page loader/component.
- decide shared module sorting rules.

### Section Rendering

Section1 Banner:
- Uses Banner detail.
- Image source from FileManagement preview URL.
- Link uses `LangLink`.
- Alt fallback: `BannerFileDescription` -> `Title` -> safe fallback.

Section2 Tabs:
- Renders Tab buttons from Shortcut rows.
- `IsLink=true` renders Link panel with `LinkPicId`.
- `IsLink=false` renders ModuleItems.
- Announcement module shows 6 rows.
- FileArchive module shows 5 rows.
- `MoreViewLink` uses `LangLink`.
- Active tab initial state must be deterministic.

Section3 Cards:
- Renders Header fixed Card1/Card2.
- Does not depend on `FeatureCard` detail in the new flow.

Section4 Links:
- Renders Header title/subtitle.
- Loads WebResource by `LinkOptions`.
- Uses `WebResourceAdapter` from the homepage loader; does not mount the WebResource inner-page list flow.
- Displays Picture / Title / Url.
- Applies existing WebResource rank/order pattern.
- `LinkViewMore` uses `LangLink`.

### SSR And AA Checks

- No random IDs in initial render.
- No browser-only API during render.
- Tabs need keyboard/focus behavior.
- Banner controls need accessible labels.
- Images always have alt fallback.
- External links must follow existing `LangLink` behavior.

## Code Organization Rules

Use newspaper-style order in every touched file.

Backend:
- Set/header/detail classes first.
- Public Biz flow first.
- Validation helpers below public flow.
- JSON parse and low-level helpers last.

Frontend admin:
- exported form component first.
- language tab flow before section details.
- section components in display order.
- grid column factories near their section.
- shared local helpers lower in file or hook.

Frontend client:
- exported Section component first.
- visual subcomponents next.
- item renderers next.
- small helpers last.

CSS:
- keep `spec1821-*` namespace.
- group by Section1 -> Section2 -> Section3 -> Section4.
- do not reorder unrelated legacy CSS.

## Execution Order

1. Update backend model/DTO/resx/Biz.
2. Build backend normally and with `SpecCode=Spec1821`.
3. Generate migration/SQL using `EfUpgradeFromCurrentDbBySpec.ps1`.
4. Start backend with `Spec1821`.
5. Generate frontend contract using `GenerateSchema.bat`.
6. Inspect generated diffs.
7. Implement 1821 backend admin route/form/hook.
8. Implement frontend loader query composition.
9. Implement Section1-4 component updates.
10. Update `Spec1821_Home.css` only where layout requires.
11. Run frontend typecheck/check/build.
12. Browser smoke desktop/mobile and AA basics.

## Verification Matrix

Docs-only:

```powershell
git diff --check
```

Backend:

```powershell
dotnet restore .\WCMS_Backend\WCMS.sln
dotnet build .\WCMS_Backend\WCMS.sln -c Debug --no-restore
dotnet build .\WCMS_Backend\WCMS.csproj -c Debug /p:SpecCode=Spec1821 /p:UseSpecCodeCompile=true
```

Migration:

```powershell
.\WCMS_Backend\Scripts\EfUpgradeFromCurrentDbBySpec.ps1 -GenerateSqlOnly
```

Generated contract:

```powershell
.\WCMS_Frontend\GenerateSchema.bat
```

Frontend:

```powershell
Set-Location .\WCMS_Frontend
npm run typecheck
npm run check
npm run build
```

Manual smoke:
- 後台 WebManagement can open 1821 HomePageSetting.
- Language tabs load and save independently.
- Banner/Tabs/ModuleItem/Cards/Links save and reload.
- `IsLink=true` clears or blocks ModuleItems.
- `IsLink=false` clears Link fields and requires ModuleItem.
- Frontend Section1-4 SSR render.
- Announcement shows 6 items.
- FileArchive shows 5 items.
- Section4 WebResource links render with More View.
- Mobile/desktop text does not overlap.
- Image alt, `LangLink`, tabs keyboard/focus do not regress.

## Risk Register

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Wrong `SpecCode` | EF/API/generated contract targets wrong spec | Build/run with explicit `Spec1821`, preserve DB SpecCode check |
| Generated contract not refreshed | frontend typecheck fails | Run `GenerateSchema.bat` after backend schema and startup |
| Hand-edit generated files | next generation overwrites manual fixes | Change backend source schema, then regenerate |
| Section3 implemented as detail | Word requirement mismatch | Use Header Card1/Card2 for new flow |
| Missing `RowNo` | Word sorting requirement not met | Add RowNo to Banner/Tabs/ModuleItem |
| ModuleOptions drift | backend/admin/frontend parse different shapes | Single JSON schema and shared local OptionsEditor |
| Shared feature pollution | other specs regress | Keep query composition in 1821 loader/helpers |
| SSR/CSR mismatch | hydration warnings or broken UI | deterministic initial tab, no render-time browser API |
| DB migration wrong target | schema/data risk | Use script checks, confirm target before update |
| Premature tool execution | empty diff or stale contract | Run tools only after backend schema builds |

## Implementation Checklist

- [ ] Apply backend schema changes.
- [ ] Add backend display names.
- [ ] Add backend Biz validation and normalization.
- [ ] Backend build passes.
- [ ] Spec1821 backend build passes.
- [ ] Run migration tool in selected mode.
- [ ] Start backend with Spec1821.
- [ ] Run `GenerateSchema.bat`.
- [ ] Inspect generated contract diff.
- [ ] Add 1821 server route extension.
- [ ] Add 1821 admin form hook.
- [ ] Add 1821 admin form component.
- [ ] Add shared local image renderer.
- [ ] Add shared local OptionsEditor.
- [ ] Extend frontend loader.
- [ ] Add Section2 module components.
- [ ] Convert Section3 to Header Card1/Card2.
- [ ] Convert Section4 to WebResource query result.
- [ ] Update scoped CSS.
- [ ] Run frontend typecheck/check/build.
- [ ] Browser smoke desktop/mobile.
- [ ] AA basics pass.
