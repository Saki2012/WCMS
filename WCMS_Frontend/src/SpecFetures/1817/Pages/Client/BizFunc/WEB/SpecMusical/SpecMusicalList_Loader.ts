import {
    buildClientDataQueryState,
    buildClientDataQueryKey,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { SpecMusicalModelFields } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];

type SpecMusicalListAdapter = ReturnType<typeof SpecMusicalAdapter>;


export interface SpecMusicalListLoaderArgs
{
    baseParam: QueryListParam;
    categoryIds: string;
    pageSize: number;
}


export interface SpecMusicalListLoaderRes
{
    countRes: number;
    listRes: SpecMusicalSet[];
}


export interface SpecMusicalListLoaderData
{
    args: SpecMusicalListLoaderArgs;
    res: SpecMusicalListLoaderRes;
}


export interface SpecMusicalListSearchParams
{
    categoryIds: string;
}


export interface UseSpecMusicalListDataResult
{
    rawData: SpecMusicalSet[];
    isLoading: boolean;
    errorList: string[];
    pageNumber: number;
    totalPages: number;
    paginatorProps: PaginatorProps | null;
}


type SpecMusicalListTemplate = ClientDataQueryTemplate<
    SpecMusicalListSearchParams,
    SpecMusicalSet[],
    SpecMusicalSet[],
    SpecMusicalListAdapter,
    QueryListParam,
    SpecMusicalListLoaderData
>;

type SpecMusicalListDataSourceContext = Parameters<NonNullable<NonNullable<SpecMusicalListTemplate["spec"]>["useDataSource"]>>[0];
// #endregion

// #region Public
/** loader factory：SSR 先撈清單/筆數 */

export const SpecMusicalList_Loader =
    (p: { categoryIds: string; pageSize?: number; }) => async ({ request }: LoaderFunctionArgs): Promise<SpecMusicalListLoaderData> =>
    {
        // 宣告變數
        const pageSize = p.pageSize ?? 9;
        const categoryIds = `${p.categoryIds ?? ""}`.trim();
        const ssrApi = getSsrApi(request);
        const adapter = SpecMusicalAdapter(ssrApi);
        const queryState = buildSpecMusicalListQueryState({ categoryIds, pageSize });
        const baseParam = queryState.queryParam;

        // 執行 function：count/list
        const countLoader = adapter.loader.createQueryCountLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });
        const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });
        const [countLD, listLD] = await Promise.all([countLoader({ request } as LoaderFunctionArgs), listLoader({ request } as LoaderFunctionArgs)]);

        // return
        return { args: { baseParam, categoryIds, pageSize }, res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [] } };
    };


/** CSR Hook：前台樂器清單走 Client_DataQueryTemplate */
export const useSpecMusicalListData = (p: { categoryIds: string; pageSize?: number; }): UseSpecMusicalListDataResult =>
{
    // 宣告變數
    const pageSize = p.pageSize ?? 9;
    const template = useMemo(() =>
    {
        return createSpecMusicalListDataQueryTemplate({ categoryIds: `${p.categoryIds ?? ""}`.trim(), pageSize });
    }, [p.categoryIds, pageSize]);

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
// #endregion

// #region Private
/** 建立分類查詢條件 */

const buildCondition = (categoryIds: string): string =>
{
    // 宣告變數
    let condition = "";

    // 執行 function：固定條件
    if (categoryIds)
    {
        condition = LibMerge(" And ", false, condition, `${SpecMusicalModelFields.CategoryId} HasAny [${categoryIds}]`);
    }

    // return
    return condition;
};


/** 建立樂器清單查詢參數 */
const buildBaseParam = (categoryIds: string, pageSize: number, pageNumber = 1): QueryListParam =>
{
    // 宣告變數
    const condition = buildCondition(categoryIds);

    // return
    return {
        Fields: [SpecMusicalModelFields.MusicalName, SpecMusicalModelFields.CoverPicId, SpecMusicalModelFields.InternalId],
        Condition: condition,
        OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }],
        PageNumber: pageNumber,
        PageSize: pageSize,
    };
};


/** 建立 loader / hook 共用查詢狀態 */
const buildSpecMusicalListQueryState = (p: { categoryIds: string; pageSize: number; pageNumber?: number; }) =>
{
    // 宣告變數
    const template = createSpecMusicalListDataQueryTemplate({ categoryIds: p.categoryIds, pageSize: p.pageSize, pageNumber: p.pageNumber ?? 1 });
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: p.pageNumber ?? 1, pageSize: p.pageSize };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};


/** 建立 SSR initial */
const buildInitial = <TData>(p: { loaderData: SpecMusicalListLoaderData | null; queryParam: QueryListParam; data: TData; }): ApiLoaderData<QueryListParam, TData> | null =>
{
    // 執行 function
    if (!p.loaderData?.args?.baseParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, p.loaderData.args.baseParam)) return null;

    // return
    return { args: p.loaderData.args.baseParam, apiRes: { IsSuccess: true, Data: p.data, SysMessage: [] } };
};


/** 建立 SpecMusical List DataQuery Template */

const createSpecMusicalListDataQueryTemplate = (p: { categoryIds: string; pageSize: number; pageNumber?: number; }): SpecMusicalListTemplate =>
{
    // return
    return {
        featureKey: "Spec1817.SpecMusical.List",
        dataMode: "multiple",
        initialViewState: { pageNumber: p.pageNumber ?? 1, pageSize: p.pageSize },
        pagination: { defaultPageNumber: 1, defaultPageSize: p.pageSize, resetPageOnSearch: true },
        searchBar: null,
        spec: {
            toSearchParams: () => ({ categoryIds: p.categoryIds }),
            buildSearchConditions: ({ searchParams }) => [buildCondition(searchParams.categoryIds)],
            buildQueryParam: ({ searchParams, viewState }) => buildBaseParam(searchParams.categoryIds, p.pageSize, viewState.pageNumber),
            useDataSource: (ctx) => useSpecMusicalListDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};


/** DataSource：用 Template 統一接 SSR initial、count、list 與 paginator */
const useSpecMusicalListDataSource = (
    ctx: SpecMusicalListDataSourceContext,
): ClientDataQueryDataSourceResult<SpecMusicalSet[], SpecMusicalListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(() => SpecMusicalAdapter(), []);
    const queryKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam), [ctx.queryParam]);
    const loaderData = ctx.loaderData ?? null;

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
// #endregion
