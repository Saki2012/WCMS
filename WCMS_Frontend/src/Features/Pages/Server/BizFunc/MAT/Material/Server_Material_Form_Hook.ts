import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridCellValue,
    EditGridCellValueChangeArgs,
    EditGridCellValueChangeHandler,
    EditGridCellValueChangeResult,
    EditGridFileValue,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridStringCellValue,
    getSelectedEditGridFile,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, DefaultLang, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    CategoryFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    MaterialLangInfoFields,
    MaterialPictureFields,
    MaterialSetFields,
    PGID,
} from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type MaterialSet = components["schemas"]["MaterialSet_DTO"];

type MaterialLangInfo = components["schemas"]["MaterialLangInfo_DTO"];

type MaterialPicture = components["schemas"]["MaterialPicture_DTO"];

type MaterialTags = components["schemas"]["MaterialTags_DTO"];

type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];

type InfoField = components["schemas"]["MatCategoryInfoField_DTO"];

type InfoFieldDisplay = components["schemas"]["MatCategoryInfoFieldDisplay_DTO"];

type FileManage = components["schemas"]["FileManageModel_DTO"];

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

type MaterialInfoJson = Record<string, string>;

export type MaterialRowKeyValue = string | number | null | undefined;

export type MaterialRowKeys = Record<string, MaterialRowKeyValue>;

interface InfoFieldKeySource extends InfoField
{
    Field?: string | null;
    FieldKey?: string | null;
    FieldName?: string | null;
}

interface InfoFieldWithDisplay extends InfoField
{
    _MatCategoryInfoFieldDisplay?: InfoFieldDisplay[] | null;
    MatCategoryInfoFieldDisplay?: InfoFieldDisplay[] | null;
}

interface MatCategorySetLike extends MatCategorySet
{
    MatCategoryInfoField?: InfoFieldWithDisplay[] | null;
    MatCategoryInfoFieldDisplay?: InfoFieldDisplay[] | null;
}

export interface UseMaterialFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: MaterialSet;

    /** Form Template 標準動作設定 */
    actionsOpt: MaterialFormActionsOpt;
}

export interface UseMaterialLangTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;

    /** 物件動態欄位定義 */
    infoFields: InfoField[];

    /** 物件動態欄位顯示名稱 */
    infoFieldDisplays: InfoFieldDisplay[];
}

export interface UseMaterialPictureEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MaterialSet>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 圖片預覽渲染，畫面職責留在 Comp */
    renderPicturePreview: (args: EditGridCellRenderArgs) => ReactNode;
}

export interface UseMaterialBatchPictureUploadOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MaterialSet>;
}

export interface UseMaterialTagSelectionOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<MaterialSet>;
}

export interface MaterialLangTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: MaterialLangInfo;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: MaterialRowKeys;

    /** 動態欄位顯示設定 */
    infoItems: MaterialInfoFieldItem[];
}

export interface MaterialInfoFieldItem
{
    /** JSON 欄位 key */
    field: string;

    /** 畫面顯示標題 */
    title: string;
}

export interface MaterialLangTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: MaterialLangTabItem[];
}

export interface MaterialPictureCellValue extends EditGridFileValue
{
    /** 上傳後回傳的圖片 internalId */
    internalId?: string;

    /** 使用者選取時的原始檔名 */
    originalFileName?: string;
}

export interface MaterialPictureGridRow extends GridRow
{
    /** 物件代號 */
    MaterialId?: string | null;

    /** 保留後端 Picture 顯示資料 */
    Picture?: FileManage | null;
}

export interface MaterialUploadedPicture
{
    /** 上傳後回傳的檔案 internalId */
    internalId: string;

    /** 使用者上傳時的原始檔名 */
    originalFileName: string;

    /** 不含副檔名的預設圖片名稱 */
    title: string;
}

export interface MaterialBatchPictureUploadResult
{
    /** 使用者選取的批次檔案 */
    selectedFiles: File[];

    /** 是否正在批次上傳 */
    isUploading: boolean;

    /** 批次上傳錯誤 */
    error: string | null;

    /** 批次選檔 */
    setSelectedFiles: (files: File[]) => void;

    /** 清除批次選檔 */
    clearSelectedFiles: () => void;

    /** 上傳並新增物件照片資料 */
    uploadSelectedFiles: () => Promise<void>;
}

