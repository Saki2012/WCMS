import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import type {
    ServerFormBinding,
    ServerFormDefaultRawData,
    ServerFormTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/FormTemplate/Server_FormTemplate_Hook";
import type {
    ColumnConfig,
    EditGridCellRenderArgs,
    EditGridSubDetailRenderArgs,
    GridRow,
    IEditGridView_Style,
    RowCell,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Data";
import {
    buildEditGridCell,
    getEditGridNullableStringCellValue,
    getEditGridRowId,
    getEditGridStringCellValue,
    useEditGridBinding,
} from "@/Features/Pages/Server/Scaffold/InputComponets/EditGrid/EditGrid_Hook";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { buildSupportedLangOrder, DefaultLang, type Lang, LangLabelMap, SUPPORTED_LANGS } from "@/SysCore/i18n/lang";
import type { ApiFormInitial, ServerFormActions } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useCallback, useEffect, useMemo } from "react";

// #region Property
type TimelineFormModel = components["schemas"]["Timeline"];

type TimelineItem = components["schemas"]["TimelineItem"];

type TimelineLangDetail = components["schemas"]["TimelineLangDetail"];

export type TimelineItemGridRow = GridRow & { TimelineId?: string | null; DetailRowId?: number | null; };

export type TimelineLangDetailGridRow = GridRow & {
    TimelineId?: string | null;
    ParentRowId?: number | null;
    DetailRowId?: number | null;
    Lang?: string | null;
};

export interface UseTimelineFormTemplateOptions
{
    /** 目前語系 */
    lang: Lang;

    /** 後台主題設定 */
    theme: IBETheme;

    /** 資料 internalId，空值代表新增 */
    internalId: string;

    /** 新增模式預設資料 */
    emptyData: TimelineFormModel;

    /** Form Template 標準動作設定 */
    actionsOpt: TimelineFormActionsOpt;
}

export interface UseTimelineItemEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<TimelineFormModel>;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** SubDetail 展開按鈕渲染，畫面職責留在 Comp */
    renderSubDetailToggle: (args: EditGridCellRenderArgs) => ReactNode;

    /** SubDetail 區塊渲染，畫面職責留在 Comp */
    renderSubDetail: (args: EditGridSubDetailRenderArgs) => ReactNode;

    /** 子明細展開列 key */
    expandedRowKey: string | null;

    /** 子明細編輯中時鎖住父層 */
    isSubDetailEditing: boolean;
}

export interface UseTimelineLangDetailEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<TimelineFormModel>;

    /** TimelineItem 的 RowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** TinyMCE 展開按鈕渲染，畫面職責留在 Comp */
    renderContentToggle: (args: EditGridCellRenderArgs) => ReactNode;
}

export type TimelineFormRefs = Record<string, never>;

export type TimelineFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;

    /** 以目前 FormModel 觸發 Preview，由 Component 決定顯示方式。 */
    onPreviewFromFormModel: (formModel: TimelineFormModel) => void;
};

export type TimelineFormAdapter = {
    /** Timeline 主資料 Adapter */
    Timeline: ReturnType<typeof TimelineAdapter>;
};

interface TimelineLangDetailKey
{
    parentRowId: number;
    rowId: number;
    lang: string;
}

const TimelineItemTableId = TimelineFields._TimelineItem.replace(/^_/, "");

const TimelineLangDetailTableId = TimelineItemFields._TimelineLangDetail.replace(/^_/, "");
// #endregion

// #region Public
export const timelineEmptyData: TimelineFormModel = { _TimelineItem: [] };

export const TimelineLangDetailColumnKey = "__TimelineLangDetail";

export const TimelineContentColumnKey = "__TimelineContent";

