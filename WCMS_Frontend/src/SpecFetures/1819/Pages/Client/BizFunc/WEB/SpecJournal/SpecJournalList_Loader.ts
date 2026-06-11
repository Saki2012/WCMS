import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import {
    FileManageModelFields,
    SpecJournalAuthorFields,
    SpecJournalDocumentFields,
    SpecJournalIndexDetailFields,
    SpecJournalKeywordsFields,
    SpecJournalModelFields,
    SpecJournalTypesFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

// #region Property
type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];

type QueryListParam = components["schemas"]["QueryListParam"];

export interface SpecJournalListLoaderOptions
{
    pageSize?: number;
    pageTitle?: string;
    isPreprint?: boolean;
}

export interface SpecJournalListFilters
{
    q: string;
    articleLang: string;
    tagId: string;
    tagName: string;
    author: string;
    keyword: string;
    includeRef: string;
}

export interface SpecJournalListLoaderArgs
{
    indexId: string;
    rowId: string;
    isPreprint: boolean;
    pageSize: number;
    pageTitle: string;
    filters: SpecJournalListFilters;
    baseParam: QueryListParam;
}

export interface SpecJournalListLoaderRes
{
    countRes: number;
    listRes: SpecJournalSet[];
}

export interface SpecJournalListLoaderData
{
    args: SpecJournalListLoaderArgs;
    res: SpecJournalListLoaderRes;
}

export interface UseSpecJournalListDataResult
{
    rawData: SpecJournalSet[];
    totalCount: number;
    isLoading: boolean;
    errorList: string[];
    pageNumber: number;
    totalPages: number;
    paginatorProps: PaginatorProps | null;
}

type SpecJournalListAdapter = ReturnType<typeof SpecJournalAdapter>;

type SpecJournalListTemplate = ClientDataQueryTemplate<
    SpecJournalListLoaderArgs,
    { list: SpecJournalSet[]; totalCount: number; },
    { list: SpecJournalSet[]; totalCount: number; },
    SpecJournalListAdapter,
    QueryListParam,
    SpecJournalListLoaderData
>;

type SpecJournalListDataSourceContext = Parameters<NonNullable<NonNullable<SpecJournalListTemplate["spec"]>["useDataSource"]>>[0];

interface BuildConditionArgs
{
    indexId: string;
    rowId: string;
    isPreprint: boolean;
    filters: SpecJournalListFilters;
}

interface BuildBaseParamArgs extends BuildConditionArgs
{
    pageSize: number;
}
// #endregion

// #region Public
/**
 * SpecJournal List Loader
 */

export const SpecJournalList_Loader = (opt: SpecJournalListLoaderOptions) => async ({ request, params }: LoaderFunctionArgs): Promise<SpecJournalListLoaderData> =>
{
    // 宣告變數
    const pageSize = opt.pageSize ?? 10;
    const indexId = `${params?.indexId ?? ""}`.trim();
    const rowId = `${params?.rowId ?? ""}`.trim();
    const pageTitle = opt.pageTitle ?? "";
    const filters = parseFilters(request.url);
    const isPreprint = opt.isPreprint ?? false;
    const queryState = buildSpecJournalListQueryState({ indexId, rowId, isPreprint, pageSize, pageTitle, filters, baseParam: buildBaseParam({ indexId, rowId, isPreprint, pageSize, filters }) });
    const baseParam = queryState.queryParam;
    const ssrApi = getSsrApi(request);
    const adapter = SpecJournalAdapter(ssrApi);
    // 執行 function：count / list
    const countLoader = adapter.loader.createQueryCountLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });
    const listLoader = adapter.loader.createQueryListLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });
    const [countLD, listLD] = await Promise.all([
        countLoader({ request, params } as LoaderFunctionArgs),
        listLoader({ request, params } as LoaderFunctionArgs),
    ]);

    // return
    return {
        args: { indexId, rowId, isPreprint, pageSize, pageTitle, filters, baseParam },
        res: { countRes: countLD.apiRes.Data ?? 0, listRes: listLD.apiRes.Data ?? [] },
    };
};

/** CSR Hook：期刊文章列表走 Client_DataQueryTemplate */

