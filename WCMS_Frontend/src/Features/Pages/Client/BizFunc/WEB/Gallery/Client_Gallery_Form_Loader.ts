import { useCallback, useMemo } from "react";
import { useParams } from "react-router";
import type { LoaderFunctionArgs } from "react-router-dom";

import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    buildClientLoaderInitial,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields, GalleryPhotosFields, GalleryPhotosInfoFields, PGID } from "@/types/SchemaFields";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type GalleryFormModel = components["schemas"]["Gallery"];
interface GalleryFormLoaderArgs
{
    internalId: string;
    progId: PGID;
    lang: Lang;
    queryParam: QueryListParam;
}
interface GalleryFormLoaderRes
{
    listRes: GalleryFormModel[];
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
}
interface GalleryFormLoaderData
{
    args: GalleryFormLoaderArgs;
    res: GalleryFormLoaderRes;
}
type GalleryFormRawData = {
    internalId: string;
    data: GalleryFormModel;
    title: string;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    args: GalleryFormLoaderArgs;
};
type GalleryFormAdapter = {
    Gallery: ReturnType<typeof GalleryAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
};
interface GalleryFormFetchDataResult extends GalleryFormRawData
{
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}
type GalleryFormSearchParams = {
    internalId: string;
    progId: PGID;
    lang: Lang;
};
type GalleryFormDataQueryTemplate = ClientDataQueryTemplate<
    GalleryFormSearchParams,
    GalleryFormRawData,
    GalleryFormRawData,
    GalleryFormAdapter,
    QueryListParam,
    GalleryFormLoaderData
>;
const defaultEmptyData: GalleryFormModel = { GalleryId: "", _GalleryInfo: [], _GalleryPhotos: [] };
// #endregion

