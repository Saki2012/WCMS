import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import { buildServerSupportedLangDetailMap } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Helper";
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
    getSelectedEditGridFile,
    toEditGridOptions,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { FileArchiveDetailFields, FileArchiveInfoFields, FileArchiveFields, FileArchiveUrlDetailFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
type FileArchiveFormModel = components["schemas"]["FileArchive"];

type FileArchiveInfo = NonNullable<FileArchiveFormModel["_FileArchiveInfo"]>[number];

type FileArchiveDetail = components["schemas"]["FileArchiveDetail"];

type FileArchiveUrlDetail = components["schemas"]["FileArchiveUrlDetail"];

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
    emptyData: FileArchiveFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: FileArchiveFormActionsOpt;
}

export interface UseFileArchiveDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveFormModel>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface UseFileArchiveFileEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveFormModel>;

    /** 目前語系明細 RowId，檔案用它綁 ParentRowId */
    parentRowId: number;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export interface UseFileArchiveUrlEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<FileArchiveFormModel>;

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
export const fileArchiveEmptyData: FileArchiveFormModel = { FileArchiveId: "", _FileArchiveInfo: [] };

/** 建立 FileArchive Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useFileArchiveFormTemplate = (
    opt: UseFileArchiveFormTemplateOptions,
): ServerFormTemplate<
    FileArchiveFormModel,
    FileArchiveFormAdapter,
    FileArchiveFormRefs,
    ServerFormDefaultRawData<FileArchiveFormModel, FileArchiveFormRefs>,
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
    const details = opt.binding.data?._FileArchiveInfo;

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

    return useEditGridBinding<FileArchiveFormModel, FileArchiveDetail, FileArchiveFileGridRow>({
        binding: opt.binding,
        emptyData: fileArchiveEmptyData,
        getItems: data => getFileArchiveFiles(data, opt.parentRowId),
        setItems: (data, items) => setFileArchiveFiles(data, opt.parentRowId, items),
        columns,
        getItemRowId: file => file.RowId,
        sortItems: sortFileArchiveFiles,
        createItem: ctx => buildNewFileArchiveFileItem(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo),
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

    return useEditGridBinding<FileArchiveFormModel, FileArchiveUrlDetail, FileArchiveUrlGridRow>({
        binding: opt.binding,
        emptyData: fileArchiveEmptyData,
        getItems: data => getFileArchiveUrls(data, opt.parentRowId),
        setItems: (data, items) => setFileArchiveUrls(data, opt.parentRowId, items),
        columns,
        getItemRowId: url => url.RowId,
        sortItems: sortFileArchiveUrls,
        createItem: ctx => buildNewFileArchiveUrlItem(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo),
        toRow: (url, index) => buildFileArchiveUrlGridRow(url, index, displayName, opt.windowTargetOpts),
        toItem: (row, index, ctx) => toFileArchiveUrlDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildFileArchiveUrlGridProps(opt.parentRowId, opt.style, displayName),
    });
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
// #endregion

// #region Private
/** 建立 FileArchive Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildFileArchiveFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getFileArchiveModelTitle(ctx.displayName, "檔案室");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildFileArchiveInitialData = (ctx: { mode: "new" | "edit"; emptyData: FileArchiveFormModel; }): ApiFormInitial<FileArchiveFormModel> | undefined =>
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
    ctx: { adapter: FileArchiveFormAdapter; binding: ServerFormDefaultRawData<FileArchiveFormModel, FileArchiveFormRefs>["formData"]; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        detailName: FileArchiveFields._FileArchiveInfo,
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
    const detailMap = buildServerSupportedLangDetailMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map((lang, index) => buildFileArchiveDetailTabItem(detailMap.get(lang.toLowerCase()), index)).filter((
        item,
    ): item is FileArchiveDetailTabItem => Boolean(item));
};

/** 建立單一 Detail Tab 項目。 */
const buildFileArchiveDetailTabItem = (detail: FileArchiveInfo | undefined, index: number): FileArchiveDetailTabItem | null =>
{
    if (!detail) return null;

    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;

    const key = LibText.Merge("_", true, detail.FileArchiveId, detail.RowId, lang);
    const label = LangLabelMap[lang] ?? lang;
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


/** 取得指定語系明細的檔案子資料。 */
const getFileArchiveFiles = (data: FileArchiveFormModel, parentRowId: number): FileArchiveDetail[] =>
{
    return findFileArchiveInfo(data, parentRowId)?._FileArchiveDetail ?? [];
};

/** 寫回指定語系明細的檔案子資料。 */
const setFileArchiveFiles = (data: FileArchiveFormModel, parentRowId: number, files: FileArchiveDetail[]): FileArchiveFormModel =>
{
    return updateFileArchiveInfo(data, parentRowId, info => ({ ...info, _FileArchiveDetail: files }));
};

/** 取得指定語系明細的網址子資料。 */
const getFileArchiveUrls = (data: FileArchiveFormModel, parentRowId: number): FileArchiveUrlDetail[] =>
{
    return findFileArchiveInfo(data, parentRowId)?._FileArchiveUrlDetail ?? [];
};

/** 寫回指定語系明細的網址子資料。 */
const setFileArchiveUrls = (data: FileArchiveFormModel, parentRowId: number, urls: FileArchiveUrlDetail[]): FileArchiveFormModel =>
{
    return updateFileArchiveInfo(data, parentRowId, info => ({ ...info, _FileArchiveUrlDetail: urls }));
};

/** 依 RowId 取得檔案室語系明細。 */
const findFileArchiveInfo = (data: FileArchiveFormModel, rowId: number): FileArchiveInfo | undefined =>
{
    return data._FileArchiveInfo?.find(info => Number(info.RowId ?? 0) === rowId);
};

/** 更新指定檔案室語系明細。 */
const updateFileArchiveInfo = (data: FileArchiveFormModel, rowId: number, updater: (info: FileArchiveInfo) => FileArchiveInfo): FileArchiveFormModel =>
{
    const infos = (data._FileArchiveInfo ?? []).map(info => Number(info.RowId ?? 0) === rowId ? updater(info) : info);
    return { ...data, _FileArchiveInfo: infos };
};

/** 建立檔案 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildFileArchiveFileGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getFileArchiveDetailTableTitle(displayName, FileArchiveInfoFields._FileArchiveDetail, "檔案上傳");

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
    const gridTitle = getFileArchiveDetailTableTitle(displayName, FileArchiveInfoFields._FileArchiveUrlDetail, "外部連結");

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

/** 依 RowNo 排序檔案，缺值時以 RowId 維持穩定順序。 */
const sortFileArchiveFiles = (files: FileArchiveDetail[]): FileArchiveDetail[] =>
{
    return [...files].sort(compareFileArchiveRowOrder);
};

/** 依 RowNo 排序外部連結，缺值時以 RowId 維持穩定順序。 */
const sortFileArchiveUrls = (urls: FileArchiveUrlDetail[]): FileArchiveUrlDetail[] =>
{
    return [...urls].sort(compareFileArchiveRowOrder);
};

/** 比較檔案室子資料顯示順序。 */
const compareFileArchiveRowOrder = (a: { RowId?: number; RowNo?: number | null; }, b: { RowId?: number; RowNo?: number | null; }): number =>
{
    const rowNoDiff = Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0);
    return rowNoDiff || Number(a.RowId ?? 0) - Number(b.RowId ?? 0);
};

