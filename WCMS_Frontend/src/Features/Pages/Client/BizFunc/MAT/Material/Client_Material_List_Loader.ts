import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import {
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useResetListPageOnKeyChange } from "@/SysCore/Utils/UI_HookFunc/useResetListPageOnKeyChange";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialPictureFields, MaterialTagsFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type PageManagementDetail = NonNullable<PageManagementSet["PageManagementDetail"]>[number];

export interface IMaterialListOptions
{
    PageId: string;
    CategoryId: string;
    TagIds: string;
}

// #region Property
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
    gridRes: ApiGridLoaderData<MaterialSet>;
    categoryRes: CategoryMapLoaderData;
    tagRes: TagMapLoaderData;
    pageRes: ApiLoaderData<string, PageManagementSet>;
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

export type MaterialListRawData =
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: MaterialSet[];
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    pageData: PageManagementSet;
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

type MaterialListSearchParams = {
    lang: Lang;
    pageId: string;
    categoryId: string;
    tagIds: string;
    pageNumber: number;
    pageSize: number;
};

type MaterialListDataQueryTemplate = ClientDataQueryTemplate<
    MaterialListSearchParams,
    MaterialListRawData,
    MaterialListRawData,
    MaterialListAdapter,
    MaterialListLoaderArgs,
    MaterialListLoaderData
>;
// #endregion

const DEFAULT_PAGE_SIZE = 12;
const emptyPageData: PageManagementSet = { PageManagement: {}, PageManagementDetail: [] };

// #region Shared Builder
/** 建立 Material List 初始 ViewState */
const buildMaterialListInitialViewState = (overrides?: Partial<{ pageNumber: number; pageSize: number; }>): IListViewState =>
{
    // 宣告變數
    const pageNumber = overrides?.pageNumber ?? 1;
    const pageSize = overrides?.pageSize ?? DEFAULT_PAGE_SIZE;

    // return
    return { pageNumber, pageSize } as IListViewState;
};

/** 建立 Material 固定條件，包含語系、類別與目前 Tab 標籤 */
const buildMaterialCondition = (p: MaterialListSearchParams): string =>
{
    // 宣告變數
    let condition = LibMerge(
        " And ",
        false,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang} = ${p.lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} != ''`,
    );

    // 執行 function：套用節點固定條件與目前 Tab 條件
    if (p.categoryId) condition = LibMerge(" And ", false, condition, `${MaterialFields.CategoryId} In ${p.categoryId}`);
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId} In ${p.tagIds}`);

    // return
    return condition;
};

/** 建立 Material QueryListParam */
const buildMaterialQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
{
    // return
    return {
        Fields: [
            MaterialFields.MaterialId,
            MaterialFields.InternalId,
            MaterialFields.CategoryId,
            MaterialFields.Price,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,
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
    // 宣告變數
    const pageId = `${p.opts.PageId ?? ""}`.trim();
    const categoryId = `${p.opts.CategoryId ?? ""}`.trim();
    const tagIds = getInitialMaterialTagId(p.opts.TagIds) || `${p.opts.TagIds ?? ""}`.trim();

    // return
    return { lang: p.lang, pageId, categoryId, tagIds, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize };
};

/** 建立 Material Loader / Hook 共用 QueryParam */
const buildMaterialListQueryArgs = (p: MaterialListSearchParams & { condition: string; }): MaterialListLoaderArgs =>
{
    // 宣告變數
    const matParam = buildMaterialQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize });

    // return
    return { lang: p.lang, pageId: p.pageId, categoryId: p.categoryId, tagIds: p.tagIds, pageNumber: p.pageNumber, pageSize: p.pageSize, condition: p.condition, matParam };
};

/** 建立 Material List DataQueryTemplate；清單保留分頁，但不顯示搜尋列 */
const createMaterialListDataQueryTemplate = (p: { lang: Lang; opts: IMaterialListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; }): MaterialListDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildMaterialListInitialViewState(p.overrides);

    // return
    return {
        featureKey: "MaterialList",
        dataMode: "multiple",
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
    };
};

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (props: { lang: Lang; opts: IMaterialListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; }): MaterialListLoaderArgs =>
{
    // 宣告變數
    const template = createMaterialListDataQueryTemplate(props);
    const viewState = buildMaterialListInitialViewState(props.overrides);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, viewState).queryParam;
};

