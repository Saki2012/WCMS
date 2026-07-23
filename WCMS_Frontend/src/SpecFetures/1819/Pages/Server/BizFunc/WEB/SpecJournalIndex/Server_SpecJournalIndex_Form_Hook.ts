import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
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
    GridRow,
    IEditGridView_Style,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridCellValue,
    getEditGridRowId,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecJournalIndexDetailFields, SpecJournalIndexModelFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";

// #region Property
type SpecJournalIndexFormModel = components["schemas"]["SpecJournalIndex"];

type SpecJournalIndexDetail = components["schemas"]["SpecJournalIndexDetail"];

export type SpecJournalIndexGridFileValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type SpecJournalIndexFormRefs = { categoryMap: Record<string, string>; };

export type SpecJournalIndexFormRawData = ServerFormDefaultRawData<SpecJournalIndexFormModel, SpecJournalIndexFormRefs>;

export type SpecJournalIndexFormAdapter = { SpecJournalIndex: ReturnType<typeof SpecJournalIndexAdapter>; Category: ReturnType<typeof CategoryAdapter>; };

export type SpecJournalIndexFormActionsOpt = {
    /** 儲存成功後回列表 */
    onBackToList: () => void;
};

export interface UseSpecJournalIndexDetailEditGridOptions
{
    /** Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecJournalIndexFormModel>;

    /** EditGrid UI 樣式 */
    style: IEditGridView_Style;
}
// #endregion

// #region Public
/** 建立 SpecJournalIndex Spec Form Template，統一交給 Server_FormTemplate 處理資料流程 */
export const useSpecJournalIndexFormTemplate = (
    opt: { lang: Lang; theme: IBETheme; internalId: string; emptyData: SpecJournalIndexFormModel; actionsOpt: SpecJournalIndexFormActionsOpt; },
): ServerFormTemplate<
    SpecJournalIndexFormModel,
    SpecJournalIndexFormAdapter,
    SpecJournalIndexFormRefs,
    SpecJournalIndexFormRawData,
    SpecJournalIndexFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "SpecJournalIndex",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildSpecJournalIndexFormAdapter,
                selectDataAdapter: adapter => adapter.SpecJournalIndex,
                buildTitle: buildSpecJournalIndexFormTitle,
                buildInitialData: buildSpecJournalIndexInitialData,
                useReferenceData: ctx => useSpecJournalIndexReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立期刊目次明細 EditGrid，取代原本每一期一個 Tab 的維護方式。 */
export const useSpecJournalIndexDetailEditGrid = (opt: UseSpecJournalIndexDetailEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const handleSummaryFileChange = useCallback((args: EditGridCellValueChangeArgs) => uploadSpecJournalIndexFileValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);
    const columns = useMemo(() => buildSpecJournalIndexDetailColumns(handleSummaryFileChange), [handleSummaryFileChange]);

    return useEditGridBinding<SpecJournalIndexFormModel, SpecJournalIndexDetail>({
        binding: opt.binding,
        emptyData: { _SpecJournalIndexDetail: [] },
        collectionName: SpecJournalIndexModelFields._SpecJournalIndexDetail,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: items => [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0)),
        createItem: ctx => buildSpecJournalIndexDetailCreateItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildSpecJournalIndexDetailGridRow(item, index, handleSummaryFileChange),
        toItem: (row, index, ctx) => buildSpecJournalIndexDetailItem(row, index, ctx.data),
        editGridProps: buildSpecJournalIndexDetailGridProps(opt.style),
    });
};
// #endregion

// #region Private
/** 建立 SpecJournalIndex Form 會使用到的 Adapter 群組 */
const buildSpecJournalIndexFormAdapter = (): SpecJournalIndexFormAdapter =>
{
    return { SpecJournalIndex: SpecJournalIndexAdapter(), Category: CategoryAdapter() };
};

