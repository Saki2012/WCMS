import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import {
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryMemoryState,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
    getClientSearchStringValue,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { getClientSearchBarText } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_I18n";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { getModelColumnDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiGridInitial, ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { PGID, WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IWebResourceListOptions } from "./Client_WebResource_List_Comp";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type WebResourceFormModel = components["schemas"]["WebResource"];
type CategoryMap = Record<string, string>;
const SEARCH_TITLE_KEY = "title";
const DEFAULT_PAGE_SIZE = 9;

interface WebResourceListLoaderArgs
{
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
    style: number;
    condition: string;
    listParam: QueryListParam;
    progId: PGID;
}

interface WebResourceListLoaderRes
{
    gridData: ApiGridLoaderData<WebResourceFormModel>;
    cateMapRes: CategoryMap;
}

interface WebResourceListLoaderData
{
    args: WebResourceListLoaderArgs;
    res: WebResourceListLoaderRes;
}

interface WebResourceListRawData
{
    count: number;
    listData: WebResourceFormModel[];
    categoryMap: CategoryMap;
    gridProps: GridProps;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    baseParam: QueryListParam;
    style: number;
}

interface UseWebResourceListDataResult extends WebResourceListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}

type WebResourceListAdapter = {
    WebResource: ReturnType<typeof WebResourceAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
};
type WebResourceSearchParams = {
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
    style: number;
};
type WebResourceQueryParam = WebResourceListLoaderArgs;
type WebResourceDataQueryTemplate = ClientDataQueryTemplate<
    WebResourceSearchParams,
    WebResourceListRawData,
    WebResourceListRawData,
    WebResourceListAdapter,
    WebResourceQueryParam,
    WebResourceListLoaderData,
    ClientDataQueryMemoryState
>;
// #endregion

// #region Public
/** WebResource SSR loader */
export const Client_WebResourceList_Loader = (p: { lang: Lang; opts: IWebResourceListOptions; }) => async (args: LoaderFunctionArgs): Promise<WebResourceListLoaderData> =>
{
    const ssrApi = getSsrApi(args.request);
    const webResource = WebResourceAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });
    const gridLoader = webResource.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: PGID.WebResource, lang: p.lang, getApiInstance: () => ssrApi });
    const [gridData, cateLD] = await Promise.all([gridLoader(args), cateLoader(args)]);
    return { args: queryParam, res: { gridData, cateMapRes: cateLD.apiRes.Data ?? {} } };
};

/** CSR Hook：Feature 版 WebResourceList 走 Client_DataQueryTemplate */
export const useWebResourceListData = (p: { lang: Lang; opts?: IWebResourceListOptions; title?: string; }): UseWebResourceListDataResult =>
{
    const initial = useLoaderData() as WebResourceListLoaderData | null;
    const defaultPageState = useMemo<ClientDataQueryMemoryState>(() => ({
        searchValues: buildWebResourceSearchValues(p.title),
        viewState: buildWebResourceInitialViewState({ pageNumber: initial?.args.pageNumber, pageSize: initial?.args.pageSize }),
    }), [p.lang, initial?.args.pageNumber ?? 1, initial?.args.pageSize ?? 10]);
    const pageState = usePageStateMemory<ClientDataQueryMemoryState>({ stateKey: "Client.WebResourceList", scopeKeys: [p.lang], defaultState: defaultPageState });
    const template = useMemo(() =>
        createWebResourceDataQueryTemplate({
            pageState,
            lang: p.lang,
            opts: p.opts,
            overrides: {
                pageNumber: initial?.args.pageNumber,
                pageSize: initial?.args.pageSize,
                title: p.title,
                categoryIds: initial?.args.categoryIds,
                tagIds: initial?.args.tagIds,
                style: initial?.args.style,
            },
        }), [p.lang, p.opts, p.title, initial?.args.pageNumber, initial?.args.pageSize, initial?.args.categoryIds, initial?.args.tagIds, initial?.args.style, pageState]);
    const templateVm = useClientDataQueryTemplate(template);
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
// #endregion

// #region Private
/** 建立 WebResource 前台搜尋欄位，目前只提供標題查詢 */
const buildWebResourceSearchFields = (lang: Lang): SearchFieldConfig[] =>
{
    const isEnglish = lang === "en";
    return [{
        key: SEARCH_TITLE_KEY,
        title: isEnglish ? "Title" : "標題",
        type: "text",
        placeholder: isEnglish ? "Enter a title" : "請輸入標題",
        maxLength: 100,
    }] as SearchFieldConfig[];
};

/** 建立 WebResource 搜尋初始值 */
const buildWebResourceSearchValues = (title?: string): SearchValues =>
{
    return { [SEARCH_TITLE_KEY]: LibText.safeTrim(title) ?? "" } as SearchValues;
};

/** 建立 WebResource 初始 ViewState */
const buildWebResourceInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;
    return { pageNumber, pageSize };
};

