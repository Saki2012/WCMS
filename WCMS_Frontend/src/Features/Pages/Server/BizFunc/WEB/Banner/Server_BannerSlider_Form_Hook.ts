import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
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
    EditGridSubDetailRenderArgs,
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
    toEditGridOptions,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { getModelColumnDisplayName, getModelTableDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import { buildSupportedLangOrder, DefaultLang, type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useFetchEnumOptions } from "@/SysCore/Utils/API/SystemAPI_Hook";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { BannerDetailFields, BannerDetailInfoFields, BannerFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo } from "react";

// #region Property
type BannerFormModel = components["schemas"]["Banner"];
type BannerDetail = components["schemas"]["BannerDetail"];
type BannerDetailInfo = components["schemas"]["BannerDetailInfo"] & {
    SpecLatestShows?: string | null;
    SpecShowLocation?: string | null;
    SpecShowDate?: string | null;
};
type WindowTarget = components["schemas"]["WindowTarget"];
type UploadFileHandler = ReturnType<typeof useUploadFile>["handleFileChange"];
export type BannerPictureCellValue = EditGridFileValue & { internalId?: string; originalFileName?: string; };
export type BannerDetailGridRow = GridRow & { BannerId?: string | null; DetailRowId?: number | null; };
export type BannerDetailInfoGridRow = GridRow & { BannerId?: string | null; ParentRowId?: number | null; InfoRowId?: number | null; };
export interface UseBannerSliderFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: BannerFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: BannerSliderFormActionsOpt;
}
export interface UseBannerDetailEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<BannerFormModel>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** 圖片預覽渲染，畫面職責留在 Comp */
    renderPicturePreview: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 展開按鈕渲染，畫面職責留在 Comp */
    renderSubDetailToggle: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 區塊渲染，畫面職責留在 Comp */
    renderSubDetail: (args: EditGridSubDetailRenderArgs) => ReactNode;

    /** 子明細展開列 key */
    expandedRowKey: string | null;

    /** 子明細編輯中時鎖住父層 */
    isSubDetailEditing: boolean;
}
export interface UseBannerDetailInfoEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<BannerFormModel>;

    /** 目前圖片 RowId，語系明細用它綁 ParentRowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** WindowTarget 下拉選項 */
    windowTargetOpts: Record<string, string>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;
}
export type BannerSliderFormRefs = {
    /** 外部連結開啟方式選項 */
    windowTargetOpts: Record<string, string>;
};
export type BannerSliderFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};
export type BannerSliderFormAdapter = { BannerSlider: ReturnType<typeof BannerSliderAdapter>; };
/** 標題顏色，後續看是否可調成進階選取 RGBA。 */
const fontColorOptions = toEditGridOptions({ "0": "系統預設", "1": "白色", "2": "綠色" }, true);
const BANNER_DETAIL_INFO_TITLE_MAX_LENGTH = 200;
const SpecBannerDetailInfoFields = {
    SpecLatestShows: "SpecLatestShows",
    SpecShowLocation: "SpecShowLocation",
    SpecShowDate: "SpecShowDate",
} as const;
// #endregion

// #region Public
export const bannerSliderEmptyData: BannerFormModel = { _BannerDetail: [{ RowId: 1, RowNo: 1, PicSrcId: "", FontColor: "0", Sort: 1, _BannerDetailInfo: [] }] };

export const BannerDetailInfoSubDetailColumnKey = "__BannerDetailInfo";

/** 建立 BannerSlider Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useBannerSliderFormTemplate = (
    opt: UseBannerSliderFormTemplateOptions,
): ServerFormTemplate<
    BannerFormModel,
    BannerSliderFormAdapter,
    BannerSliderFormRefs,
    ServerFormDefaultRawData<BannerFormModel, BannerSliderFormRefs>,
    BannerSliderFormActionsOpt
> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "BannerSlider",
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildBannerSliderFormAdapter,
                selectDataAdapter: adapter => adapter.BannerSlider,
                buildTitle: buildBannerSliderFormTitle,
                buildInitialData: buildBannerSliderInitialData,
                useReferenceData: ctx => useBannerSliderReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立輪播圖片 EditGrid binding，Comp 只需掛載 EditGrid 與提供畫面 render。 */
