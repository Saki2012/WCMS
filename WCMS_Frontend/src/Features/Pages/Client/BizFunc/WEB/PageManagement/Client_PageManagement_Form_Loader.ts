import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    buildClientLoaderInitial,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { PageManagementDetailFields, PageManagementFields } from "@/types/SchemaFields";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type PageManagementFormModel = components["schemas"]["PageManagement"];
type PageManagementDetail = NonNullable<PageManagementFormModel["_PageManagementDetail"]>[number];
export interface IPageManagementOptions
{
    PageId?: string;
}
interface PageManagementFormLoaderArgs
{
    pageId: string;
    lang: Lang;
    queryParam: QueryListParam;
}
interface PageManagementFormLoaderRes
{
    listRes: PageManagementFormModel[];
}
interface PageManagementFormLoaderData
{
    args: PageManagementFormLoaderArgs;
    res: PageManagementFormLoaderRes;
}
type PageManagementFormRawData = {
    pageId: string;
    data: PageManagementFormModel;
    detail: PageManagementDetail | null;
    title: string;
    contentHtml: string;
    args: PageManagementFormLoaderArgs;
};
type PageManagementFormAdapter = { PageManagement: ReturnType<typeof PageManagementAdapter>; };
interface PageManagementFormFetchDataResult extends PageManagementFormRawData
{
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}
type UsePageManagementFormDataResult = PageManagementFormFetchDataResult;
type PageManagementFormSearchParams = { pageId: string; lang: Lang; };
type PageManagementFormDataQueryTemplate = ClientDataQueryTemplate<PageManagementFormSearchParams, PageManagementFormRawData, PageManagementFormRawData, PageManagementFormAdapter, QueryListParam, PageManagementFormLoaderData>;
const defaultEmptyData: PageManagementFormModel = { _PageManagementDetail: [] };
// #endregion

