import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDate, formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import { createElement, type ReactNode, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type TimelineFormModel = components["schemas"]["Timeline"];

type TimelineApiAdapter = ReturnType<typeof TimelineAdapter>;

type TimelineCudActions = ReturnType<TimelineApiAdapter["hooks"]["useCudActions"]>;

export interface TimelineListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

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
    list: TimelineFormModel[];

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

export type TimelineListGridTemplate = ServerListGridTemplate<TimelineSearchParams, TimelineListRawData, TimelineListAdapter, QueryListParam, TimelineListPageState>;

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


const TIMELINE_LIST_STATE_KEY = "server-timeline-list";

const DEFAULT_TIMELINE_LIST_PAGE_STATE: TimelineListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立紀事表後台 ListGridTemplate 設定 */
export const useTimelineListGridTemplate = (opt: { lang: Lang; }): TimelineListGridTemplate =>
{
    const pageState = usePageStateMemory<TimelineListPageState>({
        stateKey: TIMELINE_LIST_STATE_KEY,
        defaultState: DEFAULT_TIMELINE_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<TimelineListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Timeline,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateTimelineSearchValues,
                updatePageNumber: updateTimelinePageNumber,
                getPagination: getTimelinePagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildTimelineSearchFields(rawData),
                toSearchParams: (values) => toTimelineSearchParams(values, opt.lang),
                buildSearchConditions: buildTimelineSearchConditions,
                buildQueryParam: buildTimelineQueryParam,
                useDataSource: useTimelineListGridDataSource,
                buildGridProps: (ctx) => buildTimelineGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新Timeline記憶狀態，並固定回到第一頁。 */
const updateTimelineSearchValues = (state: TimelineListPageState, searchValues: SearchValues): TimelineListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新Timeline列表記憶頁碼。 */
const updateTimelinePageNumber = (state: TimelineListPageState, pageNumber: number): TimelineListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的Timeline分頁資訊。 */
const getTimelinePagination = (rawData: TimelineListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

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
const buildTimelineQueryParam = (ctx: { pageNumber: number; searchParams: TimelineSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildTimelineQueryFields(),
        Condition: LibCondition.joinConditions([LibCondition.createCondition(`${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`, Operator.Equal, ctx.searchParams.lang), ctx.searchCondition]),
        OrderBy: [{ Col: TimelineFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
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
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
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
    const actions = createGridCrudActions<TimelineFormModel>({
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
        getInternalId: formModel => formModel.InternalId ?? "",
    });
};

/** 建立紀事表列表列資料 */
const buildTimelineRows = (raw: TimelineListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((formModel) =>
    {
        const keyId = formModel.InternalId ?? LibText.Merge("|", false, formModel.TimelineId);
        const cells: RowCell[] = [
            { col: columns[0], content: formModel.TimelineName ?? "" },
            { col: columns[1], content: buildTimelineItemList(formModel, lang) },
            { col: columns[2], content: formModel.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: formatDateTime(formModel.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 建立紀事表事件預覽清單 */
const buildTimelineItemList = (formModel: TimelineFormModel, lang: Lang): ReactNode =>
{
    const items = buildTimelineItemTexts(formModel, lang);
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
const buildTimelineItemTexts = (formModel: TimelineFormModel, lang: Lang): { key: string; text: string; }[] =>
{
    return (formModel._TimelineItem ?? []).flatMap((item, itemIndex) =>
    {
        const details = item._TimelineLangDetail?.filter((detail) => detail?.Lang === lang) ?? [];

        return details.map((detail, detailIndex) => ({
            key: `${item.RowId ?? itemIndex}-${detail.RowId ?? detailIndex}-${detail.Lang ?? lang}`,
            text: `【${formatDate(item.Date)}】${detail.Title ?? ""}`,
        }));
    });
};

// #endregion
