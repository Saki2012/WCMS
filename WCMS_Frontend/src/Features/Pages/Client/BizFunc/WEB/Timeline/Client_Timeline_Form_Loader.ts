import { TimelineAdapter } from "@/Features/Hooks/BizFunc/WEB/Timeline_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { TimelineFields, TimelineItemFields, TimelineLangDetailFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
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
export type UseTimelineFormDataResult = TimelineFormFetchDataResult;
type TimelineFormSearchParams = { lang: Lang; timelineId: string; isDesc: boolean; };
type TimelineFormDataQueryTemplate = ClientDataQueryTemplate<TimelineFormSearchParams, TimelineFormRawData, TimelineFormRawData, TimelineFormAdapter, QueryListParam, TimelineFormLoaderData>;
const FORM_PAGE_NUMBER = 1;
const FORM_PAGE_SIZE = 1;
const defaultEmptyData: TimelineSet = { Timeline: {}, TimelineItem: [], TimelineLangDetail: [] };
// #endregion

// #region Public
/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildTimelineFormLoaderArgs = (p: { lang: Lang; timelineId: string; isDesc: boolean; queryParam?: QueryListParam; }): TimelineFormLoaderArgs =>
{
    const safeTimelineId = LibText.safeTrim(p.timelineId);
    const condition = buildTimelineFormCondition({ lang: p.lang, timelineId: safeTimelineId });
    const queryParam = p.queryParam ?? buildTimelineFormQueryParam({ condition, isDesc: p.isDesc });
    return { lang: p.lang, timelineId: safeTimelineId, isDesc: p.isDesc, queryParam };
};
/** SSR Loader：改以 QueryList 預載 Timeline Form 單筆資料 */
export const Client_TimelineForm_Loader = (p: { lang: Lang; opts?: ITimelineOptions; overrides?: Partial<{ timelineId: string; isDesc: boolean; }>; }) => async ({ request, params }: LoaderFunctionArgs): Promise<TimelineFormLoaderData> =>
{
    const timelineId = LibText.safeTrim(p.overrides?.timelineId ?? p.opts?.TimelineId);
    const isDesc = Boolean(p.overrides?.isDesc ?? p.opts?.IsDesc ?? false);
    const ssrApi = getSsrApi(request);
    const adapter = TimelineAdapter(ssrApi);
    const queryState = buildTimelineFormQueryState({ lang: p.lang, timelineId, isDesc, emptyData: defaultEmptyData });
    const args = buildTimelineFormLoaderArgs({ lang: p.lang, timelineId, isDesc, queryParam: queryState.queryParam });
    if (!timelineId)
    {
        return { args, res: { listRes: [] } };
    }
    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const listLD = await listLoader({ request, params } as LoaderFunctionArgs);
    const listRes = listLD.apiRes.Data ?? [];
    return { args, res: { listRes } };
};
/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useTimelineFormData = (opt: { lang: Lang; opts?: ITimelineOptions; emptyData?: TimelineSet; }): UseTimelineFormDataResult =>
{
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const timelineId = LibText.safeTrim(opt.opts?.TimelineId);
    const isDesc = Boolean(opt.opts?.IsDesc ?? false);
    const templateVm = useTimelineFormTemplate({ lang: opt.lang, timelineId, isDesc, emptyData: fallbackData });
    const errorList = templateVm.errorList;
    const onPageChange = useCallback((_page: number): void => undefined, []);
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
    return useTimelineFormData({ lang: p.lang, opts: p.opts });
};
// #endregion

