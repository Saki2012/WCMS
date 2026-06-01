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
import { type Lang, LangLabelMap, SUPPORTED_LANGS, useEnsureLangDetails } from "@/SysCore/i18n/lang";
import type { ApiFormInitial } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { TimelineItemFields, TimelineLangDetailFields, TimelineSetFields } from "@/types/SchemaFields";
import type { ReactNode } from "react";
import { useMemo } from "react";

// #region Property
type TimelineSet = components["schemas"]["TimelineSet_DTO"];
type TimelineItem = NonNullable<TimelineSet["TimelineItem"]>[number];
type TimelineLangDetail = NonNullable<TimelineSet["TimelineLangDetail"]>[number];

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
    emptyData: TimelineSet;

    /** Form Template 標準動作設定 */
    actionsOpt: TimelineFormActionsOpt;
}

export interface UseTimelineItemEditGridOptions
{
    /** 新版 Form Template 提供的資料 binding */
    binding: ServerFormBinding<TimelineSet>;

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
    binding: ServerFormBinding<TimelineSet>;

    /** TimelineItem 的 RowId */
    parentRowId: number;

    /** 目前語系，會優先排序 */
    lang: Lang;

    /** EditGrid UI 樣式，仍由 Comp 決定 */
    style: IEditGridView_Style;

    /** TinyMCE 展開按鈕渲染，畫面職責留在 Comp */
    renderContentToggle: (args: EditGridCellRenderArgs) => ReactNode;
}

export const timelineEmptyData: TimelineSet = { Timeline: {}, TimelineItem: [{ RowId: 1, Date: null }], TimelineLangDetail: [] };
export const TimelineLangDetailColumnKey = "__TimelineLangDetail";
export const TimelineContentColumnKey = "__TimelineContent";

export type TimelineFormRefs = Record<string, never>;

export type TimelineFormActionsOpt = {
    /** 儲存成功後要回到列表（或其他導頁） */
    onBackToList: () => void;
};

export type TimelineFormAdapter = {
    /** Timeline 主資料 Adapter */
    Timeline: ReturnType<typeof TimelineAdapter>;
};
// #endregion

