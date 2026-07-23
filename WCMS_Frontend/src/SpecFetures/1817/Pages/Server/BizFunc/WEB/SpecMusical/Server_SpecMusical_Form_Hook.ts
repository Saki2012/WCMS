import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormReferenceResult,
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
    getEditGridNullableStringCellValue,
    getEditGridNumberCellValue,
    getEditGridRowId,
    getEditGridStringCellValue,
    getSelectedEditGridFile,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { LibAttachment } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, SpecMusicalFields, SpecMusicalPictureListFields, SpecMusicalSoundListFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useMemo, useState } from "react";

// #region Property
type SpecMusicalFormModel = components["schemas"]["SpecMusical"];

type SpecMusicalPictureList = components["schemas"]["SpecMusicalPictureList"];

type SpecMusicalSoundList = components["schemas"]["SpecMusicalSoundList"];

type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];

export type SpecMusicalPictureCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

export type SpecMusicalSoundCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };

export type SpecMusicalPictureGridRow = GridRow & { MusicalId?: string | null; PictureRowId?: number | null; };

export type SpecMusicalSoundGridRow = GridRow & { MusicalId?: string | null; SoundRowId?: number | null; };

export type SpecMusicalFormRefs = {
    /** 樂器類別選項 */
    categoryMap: Record<string, string>;
};

export type SpecMusicalFormRawData = ServerFormDefaultRawData<SpecMusicalFormModel, SpecMusicalFormRefs>;

export type SpecMusicalFormActionsOpt = {
    /** 儲存成功後回列表 */
    onBackToList: () => void;
};

export type SpecMusicalFormAdapter = {
    SpecMusical: ReturnType<typeof SpecMusicalAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};

export interface UseSpecMusicalFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: SpecMusicalFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: SpecMusicalFormActionsOpt;
}

export interface UseSpecMusicalPhotoEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecMusicalFormModel>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 相片預覽渲染，畫面職責留在 Comp */
    renderPicturePreview: (args: EditGridCellRenderArgs) => ReactNode;

    /** 封面選擇渲染，畫面職責留在 Comp */
    renderCoverSelector: (args: EditGridCellRenderArgs) => ReactNode;
}

export interface UseSpecMusicalSoundEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecMusicalFormModel>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 音檔預覽渲染，畫面職責留在 Comp */
    renderSoundPreview: (args: EditGridCellRenderArgs) => ReactNode;
}

export interface SpecMusicalCoverSelectorResult
{
    /** 目前封面圖片 internalId */
    selected: string | null;

    /** 設定封面圖片 */
    select: (picId: string) => void;
}

export interface UseSpecMusicalBatchPhotoUploadOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<SpecMusicalFormModel>;
}

export interface SpecMusicalUploadedPhoto
{
    /** 上傳後回傳的檔案 internalId */
    internalId: string;

    /** 使用者上傳時的原始檔名 */
    originalFileName: string;

    /** 不含副檔名的預設說明 */
    info: string;
}

export interface SpecMusicalBatchPhotoUploadResult
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

    /** 上傳並新增相片資料 */
    uploadSelectedFiles: () => Promise<void>;
}

const SpecMusicalPictureTableId = SpecMusicalFields._SpecMusicalPictureList.replace(/^_/, "");

const SpecMusicalSoundTableId = SpecMusicalFields._SpecMusicalSoundList.replace(/^_/, "");
// #endregion

// #region Public
export const specMusicalEmptyData: SpecMusicalFormModel = { MusicalId: "", MusicalName: "", _SpecMusicalPictureList: [], _SpecMusicalSoundList: [] };

export const SpecMusicalCoverColumnKey = "__SpecMusicalCover";