export const useBannerDetailEditGrid = (opt: UseBannerDetailEditGridOptions) =>
{
    const uploadFile = useUploadFile({ enablePreview: false });
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildBannerDetailColumns(displayName), [displayName]);
    const handlePictureValueChange = useCallback((args: EditGridCellValueChangeArgs) =>
    {
        return uploadBannerPictureValue(args, opt.binding, uploadFile.handleFileChange);
    }, [opt.binding, uploadFile.handleFileChange]);

    return useEditGridBinding<BannerFormModel, BannerDetail, BannerDetailGridRow>({
        binding: opt.binding,
        emptyData: bannerSliderEmptyData,
        getItems: data => data._BannerDetail,
        setItems: syncBannerDetailCollection,
        columns,
        getItemRowId: detail => detail.RowId,
        sortItems: sortBannerDetails,
        createItem: ctx => buildNewBannerDetailItem(ctx.data, ctx.nextRowId, ctx.nextRowNo),
        toRow: (detail, index) => buildBannerDetailGridRow(detail, index, opt, handlePictureValueChange, displayName),
        toItem: (row, index, ctx) => toBannerDetailModel(ctx.data, row, index),
        editGridProps: buildBannerDetailGridProps(opt.style, displayName, opt),
    });
};

/** 建立輪播圖片語系 SubDetail EditGrid binding，Comp 只需掛載 EditGrid。 */
export const useBannerDetailInfoEditGrid = (opt: UseBannerDetailInfoEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildBannerDetailInfoColumns(displayName, opt.windowTargetOpts), [displayName, opt.windowTargetOpts]);

    return useEditGridBinding<BannerFormModel, BannerDetailInfo, BannerDetailInfoGridRow>({
        binding: opt.binding,
        emptyData: bannerSliderEmptyData,
        getItems: data => getBannerDetailInfos(data, opt.parentRowId),
        setItems: (data, items) => setBannerDetailInfos(data, opt.parentRowId, items),
        columns,
        getItemRowId: info => info.RowId,
        sortItems: infos => sortBannerDetailInfos(infos, opt.lang),
        createItem: ctx => buildNewBannerDetailInfoItem(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (info, index) => buildBannerDetailInfoGridRow(info, index, displayName, opt.windowTargetOpts),
        toItem: (row, index, ctx) => toBannerDetailInfoModel(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildBannerDetailInfoGridProps(opt.parentRowId, opt.style, displayName),
    });
};

/** 建立圖片 CellValue，保留預覽 url 給 EditGrid readonly render 使用。 */
export const buildBannerPictureCellValue = (detail: BannerDetail): BannerPictureCellValue =>
{
    const internalId = detail.PicSrcId ?? "";

    return { internalId, fileName: buildBannerPictureFieldDisplayName("", internalId), originalFileName: "", url: getBannerPicturePreviewUrl(internalId) };
};

/** 上傳後建立新的圖片 CellValue，欄位顯示原始檔名與 internalId。 */
export const buildUploadedBannerPictureCellValue = (internalId: string, originalName?: string): BannerPictureCellValue =>
{
    const safeOriginalName = originalName ?? "";

    return {
        internalId,
        fileName: buildBannerPictureFieldDisplayName(safeOriginalName, internalId),
        originalFileName: safeOriginalName,
        url: getBannerPicturePreviewUrl(internalId),
    };
};

/** 將 EditGrid 值正規化成圖片 CellValue。 */
export const toBannerPictureCellValue = (value: EditGridCellValue): BannerPictureCellValue =>
{
    if (isBannerPictureCellValue(value)) return value;
    if (typeof value === "string")
    {
        return { internalId: value, fileName: buildBannerPictureFieldDisplayName("", value), url: getBannerPicturePreviewUrl(value) };
    }
    return { fileName: "", internalId: "" };
};

/** 取得圖片預覽網址。 */
export const getBannerPicturePreviewUrl = (picId?: string | null): string | undefined =>
{
    const id = LibText.safeTrim(picId);
    return id ? FileManagementAPI.get_Server_Preview_Url(id) ?? undefined : undefined;
};
// #endregion

// #region Private
/** 建立 BannerSlider Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildBannerSliderFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getBannerModelTitle(ctx.displayName, "廣告輪播");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildBannerSliderInitialData = (ctx: { mode: "new" | "edit"; emptyData: BannerFormModel; }): ApiFormInitial<BannerFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 BannerSlider Form 會使用到的 Adapter 群組。 */
const buildBannerSliderFormAdapter = (): BannerSliderFormAdapter =>
{
    return { BannerSlider: BannerSliderAdapter() };
};

/** 取得 Header / Detail 需要的參照資料與語系明細補齊。 */
const useBannerSliderReferenceData = (ctx: { binding: ServerFormDefaultRawData<BannerFormModel, BannerSliderFormRefs>["formData"]; lang: Lang; }) =>
{
    useEnsureBannerDetailInfos(ctx.binding, ctx.lang);

    const windowTargetOpts = useWindowTargetOptions();

    return useMemo(() =>
    {
        return {
            refs: { windowTargetOpts: windowTargetOpts.data },
            isLoading: Boolean(windowTargetOpts.isLoading),
            errors: [windowTargetOpts.error],
            refetchRefData: async () => undefined,
        };
    }, [windowTargetOpts.data, windowTargetOpts.error, windowTargetOpts.isLoading]);
};

/** 取得 Banner Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getBannerModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
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

/** 建立 WindowTarget 預設選項，避免 enum 尚未回來時網址開啟方式無法編輯。 */
const getFallbackWindowTargetMap = (): Record<string, string> =>
{
    return { "0": "本頁開啟", "1": "另開分頁" };
};

/** 建立輪播圖片 EditGrid 固定設定，Grid 標題優先讀 ModelDisplayName。 */
const buildBannerDetailGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseBannerDetailEditGridOptions) =>
{
    const gridTitle = getBannerTableTitle(displayName, BannerFields._BannerDetail, "圖片明細");

    return {
        title: gridTitle,
        ariaLabel: `${gridTitle}清單`,
        style,
        storageKey: "server-banner-slider-detail-grid",
        minTableWidth: 1300,
        maxVisibleRows: 5,
        disabled: opt.isSubDetailEditing,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: true,
        showRowNo: true,
        showOperationGuide: false,
        actionColumnTitle: "排序 / 操作",
        addButtonText: `新增${gridTitle}`,
        emptyText: `目前沒有${gridTitle}`,
        expandedRowKey: opt.expandedRowKey,
        subDetailRowClassName: "edit-grid-sub-detail-row",
        subDetailRender: opt.renderSubDetail,
    };
};