/** 建立檔案 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildFileArchiveFileColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const fileNameTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveDetail, FileArchiveDetailFields.FileName, "檔案名稱");
    const fileIdTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveDetail, FileArchiveDetailFields.FileSrcId, "檔案");

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
        FileArchiveInfoFields._FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.UrlDescription,
        "網址描述",
    );
    const urlTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveUrlDetail, FileArchiveUrlDetailFields.Url, "網址");
    const targetTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveInfoFields._FileArchiveUrlDetail,
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
        RowNo: file.RowNo ?? index + 1,
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
        RowNo: url.RowNo ?? index + 1,
        FileArchiveId: url.FileArchiveId,
        ParentRowId: url.ParentRowId,
        UrlRowId: rowId,
        cells: buildFileArchiveUrlCells(url, displayName, windowTargetOpts),
    };
};

/** 建立檔案列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildFileArchiveFileCells = (file: FileArchiveDetail, onFileValueChange: EditGridCellValueChangeHandler, displayName: ModelDisplaySchema): RowCell[] =>
{
    const fileNameTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveDetail, FileArchiveDetailFields.FileName, "檔案名稱");
    const fileIdTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveDetail, FileArchiveDetailFields.FileSrcId, "檔案");

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
        FileArchiveInfoFields._FileArchiveUrlDetail,
        FileArchiveUrlDetailFields.UrlDescription,
        "網址描述",
    );
    const urlTitle = getFileArchiveDetailColumnTitle(displayName, FileArchiveInfoFields._FileArchiveUrlDetail, FileArchiveUrlDetailFields.Url, "網址");
    const targetTitle = getFileArchiveDetailColumnTitle(
        displayName,
        FileArchiveInfoFields._FileArchiveUrlDetail,
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

/** 建立新檔案 FormModel，分開保存穩定 RowId 與顯示 RowNo。 */
const buildNewFileArchiveFileItem = (data: FileArchiveFormModel, parentRowId: number, rowId: number, rowNo: number): FileArchiveDetail =>
{
    return { FileArchiveId: data.FileArchiveId, ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, FileSrcId: "", FileName: "" };
};

