import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import {
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQueryMemoryState,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialPictureFields, MaterialTagsFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialFormModel = components["schemas"]["Material"];
type PageManagementFormModel = components["schemas"]["PageManagement"];
type PageManagementDetail = NonNullable<PageManagementFormModel["_PageManagementDetail"]>[number];
export interface IMaterialListOptions
{
    PageId: string;
    CategoryId: string;
    TagIds: string;
}
export interface MaterialListLoaderArgs
{
    lang: Lang;
    pageId: string;
    categoryId: string;
    tagIds: string;
    pageNumber: number;
    pageSize: number;
    condition: string;
    matParam: QueryListParam;
}
export interface MaterialListLoaderRes
{
    gridRes: ApiGridLoaderData<MaterialFormModel>;
    categoryRes: CategoryMapLoaderData;
    tagRes: TagMapLoaderData;
    pageRes: ApiLoaderData<string, PageManagementFormModel>;
}
export interface MaterialListLoaderData
{
    args: MaterialListLoaderArgs;
    res: MaterialListLoaderRes;
}
interface QueryParam
{
    lang: Lang;
    opts: IMaterialListOptions;
}
export type MaterialListRawData = {
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: MaterialFormModel[];
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    pageData: PageManagementFormModel;
    pageDetail: PageManagementDetail | null;
    pageTitle: string;
};
export interface UseMaterialListDataResult
{
    rawData: MaterialListRawData;
    paginatorProps: PaginatorProps | null;
    isLoading: boolean;
    errorList: string[];
    onPageChange: (page: number) => void;
    refetchData: () => Promise<void>;
}
type MaterialListAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    PageManagement: ReturnType<typeof PageManagementAdapter>;
};
type MaterialListSearchParams = { lang: Lang; pageId: string; categoryId: string; tagIds: string; pageNumber: number; pageSize: number; };
type MaterialListDataQueryTemplate = ClientDataQueryTemplate<
    MaterialListSearchParams,
    MaterialListRawData,
    MaterialListRawData,
    MaterialListAdapter,
    MaterialListLoaderArgs,
    MaterialListLoaderData,
    ClientDataQueryMemoryState
>;
const DEFAULT_PAGE_SIZE = 12;
const emptyPageData: PageManagementFormModel = { _PageManagementDetail: [] };
// #endregion

// #region Public
/** SSR Loader：首屏撈 Material + Category + Tag + PageContent */
export const Client_Material_List_Loader = (props: QueryParam) => async (args: LoaderFunctionArgs): Promise<MaterialListLoaderData> =>
{
    const ssrApi = getSsrApi(args.request);
    const material = MaterialAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const page = PageManagementAdapter(ssrApi);
    const queryParam = buildLoaderArgs(props);
    const gridLoader = material.loader.createQueryGridDataLoader({ getCondition: () => queryParam.matParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: props.lang, getApiInstance: () => ssrApi });
    const pageLoader = page.loader.createQueryDataLoader({ getInternalId: () => queryParam.pageId, getApiInstance: () => ssrApi });
    const [gridRes, categoryRes, tagRes, pageRes] = await Promise.all([
        gridLoader(args),
        cateLoader(args),
        tagLoader(args),
        queryParam.pageId ? pageLoader(args) : Promise.resolve(buildEmptyPageLoaderData(queryParam.pageId)),
    ]);
    return { args: queryParam, res: { gridRes, categoryRes, tagRes, pageRes } };
};

/** CSR Hook：Feature 版 MaterialList 走 Client_DataQueryTemplate，不顯示 SearchBar */
export const useMaterialListData = (props: QueryParam): UseMaterialListDataResult =>
{
    const initial = useLoaderData() as MaterialListLoaderData | null;
    const fallbackArgs = useMemo(() => buildLoaderArgs(props), [props.lang, props.opts.PageId, props.opts.CategoryId, props.opts.TagIds]);
    const initialArgs = initial?.args ?? fallbackArgs;
    const defaultPageState = useMemo<ClientDataQueryMemoryState>(() => ({ searchValues: {} as SearchValues, viewState: buildMaterialListInitialViewState({ pageNumber: initialArgs.pageNumber, pageSize: initialArgs.pageSize }) }), [props.lang, initialArgs.pageNumber, initialArgs.pageSize]);
    const pageState = usePageStateMemory<ClientDataQueryMemoryState>({ stateKey: "Client.MaterialList", scopeKeys: [props.lang], defaultState: defaultPageState });
    const template = useMemo(
        () =>
            createMaterialListDataQueryTemplate({
                pageState,
                lang: props.lang,
                opts: props.opts,
                overrides: { pageNumber: initialArgs.pageNumber, pageSize: initialArgs.pageSize },
            }),
        [props.lang, props.opts, initialArgs.pageNumber, initialArgs.pageSize, pageState],
    );
    const templateVm = useClientDataQueryTemplate(template);
    const rawData = templateVm.viewModel;
    return {
        rawData,
        paginatorProps: templateVm.paginatorProps,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
        onPageChange: rawData.pageNumber ? templateVm.paginator?.onPageChange ?? (() => undefined) : (() => undefined),
        refetchData: templateVm.refetchData,
    };
};
// #endregion

