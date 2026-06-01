import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellValue,
    EditGridCellValueChangeArgs,
    EditGridCellValueChangeHandler,
    EditGridCellValueChangeResult,
    EditGridFileValue,
    EditGridSelectOption,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridNumberCellValue,
    getEditGridStringCellValue,
    toEditGridOptions,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { type Lang, LangLabelMap, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { FileArchiveDetailFields, FileArchiveInfoFields, FileArchiveSetFields, FileArchiveUrlDetailFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type FileArchiveInfo = NonNullable<FileArchiveSet["FileArchiveInfo"]>[number];
type FileArchiveDetail = components["schemas"]["FileArchiveDetail_DTO"];
type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail_DTO"];
type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type FileArchiveInfoRowKeys = Record<string, string | number | boolean | null | undefined>;
export type FileArchiveFileCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };
export type FileArchiveFileGridRow = GridRow & { FileArchiveId?: string | null; ParentRowId?: number | null; FileRowId?: number | null; };
export type FileArchiveUrlGridRow = GridRow & { FileArchiveId?: string | null; ParentRowId?: number | null; UrlRowId?: number | null; };

export interface UseFileArchiveFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: FileArchiveSet;

    /** Form Template 標準動作設定 */
    actionsOpt: FileArchiveFormActionsOpt;
}

export interface UseFileArchiveDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface UseFileArchiveFileEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** 目前語系明細 RowId，檔案用它綁 ParentRowId */
    parentRowId: number;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export interface UseFileArchiveUrlEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveSet>;

    /** 目前語系明細 RowId，外部連結用它綁 ParentRowId */
    parentRowId: number;

    /** WindowTarget 下拉選項 */
    windowTargetOpts: Record<string, string>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export interface FileArchiveDetailTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: FileArchiveInfo;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: FileArchiveInfoRowKeys;

    /** Detail RowId，給 SubDetail 綁 ParentRowId */
    detailRowId: number;
}

export interface FileArchiveDetailTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: FileArchiveDetailTabItem[];
}

export const fileArchiveEmptyData: FileArchiveSet = { FileArchive: {}, FileArchiveInfo: [], FileArchiveDetail: [], FileArchiveUrlDetail: [] };

export type FileArchiveFormRefs = {
    /** 檔案室類別選項 */
    categoryMap: Record<string, string>;

    /** 檔案室標籤選項 */
    tagMap: Record<string, string>;

    /** 內容狀態選項 */
    statusOpts: Record<string, string>;

    /** 外部連結開啟方式選項 */
    windowTargetOpts: Record<string, string>;
};

export type FileArchiveFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type FileArchiveFormAdapter = {
    FileArchive: ReturnType<typeof FileArchiveAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
/** 建立 FileArchive Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useFileArchiveFormTemplate = (
    opt: UseFileArchiveFormTemplateOptions,
): ServerFormTemplate<
    FileArchiveSet,
    FileArchiveFormAdapter,
    FileArchiveFormRefs,
    ServerFormDefaultRawData<FileArchiveSet, FileArchiveFormRefs>,
    FileArchiveFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "FileArchive",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildFileArchiveFormAdapter,
                selectDataAdapter: adapter => adapter.FileArchive,
                buildTitle: buildFileArchiveFormTitle,
                buildInitialData: buildFileArchiveInitialData,
                useReferenceData: ctx => useFileArchiveReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立檔案室 Detail 語系 Tabs，避免 Comp 處理語系過濾與 Unknown fallback。 */
export const useFileArchiveDetailTabs = (opt: UseFileArchiveDetailTabsOptions): FileArchiveDetailTabsResult =>
{
    const details = opt.binding.data?.FileArchiveInfo;

    return useMemo(() =>
    {
        return buildFileArchiveDetailTabs(details ?? [], opt.lang);
    }, [details, opt.lang]);
};

/** 建立檔案室檔案 SubDetail EditGrid binding，Comp 只需掛載 EditGrid。 */
export const useFileArchiveFileEditGrid = (opt: UseFileArchiveFileEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildFileArchiveFileColumns(displayName), [displayName]);
    const handleFileValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadFileArchiveFileValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<FileArchiveSet, FileArchiveDetail, FileArchiveFileGridRow>({
        binding: opt.binding,
        emptyData: fileArchiveEmptyData,
        collectionName: FileArchiveSetFields.FileArchiveDetail,
        parent: buildFileArchiveFileParent(opt.parentRowId),
        columns,
        getItemRowId: file => file.RowId,
        sortItems: sortFileArchiveFiles,
        createItem: ctx => buildNewFileArchiveFileItem(ctx.data, opt.parentRowId, ctx.nextRowId),
        toRow: (file, index) => buildFileArchiveFileGridRow(file, index, handleFileValueChange, displayName),
        toItem: (row, index, ctx) => toFileArchiveFileDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildFileArchiveFileGridProps(opt.parentRowId, opt.style, displayName),
    });
};