/** 建立 SpecJournalIndex Form 標題，保留原本固定標題行為 */
const buildSpecJournalIndexFormTitle = (ctx: { displayName: ModelDisplaySchema; }): string =>
{
    return ctx.displayName.ModelDisplayName || "期刊目次";
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__ */
const buildSpecJournalIndexInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecJournalIndexFormModel; }): ApiFormInitial<SpecJournalIndexFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 取得 SpecJournalIndex 參照資料，保留原本 Category 查詢入口 */
const useSpecJournalIndexReferenceData = (ctx: { adapter: SpecJournalIndexFormAdapter; lang: Lang; }): ServerFormReferenceResult<SpecJournalIndexFormRefs> =>
{
    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.SpecJournalIndex, lang: ctx.lang });

    return useMemo(() =>
    {
        return {
            refs: { categoryMap: category.map ?? {} },
            isLoading: Boolean(category.isLoading),
            errors: [category.errorText],
            refetchRefData: async () =>
            {
                await Promise.resolve(category.refetch());
            },
        };
    }, [category.errorText, category.isLoading, category.map, category.refetch]);
};

/** 建立期刊目次明細 Grid 欄位設定。 */
const buildSpecJournalIndexDetailColumns = (
    onSummaryFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): ColumnConfig[] =>
{
    return [
        { key: SpecJournalIndexDetailFields.Volume, title: "卷數", inputType: "number", editable: true, min: 0, required: true },
        { key: SpecJournalIndexDetailFields.Issue, title: "期數", inputType: "text", editable: true, maxLength: 50, required: true },
        { key: SpecJournalIndexDetailFields.IsSpecial, title: "是否為特刊", inputType: "checkboxSingle", editable: true },
        { key: SpecJournalIndexDetailFields.PublishDate, title: "出版日期", inputType: "date", editable: true },
        { key: SpecJournalIndexDetailFields.SeasonNo, title: "季號", inputType: "text", editable: true, maxLength: 50 },
        { key: SpecJournalIndexDetailFields.SummaryFileName, title: "期刊檔案名稱", width: 260, inputType: "text", editable: true, maxLength: 200 },
        {
            key: SpecJournalIndexDetailFields.SummaryFileId,
            title: "期刊檔案",
            width: 520,
            inputType: "file",
            editable: true,
            accept: "application/pdf",
            onValueChange: onSummaryFileChange,
        },
    ];
};

/** 建立期刊目次明細 EditGrid 固定設定。 */
const buildSpecJournalIndexDetailGridProps = (style: IEditGridView_Style) =>
{
    return {
        title: "期刊目次明細",
        style,
        storageKey: "SpecJournalIndex_Detail_EditGrid",
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: false,
        showRowNo: true,
        maxVisibleRows: 5,
        minTableWidth: 960,
        addButtonText: "新增期刊目次明細",
        emptyText: "尚未建立期刊目次明細",
        ariaLabel: "期刊目次明細編輯表格",
    };
};

/** 建立新增的期刊目次明細 Model。 */
const buildSpecJournalIndexDetailCreateItem = (data: SpecJournalIndexFormModel, rowId: number): SpecJournalIndexDetail =>
{
    const base = data._SpecJournalIndexDetail ?? [];
    const firstVolume = base[0]?.Volume;
    return {
        IndexId: data.IndexId,
        RowId: rowId,
        Volume: typeof firstVolume === "number" ? firstVolume : 1,
        Issue: String(getNextSpecJournalIndexIssue(base, firstVolume)),
    };
};

