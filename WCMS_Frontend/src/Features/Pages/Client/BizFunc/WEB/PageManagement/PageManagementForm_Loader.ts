import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
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
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PageManagementDetailFields, PageManagementFields } from "@/types/SchemaFields";

// #region Types
type QueryListParam = components["schemas"]["QueryListParam"];
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export interface IPageManagementOptions
{
    PageId?: string;
}

export interface PageManagementFormLoaderArgs
{
    pageId: string;
    lang: Lang;
    queryParam: QueryListParam;
}

export interface PageManagementFormLoaderRes
{
    listRes: PageManagementSet[];
    dataRes: PageManagementSet | null;
}

export interface PageManagementFormLoaderData
{
    args: PageManagementFormLoaderArgs;
    res: PageManagementFormLoaderRes;
}

export type PageManagementFormRawData = {
    pageId: string;
    data: PageManagementSet;
    detail: PageManagementDetail | null;
    title: string;
    contentHtml: string;
    args: PageManagementFormLoaderArgs;
};

export type PageManagementFormAdapter = { PageManagement: ReturnType<typeof PageManagementAdapter>; };

export interface PageManagementFormFetchDataResult extends PageManagementFormRawData
{
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}

export interface UsePageManagementFormDataResult extends PageManagementFormFetchDataResult
{}
// #endregion

type PageManagementFormSearchParams = { pageId: string; lang: Lang; };

type PageManagementFormDataQueryTemplate = ClientDataQueryTemplate<
    PageManagementFormSearchParams,
    PageManagementFormRawData,
    PageManagementFormRawData,
    PageManagementFormAdapter,
    QueryListParam,
    PageManagementFormLoaderData
>;

const defaultEmptyData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

// #region Shared Builder
/** 統一整理安全 PageId；目前 SiteMenu PageId 實際儲存 PageManagement.InternalId */
const getSafePageId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 轉義 QueryList 條件中的雙引號 */
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

/** 建立 PageManagement Form 查詢條件 */
const buildPageManagementFormCondition = (pageId: string): string =>
{
    // 宣告變數
    const safePageId = escapeQueryValue(getSafePageId(pageId));
    if (!safePageId) return "1=0";

    // return
    return LibMerge(" And ", false, `${PageManagementFields.InternalId} = "${safePageId}"`);
};

/** 建立 PageManagement Form QueryList 欄位清單 */
const buildPageManagementFormFields = (): string[] =>
{
    // 宣告變數
    const detailPrefix = PageManagementFields._PageManagementDetail;

    // return
    return [
        PageManagementFields.InternalId,
        PageManagementFields.PageId,
        PageManagementFields.ProgId,
        `${detailPrefix}.${PageManagementDetailFields.PageId}`,
        `${detailPrefix}.${PageManagementDetailFields.RowId}`,
        `${detailPrefix}.${PageManagementDetailFields.Lang}`,
        `${detailPrefix}.${PageManagementDetailFields.Title}`,
        `${detailPrefix}.${PageManagementDetailFields.Content}`,
    ];
};