export interface MaterialTagSelectionResult
{
    /** 目前已選標籤 Id */
    selectedTagIds: string[];

    /** 標籤勾選異動 */
    onChange: (value: unknown) => void;
}

export type MaterialFormRefs = {
    /** 物件類別選項 */
    categoryMap: Record<string, string>;
    /** 物件標籤選項 */
    tagMap: Record<string, string>;
    /** 物件動態欄位定義 */
    infoFields: InfoField[];
    /** 物件動態欄位顯示名稱 */
    infoFieldDisplays: InfoFieldDisplay[];
};
export interface MaterialPreviewPayload
{
    /** 物件預覽主資料。 */
    formData: MaterialSet;
    /** 物件分類顯示文字。 */
    categoryNameText: string;
    /** 物件標籤顯示文字。 */
    tagNameText: string;
    /** 動態規格欄位顯示名稱。 */
    matCateInfoFieldsMap: Record<string, string>;
}

export type MaterialFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;

    /** 以目前 DTO 觸發 preview（由 Component 決定怎麼開 modal） */
    onPreviewFromDto: (payload: MaterialPreviewPayload) => void;
};

export type MaterialFormAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const materialEmptyData: MaterialSet = { Material: {}, MaterialLangInfo: [], MaterialPicture: [], MaterialTags: [] };

/** 建立 Material Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useMaterialFormTemplate = (
    opt: UseMaterialFormTemplateOptions,
): ServerFormTemplate<MaterialSet, MaterialFormAdapter, MaterialFormRefs, ServerFormDefaultRawData<MaterialSet, MaterialFormRefs>, MaterialFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "Material",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildMaterialFormAdapter,
                selectDataAdapter: adapter => adapter.Material,
                buildTitle: buildMaterialFormTitle,
                buildInitialData: buildMaterialInitialData,
                useReferenceData: ctx => useMaterialReferenceData({ ...ctx, lang: opt.lang }),
                buildActions: buildMaterialActions,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立物件語系 Tabs 與動態欄位顯示資料，避免 Comp 處理語系排序。 */
export const useMaterialLangTabs = (opt: UseMaterialLangTabsOptions): MaterialLangTabsResult =>
{
    const details = opt.binding.data?.MaterialLangInfo;

    return useMemo(() =>
    {
        return buildMaterialLangTabs(details ?? [], opt.lang, opt.infoFields, opt.infoFieldDisplays);
    }, [details, opt.infoFields, opt.infoFieldDisplays, opt.lang]);
};

/** 建立物件相片 EditGrid binding，Comp 只需掛載 EditGrid 與提供預覽 render。 */
export const useMaterialPictureEditGrid = (opt: UseMaterialPictureEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildMaterialPictureColumns(displayName), [displayName]);
    const handlePictureValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadMaterialPictureValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<MaterialSet, MaterialPicture, MaterialPictureGridRow>({
        binding: opt.binding,
        emptyData: materialEmptyData,
        collectionName: MaterialSetFields.MaterialPicture,
        columns,
        getItemRowId: picture => picture.RowId,
        sortItems: sortMaterialPictures,
        createItem: ctx => buildNewMaterialPictureItem(ctx.data, ctx.nextRowId),
        toRow: (picture, index) => buildMaterialPictureGridRow(picture, index, opt, handlePictureValueChange, displayName),
        toItem: (row, index, ctx) => toMaterialPictureDto(ctx.data, row, index),
        editGridProps: buildMaterialPictureGridProps(opt.style, displayName),
    });
};

/** 批次上傳物件相片，和 EditGrid 單筆新增按鈕分離，保留後續特殊處理空間。 */
export const useMaterialBatchPictureUpload = (opt: UseMaterialBatchPictureUploadOptions): MaterialBatchPictureUploadResult =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearSelectedFiles = useCallback(() => setSelectedFiles([]), []);
    const uploadSelectedFiles = useCallback(async () =>
    {
        await uploadMaterialBatchFiles({
            binding: opt.binding,
            files: selectedFiles,
            uploadFile: uploadFile.handleFileChange,
            setError,
            setIsUploading,
            clearSelectedFiles,
        });
    }, [clearSelectedFiles, opt.binding, selectedFiles, uploadFile.handleFileChange]);

    return { selectedFiles, isUploading, error, setSelectedFiles, clearSelectedFiles, uploadSelectedFiles };
};

