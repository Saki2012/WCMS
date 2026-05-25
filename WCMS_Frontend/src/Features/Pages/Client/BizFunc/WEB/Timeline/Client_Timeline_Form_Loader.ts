import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";

// #region Types
type QueryListParam = components["schemas"]["QueryListParam"];
type TimelineSet = components["schemas"]["TimelineSet_DTO"];

export interface ITimelineOptions
{
    TimelineId?: string;
    IsDesc?: boolean;
}

export interface TimelineFormLoaderArgs
{
    lang: Lang;
    timelineId: string;
    isDesc: boolean;
    queryParam: QueryListParam;
}

export interface TimelineFormLoaderRes
{
    listRes: TimelineSet[];
    dataRes: TimelineSet | null;
}

export interface TimelineFormLoaderData
{
    args: TimelineFormLoaderArgs;
    res: TimelineFormLoaderRes;
}

export type TimelineFormRawData = {
    lang: Lang;
    timelineId: string;
    isDesc: boolean;
    data: TimelineSet;
    listData: TimelineSet[];
    title: string;
    args: TimelineFormLoaderArgs;
};

export type TimelineFormAdapter = {
    Timeline: ReturnType<typeof TimelineAdapter>;
};

export interface TimelineFormFetchDataResult extends TimelineFormRawData
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    onPageChange: (page: number) => void;
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}

export interface UseTimelineFormDataResult extends TimelineFormFetchDataResult {}
// #endregion

type TimelineFormSearchParams = {
    lang: Lang;
    timelineId: string;
    isDesc: boolean;
};

type TimelineFormDataQueryTemplate = ClientDataQueryTemplate<
    TimelineFormSearchParams,
    TimelineFormRawData,
    TimelineFormRawData,
    TimelineFormAdapter,
    QueryListParam,
    TimelineFormLoaderData
>;

const FORM_PAGE_NUMBER = 1;
const FORM_PAGE_SIZE = 1;
const defaultEmptyData: TimelineSet = { Timeline: {}, TimelineItem: [], TimelineLangDetail: [] };

// #region Shared Builder
/** 取得安全的 TimelineId */
const getSafeTimelineId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 跳脫查詢字串雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // 宣告變數
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};