export const useSpecJournalListData = (p?: { pageSize?: number; }): UseSpecJournalListDataResult =>
{
    // 宣告變數
    const loaderData = useLoaderData() as SpecJournalListLoaderData | null;
    const fallbackArgs: SpecJournalListLoaderArgs = loaderData?.args ?? {
        indexId: "",
        rowId: "",
        isPreprint: false,
        pageSize: p?.pageSize ?? 10,
        pageTitle: "",
        filters: { q: "", articleLang: "", tagId: "", tagName: "", author: "", keyword: "", includeRef: "" },
        baseParam: buildBaseParam({ indexId: "", rowId: "", isPreprint: false, pageSize: p?.pageSize ?? 10, filters: { q: "", articleLang: "", tagId: "", tagName: "", author: "", keyword: "", includeRef: "" } }),
    };

    const templateArgs = useMemo(() =>
    {
        return { ...fallbackArgs, pageSize: p?.pageSize ?? fallbackArgs.pageSize };
    }, [fallbackArgs, p?.pageSize]);

    const template = useMemo(() =>
    {
        const queryState = buildSpecJournalListQueryState(templateArgs);
        return createSpecJournalListDataQueryTemplate({ ...templateArgs, baseParam: queryState.queryParam });
    }, [templateArgs]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return {
        rawData: templateVm.viewModel.list,
        totalCount: templateVm.viewModel.totalCount,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
        pageNumber: templateVm.paginator?.currentPage ?? 1,
        totalPages: templateVm.paginator?.totalPages ?? 1,
        paginatorProps: templateVm.paginatorProps,
    };
};
// #endregion

// #region Private
/**
 * 解析網址查詢條件
 */

const parseFilters = (url: string): SpecJournalListFilters =>
{
    const sp = new URL(url).searchParams;
    return {
        q: (sp.get("q") ?? "").trim(),
        articleLang: (sp.get("articleLang") ?? "").trim(),
        tagId: (sp.get("tagId") ?? "").trim(),
        tagName: (sp.get("tagName") ?? "").trim(),
        author: (sp.get("author") ?? "").trim(),
        keyword: (sp.get("keyword") ?? "").trim(),
        includeRef: (sp.get("includeRef") ?? "").trim(),
    };
};

/**
 * 轉義單引號
 */
const escapeSqlValue = (value: string): string =>
{
    // return
    return value.replace(/'/g, "''");
};

/**
 * 建立查詢條件
 */
const buildCondition = (p: BuildConditionArgs): string =>
{
    // 宣告變數
    let condition = "";
    const f = p.filters;
    const isGlobalSearch = hasSearchFilters(f);

    // 執行 function：只有非搜尋模式才套 route 範圍
    if (!isGlobalSearch)
    {
        const scopeCondition = buildScopeCondition(p);
        condition = LibText.Merge(" And ", false, condition, scopeCondition);
    }

    if (f.q)
    {
        const kw = escapeSqlValue(f.q);
        const baseCond = `(${
            LibText.Merge(
                " Or ",
                false,
                `${SpecJournalModelFields.Title} like '${kw}'`,
                `${SpecJournalModelFields.Title_en} like '${kw}'`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} like '${kw}'`,
                `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} like '${kw}'`,
            )
        })`;
        const includeRef = f.includeRef === "1" || f.includeRef.toLowerCase() === "true";
        if (!includeRef) condition = LibText.Merge(" And ", false, condition, baseCond);
        else
        {
            const bibCond = `(${SpecJournalModelFields.Bibliography} like '${kw}')`;
            condition = LibText.Merge(" And ", false, condition, `(${baseCond} Or ${bibCond})`);
        }
    }

    if (f.articleLang)
    {
        condition = LibText.Merge(" And ", false, condition, `${SpecJournalModelFields.ArticleLang} = '${escapeSqlValue(f.articleLang)}'`);
    }

    if (f.tagId)
    {
        condition = LibText.Merge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId} = '${escapeSqlValue(f.tagId)}'`,
        );
    }

    if (f.author)
    {
        condition = LibText.Merge(
            " And ",
            false,
            condition,
            `(${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName} = '${escapeSqlValue(f.author)}' Or ${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en} = '${escapeSqlValue(f.author)}')`,
        );
    }

    if (f.keyword)
    {
        condition = LibText.Merge(
            " And ",
            false,
            condition,
            `${SpecJournalModelFields._SpecJournalKeywords}.${SpecJournalKeywordsFields.Keyword} = '${escapeSqlValue(f.keyword)}'`,
        );
    }

    // return
    return condition;
};

/**
 * 建立 QueryListParam
 */