/** 建立空的 PageManagement loader data，避免未設定 PageId 時仍打 API */
const buildEmptyPageLoaderData = (pageId: string): ApiLoaderData<string, PageManagementSet> =>
{
    // return
    return { args: pageId, apiRes: { IsSuccess: true, Data: emptyPageData, SysMessage: [] } };
};
// #endregion

// #region SSR Loader
/** SSR Loader：首屏撈 Material + Category + Tag + PageContent */
export const Client_Material_List_Loader = (props: QueryParam) => async (args: LoaderFunctionArgs): Promise<MaterialListLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(args.request);
    const material = MaterialAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const page = PageManagementAdapter(ssrApi);
    const queryParam = buildLoaderArgs(props);

    // 執行 function：SSR 首屏資料
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

    // return
    return { args: queryParam, res: { gridRes, categoryRes, tagRes, pageRes } };
};
// #endregion

// #region CSR DataSource
/** 取得 SSR initial grid，條件一致才沿用 count/list */
const buildGridInitial = (p: { queryParam: MaterialListLoaderArgs; loaderData: MaterialListLoaderData | null; }): ApiGridInitial<MaterialSet> | undefined =>
{
    // 宣告變數
    const initial = p.loaderData?.res?.gridRes;
    const matched = isSameClientDataQueryParam(p.loaderData?.args?.matParam, p.queryParam.matParam);
    if (!initial) return undefined;

    // return
    return { model: initial.model ?? null, count: matched ? (initial.count ?? null) : null, list: matched ? (initial.list ?? null) : null };
};

/** 比對單筆資料 SSR initial 是否可沿用 */
const matchDataInitial = <TData>(currentArg: string, initial: ApiLoaderData<string, TData> | null | undefined): ApiLoaderData<string, TData> | null =>
{
    // return
    return currentArg === (initial?.args ?? "") ? (initial ?? null) : null;
};

/** 依語系取得頁面內容明細 */
const findPageDetail = (data: PageManagementSet, lang: Lang): PageManagementDetail | null =>
{
    // 宣告變數
    const detail = data.PageManagementDetail?.find(p => (p.Lang ?? "").toLowerCase() === lang.toLowerCase());

    // return
    return detail ?? data.PageManagementDetail?.[0] ?? null;
};

/** 組合重置 Key，Tab 或節點固定條件改變時回到第一頁 */
const buildResetKey = (args: Pick<MaterialListLoaderArgs, "lang" | "pageId" | "categoryId" | "tagIds" | "pageSize">): string =>
{
    // return
    return JSON.stringify({ lang: args.lang, pageId: args.pageId, categoryId: args.categoryId, tagIds: args.tagIds, pageSize: args.pageSize });
};

