import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
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
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getSelectedEditGridFile,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, type Lang, LangLabelMap, normalizeSupportedLang, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibAttachment, LibText } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_HookFunc/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AnnouncementDetailFields, AnnouncementDetailFileFields, AnnouncementSetFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { buildServerSupportedLangDetailMap } from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Helper";

// #region Property
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

type AnnouncementDetail = NonNullable<AnnouncementSet["AnnouncementDetail"]>[number];

type AnnouncementDetailFile = components["schemas"]["AnnouncementDetailFile_DTO"];

export type AnnouncementFileCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

export type AnnouncementFileGridRow = GridRow & { AnnouncementId?: string | null; ParentRowId?: number | null; FileRowId?: number | null; };

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type AnnouncementDetailRowKeys = Record<string, string | number | boolean | null | undefined>;

export interface UseAnnouncementFileEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** 目前語系明細 RowId，附件用它綁 ParentRowId */
    parentRowId: number;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}

export interface UseAnnouncementDetailTabsOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<AnnouncementSet>;

    /** 目前語系，會優先排在第一個 Tab */
    lang: Lang;
}

export interface AnnouncementDetailTabItem
{
    /** Tab key，給 TabContentComp 對應內容 */
    key: string;

    /** Tab 顯示文字 */
    label: string;

    /** Detail 原始 DTO */
    detail: AnnouncementDetail;

    /** Detail row keys，給 useSetTableField 綁定欄位 */
    rowKeys: AnnouncementDetailRowKeys;

    /** Detail RowId，給附件 SubDetail 綁 ParentRowId */
    detailRowId: number;
}

export interface AnnouncementDetailTabsResult
{
    /** TabContentComp 使用的 tab item map */
    tabItems: Record<string, string>;

    /** Comp 渲染 Detail 欄位使用的 tab items */
    items: AnnouncementDetailTabItem[];
}

export type AnnouncementFormRefs = { categoryMap: Record<string, string>; tagMap: Record<string, string>; statusOpts: Record<string, string>; };

export type AnnouncementFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;

    /** 以目前 DTO 觸發 preview（由 Component 決定怎麼開 modal） */
    onPreviewFromDto: (dto: AnnouncementSet) => void;
};

export type AnnouncementFormAdapter = {
    Announcement: ReturnType<typeof AnnouncementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
// #endregion

// #region Public
export const announcementEmptyData: AnnouncementSet = { Announcement: {}, AnnouncementDetail: [], AnnouncementDetailFile: [] };

/** 建立 Announcement Form Template，統一交給 Server_FormTemplate 處理資料流程 */
export const useAnnouncementFormTemplate = (
    opt: { lang: Lang; theme: IBETheme; internalId: string; emptyData: AnnouncementSet; actionsOpt: AnnouncementFormActionsOpt; },
): ServerFormTemplate<
    AnnouncementSet,
    AnnouncementFormAdapter,
    AnnouncementFormRefs,
    ServerFormDefaultRawData<AnnouncementSet, AnnouncementFormRefs>,
    AnnouncementFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "Announcement",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildAnnouncementFormAdapter,
                selectDataAdapter: adapter => adapter.Announcement,
                buildTitle: buildAnnouncementFormTitle,
                buildInitialData: buildAnnouncementInitialData,
                useReferenceData: ctx => useAnnouncementReferenceData({ ...ctx, lang: opt.lang }),
                buildActions: buildAnnouncementActions,
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立公告 Detail 語系 Tabs，避免 Comp 處理語系過濾與 Unknown fallback。 */
export const useAnnouncementDetailTabs = (opt: UseAnnouncementDetailTabsOptions): AnnouncementDetailTabsResult =>
{
    const details = opt.binding.data?.AnnouncementDetail;

    return useMemo(() =>
    {
        return buildAnnouncementDetailTabs(details ?? [], opt.lang);
    }, [details, opt.lang]);
};

/** 建立公告附件 EditGrid 的資料綁定流程，Comp 只需掛載 EditGrid。 */
export const useAnnouncementFileEditGrid = (opt: UseAnnouncementFileEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildAnnouncementFileColumns(displayName), [displayName]);
    const handleFileValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadAnnouncementFileValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<AnnouncementSet, AnnouncementDetailFile, AnnouncementFileGridRow>({
        binding: opt.binding,
        emptyData: announcementEmptyData,
        collectionName: AnnouncementSetFields.AnnouncementDetailFile,
        parent: buildAnnouncementFileParent(opt.parentRowId),
        columns,
        getItemRowId: file => file.RowId,
        sortItems: sortAnnouncementFiles,
        createItem: ctx => buildNewAnnouncementFileItem(ctx.data, opt.parentRowId, ctx.nextRowId),
        toRow: (file, index) => buildAnnouncementFileGridRow(file, index, handleFileValueChange, displayName),
        toItem: (row, index, ctx) => toAnnouncementFileDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildAnnouncementFileGridProps(opt.parentRowId, opt.style, displayName),
    });
};