/** 建立 Timeline Form 查詢條件 */
const buildTimelineFormCondition = (p: { lang: Lang; timelineId: string; }): string =>
{
    // 宣告變數
    const timelineId = escapeQueryValue(getSafeTimelineId(p.timelineId));
    const lang = escapeQueryValue(p.lang);
    if (!timelineId) return "1=0";

    // return
    return LibMerge(
        " And ",
        false,
        `${TimelineFields.TimelineId} = "${timelineId}"`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang} = "${lang}"`,
    );
};

/** 建立 Timeline Form QueryList 欄位清單 */
const buildTimelineFormFields = (): string[] =>
{
    // return
    return [
        TimelineFields.TimelineId,
        TimelineFields.TimelineName,
        `${TimelineFields._TimelineItem}.${TimelineItemFields.TimelineId}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields.RowId}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.TimelineId}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.ParentRowId}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.RowId}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Title}`,
        `${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Content}`,
    ];
};

/** 建立 Timeline Form QueryListParam，Form 固定只查單筆 */
const buildTimelineFormQueryParam = (p: { condition: string; isDesc: boolean; }): QueryListParam =>
{
    // return
    return {
        Fields: buildTimelineFormFields(),
        Condition: p.condition,
        OrderBy: [{ Col: `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`, Desc: p.isDesc }],
        PageNumber: FORM_PAGE_NUMBER,
        PageSize: FORM_PAGE_SIZE,
    };
};

/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildTimelineFormLoaderArgs = (p: { lang: Lang; timelineId: string; isDesc: boolean; queryParam?: QueryListParam; }): TimelineFormLoaderArgs =>
{
    // 宣告變數
    const safeTimelineId = getSafeTimelineId(p.timelineId);
    const condition = buildTimelineFormCondition({ lang: p.lang, timelineId: safeTimelineId });
    const queryParam = p.queryParam ?? buildTimelineFormQueryParam({ condition, isDesc: p.isDesc });

    // return
    return { lang: p.lang, timelineId: safeTimelineId, isDesc: p.isDesc, queryParam };
};

/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (
    p: { loaderData: TimelineFormLoaderData | null; queryParam: QueryListParam; fallbackData: TimelineSet; },
): ApiLoaderData<QueryListParam, TimelineSet[]> | null =>
{
    // 宣告變數
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;

    // return
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};

/** 依資料取得 Timeline 標題 */
const getTimelineTitle = (data: TimelineSet): string =>
{
    // return
    return `${data.Timeline?.TimelineName ?? ""}`.trim();
};

/** 建立 Timeline Form 初始 ViewState */
const buildTimelineFormInitialViewState = (): IListViewState =>
{
    // return
    return { pageNumber: FORM_PAGE_NUMBER, pageSize: FORM_PAGE_SIZE } as IListViewState;
};

/** 建立 Timeline Form Template 查詢參數 */
const buildTimelineFormSearchParams = (p: { lang: Lang; timelineId: string; isDesc: boolean; }): TimelineFormSearchParams =>
{
    // return
    return { lang: p.lang, timelineId: getSafeTimelineId(p.timelineId), isDesc: p.isDesc };
};

/** 建立 Timeline Form DataQueryTemplate */
const createTimelineFormDataQueryTemplate = (p: { lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; }): TimelineFormDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildTimelineFormInitialViewState();

    // return
    return {
        featureKey: "TimelineForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildTimelineFormSearchParams({ lang: p.lang, timelineId: p.timelineId, isDesc: p.isDesc }),
            buildSearchConditions: (ctx) => [buildTimelineFormCondition({ lang: ctx.searchParams.lang, timelineId: ctx.searchParams.timelineId })],
            buildQueryParam: (ctx) => buildTimelineFormQueryParam({ condition: ctx.searchCondition, isDesc: ctx.searchParams.isDesc }),
            useDataSource: (ctx) => useTimelineFormDataSource({
                queryParam: ctx.queryParam,
                loaderData: ctx.loaderData,
                lang: ctx.searchParams.lang,
                timelineId: ctx.searchParams.timelineId,
                isDesc: ctx.searchParams.isDesc,
                emptyData: p.emptyData,
            }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildTimelineFormQueryState = (p: { lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; }) =>
{
    // 宣告變數
    const template = createTimelineFormDataQueryTemplate(p);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, buildTimelineFormInitialViewState());
};
// #endregion

// #region SSR Loader
/** SSR Loader：改以 QueryList 預載 Timeline Form 單筆資料 */
export const TimelineForm_Loader =
    (p: { lang: Lang; opts?: ITimelineOptions; overrides?: Partial<{ timelineId: string; isDesc: boolean; }>; }) =>
    async ({ request, params }: LoaderFunctionArgs): Promise<TimelineFormLoaderData> =>
    {
        // 宣告變數
        const timelineId = getSafeTimelineId(p.overrides?.timelineId ?? p.opts?.TimelineId);
        const isDesc = Boolean(p.overrides?.isDesc ?? p.opts?.IsDesc ?? false);
        const ssrApi = getSsrApi(request);
        const adapter = TimelineAdapter(ssrApi);
        const queryState = buildTimelineFormQueryState({ lang: p.lang, timelineId, isDesc, emptyData: defaultEmptyData });
        const args = buildTimelineFormLoaderArgs({ lang: p.lang, timelineId, isDesc, queryParam: queryState.queryParam });

        // 執行 function
        if (!timelineId)
        {
            return { args, res: { listRes: [], dataRes: null } };
        }

        const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
        const listLD = await listLoader({ request, params } as LoaderFunctionArgs);
        const listRes = listLD.apiRes.Data ?? [];

        // return
        return { args, res: { listRes, dataRes: listRes[0] ?? null } };
    };
// #endregion

// #region CSR Hook
/** Timeline Form DataSource：統一處理 QueryList 單筆資料 */
const useTimelineFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: TimelineFormLoaderData | null; lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; },
): ClientDataQueryDataSourceResult<TimelineFormRawData, TimelineFormAdapter> =>
{
    // 宣告變數
    const adapter = useMemo<TimelineFormAdapter>(() => ({ Timeline: TimelineAdapter() }), []);

    const currentArgs = useMemo(() =>
    {
        return buildTimelineFormLoaderArgs({ lang: p.lang, timelineId: p.timelineId, isDesc: p.isDesc, queryParam: p.queryParam });
    }, [p.lang, p.timelineId, p.isDesc, p.queryParam]);

    const listInitial = useMemo(() =>
    {
        return buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData });
    }, [p.loaderData, p.queryParam, p.emptyData]);

    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);

    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Timeline.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });

    const listData = useMemo<TimelineSet[]>(() => useData.data ?? [], [useData.data]);
    const data = useMemo<TimelineSet>(() => listData[0] ?? p.emptyData, [listData, p.emptyData]);
    const title = useMemo(() => getTimelineTitle(data), [data]);

    const rawData = useMemo<TimelineFormRawData>(() =>
    {
        return { lang: currentArgs.lang, timelineId: currentArgs.timelineId, isDesc: currentArgs.isDesc, data, listData, title, args: currentArgs };
    }, [currentArgs, data, listData, title]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    // return
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors: [useData.errorText], paginator: null, refetchData };
};

/** 內部共用：建立 Timeline Form Template VM */
const useTimelineFormTemplate = (opt: { lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; }) =>
{
    // 宣告變數
    const template = useMemo(() =>
    {
        return createTimelineFormDataQueryTemplate({ lang: opt.lang, timelineId: opt.timelineId, isDesc: opt.isDesc, emptyData: opt.emptyData });
    }, [opt.lang, opt.timelineId, opt.isDesc, opt.emptyData]);

    // return
    return useClientDataQueryTemplate(template);
};

/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useTimelineFormData = (opt: { lang: Lang; opts?: ITimelineOptions; emptyData?: TimelineSet; }): UseTimelineFormDataResult =>
{
    // 宣告變數
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const timelineId = getSafeTimelineId(opt.opts?.TimelineId);
    const isDesc = Boolean(opt.opts?.IsDesc ?? false);
    const templateVm = useTimelineFormTemplate({ lang: opt.lang, timelineId, isDesc, emptyData: fallbackData });
    const errorList = templateVm.errorList;
    const onPageChange = useCallback((_page: number): void => undefined, []);

    // return
    return {
        ...templateVm.viewModel,
        pageSize: FORM_PAGE_SIZE,
        pageNumber: FORM_PAGE_NUMBER,
        totalPages: FORM_PAGE_NUMBER,
        totalCount: templateVm.viewModel.listData.length,
        isLoading: templateVm.isLoading,
        errorText: errorList[0] ?? null,
        errorList,
        onPageChange,
        refetchData: templateVm.refetchData,
        refetchRefData: templateVm.refetchRefData,
    };
};

/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const useTimelineFormFetchData = (p: { lang: Lang; opts?: ITimelineOptions; }): TimelineFormFetchDataResult =>
{
    // return
    return useTimelineFormData({ lang: p.lang, opts: p.opts });
};
// #endregion