/** Material DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useMaterialListDataSource = (
    p: { queryParam: MaterialListLoaderArgs; loaderData: MaterialListLoaderData | null; },
): ClientDataQueryDataSourceResult<MaterialListRawData, MaterialListAdapter> =>
{
    // 宣告變數
    const adapter = useMemo(() => ({ Material: MaterialAdapter(), Category: CategoryAdapter(), Tag: TagAdapter(), PageManagement: PageManagementAdapter() }), []);
    const currentArgs = p.queryParam;
    const gridInitial = useMemo(() => buildGridInitial(p), [p]);
    const pageInitial = useMemo(() => currentArgs.pageId ? matchDataInitial(currentArgs.pageId, p.loaderData?.res.pageRes) : buildEmptyPageLoaderData(currentArgs.pageId), [currentArgs.pageId, p.loaderData]);

    // 執行 function：主清單與參考資料
    const grid = adapter.Material.hooks.useQueryGridData({ baseParam: currentArgs.matParam, deps: [currentArgs.condition, currentArgs.pageSize], modelDeps: [currentArgs.lang], initial: gridInitial });
    const pageData = adapter.PageManagement.hooks.useQueryData({ internalId: currentArgs.pageId, initial: pageInitial, deps: [currentArgs.pageId, currentArgs.lang] });
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.Material, lang: currentArgs.lang, initial: p.loaderData?.res.categoryRes ?? null, deps: [currentArgs.lang] });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Material, lang: currentArgs.lang, initial: p.loaderData?.res.tagRes ?? null, deps: [currentArgs.lang] });
    const resetKey = useMemo(() => buildResetKey(currentArgs), [currentArgs]);
    useResetListPageOnKeyChange(resetKey, grid.onPageChange);

    const pageSet = useMemo(() => pageData.data ?? emptyPageData, [pageData.data]);
    const pageDetail = useMemo(() => findPageDetail(pageSet, currentArgs.lang), [pageSet, currentArgs.lang]);

    const paginator = useMemo<ClientDataQueryPaginatorModel>(() =>
    {
        // return
        return { currentPage: grid.pageNumber ?? 1, pageSize: currentArgs.pageSize, totalPages: grid.totalPages ?? 1, totalCount: grid.count ?? 0, onPageChange: grid.onPageChange };
    }, [grid.pageNumber, grid.totalPages, grid.count, grid.onPageChange, currentArgs.pageSize]);

    const rawData = useMemo<MaterialListRawData>(() =>
    {
        // return
        return {
            pageSize: currentArgs.pageSize,
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            totalCount: grid.count ?? 0,
            listData: grid.list ?? [],
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
            pageData: pageSet,
            pageDetail,
            pageTitle: pageDetail?.Title ?? "",
        };
    }, [currentArgs.pageSize, grid.pageNumber, grid.totalPages, grid.count, grid.list, category.map, tag.map, pageSet, pageDetail]);

    const errors = useMemo(() =>
    {
        // return
        return [...(grid.errors ?? []), category.errorText, tag.errorText, pageData.errorText].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText, tag.errorText, pageData.errorText]);

    const refetchData = useCallback(async () =>
    {
        // 執行 function：重抓主清單資料
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：重抓參考資料
        await Promise.all([category.refetch(), tag.refetch(), pageData.refetch()]);
    }, [category, tag, pageData]);

    // return
    return { adapter, rawData, isLoading: Boolean(grid.isLoading || category.isLoading || tag.isLoading || pageData.isLoading), errors, paginator, refetchData, refetchRefData };
};
// #endregion

// #region Public Hook
/** CSR Hook：Feature 版 MaterialList 走 Client_DataQueryTemplate，不顯示 SearchBar */
export const useMaterialListData = (props: QueryParam): UseMaterialListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as MaterialListLoaderData | null;
    const fallbackArgs = useMemo(() => buildLoaderArgs(props), [props.lang, props.opts.PageId, props.opts.CategoryId, props.opts.TagIds]);
    const initialArgs = initial?.args ?? fallbackArgs;

    const template = useMemo(() =>
    {
        // return
        return createMaterialListDataQueryTemplate({ lang: props.lang, opts: props.opts, overrides: { pageNumber: initialArgs.pageNumber, pageSize: initialArgs.pageSize } });
    }, [props.lang, props.opts, initialArgs.pageNumber, initialArgs.pageSize]);

    const templateVm = useClientDataQueryTemplate(template);
    const rawData = templateVm.viewModel;

    // return
    return { rawData, paginatorProps: templateVm.paginatorProps, isLoading: templateVm.isLoading, errorList: templateVm.errorList, onPageChange: rawData.pageNumber ? templateVm.paginator?.onPageChange ?? (() => undefined) : (() => undefined), refetchData: templateVm.refetchData };
};
// #endregion

// #region Public Helper
/** 取得 Material List 初始查詢用 TagId */
export const getInitialMaterialTagId = (tagIds?: string | null): string =>
{
    // return
    return getCsvValues(tagIds ?? "")[0] ?? "";
};

/** 將 CSV 字串轉成乾淨 id 清單 */
export const getCsvValues = (value: string): string[] =>
{
    // 宣告變數
    const list = value.split(",").map(cleanCsvValue).filter(Boolean);

    // return
    return Array.from(new Set(list));
};

/** 清理 CSV 內可能殘留的括號或引號 */
const cleanCsvValue = (value: string): string =>
{
    // return
    return value.trim().replace(/^[("'\s]+|[)"'\s]+$/g, "");
};
// #endregion