/** 建立語系明細 EditGrid 固定設定，語系列不開放新增刪除。 */
const buildBannerDetailInfoGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    const gridTitle = getBannerTableTitle(displayName, BannerDetailFields._BannerDetailInfo, "語系明細");

    return {
        title: gridTitle,
        ariaLabel: `輪播圖片 ${parentRowId} ${gridTitle}`,
        style,
        storageKey: `server-banner-slider-info-grid-${parentRowId}`,
        minTableWidth: 1200,
        maxVisibleRows: 5,
        canAdd: false,
        canEdit: true,
        canDelete: false,
        canDrag: false,
        showRowNo: false,
        showOperationGuide: false,
        emptyText: `目前沒有${gridTitle}`,
    };
};

/** 依 Sort / RowId 排序輪播圖片。 */
const sortBannerDetails = (details: BannerDetail[]): BannerDetail[] =>
{
    return [...details].sort((a, b) => Number(a.Sort ?? a.RowId ?? 0) - Number(b.Sort ?? b.RowId ?? 0));
};

/** 依目前語系與支援語系順序排序語系資料。 */
const sortBannerDetailInfos = (infos: BannerDetailInfo[], preferLang: Lang): BannerDetailInfo[] =>
{
    const order = buildSupportedLangOrder(preferLang).map(lang => lang.toLowerCase());
    return [...infos].sort((a, b) => order.indexOf(String(a.Lang ?? "").toLowerCase()) - order.indexOf(String(b.Lang ?? "").toLowerCase()));
};