/** 建立 Timeline Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useTimelineFormTemplate = (
    opt: UseTimelineFormTemplateOptions,
): ServerFormTemplate<TimelineFormModel, TimelineFormAdapter, TimelineFormRefs, ServerFormDefaultRawData<TimelineFormModel, TimelineFormRefs>, TimelineFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: PGID.Timeline,
            theme: opt.theme,
            lang: opt.lang,
            internalId: opt.internalId,
            emptyData: opt.emptyData,
            actionsOpt: opt.actionsOpt,
            feature: {
                buildAdapter: buildTimelineFormAdapter,
                selectDataAdapter: adapter => adapter.Timeline,
                buildTitle: buildTimelineFormTitle,
                buildInitialData: buildTimelineInitialData,
                buildActions: buildTimelineActions,
                useReferenceData: ctx => useTimelineReferenceData({ ...ctx, lang: opt.lang }),
            },
        };
    }, [opt.actionsOpt, opt.emptyData, opt.internalId, opt.lang, opt.theme]);
};

/** 建立 TimelineItem EditGrid binding，Comp 只負責掛載 Grid 與 SubDetail UI。 */
export const useTimelineItemEditGrid = (opt: UseTimelineItemEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildTimelineItemColumns(displayName), [displayName]);

    return useEditGridBinding<TimelineFormModel, TimelineItem, TimelineItemGridRow>({
        binding: opt.binding,
        emptyData: timelineEmptyData,
        getItems: data => data._TimelineItem,
        setItems: syncTimelineItemCollection,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortTimelineItems,
        createItem: ctx => buildNewTimelineItem(ctx.data, ctx.nextRowId, ctx.nextRowNo),
        toRow: (item, index) => buildTimelineItemGridRow(item, index, opt, displayName),
        toItem: (row, index, ctx) => toTimelineItemModel(ctx.data, row, index),
        editGridProps: buildTimelineItemGridProps(opt.style, displayName, opt),
    });
};

/** 建立 TimelineLangDetail 子層 EditGrid binding，TinyMCE 另以展開區塊呈現。 */
export const useTimelineLangDetailEditGrid = (opt: UseTimelineLangDetailEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildTimelineLangDetailColumns(displayName), [displayName]);

    return useEditGridBinding<TimelineFormModel, TimelineLangDetail, TimelineLangDetailGridRow>({
        binding: opt.binding,
        emptyData: timelineEmptyData,
        getItems: data => getTimelineLangDetails(data, opt.parentRowId),
        setItems: (data, items) => setTimelineLangDetails(data, opt.parentRowId, items),
        columns,
        getItemRowId: detail => detail.RowId,
        sortItems: details => sortTimelineLangDetails(details, opt.lang),
        createItem: ctx => buildNewTimelineLangDetailItem(ctx.data, opt.parentRowId, ctx.nextRowId, ctx.nextRowNo, opt.lang),
        toRow: (detail, index) => buildTimelineLangDetailGridRow(detail, index, opt, displayName),
        toItem: (row, index, ctx) => toTimelineLangDetailModel(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildTimelineLangDetailGridProps(opt.parentRowId, opt.style, displayName),
    });
};

/** 建立 Timeline 事件內容欄位 binding，直接讀寫父項目內的語系子明細。 */
export const useTimelineContentField = (binding: ServerFormBinding<TimelineFormModel>, row: TimelineLangDetailGridRow) =>
{
    const key = useMemo(() => resolveTimelineLangDetailKey(row), [row.DetailRowId, row.Lang, row.ParentRowId, row.RowId, row.rowId]);
    const content = getTimelineLangDetailByKey(binding.data, key)?.Content ?? "";
    const onChange = useCallback((value: unknown): void =>
    {
        binding.setFormData(prev => setTimelineLangDetailContent(prev, key, String(value ?? "")));
    }, [binding.setFormData, key]);
    const label = getTimelineColumnTitle(binding.displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Content, "事件內容");
    return useMemo(() => ({ ColumnDisplayName: label, InputValue: content, OnChange: onChange, Input: content, onChange }), [content, label, onChange]);
};
// #endregion

// #region Private

/** 建立 Toolbar 動作，保留Timeline預覽行為。 */
const buildTimelineActions = (
    ctx: { binding: ServerFormDefaultRawData<TimelineFormModel, TimelineFormRefs>["formData"]; actionsOpt: TimelineFormActionsOpt; },
    defaultActions: ServerFormActions,
): ServerFormActions =>
{
    return { ...defaultActions, Preview: () => ctx.actionsOpt.onPreviewFromFormModel(ctx.binding.data) };
};
/** 建立 Timeline Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildTimelineFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getTimelineModelTitle(ctx.displayName, "紀事表");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildTimelineInitialData = (ctx: { mode: "new" | "edit"; emptyData: TimelineFormModel; }): ApiFormInitial<TimelineFormModel> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Timeline Form 會使用到的 Adapter 群組。 */
const buildTimelineFormAdapter = (): TimelineFormAdapter =>
{
    return { Timeline: TimelineAdapter() };
};

