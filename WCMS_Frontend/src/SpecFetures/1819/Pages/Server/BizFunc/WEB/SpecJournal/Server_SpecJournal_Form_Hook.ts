import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormReferenceResult,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellValue,
    EditGridCellValueChangeArgs,
    EditGridCellValueChangeResult,
    EditGridFileValue,
    EditGridSelectOption,
    GridRow,
    IEditGridView_Style,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    toEditGridOptions,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import {
    PGID,
    SpecJournalAuthorFields,
    SpecJournalDocumentFields,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
    SpecJournalOpenPointFilesFields,
    SpecJournalRefFilesFields,
    SpecJournalSetFields,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

type SpecJournalAuthor = components["schemas"]["SpecJournalAuthor_DTO"];

type SpecJournalDocument = components["schemas"]["SpecJournalDocument_DTO"];

type SpecJournalOpenPointFiles = components["schemas"]["SpecJournalOpenPointFiles_DTO"];

type SpecJournalRefFiles = components["schemas"]["SpecJournalRefFiles_DTO"];

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

type ORCIDData = components["schemas"]["ORCIDData"];

export type SpecJournalMode = "preprint" | "journal";

export type SpecJournalAuthorRowKeys = Record<string, string | number | null | undefined>;

export type SpecJournalGridFileValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type SpecJournalFormRefs = {
    indexRawData: SpecJournalIndexSet[];
    tagOptionsRaw: Record<string, string>;
    specDocumentTypeOptionsRaw: Map<string, string>;
    specAuthorTypeOptionsRaw: Map<string, string>;
    keywords: SpecJournalSet[];
};

export type SpecJournalFormRawData = ServerFormDefaultRawData<SpecJournalSet, SpecJournalFormRefs>;

export type SpecJournalFormActionsOpt = {
    /** 儲存成功後回到列表 */
    onBackToList: () => void;

    /** 目前期刊表單模式 */
    journalMode: SpecJournalMode;
};

export type SpecJournalFormAdapter = {
    SpecJournal: ReturnType<typeof SpecJournalAdapter>;
    SpecJournalIndex: ReturnType<typeof SpecJournalIndexAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};

export interface UseSpecJournalAuthorOrcidOptions
{
    /** SpecJournal Adapter，提供 ORCID 查詢 API */
    adapter: ReturnType<typeof SpecJournalAdapter>;

    /** Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecJournalSet>;
}

export interface UseSpecJournalFileEditGridOptions
{
    /** Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecJournalSet>;

    /** EditGrid UI 樣式 */
    style: IEditGridView_Style;
}

export interface UseSpecJournalDocumentEditGridOptions extends UseSpecJournalFileEditGridOptions
{
    /** 說明文件類型選項 */
    documentTypeOptions: Map<string, string>;
}
type SpecJournalDocumentType = NonNullable<SpecJournalDocument["DocumentType"]>;
const DEFAULT_SPEC_JOURNAL_DOCUMENT_TYPE: SpecJournalDocumentType = 0;
const SPEC_JOURNAL_DOCUMENT_TYPES: readonly SpecJournalDocumentType[] = [0, 1, 2, 3, 4];
// #endregion

// #region Public
/** 建立 SpecJournal Spec Form Template，統一交給 Server_FormTemplate 處理資料流程 */
export const useSpecJournalFormTemplate = (
    opt: { lang: Lang; theme: IBETheme; internalId: string; emptyData: SpecJournalSet; actionsOpt: SpecJournalFormActionsOpt; },
): ServerFormTemplate<SpecJournalSet, SpecJournalFormAdapter, SpecJournalFormRefs, SpecJournalFormRawData, SpecJournalFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "SpecJournal",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildSpecJournalFormAdapter,
                selectDataAdapter: adapter => adapter.SpecJournal,
                buildTitle: buildSpecJournalFormTitle,
                buildInitialData: buildSpecJournalInitialData,
                useReferenceData: ctx => useSpecJournalReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立作者 ORCID 查詢動作，讓 Comp 不直接處理 API Toast 與回寫流程。 */
export const useSpecJournalAuthorOrcid = (
    opt: UseSpecJournalAuthorOrcidOptions,
): { handleOrcidBlur: (rowKeys: SpecJournalAuthorRowKeys, raw: string) => Promise<void>; } =>
{
    const { publish } = useToast();
    const orcidAction = opt.adapter.hooks.useGetAuthorByOrcid();
    const setAuthorOrcid = useCallback((rowKeys: SpecJournalAuthorRowKeys, orcid: string): void =>
    {
        updateSpecJournalAuthor(opt.binding, rowKeys, cur => ({ ...cur, ORCID: orcid }));
    }, [opt.binding]);
    const applyAuthorFromOrcid = useCallback((rowKeys: SpecJournalAuthorRowKeys, dto: ORCIDData): void =>
    {
        updateSpecJournalAuthor(opt.binding, rowKeys, cur => buildAuthorFromOrcid(cur, dto));
    }, [opt.binding]);

    const handleOrcidBlur = useCallback(async (rowKeys: SpecJournalAuthorRowKeys, raw: string): Promise<void> =>
    {
        const orcid = normalizeSpecJournalOrcid(raw);
        setAuthorOrcid(rowKeys, orcid);
        if (!orcid || !isLikelySpecJournalOrcid(orcid)) return;

        const res = await orcidAction.execute(orcid);
        (res.SysMessage ?? []).forEach(item =>
        {
            publish({ level: item.Status, code: item.MessageCode, title: item.Message });
        });
        if (!res.IsSuccess) return;

        const dto = Array.isArray(res.Data) ? (res.Data[0] ?? null) : null;
        if (!dto) return;
        applyAuthorFromOrcid(rowKeys, { ...dto, ORCID: orcid });
    }, [applyAuthorFromOrcid, orcidAction, publish, setAuthorOrcid]);

    return { handleOrcidBlur };
};

/** 建立開放觀點檔案 EditGrid，取代原本手動新增列的檔案區塊。 */
export const useSpecJournalOpenPointFileEditGrid = (opt: UseSpecJournalFileEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadSpecJournalFileValue(args, uploadFile.handleFileChange, SpecJournalOpenPointFilesFields.OpenPointFileName),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildSpecJournalOpenPointColumns(handleFileChange), [handleFileChange]);

    return useEditGridBinding<SpecJournalSet, SpecJournalOpenPointFiles>({
        binding: opt.binding,
        emptyData: buildEmptySpecJournalSet(),
        collectionName: SpecJournalSetFields.SpecJournalOpenPointFiles,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSpecJournalRows,
        createItem: ctx => ({ JournalId: ctx.data.SpecJournal?.JournalId, RowId: ctx.nextRowId, OpenPointFileId: null, OpenPointFileName: "" }),
        toRow: (item, index) => buildSpecJournalOpenPointRow(item, index, handleFileChange),
        toItem: (row, index, ctx) => buildSpecJournalOpenPointItem(row, index, ctx.data),
        editGridProps: buildSpecJournalFileGridProps("開放觀點", "SpecJournal_OpenPointFiles_EditGrid", opt.style),
    });
};