/** 建立檔案室外部連結 SubDetail EditGrid binding，Comp 只需掛載 EditGrid。 */
export const useFileArchiveUrlEditGrid = (opt: UseFileArchiveUrlEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildFileArchiveUrlColumns(displayName, opt.windowTargetOpts), [displayName, opt.windowTargetOpts]);

    return useEditGridBinding<FileArchiveSet, FileArchiveUrlDetail, FileArchiveUrlGridRow>({
        binding: opt.binding,
        emptyData: fileArchiveEmptyData,
        collectionName: FileArchiveSetFields.FileArchiveUrlDetail,
        parent: buildFileArchiveUrlParent(opt.parentRowId),
        columns,
        getItemRowId: url => url.RowId,
        sortItems: sortFileArchiveUrls,
        createItem: ctx => buildNewFileArchiveUrlItem(ctx.data, opt.parentRowId, ctx.nextRowId),
        toRow: (url, index) => buildFileArchiveUrlGridRow(url, index, displayName, opt.windowTargetOpts),
        toItem: (row, index, ctx) => toFileArchiveUrlDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildFileArchiveUrlGridProps(opt.parentRowId, opt.style, displayName),
    });
};
// #endregion

// #region Timing
/** 建立 FileArchive Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildFileArchiveFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getFileArchiveModelTitle(ctx.displayName, "檔案室");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildFileArchiveInitialData = (ctx: { mode: "new" | "edit"; emptyData: FileArchiveSet; }): ApiFormInitial<FileArchiveSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 FileArchive Form 會使用到的 Adapter 群組。 */
const buildFileArchiveFormAdapter = (): FileArchiveFormAdapter =>
{
    return { FileArchive: FileArchiveAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系明細補齊。 */
const useFileArchiveReferenceData = (
    ctx: { adapter: FileArchiveFormAdapter; binding: ServerFormDefaultRawData<FileArchiveSet, FileArchiveFormRefs>["formData"]; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: FileArchiveSetFields.FileArchive,
        detailName: FileArchiveSetFields.FileArchiveInfo,
        parentKeys: [FileArchiveInfoFields.FileArchiveId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();
    const windowTargetOpts = useWindowTargetOptions();

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {}, tagMap: tag.map ?? {}, statusOpts: statusOpts.data, windowTargetOpts: windowTargetOpts.data },
            isLoading: Boolean(category.isLoading || tag.isLoading || statusOpts.isLoading || windowTargetOpts.isLoading),
            errors: [category.errorText, tag.errorText, statusOpts.error, windowTargetOpts.error],
            refetchRefData: async () =>
            {
                await Promise.all([category.refetch(), tag.refetch()]);
            },
        };
    }, [
        category.errorText,
        category.isLoading,
        category.map,
        category.refetch,
        statusOpts.data,
        statusOpts.error,
        statusOpts.isLoading,
        tag.errorText,
        tag.isLoading,
        tag.map,
        tag.refetch,
        windowTargetOpts.data,
        windowTargetOpts.error,
        windowTargetOpts.isLoading,
    ]);
};
// #endregion