// #region Private
/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };
    return { args, apiRes };
};
/** 建立 Timeline Form 查詢條件 */
const buildTimelineFormCondition = (p: { lang: Lang; timelineId: string; }): string =>
{
    const timelineId = LibText.safeTrim(p.timelineId);
    const lang = LibText.safeTrim(p.lang);
    if (!timelineId) return "1=0";
    return LibCondition.joinConditions([
        LibCondition.createCondition(TimelineFields.TimelineId, Operator.Equal, timelineId),
        LibCondition.createCondition(`${TimelineFields._TimelineItem}.${TimelineItemFields._TimelineLangDetail}.${TimelineLangDetailFields.Lang}`, Operator.Equal, lang),
    ]) || "1=0";
};
/** 建立 Timeline Form QueryList 欄位清單 */
const buildTimelineFormFields = (): string[] =>
{
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
    return { Fields: buildTimelineFormFields(), Condition: p.condition, OrderBy: [{ Col: `${TimelineFields._TimelineItem}.${TimelineItemFields.Date}`, Desc: p.isDesc }], PageNumber: FORM_PAGE_NUMBER, PageSize: FORM_PAGE_SIZE };
};
/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (p: { loaderData: TimelineFormLoaderData | null; queryParam: QueryListParam; fallbackData: TimelineSet; }): ApiLoaderData<QueryListParam, TimelineSet[]> | null =>
{
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};
/** 建立 Timeline Form 初始 ViewState */
const buildTimelineFormInitialViewState = (): IListViewState =>
{
    return { pageNumber: FORM_PAGE_NUMBER, pageSize: FORM_PAGE_SIZE };
};
/** 建立 Timeline Form Template 查詢參數 */
const buildTimelineFormSearchParams = (p: { lang: Lang; timelineId: string; isDesc: boolean; }): TimelineFormSearchParams =>
{
    return { lang: p.lang, timelineId: LibText.safeTrim(p.timelineId), isDesc: p.isDesc };
};
/** 建立 Timeline Form DataQueryTemplate */
const createTimelineFormDataQueryTemplate = (p: { lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; }): TimelineFormDataQueryTemplate =>
{
    const initialViewState = buildTimelineFormInitialViewState();
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
            useDataSource: (ctx) =>
                useTimelineFormDataSource({
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
    const template = createTimelineFormDataQueryTemplate(p);
    return buildClientDataQueryState(template, {} as SearchValues, buildTimelineFormInitialViewState());
};
/** Timeline Form DataSource：統一處理 QueryList 單筆資料 */
const useTimelineFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: TimelineFormLoaderData | null; lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; },
): ClientDataQueryDataSourceResult<TimelineFormRawData, TimelineFormAdapter> =>
{
    const adapter = useMemo<TimelineFormAdapter>(() => ({ Timeline: TimelineAdapter() }), []);
    const currentArgs = useMemo(() => buildTimelineFormLoaderArgs({ lang: p.lang, timelineId: p.timelineId, isDesc: p.isDesc, queryParam: p.queryParam }), [p.lang, p.timelineId, p.isDesc, p.queryParam]);
    const listInitial = useMemo(() => buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData }), [p.loaderData, p.queryParam, p.emptyData]);
    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);
    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Timeline.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });
    const listData = useMemo<TimelineSet[]>(() => useData.data ?? [], [useData.data]);
    const data = useMemo<TimelineSet>(() => listData[0] ?? p.emptyData, [listData, p.emptyData]);
    const title = useMemo(() => LibText.safeTrim(data.Timeline?.TimelineName), [data.Timeline?.TimelineName]);
    const rawData = useMemo<TimelineFormRawData>(() => ({ lang: currentArgs.lang, timelineId: currentArgs.timelineId, isDesc: currentArgs.isDesc, data, listData, title, args: currentArgs }), [currentArgs, data, listData, title]);
    const refetchData = useCallback(async (): Promise<void> => (await Promise.resolve(useData.refetch())), [useData.refetch]);
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors: [useData.errorText], paginator: null, refetchData };
};
/** 內部共用：建立 Timeline Form Template VM */
const useTimelineFormTemplate = (opt: { lang: Lang; timelineId: string; isDesc: boolean; emptyData: TimelineSet; }) =>
{
    const template = useMemo(() => createTimelineFormDataQueryTemplate({ lang: opt.lang, timelineId: opt.timelineId, isDesc: opt.isDesc, emptyData: opt.emptyData }), [opt.lang, opt.timelineId, opt.isDesc, opt.emptyData]);
    return useClientDataQueryTemplate(template);
};
// #endregion