/** 建立 SpecMusical Spec Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useSpecMusicalFormTemplate = (
    opt: UseSpecMusicalFormTemplateOptions,
): ServerFormTemplate<SpecMusicalFormModel, SpecMusicalFormAdapter, SpecMusicalFormRefs, SpecMusicalFormRawData, SpecMusicalFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "SpecMusical",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            spec: {
                buildAdapter: buildSpecMusicalFormAdapter,
                selectDataAdapter: adapter => adapter.SpecMusical,
                buildTitle: buildSpecMusicalFormTitle,
                buildInitialData: buildSpecMusicalInitialData,
                useReferenceData: ctx => useSpecMusicalReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立相片 EditGrid binding，Comp 只需掛載 EditGrid 與提供畫面 render。 */
export const useSpecMusicalPhotoEditGrid = (opt: UseSpecMusicalPhotoEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildSpecMusicalPhotoColumns(displayName), [displayName]);
    const handlePictureValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadSpecMusicalPictureValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<SpecMusicalFormModel, SpecMusicalPictureList, SpecMusicalPictureGridRow>({
        binding: opt.binding,
        emptyData: specMusicalEmptyData,
        collectionName: SpecMusicalFields._SpecMusicalPictureList,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSpecMusicalPictureList,
        createItem: ctx => buildNewSpecMusicalPictureItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildSpecMusicalPictureGridRow(item, index, opt, handlePictureValueChange, displayName),
        toItem: (row, index, ctx) => toSpecMusicalPictureModel(ctx.data, row, index),
        beforeCommit: ctx => syncSpecMusicalPictureCommit(ctx.data, ctx.nextVisibleItems),
        onDeleteRow: ctx => syncSpecMusicalCoverAfterDelete(opt.binding, ctx.row),
        editGridProps: buildSpecMusicalPhotoGridProps(opt.style, displayName),
    });
};

/** 建立音檔 EditGrid binding，Comp 只需掛載 EditGrid 與提供畫面 render。 */
export const useSpecMusicalSoundEditGrid = (opt: UseSpecMusicalSoundEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildSpecMusicalSoundColumns(displayName), [displayName]);
    const handleSoundValueChange = useCallback((args: EditGridCellValueChangeArgs) => uploadSpecMusicalSoundValue(args, uploadFile.handleFileChange), [
        uploadFile.handleFileChange,
    ]);

    return useEditGridBinding<SpecMusicalFormModel, SpecMusicalSoundList, SpecMusicalSoundGridRow>({
        binding: opt.binding,
        emptyData: specMusicalEmptyData,
        collectionName: SpecMusicalFields._SpecMusicalSoundList,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortSpecMusicalSoundList,
        createItem: ctx => buildNewSpecMusicalSoundItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildSpecMusicalSoundGridRow(item, index, opt, handleSoundValueChange, displayName),
        toItem: (row, index, ctx) => toSpecMusicalSoundModel(ctx.data, row, index),
        beforeCommit: ctx => syncSpecMusicalSoundCommit(ctx.data, ctx.nextVisibleItems),
        editGridProps: buildSpecMusicalSoundGridProps(opt.style, displayName),
    });
};

/** 管理樂器封面圖片，避免 Comp 直接操作 FormModel。 */
export const useSpecMusicalCoverSelector = (binding: ServerFormBinding<SpecMusicalFormModel>): SpecMusicalCoverSelectorResult =>
{
    const selected = binding.data?.CoverPicId ?? null;

    const select = useCallback((picId: string) =>
    {
        binding.setFormData(prev =>
        {
            const data = prev ?? specMusicalEmptyData;
            return { ...data, CoverPicId: picId };
        });
    }, [binding]);

    return useMemo(() => ({ selected, select }), [select, selected]);
};

