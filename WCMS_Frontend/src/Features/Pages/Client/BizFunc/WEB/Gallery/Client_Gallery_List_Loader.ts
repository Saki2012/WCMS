import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import {
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryMemoryState,
    type ClientDataQueryTemplate,
    getClientSearchStringValue,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { ApiGridInitial, ApiGridLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields, GalleryPhotosFields, GalleryPhotosInfoFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

// #region Property
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
interface GalleryListLoaderArgs
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
interface GalleryListLoaderRes
{
    gridData: ApiGridLoaderData<GallerySet>;
    categoryMap: Record<string, string>;
}
interface GalleryListLoaderData
{
    args: GalleryListLoaderArgs;
    res: GalleryListLoaderRes;
}
interface GalleryListRawData
{
    list: GallerySet[];
    categoryMap: Record<string, string>;
    count: number;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
}
interface UseGalleryListDataResult extends GalleryListRawData
{
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    refetchData: () => Promise<void>;
}
type GalleryListAdapter = { Gallery: ReturnType<typeof GalleryAdapter>; Category: ReturnType<typeof CategoryAdapter>; };
type GallerySearchParams = {
    lang: Lang;
    pageSize: number;
    pageNumber: number;
    title?: string;
    categoryIds: string;
    tagIds: string;
};
type GalleryQueryParam = GalleryListLoaderArgs;
type GalleryDataQueryTemplate = ClientDataQueryTemplate<GallerySearchParams, GalleryListRawData, GalleryListRawData, GalleryListAdapter, GalleryQueryParam, GalleryListLoaderData, ClientDataQueryMemoryState>;
// #endregion

// #region Public
/** SSR loader：主清單 + 分類 map 一起預載 */
export const GalleryList_Loader = (p: { lang: Lang; opts: IGalleryListOptions; }) => async (args: LoaderFunctionArgs): Promise<GalleryListLoaderData> =>
{
    const ssrApi = getSsrApi(args.request);
    const gallery = GalleryAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const queryParam = buildLoaderArgs({ lang: p.lang, opts: p.opts });
    const gridLoader = gallery.loader.createQueryGridDataLoader({ getCondition: () => queryParam.listParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: queryParam.progId, lang: queryParam.lang, getApiInstance: () => ssrApi });
    const [gridData, cateLD] = await Promise.all([gridLoader(args), cateLoader(args)]);
    return { args: queryParam, res: { gridData, categoryMap: cateLD.apiRes.Data ?? {} } };
};
/** CSR Hook：Feature 版 GalleryList 走 Client_DataQueryTemplate */
export const useGalleryListData = (p: { lang: Lang; opts?: IGalleryListOptions; title?: string; }): UseGalleryListDataResult =>
{
    const initial = useLoaderData() as GalleryListLoaderData | null;
    const defaultPageState = useMemo<ClientDataQueryMemoryState>(() => ({ searchValues: buildGallerySearchValues(p.title), viewState: buildGalleryInitialViewState({ pageNumber: initial?.args.pageNumber, pageSize: initial?.args.pageSize }) }), [p.lang, initial?.args.pageNumber ?? 1, initial?.args.pageSize ?? 10]);
    const pageState = usePageStateMemory<ClientDataQueryMemoryState>({ stateKey: "Client.GalleryList", scopeKeys: [p.lang], defaultState: defaultPageState });
    const template = useMemo(() =>
    {
        return createGalleryDataQueryTemplate({
                pageState,
            lang: p.lang,
            opts: p.opts,
            overrides: { pageNumber: initial?.args.pageNumber, pageSize: initial?.args.pageSize, title: p.title, categoryIds: initial?.args.categoryIds, tagIds: initial?.args.tagIds },
        });
    }, [p.lang, p.opts, p.title, initial?.args.pageNumber, initial?.args.pageSize, initial?.args.categoryIds, initial?.args.tagIds]);
    const templateVm = useClientDataQueryTemplate(template);
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList, refetchData: templateVm.refetchData };
};
// #endregion

// #region Private
/** 建立 Gallery 前台搜尋欄位，目前只提供標題查詢 */
const buildGallerySearchFields = (): SearchFieldConfig[] =>
{
    return [{ key: SEARCH_TITLE_KEY, title: "標題", label: "標題", type: "text", placeholder: "請輸入標題", maxLength: 100 }] as unknown as SearchFieldConfig[];
};
/** 建立 Gallery 搜尋初始值 */
const buildGallerySearchValues = (title?: string): SearchValues =>
{
    return { [SEARCH_TITLE_KEY]: LibText.safeTrim(title) ?? "" } as SearchValues;
};
/** 建立 Gallery 初始 ViewState */
const buildGalleryInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;
    return { pageNumber, pageSize };
};
/** 建立完整搜尋條件，Title 是唯一 SearchBar 條件 */
const buildGalleryCondition = (p: GallerySearchParams): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(GalleryFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`, Operator.NotEqual, "", true),
        p.categoryIds ? LibCondition.createCondition(GalleryFields.Categories, Operator.HasAny, p.categoryIds) : null,
        p.tagIds ? LibCondition.createCondition(GalleryFields.Tags, Operator.HasAny, p.tagIds) : null,
        p.title ? LibCondition.createCondition(`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`, Operator.Like, p.title) : null,
    ]);
};
/** 建立 Gallery QueryListParam */
const buildGalleryQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    return {
        Fields: [
            GalleryFields.InternalId,
            GalleryFields.GalleryId,
            GalleryFields.Categories,
            GalleryFields.Tags,
            GalleryFields.ContentStatus,
            GalleryFields.CoverPicSrcId,
            GalleryFields.Validate_Start,
            GalleryFields.CreateTime,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
            `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.PicSrcId}`,
            `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.GalleryPhotosInfo}.${GalleryPhotosInfoFields.Lang}`,
            `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.GalleryPhotosInfo}.${GalleryPhotosInfoFields.Title}`,
        ],
        Condition: p.condition,
        RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: GalleryFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};
/** 建立 Gallery 查詢參數 */
const buildGallerySearchParams = (p: { lang: Lang; opts?: IGalleryListOptions; overrides?: Partial<{ title: string; categoryIds: string; tagIds: string; }>; values: SearchValues; viewState: IListViewState; }): GallerySearchParams =>
{
    const title = getClientSearchStringValue(p.values, SEARCH_TITLE_KEY) ?? p.overrides?.title ?? p.opts?.Title;
    const categoryIds = p.overrides?.categoryIds ?? LibText.safeTrim(p.opts?.Category);
    const tagIds = p.overrides?.tagIds ?? LibText.safeTrim(p.opts?.Tag);
    return { lang: p.lang, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, title, categoryIds, tagIds };
};
/** 建立 Gallery QueryParam，Loader / Hook 都統一走這裡 */
const buildGalleryQueryArgs = (p: GallerySearchParams & { condition: string; }): GalleryQueryParam =>
{
    const listParam = buildGalleryQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });
    return { lang: p.lang, pageSize: p.pageSize, pageNumber: p.pageNumber, title: p.title, categoryIds: p.categoryIds, tagIds: p.tagIds, condition: p.condition, listParam, progId: PGID.Gallery };
};
/** 建立 Gallery DataQueryTemplate */
const createGalleryDataQueryTemplate = (p: { pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>; lang: Lang; opts?: IGalleryListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>; }): GalleryDataQueryTemplate =>
{
    const initialViewState = buildGalleryInitialViewState(p.overrides);
    const initialSearchValues = buildGallerySearchValues(p.overrides?.title ?? p.opts?.Title);
    return {
        featureKey: "GalleryList",
        dataMode: "multiple",
        ...(p.pageState ? { pageStateMemory: {
            controller: p.pageState,
            getSearchValues: state => state.searchValues,
            getViewState: state => state.viewState,
            updateSearchValues: (state, values, pageNumber) => ({ ...state, searchValues: values, viewState: { ...state.viewState, pageNumber } }),
            updateViewState: (state, nextViewState) => ({ ...state, viewState: nextViewState }),
            getPagination: raw => ({ count: raw.count, totalPages: raw.totalPages }),
        } } : {}),
        initialSearchValues,
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: { title: "搜尋條件", actionAlign: "right", columnCount: 3 },
        feature: {
            searchFields: buildGallerySearchFields(),
            toSearchParams: (values, viewState) => buildGallerySearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildGalleryCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildGalleryQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useGalleryDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    } as GalleryDataQueryTemplate;
};
/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (p: { lang: Lang; opts?: IGalleryListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; title: string; categoryIds: string; tagIds: string; }>; }): GalleryQueryParam =>
{
    const template = createGalleryDataQueryTemplate(p);
    const viewState = buildGalleryInitialViewState(p.overrides);
    const searchValues = buildGallerySearchValues(p.overrides?.title ?? p.opts?.Title);
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};
/** 組出 Category map hydration initial */
const buildCategoryInitial = (p: { loaderData: GalleryListLoaderData | null; args: GalleryQueryParam; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;
    if (p.loaderData.args.lang !== p.args.lang) return null;
    const apiRes: ApiResponse<Record<string, string>> = { IsSuccess: true, Data: p.loaderData.res.categoryMap ?? {}, SysMessage: [] };
    return { args: { progId: p.args.progId, lang: p.args.lang }, apiRes };
};
/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: GalleryQueryParam; loaderData: GalleryListLoaderData | null; }): ApiGridInitial<GallerySet> | undefined =>
{
    const initial = p.loaderData?.res?.gridData;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.listParam, p.queryParam.listParam);
    if (!initial) return undefined;
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};
/** Gallery DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useGalleryDataSource = (p: { queryParam: GalleryQueryParam; loaderData: GalleryListLoaderData | null; }): ClientDataQueryDataSourceResult<GalleryListRawData, GalleryListAdapter> =>
{
    const adapter = useMemo(() => ({ Gallery: GalleryAdapter(), Category: CategoryAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const categoryInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const grid = adapter.Gallery.hooks.useQueryGridData({ baseParam: currentArgs.listParam, deps: [currentArgs.condition, currentArgs.pageSize], modelDeps: [currentArgs.lang], initial: gridInitial });
    const category = adapter.Category.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: categoryInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const paginator = useMemo<ClientDataQueryPaginatorModel>(() => ({ currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange }), [
        grid.pageNumber,
        grid.totalPages,
        grid.count,
        grid.onPageChange,
        currentArgs.pageSize,
    ]);
    const rawData = useMemo<GalleryListRawData>(
        () => ({ list: grid.list ?? [], categoryMap: category.map ?? {}, count: grid.count ?? 0, pageNumber: grid.pageNumber ?? 1, totalPages: grid.totalPages ?? 1, onPageChange: grid.onPageChange, param: grid.param ?? currentArgs.listParam }),
        [grid.list, category.map, grid.count, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, currentArgs.listParam],
    );
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText].filter((item): item is string => Boolean(item)), [grid.errors, category.errorText]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    const refetchRefData = useCallback(async () =>
    {
        await category.refetch();
    }, [category]);
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading), errors, paginator, refetchData, refetchRefData };
};
// #endregion