/** 建立標籤勾選資料與更新行為，避免 Comp 自行操作 MaterialTags DTO。 */
export const useMaterialTagSelection = (opt: UseMaterialTagSelectionOptions): MaterialTagSelectionResult =>
{
    const selectedTagIds = useMemo(() => getSelectedMaterialTagIds(opt.binding), [opt.binding, opt.binding.data?.MaterialTags]);
    const onChange = useCallback((value: unknown) => updateMaterialTagsByInput(opt.binding, value), [opt.binding]);

    return { selectedTagIds, onChange };
};

/** 建立 MaterialInfoJson 預設物件，供 Comp 交給 useSetJsonField。 */
export const buildMaterialInfoJsonDefaults = (fields: InfoField[]): MaterialInfoJson =>
{
    return (fields ?? []).reduce<MaterialInfoJson>((map, field) =>
    {
        const key = getInfoFieldKey(field);
        if (!key) return map;
        map[key] = "";
        return map;
    }, {});
};

/** 取得相片預覽網址。 */
export const getMaterialPicturePreviewUrl = (picId?: string | null): string | undefined =>
{
    const id = String(picId ?? "").trim();
    return id ? FileManagementAPI.get_Public_Preview_Url(id) ?? undefined : undefined;
};

/** 將 EditGrid 值正規化成物件相片 CellValue。 */
export const toMaterialPictureCellValue = (value: EditGridCellValue): MaterialPictureCellValue =>
{
    if (isMaterialPictureCellValue(value)) return value;
    if (typeof value === "string")
    {
        return { internalId: value, fileName: buildMaterialPictureFieldDisplayName("", value), url: getMaterialPicturePreviewUrl(value) };
    }
    return { fileName: "", internalId: "" };
};
// #endregion

// #region Private

/** 建立 Toolbar 動作，保留Material預覽行為。 */
const buildMaterialActions = (
    ctx: { binding: ServerFormDefaultRawData<MaterialSet, MaterialFormRefs>["formData"]; refs: MaterialFormRefs; actionsOpt: MaterialFormActionsOpt; },
    defaultActions: ServerFormActions,
): ServerFormActions =>
{
    return { ...defaultActions, Preview: () => ctx.actionsOpt.onPreviewFromDto(buildMaterialPreviewPayload(ctx.binding.data, ctx.refs)) };
};
/** 建立 Material Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildMaterialFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getMaterialModelTitle(ctx.displayName, "物件");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildMaterialInitialData = (ctx: { mode: "new" | "edit"; emptyData: MaterialSet; }): ApiFormInitial<MaterialSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Material Form 會使用到的 Adapter 群組。 */
const buildMaterialFormAdapter = (): MaterialFormAdapter =>
{
    return { Material: MaterialAdapter(), MatCategory: MatCategoryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料、語系明細與動態欄位。 */
const useMaterialReferenceData = (ctx: { adapter: MaterialFormAdapter; binding: ServerFormBinding<MaterialSet>; lang: Lang; }) =>
{
    useEnsureMaterialLangDetails(ctx.binding, ctx.lang);

    const selectedCategoryId = useSelectedMaterialCategoryId(ctx.binding);
    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.Material, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.Material, lang: ctx.lang });
    const infoBaseParam = useMemo(() => buildMatCategoryInfoBaseParam(selectedCategoryId), [selectedCategoryId]);
    const infoGrid = ctx.adapter.MatCategory.hooks.useQueryGridData({ baseParam: infoBaseParam, deps: [selectedCategoryId], modelDeps: [] });

    useEffect(() =>
    {
        infoGrid.onPageChange(1);
    }, [selectedCategoryId]);

    const infoFields = useMemo(() => getInfoFields(infoGrid.list), [infoGrid.list]);
    const infoFieldDisplays = useMemo(() => getInfoFieldDisplays(infoGrid.list), [infoGrid.list]);

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {}, tagMap: tag.map ?? {}, infoFields, infoFieldDisplays },
            isLoading: Boolean(category.isLoading || tag.isLoading || infoGrid.isLoading),
            errors: [category.errorText, tag.errorText, ...(infoGrid.errors ?? [])],
            refetchRefData: async () =>
            {
                await Promise.all([category.refetch(), tag.refetch(), infoGrid.refetchData()]);
            },
        };
    }, [
        category.errorText,
        category.isLoading,
        category.map,
        category.refetch,
        infoFieldDisplays,
        infoFields,
        infoGrid.errors,
        infoGrid.isLoading,
        infoGrid.refetchData,
        tag.errorText,
        tag.isLoading,
        tag.map,
        tag.refetch,
    ]);
};