/** 建立相關檔案 EditGrid，取代原本手動新增列的檔案區塊。 */
export const useSpecJournalRefFileEditGrid = (opt: UseSpecJournalFileEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadSpecJournalFileValue(args, uploadFile.handleFileChange, SpecJournalRefFilesFields.RefFileName),
        [uploadFile.handleFileChange],
    );
    const columns = useMemo(() => buildSpecJournalRefFileColumns(handleFileChange), [handleFileChange]);

    return useEditGridBinding<SpecJournalSet, SpecJournalRefFiles>({
        binding: opt.binding,
        emptyData: buildEmptySpecJournalSet(),
        collectionName: SpecJournalSetFields.SpecJournalRefFiles,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSpecJournalRows,
        createItem: ctx => ({ JournalId: ctx.data.SpecJournal?.JournalId, RowId: ctx.nextRowId, RefFileId: null, RefFileName: "" }),
        toRow: (item, index) => buildSpecJournalRefFileRow(item, index, handleFileChange),
        toItem: (row, index, ctx) => buildSpecJournalRefFileItem(row, index, ctx.data),
        editGridProps: buildSpecJournalFileGridProps("相關檔案", "SpecJournal_RefFiles_EditGrid", opt.style),
    });
};

/** 建立說明文件 EditGrid，取代原本手動新增列的說明文件區塊。 */
export const useSpecJournalDocumentEditGrid = (opt: UseSpecJournalDocumentEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleFileChange = useCallback(
        (args: EditGridCellValueChangeArgs) => uploadSpecJournalFileValue(args, uploadFile.handleFileChange, SpecJournalDocumentFields.DocumentName),
        [uploadFile.handleFileChange],
    );
    const documentTypeOptions = useMemo(() => toEditGridOptions(Object.fromEntries(opt.documentTypeOptions.entries())), [opt.documentTypeOptions]);
    const columns = useMemo(() => buildSpecJournalDocumentColumns(documentTypeOptions, handleFileChange), [documentTypeOptions, handleFileChange]);

    return useEditGridBinding<SpecJournalSet, SpecJournalDocument>({
        binding: opt.binding,
        emptyData: buildEmptySpecJournalSet(),
        collectionName: SpecJournalSetFields.SpecJournalDocument,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSpecJournalRows,
        createItem: ctx => ({ JournalId: ctx.data.SpecJournal?.JournalId, RowId: ctx.nextRowId, DocumentId: null, DocumentName: "" }),
        toRow: (item, index) => buildSpecJournalDocumentRow(item, index, documentTypeOptions, handleFileChange),
        toItem: (row, index, ctx) => buildSpecJournalDocumentItem(row, index, ctx.data),
        editGridProps: buildSpecJournalFileGridProps("說明文件", "SpecJournal_Document_EditGrid", opt.style),
    });
};
// #endregion