/** 補齊 TimelineItem 底下的語系子明細，參照資料目前不需額外查詢。 */
const useTimelineReferenceData = (ctx: { binding: ServerFormBinding<TimelineFormModel>; lang: Lang; }) =>
{
    useEnsureTimelineLangDetails(ctx.binding, ctx.lang);
    return useMemo(() => ({ refs: {}, isLoading: false, errors: [], refetchRefData: undefined }), []);
};

/** 取得 Timeline Model 顯示名稱，避免 Form 標題寫死功能名稱。 */
const getTimelineModelTitle = (displayName: ModelDisplaySchema, fallback: string): string =>
{
    return displayName.ModelDisplayName || fallback;
};

/** 建立父層 TimelineItem Grid 欄位。 */
const buildTimelineItemColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    return [{
        key: TimelineItemFields.Date,
        title: getTimelineColumnTitle(displayName, TimelineItemTableId, TimelineItemFields.Date, "日期"),
        inputType: "date",
        editable: true,
        width: 180,
    }, {
        key: TimelineLangDetailColumnKey,
        title: getTimelineTableTitle(displayName, TimelineLangDetailTableId, "語系明細"),
        inputType: "readonly",
        editable: false,
        width: 140,
    }];
};

/** 建立子層語系明細 Grid 欄位。 */
const buildTimelineLangDetailColumns = (displayName: ModelDisplaySchema): ColumnConfig[] =>
{
    return [{
        key: TimelineLangDetailFields.Lang,
        title: getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Lang, "語系"),
        inputType: "readonly",
        editable: false,
        width: 120,
    }, {
        key: TimelineLangDetailFields.Title,
        title: getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Title, "事件標題"),
        inputType: "text",
        editable: true,
        maxLength: 200,
    }, {
        key: TimelineContentColumnKey,
        title: getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Content, "事件內容"),
        inputType: "readonly",
        editable: false,
        width: 140,
    }];
};

/** 建立父層 TimelineItem Row。 */
const buildTimelineItemGridRow = (
    item: TimelineItem,
    index: number,
    opt: UseTimelineItemEditGridOptions,
    displayName: ModelDisplaySchema,
): TimelineItemGridRow =>
{
    const rowId = Number(item.RowId ?? index + 1);
    return {
        keyId: `timeline-item-${rowId}`,
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        TimelineId: item.TimelineId,
        DetailRowId: rowId,
        cells: buildTimelineItemCells(item, rowId, opt, displayName),
    };
};

/** 建立父層 TimelineItem Cells。 */
const buildTimelineItemCells = (item: TimelineItem, rowId: number, opt: UseTimelineItemEditGridOptions, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            TimelineItemFields.Date,
            getTimelineColumnTitle(displayName, TimelineItemTableId, TimelineItemFields.Date, "日期"),
            item.Date ?? "",
            { inputType: "date", editable: true },
        ),
        buildEditGridCell(TimelineLangDetailColumnKey, getTimelineTableTitle(displayName, TimelineLangDetailTableId, "語系明細"), rowId, {
            inputType: "readonly",
            editable: false,
            render: opt.renderSubDetailToggle,
        }),
    ];
};

/** 建立子層 TimelineLangDetail Row。 */
const buildTimelineLangDetailGridRow = (
    detail: TimelineLangDetail,
    index: number,
    opt: UseTimelineLangDetailEditGridOptions,
    displayName: ModelDisplaySchema,
): TimelineLangDetailGridRow =>
{
    const rowId = Number(detail.RowId ?? index + 1);
    const lang = String(detail.Lang ?? "");
    return {
        keyId: `timeline-lang-${opt.parentRowId}-${rowId}-${lang}`,
        rowId,
        RowId: rowId,
        RowNo: index + 1,
        TimelineId: detail.TimelineId,
        ParentRowId: detail.ParentRowId,
        DetailRowId: rowId,
        Lang: lang,
        cells: buildTimelineLangDetailCells(detail, opt, displayName),
    };
};