/** 建立輪播圖片欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildBannerDetailColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    const picTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.PicSrcId, "圖片");
    const startTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Validate_Start, "上架日期");
    const endTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Validate_End, "下架日期");
    const fontTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.FontColor, "標題顏色");
    const sortTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Sort, "排序編號");

    return [
        {
            key: BannerDetailFields.PicSrcId,
            title: picTitle,
            width: 280,
            inputType: "file",
            editable: true,
            accept: "image/*",
            multiple: false,
            maxFileCount: 1,
            maxFileSizeMB: 10,
        },
        { key: BannerDetailFields.Validate_Start, title: startTitle, width: 180, inputType: "date-time", editable: true },
        { key: BannerDetailFields.Validate_End, title: endTitle, width: 180, inputType: "date-time", editable: true },
        { key: BannerDetailFields.FontColor, title: fontTitle, width: 140, inputType: "selectSingle", editable: true, options: fontColorOptions },
        { key: BannerDetailFields.Sort, title: sortTitle, width: 110, inputType: "number", editable: true, min: 0 },
        { key: BannerDetailInfoSubDetailColumnKey, title: "語系明細", width: 130, inputType: "readonly", editable: false },
    ];
};

/** 建立語系明細欄位設定，欄位名稱優先讀 ModelDisplayName。 */
const buildBannerDetailInfoColumns = (displayName: ModelDisplaySchema, windowTargetOpts: Record<string, string>): ColumnConfig[] =>
{
    const baseColumns: ColumnConfig[] = [{
        key: BannerDetailInfoFields.Lang,
        title: getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Lang, "語系"),
        width: 110,
        inputType: "readonly",
        editable: false,
    }, {
        key: BannerDetailInfoFields.Title,
        title: getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Title, "標題"),
        width: 180,
        inputType: "text",
        editable: true,
        maxLength: BANNER_DETAIL_INFO_TITLE_MAX_LENGTH,
    }, {
        key: BannerDetailInfoFields.Content,
        title: getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Content, "內文"),
        width: 260,
        inputType: "textarea",
        editable: true,
        rows: 3,
    }, {
        key: BannerDetailInfoFields.URL,
        title: getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.URL, "網址"),
        width: 260,
        inputType: "text",
        editable: true,
        maxLength: 500,
    }, {
        key: BannerDetailInfoFields.URL_Open,
        title: getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.URL_Open, "開啟方式"),
        width: 140,
        inputType: "selectSingle",
        editable: true,
        options: buildWindowTargetEditGridOptions(windowTargetOpts),
    }];

    return shouldShowSpec1817Fields() ? [...baseColumns, ...buildSpec1817Columns()] : baseColumns;
};

/** 建立 1817 客製欄位。 */
const buildSpec1817Columns = (): ColumnConfig[] =>
{
    return [{ key: SpecBannerDetailInfoFields.SpecLatestShows, title: "Latest Shows", width: 180, inputType: "text", editable: true }, {
        key: SpecBannerDetailInfoFields.SpecShowLocation,
        title: "Show Location",
        width: 180,
        inputType: "text",
        editable: true,
    }, { key: SpecBannerDetailInfoFields.SpecShowDate, title: "Show Date", width: 180, inputType: "text", editable: true }];
};

/** 建立 WindowTarget 的 EditGrid options。 */
const buildWindowTargetEditGridOptions = (windowTargetOpts: Record<string, string>) =>
{
    const source = Object.keys(windowTargetOpts ?? {}).length > 0 ? windowTargetOpts : getFallbackWindowTargetMap();
    return toEditGridOptions(source);
};