/** 取得 Material Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getMaterialModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 補齊物件多語資料，避免語系 Tab 缺列。 */
const useEnsureMaterialLangDetails = (binding: ServerFormBinding<MaterialSet>, lang: Lang): void =>
{
    useEnsureLangDetails(binding, {
        headerName: MaterialSetFields.Material,
        detailName: MaterialSetFields.MaterialLangInfo,
        parentKeys: [MaterialLangInfoFields.MaterialId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: lang,
    });
};

/** 取得目前選定的物件類別 Id。 */
const useSelectedMaterialCategoryId = (binding: ServerFormBinding<MaterialSet>): string =>
{
    const categoryId = binding.data?.Material?.CategoryId ?? "";
    return String(categoryId);
};

/** 避免 Query 字串中的雙引號破壞條件。 */
const escapeQueryString = (value: string): string =>
{
    return String(value ?? "").replace(/"/g, `""`);
};

/** 建立 MatCategory 物件資訊查詢參數。 */
const buildMatCategoryInfoBaseParam = (categoryId: string): QueryListParam =>
{
    const safeCategoryId = escapeQueryString(categoryId.trim());
    const condition = safeCategoryId
        ? `${CategoryFields.ProgId} = "${PGID.Material}" And ${CategoryFields.CategoryId} = "${safeCategoryId}"`
        : `${CategoryFields.CategoryId} = "__NONE__"`;

    return {
        Fields: [
            CategoryFields.CategoryId,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields.RowId}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields.Field}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.ParentRowId}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.Lang}`,
            `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.FieldDisplayName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 從 MatCategorySet 抽出欄位定義。 */
const getInfoFields = (list: MatCategorySet[] | null | undefined): InfoField[] =>
{
    const first = (list?.[0] ?? null) as MatCategorySetLike | null;
    return first?.MatCategoryInfoField ?? [];
};

/** 從 MatCategorySet 抽出欄位顯示名稱。 */
const getInfoFieldDisplays = (list: MatCategorySet[] | null | undefined): InfoFieldDisplay[] =>
{
    const first = (list?.[0] ?? null) as MatCategorySetLike | null;
    const topRows = first?.MatCategoryInfoFieldDisplay ?? [];
    if (topRows.length > 0) return topRows;

    const rows = getInfoFields(list) as InfoFieldWithDisplay[];
    return rows.flatMap(row => row._MatCategoryInfoFieldDisplay ?? row.MatCategoryInfoFieldDisplay ?? []);
};

/** 建立物件語系分頁資料。 */
const buildMaterialLangTabs = (
    details: MaterialLangInfo[],
    preferLang: Lang,
    infoFields: InfoField[],
    infoFieldDisplays: InfoFieldDisplay[],
): MaterialLangTabsResult =>
{
    const supportedDetails = filterSupportedMaterialLangRows(details, preferLang, infoFields, infoFieldDisplays);
    const tabItems = buildMaterialLangTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedMaterialLangRows = (
    details: MaterialLangInfo[],
    preferLang: Lang,
    infoFields: InfoField[],
    infoFieldDisplays: InfoFieldDisplay[],
): MaterialLangTabItem[] =>
{
    const detailMap = buildSupportedMaterialLangMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map((lang, index) => buildMaterialLangTabItem(detailMap.get(lang.toLowerCase()), index, lang, infoFields, infoFieldDisplays)).filter((
        item,
    ): item is MaterialLangTabItem => Boolean(item));
};

/** 將有效語系 Detail 建成 Map，同語系只保留第一筆。 */
const buildSupportedMaterialLangMap = (details: MaterialLangInfo[]): Map<string, MaterialLangInfo> =>
{
    return details.reduce<Map<string, MaterialLangInfo>>((map, detail) =>
    {
        const lang = normalizeSupportedLang(detail.Lang);
        if (!lang || map.has(lang)) return map;
        map.set(lang, detail);
        return map;
    }, new Map<string, MaterialLangInfo>());
};

/** 建立單一物件語系 Tab 項目。 */
const buildMaterialLangTabItem = (
    detail: MaterialLangInfo | undefined,
    index: number,
    lang: Lang,
    infoFields: InfoField[],
    infoFieldDisplays: InfoFieldDisplay[],
): MaterialLangTabItem | null =>
{
    if (!detail) return null;
    const normalizedLang = normalizeSupportedLang(detail.Lang);
    if (!normalizedLang) return null;
    const key = LibText.Merge("_", true, detail.MaterialId, detail.RowId, normalizedLang);
    const label = LangLabelMap[normalizedLang as Lang] ?? normalizedLang;
    const rowKeys = buildMaterialLangRowKeys(detail, index);
    const infoItems = buildMaterialInfoItems(infoFields, infoFieldDisplays, lang);
    return { key, label, detail, rowKeys, infoItems };
};

/** 建立物件語系 RowKeys，保留 null / undefined 差異避免新增模式比對錯位。 */
const buildMaterialLangRowKeys = (detail: MaterialLangInfo, index: number): MaterialRowKeys =>
{
    return {
        [MaterialLangInfoFields.MaterialId]: toBindingRowKey(detail.MaterialId),
        [MaterialLangInfoFields.RowId]: toBindingRowKey(detail.RowId ?? index + 1),
    };
};

/** 建立 MaterialLang TabContentComp 需要的 item map。 */
const buildMaterialLangTabItems = (items: MaterialLangTabItem[]): Record<string, string> =>
{
    return items.reduce<Record<string, string>>((tabItems, item) =>
    {
        tabItems[item.key] = item.label;
        return tabItems;
    }, {});
};

/** 建立動態欄位顯示項目。 */
const buildMaterialInfoItems = (fields: InfoField[], displays: InfoFieldDisplay[], lang: Lang): MaterialInfoFieldItem[] =>
{
    return (fields ?? []).map(field =>
    {
        const key = getInfoFieldKey(field);
        return { field: key, title: getInfoFieldTitle(field, displays, lang) };
    }).filter(item => Boolean(item.field));
};

/** 取得物件資訊 JSON 欄位 key。 */
const getInfoFieldKey = (field: InfoField): string =>
{
    const data = field as InfoFieldKeySource;
    return String(data.Field ?? data.FieldKey ?? data.FieldName ?? field.RowId ?? "");
};

/** 取得欄位顯示名稱：目前語系 -> 第一筆顯示名稱 -> 【Field】。 */
const getInfoFieldTitle = (field: InfoField, displays: InfoFieldDisplay[], lang: Lang): string =>
{
    const rowId = String(field.RowId ?? "");
    const fieldKey = getInfoFieldKey(field);
    const sameField = getInfoFieldDisplayRows(field, displays, rowId);
    const current = sameField.find(x => String(x.Lang).toLowerCase() === String(lang).toLowerCase())?.FieldDisplayName;

    return current || sameField[0]?.FieldDisplayName || `【${fieldKey}】`;
};

/** 取得指定欄位的多語顯示列。 */
const getInfoFieldDisplayRows = (field: InfoField, displays: InfoFieldDisplay[], rowId: string): InfoFieldDisplay[] =>
{
    const nested = (field as InfoFieldWithDisplay)._MatCategoryInfoFieldDisplay ?? (field as InfoFieldWithDisplay).MatCategoryInfoFieldDisplay ?? [];
    const merged = nested.length > 0 ? nested : displays;
    return merged.filter(x => String(x.ParentRowId ?? "") === rowId);
};

/** 將 DTO 的 null key 轉成 binding 可接受的 undefined。 */
const toBindingRowKey = (value: string | number | null | undefined): MaterialRowKeyValue =>
{
    return value;
};

/** 建立物件相片 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildMaterialPictureGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getMaterialTableTitle(displayName, MaterialSetFields.MaterialPicture, "物件照片");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-material-picture-grid",
        minTableWidth: 860,
        maxVisibleRows: 5,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        showOperationGuide: false,
        actionColumnTitle: "排序 / 操作",
        addButtonText: `新增${gridTitle}`,
        emptyText: `目前沒有${gridTitle}`,
    };
};

/** 依 RowId 排序物件相片。 */
const sortMaterialPictures = (pictures: MaterialPicture[]): MaterialPicture[] =>
{
    return [...pictures].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 建立物件相片 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildMaterialPictureColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const picTitle = getMaterialColumnTitle(displayName, MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureId, "圖片");
    const nameTitle = getMaterialColumnTitle(displayName, MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureName, "圖片名稱");

    return [{
        key: MaterialPictureFields.PictureId,
        title: picTitle,
        width: 360,
        inputType: "file",
        editable: true,
        accept: "image/*",
        multiple: false,
        maxFileCount: 1,
        maxFileSizeMB: 10,
    }, { key: MaterialPictureFields.PictureName, title: nameTitle, width: 300, inputType: "text", editable: true, maxLength: 200 }];
};

/** 將物件相片 DTO 轉成 EditGrid Row。 */
const buildMaterialPictureGridRow = (
    picture: MaterialPicture,
    index: number,
    opt: UseMaterialPictureEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): MaterialPictureGridRow =>
{
    const rowId = Number(picture.RowId ?? index + 1);

    return {
        keyId: buildMaterialPictureRowKey(picture, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        MaterialId: picture.MaterialId,
        Picture: picture.Picture ?? null,
        cells: buildMaterialPictureCells(picture, opt, onPictureValueChange, displayName),
    };
};

/** 建立物件相片列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildMaterialPictureCells = (
    picture: MaterialPicture,
    opt: UseMaterialPictureEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): RowCell[] =>
{
    const picTitle = getMaterialColumnTitle(displayName, MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureId, "圖片");
    const nameTitle = getMaterialColumnTitle(displayName, MaterialSetFields.MaterialPicture, MaterialPictureFields.PictureName, "圖片名稱");

    return [
        buildEditGridCell(MaterialPictureFields.PictureId, picTitle, buildMaterialPictureCellValue(picture), {
            inputType: "file",
            editable: true,
            accept: "image/*",
            multiple: false,
            maxFileCount: 1,
            maxFileSizeMB: 10,
            render: opt.renderPicturePreview,
            onValueChange: onPictureValueChange,
        }),
        buildEditGridCell(MaterialPictureFields.PictureName, nameTitle, picture.PictureName ?? "", { inputType: "text", editable: true, maxLength: 200 }),
    ];
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getMaterialTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getMaterialColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};

/** 建立新物件相片 DTO，RowId 由共用 Hook 推算。 */
const buildNewMaterialPictureItem = (data: MaterialSet, rowId: number): MaterialPicture =>
{
    return { MaterialId: data.Material?.MaterialId, RowId: rowId, PictureId: "", PictureName: "" };
};

/** 將物件相片 Grid Row 轉回 DTO，RowId 依畫面排序重算。 */
const toMaterialPictureDto = (source: MaterialSet, row: GridRow, index: number): MaterialPicture =>
{
    const pictureValue = toMaterialPictureCellValue(getEditGridCellValue(row, MaterialPictureFields.PictureId));
    const rowId = index + 1;

    return {
        MaterialId: source.Material?.MaterialId ?? (row as MaterialPictureGridRow).MaterialId,
        RowId: rowId,
        PictureId: pictureValue.internalId ?? "",
        PictureName: getNullableStringCellValue(row, MaterialPictureFields.PictureName) ?? LibAttachment.getDisplayFileNameWithoutExtension(pictureValue.originalFileName),
        Picture: (row as MaterialPictureGridRow).Picture ?? undefined,
    };
};

/** 使用 EditGrid 內建 file 欄位選圖後，上傳並同步圖片名稱。 */
const uploadMaterialPictureValue = async (args: EditGridCellValueChangeArgs, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const current = toMaterialPictureCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);

    if (!selectedFile?.file) return { value: buildEmptyMaterialPictureCellValue(), rowValues: { [MaterialPictureFields.PictureName]: "" } };

    let uploadedValue: MaterialPictureCellValue = current;
    const selectedOriginalName = getSelectedMaterialPictureName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedMaterialPictureCellValue(internalId, originalName || selectedOriginalName);
    });

    return { value: uploadedValue, rowValues: { [MaterialPictureFields.PictureName]: LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName) } };
};