/** 建立子層 TimelineLangDetail Cells。 */
const buildTimelineLangDetailCells = (detail: TimelineLangDetail, opt: UseTimelineLangDetailEditGridOptions, displayName: ModelDisplaySchema): RowCell[] =>
{
    return [
        buildEditGridCell(
            TimelineLangDetailFields.Lang,
            getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Lang, "語系"),
            detail.Lang ?? "",
            { inputType: "readonly", editable: false, render: args => getTimelineLangText(args.value) },
        ),
        buildEditGridCell(
            TimelineLangDetailFields.Title,
            getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Title, "事件標題"),
            detail.Title ?? "",
            { inputType: "text", editable: true, maxLength: 200 },
        ),
        buildEditGridCell(
            TimelineContentColumnKey,
            getTimelineColumnTitle(displayName, TimelineLangDetailTableId, TimelineLangDetailFields.Content, "事件內容"),
            detail.Content ?? "",
            { inputType: "readonly", editable: false, render: opt.renderContentToggle },
        ),
    ];
};

/** 建立父層 Grid 設定。 */
const buildTimelineItemGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseTimelineItemEditGridOptions) =>
{
    return {
        title: getTimelineTableTitle(displayName, TimelineItemTableId, "紀事項目"),
        style,
        canAdd: true,
        canEdit: true,
        canDelete: true,
        canDrag: false,
        showRowNo: true,
        maxVisibleRows: 5,
        addButtonText: "新增紀事項目",
        actionColumnTitle: "操作",
        emptyText: "目前沒有紀事項目",
        ariaLabel: `${getTimelineTableTitle(displayName, TimelineItemTableId, "紀事項目")}可編輯清單`,
        expandedRowKey: opt.expandedRowKey,
        disabled: opt.isSubDetailEditing,
        subDetailRowClassName: "edit-grid-sub-detail-row",
        subDetailRender: opt.renderSubDetail,
    };
};

/** 建立子層語系 Grid 設定。 */
const buildTimelineLangDetailGridProps = (parentRowId: number, style: IEditGridView_Style, displayName: ModelDisplaySchema) =>
{
    return {
        title: getTimelineTableTitle(displayName, TimelineLangDetailTableId, "語系明細"),
        style,
        canAdd: false,
        canEdit: true,
        canDelete: false,
        canDrag: false,
        showRowNo: false,
        maxVisibleRows: 5,
        actionColumnTitle: "操作",
        emptyText: "目前沒有語系明細",
        ariaLabel: `第 ${parentRowId} 筆紀事項目的語系明細`,
    };
};

/** 將父層 Grid Row 轉回 TimelineItem，並保留語系子明細。 */
const toTimelineItemModel = (source: TimelineFormModel, row: GridRow, index: number): TimelineItem =>
{
    const rowId = getEditGridRowId(row, index);
    const current = getTimelineItemByRowId(source, rowId);
    return {
        TimelineId: source.TimelineId ?? (row as TimelineItemGridRow).TimelineId,
        RowId: rowId,
        RowNo: index + 1,
        Date: getEditGridNullableStringCellValue(row, TimelineItemFields.Date),
        _TimelineLangDetail: current?._TimelineLangDetail ?? [],
    };
};

/** 將語系 Grid Row 轉回 TimelineLangDetail，並保留最新內容。 */
const toTimelineLangDetailModel = (source: TimelineFormModel, parentRowId: number, row: GridRow, index: number): TimelineLangDetail =>
{
    const rowId = getEditGridRowId(row, index);
    const existing = findTimelineLangDetail(source, parentRowId, row, rowId);
    return {
        TimelineId: source.TimelineId ?? (row as TimelineLangDetailGridRow).TimelineId,
        ParentRowId: parentRowId,
        RowId: rowId,
        RowNo: index + 1,
        Lang: getTimelineLangCellValue(row),
        Title: getEditGridNullableStringCellValue(row, TimelineLangDetailFields.Title),
        Content: existing?.Content ?? null,
    };
};

/** 建立新的 TimelineItem，並立即補齊所有支援語系。 */
const buildNewTimelineItem = (data: TimelineFormModel, rowId: number, rowNo: number): TimelineItem =>
{
    const item: TimelineItem = { TimelineId: data.TimelineId, RowId: rowId, RowNo: rowNo, Date: null };
    return { ...item, _TimelineLangDetail: buildMissingTimelineLangDetails(item, [], data.TimelineId) };
};