// #region Private
/** 建立 SpecJournal Form 會使用到的 Adapter 群組 */
const buildSpecJournalFormAdapter = (): SpecJournalFormAdapter =>
{
    return { SpecJournal: SpecJournalAdapter(), SpecJournalIndex: SpecJournalIndexAdapter(), Tag: TagAdapter() };
};

/** 建立 SpecJournal Form 標題，依預刊本 / 期刊模式顯示 */
const buildSpecJournalFormTitle = (ctx: { mode: "new" | "edit"; actionsOpt: SpecJournalFormActionsOpt; }): string =>
{
    const displayName = ctx.actionsOpt.journalMode === "preprint" ? "預刊本" : "期刊";
    return `${ctx.mode === "edit" ? "修改" : "新增"}${displayName}`;
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__ */
const buildSpecJournalInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecJournalSet; }): ApiFormInitial<SpecJournalSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 取得 SpecJournal Header / Detail 需要的參照資料 */
const useSpecJournalReferenceData = (ctx: { adapter: SpecJournalFormAdapter; lang: Lang; }): ServerFormReferenceResult<SpecJournalFormRefs> =>
{
    const tag = ctx.adapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecJournal, lang: ctx.lang });
    const indexList = useSpecJournalIndexListByAdapter(ctx.adapter.SpecJournalIndex);
    const keywords = useSpecJournalKeywordsByAdapter(ctx.adapter.SpecJournal);
    const specDocumentType = useFetchEnumOptions("SpecDocumentType");
    const specAuthorType = useFetchEnumOptions("SpecAuthorType");

    return useMemo(() =>
    {
        return {
            refs: {
                indexRawData: indexList.rawData ?? [],
                tagOptionsRaw: tag.map ?? {},
                specDocumentTypeOptionsRaw: new Map<string, string>(Object.entries(specDocumentType.data ?? {})),
                specAuthorTypeOptionsRaw: new Map<string, string>(Object.entries(specAuthorType.data ?? {})),
                keywords: keywords.rawData ?? [],
            },
            isLoading: Boolean(tag.isLoading || indexList.isLoading || keywords.isLoading || specDocumentType.isLoading || specAuthorType.isLoading),
            errors: [tag.errorText, indexList.error, keywords.error, specDocumentType.error, specAuthorType.error],
            refetchRefData: async () =>
            {
                await Promise.all([tag.refetch(), indexList.refetch(), keywords.refetch()]);
            },
        };
    }, [
        indexList.error,
        indexList.isLoading,
        indexList.rawData,
        indexList.refetch,
        keywords.error,
        keywords.isLoading,
        keywords.rawData,
        keywords.refetch,
        specAuthorType.data,
        specAuthorType.error,
        specAuthorType.isLoading,
        specDocumentType.data,
        specDocumentType.error,
        specDocumentType.isLoading,
        tag.errorText,
        tag.isLoading,
        tag.map,
        tag.refetch,
    ]);
};