/** 建立 PageManagement Form QueryListParam，Form 固定只查單筆 */
const buildPageManagementFormQueryParam = (p: { pageId: string; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildPageManagementFormCondition(p.pageId);

    // return
    return { Fields: buildPageManagementFormFields(), Condition: condition, PageNumber: 1, PageSize: 1 };
};

/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildPageManagementFormLoaderArgs = (p: { lang: Lang; pageId: string; queryParam?: QueryListParam; }): PageManagementFormLoaderArgs =>
{
    // 宣告變數
    const safePageId = getSafePageId(p.pageId);
    const queryParam = p.queryParam ?? buildPageManagementFormQueryParam({ pageId: safePageId });

    // return
    return { pageId: safePageId, lang: p.lang, queryParam };
};

/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (
    p: { loaderData: PageManagementFormLoaderData | null; queryParam: QueryListParam; fallbackData: PageManagementSet; },
): ApiLoaderData<QueryListParam, PageManagementSet[]> | null =>
{
    // 宣告變數
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;

    // return
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};

/** 依語系取目前 detail */
const findLangDetail = (p: { data: PageManagementSet; lang: Lang; }): PageManagementDetail | null =>
{
    // 宣告變數
    const langKey = p.lang.toLowerCase();
    const detail = p.data.PageManagementDetail?.find((item) => (item.Lang ?? "").toLowerCase() === langKey);

    // return
    return detail ?? p.data.PageManagementDetail?.[0] ?? null;
};

/** 建立 PageManagement Form 初始 ViewState */
const buildPageManagementFormInitialViewState = (): IListViewState =>
{
    // return
    return { pageNumber: 1, pageSize: 1 } as IListViewState;
};

/** 建立 PageManagement Form Template 查詢參數 */
const buildPageManagementFormSearchParams = (p: { lang: Lang; pageId: string; }): PageManagementFormSearchParams =>
{
    // return
    return { pageId: getSafePageId(p.pageId), lang: p.lang };
};

/** 建立 PageManagement Form DataQueryTemplate */
const createPageManagementFormDataQueryTemplate = (p: { lang: Lang; pageId: string; emptyData: PageManagementSet; }): PageManagementFormDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildPageManagementFormInitialViewState();

    // return
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
            buildQueryParam: (ctx) => buildPageManagementFormQueryParam({ pageId: ctx.searchParams.pageId }),
            useDataSource: (ctx) =>
                usePageManagementFormDataSource({
                    queryParam: ctx.queryParam,
                    loaderData: ctx.loaderData,
                    lang: p.lang,
                    pageId: ctx.searchParams.pageId,
                    emptyData: p.emptyData,
                }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildPageManagementFormQueryState = (p: { lang: Lang; pageId: string; emptyData: PageManagementSet; }) =>
{
    // 宣告變數
    const template = createPageManagementFormDataQueryTemplate(p);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, buildPageManagementFormInitialViewState());
};
// #endregion

// #region SSR Loader
/** SSR Loader：改以 QueryList 預載 PageManagement Form 單筆資料 */
export const PageManagementForm_Loader =
    (p: { lang: Lang; opts: IPageManagementOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<PageManagementFormLoaderData> =>
    {
        // 宣告變數
        const pageId = getSafePageId(p.opts.PageId);
        const ssrApi = getSsrApi(request);
        const adapter = PageManagementAdapter(ssrApi);
        const queryState = buildPageManagementFormQueryState({ lang: p.lang, pageId, emptyData: defaultEmptyData });
        const args = buildPageManagementFormLoaderArgs({ lang: p.lang, pageId, queryParam: queryState.queryParam });

        // 執行 function
        if (!pageId)
        {
            return { args, res: { listRes: [], dataRes: null } };
        }

        const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
        const listLD = await listLoader({ request } as LoaderFunctionArgs);
        const listRes = listLD.apiRes.Data ?? [];

        // return
        return { args, res: { listRes, dataRes: listRes[0] ?? null } };
    };
// #endregion

// #region CSR Hook
/** PageManagement Form DataSource：統一處理 QueryList 單筆資料 */
const usePageManagementFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: PageManagementFormLoaderData | null; lang: Lang; pageId: string; emptyData: PageManagementSet; },
): ClientDataQueryDataSourceResult<PageManagementFormRawData, PageManagementFormAdapter> =>
{
    // 宣告變數
    const adapter = useMemo<PageManagementFormAdapter>(() => ({ PageManagement: PageManagementAdapter() }), []);

    const currentArgs = useMemo(() =>
    {
        return buildPageManagementFormLoaderArgs({ lang: p.lang, pageId: p.pageId, queryParam: p.queryParam });
    }, [p.lang, p.pageId, p.queryParam]);

    const listInitial = useMemo(() =>
    {
        return buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData });
    }, [p.loaderData, p.queryParam, p.emptyData]);

    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);

    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.PageManagement.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });

    const data = useMemo<PageManagementSet>(() =>
    {
        return useData.data?.[0] ?? p.emptyData;
    }, [useData.data, p.emptyData]);

    const detail = useMemo(() =>
    {
        return findLangDetail({ data, lang: p.lang });
    }, [data, p.lang]);

    const errors = useMemo(() => [useData.errorText], [useData.errorText]);

    const rawData = useMemo<PageManagementFormRawData>(() =>
    {
        return { pageId: currentArgs.pageId, data, detail, title: detail?.Title ?? "", contentHtml: detail?.Content ?? "", args: currentArgs };
    }, [currentArgs, data, detail]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () => Promise.resolve(), []);

    // return
    return { adapter, rawData, isLoading: Boolean(useData.isLoading), errors, paginator: null, refetchData, refetchRefData };
};

/** 內部共用：建立 PageManagement Form Template VM */
const usePageManagementFormTemplate = (opt: { lang: Lang; pageId: string; emptyData: PageManagementSet; }) =>
{
    // 宣告變數
    const template = useMemo(() =>
    {
        return createPageManagementFormDataQueryTemplate({ lang: opt.lang, pageId: opt.pageId, emptyData: opt.emptyData });
    }, [opt.lang, opt.pageId, opt.emptyData]);

    // return
    return useClientDataQueryTemplate(template);
};

/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const usePageManagementFormData = (opt: { lang: Lang; pageId: string; emptyData?: PageManagementSet; }): UsePageManagementFormDataResult =>
{
    // 宣告變數
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const templateVm = usePageManagementFormTemplate({ lang: opt.lang, pageId: opt.pageId, emptyData: fallbackData });
    const errorList = templateVm.errorList;

    // return
    return {
        ...templateVm.viewModel,
        isLoading: templateVm.isLoading,
        errorText: errorList[0] ?? null,
        errorList,
        refetchData: templateVm.refetchData,
        refetchRefData: templateVm.refetchRefData,
    };
};

/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const usePageManagementFormFetchData = (p: { lang: Lang; pageId: string; emptyData?: PageManagementSet; }): PageManagementFormFetchDataResult =>
{
    // return
    return usePageManagementFormData({ lang: p.lang, pageId: p.pageId, emptyData: p.emptyData });
};
// #endregion