/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildWebResourceCondition = (p: WebResourceSearchParams): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(WebResourceFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(`${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`, Operator.NotEqual, "", true),
        LibCondition.createCondition(WebResourceFields.Categories, Operator.HasAny, p.categoryIds),
        LibCondition.createCondition(WebResourceFields.Tags, Operator.HasAny, p.tagIds),
        LibCondition.createCondition(`${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`, Operator.Like, p.title),
    ]);
};

/** 建立 WebResource QueryListParam */
const buildWebResourceQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    return {
        Fields: [
            WebResourceFields.InternalId,
            WebResourceFields.WebResourceId,
            WebResourceFields.PicId,
            WebResourceFields.PicDescription,
            WebResourceFields.Categories,
            WebResourceFields.ContentStatus,
            WebResourceFields.CreateTime,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
        ],
        Condition: p.condition,
        RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};

/** 建立 WebResource 搜尋參數 */
const buildWebResourceSearchParams = (p: {
    lang: Lang;
    opts?: IWebResourceListOptions;
    overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; style: number; }>;
    values: SearchValues;
    viewState: IListViewState;
}): WebResourceSearchParams =>
{
    const title = getClientSearchStringValue(p.values, SEARCH_TITLE_KEY) ?? p.overrides?.title;
    const categoryIds = p.overrides?.categoryIds ?? LibText.safeTrim(p.opts?.Category);
    const tagIds = p.overrides?.tagIds ?? LibText.safeTrim(p.opts?.Tag);
    const style = p.overrides?.style ?? p.opts?.Style ?? 1;
    return { lang: p.lang, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds, style };
};

/** 建立 WebResource QueryParam，Loader / Hook 都統一走這裡 */
const buildWebResourceQueryArgs = (p: WebResourceSearchParams & { condition: string; }): WebResourceQueryParam =>
{
    const listParam = buildWebResourceQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, style: p.style, condition: p.condition, listParam, progId: PGID.WebResource };
};

/** 依後端 Model Metadata 組成 Grid 欄位。 */
const buildVisibleColumns = (lang: Lang, model: ModelDisplaySchema | null): ColumnConfig[] =>
{
    const isEnglish = lang === "en";
    return [
        { key: WebResourceFields.Categories, title: getModelColumnDisplayName(model, ["WebResource_DTO", "WebResource"], WebResourceFields.Categories, isEnglish ? "Category" : "類別") },
        { key: WebResourceInfoFields.Title, title: getModelColumnDisplayName(model, ["WebResourceInfo_DTO", "WebResourceInfo"], WebResourceInfoFields.Title, isEnglish ? "Title" : "標題") },
        { key: WebResourceInfoFields.ResUrl, title: getModelColumnDisplayName(model, ["WebResourceInfo_DTO", "WebResourceInfo"], WebResourceInfoFields.ResUrl, isEnglish ? "URL" : "連結") },
    ];
};

/** 組 grid cell 文字 */
const buildCellContent = (p: { item: WebResourceFormModel; colKey: string; lang: Lang; }) =>
{
    const detail = p.item._WebResourceInfo?.find(d => d.Lang === p.lang);
    switch (p.colKey)
    {
        case WebResourceInfoFields.Title:
            return detail?.Title ?? "";
        case WebResourceInfoFields.ResUrl:
            return detail?.ResUrl ?? "";
        case WebResourceFields.Categories:
            return p.item?.Categories ?? "";
        default:
            return "";
    }
};

/** 由 list 建立 gridProps */
const buildGridProps = (p: { lang: Lang; listData: WebResourceFormModel[]; pageNumber: number; totalPages: number; onPageChange: (page: number) => void; }): GridProps =>
{
    const columns = buildVisibleColumns(p.lang, p.modelDisplayName);
    const rows: GridRow[] = p.listData.map(item =>
    {
        const cells: RowCell[] = columns.map(col => ({ col, content: buildCellContent({ item, colKey: col.key, lang: p.lang }) }));
        return { keyId: item.InternalId ?? "", cells };
    });
    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};