// #region Private
/** 取得 FileArchive Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getFileArchiveModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** ContentStatus enum options（去掉 key=0）。 */
const useContentStatusOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions("ContentStatus");

    return useMemo(() =>
    {
        const raw = src.data ?? {};
        const { ["0"]: _drop, ...rest } = raw;
        return { data: rest as Record<string, string>, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.error, src.isLoading]);
};

/** WindowTarget enum options，沒有回傳時保留舊版預設顯示。 */
const useWindowTargetOptions = (): { data: Record<string, string>; isLoading: boolean; error: string | null; } =>
{
    const src = useFetchEnumOptions("WindowTarget");

    return useMemo(() =>
    {
        const data = Object.keys(src.data ?? {}).length > 0 ? src.data ?? {} : getFallbackWindowTargetMap();
        return { data, isLoading: Boolean(src.isLoading), error: src.error };
    }, [src.data, src.error, src.isLoading]);
};

/** 建立 WindowTarget 預設選項，避免 enum 尚未回來時外部連結無法編輯。 */
const getFallbackWindowTargetMap = (): Record<string, string> =>
{
    return { "0": "本頁開啟", "1": "另開分頁" };
};

/** 建立 FileArchive Detail 語系分頁資料。 */
const buildFileArchiveDetailTabs = (details: FileArchiveInfo[], preferLang: Lang): FileArchiveDetailTabsResult =>
{
    const supportedDetails = filterSupportedDetailRows(details, preferLang);
    const tabItems = buildFileArchiveDetailTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedDetailRows = (details: FileArchiveInfo[], preferLang: Lang): FileArchiveDetailTabItem[] =>
{
    const detailMap = buildSupportedDetailMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map((lang, index) => buildFileArchiveDetailTabItem(detailMap.get(lang.toLowerCase()), index)).filter((
        item,
    ): item is FileArchiveDetailTabItem => Boolean(item));
};

/** 將有效語系 Detail 建成 Map，同語系只保留第一筆。 */
const buildSupportedDetailMap = (details: FileArchiveInfo[]): Map<string, FileArchiveInfo> =>
{
    return details.reduce<Map<string, FileArchiveInfo>>((map, detail) =>
    {
        const lang = normalizeSupportedLang(detail.Lang);
        if (!lang || map.has(lang)) return map;
        map.set(lang, detail);
        return map;
    }, new Map<string, FileArchiveInfo>());
};

/** 建立目前 Case 支援語系順序，當前語系優先。 */
const buildSupportedLangOrder = (preferLang: Lang): Lang[] =>
{
    const langs = [preferLang, ...SUPPORTED_LANGS];
    return langs.filter((lang, index) => langs.indexOf(lang) === index && Boolean(normalizeSupportedLang(lang)));
};

/** 正規化並檢查語系是否屬於目前 Case 支援語系。 */
const normalizeSupportedLang = (lang?: Lang | string | null): string | null =>
{
    const value = String(lang ?? "").trim().toLowerCase();
    const isSupport = SUPPORTED_LANGS.some(item => item.toLowerCase() === value);
    return isSupport ? value : null;
};

/** 建立單一 Detail Tab 項目。 */
const buildFileArchiveDetailTabItem = (detail: FileArchiveInfo | undefined, index: number): FileArchiveDetailTabItem | null =>
{
    if (!detail) return null;

    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;

    const key = LibMerge("_", true, detail.FileArchiveId, detail.RowId, lang);
    const label = LangLabelMap[lang as Lang] ?? lang;
    const detailRowId = Number(detail.RowId ?? index + 1);
    const rowKeys = buildFileArchiveInfoRowKeys(detail);

    return { key, label, detail, rowKeys, detailRowId };
};

/** 建立 Detail RowKeys，保留 null 主鍵並加入 Lang，避免 Template 寫入時新建無語系列。 */
const buildFileArchiveInfoRowKeys = (detail: FileArchiveInfo): FileArchiveInfoRowKeys =>
{
    // 宣告變數
    const lang = normalizeSupportedLang(detail.Lang);

    // return
    return {
        [FileArchiveInfoFields.FileArchiveId]: toBindingRowKey(detail.FileArchiveId),
        [FileArchiveInfoFields.RowId]: toBindingRowKey(detail.RowId),
        [FileArchiveInfoFields.Lang]: lang,
    };
};

/** 建立 Detail TabContentComp 需要的 item map。 */
const buildFileArchiveDetailTabItems = (items: FileArchiveDetailTabItem[]): Record<string, string> =>
{
    return items.reduce<Record<string, string>>((tabItems, item) =>
    {
        tabItems[item.key] = item.label;
        return tabItems;
    }, {});
};

/** 保留 DTO 原始 key 值，避免 null 被轉成 undefined 後比對不到原列。 */
const toBindingRowKey = (value: string | number | null | undefined): string | number | null | undefined =>
{
    // return
    return value;
};

/** 建立檔案 parent 綁定，讓共用 Hook 自動過濾同語系檔案。 */
const buildFileArchiveFileParent = (parentRowId: number) =>
{
    return {
        field: FileArchiveDetailFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 建立外部連結 parent 綁定，讓共用 Hook 自動過濾同語系連結。 */
const buildFileArchiveUrlParent = (parentRowId: number) =>
{
    return {
        field: FileArchiveUrlDetailFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 建立檔案 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildFileArchiveFileGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getFileArchiveDetailTableTitle(displayName, FileArchiveSetFields.FileArchiveDetail, "檔案上傳");

    return {
        title: gridTitle,
        ariaLabel: `檔案室語系 ${parentRowId} ${gridTitle}清單`,
        style,
        storageKey: `server-filearchive-file-grid-${parentRowId}`,
        minTableWidth: 760,
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

/** 建立外部連結 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildFileArchiveUrlGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getFileArchiveDetailTableTitle(displayName, FileArchiveSetFields.FileArchiveUrlDetail, "外部連結");

    return {
        title: gridTitle,
        ariaLabel: `檔案室語系 ${parentRowId} ${gridTitle}清單`,
        style,
        storageKey: `server-filearchive-url-grid-${parentRowId}`,
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

/** 依 RowId 排序檔案。 */
const sortFileArchiveFiles = (files: FileArchiveDetail[]): FileArchiveDetail[] =>
{
    return [...files].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 依 RowId 排序外部連結。 */
const sortFileArchiveUrls = (urls: FileArchiveUrlDetail[]): FileArchiveUrlDetail[] =>
{
    return [...urls].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 建立檔案 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildFileArchiveFileColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const fileNameTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveDetail, FileArchiveDetailFields.FileName, "檔案名稱");
    const fileIdTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveDetail, FileArchiveDetailFields.FileSrcId, "檔案");

    return [{ key: FileArchiveDetailFields.FileName, title: fileNameTitle, width: 260, inputType: "text", editable: true, maxLength: 200 }, {
        key: FileArchiveDetailFields.FileSrcId,
        title: fileIdTitle,
        width: 520,
        inputType: "file",
        editable: true,
        accept: "*/*",
        multiple: false,
        maxFileCount: 1,
        maxFileSizeMB: 10,
    }];
};

/** 建立外部連結 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildFileArchiveUrlColumns = (displayName: ModelDisplaySchema, windowTargetOpts: Record<string, string>): ColumnConfig[] =>
{
    const descTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveSetFields.FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.UrlDescription,
        "網址描述",
    );
    const urlTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveUrlDetail, FileArchiveUrlDetailFields.Url, "網址");
    const targetTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveSetFields.FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.WindowTarget,
        "開啟方式",
    );
    const options = buildWindowTargetEditGridOptions(windowTargetOpts);

    return [{ key: FileArchiveUrlDetailFields.UrlDescription, title: descTitle, width: 260, inputType: "text", editable: true, maxLength: 200 }, {
        key: FileArchiveUrlDetailFields.Url,
        title: urlTitle,
        width: 420,
        inputType: "text",
        editable: true,
        maxLength: 500,
    }, { key: FileArchiveUrlDetailFields.WindowTarget, title: targetTitle, width: 180, inputType: "selectSingle", editable: true, options }];
};

/** 建立 WindowTarget 的 EditGrid options。 */
const buildWindowTargetEditGridOptions = (windowTargetOpts: Record<string, string>): EditGridSelectOption[] =>
{
    const source = Object.keys(windowTargetOpts ?? {}).length > 0 ? windowTargetOpts : getFallbackWindowTargetMap();
    return toEditGridOptions(source);
};

/** 將檔案 DTO 轉成 EditGrid Row。 */
const buildFileArchiveFileGridRow = (
    file: FileArchiveDetail,
    index: number,
    onFileValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): FileArchiveFileGridRow =>
{
    const rowId = Number(file.RowId ?? index + 1);

    return {
        keyId: buildFileArchiveFileRowKey(file, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        FileArchiveId: file.FileArchiveId,
        ParentRowId: file.ParentRowId,
        FileRowId: rowId,
        cells: buildFileArchiveFileCells(file, onFileValueChange, displayName),
    };
};

/** 將外部連結 DTO 轉成 EditGrid Row。 */
const buildFileArchiveUrlGridRow = (
    url: FileArchiveUrlDetail,
    index: number,
    displayName: ModelDisplaySchema,
    windowTargetOpts: Record<string, string>,
): FileArchiveUrlGridRow =>
{
    const rowId = Number(url.RowId ?? index + 1);

    return {
        keyId: buildFileArchiveUrlRowKey(url, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        FileArchiveId: url.FileArchiveId,
        ParentRowId: url.ParentRowId,
        UrlRowId: rowId,
        cells: buildFileArchiveUrlCells(url, displayName, windowTargetOpts),
    };
};

/** 建立檔案列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildFileArchiveFileCells = (file: FileArchiveDetail, onFileValueChange: EditGridCellValueChangeHandler, displayName: ModelDisplaySchema): RowCell[] =>
{
    const fileNameTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveDetail, FileArchiveDetailFields.FileName, "檔案名稱");
    const fileIdTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveDetail, FileArchiveDetailFields.FileSrcId, "檔案");

    return [
        buildEditGridCell(FileArchiveDetailFields.FileName, fileNameTitle, file.FileName ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(FileArchiveDetailFields.FileSrcId, fileIdTitle, buildFileArchiveFileCellValue(file), {
            inputType: "file",
            editable: true,
            accept: "*/*",
            multiple: false,
            maxFileCount: 1,
            maxFileSizeMB: 10,
            onValueChange: onFileValueChange,
        }),
    ];
};

/** 建立外部連結列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildFileArchiveUrlCells = (url: FileArchiveUrlDetail, displayName: ModelDisplaySchema, windowTargetOpts: Record<string, string>): RowCell[] =>
{
    const descTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveSetFields.FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.UrlDescription,
        "網址描述",
    );
    const urlTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveSetFields.FileArchiveUrlDetail, FileArchiveUrlDetailFields.Url, "網址");
    const targetTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveSetFields.FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.WindowTarget,
        "開啟方式",
    );
    const options = buildWindowTargetEditGridOptions(windowTargetOpts);

    return [
        buildEditGridCell(FileArchiveUrlDetailFields.UrlDescription, descTitle, url.UrlDescription ?? "", {
            inputType: "text",
            editable: true,
            maxLength: 200,
        }),
        buildEditGridCell(FileArchiveUrlDetailFields.Url, urlTitle, url.Url ?? "", { inputType: "text", editable: true, maxLength: 500 }),
        buildEditGridCell(FileArchiveUrlDetailFields.WindowTarget, targetTitle, url.WindowTarget ?? 0, { inputType: "selectSingle", editable: true, options }),
    ];
};

/** 取得 Detail 子表顯示名稱，避免 Grid 標題寫死。 */
const getFileArchiveDetailTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 取得 Detail 子表欄位顯示名稱，避免 EditGrid 欄位標題寫死。 */
const getFileArchiveDetailColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    return getModelColumnTitle(displayName, tableId, columnId, fallback);
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getModelColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};

/** 建立新檔案 DTO，RowId 由共用 Hook 推算。 */
const buildNewFileArchiveFileItem = (data: FileArchiveSet, parentRowId: number, rowId: number): FileArchiveDetail =>
{
    return { FileArchiveId: data.FileArchive?.FileArchiveId, ParentRowId: parentRowId, RowId: rowId, FileSrcId: "", FileName: "" };
};

/** 建立新外部連結 DTO，RowId 由共用 Hook 推算。 */
const buildNewFileArchiveUrlItem = (data: FileArchiveSet, parentRowId: number, rowId: number): FileArchiveUrlDetail =>
{
    return { FileArchiveId: data.FileArchive?.FileArchiveId, ParentRowId: parentRowId, RowId: rowId, UrlDescription: "", Url: "", WindowTarget: 0 };
};

/** 將檔案 Grid Row 轉回 DTO，儲存時只送 FileSrcId，避免 FileManage 被 EF 當新資料重複新增。 */
const toFileArchiveFileDto = (source: FileArchiveSet, parentRowId: number, row: GridRow, index: number): FileArchiveDetail =>
{
    // 宣告變數
    const fileValue = toFileArchiveFileCellValue(getEditGridCellValue(row, FileArchiveDetailFields.FileSrcId));
    const fileName = getEditGridStringCellValue(row, FileArchiveDetailFields.FileName).trim();
    const fileSrcId = String(fileValue.internalId ?? "").trim();

    // return
    return {
        FileArchiveId: source.FileArchive?.FileArchiveId ?? (row as FileArchiveFileGridRow).FileArchiveId,
        ParentRowId: parentRowId,
        RowId: index + 1,
        FileSrcId: fileSrcId,
        FileName: fileName,
    };
};

/** 將外部連結 Grid Row 轉回 DTO，RowId 依目前排序重新編號。 */
const toFileArchiveUrlDto = (source: FileArchiveSet, parentRowId: number, row: GridRow, index: number): FileArchiveUrlDetail =>
{
    return {
        FileArchiveId: source.FileArchive?.FileArchiveId ?? (row as FileArchiveUrlGridRow).FileArchiveId,
        ParentRowId: parentRowId,
        RowId: index + 1,
        UrlDescription: getEditGridStringCellValue(row, FileArchiveUrlDetailFields.UrlDescription).trim(),
        Url: getEditGridStringCellValue(row, FileArchiveUrlDetailFields.Url).trim(),
        WindowTarget: getEditGridNumberCellValue(row, FileArchiveUrlDetailFields.WindowTarget, 0) as components["schemas"]["WindowTarget"],
    };
};

/** 使用 EditGrid 內建 file 欄位選檔後，上傳並轉回檔案室附件值。 */
const uploadFileArchiveFileValue = async (args: EditGridCellValueChangeArgs, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const current = toFileArchiveFileCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);

    if (!selectedFile?.file) return { value: buildEmptyFileArchiveFileCellValue() };

    let uploadedValue: FileArchiveFileCellValue = current;
    const selectedOriginalName = getSelectedFileArchiveFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedFileArchiveFileCellValue(current, internalId, originalName || selectedOriginalName);
    });

    return buildFileArchiveFileUploadChangeResult(uploadedValue);
};