/** 將期刊目次明細 Model 轉成 EditGrid Row。 */
const buildSpecJournalIndexDetailGridRow = (
    item: SpecJournalIndexDetail,
    index: number,
    onSummaryFileChange: (args: EditGridCellValueChangeArgs) => Promise<EditGridCellValueChangeResult>,
): GridRow =>
{
    const rowId = item.RowId ?? index + 1;
    return {
        keyId: String(rowId),
        RowId: rowId,
        rowId,
        cells: [
            buildEditGridCell(SpecJournalIndexDetailFields.Volume, "卷數", item.Volume ?? 1, { inputType: "number", editable: true, min: 0, required: true }),
            buildEditGridCell(SpecJournalIndexDetailFields.Issue, "期數", item.Issue ?? "", {
                inputType: "text",
                editable: true,
                maxLength: 50,
                required: true,
            }),
            buildEditGridCell(SpecJournalIndexDetailFields.IsSpecial, "是否為特刊", Boolean(item.IsSpecial), { inputType: "checkboxSingle", editable: true }),
            buildEditGridCell(SpecJournalIndexDetailFields.PublishDate, "出版日期", item.PublishDate ?? "", { inputType: "date", editable: true }),
            buildEditGridCell(SpecJournalIndexDetailFields.SeasonNo, "季號", item.SeasonNo ?? "", { inputType: "text", editable: true, maxLength: 50 }),
            buildEditGridCell(SpecJournalIndexDetailFields.SummaryFileName, "期刊檔案名稱", item.SummaryFileName ?? "", { inputType: "text", editable: true, maxLength: 200 }),
            buildEditGridCell(
                SpecJournalIndexDetailFields.SummaryFileId,
                "期刊檔案",
                buildSpecJournalIndexFileCellValue(item.SummaryFileId, getSpecJournalIndexModelFileName(item.SummaryFile), item.SummaryFileName),
                { inputType: "file", editable: true, accept: "application/pdf", onValueChange: onSummaryFileChange },
            ),
        ],
    };
};

/** 將 EditGrid Row 轉回期刊目次明細 Model。 */
const buildSpecJournalIndexDetailItem = (row: GridRow, index: number, data: SpecJournalIndexFormModel): SpecJournalIndexDetail =>
{
    const file = toSpecJournalIndexFileCellValue(getEditGridCellValue(row, SpecJournalIndexDetailFields.SummaryFileId));
    const rowId = getEditGridRowId(row, index);
    return {
        IndexId: data.IndexId,
        RowId: rowId,
        Volume: Number(getEditGridCellValue(row, SpecJournalIndexDetailFields.Volume) ?? 0),
        Issue: getEditGridStringCellValue(row, SpecJournalIndexDetailFields.Issue),
        IsSpecial: Boolean(getEditGridCellValue(row, SpecJournalIndexDetailFields.IsSpecial)),
        PublishDate: getEditGridStringCellValue(row, SpecJournalIndexDetailFields.PublishDate),
        SeasonNo: getEditGridStringCellValue(row, SpecJournalIndexDetailFields.SeasonNo),
        SummaryFileId: file.internalId || null,
        SummaryFileName: getSpecJournalIndexEditGridFileName(row, SpecJournalIndexDetailFields.SummaryFileName, file),
    };
};

/** 上傳期刊目次檔案並回寫 EditGrid file value。 */
const uploadSpecJournalIndexFileValue = async (
    args: EditGridCellValueChangeArgs,
    handleFileChange: UploadFileHandler,
): Promise<EditGridCellValueChangeResult> =>
{
    const selectedFile = getSelectedSpecJournalIndexFile(args.nextValue);
    if (!selectedFile?.file)
    {
        return {
            value: buildEmptySpecJournalIndexFileCellValue(),
            rowValues: { [SpecJournalIndexDetailFields.SummaryFileName]: "" },
        };
    }

    let uploadedValue = toSpecJournalIndexFileCellValue(args.value);
    const originalName = getSpecJournalIndexSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, uploadedName) =>
    {
        uploadedValue = buildUploadedSpecJournalIndexFileCellValue(internalId, uploadedName || originalName);
    });

    const displayName = LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName || uploadedValue.fileName);
    return { value: uploadedValue, rowValues: { [SpecJournalIndexDetailFields.SummaryFileName]: displayName } };
};