// #region Private
/** 建立 Material List 初始 ViewState */
const buildMaterialListInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;
    return { pageNumber, pageSize } as IListViewState;
};
/** 建立 Material 固定條件，包含語系、類別與目前 Tab 標籤 */
const buildMaterialCondition = (p: MaterialListSearchParams): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(`${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`, Operator.NotEqual, ""),
        p.categoryId ? LibCondition.createCondition(MaterialFields.CategoryId, Operator.In, p.categoryId) : null,
        p.tagIds ? LibCondition.createCondition(`${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId}`, Operator.In, p.tagIds) : null,
    ]);
};
/** 建立 Material QueryListParam */
const buildMaterialQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    return {
        Fields: [
            MaterialFields.MaterialId,
            MaterialFields.InternalId,
            MaterialFields.CategoryId,
            MaterialFields.Price,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.RowNo}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureId}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureName}`,
        ],
        Condition: p.condition,
        OrderBy: [{ Col: MaterialFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};
/** 建立 Material Template 查詢參數 */
const buildMaterialListSearchParams = (p: { lang: Lang; opts: IMaterialListOptions; viewState: IListViewState; }): MaterialListSearchParams =>
{
    const pageId = LibText.safeTrim(p.opts.PageId);
    const categoryId = LibText.safeTrim(p.opts.CategoryId);
    const initialTagId = LibText.splitTrimToArray(p.opts.TagIds, ",", true)[0] ?? "";
    const tagIds = initialTagId || LibText.safeTrim(p.opts.TagIds);
    return { lang: p.lang, pageId, categoryId, tagIds, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize };
};
/** 建立 Material Loader / Hook 共用 QueryParam */
const buildMaterialListQueryArgs = (p: MaterialListSearchParams & { condition: string; }): MaterialListLoaderArgs =>
{
    const matParam = buildMaterialQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });
    return {
        lang: p.lang,
        pageId: p.pageId,
        categoryId: p.categoryId,
        tagIds: p.tagIds,
        pageNumber: p.pageNumber,
        pageSize: p.pageSize,
        condition: p.condition,
        matParam,
    };
};
/** 建立 Material List DataQueryTemplate；清單保留分頁，但不顯示搜尋列 */
const createMaterialListDataQueryTemplate = (
    p: { pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>; lang: Lang; opts: IMaterialListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; },
): MaterialListDataQueryTemplate =>
{
    const initialViewState = buildMaterialListInitialViewState(p.overrides);
    return {
        featureKey: "MaterialList",
        dataMode: "multiple",
        ...(p.pageState ? { pageStateMemory: {
            controller: p.pageState,
            getSearchValues: state => state.searchValues,
            getViewState: state => state.viewState,
            updateSearchValues: (state, values, pageNumber) => ({ ...state, searchValues: values, viewState: { ...state.viewState, pageNumber } }),
            updateViewState: (state, nextViewState) => ({ ...state, viewState: nextViewState }),
            getPagination: raw => ({ count: raw.totalCount, totalPages: raw.totalPages }),
        } } : {}),
        initialSearchValues: {},
        initialViewState,
        pagination: { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true },
        searchBar: null,
        feature: {
            toSearchParams: (_values, viewState) => buildMaterialListSearchParams({ lang: p.lang, opts: p.opts, viewState }),
            buildSearchConditions: (ctx) => [buildMaterialCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildMaterialListQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useMaterialListDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    } as MaterialListDataQueryTemplate;
};
/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    props: { lang: Lang; opts: IMaterialListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; },
): MaterialListLoaderArgs =>
{
    const template = createMaterialListDataQueryTemplate(props);
    const viewState = buildMaterialListInitialViewState(props.overrides);
    return buildClientDataQueryState(template, {} as SearchValues, viewState).queryParam;
};
/** 建立空的 PageManagement loader data，避免未設定 PageId 時仍打 API */
const buildEmptyPageLoaderData = (pageId: string): ApiLoaderData<string, PageManagementFormModel> =>
{
    return { args: pageId, apiRes: { IsSuccess: true, Data: emptyPageData, SysMessage: [] } };
};
/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: MaterialListLoaderArgs; loaderData: MaterialListLoaderData | null; }): ApiGridInitial<MaterialFormModel> | undefined =>
{
    const initial = p.loaderData?.res?.gridRes;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.matParam, p.queryParam.matParam);
    if (!initial) return undefined;
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};
/** 比對單筆資料 SSR initial 是否可沿用 */
const matchDataInitial = <TData>(currentArg: string, initial: ApiLoaderData<string, TData> | null | undefined): ApiLoaderData<string, TData> | null =>
{
    return currentArg === (initial?.args ?? "") ? (initial ?? null) : null;
};
/** 依語系取得頁面內容明細 */
const findPageDetail = (data: PageManagementFormModel, lang: Lang): PageManagementDetail | null =>
{
    const detail = data._PageManagementDetail?.find(p => (p.Lang ?? "").toLowerCase() === lang.toLowerCase());
    return detail ?? data._PageManagementDetail?.[0] ?? null;
};
/** 組合重置 Key，Tab 或節點固定條件改變時回到第一頁 */
const buildResetKey = (args: Pick<MaterialListLoaderArgs, "lang" | "pageId" | "categoryId" | "tagIds" | "pageSize">): string =>
{
    return JSON.stringify({ lang: args.lang, pageId: args.pageId, categoryId: args.categoryId, tagIds: args.tagIds, pageSize: args.pageSize });
};
/** Material DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useMaterialListDataSource = (
    p: { queryParam: MaterialListLoaderArgs; loaderData: MaterialListLoaderData | null; },
): ClientDataQueryDataSourceResult<MaterialListRawData, MaterialListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(
        () => ({ Material: MaterialAdapter(), Category: CategoryAdapter(), Tag: TagAdapter(), PageManagement: PageManagementAdapter() }),
        [],
    );
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const pageInitial = useMemo(
        () => currentArgs.pageId ? matchDataInitial(currentArgs.pageId, p.loaderData?.res.pageRes) : buildEmptyPageLoaderData(currentArgs.pageId),
        [currentArgs.pageId, p.loaderData],
    );
    const grid = adapter.Material.hooks.useQueryGridData({
        baseParam: currentArgs.matParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        modelDeps: [currentArgs.lang],
        initial: gridInitial,
    });
    const pageData = adapter.PageManagement.hooks.useQueryData({
        internalId: currentArgs.pageId,
        initial: pageInitial,
        deps: [currentArgs.pageId, currentArgs.lang],
    });
    const category = adapter.Category.hooks.useMapByProgId({
        progId: PGID.Material,
        lang: currentArgs.lang,
        initial: p.loaderData?.res.categoryRes ?? null,
        deps: [currentArgs.lang],
    });
    const tag = adapter.Tag.hooks.useMapByProgId({
        progId: PGID.Material,
        lang: currentArgs.lang,
        initial: p.loaderData?.res.tagRes ?? null,
        deps: [currentArgs.lang],
    });
    const pageModel = useMemo(() => pageData.data ?? emptyPageData, [pageData.data]);
    const pageDetail = useMemo(() => findPageDetail(pageModel, currentArgs.lang), [pageModel, currentArgs.lang]);
    const paginator = useMemo<ClientDataQueryPaginatorModel>(() =>
    {
        return {
            currentPage: grid.pageNumber ?? 1,
            pageSize: currentArgs.pageSize,
            totalPages: grid.totalPages ?? 1,
            totalCount: grid.count ?? 0,
            onPageChange: grid.onPageChange,
        };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize]);
    const rawData = useMemo<MaterialListRawData>(() =>
    {
        return {
            pageSize: currentArgs.pageSize,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            totalCount: grid.count ?? 0,
            listData: grid.list ?? [],
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            pageData: pageModel,
            pageDetail,
            pageTitle: pageDetail?.Title ?? "",
        };
    }, [currentArgs.pageSize, grid.pageNumber, grid.totalPages, grid.count, grid.list, category.map, tag.map, pageModel, pageDetail]);
    const errors = useMemo(() =>
    {
        return [...(grid.errors ?? []), category.errorText, tag.errorText, pageData.errorText].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText, tag.errorText, pageData.errorText]);
    const refetchData = useCallback(async () =>
    {
        await grid.refetchData();
    }, [grid]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([category.refetch(), tag.refetch(), pageData.refetch()]);
    }, [category, tag, pageData]);

    return {
        adapter,
        rawData,
        isLoading: Boolean(grid.isLoading || category.isLoading || tag.isLoading || pageData.isLoading),
        errors,
        paginator,
        refetchData,
        refetchRefData,
    };
};
// #endregion
