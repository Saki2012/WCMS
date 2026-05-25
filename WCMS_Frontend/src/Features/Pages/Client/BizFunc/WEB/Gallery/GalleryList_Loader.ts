import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
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
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields, PGID } from "@/types/SchemaFields";
import { useCallback, useEffect, useMemo, useRef } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];

const SEARCH_TITLE_KEY = "title";
const DEFAULT_PAGE_SIZE = 12;

export interface IGalleryListOptions
{
    Title: string;
    Category?: string;
    Tag?: string;
    Style: number;
}

export interface GalleryListLoaderArgs
{
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
    condition: string;
    listParam: QueryListParam;
    progId: PGID;
}

export interface GalleryListLoaderRes
{
    gridData: ApiGridLoaderData<GallerySet>;
    categoryMap: Record<string, string>;
}

export interface GalleryListLoaderData
{
    args: GalleryListLoaderArgs;
    res: GalleryListLoaderRes;
}

export interface GalleryListRawData
{
    list: GallerySet[];
    categoryMap: Record<string, string>;
    count: number;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
}

export interface UseGalleryListDataResult extends GalleryListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}

export type GalleryListAdapter = { Gallery: ReturnType<typeof GalleryAdapter>; Category: ReturnType<typeof CategoryAdapter>; };

type GallerySearchParams = {
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
};

type GalleryQueryParam = GalleryListLoaderArgs;
type GalleryDataQueryTemplate = ClientDataQueryTemplate<GallerySearchParams, GalleryListRawData, GalleryListRawData, GalleryListAdapter, GalleryQueryParam, GalleryListLoaderData>;

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
const getCategoryIds = (opts?: IGalleryListOptions): string =>
{
    // return
    return `${opts?.Category ?? ""}`.trim();
};

/** 取得標籤條件字串 */
const getTagIds = (opts?: IGalleryListOptions): string =>
{
    // return
    return `${opts?.Tag ?? ""}`.trim();
};

/** 建立 Gallery 前台搜尋欄位，目前只提供標題查詢 */
const buildGallerySearchFields = (): SearchFieldConfig[] =>
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

/** 建立 Gallery 搜尋初始值 */
const buildGallerySearchValues = (title?: string): SearchValues =>
{
    // return
    return { [SEARCH_TITLE_KEY]: normalizeSearchText(title) ?? "" } as SearchValues;
};

/** 建立 Gallery 初始 ViewState */
const buildGalleryInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    // 宣告變數
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;

    // return
    return { pageNumber, pageSize } as IListViewState;
};

/** 建立固定條件，包含語系、狀態、分類與標籤 */
const buildGalleryBaseCondition = (p: { lang: Lang; categoryIds: string; tagIds: string; }): string =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${GalleryFields.ContentStatus} !& 4`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${p.lang}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} != ''`,
    );

    // 執行 function：套用節點固定篩選條件
    if (p.categoryIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Categories} HasAny [${p.categoryIds}]`);
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${GalleryFields.Tags} HasAny [${p.tagIds}]`);

    // return
    return condition;
};