// #region Public
/** 建立 Timeline Form Template，統一交給 Server_FormTemplate 處理資料流程。 */
export const useTimelineFormTemplate = (
    opt: UseTimelineFormTemplateOptions,
): ServerFormTemplate<TimelineSet, TimelineFormAdapter, TimelineFormRefs, ServerFormDefaultRawData<TimelineSet, TimelineFormRefs>, TimelineFormActionsOpt> =>
{
    return useMemo(() =>
    {
        return {
            featureKey: "Timeline",
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

    return useEditGridBinding<TimelineSet, TimelineItem, TimelineItemGridRow>({
        binding: opt.binding,
        emptyData: timelineEmptyData,
        getItems: data => data.TimelineItem,
        setItems: syncTimelineItemCollection,
        columns,
        getItemRowId: item => item.RowId,
        sortItems: sortTimelineItems,
        createItem: ctx => buildNewTimelineItem(ctx.data, ctx.nextRowId),
        toRow: (item, index) => buildTimelineItemGridRow(item, index, opt, displayName),
        toItem: (row, index, ctx) => toTimelineItemDto(ctx.data, row, index),
        editGridProps: buildTimelineItemGridProps(opt.style, displayName, opt),
    });
};

/** 建立 TimelineLangDetail 子層 EditGrid binding，TinyMCE 另以展開區塊呈現。 */
export const useTimelineLangDetailEditGrid = (opt: UseTimelineLangDetailEditGridOptions) =>
{
    const displayName = opt.binding.displayName;
    const columns = useMemo(() => buildTimelineLangDetailColumns(displayName), [displayName]);

    return useEditGridBinding<TimelineSet, TimelineLangDetail, TimelineLangDetailGridRow>({
        binding: opt.binding,
        emptyData: timelineEmptyData,
        collectionName: TimelineSetFields.TimelineLangDetail,
        parent: buildTimelineLangDetailParent(opt.parentRowId),
        columns,
        getItemRowId: detail => detail.RowId,
        sortItems: details => sortTimelineLangDetails(details, opt.lang),
        createItem: ctx => buildNewTimelineLangDetailItem(ctx.data, opt.parentRowId, ctx.nextRowId, opt.lang),
        toRow: (detail, index) => buildTimelineLangDetailGridRow(detail, index, opt, displayName),
        toItem: (row, index, ctx) => toTimelineLangDetailDto(ctx.data, opt.parentRowId, row, index),
        editGridProps: buildTimelineLangDetailGridProps(opt.parentRowId, opt.style, displayName),
    });
};
// #endregion

// #region Timing
/** 建立 Timeline Form 標題，功能名稱優先讀 ModelDisplayName。 */
const buildTimelineFormTitle = (ctx: { mode: "new" | "edit"; displayName: ModelDisplaySchema; }): string =>
{
    const modelTitle = getTimelineModelTitle(ctx.displayName, "紀事表");
    return `${ctx.mode === "edit" ? "修改" : "新增"}${modelTitle}`;
};

/** 建立新增模式的 initial data，統一由 Feature Timing 交給 Template。 */
const buildTimelineInitialData = (ctx: { mode: "new" | "edit"; emptyData: TimelineSet; }): ApiFormInitial<TimelineSet> | undefined =>
{
    if (ctx.mode !== "new") return undefined;
    return { data: { args: "__new__", apiRes: { IsSuccess: true, Data: ctx.emptyData, SysMessage: [] } } };
};

/** 建立 Timeline Form 會使用到的 Adapter 群組。 */
const buildTimelineFormAdapter = (): TimelineFormAdapter =>
{
    return { Timeline: TimelineAdapter() };
};

/** 補齊 TimelineItem 底下的語系明細，參照資料目前不需額外查詢。 */
const useTimelineReferenceData = (ctx: { binding: ServerFormBinding<TimelineSet>; lang: Lang; }) =>
{
    useEnsureLangDetails(ctx.binding, {
        headerName: TimelineSetFields.TimelineItem,
        detailName: TimelineSetFields.TimelineLangDetail,
        parentKeys: [TimelineLangDetailFields.TimelineId, TimelineLangDetailFields.ParentRowId],
        langs: SUPPORTED_LANGS,
        preferFirstLang: ctx.lang,
    });

    return useMemo(() =>
    {
        return { refs: {}, isLoading: false, errors: [], refetchRefData: undefined };
    }, []);
};
// #endregion

// #region Private
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
        title: getTimelineColumnTitle(displayName, TimelineSetFields.TimelineItem, TimelineItemFields.Date, "日期"),
        inputType: "date",
        editable: true,
        width: 180,
    }, {
        key: TimelineLangDetailColumnKey,
        title: getTimelineTableTitle(displayName, TimelineSetFields.TimelineLangDetail, "語系明細"),
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
        title: getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Lang, "語系"),
        inputType: "readonly",
        editable: false,
        width: 120,
    }, {
        key: TimelineLangDetailFields.Title,
        title: getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Title, "事件標題"),
        inputType: "text",
        editable: true,
        maxLength: 200,
    }, {
        key: TimelineContentColumnKey,
        title: getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Content, "事件內容"),
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
            getTimelineColumnTitle(displayName, TimelineSetFields.TimelineItem, TimelineItemFields.Date, "日期"),
            item.Date ?? "",
            { inputType: "date", editable: true },
        ),
        buildEditGridCell(TimelineLangDetailColumnKey, getTimelineTableTitle(displayName, TimelineSetFields.TimelineLangDetail, "語系明細"), rowId, {
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
            getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Lang, "語系"),
            detail.Lang ?? "",
            { inputType: "readonly", editable: false, render: args => getTimelineLangText(args.value) },
        ),
        buildEditGridCell(
            TimelineLangDetailFields.Title,
            getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Title, "事件標題"),
            detail.Title ?? "",
            { inputType: "text", editable: true, maxLength: 200 },
        ),
        buildEditGridCell(
            TimelineContentColumnKey,
            getTimelineColumnTitle(displayName, TimelineSetFields.TimelineLangDetail, TimelineLangDetailFields.Content, "事件內容"),
            detail.Content ?? "",
            { inputType: "readonly", editable: false, render: opt.renderContentToggle },
        ),
    ];
};