/** 批次上傳所有選取檔案，成功後一次寫入 Form data。 */
const uploadMaterialBatchFiles = async (
    opt: {
        binding: ServerFormBinding<MaterialSet>;
        files: File[];
        uploadFile: UploadFileHandler;
        setError: (error: string | null) => void;
        setIsUploading: (isUploading: boolean) => void;
        clearSelectedFiles: () => void;
    },
): Promise<void> =>
{
    if (opt.files.length === 0) return;

    try
    {
        opt.setError(null);
        opt.setIsUploading(true);
        const uploaded = await uploadMaterialFilesSequentially(opt.files, opt.uploadFile);
        appendMaterialUploadedPictures(opt.binding, uploaded);
        opt.clearSelectedFiles();
    } catch (error)
    {
        const err = error as Error;
        opt.setError(err?.message ?? String(error));
        throw error;
    } finally
    {
        opt.setIsUploading(false);
    }
};

/** 逐檔上傳圖片，保留每個檔案的原始檔名供圖片名稱使用。 */
const uploadMaterialFilesSequentially = async (files: File[], uploadFile: UploadFileHandler): Promise<MaterialUploadedPicture[]> =>
{
    const result: MaterialUploadedPicture[] = [];

    for (const file of files)
    {
        const uploaded = await uploadSingleMaterialFile(file, uploadFile);
        result.push(uploaded);
    }

    return result;
};