/** 建立附件 CellValue，附件欄位顯示原始檔名與 internalId，不混用附件名稱。 */
export const buildAnnouncementFileCellValue = (file: AnnouncementDetailFile): AnnouncementFileCellValue =>
{
    const internalId = file.FileId ?? file.File?.InternalId ?? "";
    const originalName = file.File?.FileName ?? "";

    return {
        internalId,
        fileName: buildAnnouncementFileFieldDisplayName(originalName, internalId),
        originalFileName: originalName,
        url: getAnnouncementFilePreviewUrl(internalId),
        downloadUrl: getAnnouncementFileDownloadUrl(internalId),
    };
};

/** 上傳後建立新的附件 CellValue，檔案欄位固定顯示原始檔名與 internalId。 */
export const buildUploadedAnnouncementFileCellValue = (
    _current: AnnouncementFileCellValue,
    internalId: string,
    originalName?: string,
): AnnouncementFileCellValue =>
{
    const safeOriginalName = originalName ?? "";

    return {
        internalId,
        fileName: buildAnnouncementFileFieldDisplayName(safeOriginalName, internalId),
        originalFileName: safeOriginalName,
        url: getAnnouncementFilePreviewUrl(internalId),
        downloadUrl: getAnnouncementFileDownloadUrl(internalId),
    };
};

/** 將 EditGrid 值正規化成附件 CellValue。 */
export const toAnnouncementFileCellValue = (value: EditGridCellValue): AnnouncementFileCellValue =>
{
    if (isAnnouncementFileCellValue(value)) return value;
    if (typeof value === "string") return { internalId: value, fileName: buildAnnouncementFileFieldDisplayName("", value) };
    return { fileName: "", internalId: "" };
};

/** 取得附件欄位顯示名稱。 */
export const getAnnouncementFileDisplayName = (file: AnnouncementFileCellValue): string =>
{
    return (file.fileName || buildAnnouncementFileFieldDisplayName(file.originalFileName, file.internalId)).trim();
};

/** 開啟附件下載。 */
export const openAnnouncementFileDownload = (fileId: string): void =>
{
    const url = getAnnouncementFileDownloadUrl(fileId);
    if (!url || typeof window === "undefined") return;
    window.open(url, "_blank", "noopener");
};
// #endregion

// #region Private
/** 建立 Announcement Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildAnnouncementFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getAnnouncementModelTitle(ctx.displayName, "公告");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 取得公告 Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getAnnouncementModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildAnnouncementInitialData = (ctx: { mode: "new" | "edit"; emptyData: AnnouncementSet; }): ApiFormInitial<AnnouncementSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Announcement Form 會使用到的 Adapter 群組 */
const buildAnnouncementFormAdapter = (): AnnouncementFormAdapter =>
{
    return { Announcement: AnnouncementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
};

/** 取得 Header / Detail 需要的參照資料 */
const useAnnouncementReferenceData = (
    ctx: { adapter: AnnouncementFormAdapter; binding: ServerFormDefaultRawData<AnnouncementSet, AnnouncementFormRefs>["formData"]; lang: Lang; },
) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: AnnouncementSetFields.Announcement,
        detailName: AnnouncementSetFields.AnnouncementDetail,
        parentKeys: [AnnouncementDetailFields.AnnouncementId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.Announcement, lang: ctx.lang });
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.Announcement, lang: ctx.lang });
    const statusOpts = useContentStatusOptions();

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {}, tagMap: tag.map ?? {}, statusOpts: statusOpts.data },
            isLoading: Boolean(category.isLoading || tag.isLoading || statusOpts.isLoading),
            errors: [category.errorText, tag.errorText, statusOpts.error],
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
    ]);
};

/** 建立 Toolbar 動作，保留公告預覽行為 */
const buildAnnouncementActions = (
    ctx: { binding: ServerFormDefaultRawData<AnnouncementSet, AnnouncementFormRefs>["formData"]; actionsOpt: AnnouncementFormActionsOpt; },
    defaultActions: ServerFormActions,
): ServerFormActions =>
{
    return { ...defaultActions, Preview: () => ctx.actionsOpt.onPreviewFromDto(ctx.binding.data) };
};