/** 建立父層 Grid 設定。 */
const buildTimelineItemGridProps = (style: IEditGridView_Style, displayName: ModelDisplaySchema, opt: UseTimelineItemEditGridOptions) =>
{
    return {
        title: getTimelineTableTitle(displayName, TimelineSetFields.TimelineItem, "紀事項目"),
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
        ariaLabel: `${getTimelineTableTitle(displayName, TimelineSetFields.TimelineItem, "紀事項目")}可編輯清單`,
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
        title: getTimelineTableTitle(displayName, TimelineSetFields.TimelineLangDetail, "語系明細"),
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

/** 將父層 Grid Row 轉回 DTO。 */
const toTimelineItemDto = (source: TimelineSet, row: GridRow, index: number): TimelineItem =>
{
    const rowId = getEditGridRowId(row, index);
    return {
        TimelineId: source.Timeline?.TimelineId ?? (row as TimelineItemGridRow).TimelineId,
        RowId: rowId,
        Date: getEditGridNullableStringCellValue(row, TimelineItemFields.Date),
    };
};

/** 將語系 Grid Row 轉回 DTO，Content 以目前 binding 最新資料為準。 */
const toTimelineLangDetailDto = (source: TimelineSet, parentRowId: number, row: GridRow, index: number): TimelineLangDetail =>
{
    const rowId = getEditGridRowId(row, index);
    const existing = findTimelineLangDetail(source, parentRowId, row, rowId);
    return {
        TimelineId: source.Timeline?.TimelineId ?? (row as TimelineLangDetailGridRow).TimelineId,
        ParentRowId: parentRowId,
        RowId: rowId,
        Lang: getTimelineLangCellValue(row),
        Title: getEditGridNullableStringCellValue(row, TimelineLangDetailFields.Title),
        Content: existing?.Content ?? null,
    };
};

/** 建立新的 TimelineItem。 */
const buildNewTimelineItem = (data: TimelineSet, rowId: number): TimelineItem =>
{
    return { TimelineId: data.Timeline?.TimelineId, RowId: rowId, Date: null };
};

/** 建立新的 TimelineLangDetail。 */
const buildNewTimelineLangDetailItem = (data: TimelineSet, parentRowId: number, rowId: number, lang: Lang): TimelineLangDetail =>
{
    return { TimelineId: data.Timeline?.TimelineId, ParentRowId: parentRowId, RowId: rowId, Lang: lang, Title: "", Content: "" };
};

/** 父層 Grid 寫回時，同步保留有效語系明細並補齊缺少語系。 */
const syncTimelineItemCollection = (data: TimelineSet, items: TimelineItem[]): TimelineSet =>
{
    return { ...data, TimelineItem: items, TimelineLangDetail: syncTimelineLangDetailParents(data.TimelineLangDetail ?? [], items, data.Timeline?.TimelineId) };
};

/** 清理孤兒語系明細，並替每個 TimelineItem 補齊支援語系。 */
const syncTimelineLangDetailParents = (details: TimelineLangDetail[], parents: TimelineItem[], timelineId?: string | null): TimelineLangDetail[] =>
{
    const parentKeys = new Set(parents.map(parent => String(parent.RowId ?? 0)));
    const keptDetails = details.filter(detail => parentKeys.has(String(detail.ParentRowId ?? 0)));
    const missingDetails = parents.flatMap(parent => buildMissingTimelineLangDetails(parent, keptDetails, timelineId));

    return [...keptDetails, ...missingDetails];
};

/** 建立指定 TimelineItem 缺少的語系明細。 */
const buildMissingTimelineLangDetails = (parent: TimelineItem, details: TimelineLangDetail[], timelineId?: string | null): TimelineLangDetail[] =>
{
    const siblings = details.filter(detail => Number(detail.ParentRowId ?? 0) === Number(parent.RowId ?? 0));
    const existLangs = new Set(siblings.map(detail => String(detail.Lang ?? "").toLowerCase()));
    const maxRowId = siblings.reduce((max, detail) => Math.max(max, Number(detail.RowId ?? 0)), 0);

    return SUPPORTED_LANGS.filter(lang => !existLangs.has(lang.toLowerCase())).map((lang, index) => ({
        TimelineId: parent.TimelineId ?? timelineId,
        ParentRowId: parent.RowId,
        RowId: maxRowId + index + 1,
        Lang: lang,
        Title: "",
        Content: "",
    }));
};

/** 建立語系明細 parent 綁定，讓共用 Hook 自動過濾同一筆紀事項目。 */
const buildTimelineLangDetailParent = (parentRowId: number) =>
{
    return {
        field: TimelineLangDetailFields.ParentRowId,
        value: parentRowId,
        compare: (itemValue: unknown, parentValue: string | number | null | undefined) => Number(itemValue ?? 0) === Number(parentValue ?? 0),
    };
};

/** 依 RowId 排序 TimelineItem。 */
const sortTimelineItems = (items: TimelineItem[]): TimelineItem[] =>
{
    return [...items].sort((a, b) => Number(a.RowId ?? 0) - Number(b.RowId ?? 0));
};

/** 依目前語系優先排序 TimelineLangDetail。 */
const sortTimelineLangDetails = (details: TimelineLangDetail[], preferLang: Lang): TimelineLangDetail[] =>
{
    const order = buildSupportedLangOrder(preferLang);
    return [...details].sort((a, b) => getTimelineLangOrder(a.Lang, order) - getTimelineLangOrder(b.Lang, order));
};

/** 建立目前支援語系順序，當前語系優先。 */
const buildSupportedLangOrder = (preferLang: Lang): string[] =>
{
    const langs = [preferLang, ...SUPPORTED_LANGS];
    return langs.map(lang => String(lang).toLowerCase()).filter((lang, index, list) => list.indexOf(lang) === index);
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
    return (getEditGridStringCellValue(row, TimelineLangDetailFields.Lang) || (row as TimelineLangDetailGridRow).Lang || "zh-tw") as Lang;
};

/** 取得語系顯示文字。 */
const getTimelineLangText = (value: unknown): string =>
{
    const lang = String(value ?? "").toLowerCase() as Lang;
    return LangLabelMap[lang] ?? String(value ?? "Unknown");
};

/** 找出目前 binding 中最新的語系明細，避免 TinyMCE 內容被 Grid 儲存覆蓋。 */
const findTimelineLangDetail = (source: TimelineSet, parentRowId: number, row: GridRow, rowId: number): TimelineLangDetail | undefined =>
{
    const lang = getTimelineLangCellValue(row);
    return (source.TimelineLangDetail ?? []).find(detail =>
        Number(detail.ParentRowId ?? 0) === Number(parentRowId)
        && Number(detail.RowId ?? 0) === Number(rowId)
        && String(detail.Lang ?? "").toLowerCase() === String(lang).toLowerCase()
    );
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