/** Index 下拉資料 */
const useSpecJournalIndexListByAdapter = (
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
): { rawData: SpecJournalIndexSet[]; isLoading: boolean; error: string | null; refetch: () => Promise<void>; } =>
{
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                SpecJournalIndexModelFields.IndexId,
                SpecJournalIndexModelFields.IndexName,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.IndexName, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    const refetch = useCallback(async () =>
    {
        await q.refetch();
    }, [q]);

    return { rawData: q.data ?? [], isLoading: q.isLoading, error: q.errorText, refetch };
};

/** 關鍵字建議來源資料 */
const useSpecJournalKeywordsByAdapter = (
    adapter: ReturnType<typeof SpecJournalAdapter>,
): { rawData: SpecJournalSet[]; isLoading: boolean; error: string | null; refetch: () => Promise<void>; } =>
{
    const q = adapter.hooks.useQueryList({
        condition: {
            Fields: [
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.LangCode}`,
                `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword}`,
            ],
            Condition: "",
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 0,
            PageSize: 0,
        },
        deps: [],
    });

    const refetch = useCallback(async () =>
    {
        await q.refetch();
    }, [q]);

    return { rawData: q.data ?? [], isLoading: q.isLoading, error: q.errorText, refetch };
};

/** 正規化 ORCID 輸入，支援網址貼上並移除不合法字元。 */
const normalizeSpecJournalOrcid = (value: string): string =>
{
    const text = String(value ?? "").trim();
    if (!text) return "";
    return text.replace(/^https?:\/\/orcid\.org\//i, "").replace(/\/+$/g, "").replace(/\s+/g, "").replace(/[^0-9X-]/gi, "");
};

/** 檢查 ORCID 是否符合 0000-0000-0000-0000 格式。 */
const isLikelySpecJournalOrcid = (value: string): boolean =>
{
    return /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/i.test(value);
};

/** 只在原欄位為空時回填 ORCID API 回傳資料，避免覆蓋使用者輸入。 */
const fillIfEmpty = (oldValue: string | null | undefined, newValue: string | null | undefined): string | null | undefined =>
{
    const oldText = String(oldValue ?? "").trim();
    const newText = String(newValue ?? "").trim();
    if (!oldText && newText) return newText;
    return oldValue;
};

/** 找出目前要更新的作者列位置。 */
const findSpecJournalAuthorIndex = (list: SpecJournalAuthor[], rowKeys: SpecJournalAuthorRowKeys): number =>
{
    return list.findIndex(item =>
        String(item?.[SpecJournalAuthorFields.JournalId] ?? "") === String(rowKeys?.[SpecJournalAuthorFields.JournalId] ?? "")
        && String(item?.[SpecJournalAuthorFields.RowId] ?? "") === String(rowKeys?.[SpecJournalAuthorFields.RowId] ?? "")
    );
};

/** 回寫指定作者列，集中處理 setFormData 的 immutable 更新。 */
const updateSpecJournalAuthor = (
    binding: ServerFormBinding<SpecJournalSet>,
    rowKeys: SpecJournalAuthorRowKeys,
    buildNext: (cur: SpecJournalAuthor) => SpecJournalAuthor,
): void =>
{
    binding.setFormData(prev =>
    {
        if (!prev) return prev;

        const list = prev.SpecJournalAuthor ?? [];
        const hitIdx = findSpecJournalAuthorIndex(list, rowKeys);
        if (hitIdx < 0) return prev;

        const nextList = [...list];
        nextList[hitIdx] = buildNext({ ...(nextList[hitIdx] ?? {}) });
        return { ...prev, SpecJournalAuthor: nextList };
    });
};

/** 將 ORCID API DTO 轉成作者列可回填資料。 */
const buildAuthorFromOrcid = (cur: SpecJournalAuthor, dto: ORCIDData): SpecJournalAuthor =>
{
    return {
        ...cur,
        ORCID: fillIfEmpty(cur.ORCID, dto?.ORCID),
        AuthorName: fillIfEmpty(cur.AuthorName, dto?.AuthorName),
        AuthorName_en: fillIfEmpty(cur.AuthorName_en, dto?.AuthorName_en),
        JobTitle: fillIfEmpty(cur.JobTitle, dto?.JobTitle),
        Unit: fillIfEmpty(cur.Unit, dto?.Unit),
        Unit_en: fillIfEmpty(cur.Unit_en, dto?.Unit_en),
        Email: fillIfEmpty(cur.Email, dto?.Email),
        Country: fillIfEmpty(cur.Country, dto?.Country),
    };
};

/** 建立空的期刊 Set，供 EditGrid 新增模式安全寫回 collection。 */
const buildEmptySpecJournalSet = (): SpecJournalSet =>
{
    return {
        SpecJournal: {},
        SpecJournalAuthor: [],
        SpecJournalRefFormat: [],
        SpecJournalOpenPointFiles: [],
        SpecJournalRefFiles: [],
        SpecJournalKeywords: [],
        SpecJournalDocument: [],
        SpecJournalTypes: [],
    };
};

/** 建立檔案類 EditGrid 固定設定。 */
const buildSpecJournalFileGridProps = (title: string, storageKey: string, style: IEditGridView_Style) =>
{
    return {
        title,
        style,
        storageKey,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        maxVisibleRows: 5,
        minTableWidth: 720,
        addButtonText: "新增附件",
        emptyText: `尚未建立${title}`,
        ariaLabel: `${title}編輯表格`,
    };
};

/** 建立開放觀點欄位設定。 */
const buildSpecJournalOpenPointColumns = (onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>): ColumnConfig[] =>
{
    return [{
        key: SpecJournalOpenPointFilesFields.OpenPointFileName,
        title: "開放觀點檔案名稱",
        width: 260,
        inputType: "text",
        editable: true,
        maxLength: 200,
    }, {
        key: SpecJournalOpenPointFilesFields.OpenPointFileId,
        title: "開放觀點檔案",
        width: 520,
        inputType: "file",
        editable: true,
        accept: "application/pdf",
        onValueChange: onFileChange,
    }];
};

/** 建立相關檔案欄位設定。 */
const buildSpecJournalRefFileColumns = (onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>): ColumnConfig[] =>
{
    return [{ key: SpecJournalRefFilesFields.RefFileName, title: "相關檔案名稱", width: 260, inputType: "text", editable: true, maxLength: 200 }, {
        key: SpecJournalRefFilesFields.RefFileId,
        title: "相關檔案",
        width: 520,
        inputType: "file",
        editable: true,
        accept: "application/pdf",
        onValueChange: onFileChange,
    }];
};

/** 建立說明文件欄位設定。 */
const buildSpecJournalDocumentColumns = (
    documentTypeOptions: EditGridSelectOption[],
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): ColumnConfig[] =>
{
    return [
        {
            key: SpecJournalDocumentFields.DocumentType,
            title: "說明檔案類型",
            width: 220,
            inputType: "selectSingle",
            editable: true,
            options: documentTypeOptions,
            searchable: true,
        },
        { key: SpecJournalDocumentFields.DocumentName, title: "說明檔案名稱", width: 260, inputType: "text", editable: true, maxLength: 200 },
        { key: SpecJournalDocumentFields.DocumentId, title: "說明檔案來源", width: 520, inputType: "file", editable: true, onValueChange: onFileChange },
    ];
};

/** 將開放觀點 DTO 轉成 EditGrid Row。 */
const buildSpecJournalOpenPointRow = (
    item: SpecJournalOpenPointFiles,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): GridRow =>
{
    const rowId = item.RowId ?? index + 1;
    return {
        keyId: String(rowId),
        RowId: rowId,
        rowId,
        cells: [
            buildEditGridCell(SpecJournalOpenPointFilesFields.OpenPointFileName, "開放觀點檔案名稱", item.OpenPointFileName ?? "", {
                inputType: "text",
                editable: true,
                maxLength: 200,
            }),
            buildEditGridCell(
                SpecJournalOpenPointFilesFields.OpenPointFileId,
                "開放觀點檔案",
                buildSpecJournalFileCellValue(item.OpenPointFileId, getSpecJournalDtoFileName(item.OpenPointFile), item.OpenPointFileName),
                { inputType: "file", editable: true, accept: "application/pdf", onValueChange: onFileChange },
            ),
        ],
    };
};

/** 將相關檔案 DTO 轉成 EditGrid Row。 */
const buildSpecJournalRefFileRow = (
    item: SpecJournalRefFiles,
    index: number,
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): GridRow =>
{
    const rowId = item.RowId ?? index + 1;
    return {
        keyId: String(rowId),
        RowId: rowId,
        rowId,
        cells: [
            buildEditGridCell(SpecJournalRefFilesFields.RefFileName, "相關檔案名稱", item.RefFileName ?? "", {
                inputType: "text",
                editable: true,
                maxLength: 200,
            }),
            buildEditGridCell(
                SpecJournalRefFilesFields.RefFileId,
                "相關檔案",
                buildSpecJournalFileCellValue(item.RefFileId, getSpecJournalDtoFileName(item.RefFile), item.RefFileName),
                { inputType: "file", editable: true, accept: "application/pdf", onValueChange: onFileChange },
            ),
        ],
    };
};

/** 將說明文件 DTO 轉成 EditGrid Row。 */
const buildSpecJournalDocumentRow = (
    item: SpecJournalDocument,
    index: number,
    documentTypeOptions: EditGridSelectOption[],
    onFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): GridRow =>
{
    const rowId = item.RowId ?? index + 1;
    return {
        keyId: String(rowId),
        RowId: rowId,
        rowId,
        cells: [
            buildEditGridCell(SpecJournalDocumentFields.DocumentType, "說明檔案類型", item.DocumentType ?? "", {
                inputType: "selectSingle",
                editable: true,
                options: documentTypeOptions,
                searchable: true,
            }),
            buildEditGridCell(SpecJournalDocumentFields.DocumentName, "說明檔案名稱", item.DocumentName ?? "", {
                inputType: "text",
                editable: true,
                maxLength: 200,
            }),
            buildEditGridCell(
                SpecJournalDocumentFields.DocumentId,
                "說明檔案來源",
                buildSpecJournalFileCellValue(item.DocumentId, getSpecJournalDtoFileName(item.Document), item.DocumentName),
                { inputType: "file", editable: true, onValueChange: onFileChange },
            ),
        ],
    };
};

/** 將 EditGrid Row 轉回開放觀點 DTO。 */
const buildSpecJournalOpenPointItem = (row: GridRow, index: number, data: SpecJournalSet): SpecJournalOpenPointFiles =>
{
    const file = toSpecJournalFileCellValue(getEditGridCellValue(row, SpecJournalOpenPointFilesFields.OpenPointFileId));
    return {
        JournalId: data.SpecJournal?.JournalId,
        RowId: index + 1,
        OpenPointFileId: file.internalId || null,
        OpenPointFileName: getSpecJournalEditGridFileName(row, SpecJournalOpenPointFilesFields.OpenPointFileName, file),
    };
};

/** 將 EditGrid Row 轉回相關檔案 DTO。 */
const buildSpecJournalRefFileItem = (row: GridRow, index: number, data: SpecJournalSet): SpecJournalRefFiles =>
{
    const file = toSpecJournalFileCellValue(getEditGridCellValue(row, SpecJournalRefFilesFields.RefFileId));
    return {
        JournalId: data.SpecJournal?.JournalId,
        RowId: index + 1,
        RefFileId: file.internalId || null,
        RefFileName: getSpecJournalEditGridFileName(row, SpecJournalRefFilesFields.RefFileName, file),
    };
};

/** 判斷說明文件類型是否符合 API Schema 允許值。 */
const isSpecJournalDocumentType = (value: number): value is SpecJournalDocumentType =>
{
    return SPEC_JOURNAL_DOCUMENT_TYPES.includes(value as SpecJournalDocumentType);
};

/** 將 EditGrid 文件類型轉成 API Schema 允許的文件類型。 */
const toSpecJournalDocumentType = (value: EditGridCellValue): SpecJournalDocumentType =>
{
    const documentType = Number(value ?? DEFAULT_SPEC_JOURNAL_DOCUMENT_TYPE);

    if (isSpecJournalDocumentType(documentType)) return documentType;

    return DEFAULT_SPEC_JOURNAL_DOCUMENT_TYPE;
};
/** 將 EditGrid Row 轉回說明文件 DTO。 */
const buildSpecJournalDocumentItem = (row: GridRow, index: number, data: SpecJournalSet): SpecJournalDocument =>
{
    const file = toSpecJournalFileCellValue(getEditGridCellValue(row, SpecJournalDocumentFields.DocumentId));
    return {
        JournalId: data.SpecJournal?.JournalId,
        RowId: index + 1,
        DocumentType: toSpecJournalDocumentType(getEditGridCellValue(row, SpecJournalDocumentFields.DocumentType)),
        DocumentId: file.internalId || null,
        DocumentName: getSpecJournalEditGridFileName(row, SpecJournalDocumentFields.DocumentName, file),
    };
};

/** 依 RowId 排序 EditGrid 資料。 */
const sortSpecJournalRows = <T extends { RowId?: number | null; }>(items: T[]): T[] =>
{
    return [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 上傳期刊檔案並回寫 EditGrid file value。 */
const uploadSpecJournalFileValue = async (
    args: EditGridCellValueChangeArgs,
    handleFileChange: UploadFileHandler,
    fileNameField: string,
): Promise<EditGridCellValueChangeResult> =>
{
    const selectedFile = getSelectedSpecJournalFile(args.nextValue);
    if (!selectedFile?.file) return { value: buildEmptySpecJournalFileCellValue() };

    let uploadedValue = toSpecJournalFileCellValue(args.value);
    const originalName = getSpecJournalSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, uploadedName) =>
    {
        uploadedValue = buildUploadedSpecJournalFileCellValue(internalId, uploadedName || originalName);
    });

    const displayName = LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName || uploadedValue.fileName);
    return { value: uploadedValue, rowValues: { [fileNameField]: displayName } };
};

/** 建立既有檔案的 EditGrid value。 */
const buildSpecJournalFileCellValue = (internalId?: string | null, originalName?: string | null, displayName?: string | null): SpecJournalGridFileValue =>
{
    const id = String(internalId ?? "").trim();
    const name = String(originalName || displayName || id).trim();
    return {
        internalId: id,
        fileName: name,
        originalFileName: String(originalName ?? ""),
        url: getSpecJournalFilePreviewUrl(id),
        downloadUrl: getSpecJournalFileDownloadUrl(id),
    };
};

/** 建立上傳後的 EditGrid 檔案值。 */
const buildUploadedSpecJournalFileCellValue = (internalId: string, originalName?: string): SpecJournalGridFileValue =>
{
    return {
        internalId,
        fileName: originalName ?? internalId,
        originalFileName: originalName ?? "",
        url: getSpecJournalFilePreviewUrl(internalId),
        downloadUrl: getSpecJournalFileDownloadUrl(internalId),
    };
};

/** 建立空檔案值。 */
const buildEmptySpecJournalFileCellValue = (): SpecJournalGridFileValue =>
{
    return { internalId: "", fileName: "", originalFileName: "" };
};

/** 將任意 EditGrid value 正規化成期刊檔案值。 */
const toSpecJournalFileCellValue = (value: EditGridCellValue): SpecJournalGridFileValue =>
{
    if (isSpecJournalFileValue(value)) return value;
    if (typeof value === "string") return buildSpecJournalFileCellValue(value);
    return buildEmptySpecJournalFileCellValue();
};

/** 判斷是否為期刊檔案值。 */
const isSpecJournalFileValue = (value: EditGridCellValue): value is SpecJournalGridFileValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

/** 取得剛選取的檔案。 */
const getSelectedSpecJournalFile = (value: EditGridCellValue): SpecJournalGridFileValue | null =>
{
    if (!isSpecJournalFileValue(value)) return null;
    return value;
};

/** 取得上傳前原始檔名。 */
const getSpecJournalSelectedFileName = (file: SpecJournalGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 取得 DTO 檔案物件中的原始檔名。 */
const getSpecJournalDtoFileName = (file?: { FileName?: string | null; fileName?: string | null; } | null): string =>
{
    return String(file?.FileName ?? file?.fileName ?? "").trim();
};

/** 取得檔案預覽網址。 */
const getSpecJournalFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得檔案下載網址。 */
const getSpecJournalFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 取得 EditGrid 中使用者輸入的檔案名稱，空值時回退檔案原始名稱。 */
const getSpecJournalEditGridFileName = (row: GridRow, fieldName: string, file: SpecJournalGridFileValue): string =>
{
    const manualName = String(getEditGridCellValue(row, fieldName) ?? "").trim();
    if (manualName) return manualName;

    return LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName || file.fileName);
};

// #endregion