/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildGalleryCondition = (p: GallerySearchParams): string =>
{
    // 宣告變數
    let condition = buildGalleryBaseCondition({ lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds });

    // 執行 function：使用者搜尋條件只查標題
    if (p.title)
    {
        condition = LibMerge(" And ", false, condition, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} Like ${p.title}`);
    }

    // return
    return condition;
};

/** 建立 Gallery QueryListParam */
const buildGalleryQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    // return
    return {
        Fields: [
            GalleryFields.InternalId,
            GalleryFields.Categories,
            GalleryFields.CoverPicSrcId,
            GalleryFields.CreateTime,
            GalleryFields.Validate_Start,
            GalleryFields.ContentStatus,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
        ],
        Condition: p.condition,
        RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: GalleryFields.Validate_Start, Desc: true }, { Col: GalleryFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};

/** 建立 Gallery 查詢參數 */
const buildGallerySearchParams = (
    p: {
        lang: Lang;
        opts?: IGalleryListOptions;
        overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; }>;
        values: SearchValues;
        viewState: IListViewState;
    },
): GallerySearchParams =>
{
    // 宣告變數
    const title = normalizeSearchText(getSearchStringValue(p.values, SEARCH_TITLE_KEY) ?? p.overrides?.title);
    const categoryIds = p.overrides?.categoryIds ?? getCategoryIds(p.opts);
    const tagIds = p.overrides?.tagIds ?? getTagIds(p.opts);

    // return
    return { lang: p.lang, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds };
};

/** 建立 Gallery QueryParam，Loader / Hook 都統一走這裡 */
const buildGalleryQueryArgs = (p: GallerySearchParams & { condition: string; }): GalleryQueryParam =>
{
    // 宣告變數
    const listParam = buildGalleryQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });

    // return
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, condition: p.condition, listParam, progId: PGID.Gallery };
};

/** 建立 Gallery DataQueryTemplate */
const createGalleryDataQueryTemplate = (
    p: {
        lang: Lang;
        opts?: IGalleryListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>;
    },
): GalleryDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildGalleryInitialViewState(p.overrides);
    const initialSearchValues = buildGallerySearchValues(p.overrides?.title);

    // return
    return {
        featureKey: "GalleryList",
        dataMode: "multiple",
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { title: "搜尋條件", actionAlign: "left", columnCount: 3 },
        feature: {
            searchFields: buildGallerySearchFields(),
            toSearchParams: (values, viewState) => buildGallerySearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildGalleryCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildGalleryQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useGalleryDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    p: {
        lang: Lang;
        opts?: IGalleryListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>;
    },
): GalleryQueryParam =>
{
    // 宣告變數
    const template = createGalleryDataQueryTemplate(p);
    const viewState = buildGalleryInitialViewState(p.overrides);
    const searchValues = buildGallerySearchValues(p.overrides?.title);

    // return
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};

/** 組出 Category map hydration initial */
const buildCategoryInitial = (p: { loaderData: GalleryListLoaderData | null; args: GalleryQueryParam; }): CategoryMapLoaderData | null =>
{
    // 宣告變數
    if (!p.loaderData) return null;
    if (p.loaderData.args.lang !== p.args.lang) return null;

    const apiRes: ApiResponse<Record<string, string>> = { IsSuccess: true, Data: p.loaderData.res.categoryMap ?? {}, SysMessage: [] };

    // return
    return { args: { progId: p.args.progId, lang: p.args.lang }, apiRes };
};

/** SSR loader：主清單 + 分類 map 一起預載 */
export const GalleryList_Loader = (p: { lang: Lang; opts: IGalleryListOptions; }) => async (args: LoaderFunctionArgs): Promise<GalleryListLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(args.request);
    const gallery = GalleryAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });

    // 執行 function：SSR 首屏資料
    const gridLoader = gallery.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: queryParam.progId, lang: queryParam.lang, getApiInstance: () => ssrApi });
    const [gridData, cateLD] = await Promise.all([gridLoader(args), cateLoader(args)]);

    // return
    return { args: queryParam, res: { gridData, categoryMap: cateLD.apiRes.Data ?? {} } };
};

/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: GalleryQueryParam; loaderData: GalleryListLoaderData | null; }): ApiGridInitial<GallerySet> | undefined =>
{
    // 宣告變數
    const initial = p.loaderData?.res?.gridData;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;

    // return
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};

/** 建立資料重置 key，搜尋條件或每頁筆數改變時回到第一頁 */
const buildResetKey = (args: Pick<GalleryQueryParam, "lang" | "pageSize" | "title" | "categoryIds" | "tagIds">): string =>
{
    // return
    return JSON.stringify({ lang: args.lang, pageSize: args.pageSize, title: args.title ?? "", categoryIds: args.categoryIds, tagIds: args.tagIds });
};

/** Gallery DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useGalleryDataSource = (
    p: { queryParam: GalleryQueryParam; loaderData: GalleryListLoaderData | null; },
): ClientDataQueryDataSourceResult<GalleryListRawData, GalleryListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(() => ({ Gallery: GalleryAdapter(), Category: CategoryAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const categoryInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);

    const grid = adapter.Gallery.hooks.useQueryGridData({
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

    const paginator = useMemo<ClientDataQueryPaginatorModel>(() =>
    {
        // return
        return { currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize]);

    const rawData = useMemo<GalleryListRawData>(() =>
    {
        // return
        return { list: grid.list ?? [], categoryMap: category.map ?? {}, count: grid.count ?? 0, pageNumber: grid.pageNumber ?? 1, totalPages: grid.totalPages ?? 1, onPageChange: grid.onPageChange, param: grid.param ?? currentArgs.listParam };
    }, [grid.list, category.map, grid.count, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, currentArgs.listParam]);

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

/** CSR Hook：Feature 版 GalleryList 走 Client_DataQueryTemplate */
export const useGalleryListData = (p: { lang: Lang; opts?: IGalleryListOptions; title?: string; }): UseGalleryListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as GalleryListLoaderData | null;

    const template = useMemo(() =>
    {
        // return
        return createGalleryDataQueryTemplate({
            lang: p.lang,
            opts: p.opts,
            overrides: {
                pageNumber: initial?.args.pageNumber,
                pageSize: initial?.args.pageSize,
                title: p.title,
                categoryIds: initial?.args.categoryIds,
                tagIds: initial?.args.tagIds,
            },
        });
    }, [p.lang, p.opts, p.title, initial?.args.pageNumber, initial?.args.pageSize, initial?.args.categoryIds, initial?.args.tagIds]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