/** 建立新的 TimelineLangDetail。 */
const buildNewTimelineLangDetailItem = (data: TimelineFormModel, parentRowId: number, rowId: number, rowNo: number, lang: Lang): TimelineLangDetail =>
{
    return { TimelineId: data.TimelineId, ParentRowId: parentRowId, RowId: rowId, RowNo: rowNo, Lang: lang, Title: "", Content: "" };
};

/** 父層 Grid 寫回時，保留各紀事項目的語系子明細並補齊缺少語系。 */
const syncTimelineItemCollection = (data: TimelineFormModel, items: TimelineItem[]): TimelineFormModel =>
{
    const nextItems = items.map((item, index) => ensureTimelineItemLanguages(item, data.TimelineId, index + 1));
    return { ...data, _TimelineItem: nextItems };
};

/** 取得指定紀事項目的語系子明細。 */
const getTimelineLangDetails = (data: TimelineFormModel, parentRowId: number): TimelineLangDetail[] =>
{
    return getTimelineItemByRowId(data, parentRowId)?._TimelineLangDetail ?? [];
};

/** 寫回指定紀事項目的語系子明細，不改動其他紀事項目。 */
const setTimelineLangDetails = (data: TimelineFormModel, parentRowId: number, details: TimelineLangDetail[]): TimelineFormModel =>
{
    const normalized = normalizeTimelineLangDetails(data, parentRowId, details);
    const items = (data._TimelineItem ?? []).map(item => Number(item.RowId ?? 0) === parentRowId ? { ...item, _TimelineLangDetail: normalized } : item);
    return { ...data, _TimelineItem: items };
};

/** 正規化語系子明細的父鍵與顯示順序。 */
const normalizeTimelineLangDetails = (data: TimelineFormModel, parentRowId: number, details: TimelineLangDetail[]): TimelineLangDetail[] =>
{
    return details.map((detail, index) => ({
        ...detail,
        TimelineId: detail.TimelineId ?? data.TimelineId,
        ParentRowId: parentRowId,
        RowNo: index + 1,
    }));
};

/** 依 RowId 取得紀事項目。 */
const getTimelineItemByRowId = (data: TimelineFormModel, rowId: number): TimelineItem | undefined =>
{
    return (data._TimelineItem ?? []).find(item => Number(item.RowId ?? 0) === rowId);
};

/** 載入 FormModel 後補齊每一筆紀事項目的支援語系。 */
const useEnsureTimelineLangDetails = (binding: ServerFormBinding<TimelineFormModel>, preferLang: Lang): void =>
{
    const setFormData = binding.setFormData;
    useEffect(() =>
    {
        setFormData(prev => ({ ...prev, _TimelineItem: (prev._TimelineItem ?? []).map((item, index) => ensureTimelineItemLanguages(item, prev.TimelineId, index + 1, preferLang)) }));
    }, [preferLang, setFormData]);
};

/** 補齊單一紀事項目的語系子明細與排序欄位。 */
const ensureTimelineItemLanguages = (item: TimelineItem, timelineId?: string | null, rowNo?: number, preferLang: Lang = DefaultLang): TimelineItem =>
{
    const details = item._TimelineLangDetail ?? [];
    const missing = buildMissingTimelineLangDetails(item, details, timelineId);
    const sorted = sortTimelineLangDetails([...details, ...missing], preferLang).map((detail, index) => ({ ...detail, RowNo: index + 1 }));
    return { ...item, TimelineId: item.TimelineId ?? timelineId, RowNo: rowNo ?? item.RowNo, _TimelineLangDetail: sorted };
};

/** 建立指定 TimelineItem 缺少的語系明細。 */
const buildMissingTimelineLangDetails = (parent: TimelineItem, details: TimelineLangDetail[], timelineId?: string | null): TimelineLangDetail[] =>
{
    const existLangs = new Set(details.map(detail => String(detail.Lang ?? "").toLowerCase()));
    const maxRowId = details.reduce((max, detail) => Math.max(max, Number(detail.RowId ?? 0)), 0);
    return SUPPORTED_LANGS.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        TimelineId: parent.TimelineId ?? timelineId,
        ParentRowId: parent.RowId,
        RowId: maxRowId + index + 1,
        RowNo: details.length + index + 1,
        Lang: lang,
        Title: "",
        Content: "",
    }));
};