/** 上傳單一圖片並轉為 MaterialUploadedPicture。 */
const uploadSingleMaterialFile = async (file: File, uploadFile: UploadFileHandler): Promise<MaterialUploadedPicture> =>
{
    let uploadedId = "";
    const originalFileName = file.name;

    await uploadFile([file], (internalId) =>
    {
        uploadedId = internalId;
    });

    return { internalId: uploadedId, originalFileName, title: LibAttachment.getDisplayFileNameWithoutExtension(originalFileName) };
};

/** 將批次上傳結果追加成 MaterialPicture。 */
const appendMaterialUploadedPictures = (binding: ServerFormBinding<MaterialSet>, uploaded: MaterialUploadedPicture[]): void =>
{
    binding.setFormData(prev => appendMaterialUploadedPicturesToData(prev ?? materialEmptyData, uploaded));
};

/** 將批次圖片寫入資料，圖片名稱預設為檔案名稱。 */
const appendMaterialUploadedPicturesToData = (data: MaterialSet, uploaded: MaterialUploadedPicture[]): MaterialSet =>
{
    const materialId = data.Material?.MaterialId;
    const startRowId = getNextMaterialPictureRowId(data.MaterialPicture ?? []);
    const newPictures = uploaded.map((item, index) => buildUploadedMaterialPictureDto(materialId, startRowId + index, item));

    return { ...data, MaterialPicture: [...data.MaterialPicture ?? [], ...newPictures] };
};