/** ContentStatus enum options（去掉 key=0） */
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

/** 建立 Announcement Detail 語系分頁資料。 */
const buildAnnouncementDetailTabs = (details: AnnouncementDetail[], preferLang: Lang): AnnouncementDetailTabsResult =>
{
    const supportedDetails = filterSupportedDetailRows(details, preferLang);
    const tabItems = buildAnnouncementDetailTabItems(supportedDetails);

    return { tabItems, items: supportedDetails };
};

/** 依支援語系排序並過濾 Detail，避免無效語系產生 Unknown Tab。 */
const filterSupportedDetailRows = (details: AnnouncementDetail[], preferLang: Lang): AnnouncementDetailTabItem[] =>
{
    const detailMap = buildServerSupportedLangDetailMap(details);
    const langs = buildSupportedLangOrder(preferLang);

    return langs.map((lang, index) => buildAnnouncementDetailTabItem(detailMap.get(lang.toLowerCase()), index)).filter((
        item,
    ): item is AnnouncementDetailTabItem => Boolean(item));
};

/** 建立單一 Detail Tab 項目。 */
const buildAnnouncementDetailTabItem = (detail: AnnouncementDetail | undefined, index: number): AnnouncementDetailTabItem | null =>
{
    if (!detail) return null;

    const lang = normalizeSupportedLang(detail.Lang);
    if (!lang) return null;

    const key = LibText.Merge("_", true, detail.AnnouncementId, detail.RowId, lang);
    const label = LangLabelMap[lang] ?? lang;
    const detailRowId = Number(detail.RowId ?? index + 1);
    const rowKeys = buildAnnouncementDetailRowKeys(detail);

    return { key, label, detail, rowKeys, detailRowId };
};

/** 建立 Detail RowKeys，統一將 null 轉成 undefined。 */
const buildAnnouncementDetailRowKeys = (detail: AnnouncementDetail): AnnouncementDetailRowKeys =>
{
    // 宣告變數
    const lang = normalizeSupportedLang(detail.Lang);

    // return
    return {
        [AnnouncementDetailFields.AnnouncementId]: toBindingRowKey(detail.AnnouncementId),
        [AnnouncementDetailFields.RowId]: toBindingRowKey(detail.RowId),
        [AnnouncementDetailFields.Lang]: lang,
    };
};

/** 建立 Detail TabContentComp 需要的 item map。 */
const buildAnnouncementDetailTabItems = (items: AnnouncementDetailTabItem[]): Record<string, string> =>
{
    return items.reduce<Record<string, string>>((tabItems, item) =>
    {
        tabItems[item.key] = item.label;
        return tabItems;
    }, {});
};

/** 將 DTO 的 null key 轉成 binding 可接受的 undefined。 */
const toBindingRowKey = (value: string | number | null | undefined): string | number | null | undefined =>
{
    // return
    return value;
};