/** 依顯示順序排序 TimelineItem。 */
const sortTimelineItems = (items: TimelineItem[]): TimelineItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowNo ?? a.RowId ?? 0) - Number(b.RowNo ?? b.RowId ?? 0));
};

/** 依目前語系優先排序 TimelineLangDetail。 */
const sortTimelineLangDetails = (details: TimelineLangDetail[], preferLang: Lang): TimelineLangDetail[] =>
{
    const order = buildSupportedLangOrder(preferLang);
    return [...details].sort((a, b) => getTimelineLangOrder(a.Lang, order) - getTimelineLangOrder(b.Lang, order));
};

/** 取得語系排序權重。 */
const getTimelineLangOrder = (lang: string | null | undefined, order: string[]): number =>
{
    const index = order.indexOf(String(lang ?? "").toLowerCase());
    return index >= 0 ? index : order.length + 1;
};

/** 取得語系 Cell 文字值。 */
const getTimelineLangCellValue = (row: GridRow): Lang =>
{
    return (getEditGridStringCellValue(row, TimelineLangDetailFields.Lang) || (row as TimelineLangDetailGridRow).Lang || DefaultLang) as Lang;
};

/** 取得語系顯示文字。 */
const getTimelineLangText = (value: unknown): string =>
{
    const lang = String(value ?? "").toLowerCase() as Lang;
    return LangLabelMap[lang] ?? String(value ?? "Unknown");
};

/** 找出目前 binding 中最新的語系明細，避免 TinyMCE 內容被 Grid 儲存覆蓋。 */
const findTimelineLangDetail = (source: TimelineFormModel, parentRowId: number, row: GridRow, rowId: number): TimelineLangDetail | undefined =>
{
    const lang = getTimelineLangCellValue(row);
    return getTimelineLangDetails(source, parentRowId).find(detail =>
        Number(detail.RowId ?? 0) === Number(rowId)
        && String(detail.Lang ?? "").toLowerCase() === String(lang).toLowerCase()
    );
};

/** 由 Grid Row 建立語系子明細定位鍵。 */
const resolveTimelineLangDetailKey = (row: TimelineLangDetailGridRow): TimelineLangDetailKey =>
{
    return {
        parentRowId: Number(row.ParentRowId ?? 0),
        rowId: Number(row.DetailRowId ?? row.RowId ?? row.rowId ?? 0),
        lang: String(row.Lang ?? "").toLowerCase(),
    };
};

/** 依定位鍵取得語系子明細。 */
const getTimelineLangDetailByKey = (data: TimelineFormModel, key: TimelineLangDetailKey): TimelineLangDetail | undefined =>
{
    return getTimelineLangDetails(data, key.parentRowId).find(detail =>
        Number(detail.RowId ?? 0) === key.rowId
        && String(detail.Lang ?? "").toLowerCase() === key.lang
    );
};

/** 寫回指定語系子明細的事件內容。 */
const setTimelineLangDetailContent = (data: TimelineFormModel, key: TimelineLangDetailKey, content: string): TimelineFormModel =>
{
    const details = getTimelineLangDetails(data, key.parentRowId).map(detail =>
        Number(detail.RowId ?? 0) === key.rowId && String(detail.Lang ?? "").toLowerCase() === key.lang
            ? { ...detail, Content: content }
            : detail
    );
    return setTimelineLangDetails(data, key.parentRowId, details);
};

/** 取得子表顯示名稱，避免 Grid 標題寫死。 */
const getTimelineTableTitle = (displayName: ModelDisplaySchema, tableId: string, fallback: string): string =>
{
    const tableHit = displayName.Tables?.find(table => table.TableId === tableId);
    return tableHit?.TableDisplayName ?? fallback;
};

/** 依資料表與欄位代碼取得 ModelDisplayName 顯示文字。 */
const getTimelineColumnTitle = (displayName: ModelDisplaySchema, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = displayName.Tables ?? [];
    const tableHit = tables.find(table => table.TableId === tableId);
    const columnHit = tableHit?.Columns?.find(column => column.ColumnId === columnId);
    const fallbackHit = tables.flatMap(table => table.Columns ?? []).find(column => column.ColumnId === columnId);

    return columnHit?.ColumnDisplayName ?? fallbackHit?.ColumnDisplayName ?? fallback;
};
// #endregion