/** 建立批次上傳後的物件相片 DTO。 */
const buildUploadedMaterialPictureDto = (materialId: string | null | undefined, rowId: number, item: MaterialUploadedPicture): MaterialPicture =>
{
    return { MaterialId: materialId, RowId: rowId, PictureId: item.internalId, PictureName: item.title };
};

/** 取得下一個相片 RowId。 */
const getNextMaterialPictureRowId = (pictures: MaterialPicture[]): number =>
{
    return pictures.reduce((max, picture) => Math.max(max, Number(picture.RowId ?? 0)), 0) + 1;
};

/** 取得本次選圖的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedMaterialPictureName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 建立空相片值，用於使用者清除 file 欄位。 */
const buildEmptyMaterialPictureCellValue = (): MaterialPictureCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 建立相片 CellValue，保留預覽 url 給 EditGrid readonly render 使用。 */
const buildMaterialPictureCellValue = (picture: MaterialPicture): MaterialPictureCellValue =>
{
    const internalId = picture.PictureId ?? "";
    const originalName = getManagedFileOriginalName(picture.Picture);

    return {
        internalId,
        fileName: buildMaterialPictureFieldDisplayName(originalName, internalId),
        originalFileName: originalName,
        url: getMaterialPicturePreviewUrl(internalId),
    };
};

/** 上傳後建立新的相片 CellValue，欄位顯示原始檔名與 internalId。 */
const buildUploadedMaterialPictureCellValue = (internalId: string, originalName?: string): MaterialPictureCellValue =>
{
    const safeOriginalName = originalName ?? "";

    return {
        internalId,
        fileName: buildMaterialPictureFieldDisplayName(safeOriginalName, internalId),
        originalFileName: safeOriginalName,
        url: getMaterialPicturePreviewUrl(internalId),
    };
};