// #region Public
/** SSR Loader：改以 QueryList 預載 PageManagement Form 單筆資料 */
export const Client_PageManagement_Form_Loader = (p: { lang: Lang; opts: IPageManagementOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<PageManagementFormLoaderData> =>
{
    const pageId = LibText.safeTrim(p.opts.PageId);
    const ssrApi = getSsrApi(request);
    const adapter = PageManagementAdapter(ssrApi);
    const queryState = buildPageManagementFormQueryState({ lang: p.lang, pageId, emptyData: defaultEmptyData });
    const args = buildPageManagementFormLoaderArgs({ lang: p.lang, pageId, queryParam: queryState.queryParam });
    if (!pageId)
    {
        return { args, res: { listRes: [] } };
    }
    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const listLD = await listLoader({ request } as LoaderFunctionArgs);
    const listRes = listLD.apiRes.Data ?? [];
    return { args, res: { listRes } };
};
/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const usePageManagementFormData = (opt: { lang: Lang; pageId: string; emptyData?: PageManagementFormModel; }): UsePageManagementFormDataResult =>
{
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const templateVm = usePageManagementFormTemplate({ lang: opt.lang, pageId: opt.pageId, emptyData: fallbackData });
    const errorList = templateVm.errorList;
    return { ...templateVm.viewModel, isLoading: templateVm.isLoading, errorText: errorList[0] ?? null, errorList, refetchData: templateVm.refetchData, refetchRefData: templateVm.refetchRefData };
};
/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const usePageManagementFormFetchData = (p: { lang: Lang; pageId: string; emptyData?: PageManagementFormModel; }): PageManagementFormFetchDataResult =>
{
    return usePageManagementFormData({ lang: p.lang, pageId: p.pageId, emptyData: p.emptyData });
};
// #endregion

// #region Private
/** 共用：依目前 feature 組出 loader / hook 共用參數 */
const buildPageManagementFormLoaderArgs = (p: { lang: Lang; pageId: string; queryParam?: QueryListParam; }): PageManagementFormLoaderArgs =>
{
    const safePageId = LibText.safeTrim(p.pageId);
    const condition = buildPageManagementFormCondition(safePageId);
    const queryParam = p.queryParam ?? buildPageManagementFormQueryParam({ condition });
    return { pageId: safePageId, lang: p.lang, queryParam };
};
/** 組出給 hydration 用的 initial 格式 */
/** 建立 PageManagement Form 查詢條件 */
const buildPageManagementFormCondition = (pageId: string): string =>
{
    const condition = LibCondition.joinConditions([LibCondition.createCondition(PageManagementFields.InternalId, Operator.Equal, LibText.safeTrim(pageId))]);
    return condition || "1=0";
};
/** 建立 PageManagement Form QueryList 欄位清單 */
const buildPageManagementFormFields = (): string[] =>
{
    return [
        PageManagementFields.InternalId,
        PageManagementFields.PageId,
        PageManagementFields.ProgId,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.PageId}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.RowId}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Content}`,
    ];
};
/** 建立 PageManagement Form QueryListParam，Form 固定只查單筆 */
const buildPageManagementFormQueryParam = (p: { condition: string; }): QueryListParam =>
{
    return { Fields: buildPageManagementFormFields(), Condition: p.condition, PageNumber: 1, PageSize: 1 };
};
/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (p: { loaderData: PageManagementFormLoaderData | null; queryParam: QueryListParam; fallbackData: PageManagementFormModel; }): ApiLoaderData<QueryListParam, PageManagementFormModel[]> | null =>
{
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;
    return buildClientLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};
/** 依語系取目前 detail */
const findLangDetail = (p: { data: PageManagementFormModel; lang: Lang; }): PageManagementDetail | null =>
{
    const langKey = LibText.safeTrim(p.lang).toLowerCase();
    const detail = p.data._PageManagementDetail?.find((item) => LibText.safeTrim(item.Lang).toLowerCase() === langKey);
    return detail ?? p.data._PageManagementDetail?.[0] ?? null;
};
/** 建立 PageManagement Form 初始 ViewState */
const buildPageManagementFormInitialViewState = (): IListViewState =>
{
    return { pageNumber: 1, pageSize: 1 };
};
/** 建立 PageManagement Form Template 查詢參數 */
const buildPageManagementFormSearchParams = (p: { lang: Lang; pageId: string; }): PageManagementFormSearchParams =>
{
    return { pageId: LibText.safeTrim(p.pageId), lang: p.lang };
};
/** 建立 PageManagement Form DataQueryTemplate */
const createPageManagementFormDataQueryTemplate = (p: { lang: Lang; pageId: string; emptyData: PageManagementFormModel; }): PageManagementFormDataQueryTemplate =>
{
    const initialViewState = buildPageManagementFormInitialViewState();
    return {
        featureKey: "PageManagementForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildPageManagementFormSearchParams({ lang: p.lang, pageId: p.pageId }),
            buildSearchConditions: (ctx) => [buildPageManagementFormCondition(ctx.searchParams.pageId)],
            buildQueryParam: (ctx) => buildPageManagementFormQueryParam({ condition: ctx.searchCondition }),
            useDataSource: (ctx) => usePageManagementFormDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData, lang: p.lang, pageId: ctx.searchParams.pageId, emptyData: p.emptyData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};
/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildPageManagementFormQueryState = (p: { lang: Lang; pageId: string; emptyData: PageManagementFormModel; }) =>
{
    const template = createPageManagementFormDataQueryTemplate(p);
    return buildClientDataQueryState(template, {} as SearchValues, buildPageManagementFormInitialViewState());
};
/** PageManagement Form DataSource：統一處理 QueryList 單筆資料 */
const usePageManagementFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: PageManagementFormLoaderData | null; lang: Lang; pageId: string; emptyData: PageManagementFormModel; },
): ClientDataQueryDataSourceResult<PageManagementFormRawData, PageManagementFormAdapter> =>
{
    const adapter = useMemo<PageManagementFormAdapter>(() => ({ PageManagement: PageManagementAdapter() }), []);
    const currentArgs = useMemo(() => buildPageManagementFormLoaderArgs({ lang: p.lang, pageId: p.pageId, queryParam: p.queryParam }), [p.lang, p.pageId, p.queryParam]);
    const listInitial = useMemo(() => buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData }), [p.loaderData, p.queryParam, p.emptyData]);
    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);
    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.PageManagement.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });
    const data = useMemo<PageManagementFormModel>(() => useData.data?.[0] ?? p.emptyData, [useData.data, p.emptyData]);
    const detail = useMemo(() => findLangDetail({ data, lang: p.lang }), [data, p.lang]);
    const errors = useMemo(() => [useData.errorText], [useData.errorText]);
    const rawData = useMemo<PageManagementFormRawData>(() => ({ pageId: currentArgs.pageId, data, detail, title: detail?.Title ?? "", contentHtml: detail?.Content ?? "", args: currentArgs }), [currentArgs, data, detail]);
    const refetchData = useCallback(async (): Promise<void> =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData.refetch]);
    const refetchRefData = useCallback(async () => Promise.resolve(), []);
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors, paginator: null, refetchData, refetchRefData };
};
/** 內部共用：建立 PageManagement Form Template VM */
const usePageManagementFormTemplate = (opt: { lang: Lang; pageId: string; emptyData: PageManagementFormModel; }) =>
{
    const template = useMemo(() => createPageManagementFormDataQueryTemplate({ lang: opt.lang, pageId: opt.pageId, emptyData: opt.emptyData }), [opt.lang, opt.pageId, opt.emptyData]);
    return useClientDataQueryTemplate(template);
};
// #endregion