/** 批次上傳相片，和 EditGrid 單筆新增按鈕分離。 */
export const useSpecMusicalBatchPhotoUpload = (opt: UseSpecMusicalBatchPhotoUploadOptions): SpecMusicalBatchPhotoUploadResult =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const clearSelectedFiles = useCallback(() => setSelectedFiles([]), []);
    const uploadSelectedFiles = useCallback(async () =>
    {
        await uploadSpecMusicalBatchPhotoFiles({
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

/** 將 EditGrid 值正規化為相片 CellValue，提供 Comp 預覽使用。 */
export const toSpecMusicalPictureCellValue = (value: EditGridCellValue): SpecMusicalPictureCellValue =>
{
    if (isSpecMusicalPictureCellValue(value)) return value;
    if (typeof value === "string") return buildExistingSpecMusicalPictureCellValue(value);
    return buildEmptySpecMusicalPictureCellValue();
};

/** 將 EditGrid 值正規化為音檔 CellValue，提供 Comp 預覽使用。 */
export const toSpecMusicalSoundCellValue = (value: EditGridCellValue): SpecMusicalSoundCellValue =>
{
    if (isSpecMusicalSoundCellValue(value)) return value;
    if (typeof value === "string") return buildExistingSpecMusicalSoundCellValue(value, value);
    return buildEmptySpecMusicalSoundCellValue();
};

/** 取得後台相片預覽網址。 */
export const getSpecMusicalPicturePreviewUrl = (picId?: string | null): string | undefined =>
{
    const id = String(picId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 取得後台音檔預覽網址。 */
export const getSpecMusicalSoundPreviewUrl = (soundId?: string | null): string | undefined =>
{
    const id = String(soundId ?? "").trim();
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};

/** 讀取 Header 欄位顯示名稱，保留後續擴充位置。 */
export const getSpecMusicalHeaderColumnTitle = (displayName: ModelDisplaySchema, columnId: string, fallback: string): string =>
{
    return getSpecMusicalColumnTitle(displayName, PGID.SpecMusical, columnId, fallback);
};

/** 取得音檔唯讀檔名。 */
export const getSpecMusicalSoundDisplayName = (value: EditGridCellValue): string =>
{
    const sound = toSpecMusicalSoundCellValue(value);
    return getEditGridStringCellValue({ keyId: "sound-display", cells: [buildEditGridCell("fileName", "檔案名稱", sound.fileName)] }, "fileName");
};

/** 保留欄位名稱常數給外部 Comp 避免直接引用 SchemaFields。 */
export const SpecMusicalDisplayFields = {
    CategoryId: SpecMusicalFields.CategoryId,
    MusicalName: SpecMusicalFields.MusicalName,
    Specification: SpecMusicalFields.Specification,
    Headstock: SpecMusicalFields.Headstock,
    Backboard: SpecMusicalFields.Backboard,
    ScaleLength: SpecMusicalFields.ScaleLength,
    Bridge: SpecMusicalFields.Bridge,
    BodyForm: SpecMusicalFields.BodyForm,
    Material: SpecMusicalFields.Material,
    Info: SpecMusicalFields.Info,
} as const;
// #endregion

// #region Private
/** 建立 SpecMusical Form 會使用到的 Adapter 群組。 */
const buildSpecMusicalFormAdapter = (): SpecMusicalFormAdapter =>
{
    return { SpecMusical: SpecMusicalAdapter(), Category: CategoryAdapter() };
};

/** 建立 SpecMusical Form 標題，ModelDisplayName 無資料時使用固定名稱。 */
const buildSpecMusicalFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const title = ctx.displayName.ModelDisplayName || "琵琶介紹";
    return `${ctx.mode === "edit" ? "修改" : "新增"}${title}`;
};

/** 建立新增模式的 initial data，避免新增時查詢 __new__。 */
const buildSpecMusicalInitialData = (ctx: { mode: "new" | "edit"; emptyData: SpecMusicalFormModel; }): ApiFormInitial<SpecMusicalFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 取得 SpecMusical Header 需要的參照資料。 */
const useSpecMusicalReferenceData = (
    ctx: { adapter: SpecMusicalFormAdapter; lang: Lang; },
): ServerFormReferenceResult<SpecMusicalFormRefs> =>
{
    const category = ctx.adapter.Category.hooks.useMapByProgId({ progId: PGID.SpecMusical, lang: ctx.lang });

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

/** 建立相片 EditGrid 固定設定。 */
const buildSpecMusicalPhotoGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getSpecMusicalTableTitle(displayName, SpecMusicalPictureTableId, "相片");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-spec-musical-photo-grid",
        minTableWidth: 980,
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

/** 建立音檔 EditGrid 固定設定。 */
const buildSpecMusicalSoundGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getSpecMusicalTableTitle(displayName, SpecMusicalSoundTableId, "音檔");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-spec-musical-sound-grid",
        minTableWidth: 880,
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

/** 建立相片 Grid 欄位設定。 */
const buildSpecMusicalPhotoColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const picTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.PicSrcId, "相片");
    const sortTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.Sort, "排序");
    const infoTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.Info, "相片說明");

    return [
        { key: SpecMusicalPictureListFields.PicSrcId, title: picTitle, width: 300, inputType: "file", editable: true, accept: "image/*", maxFileCount: 1, maxFileSizeMB: 10 },
        { key: SpecMusicalCoverColumnKey, title: "封面", width: 120, inputType: "readonly", editable: false },
        { key: SpecMusicalPictureListFields.Sort, title: sortTitle, width: 120, inputType: "number", editable: true, min: 0 },
        { key: SpecMusicalPictureListFields.Info, title: infoTitle, width: 320, inputType: "textarea", editable: true, rows: 3, maxLength: 500 },
    ];
};

/** 建立音檔 Grid 欄位設定。 */
const buildSpecMusicalSoundColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const soundTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalSoundTableId, SpecMusicalSoundListFields.SoundSrcId, "音檔");
    const infoTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalSoundTableId, SpecMusicalSoundListFields.Info, "音檔名稱 / 說明");

    return [
        {
            key: SpecMusicalSoundListFields.SoundSrcId,
            title: soundTitle,
            width: 360,
            inputType: "file",
            editable: true,
            accept: "audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg",
            maxFileCount: 1,
            maxFileSizeMB: 20,
        },
        { key: SpecMusicalSoundListFields.Info, title: infoTitle, width: 360, inputType: "text", editable: true, maxLength: 200 },
    ];
};