/** 建立檔案上傳後的欄位更新結果，同步覆蓋檔案名稱。 */
const buildFileArchiveFileUploadChangeResult = (file: FileArchiveFileCellValue): EditGridCellValueChangeResult =>
{
    return { value: file, rowValues: { [FileArchiveDetailFields.FileName]: getFileNameWithoutExtension(file.originalFileName) } };
};

/** 取得本次選檔的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedFileArchiveFileName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 取得不含副檔名的檔名，供檔案名稱欄位預設帶入。 */
const getFileNameWithoutExtension = (fileName?: string | null): string =>
{
    const safeFileName = String(fileName ?? "").trim();
    const extIndex = safeFileName.lastIndexOf(".");

    if (extIndex <= 0) return safeFileName;
    return safeFileName.slice(0, extIndex);
};

/** 從 EditGrid file value 取得使用者剛選的 File。 */
const getSelectedEditGridFile = (value: EditGridCellValue): EditGridFileValue | null =>
{
    if (isEditGridFileValue(value)) return value;
    return null;
};

/** 判斷是否為 EditGrid file value。 */
const isEditGridFileValue = (value: EditGridCellValue): value is EditGridFileValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立空檔案值，用於使用者清除 file 欄位。 */
const buildEmptyFileArchiveFileCellValue = (): FileArchiveFileCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 建立檔案 CellValue，檔案欄位顯示原始檔名與 internalId，不混用業務名稱。 */
export const buildFileArchiveFileCellValue = (file: FileArchiveDetail): FileArchiveFileCellValue =>
{
    const internalId = file.FileSrcId ?? file.FileSrc?.InternalId ?? "";
    const originalName = file.FileSrc?.FileName ?? "";

    return {
        internalId,
        fileName: buildFileArchiveFileFieldDisplayName(originalName, internalId),
        originalFileName: originalName,
        url: getFileArchiveFilePreviewUrl(internalId),
        downloadUrl: getFileArchiveFileDownloadUrl(internalId),
    };
};