/** 建立新外部連結 FormModel，分開保存穩定 RowId 與顯示 RowNo。 */
const buildNewFileArchiveUrlItem = (data: FileArchiveFormModel, parentRowId: number, rowId: number, rowNo: number): FileArchiveUrlDetail =>
{
    return { FileArchiveId: data.FileArchiveId, ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, UrlDescription: "", Url: "", WindowTarget: 0 };
};

/** 將檔案 Grid Row 轉回 DTO，儲存時只送 FileSrcId，避免 FileManage 被 EF 當新資料重複新增。 */
const toFileArchiveFileDto = (source: FileArchiveFormModel, parentRowId: number, row: GridRow, index: number): FileArchiveDetail =>
{
    // 宣告變數
    const fileValue = toFileArchiveFileCellValue(getEditGridCellValue(row, FileArchiveDetailFields.FileSrcId));
    const fileName = getEditGridStringCellValue(row, FileArchiveDetailFields.FileName).trim();
    const fileSrcId = String(fileValue.internalId ?? "").trim();
    const rowId = Number((row as FileArchiveFileGridRow).FileRowId ?? row.RowId ?? row.rowId ?? index + 1);

    // return
    return {
        FileArchiveId: source.FileArchiveId || (row as FileArchiveFileGridRow).FileArchiveId || "",
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: index + 1,
        FileSrcId: fileSrcId,
        FileName: fileName,
    };
};

/** 將外部連結 Grid Row 轉回 DTO，RowId 依目前排序重新編號。 */
const toFileArchiveUrlDto = (source: FileArchiveFormModel, parentRowId: number, row: GridRow, index: number): FileArchiveUrlDetail =>
{
    const rowId = Number((row as FileArchiveUrlGridRow).UrlRowId ?? row.RowId ?? row.rowId ?? index + 1);
    return {
        FileArchiveId: source.FileArchiveId || (row as FileArchiveUrlGridRow).FileArchiveId || "",
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: index + 1,
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

    if (!selectedFile?.file)
    {
        return {
            value: buildEmptyFileArchiveFileCellValue(),
            rowValues: { [FileArchiveDetailFields.FileName]: "" },
        };
    }

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
    return { value: file, rowValues: { [FileArchiveDetailFields.FileName]: LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName) } };
};

/** 取得本次選檔的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedFileArchiveFileName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 建立空檔案值，用於使用者清除 file 欄位。 */
const buildEmptyFileArchiveFileCellValue = (): FileArchiveFileCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
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