/** 將相片明細 Model 轉成 EditGrid Row。 */
const buildSpecMusicalPictureGridRow = (
    item: SpecMusicalPictureList,
    index: number,
    opt: UseSpecMusicalPhotoEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): SpecMusicalPictureGridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);

    return {
        keyId: buildSpecMusicalPictureRowKey(item, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        MusicalId: item.MusicalId,
        PictureRowId: rowId,
        cells: buildSpecMusicalPictureCells(item, opt, onPictureValueChange, displayName),
    };
};

/** 將音檔明細 Model 轉成 EditGrid Row。 */
const buildSpecMusicalSoundGridRow = (
    item: SpecMusicalSoundList,
    index: number,
    opt: UseSpecMusicalSoundEditGridOptions,
    onSoundValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): SpecMusicalSoundGridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);

    return {
        keyId: buildSpecMusicalSoundRowKey(item, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        MusicalId: item.MusicalId,
        SoundRowId: rowId,
        cells: buildSpecMusicalSoundCells(item, opt, onSoundValueChange, displayName),
    };
};

/** 建立相片列 Cells。 */
const buildSpecMusicalPictureCells = (
    item: SpecMusicalPictureList,
    opt: UseSpecMusicalPhotoEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): RowCell[] =>
{
    const picTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.PicSrcId, "相片");
    const sortTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.Sort, "排序");
    const infoTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalPictureTableId, SpecMusicalPictureListFields.Info, "相片說明");
    const pictureValue = buildSpecMusicalPictureCellValue(item);

    return [
        buildEditGridCell(SpecMusicalPictureListFields.PicSrcId, picTitle, pictureValue, {
            inputType: "file",
            editable: true,
            accept: "image/*",
            maxFileCount: 1,
            maxFileSizeMB: 10,
            render: opt.renderPicturePreview,
            onValueChange: onPictureValueChange,
        }),
        buildEditGridCell(SpecMusicalCoverColumnKey, "封面", pictureValue, { inputType: "readonly", editable: false, render: opt.renderCoverSelector }),
        buildEditGridCell(SpecMusicalPictureListFields.Sort, sortTitle, Number(item.Sort ?? item.RowId ?? 0), { inputType: "number", editable: true, min: 0 }),
        buildEditGridCell(SpecMusicalPictureListFields.Info, infoTitle, item.Info ?? "", { inputType: "textarea", editable: true, rows: 3, maxLength: 500 }),
    ];
};