/** 將輪播圖片 DTO 轉成 EditGrid Row。 */
const buildBannerDetailGridRow = (
    detail: BannerDetail,
    index: number,
    opt: UseBannerDetailEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): BannerDetailGridRow =>
{
    const rowId = Number(detail.RowId ?? index + 1);

    return {
        keyId: buildBannerDetailRowKey(detail, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        BannerId: detail.BannerId,
        DetailRowId: rowId,
        cells: buildBannerDetailCells(detail, rowId, opt, onPictureValueChange, displayName),
    };
};

/** 將語系明細 DTO 轉成 EditGrid Row。 */
const buildBannerDetailInfoGridRow = (
    info: BannerDetailInfo,
    index: number,
    displayName: ModelDisplaySchema,
    windowTargetOpts: Record<string, string>,
): BannerDetailInfoGridRow =>
{
    const rowId = Number(info.RowId ?? index + 1);

    return {
        keyId: buildBannerDetailInfoRowKey(info, index),
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        BannerId: info.BannerId,
        ParentRowId: info.ParentRowId,
        InfoRowId: rowId,
        cells: buildBannerDetailInfoCells(info, displayName, windowTargetOpts),
    };
};

/** 建立圖片列 cells，避免 Comp 介入 DTO 與 CellValue 轉換。 */
const buildBannerDetailCells = (
    detail: BannerDetail,
    rowId: number,
    opt: UseBannerDetailEditGridOptions,
    onPictureValueChange: EditGridCellValueChangeHandler,
    displayName: ModelDisplaySchema,
): RowCell[] =>
{
    const picTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.PicSrcId, "圖片");
    const startTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Validate_Start, "上架日期");
    const endTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Validate_End, "下架日期");
    const fontTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.FontColor, "標題顏色");
    const sortTitle = getBannerColumnTitle(displayName, BannerFields._BannerDetail, BannerDetailFields.Sort, "排序編號");

    return [
        buildEditGridCell(BannerDetailFields.PicSrcId, picTitle, buildBannerPictureCellValue(detail), {
            inputType: "file",
            editable: true,
            accept: "image/*",
            multiple: false,
            maxFileCount: 1,
            maxFileSizeMB: 10,
            render: opt.renderPicturePreview,
            onValueChange: onPictureValueChange,
        }),
        buildEditGridCell(BannerDetailFields.Validate_Start, startTitle, detail.Validate_Start ?? "", { inputType: "date-time", editable: true }),
        buildEditGridCell(BannerDetailFields.Validate_End, endTitle, detail.Validate_End ?? "", { inputType: "date-time", editable: true }),
        buildEditGridCell(BannerDetailFields.FontColor, fontTitle, detail.FontColor ?? "0", {
            inputType: "selectSingle",
            editable: true,
            options: fontColorOptions,
        }),
        buildEditGridCell(BannerDetailFields.Sort, sortTitle, detail.Sort ?? rowId, { inputType: "number", editable: true, min: 0 }),
        buildEditGridCell(BannerDetailInfoSubDetailColumnKey, "語系明細", "", { inputType: "readonly", editable: false, render: opt.renderSubDetailToggle }),
    ];
};

/** 建立語系明細列 cells，語系不可手動修改。 */
const buildBannerDetailInfoCells = (info: BannerDetailInfo, displayName: ModelDisplaySchema, windowTargetOpts: Record<string, string>): RowCell[] =>
{
    const cells = [
        buildEditGridCell(
            BannerDetailInfoFields.Lang,
            getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Lang, "語系"),
            info.Lang ?? DefaultLang,
            { inputType: "readonly", editable: false, render: args => getBannerLangText(args.value) },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.Title,
            getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Title, "標題"),
            info.Title ?? "",
            { inputType: "text", editable: true, maxLength: 200 },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.Content,
            getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.Content, "內文"),
            info.Content ?? "",
            { inputType: "textarea", editable: true, rows: 3 },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.URL,
            getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.URL, "網址"),
            info.URL ?? "",
            { inputType: "text", editable: true, maxLength: 500 },
        ),
        buildEditGridCell(
            BannerDetailInfoFields.URL_Open,
            getBannerColumnTitle(displayName, BannerDetailFields._BannerDetailInfo, BannerDetailInfoFields.URL_Open, "開啟方式"),
            info.URL_Open ?? 0,
            { inputType: "selectSingle", editable: true, options: buildWindowTargetEditGridOptions(windowTargetOpts) },
        ),
    ];

    return shouldShowSpec1817Fields() ? [...cells, ...buildSpec1817Cells(info)] : cells;
};

/** 建立 1817 客製欄位 cells。 */
const buildSpec1817Cells = (info: BannerDetailInfo): RowCell[] =>
{
    return [
        buildEditGridCell(SpecBannerDetailInfoFields.SpecLatestShows, "Latest Shows", info.SpecLatestShows ?? "", { inputType: "text", editable: true }),
        buildEditGridCell(SpecBannerDetailInfoFields.SpecShowLocation, "Show Location", info.SpecShowLocation ?? "", { inputType: "text", editable: true }),
        buildEditGridCell(SpecBannerDetailInfoFields.SpecShowDate, "Show Date", info.SpecShowDate ?? "", { inputType: "text", editable: true }),
    ];
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getBannerTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    return getModelTableDisplayName(displayName, tableId, fallback);
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getBannerColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    return getModelColumnDisplayName(displayName, tableId, columnId, fallback);
};