/** 判斷是否為相片 CellValue。 */
const isMaterialPictureCellValue = (value: EditGridCellValue): value is MaterialPictureCellValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立相片欄位顯示文字：原始檔名 (internalId)。 */
const buildMaterialPictureFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = String(originalName ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 從 FileManageModel 取得原始檔名。 */
const getManagedFileOriginalName = (file?: FileManage | null): string =>
{
    const name = String(file?.FileName ?? "").trim();
    const ext = String(file?.FileExtension ?? "").trim();
    if (!name) return "";
    if (!ext || name.endsWith(ext)) return name;
    return `${name}${ext.startsWith(".") ? ext : `.${ext}`}`;
};

/** 建立相片 Row key。 */
const buildMaterialPictureRowKey = (picture: MaterialPicture, index: number): string =>
{
    return `material-picture-${picture.MaterialId ?? "new"}-${picture.RowId ?? index + 1}`;
};

/** 取得 nullable 字串 cell 值，空字串會轉成 null。 */
const getNullableStringCellValue = (row: GridRow, key: string): string | null =>
{
    const value = getEditGridStringCellValue(row, key).trim();
    return value.length > 0 ? value : null;
};

/** 取得目前已選標籤 Id。 */
const getSelectedMaterialTagIds = (binding: ServerFormBinding<MaterialSet>): string[] =>
{
    return (binding.data?.MaterialTags ?? []).map(x => String(x.TagId ?? "").trim()).filter(Boolean);
};

/** 依 CheckBox 回傳值同步 MaterialTags。 */
const updateMaterialTagsByInput = (binding: ServerFormBinding<MaterialSet>, value: unknown): void =>
{
    const nextIds = Array.isArray(value) ? value.map(x => String(x ?? "").trim()).filter(Boolean) : [];

    binding.setFormData(prev => syncMaterialTags(prev ?? materialEmptyData, nextIds));
};

/** 將選取的 TagId 轉成 MaterialTags DTO。 */
const syncMaterialTags = (data: MaterialSet, tagIds: string[]): MaterialSet =>
{
    const materialId = data.Material?.MaterialId ?? "";
    const prevRows = data.MaterialTags ?? [];
    const nextRows = tagIds.map((tagId, index) => buildMaterialTagRow(prevRows, materialId, tagId, index));

    return { ...data, MaterialTags: nextRows };
};

/** 建立或沿用 MaterialTags 單列資料。 */
const buildMaterialTagRow = (rows: MaterialTags[], materialId: string, tagId: string, index: number): MaterialTags =>
{
    const exists = rows.find(row => String(row.TagId ?? "") === tagId);
    return { ...(exists ?? {}), MaterialId: exists?.MaterialId ?? materialId, RowId: exists?.RowId ?? index + 1, TagId: tagId };
};
/** 建立物件預覽 payload，補上前台顯示需要的分類、標籤與動態欄位名稱。 */
const buildMaterialPreviewPayload = (formData: MaterialSet, refs: MaterialFormRefs): MaterialPreviewPayload =>
{
    const categoryNameText = mapMaterialCategoryToText(formData.Material?.CategoryId, refs.categoryMap);
    const tagNameText = mapMaterialTagsToText(formData.MaterialTags, refs.tagMap);
    const matCateInfoFieldsMap = buildMaterialInfoFieldTitleMap(refs.infoFields, refs.infoFieldDisplays);
    return { formData, categoryNameText, tagNameText, matCateInfoFieldsMap };
};

/** 將物件分類 Id 轉成顯示文字。 */
const mapMaterialCategoryToText = (categoryId: string | null | undefined, map: Record<string, string>): string =>
{
    const key = String(categoryId ?? "").trim();
    return key ? map?.[key] ?? "" : "";
};

/** 將物件標籤列轉成顯示文字。 */
const mapMaterialTagsToText = (tags: MaterialTags[] | null | undefined, map: Record<string, string>): string =>
{
    const keys = (tags ?? []).map(tag => String(tag.TagId ?? "").trim()).filter(Boolean);
    return LibText.mapKeysToDisplayText(keys, map ?? {}, "、");
};

/** 建立動態欄位 key / 顯示文字 Map。 */
const buildMaterialInfoFieldTitleMap = (fields: InfoField[], displays: InfoFieldDisplay[]): Record<string, string> =>
{
    return buildMaterialInfoItems(fields, displays, DefaultLang).reduce<Record<string, string>>((map, item) =>
    {
        map[item.field] = item.title;
        return map;
    }, {});
};
// #endregion