/** 建立音檔列 Cells。 */
const buildSpecMusicalSoundCells = (
    item: SpecMusicalSoundList,
    opt: UseSpecMusicalSoundEditGridOptions,
    onSoundValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): RowCell[] =>
{
    const soundTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalSoundTableId, SpecMusicalSoundListFields.SoundSrcId, "音檔");
    const infoTitle = getSpecMusicalColumnTitle(displayName, SpecMusicalSoundTableId, SpecMusicalSoundListFields.Info, "音檔名稱 / 說明");

    return [
        buildEditGridCell(SpecMusicalSoundListFields.SoundSrcId, soundTitle, buildSpecMusicalSoundCellValue(item), {
            inputType: "file",
            editable: true,
            accept: "audio/*,.mp3,.wav,.flac,.m4a,.aac,.ogg",
            maxFileCount: 1,
            maxFileSizeMB: 20,
            render: opt.renderSoundPreview,
            onValueChange: onSoundValueChange,
        }),
        buildEditGridCell(SpecMusicalSoundListFields.Info, infoTitle, item.Info ?? "", { inputType: "text", editable: true, maxLength: 200 }),
    ];
};

/** 建立新相片明細。 */
const buildNewSpecMusicalPictureItem = (data: SpecMusicalFormModel, rowId: number): SpecMusicalPictureList =>
{
    return { MusicalId: data.MusicalId, RowId: rowId, PicSrcId: "", Sort: rowId, Info: "" };
};

/** 建立新音檔明細。 */
const buildNewSpecMusicalSoundItem = (data: SpecMusicalFormModel, rowId: number): SpecMusicalSoundList =>
{
    return { MusicalId: data.MusicalId, RowId: rowId, SoundSrcId: "", Info: "" };
};

/** 將相片 Grid Row 轉回明細 Model。 */
const toSpecMusicalPictureModel = (source: SpecMusicalFormModel, row: GridRow, index: number): SpecMusicalPictureList =>
{
    const pictureValue = toSpecMusicalPictureCellValue(getEditGridCellValue(row, SpecMusicalPictureListFields.PicSrcId));
    const rowId = getEditGridRowId(row, index);

    return {
        MusicalId: source.MusicalId ?? (row as SpecMusicalPictureGridRow).MusicalId,
        RowId: rowId,
        PicSrcId: pictureValue.internalId ?? "",
        Sort: getEditGridNumberCellValue(row, SpecMusicalPictureListFields.Sort, index + 1),
        Info: getEditGridNullableStringCellValue(row, SpecMusicalPictureListFields.Info),
    };
};

/** 將音檔 Grid Row 轉回明細 Model。 */
const toSpecMusicalSoundModel = (source: SpecMusicalFormModel, row: GridRow, index: number): SpecMusicalSoundList =>
{
    const soundValue = toSpecMusicalSoundCellValue(getEditGridCellValue(row, SpecMusicalSoundListFields.SoundSrcId));

    return {
        MusicalId: source.MusicalId ?? (row as SpecMusicalSoundGridRow).MusicalId,
        RowId: getEditGridRowId(row, index),
        SoundSrcId: soundValue.internalId ?? "",
        Info: getEditGridNullableStringCellValue(row, SpecMusicalSoundListFields.Info),
    };
};

/** 相片 Commit 前同步排序與封面。 */
const syncSpecMusicalPictureCommit = (data: SpecMusicalFormModel, nextItems: SpecMusicalPictureList[]): SpecMusicalPictureList[] =>
{
    const sortedItems = nextItems.map((item, index) => ({ ...item, Sort: index + 1 }));
    data.CoverPicId = syncSpecMusicalCoverFromPictures(data, sortedItems).CoverPicId;

    return sortedItems;
};

