import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import {
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { PGID, WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";
import type { IWebResourceListOptions } from "./WebResourceList";

type QueryListParam = components["schemas"]["QueryListParam"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategoryMap = Record<string, string>;

const SEARCH_TITLE_KEY = "title";
const DEFAULT_PAGE_SIZE = 9;

export interface WebResourceListLoaderArgs
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

export interface WebResourceListLoaderRes
{
    gridData: ApiGridLoaderData<WebResourceSet>;
    cateMapRes: CategoryMap;
}

export interface WebResourceListLoaderData
{
    args: WebResourceListLoaderArgs;
    res: WebResourceListLoaderRes;
}

export interface WebResourceListRawData
{
    count: number;
    listData: WebResourceSet[];
    categoryMap: CategoryMap;
    gridProps: GridProps;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    baseParam: QueryListParam;
    style: number;
}

export interface UseWebResourceListDataResult extends WebResourceListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}

export type WebResourceListAdapter = {
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
type WebResourceDataQueryTemplate = ClientDataQueryTemplate<WebResourceSearchParams, WebResourceListRawData, WebResourceListRawData, WebResourceListAdapter, WebResourceQueryParam, WebResourceListLoaderData>;

/** 正規化 SearchBar 文字條件 */
const normalizeSearchText = (value?: string): string | undefined =>
{
    // 宣告變數
    const text = `${value ?? ""}`.trim();

    // return
    return text ? text : undefined;
};

/** 讀取 SearchValues 的字串值 */
const getSearchStringValue = (values: SearchValues, key: string): string | undefined =>
{
    // 宣告變數
    const value = (values as Record<string, unknown>)[key];

    // return
    return typeof value === "string" ? value : value == null ? undefined : `${value}`;
};

/** 取得分類條件字串 */
const getCategoryIds = (opts?: IWebResourceListOptions): string =>
{
    // return
    return `${opts?.Category ?? ""}`.trim();
};

/** 取得標籤條件字串 */
const getTagIds = (opts?: IWebResourceListOptions): string =>
{
    // return
    return `${opts?.Tag ?? ""}`.trim();
};

/** 取得 WebResource 樣式設定 */
const getWebResourceStyle = (opts?: IWebResourceListOptions): number =>
{
    // return
    return opts?.Style ?? 1;
};

/** 建立 WebResource 前台搜尋欄位，目前只提供標題查詢 */
const buildWebResourceSearchFields = (): SearchFieldConfig[] =>
{
    // return
    return [
        {
            key: SEARCH_TITLE_KEY,
            title: "標題",
            label: "標題",
            type: "text",
            placeholder: "請輸入標題",
            maxLength: 100,
        },
    ] as unknown as SearchFieldConfig[];
};

/** 建立 WebResource 搜尋初始值 */
const buildWebResourceSearchValues = (title?: string): SearchValues =>
{
    // return
    return { [SEARCH_TITLE_KEY]: normalizeSearchText(title) ?? "" } as SearchValues;
};

/** 建立 WebResource 初始 ViewState */
const buildWebResourceInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    // 宣告變數
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;

    // return
    return { pageNumber, pageSize } as IListViewState;
};

/** 建立固定條件，包含語系、狀態、分類與標籤 */
const buildWebResourceBaseCondition = (p: { lang: Lang; categoryIds: string; tagIds: string; }): string =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${WebResourceFields.ContentStatus} !& 4`,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${p.lang}`,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} != ''`,
    );

    // 執行 function：套用節點固定篩選條件
    if (p.categoryIds) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Categories} HasAny [${p.categoryIds}]`);
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${WebResourceFields.Tags} HasAny [${p.tagIds}]`);

    // return
    return condition;
};

/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildWebResourceCondition = (p: WebResourceSearchParams): string =>
{
    // 宣告變數
    let condition = buildWebResourceBaseCondition({ lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds });

    // 執行 function：使用者搜尋條件只查標題
    if (p.title)
    {
        condition = LibMerge(" And ", false, condition, `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} Like ${p.title}`);
    }

    // return
    return condition;
};

/** 建立 WebResource QueryListParam */
const buildWebResourceQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    // return
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

/** 建立 WebResource 查詢參數 */
const buildWebResourceSearchParams = (
    p: {
        lang: Lang;
        opts?: IWebResourceListOptions;
        overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; style: number; }>;
        values: SearchValues;
        viewState: IListViewState;
    },
): WebResourceSearchParams =>
{
    // 宣告變數
    const title = normalizeSearchText(getSearchStringValue(p.values, SEARCH_TITLE_KEY) ?? p.overrides?.title);
    const categoryIds = p.overrides?.categoryIds ?? getCategoryIds(p.opts);
    const tagIds = p.overrides?.tagIds ?? getTagIds(p.opts);
    const style = p.overrides?.style ?? getWebResourceStyle(p.opts);

    // return
    return { lang: p.lang, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds, style };
};

/** 建立 WebResource QueryParam，Loader / Hook 都統一走這裡 */
const buildWebResourceQueryArgs = (p: WebResourceSearchParams & { condition: string; }): WebResourceQueryParam =>
{
    // 宣告變數
    const listParam = buildWebResourceQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });

    // return
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, style: p.style, condition: p.condition, listParam, progId: PGID.WebResource };
};

/** 組 grid columns */
const buildVisibleColumns = (): ColumnConfig[] =>
{
    // return
    return [
        { key: WebResourceFields.Categories, title: "類別" },
        { key: WebResourceInfoFields.Title, title: "標題" },
        { key: WebResourceInfoFields.ResUrl, title: "連結" },
    ];
};

/** 組 grid cell 文字 */
const buildCellContent = (p: { item: WebResourceSet; colKey: string; lang: Lang; }) =>
{
    // 宣告變數
    const detail = p.item.WebResourceInfo?.find(d => d.Lang === p.lang);

    // 執行 function
    switch (p.colKey)
    {
        case WebResourceInfoFields.Title:
            return detail?.Title ?? "";
        case WebResourceInfoFields.ResUrl:
            return detail?.ResUrl ?? "";
        case WebResourceFields.Categories:
            return p.item.WebResource?.Categories ?? "";
        default:
            return "";
    }
};

/** 由 list 建立 gridProps */
const buildGridProps = (
    p: { lang: Lang; listData: WebResourceSet[]; pageNumber: number; totalPages: number; onPageChange: (page: number) => void; },
): GridProps =>
{
    // 宣告變數
    const columns = buildVisibleColumns();
    const rows: GridRow[] = p.listData.map(item =>
    {
        const cells: RowCell[] = columns.map(col => ({ col, content: buildCellContent({ item, colKey: col.key, lang: p.lang }) }));
        return { keyId: item.WebResource?.InternalId ?? "", cells };
    });

    // return
    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};

/** 建立 WebResource DataQueryTemplate */
const createWebResourceDataQueryTemplate = (
    p: {
        lang: Lang;
        opts?: IWebResourceListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; style: number; }>;
    },
): WebResourceDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildWebResourceInitialViewState(p.overrides);
    const initialSearchValues = buildWebResourceSearchValues(p.overrides?.title);

    // return
    return {
        featureKey: "WebResourceList",
        dataMode: "multiple",
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { title: "搜尋條件", actionAlign: "right", columnCount: 3 },
        feature: {
            searchFields: buildWebResourceSearchFields(),
            toSearchParams: (values, viewState) => buildWebResourceSearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildWebResourceCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildWebResourceQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useWebResourceDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    p: {
        lang: Lang;
        opts?: IWebResourceListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; style: number; }>;
    },
): WebResourceQueryParam =>
{
    // 宣告變數
    const template = createWebResourceDataQueryTemplate(p);
    const viewState = buildWebResourceInitialViewState(p.overrides);
    const searchValues = buildWebResourceSearchValues(p.overrides?.title);

    // return
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};

/** 組出 Category map hydration initial */
const buildCategoryInitial = (p: { loaderData: WebResourceListLoaderData | null; args: WebResourceQueryParam; }): CategoryMapLoaderData | null =>
{
    // 宣告變數
    if (!p.loaderData) return null;
    if (p.loaderData.args.lang !== p.args.lang) return null;

    const apiRes: ApiResponse<Record<string, string>> = { IsSuccess: true, Data: p.loaderData.res.cateMapRes ?? {}, SysMessage: [] };

    // return
    return { args: { progId: p.args.progId, lang: p.args.lang }, apiRes };
};

/** WebResource SSR loader */
export const WebResourceList_Loader = (p: { lang: Lang; opts: IWebResourceListOptions; }) => async (args: LoaderFunctionArgs): Promise<WebResourceListLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(args.request);
    const webResource = WebResourceAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });

    // 執行 function：SSR 首屏資料
    const gridLoader = webResource.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: PGID.WebResource, lang: p.lang, getApiInstance: () => ssrApi });
    const [gridData, cateLD] = await Promise.all([gridLoader(args), cateLoader(args)]);

    // return
    return { args: queryParam, res: { gridData, cateMapRes: cateLD.apiRes.Data ?? {} } };
};

/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: WebResourceQueryParam; loaderData: WebResourceListLoaderData | null; }): ApiGridInitial<WebResourceSet> | undefined =>
{
    // 宣告變數
    const initial = p.loaderData?.res?.gridData;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;

    // return
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};

/** 建立資料重置 key，搜尋條件或每頁筆數改變時回到第一頁 */
const buildResetKey = (args: Pick<WebResourceQueryParam, "lang" | "pageSize" | "title" | "categoryIds" | "tagIds" | "style">): string =>
{
    // return
    return JSON.stringify({ lang: args.lang, pageSize: args.pageSize, title: args.title ?? "", categoryIds: args.categoryIds, tagIds: args.tagIds, style: args.style });
};

/** WebResource DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useWebResourceDataSource = (
    p: { queryParam: WebResourceQueryParam; loaderData: WebResourceListLoaderData | null; },
): ClientDataQueryDataSourceResult<WebResourceListRawData, WebResourceListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(() => ({ WebResource: WebResourceAdapter(), Category: CategoryAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const categoryInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);

    const grid = adapter.WebResource.hooks.useQueryGridData({
        baseParam: currentArgs.listParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        modelDeps: [currentArgs.lang],
        initial: gridInitial,
    });

    const category = adapter.Category.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: categoryInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const resetKey = useMemo(() => buildResetKey(currentArgs), [currentArgs]);
    const prevResetKeyRef = useRef<string>(resetKey);

    useEffect(() =>
    {
        // 執行 function：搜尋條件變更後清單回第一頁
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        grid.onPageChange(1);
    }, [resetKey, grid.onPageChange]);

    const paginator = useMemo<ClientDataQueryPaginatorModel | null>(() =>
    {
        // return：Style 8 依原本行為不顯示分頁
        if (currentArgs.style === 8) return null;
        return { currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize, currentArgs.style]);

    const gridProps = useMemo(() =>
    {
        // return
        return buildGridProps({ lang: currentArgs.lang, listData: grid.list ?? [], pageNumber: grid.pageNumber ?? 1, totalPages: grid.totalPages ?? 1, onPageChange: grid.onPageChange });
    }, [currentArgs.lang, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange]);

    const rawData = useMemo<WebResourceListRawData>(() =>
    {
        // return
        return {
            count: grid.count ?? 0,
            listData: grid.list ?? [],
            categoryMap: category.map ?? {},
            gridProps,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            baseParam: grid.param ?? currentArgs.listParam,
            style: currentArgs.style,
        };
    }, [grid.count, grid.list, category.map, gridProps, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, currentArgs.listParam, currentArgs.style]);

    const errors = useMemo(() =>
    {
        // return
        return [...(grid.errors ?? []), category.errorText].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText]);

    const refetchData = useCallback(async () =>
    {
        // 執行 function：只重抓主清單資料
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：重抓分類參考資料
        await category.refetch();
    }, [category]);

    // return
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading), errors, paginator, refetchData, refetchRefData };
};

/** CSR Hook：Feature 版 WebResourceList 走 Client_DataQueryTemplate */
export const useWebResourceListData = (p: { lang: Lang; opts?: IWebResourceListOptions; title?: string; }): UseWebResourceListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as WebResourceListLoaderData | null;

    const template = useMemo(() =>
    {
        // return
        return createWebResourceDataQueryTemplate({
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
        });
    }, [p.lang, p.opts, p.title, initial?.args.pageNumber, initial?.args.pageSize, initial?.args.categoryIds, initial?.args.tagIds, initial?.args.style]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