const buildBaseParam = (p: BuildBaseParamArgs): QueryListParam =>
{
    const condition = buildCondition(p);
    return {
        Fields: [
            SpecJournalModelFields.InternalId,
            SpecJournalModelFields.JournalId,
            SpecJournalModelFields.Title,
            SpecJournalModelFields.Title_en,
            SpecJournalModelFields.ArticleLang,
            SpecJournalModelFields.PageStart,
            SpecJournalModelFields.PageEnd,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.IndexId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.RowId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileId}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFileName}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.PublicDownloadCount}`,
            `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.SummaryFile}.${FileManageModelFields.FileExtension}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.TagId}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${SpecJournalModelFields._SpecJournalTypes}.${SpecJournalTypesFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
            `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentId}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentName}`,
            `${SpecJournalModelFields._SpecJournalDocument}.${SpecJournalDocumentFields.DocumentType}`,
        ],
        Condition: condition,
        OrderBy: [{ Col: SpecJournalModelFields.PageStart, Desc: false }],
        RankGroups: [{ Condition: `${SpecJournalModelFields.PageStart} != 0`, OrderBy: [{ Col: SpecJournalModelFields.PageStart, Desc: false }] }],
        PageNumber: 1,
        PageSize: p.pageSize,
    };
};

/**
 * 建立資料範圍條件
 */
const buildScopeCondition = (p: BuildConditionArgs): string =>
{
    // 宣告變數
    const indexId = escapeSqlValue((p.indexId ?? "").trim());
    const rowId = escapeSqlValue((p.rowId ?? "").trim());

    // 執行 function：預刊本
    if (p.isPreprint)
    {
        return LibText.Merge(" And ", false, `${SpecJournalModelFields.JournalIndexId} is null`, `${SpecJournalModelFields.JournalIndexRowId} is null`);
    }

    // 執行 function：正式卷期
    if (!indexId || !rowId) return "";

    // return
    return LibText.Merge(" And ", false, `${SpecJournalModelFields.JournalIndexId} = '${indexId}'`, `${SpecJournalModelFields.JournalIndexRowId} = '${rowId}'`);
};

const hasSearchFilters = (f: SpecJournalListFilters): boolean =>
{
    // return
    return !!f.q || !!f.articleLang || !!f.tagId || !!f.author || !!f.keyword;
};

/** 建立 loader / hook 共用查詢狀態 */

const buildSpecJournalListQueryState = (args: SpecJournalListLoaderArgs) =>
{
    // 宣告變數
    const template = createSpecJournalListDataQueryTemplate(args);
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: 1, pageSize: args.pageSize };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};

/** 建立 SSR initial */
const buildInitial = <TData>(p: { loaderData: SpecJournalListLoaderData | null; queryParam: QueryListParam; data: TData; }): ApiLoaderData<QueryListParam, TData> | null =>
{
    // 執行 function
    if (!p.loaderData?.args?.baseParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, p.loaderData.args.baseParam)) return null;

    // return
    return { args: p.loaderData.args.baseParam, apiRes: { IsSuccess: true, Data: p.data, SysMessage: [] } };
};

/** 建立 SpecJournal List DataQuery Template */
const createSpecJournalListDataQueryTemplate = (args: SpecJournalListLoaderArgs): SpecJournalListTemplate =>
{
    // return
    return {
        featureKey: "Spec1819.SpecJournal.List",
        dataMode: "multiple",
        initialViewState: { pageNumber: 1, pageSize: args.pageSize },
        pagination: { defaultPageNumber: 1, defaultPageSize: args.pageSize, resetPageOnSearch: true },
        searchBar: null,
        spec: {
            toSearchParams: () => args,
            buildSearchConditions: ({ searchParams }) => [buildCondition(searchParams)],
            buildQueryParam: ({ searchParams, viewState }) => ({ ...buildBaseParam({ ...searchParams, pageSize: searchParams.pageSize }), PageNumber: viewState.pageNumber }),
            useDataSource: (ctx) => useSpecJournalListDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};

/** DataSource：用 Template 統一接 SSR initial、count、list 與 paginator */
const useSpecJournalListDataSource = (
    ctx: SpecJournalListDataSourceContext,
): ClientDataQueryDataSourceResult<{ list: SpecJournalSet[]; totalCount: number; }, SpecJournalListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(() => SpecJournalAdapter(), []);
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

    const rawData = useMemo(() =>
    {
        return { list: useList.data ?? [], totalCount: useCount.data ?? 0 };
    }, [useList.data, useCount.data]);

    const paginator = useMemo(() =>
    {
        return { currentPage: useList.pageNumber, pageSize: ctx.viewState.pageSize, totalPages: useList.totalPages, totalCount: useCount.data ?? 0, onPageChange: useList.onPageChange };
    }, [useList.pageNumber, useList.totalPages, useList.onPageChange, useCount.data, ctx.viewState.pageSize]);

    // return
    return {
        adapter,
        rawData,
        isLoading: Boolean(useCount.isLoading || useList.isLoading),
        errors: [useCount.errorText, useList.errorText],
        paginator,
    };
};
// #endregion