/** 音檔 Commit 前同步 RowId，保留畫面排序。 */
const syncSpecMusicalSoundCommit = (_data: SpecMusicalFormModel, nextItems: SpecMusicalSoundList[]): SpecMusicalSoundList[] =>
{
    return nextItems.map((item, index) => ({ ...item, RowId: item.RowId ?? index + 1 }));
};


/** 使用 EditGrid 內建 file 欄位選圖後，上傳並同步相片說明。 */
const uploadSpecMusicalPictureValue = async (args: EditGridCellValueChangeArgs, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const current = toSpecMusicalPictureCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);

    if (!selectedFile?.file) return { value: buildEmptySpecMusicalPictureCellValue(), rowValues: { [SpecMusicalPictureListFields.Info]: "" } };

    let uploadedValue: SpecMusicalPictureCellValue = current;
    const selectedOriginalName = getSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedSpecMusicalPictureCellValue(internalId, originalName || selectedOriginalName);
    });

    const fileTitle = LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName || uploadedValue.fileName);
    return { value: uploadedValue, rowValues: { [SpecMusicalPictureListFields.Info]: fileTitle } };
};

/** 批次上傳所有選取相片，成功後一次寫入 Form data。 */
const uploadSpecMusicalBatchPhotoFiles = async (
    opt: {
        binding: ServerFormBinding<SpecMusicalFormModel>;
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
        const uploaded = await uploadSpecMusicalPhotoFilesSequentially(opt.files, opt.uploadFile);
        appendSpecMusicalUploadedPhotos(opt.binding, uploaded);
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

/** 逐檔上傳圖片，保留原始檔名供預設說明使用。 */
const uploadSpecMusicalPhotoFilesSequentially = async (files: File[], uploadFile: UploadFileHandler): Promise<SpecMusicalUploadedPhoto[]> =>
{
    const result: SpecMusicalUploadedPhoto[] = [];

    for (const file of files)
    {
        const uploaded = await uploadSingleSpecMusicalPhotoFile(file, uploadFile);
        result.push(uploaded);
    }

    return result;
};

/** 上傳單張圖片並轉為批次相片資料。 */
const uploadSingleSpecMusicalPhotoFile = async (file: File, uploadFile: UploadFileHandler): Promise<SpecMusicalUploadedPhoto> =>
{
    let uploadedId = "";
    const originalFileName = file.name;

    await uploadFile([file], (internalId) =>
    {
        uploadedId = internalId;
    });

    if (!uploadedId) throw new Error(`Upload ${originalFileName}: missing InternalId`);
    return { internalId: uploadedId, originalFileName, info: LibAttachment.getDisplayFileNameWithoutExtension(originalFileName) };
};

/** 將批次上傳結果追加成 SpecMusicalPictureList。 */
const appendSpecMusicalUploadedPhotos = (binding: ServerFormBinding<SpecMusicalFormModel>, uploaded: SpecMusicalUploadedPhoto[]): void =>
{
    binding.setFormData(prev => appendSpecMusicalUploadedPhotosToData(prev ?? specMusicalEmptyData, uploaded));
};

/** 將批次相片寫入資料，若尚無封面則使用第一張圖。 */
const appendSpecMusicalUploadedPhotosToData = (data: SpecMusicalFormModel, uploaded: SpecMusicalUploadedPhoto[]): SpecMusicalFormModel =>
{
    const list = data._SpecMusicalPictureList ?? [];
    const startRowId = getNextSpecMusicalPictureRowId(list);
    const newItems = uploaded.map((item, index) => buildUploadedSpecMusicalPictureModel(data.MusicalId, startRowId + index, item));

    return {
        ...data,
        CoverPicId: data.CoverPicId ?? uploaded[0]?.internalId ?? null,
        _SpecMusicalPictureList: [...list, ...newItems],
        _SpecMusicalSoundList: data._SpecMusicalSoundList ?? [],
    };
};

/** 建立批次上傳後的相片明細 Model。 */
const buildUploadedSpecMusicalPictureModel = (musicalId: string | null | undefined, rowId: number, item: SpecMusicalUploadedPhoto): SpecMusicalPictureList =>
{
    return { MusicalId: musicalId, RowId: rowId, PicSrcId: item.internalId, Sort: rowId, Info: item.info };
};

/** 取得下一個相片 RowId，避免批次新增覆蓋既有列。 */
const getNextSpecMusicalPictureRowId = (items: SpecMusicalPictureList[]): number =>
{
    const maxRowId = items.reduce((max, item) => Math.max(max, Number(item.RowId ?? 0)), 0);
    return maxRowId + 1;
};

/** 使用 EditGrid 內建 file 欄位選音檔後，上傳並同步音檔名稱。 */
const uploadSpecMusicalSoundValue = async (args: EditGridCellValueChangeArgs, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const current = toSpecMusicalSoundCellValue(args.value);
    const selectedFile = getSelectedEditGridFile(args.nextValue);

    if (!selectedFile?.file) return { value: buildEmptySpecMusicalSoundCellValue(), rowValues: { [SpecMusicalSoundListFields.Info]: "" } };

    let uploadedValue: SpecMusicalSoundCellValue = current;
    const selectedOriginalName = getSelectedFileName(selectedFile);

    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedSpecMusicalSoundCellValue(internalId, originalName || selectedOriginalName);
    });

    const fileTitle = LibAttachment.getDisplayFileNameWithoutExtension(uploadedValue.originalFileName || uploadedValue.fileName);
    return { value: uploadedValue, rowValues: { [SpecMusicalSoundListFields.Info]: fileTitle } };
};