/** 建立新輪播圖片，並立即補齊所有支援語系。 */
const buildNewBannerDetailItem = (data: BannerFormModel, rowId: number, rowNo: number): BannerDetail =>
{
    const detail: BannerDetail = { BannerId: data.BannerId, RowId: rowId, RowNo: rowNo, PicSrcId: "", FontColor: "0", Sort: rowNo };
    return { ...detail, _BannerDetailInfo: buildMissingBannerDetailInfos(detail, [], data.BannerId) };
};

/** 建立新語系明細。 */
const buildNewBannerDetailInfoItem = (data: BannerFormModel, parentRowId: number, rowId: number, rowNo: number, lang: Lang): BannerDetailInfo =>
{
    return { BannerId: data.BannerId, ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, Lang: lang, URL_Open: 0 };
};

/** 將圖片 Grid Row 轉回 BannerDetail，並保留語系子明細。 */
const toBannerDetailModel = (source: BannerFormModel, row: GridRow, index: number): BannerDetail =>
{
    const pictureValue = toBannerPictureCellValue(getEditGridCellValue(row, BannerDetailFields.PicSrcId));
    const rowId = getEditGridRowId(row, index);
    const current = getBannerDetailByRowId(source, rowId);
    return {
        BannerId: source.BannerId ?? (row as BannerDetailGridRow).BannerId,
        RowId: rowId,
        RowNo: index + 1,
        PicSrcId: pictureValue.internalId ?? "",
        FontColor: getEditGridStringCellValue(row, BannerDetailFields.FontColor) || "0",
        Validate_Start: getEditGridNullableStringCellValue(row, BannerDetailFields.Validate_Start),
        Validate_End: getEditGridNullableStringCellValue(row, BannerDetailFields.Validate_End),
        Sort: index + 1,
        _BannerDetailInfo: current?._BannerDetailInfo ?? [],
    };
};

/** 將語系明細 Grid Row 轉回 BannerDetailInfo。 */
const toBannerDetailInfoModel = (source: BannerFormModel, parentRowId: number, row: GridRow, index: number): BannerDetailInfo =>
{
    return {
        BannerId: source.BannerId ?? (row as BannerDetailInfoGridRow).BannerId,
        ParentRowId: parentRowId,
        RowId: getEditGridRowId(row, index),
        RowNo: index + 1,
        Lang: getBannerLangCellValue(row),
        Title: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.Title),
        Content: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.Content),
        URL: getEditGridNullableStringCellValue(row, BannerDetailInfoFields.URL),
        URL_Open: getEditGridNumberCellValue(row, BannerDetailInfoFields.URL_Open, 0) as WindowTarget,
        SpecLatestShows: getEditGridNullableStringCellValue(row, SpecBannerDetailInfoFields.SpecLatestShows),
        SpecShowLocation: getEditGridNullableStringCellValue(row, SpecBannerDetailInfoFields.SpecShowLocation),
        SpecShowDate: getEditGridNullableStringCellValue(row, SpecBannerDetailInfoFields.SpecShowDate),
    };
};

/** 父層 Grid 寫回時，保留各圖片的語系子明細並補齊缺少語系。 */
const syncBannerDetailCollection = (data: BannerFormModel, details: BannerDetail[]): BannerFormModel =>
{
    const nextDetails = details.map((detail, index) => ensureBannerDetailInfos(detail, data.BannerId, index + 1));
    return { ...data, _BannerDetail: nextDetails };
};

/** 取得指定圖片的語系子明細。 */
const getBannerDetailInfos = (data: BannerFormModel, parentRowId: number): BannerDetailInfo[] =>
{
    return getBannerDetailByRowId(data, parentRowId)?._BannerDetailInfo ?? [];
};

/** 寫回指定圖片的語系子明細，不改動其他圖片。 */
const setBannerDetailInfos = (data: BannerFormModel, parentRowId: number, infos: BannerDetailInfo[]): BannerFormModel =>
{
    const normalized = normalizeBannerDetailInfos(data, parentRowId, infos);
    const details = (data._BannerDetail ?? []).map(detail => Number(detail.RowId ?? 0) === parentRowId ? { ...detail, _BannerDetailInfo: normalized } : detail);
    return { ...data, _BannerDetail: details };
};