/** 建立附件 parent 綁定，讓共用 Hook 自動過濾同語系附件。 */
const buildAnnouncementFileParent = (parentRowId: number) =>
{
    return {
        field: AnnouncementDetailFileFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 建立附件 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildAnnouncementFileGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getAnnouncementDetailFileTableTitle(displayName, "附件");

    return {
        title: gridTitle,
        ariaLabel: `公告語系 ${parentRowId} ${gridTitle}清單`,
        style,
        storageKey: `server-announcement-file-grid-${parentRowId}`,
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

/** 依 RowId 排序附件。 */
const sortAnnouncementFiles = (files: AnnouncementDetailFile[]): AnnouncementDetailFile[] =>
{
    return [...files].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 建立附件 Grid 欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildAnnouncementFileColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const fileNameTitle = getAnnouncementDetailFileColumnTitle(displayName, AnnouncementDetailFileFields.FileName, "附件名稱");
    const fileIdTitle = getAnnouncementDetailFileColumnTitle(displayName, AnnouncementDetailFileFields.FileId, "附件");

    return [{ key: AnnouncementDetailFileFields.FileName, title: fileNameTitle, width: 260, inputType: "text", editable: true, maxLength: 200 }, {
        key: AnnouncementDetailFileFields.FileId,
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

/** 將附件 DTO 轉成 EditGrid Row。 */
const buildAnnouncementFileGridRow = (
    file: AnnouncementDetailFile,
    index: number,
    onFileValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): AnnouncementFileGridRow =>
{
    const rowId = Number(file.RowId ?? index + 1);

    return {
        keyId: buildAnnouncementFileRowKey(file, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        AnnouncementId: file.AnnouncementId,
        ParentRowId: file.ParentRowId,
        FileRowId: rowId,
        cells: buildAnnouncementFileCells(file, onFileValueChange, displayName),
    };
};

/** 建立附件列的 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildAnnouncementFileCells = (
    file: AnnouncementDetailFile,
    onFileValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): RowCell[] =>
{
    const fileNameTitle = getAnnouncementDetailFileColumnTitle(displayName, AnnouncementDetailFileFields.FileName, "附件名稱");
    const fileIdTitle = getAnnouncementDetailFileColumnTitle(displayName, AnnouncementDetailFileFields.FileId, "附件");

    return [
        buildEditGridCell(AnnouncementDetailFileFields.FileName, fileNameTitle, file.FileName ?? "", { inputType: "text", editable: true, maxLength: 200 }),
        buildEditGridCell(AnnouncementDetailFileFields.FileId, fileIdTitle, buildAnnouncementFileCellValue(file), {
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

/** 取得附件 DetailFile 表格顯示名稱，避免 Grid 標題寫死。 */
const getAnnouncementDetailFileTableTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === AnnouncementSetFields.AnnouncementDetailFile);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 取得附件 DetailFile 欄位顯示名稱，避免 EditGrid 欄位標題寫死。 */
const getAnnouncementDetailFileColumnTitle = (displayName: ModelDisplaySchema, columnId: string, fallback: string): string =>
{
    return getModelColumnTitle(displayName, AnnouncementSetFields.AnnouncementDetailFile, columnId, fallback);
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

/** 建立新附件 DTO，RowId 由共用 Hook 推算。 */
const buildNewAnnouncementFileItem = (data: AnnouncementSet, parentRowId: number, rowId: number): AnnouncementDetailFile =>
{
    return { AnnouncementId: data.Announcement?.AnnouncementId, ParentRowId: parentRowId, RowId: rowId, FileId: "", FileName: "" };
};

/** 將附件 Grid Row 轉回 DTO，RowId 依目前排序重新編號。 */
const toAnnouncementFileDto = (source: AnnouncementSet, parentRowId: number, row: GridRow, index: number): AnnouncementDetailFile =>
{
    // 宣告變數
    const fileValue = toAnnouncementFileCellValue(getEditGridCellValue(row, AnnouncementDetailFileFields.FileId));
    const fileName = getEditGridStringCellValue(row, AnnouncementDetailFileFields.FileName).trim();
    const fileId = String(fileValue.internalId ?? "").trim();

    // return
    return {
        AnnouncementId: source.Announcement?.AnnouncementId ?? (row as AnnouncementFileGridRow).AnnouncementId,
        ParentRowId: parentRowId,
        RowId: index + 1,
        FileId: fileId,
        FileName: fileName,
    };
};

/** 使用 EditGrid 內建 file 欄位選檔後，上傳並轉回 Announcement 附件值。 */
const uploadAnnouncementFileValue = async (args: EditGridCellValueChangeArgs, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const current = toAnnouncementFileCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);

    if (!selectedFile?.file) return { value: buildEmptyAnnouncementFileCellValue() };

    let uploadedValue: AnnouncementFileCellValue = current;
    const selectedOriginalName = getSelectedAnnouncementFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedAnnouncementFileCellValue(current, internalId, originalName || selectedOriginalName);
    });

    return buildAnnouncementFileUploadChangeResult(uploadedValue);
};

/** 建立附件上傳後的欄位更新結果，同步覆蓋附件名稱。 */
const buildAnnouncementFileUploadChangeResult = (file: AnnouncementFileCellValue): EditGridCellValueChangeResult =>
{
    return { value: file, rowValues: { [AnnouncementDetailFileFields.FileName]: LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName) } };
};

/** 取得本次選檔的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedAnnouncementFileName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 建立空附件值，用於使用者清除 file 欄位。 */
const buildEmptyAnnouncementFileCellValue = (): AnnouncementFileCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 判斷是否為附件 CellValue。 */
const isAnnouncementFileCellValue = (value: EditGridCellValue): value is AnnouncementFileCellValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立檔案欄位顯示文字：原始檔名 (internalId)。 */
const buildAnnouncementFileFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = String(originalName ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 取得附件預覽網址，保留給 EditGrid file value 使用。 */
const getAnnouncementFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得附件下載網址。 */
const getAnnouncementFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 建立附件 Row key。 */
const buildAnnouncementFileRowKey = (file: AnnouncementDetailFile, index: number): string =>
{
    return `announcement-file-${file.AnnouncementId ?? "new"}-${file.ParentRowId ?? 0}-${file.RowId ?? index + 1}`;
};
// #endregion