/** 建立相片 CellValue。 */
const buildSpecMusicalPictureCellValue = (item: SpecMusicalPictureList): SpecMusicalPictureCellValue =>
{
    return buildExistingSpecMusicalPictureCellValue(item.PicSrcId ?? "");
};

/** 建立音檔 CellValue。 */
const buildSpecMusicalSoundCellValue = (item: SpecMusicalSoundList): SpecMusicalSoundCellValue =>
{
    const fileName = item.SoundSrc?.FileName ?? item.Info ?? item.SoundSrcId ?? "";
    const mimeType = item.SoundSrc?.MimeType ?? undefined;
    const size = item.SoundSrc?.FileSize ?? undefined;

    return buildExistingSpecMusicalSoundCellValue(item.SoundSrcId ?? "", fileName, mimeType, size);
};

/** 建立空相片 CellValue。 */
const buildEmptySpecMusicalPictureCellValue = (): SpecMusicalPictureCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 建立空音檔 CellValue。 */
const buildEmptySpecMusicalSoundCellValue = (): SpecMusicalSoundCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 建立既有相片 CellValue。 */
const buildExistingSpecMusicalPictureCellValue = (internalId: string): SpecMusicalPictureCellValue =>
{
    const safeId = String(internalId ?? "").trim();
    return { internalId: safeId, fileName: safeId, originalFileName: "", url: getSpecMusicalPicturePreviewUrl(safeId) };
};

/** 建立既有音檔 CellValue。 */
const buildExistingSpecMusicalSoundCellValue = (internalId: string, fileName: string, mimeType?: string, size?: number): SpecMusicalSoundCellValue =>
{
    const safeId = String(internalId ?? "").trim();
    const safeName = String(fileName ?? safeId).trim();

    return {
        internalId: safeId,
        fileName: safeName,
        originalFileName: safeName,
        url: getSpecMusicalSoundPreviewUrl(safeId),
        downloadUrl: safeId ? FileManagementAPI.get_Server_Download_Url(safeId, safeName) : undefined,
        mimeType,
        size,
    };
};

/** 建立上傳後相片 CellValue。 */
const buildUploadedSpecMusicalPictureCellValue = (internalId: string, originalName?: string): SpecMusicalPictureCellValue =>
{
    const safeName = originalName ?? "";
    return { internalId, fileName: buildFileFieldDisplayName(safeName, internalId), originalFileName: safeName, url: getSpecMusicalPicturePreviewUrl(internalId) };
};