/** 正規化語系子明細的父鍵與顯示順序。 */
const normalizeBannerDetailInfos = (data: BannerFormModel, parentRowId: number, infos: BannerDetailInfo[]): BannerDetailInfo[] =>
{
    return infos.map((info, index) => ({ ...info, BannerId: info.BannerId ?? data.BannerId, ParentRowId: parentRowId, RowNo: index + 1 }));
};

/** 依 RowId 取得輪播圖片。 */
const getBannerDetailByRowId = (data: BannerFormModel, rowId: number): BannerDetail | undefined =>
{
    return (data._BannerDetail ?? []).find(detail => Number(detail.RowId ?? 0) === rowId);
};

/** 載入 FormModel 後補齊每一張圖片的支援語系。 */
const useEnsureBannerDetailInfos = (binding: ServerFormBinding<BannerFormModel>, preferLang: Lang): void =>
{
    const setFormData = binding.setFormData;
    useEffect(() =>
    {
        setFormData(prev => ({ ...prev, _BannerDetail: (prev._BannerDetail ?? []).map((detail, index) => ensureBannerDetailInfos(detail, prev.BannerId, index + 1, preferLang)) }));
    }, [preferLang, setFormData]);
};

/** 補齊單一圖片的語系子明細與排序欄位。 */
const ensureBannerDetailInfos = (detail: BannerDetail, bannerId?: string | null, rowNo?: number, preferLang: Lang = DefaultLang): BannerDetail =>
{
    const infos = detail._BannerDetailInfo ?? [];
    const missing = buildMissingBannerDetailInfos(detail, infos, bannerId);
    const sorted = sortBannerDetailInfos([...infos, ...missing], preferLang).map((info, index) => ({ ...info, RowNo: index + 1 }));
    return { ...detail, BannerId: detail.BannerId ?? bannerId, RowNo: rowNo ?? detail.RowNo, Sort: rowNo ?? detail.Sort, _BannerDetailInfo: sorted };
};

/** 建立指定圖片缺少的語系明細。 */
const buildMissingBannerDetailInfos = (parent: BannerDetail, infos: BannerDetailInfo[], bannerId?: string | null): BannerDetailInfo[] =>
{
    const existLangs = new Set(infos.map(info => String(info.Lang ?? "").toLowerCase()));
    const maxRowId = infos.reduce((max, info) => Math.max(max, Number(info.RowId ?? 0)), 0);
    return SUPPORTED_LANGS.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        BannerId: parent.BannerId ?? bannerId,
        ParentRowId: parent.RowId,
        RowId: maxRowId + index + 1,
        RowNo: infos.length + index + 1,
        Lang: lang,
        URL_Open: 0,
    }));
};

/** 使用 EditGrid 內建 file 欄位選圖後，上傳並同步補齊語系標題。 */
const uploadBannerPictureValue = async (args: EditGridCellValueChangeArgs, binding: ServerFormBinding<BannerFormModel>, handleFileChange: UploadFileHandler): Promise<EditGridCellValueChangeResult> =>
{
    const selectedFile = getSelectedEditGridFile(args.nextValue);
    if (!selectedFile?.file) return { value: buildEmptyBannerPictureCellValue() };
    let uploadedValue = toBannerPictureCellValue(args.value);
    const selectedOriginalName = getSelectedBannerPictureName(selectedFile);
    await handleFileChange([selectedFile.file], (internalId, originalName) =>
    {
        uploadedValue = buildUploadedBannerPictureCellValue(internalId, originalName || selectedOriginalName);
    });
    syncBannerDetailInfoTitlesByPictureName(args, binding, selectedOriginalName, uploadedValue);
    return { value: uploadedValue };
};

/** 取得本次選圖的原始檔名，避免上傳 callback 未帶檔名時只剩 internalId。 */
const getSelectedBannerPictureName = (file: EditGridFileValue): string =>
{
    return LibText.safeTrim(file.file?.name || file.fileName);
};

