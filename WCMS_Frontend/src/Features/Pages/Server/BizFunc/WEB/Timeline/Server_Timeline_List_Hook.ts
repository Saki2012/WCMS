import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDate, formatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import { createElement, useCallback, useMemo, type ReactNode } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type TimelineSet = components["schemas"]["TimelineSet_DTO"];

type TimelineApiAdapter = ReturnType<typeof TimelineAdapter>;

type TimelineCudActions = ReturnType<TimelineApiAdapter["hooks"]["useCudActions"]>;


export interface TimelineSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 紀事表名稱搜尋關鍵字 */
    title?: string;
}


export interface TimelineListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 紀事表列表資料 */
    list: TimelineSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}


export interface TimelineListAdapter
{
    /** 紀事表 API adapter */
    Timeline: TimelineApiAdapter;

    /** 紀事表 CUD 操作 */
    cudActions: TimelineCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}


export type TimelineListGridTemplate = ServerListGridTemplate<TimelineSearchParams, TimelineListRawData, TimelineListAdapter, QueryListParam>;


type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: TimelineCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const TIMELINE_NAME_SEARCH_KEY = "title";


/** 建立紀事表後台 ListGridTemplate 設定 */
export const useTimelineListGridTemplate = (opt: { lang: Lang; }): TimelineListGridTemplate =>
{
    return useMemo<TimelineListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Timeline,
            feature: {
                buildSearchFields: ({ rawData }) => buildTimelineSearchFields(rawData),
                toSearchParams: (values) => toTimelineSearchParams(values, opt.lang),
                buildSearchConditions: buildTimelineSearchConditions,
                buildQueryParam: buildTimelineQueryParam,
                useDataSource: useTimelineListGridDataSource,
                buildGridProps: (ctx) => buildTimelineGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};
// #endregion

// #region Private
/** 執行紀事表列表資料來源 Hook */
const useTimelineListGridDataSource = (
    ctx: ServerListGridDataSourceContext<TimelineSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<TimelineListRawData, TimelineListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() =>
    {
        return { Timeline: TimelineAdapter() };
    }, []);

    const cudActions = apiAdapter.Timeline.hooks.useCudActions({ onError });
    const grid = apiAdapter.Timeline.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() => (grid.errors ?? []).filter((x): x is string => Boolean(x)), [grid.errors]);
    const rawData = useMemo<TimelineListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData };
};


/** 建立紀事表搜尋欄位設定 */
const buildTimelineSearchFields = (rawData: TimelineListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, TimelineFields.TimelineName, "紀事表名稱");

    return [{ key: TIMELINE_NAME_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }];
};


/** 將 SearchValues 轉為紀事表列表查詢參數 */
const toTimelineSearchParams = (values: SearchValues, lang: Lang): TimelineSearchParams =>
{
    return { lang, title: getSearchStringValue(values[TIMELINE_NAME_SEARCH_KEY]) };
};


/** 建立紀事表搜尋條件 */
const buildTimelineSearchConditions = (ctx: { searchParams: TimelineSearchParams; }): string[] =>
{
    if (!ctx.searchParams.title) return [];

    return [`${TimelineFields.TimelineName} Like ${ctx.searchParams.title}`];
};


/** 建立紀事表列表完整 QueryParam */
const buildTimelineQueryParam = (ctx: { searchParams: TimelineSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildTimelineQueryFields();
    const langCondition = `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, langCondition, ctx.searchCondition);

    return { Fields: fields, Condition: condition, OrderBy: [{ Col: TimelineFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10 };
};


/** 建立紀事表列表查詢欄位 */
const buildTimelineQueryFields = (): string[] =>
{
    return [
        TimelineFields.TimelineId,
        TimelineFields.TimelineName,
        TimelineFields.ModifyUserId,
        TimelineFields.CreateTime,
        TimelineFields.ModifyTime,
        TimelineFields.InternalId,
        `${TimelineFields.ModifyUser}.${AccountFields.AccountName}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Title}`,
    ];
};


/** 將紀事表資料轉為 GridProps */
const buildTimelineGridProps = (
    opt: {
        raw: TimelineListRawData;
        lang: Lang;
        adapter?: TimelineListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [TimelineFields.TimelineName, "事件", TimelineFields.ModifyUserId, TimelineFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildTimelineRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceTimelineGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};


/** 注入紀事表 Grid 編輯與刪除動作 */
const enhanceTimelineGrid = (
    opt: {
        baseGrid: GridProps;
        raw: TimelineListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<TimelineSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(opt.baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Timeline?.InternalId ?? "",
    });
};


/** 建立紀事表列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: TimelineListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, `【${col}】`) }));
};


/** 建立紀事表列表列資料 */
const buildTimelineRows = (raw: TimelineListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = set.Timeline?.InternalId ?? LibMerge("|", false, set.Timeline?.TimelineId);
        const cells: RowCell[] = [
            { col: columns[0], content: set.Timeline?.TimelineName ?? "" },
            { col: columns[1], content: buildTimelineItemList(set, lang) },
            { col: columns[2], content: set.Timeline?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: formatDateTime(set.Timeline?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};


/** 建立紀事表事件預覽清單 */
const buildTimelineItemList = (set: TimelineSet, lang: Lang): ReactNode =>
{
    const items = buildTimelineItemTexts(set, lang);
    const showItems = items.slice(0, 5);
    const hasMore = items.length > 5;
    const children = hasMore ? [...showItems, { key: "more", text: "..." }] : showItems;

    return createElement(
        "ul",
        { className: "m-0 p-0", style: { listStylePosition: "inside" } },
        children.map((item) => createElement("li", { key: item.key, className: "m-0 p-0" }, item.text)),
    );
};


/** 建立紀事表事件顯示文字 */
const buildTimelineItemTexts = (set: TimelineSet, lang: Lang): { key: string; text: string; }[] =>
{
    return (set.TimelineItem ?? []).flatMap((item, itemIndex) =>
    {
        const details = item._TimelineLangDetail?.filter((detail) => detail?.Lang === lang) ?? [];

        return details.map((detail, detailIndex) => ({
            key: `${item.RowId ?? itemIndex}-${detail.RowId ?? detailIndex}-${detail.Lang ?? lang}`,
            text: `【${formatDate(item.Date)}】${detail.Title ?? ""}`,
        }));
    });
};


/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};


/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
// #endregion