/** 建立 WebResource DataQueryTemplate */
const createWebResourceDataQueryTemplate = (p: {
    pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>;
    lang: Lang;
    opts?: IWebResourceListOptions;
    overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; style: number; }>;
}): WebResourceDataQueryTemplate =>
{
    const initialViewState = buildWebResourceInitialViewState(p.overrides);
    const initialSearchValues = buildWebResourceSearchValues(p.overrides?.title);
    const searchBarText = getClientSearchBarText(p.lang);
    return {
        featureKey: "WebResourceList",
        dataMode: "multiple",
        ...(p.pageState
            ? {
                pageStateMemory: {
                    controller: p.pageState,
                    getSearchValues: state => state.searchValues,
                    getViewState: state => state.viewState,
                    updateSearchValues: (state, values, pageNumber) => ({ ...state, searchValues: values, viewState: { ...state.viewState, pageNumber } }),
                    updateViewState: (state, nextViewState) => ({ ...state, viewState: nextViewState }),
                    getPagination: raw => ({ count: raw.count, totalPages: raw.totalPages }),
                },
            }
            : {}),
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { ...searchBarText, actionAlign: "right", columnCount: 3 },
        feature: {
            searchFields: buildWebResourceSearchFields(p.lang),
            toSearchParams: (values, viewState) => buildWebResourceSearchParams({ ...p, values, viewState }),
            buildSearchConditions: ctx => [buildWebResourceCondition(ctx.searchParams)],
            buildQueryParam: ctx => buildWebResourceQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: ctx => useWebResourceDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: ctx => ctx.rawData,
        },
    } as WebResourceDataQueryTemplate;
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (p: {
    lang: Lang;
    opts?: IWebResourceListOptions;
    overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; style: number; }>;
}): WebResourceQueryParam =>
{
    const template = createWebResourceDataQueryTemplate(p);
    const viewState = buildWebResourceInitialViewState(p.overrides);
    const searchValues = buildWebResourceSearchValues(p.overrides?.title);
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};

/** 組出 Category map hydration initial */
const buildCategoryInitial = (p: { loaderData: WebResourceListLoaderData | null; args: WebResourceQueryParam; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData || p.loaderData.args.lang !== p.args.lang) return null;
    const apiRes: ApiResponse<Record<string, string>> = { IsSuccess: true, Data: p.loaderData.res.cateMapRes ?? {}, SysMessage: [] };
    return { args: { progId: p.args.progId, lang: p.args.lang }, apiRes };
};

/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: WebResourceQueryParam; loaderData: WebResourceListLoaderData | null; }): ApiGridInitial<WebResourceFormModel> | undefined =>
{
    const initial = p.loaderData?.res?.gridData;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};

/** WebResource DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useWebResourceDataSource = (p: { queryParam: WebResourceQueryParam; loaderData: WebResourceListLoaderData | null; }): ClientDataQueryDataSourceResult<WebResourceListRawData, WebResourceListAdapter> =>
{
    const adapter = useMemo(() => ({ WebResource: WebResourceAdapter(), Category: CategoryAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const categoryInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const grid = adapter.WebResource.hooks.useQueryGridData({ baseParam: currentArgs.listParam, deps: [currentArgs.condition, currentArgs.pageSize], modelDeps: [currentArgs.lang], initial: gridInitial });
    const category = adapter.Category.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: categoryInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const paginator = useMemo<ClientDataQueryPaginatorModel | null>(() =>
    {
        if (currentArgs.style === 8) return null;
        return { currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize, currentArgs.style]);
    const gridProps = useMemo(() => buildGridProps({ lang: currentArgs.lang, modelDisplayName: grid.modelDisplayName, listData: grid.list ?? [], pageNumber: grid.pageNumber ?? 1, totalPages: grid.totalPages ?? 1, onPageChange: grid.onPageChange }), [
        currentArgs.lang,
        grid.modelDisplayName,
        grid.list,
        grid.pageNumber,
        grid.totalPages,
        grid.onPageChange,
    ]);
    const rawData = useMemo<WebResourceListRawData>(
        () => ({
            count: grid.count ?? 0,
            listData: grid.list ?? [],
            categoryMap: category.map ?? {},
            gridProps,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            baseParam: grid.param ?? currentArgs.listParam,
            style: currentArgs.style,
        }),
        [grid.count, grid.list, category.map, gridProps, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, currentArgs.listParam, currentArgs.style],
    );
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText].filter((item): item is string => Boolean(item)), [grid.errors, category.errorText]);
    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid.refetchData]);
    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await category.refetch();
    }, [category.refetch]);
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading), errors, paginator, refetchData, refetchRefData };
};
// #endregion