/** 建立空圖片值，用於使用者清除 file 欄位。 */
const buildEmptyBannerPictureCellValue = (): BannerPictureCellValue =>
{
    return { fileName: "", internalId: "", originalFileName: "" };
};

/** 判斷是否為輪播圖片 CellValue。 */
const isBannerPictureCellValue = (value: EditGridCellValue): value is BannerPictureCellValue =>
{
    return typeof value === "object" && value !== null && "fileName" in value;
};

/** 建立圖片欄位顯示文字：原始檔名 (internalId)。 */
const buildBannerPictureFieldDisplayName = (originalName?: string | null, internalId?: string | null): string =>
{
    const name = LibText.safeTrim(originalName);
    const id = LibText.safeTrim(internalId);
    if (name && id) return `${name} (${id})`;
    return name || id;
};

/** 建立圖片 Row key。 */
const buildBannerDetailRowKey = (detail: BannerDetail, index: number): string =>
{
    return `banner-detail-${detail.BannerId ?? "new"}-${detail.RowId ?? index + 1}`;
};

/** 建立語系 Row key。 */
const buildBannerDetailInfoRowKey = (info: BannerDetailInfo, index: number): string =>
{
    return `banner-info-${info.BannerId ?? "new"}-${info.ParentRowId ?? 0}-${info.RowId ?? index + 1}-${info.Lang ?? "unknown"}`;
};

/** 取得語系欄位值。 */
const getBannerLangCellValue = (row: GridRow): Lang =>
{
    const value = getEditGridStringCellValue(row, BannerDetailInfoFields.Lang) as Lang;
    return SUPPORTED_LANGS.includes(value) ? value : DefaultLang;
};

/** 取得語系顯示文字。 */
const getBannerLangText = (value: EditGridCellValue): string =>
{
    const lang = String(value ?? "") as Lang;
    return LangLabelMap[lang] ?? String(value ?? "");
};

/** 判斷是否顯示 1817 客製欄位。 */
const shouldShowSpec1817Fields = (): boolean =>
{
    return String(import.meta.env.VITE_SPEC_CODE ?? "") === "1817";
};

/** 依圖片檔名補齊該圖片列底下所有語系標題。 */
const syncBannerDetailInfoTitlesByPictureName = (
    args: EditGridCellValueChangeArgs,
    binding: ServerFormBinding<BannerFormModel>,
    originalName: string,
    uploadedValue: BannerPictureCellValue,
): void =>
{
    const title = buildBannerTitleFromFileName(originalName);
    const parentRowId = getEditGridRowId(args.row, args.rowIndex);
    if (!uploadedValue.internalId || !title) return;

    binding.setFormData(prev => syncBannerDetailInfoTitles(prev ?? bannerSliderEmptyData, parentRowId, title));
};

/** 同步 BannerDetailInfo 標題，僅補空白標題避免覆蓋人工輸入。 */
const syncBannerDetailInfoTitles = (data: BannerFormModel, parentRowId: number, title: string): BannerFormModel =>
{
    const details = (data._BannerDetail ?? []).map((detail, index) =>
    {
        if (Number(detail.RowId ?? 0) !== parentRowId) return detail;
        const ensured = ensureBannerDetailInfos(detail, data.BannerId, index + 1);
        return { ...ensured, _BannerDetailInfo: (ensured._BannerDetailInfo ?? []).map(info => fillBannerDetailInfoTitle(info, parentRowId, title)) };
    });
    return { ...data, _BannerDetail: details };
};

/** 補上單筆語系標題，已有標題時保留原值。 */
const fillBannerDetailInfoTitle = (info: BannerDetailInfo, parentRowId: number, title: string): BannerDetailInfo =>
{
    if (Number(info.ParentRowId ?? 0) !== parentRowId) return info;
    if (LibText.safeTrim(info.Title)) return info;
    return { ...info, Title: title };
};

/** 從圖片檔名建立標題文字，去除副檔名並限制長度。 */
const buildBannerTitleFromFileName = (fileName: string): string =>
{
    const rawName = String(fileName ?? "").split(/[\\/]/).pop() ?? "";
    const nameWithoutExt = LibText.safeTrim(rawName.replace(/\.[^/.]+$/, ""));
    return nameWithoutExt.slice(0, BANNER_DETAIL_INFO_TITLE_MAX_LENGTH);
};
// #endregion