/** 建立既有檔案的 EditGrid value。 */
const buildSpecJournalIndexFileCellValue = (
    internalId?: string | null,
    originalName?: string | null,
    displayName?: string | null,
): SpecJournalIndexGridFileValue =>
{
    const id = String(internalId ?? "").trim();
    const name = String(originalName || displayName || id).trim();
    return {
        internalId: id,
        fileName: name,
        originalFileName: String(originalName ?? ""),
        url: getSpecJournalIndexFilePreviewUrl(id),
        downloadUrl: getSpecJournalIndexFileDownloadUrl(id),
    };
};

/** 建立上傳後的 EditGrid 檔案值。 */
const buildUploadedSpecJournalIndexFileCellValue = (internalId: string, originalName?: string): SpecJournalIndexGridFileValue =>
{
    return {
        internalId,
        fileName: originalName ?? internalId,
        originalFileName: originalName ?? "",
        url: getSpecJournalIndexFilePreviewUrl(internalId),
        downloadUrl: getSpecJournalIndexFileDownloadUrl(internalId),
    };
};

/** 建立空檔案值。 */
const buildEmptySpecJournalIndexFileCellValue = (): SpecJournalIndexGridFileValue =>
{
    return { internalId: "", fileName: "", originalFileName: "" };
};

/** 將任意 EditGrid value 正規化成期刊目次檔案值。 */
const toSpecJournalIndexFileCellValue = (value: EditGridCellValue): SpecJournalIndexGridFileValue =>
{
    if (isSpecJournalIndexFileValue(value)) return value;
    if (typeof value === "string") return buildSpecJournalIndexFileCellValue(value);
    return buildEmptySpecJournalIndexFileCellValue();
};

/** 判斷是否為期刊目次檔案值。 */
const isSpecJournalIndexFileValue = (value: EditGridCellValue): value is SpecJournalIndexGridFileValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

/** 取得剛選取的檔案。 */
const getSelectedSpecJournalIndexFile = (value: EditGridCellValue): SpecJournalIndexGridFileValue | null =>
{
    if (!isSpecJournalIndexFileValue(value)) return null;
    return value;
};

/** 取得上傳前原始檔名。 */
const getSpecJournalIndexSelectedFileName = (file: SpecJournalIndexGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 取得 Model 檔案物件中的原始檔名。 */
const getSpecJournalIndexModelFileName = (file?: { FileName?: string | null; fileName?: string | null; } | null): string =>
{
    return String(file?.FileName ?? file?.fileName ?? "").trim();
};

/** 取得檔案預覽網址。 */
const getSpecJournalIndexFilePreviewUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得檔案下載網址。 */
const getSpecJournalIndexFileDownloadUrl = (fileId?: string | null): string | undefined =>
{
    const id = String(fileId ?? "").trim();
    return id ? `/Service/FileManagement/Server_Download/${encodeURIComponent(id)}` : undefined;
};

/** 取得新增時下一個期數。 */
const getNextSpecJournalIndexIssue = (items: SpecJournalIndexDetail[], volume?: number | null): number =>
{
    const targetVolume = typeof volume === "number" ? volume : 1;
    const maxIssue = items.reduce((max, item) =>
    {
        if (Number(item.Volume ?? 0) !== targetVolume) return max;
        const issue = Number(item.Issue ?? 0);
        return Number.isFinite(issue) && issue > max ? issue : max;
    }, 0);
    return maxIssue + 1;
};

/** 取得 EditGrid 中使用者輸入的期刊檔案名稱，空值時回退檔案原始名稱。 */
const getSpecJournalIndexEditGridFileName = (row: GridRow, fieldName: string, file: SpecJournalIndexGridFileValue): string =>
{
    const inputName = getEditGridStringCellValue(row, fieldName).trim();
    if (inputName) return inputName;
    return LibAttachment.getDisplayFileNameWithoutExtension(file.originalFileName || file.fileName);
};

// #endregion