/** 上傳後建立新的檔案 CellValue，檔案欄位固定顯示原始檔名與 internalId。 */
export const buildUploadedFileArchiveFileCellValue = (
    _current: FileArchiveFileCellValue,
    internalId: string,
    originalName?: string,
): FileArchiveFileCellValue =>
{
    const safeOriginalName = originalName ?? "";

    return {
        internalId,
        fileName: buildFileArchiveFileFieldDisplayName(safeOriginalName, internalId),
        originalFileName: safeOriginalName,
        url: getFileArchiveFilePreviewUrl(internalId),
        downloadUrl: getFileArchiveFileDownloadUrl(internalId),
    };
};

/** 將 EditGrid 值正規化成檔案 CellValue。 */
export const toFileArchiveFileCellValue = (value: EditGridCellValue): FileArchiveFileCellValue =>
{
    if (isFileArchiveFileCellValue(value)) return value;
    if (typeof value === "string") return { internalId: value, fileName: buildFileArchiveFileFieldDisplayName("", value) };
    return { fileName: "", internalId: "" };
};

/** 判斷是否為檔案室檔案 CellValue。 */
const isFileArchiveFileCellValue = (value: EditGridCellValue): value is FileArchiveFileCellValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立檔案欄位顯示文字：原始檔名 (internalId)。 */
const buildFileArchiveFileFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = String(originalName ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 取得檔案預覽網址，保留給 EditGrid file value 使用。 */
const getFileArchiveFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得檔案下載網址。 */
const getFileArchiveFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 建立檔案 Row key。 */
const buildFileArchiveFileRowKey = (file: FileArchiveDetail, index: number): string =>
{
    return `filearchive-file-${file.FileArchiveId ?? "new"}-${file.ParentRowId ?? 0}-${file.RowId ?? index + 1}`;
};

/** 建立外部連結 Row key。 */
const buildFileArchiveUrlRowKey = (url: FileArchiveUrlDetail, index: number): string =>
{
    return `filearchive-url-${url.FileArchiveId ?? "new"}-${url.ParentRowId ?? 0}-${url.RowId ?? index + 1}`;
};
// #endregion