// #region Public
/** 共用：依目前 feature 組出 loader / hook 共用參數 */
export const buildGalleryFormLoaderArgs = (p: { lang: Lang; internalId: string; queryParam?: QueryListParam; }): GalleryFormLoaderArgs =>
{
    const safeInternalId = LibText.safeTrim(p.internalId);
    const condition = buildGalleryFormCondition(safeInternalId);
    const queryParam = p.queryParam ?? buildGalleryFormQueryParam({ condition });
    return { internalId: safeInternalId, progId: PGID.Gallery, lang: p.lang, queryParam };
};
/** SSR Loader：改以 QueryList 預載 Gallery Form 單筆資料 */
export const Client_Gallery_Form_Loader = (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<GalleryFormLoaderData> =>
{
    const internalId = LibText.safeTrim(params?.internalId);
    const ssrApi = getSsrApi(request);
    const adapter = { Gallery: GalleryAdapter(ssrApi), Category: CategoryAdapter(ssrApi), Tag: TagAdapter(ssrApi) };
    const queryState = buildGalleryFormQueryState({ lang: p.lang, internalId, emptyData: defaultEmptyData });
    const args = buildGalleryFormLoaderArgs({ lang: p.lang, internalId, queryParam: queryState.queryParam });
    if (!internalId)
    {
        return { args, res: { listRes: [], categoryMap: {}, tagMap: {} } };
    }
    const listLoader = adapter.Gallery.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const [listLD, cateLD, tagLD] = await Promise.all([listLoader({ request, params } as LoaderFunctionArgs), cateLoader({ request, params } as LoaderFunctionArgs), tagLoader({ request, params } as LoaderFunctionArgs)]);
    const listRes = listLD.apiRes.Data ?? [];
    return { args, res: { listRes, categoryMap: cateLD.apiRes.Data ?? {}, tagMap: tagLD.apiRes.Data ?? {} } };
};
/** CSR Hook：新版 Form 入口，資料查詢流程交給 Client_DataQueryTemplate */
export const useGalleryFormData = (opt: { lang: Lang; internalId: string; emptyData?: GalleryFormModel; }): GalleryFormFetchDataResult =>
{
    const fallbackData = opt.emptyData ?? defaultEmptyData;
    const templateVm = useGalleryFormTemplate({ lang: opt.lang, internalId: opt.internalId, emptyData: fallbackData });
    const errorList = templateVm.errorList;
    return { ...templateVm.viewModel, isLoading: templateVm.isLoading, errorText: errorList[0] ?? null, errorList, refetchData: templateVm.refetchData, refetchRefData: templateVm.refetchRefData };
};

/** CSR Hook：保留舊入口相容尚未調整的客製覆寫 */
export const useGalleryFormFetchData = (p: { lang: Lang; emptyData?: GalleryFormModel; }): GalleryFormFetchDataResult =>
{
    const { internalId: routeInternalId } = useParams();
    const internalId = LibText.safeTrim(routeInternalId);
    return useGalleryFormData({ lang: p.lang, internalId, emptyData: p.emptyData });
};
// #endregion

// #region Private

/** 組出給 hydration 用的 initial 格式 */
/** 比對目前參數與 loader 參數是否一致 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);
    if (currentKey !== initialKey) return null;
    return buildClientLoaderInitial(initialArgs, initialData);
};
/** 建立 Gallery Form 查詢條件 */
const buildGalleryFormCondition = (internalId: string): string =>
{
    const condition = LibCondition.joinConditions([LibCondition.createCondition(GalleryFields.InternalId, Operator.Equal, LibText.safeTrim(internalId))]);
    return condition || "1=0";
};
/** 建立 Gallery Form QueryList 欄位清單 */
const buildGalleryFormFields = (): string[] =>
{
    const photoInfoPrefix = `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields._GalleryPhotosInfo}`;
    return [
        GalleryFields.InternalId,
        GalleryFields.GalleryId,
        GalleryFields.Categories,
        GalleryFields.Tags,
        GalleryFields.CoverPicSrcId,
        GalleryFields.Validate_Start,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.GalleryId}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.RowId}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.RowNo}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Content}`,
        `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.GalleryId}`,
        `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.RowId}`,
        `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.RowNo}`,
        `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.PicSrcId}`,
        `${GalleryFields._GalleryPhotos}.${GalleryPhotosFields.Sort}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.GalleryId}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.ParentRowId}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.RowId}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.RowNo}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.Lang}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.Title}`,
        `${photoInfoPrefix}.${GalleryPhotosInfoFields.Description}`,
    ];
};
/** 建立 Gallery Form QueryListParam，Form 固定只查單筆 */
const buildGalleryFormQueryParam = (p: { condition: string; }): QueryListParam =>
{
    return { Fields: buildGalleryFormFields(), Condition: p.condition, PageNumber: 1, PageSize: 1 };
};
/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (p: { loaderData: GalleryFormLoaderData | null; queryParam: QueryListParam; fallbackData: GalleryFormModel; }): ApiLoaderData<QueryListParam, GalleryFormModel[]> | null =>
{
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;
    return buildClientLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};
/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: GalleryFormLoaderData | null; args: GalleryFormLoaderArgs; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};
/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagInitial = (p: { loaderData: GalleryFormLoaderData | null; args: GalleryFormLoaderArgs; }): TagMapLoaderData | null =>
{
    if (!p.loaderData) return null;
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.tagMap ?? {},
    );
};
/** 建立 Gallery Form 初始 ViewState */
const buildGalleryFormInitialViewState = (): IListViewState =>
{
    return { pageNumber: 1, pageSize: 1 } as IListViewState;
};
/** 建立 Gallery Form Template 查詢參數 */
const buildGalleryFormSearchParams = (p: { lang: Lang; internalId: string; }): GalleryFormSearchParams =>
{
    return { internalId: LibText.safeTrim(p.internalId), progId: PGID.Gallery, lang: p.lang };
};
/** 建立 Gallery Form DataQueryTemplate */
const createGalleryFormDataQueryTemplate = (p: { lang: Lang; internalId: string; emptyData: GalleryFormModel; }): GalleryFormDataQueryTemplate =>
{
    const initialViewState = buildGalleryFormInitialViewState();
    return {
        featureKey: "GalleryForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildGalleryFormSearchParams({ lang: p.lang, internalId: p.internalId }),
            buildSearchConditions: (ctx) => [buildGalleryFormCondition(ctx.searchParams.internalId)],
            buildQueryParam: (ctx) => buildGalleryFormQueryParam({ condition: ctx.searchCondition }),
            useDataSource: (ctx) => useGalleryFormDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData, lang: p.lang, internalId: ctx.searchParams.internalId, emptyData: p.emptyData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};
/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildGalleryFormQueryState = (p: { lang: Lang; internalId: string; emptyData: GalleryFormModel; }) =>
{
    const template = createGalleryFormDataQueryTemplate(p);
    return buildClientDataQueryState(template, {} as SearchValues, buildGalleryFormInitialViewState());
};
/** Gallery Form DataSource：統一處理 QueryList 單筆資料、分類與標籤 map */
const useGalleryFormDataSource = (p: { queryParam: QueryListParam; loaderData: GalleryFormLoaderData | null; lang: Lang; internalId: string; emptyData: GalleryFormModel; }): ClientDataQueryDataSourceResult<GalleryFormRawData, GalleryFormAdapter> =>
{
    const adapter = useMemo<GalleryFormAdapter>(() => ({ Gallery: GalleryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() }), []);
    const currentArgs = useMemo(() => buildGalleryFormLoaderArgs({ lang: p.lang, internalId: p.internalId, queryParam: p.queryParam }), [p.lang, p.internalId, p.queryParam]);
    const listInitial = useMemo(() => buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData }), [p.loaderData, p.queryParam, p.emptyData]);
    const cateInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const tagInitial = useMemo(() => buildTagInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);
    /** 主資料：前台 Form 統一改用 QueryList 查單筆 */
    const useData = adapter.Gallery.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });
    const useCategory = adapter.Category.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: cateInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const useTag = adapter.Tag.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: tagInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const data = useMemo<GalleryFormModel>(() => useData.data?.[0] ?? p.emptyData, [useData.data, p.emptyData]);
    const title = useMemo(() => LibText.findTextByKey(data._GalleryInfo, (item) => LibText.safeTrim(item?.Lang).toLowerCase(), LibText.safeTrim(p.lang).toLowerCase(), (item) => item?.Title), [data, p.lang]);
    const errors = useMemo(() => [useData.errorText, useCategory.errorText, useTag.errorText], [useData.errorText, useCategory.errorText, useTag.errorText]);
    const rawData = useMemo<GalleryFormRawData>(() => ({ internalId: currentArgs.internalId, data, title, categoryMap: useCategory.map ?? {}, tagMap: useTag.map ?? {}, args: currentArgs }), [currentArgs, data, title, useCategory.map, useTag.map]);
    const refetchData = useCallback(async (): Promise<void> => void (await Promise.resolve(useData.refetch())), [useData]);
    const refetchRefData = useCallback(async (): Promise<void> => void (await Promise.all([Promise.resolve(useCategory.refetch()), Promise.resolve(useTag.refetch())])), [useCategory, useTag]);
    return { adapter, rawData, isLoading: Boolean(useData.isLoading || useCategory.isLoading || useTag.isLoading), errors, paginator: null, refetchData, refetchRefData };
};
/** 內部共用：建立 Gallery Form Template VM */
const useGalleryFormTemplate = (opt: { lang: Lang; internalId: string; emptyData: GalleryFormModel; }) =>
{
    const template = useMemo(() => createGalleryFormDataQueryTemplate({ lang: opt.lang, internalId: opt.internalId, emptyData: opt.emptyData }), [opt.lang, opt.internalId, opt.emptyData]);
    return useClientDataQueryTemplate(template);
};
// #endregion
