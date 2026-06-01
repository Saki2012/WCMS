//#region Property
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecJournalIndexDetailFields, SpecJournalIndexModelFields } from "@/types/SchemaFields";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];
export interface SpecJournalIndexLoaderArgs
{
    pageSize: number;
    baseParam: QueryListParam;
}
export interface SpecJournalIndexLoaderRes
{
    countRes: number;
    listRes: SpecJournalIndexSet[];
}
export interface SpecJournalIndexLoaderData
{
    args: SpecJournalIndexLoaderArgs;
    res: SpecJournalIndexLoaderRes;
}

export interface UseSpecJournalIndexDataResult
{
    rawData: SpecJournalIndexSet[];
    isLoading: boolean;
    errorList: string[];
    pageNumber: number;
    totalPages: number;
    paginatorProps: PaginatorProps | null;
}

type SpecJournalIndexAdapterType = ReturnType<typeof SpecJournalIndexAdapter>;
type SpecJournalIndexTemplate = ClientDataQueryTemplate<
    { pageSize: number; },
    SpecJournalIndexSet[],
    SpecJournalIndexSet[],
    SpecJournalIndexAdapterType,
    QueryListParam,
    SpecJournalIndexLoaderData
>;
type SpecJournalIndexDataSourceContext = Parameters<NonNullable<NonNullable<SpecJournalIndexTemplate["spec"]>["useDataSource"]>>[0];

//#endregion

//#region Private - Query Helpers
const buildBaseParam = (pageSize: number, pageNumber = 1): QueryListParam =>
{
    // 宣告變數
    const condition = LibMerge(" And ", false);
    // return
    return {
        Fields: [
            SpecJournalIndexModelFields.IndexId,
            SpecJournalIndexModelFields.IndexName,
            SpecJournalIndexModelFields.InternalId,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecJournalIndexModelFields.IndexName, Desc: true }],
        PageNumber: pageNumber,
        PageSize: pageSize,
    };
};
/** ✅ SSR loader：Index 年度清單（含明細）首屏預載 */
//#endregion

//#region Public - SSR Loader
export const SpecJournalIndex_Loader = (p?: { pageSize?: number; }) => async ({ request }: LoaderFunctionArgs): Promise<SpecJournalIndexLoaderData> =>
{
    // 宣告變數
    const pageSize = p?.pageSize ?? 10;
    const queryState = buildSpecJournalIndexQueryState({ pageSize });
    const baseParam = queryState.queryParam;
    const ssrApi = getSsrApi(request);
    const adapter = SpecJournalIndexAdapter(ssrApi);

    // 執行 function：count/list
    const countLoader = adapter.loader.createQueryCountLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });

    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });

    const [countLD, listLD] = await Promise.all([countLoader({ request } as LoaderFunctionArgs), listLoader({ request } as LoaderFunctionArgs)]);

    // return
    return { args: { pageSize, baseParam }, res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [] } };
};


/** 建立 loader / hook 共用查詢狀態 */
//#endregion

//#region Template - Client DataQuery
const buildSpecJournalIndexQueryState = (p: { pageSize: number; pageNumber?: number; }) =>
{
    // 宣告變數
    const template = createSpecJournalIndexDataQueryTemplate({ pageSize: p.pageSize });
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: p.pageNumber ?? 1, pageSize: p.pageSize };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};

/** 建立 SSR initial */
const buildInitial = <TData>(p: { loaderData: SpecJournalIndexLoaderData | null; queryParam: QueryListParam; data: TData; }): ApiLoaderData<QueryListParam, TData> | null =>
{
    // 執行 function
    if (!p.loaderData?.args?.baseParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, p.loaderData.args.baseParam)) return null;

    // return
    return { args: p.loaderData.args.baseParam, apiRes: { IsSuccess: true, Data: p.data, SysMessage: [] } };
};

/** 建立 SpecJournalIndex DataQuery Template */
const createSpecJournalIndexDataQueryTemplate = (p: { pageSize: number; }): SpecJournalIndexTemplate =>
{
    // return
    return {
        featureKey: "Spec1819.SpecJournalIndex.List",
        dataMode: "multiple",
        initialViewState: { pageNumber: 1, pageSize: p.pageSize },
        pagination: { defaultPageNumber: 1, defaultPageSize: p.pageSize, resetPageOnSearch: true },
        searchBar: null,
        spec: {
            toSearchParams: () => ({ pageSize: p.pageSize }),
            buildSearchConditions: () => [LibMerge(" And ", false)],
            buildQueryParam: ({ searchParams, viewState }) => buildBaseParam(searchParams.pageSize, viewState.pageNumber),
            useDataSource: (ctx) => useSpecJournalIndexDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};

/** DataSource：用 Template 統一接 SSR initial、count、list 與 paginator */
const useSpecJournalIndexDataSource = (
    ctx: SpecJournalIndexDataSourceContext,
): ClientDataQueryDataSourceResult<SpecJournalIndexSet[], SpecJournalIndexAdapterType> =>
{
    // 宣告變數
    const adapter = useMemo(() => SpecJournalIndexAdapter(), []);
    const loaderData = ctx.loaderData ?? null;
    const queryKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam), [ctx.queryParam]);

    const countInitial = useMemo(() =>
    {
        return buildInitial({ loaderData, queryParam: ctx.queryParam, data: loaderData?.res.countRes ?? 0 });
    }, [loaderData, ctx.queryParam]);

    const listInitial = useMemo(() =>
    {
        return buildInitial({ loaderData, queryParam: ctx.queryParam, data: loaderData?.res.listRes ?? [] });
    }, [loaderData, ctx.queryParam]);

    // 執行 function
    const useCount = adapter.hooks.useQueryCount({ condition: ctx.queryParam, initial: countInitial, deps: [queryKey] });
    const useList = adapter.hooks.usePagedQueryList({ baseParam: ctx.queryParam, count: useCount.data ?? 0, initial: listInitial, deps: [queryKey] });

    const paginator = useMemo(() =>
    {
        return { currentPage: useList.pageNumber, pageSize: ctx.viewState.pageSize, totalPages: useList.totalPages, totalCount: useCount.data ?? 0, onPageChange: useList.onPageChange };
    }, [useList.pageNumber, useList.totalPages, useList.onPageChange, useCount.data, ctx.viewState.pageSize]);

    // return
    return {
        adapter,
        rawData: useList.data ?? [],
        isLoading: Boolean(useCount.isLoading || useList.isLoading),
        errors: [useCount.errorText, useList.errorText],
        paginator,
    };
};

/** CSR Hook：期刊卷期列表走 Client_DataQueryTemplate */
//#endregion

//#region Public - CSR Hook
export const useSpecJournalIndexData = (p?: { pageSize?: number; }): UseSpecJournalIndexDataResult =>
{
    // 宣告變數
    const loaderData = useLoaderData() as SpecJournalIndexLoaderData | null;
    const pageSize = p?.pageSize ?? loaderData?.args.pageSize ?? 10;
    const template = useMemo(() => createSpecJournalIndexDataQueryTemplate({ pageSize }), [pageSize]);
    const templateVm = useClientDataQueryTemplate(template);

    // return
    return {
        rawData: templateVm.viewModel,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
        pageNumber: templateVm.paginator?.currentPage ?? 1,
        totalPages: templateVm.paginator?.totalPages ?? 1,
        paginatorProps: templateVm.paginatorProps,
    };
};
//#endregion