/** 建立上傳後音檔 CellValue。 */
const buildUploadedSpecMusicalSoundCellValue = (internalId: string, originalName?: string): SpecMusicalSoundCellValue =>
{
    const safeName = originalName ?? "";

    return {
        internalId,
        fileName: buildFileFieldDisplayName(safeName, internalId),
        originalFileName: safeName,
        url: getSpecMusicalSoundPreviewUrl(internalId),
        downloadUrl: FileManagementAPI.get_Server_Download_Url(internalId, safeName),
    };
};

/** 判斷是否為相片 CellValue。 */
const isSpecMusicalPictureCellValue = (value: EditGridCellValue): value is SpecMusicalPictureCellValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

/** 判斷是否為音檔 CellValue。 */
const isSpecMusicalSoundCellValue = (value: EditGridCellValue): value is SpecMusicalSoundCellValue =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value) && "fileName" in value;
};

/** 從 EditGrid file value 取得使用者剛選的 File。 */
/** 取得本次選檔的原始檔名。 */
const getSelectedFileName = (file: EditGridFileValue): string =>
{
    return String(file.file?.name || file.fileName || "").trim();
};

/** 建立檔案欄位顯示名稱。 */
const buildFileFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = String(originalName ?? "").trim();
    const id = String(internalId ?? "").trim();
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 依 Sort / RowId 排序相片。 */
const sortSpecMusicalPictureList = (items: SpecMusicalPictureList[]): SpecMusicalPictureList[] =>
{
    return [...items].sort((a, b) => Number(a.Sort ?? a.RowId ?? 0) - Number(b.Sort ?? b.RowId ?? 0));
};

/** 依 RowId 排序音檔。 */
const sortSpecMusicalSoundList = (items: SpecMusicalSoundList[]): SpecMusicalSoundList[] =>
{
    return [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 若封面空白或指向不存在相片，改指向目前第一張相片。 */
const syncSpecMusicalCoverFromPictures = (header: SpecMusicalFormModel, pictures: SpecMusicalPictureList[]): SpecMusicalFormModel =>
{
    const currentCover = String(header.CoverPicId ?? "").trim();
    const hasCurrentCover = pictures.some(item => String(item.PicSrcId ?? "") === currentCover);
    if (currentCover && hasCurrentCover) return header;

    return { ...header, CoverPicId: pictures[0]?.PicSrcId ?? null };
};

/** 刪除相片時同步封面 fallback。 */
const syncSpecMusicalCoverAfterDelete = (binding: ServerFormBinding<SpecMusicalFormModel>, row: GridRow): void =>
{
    const picId = toSpecMusicalPictureCellValue(getEditGridCellValue(row, SpecMusicalPictureListFields.PicSrcId)).internalId;
    if (!picId) return;

    binding.setFormData(prev => syncSpecMusicalCoverAfterDeleteFromData(prev ?? specMusicalEmptyData, picId));
};

/** 從資料中移除被刪封面後的指向。 */
const syncSpecMusicalCoverAfterDeleteFromData = (data: SpecMusicalFormModel, picId: string): SpecMusicalFormModel =>
{
    if (data.CoverPicId !== picId) return data;

    const nextCover = (data._SpecMusicalPictureList ?? []).find(item => item.PicSrcId && item.PicSrcId !== picId)?.PicSrcId ?? null;
    return { ...data, CoverPicId: nextCover };
};

/** 建立相片 Row key。 */
const buildSpecMusicalPictureRowKey = (item: SpecMusicalPictureList, index: number): string =>
{
    return `spec-musical-picture-${item.MusicalId ?? "new"}-${item.RowId ?? index + 1}`;
};

/** 建立音檔 Row key。 */
const buildSpecMusicalSoundRowKey = (item: SpecMusicalSoundList, index: number): string =>
{
    return `spec-musical-sound-${item.MusicalId ?? "new"}-${item.RowId ?? index + 1}`;
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getSpecMusicalTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getSpecMusicalColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};
// #endregion
