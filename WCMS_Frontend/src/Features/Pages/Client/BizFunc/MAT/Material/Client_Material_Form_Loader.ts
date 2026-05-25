import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MatCategoryAdapter, type MatCateInfoFieldsLoaderData } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { MaterialFields, MaterialLangInfoFields, MaterialPictureFields, MaterialTagsFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialTags = components["schemas"]["MaterialTags_DTO"];
type MatCateInfoFieldsHydrateData = Array<[string, string]>;

// #region Property
export interface MaterialFormLoaderArgs
{
    internalId: string;
    progId: PGID;
    lang: Lang;
    queryParam: QueryListParam;
}

export interface MaterialFormLoaderRes
{
    listRes: MaterialSet[];
    dataRes: MaterialSet | null;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    matCateInfoFieldsMap: MatCateInfoFieldsHydrateData;
}

export interface MaterialFormLoaderData
{
    args: MaterialFormLoaderArgs;
    res: MaterialFormLoaderRes;
}

export type MaterialFormRawData = {
    formData: MaterialSet;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    matCateInfoFieldsMap: Map<string, string>;
    categoryNameText: string;
    tagNameText: string;
    args: MaterialFormLoaderArgs;
};

export type MaterialFormAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
};

export interface UseMaterialFormDataResult
{
    adapter?: MaterialFormAdapter;
    rawData: MaterialFormRawData;
    isLoading: boolean;
    errorList: string[];
    errors: string[];
    refetchData: () => Promise<void>;
    refetchRefData: () => Promise<void>;
}

type MaterialFormSearchParams = {
    internalId: string;
    lang: Lang;
};

type MaterialFormDataQueryTemplate = ClientDataQueryTemplate<
    MaterialFormSearchParams,
    MaterialFormRawData,
    MaterialFormRawData,
    MaterialFormAdapter,
    QueryListParam,
    MaterialFormLoaderData
>;
// #endregion

const defaultEmptyData: MaterialSet = { Material: {}, MaterialLangInfo: [], MaterialPicture: [], MaterialTags: [] };

// #region Shared Builder
/** 統一整理安全 internalId */
const getSafeInternalId = (value?: string): string =>
{
    // return
    return `${value ?? ""}`.trim();
};

/** 轉義 QueryList 條件中的雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // 宣告變數
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};

/** 建立 Material Form 查詢條件 */
const buildMaterialFormCondition = (internalId: string): string =>
{
    // 宣告變數
    const safeInternalId = escapeQueryValue(getSafeInternalId(internalId));
    if (!safeInternalId) return "1=0";

    // return
    return LibMerge(" And ", false, `${MaterialFields.InternalId} = "${safeInternalId}"`);
};

/** 建立 Material Form QueryList 欄位清單 */
const buildMaterialFormFields = (): string[] =>
{
    // return
    return [
        MaterialFields.InternalId,
        MaterialFields.MaterialId,
        MaterialFields.CategoryId,
        MaterialFields.Price,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialId}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.RowId}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Memo}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.MaterialId}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.RowId}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureId}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureName}`,
        `${MaterialFields._MaterialTags}.${MaterialTagsFields.MaterialId}`,
        `${MaterialFields._MaterialTags}.${MaterialTagsFields.RowId}`,
        `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId}`,
    ];
};

/** 建立 Material Form QueryListParam，Form 固定只查單筆 */
const buildMaterialFormQueryParam = (p: { internalId: string; }): QueryListParam =>
{
    // 宣告變數
    const condition = buildMaterialFormCondition(p.internalId);

    // return
    return { Fields: buildMaterialFormFields(), Condition: condition, PageNumber: 1, PageSize: 1 };
};

/** 共用：依目前 Material feature 組出 loader / hook 共用參數 */
export const buildMaterialFormLoaderArgs = (p: { lang: Lang; internalId: string; queryParam?: QueryListParam; }): MaterialFormLoaderArgs =>
{
    // 宣告變數
    const safeInternalId = getSafeInternalId(p.internalId);
    const queryParam = p.queryParam ?? buildMaterialFormQueryParam({ internalId: safeInternalId });

    // return
    return { internalId: safeInternalId, progId: PGID.Material, lang: p.lang, queryParam };
};

/** 建立主資料 list initial，避免 hydration 首次重抓 */
const buildListInitial = (
    p: { loaderData: MaterialFormLoaderData | null; queryParam: QueryListParam; fallbackData: MaterialSet; },
): ApiLoaderData<QueryListParam, MaterialSet[]> | null =>
{
    // 宣告變數
    const loaderParam = p.loaderData?.args?.queryParam;
    if (!loaderParam) return null;
    if (!isSameClientDataQueryParam(p.queryParam, loaderParam)) return null;

    // return
    return buildLoaderInitial(loaderParam, p.loaderData?.res.listRes ?? [p.fallbackData]);
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): CategoryMapLoaderData | null =>
{
    // 宣告變數
    if (!p.loaderData) return null;

    // return
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};

/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): TagMapLoaderData | null =>
{
    // 宣告變數
    if (!p.loaderData) return null;

    // return
    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.tagMap ?? {},
    );
};

/** 建立物件類別動態欄位 initial，避免 hydration 首次重抓 */
const buildMatCateInfoFieldsInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): MatCateInfoFieldsLoaderData | null =>
{
    // 宣告變數
    if (!p.loaderData) return null;
    const catId = `${p.loaderData.res.dataRes?.Material?.CategoryId ?? ""}`.trim();
    if (!catId) return null;

    // return
    return matchInitialArgs({ catId, lang: p.args.lang }, { catId, lang: p.loaderData.args.lang }, toStringMap(p.loaderData.res.matCateInfoFieldsMap));
};

/** 比對目前參數與 loader 參數是否一致 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    // 宣告變數
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);
    if (currentKey !== initialKey) return null;

    // return
    return buildLoaderInitial(initialArgs, initialData);
};

/** 建立 Material Form 初始 ViewState */
const buildMaterialFormInitialViewState = (): IListViewState =>
{
    // return
    return { pageNumber: 1, pageSize: 1 } as IListViewState;
};

/** 建立 Material Form Template 查詢參數 */
const buildMaterialFormSearchParams = (p: { lang: Lang; internalId: string; }): MaterialFormSearchParams =>
{
    // return
    return { internalId: getSafeInternalId(p.internalId), lang: p.lang };
};

/** 建立 Material Form DataQueryTemplate */
const createMaterialFormDataQueryTemplate = (p: { lang: Lang; internalId: string; emptyData: MaterialSet; }): MaterialFormDataQueryTemplate =>
{
    // 宣告變數
    const initialViewState = buildMaterialFormInitialViewState();

    // return
    return {
        featureKey: "MaterialForm",
        dataMode: "single",
        initialSearchValues: {},
        initialViewState,
        pagination: null,
        searchBar: null,
        feature: {
            toSearchParams: () => buildMaterialFormSearchParams({ lang: p.lang, internalId: p.internalId }),
            buildSearchConditions: (ctx) => [buildMaterialFormCondition(ctx.searchParams.internalId)],
            buildQueryParam: (ctx) => buildMaterialFormQueryParam({ internalId: ctx.searchParams.internalId }),
            useDataSource: (ctx) => useMaterialFormDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData, lang: p.lang, internalId: ctx.searchParams.internalId, emptyData: p.emptyData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};

/** 建立 Loader 與 Hook 共用的 Query 狀態 */
const buildMaterialFormQueryState = (p: { lang: Lang; internalId: string; emptyData: MaterialSet; }) =>
{
    // 宣告變數
    const template = createMaterialFormDataQueryTemplate(p);

    // return
    return buildClientDataQueryState(template, {} as SearchValues, buildMaterialFormInitialViewState());
};
// #endregion

// #region SSR Loader
/** SSR Loader：改以 QueryList 預載 Material Form 單筆資料 */
export const Client_Material_Form_Loader = (props: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<MaterialFormLoaderData> =>
{
    // 宣告變數
    const internalId = getSafeInternalId(params?.internalId);
    const ssrApi = getSsrApi(request);
    const adapter = { Material: MaterialAdapter(ssrApi), Category: CategoryAdapter(ssrApi), Tag: TagAdapter(ssrApi), MatCategory: MatCategoryAdapter(ssrApi) };
    const queryState = buildMaterialFormQueryState({ lang: props.lang, internalId, emptyData: defaultEmptyData });
    const args = buildMaterialFormLoaderArgs({ lang: props.lang, internalId, queryParam: queryState.queryParam });

    // 執行 function：SSR 首屏資料
    const listLoader = adapter.Material.loader.createQueryListLoader({ getCondition: () => args.queryParam, getApiInstance: () => ssrApi });
    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const [listLD, cateLD, tagLD] = await Promise.all([listLoader({ request, params } as LoaderFunctionArgs), cateLoader({ request, params } as LoaderFunctionArgs), tagLoader({ request, params } as LoaderFunctionArgs)]);
    const listRes = listLD.apiRes.Data ?? [];
    const dataRes = listRes[0] ?? null;
    const catId = `${dataRes?.Material?.CategoryId ?? ""}`.trim();
    const matCateInfoFieldsLD = catId ? await adapter.MatCategory.loader.createMatCateInfoFieldsLoader({ catId, lang: args.lang, getApiInstance: () => ssrApi })({ request, params } as LoaderFunctionArgs) : null;

    // return
    return { args, res: { listRes, dataRes, categoryMap: cateLD.apiRes.Data ?? {}, tagMap: tagLD.apiRes.Data ?? {}, matCateInfoFieldsMap: mapToEntries(matCateInfoFieldsLD?.apiRes.Data) } };
};
// #endregion

// #region CSR DataSource
/** Material Form DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useMaterialFormDataSource = (
    p: { queryParam: QueryListParam; loaderData: MaterialFormLoaderData | null; lang: Lang; internalId: string; emptyData: MaterialSet; },
): ClientDataQueryDataSourceResult<MaterialFormRawData, MaterialFormAdapter> =>
{
    // 宣告變數
    const adapter = useMemo<MaterialFormAdapter>(() => ({ Material: MaterialAdapter(), Category: CategoryAdapter(), Tag: TagAdapter(), MatCategory: MatCategoryAdapter() }), []);
    const currentArgs = useMemo(() => buildMaterialFormLoaderArgs({ lang: p.lang, internalId: p.internalId, queryParam: p.queryParam }), [p.lang, p.internalId, p.queryParam]);
    const listInitial = useMemo(() => buildListInitial({ loaderData: p.loaderData, queryParam: p.queryParam, fallbackData: p.emptyData }), [p.loaderData, p.queryParam, p.emptyData]);
    const cateInitial = useMemo(() => buildCategoryInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const tagInitial = useMemo(() => buildTagInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const matCateInfoFieldsInitial = useMemo(() => buildMatCateInfoFieldsInitial({ loaderData: p.loaderData, args: currentArgs }), [p.loaderData, currentArgs]);
    const queryKey = useMemo(() => buildClientDataQueryKey(p.queryParam), [p.queryParam]);

    // 執行 function：CSR / Hydration 共用查詢
    const useData = adapter.Material.hooks.useQueryList({ condition: p.queryParam, initial: listInitial, deps: [queryKey] });
    const useCategory = adapter.Category.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: cateInitial, deps: [currentArgs.progId, currentArgs.lang] });
    const useTag = adapter.Tag.hooks.useMapByProgId({ progId: currentArgs.progId, lang: currentArgs.lang, initial: tagInitial, deps: [currentArgs.progId, currentArgs.lang] });

    const formData = useMemo<MaterialSet>(() => useData.data?.[0] ?? p.emptyData, [useData.data, p.emptyData]);
    const useMatCateInfoFields = adapter.MatCategory.hooks.useMatCateInfoFields({
        catId: formData.Material?.CategoryId,
        lang: currentArgs.lang,
        initial: matCateInfoFieldsInitial ? toStringMap(matCateInfoFieldsInitial.apiRes.Data) : null,
        deps: [formData.Material?.CategoryId ?? "", currentArgs.lang],
    });

    const categoryNameText = useMemo(() => getNameTextByMap(formData.Material?.CategoryId, useCategory.map ?? {}), [formData.Material?.CategoryId, useCategory.map]);
    const tagNameText = useMemo(() => buildNameTextByMap(formData.MaterialTags, useTag.map ?? {}), [formData.MaterialTags, useTag.map]);

    const rawData = useMemo<MaterialFormRawData>(() =>
    {
        // return
        return { formData, categoryMap: useCategory.map ?? {}, tagMap: useTag.map ?? {}, matCateInfoFieldsMap: toStringMap(useMatCateInfoFields.map), categoryNameText, tagNameText, args: currentArgs };
    }, [formData, useCategory.map, useTag.map, useMatCateInfoFields.map, categoryNameText, tagNameText, currentArgs]);

    const errors = useMemo(() =>
    {
        // return
        return [useData.errorText, useCategory.errorText, useTag.errorText, useMatCateInfoFields.errorText].filter((p): p is string => Boolean(p));
    }, [useData.errorText, useCategory.errorText, useTag.errorText, useMatCateInfoFields.errorText]);

    const refetchData = useCallback(async () =>
    {
        // 執行 function：重抓主資料
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：重抓參考資料
        await Promise.all([Promise.resolve(useCategory.refetch()), Promise.resolve(useTag.refetch()), Promise.resolve(useMatCateInfoFields.refetch())]);
    }, [useCategory, useTag, useMatCateInfoFields]);

    // return
    return { adapter, rawData, isLoading: Boolean(useData.isLoading || useCategory.isLoading || useTag.isLoading || useMatCateInfoFields.isLoading), errors, paginator: null, refetchData, refetchRefData };
};
// #endregion

// #region Public Hook
/** CSR Hook：Feature 版 MaterialForm 走 Client_DataQueryTemplate，不顯示 SearchBar / Paginator */
export const useMaterialFormData = (opt: { lang: Lang; internalId: string; emptyData?: MaterialSet; }): UseMaterialFormDataResult =>
{
    // 宣告變數
    const emptyData = opt.emptyData ?? defaultEmptyData;
    const template = useMemo(() => createMaterialFormDataQueryTemplate({ lang: opt.lang, internalId: opt.internalId, emptyData }), [opt.lang, opt.internalId, emptyData]);
    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { adapter: templateVm.adapter, rawData: templateVm.viewModel, isLoading: templateVm.isLoading, errorList: templateVm.errorList, errors: templateVm.errorList, refetchData: templateVm.refetchData, refetchRefData: templateVm.refetchRefData };
};

/** 舊入口保留給尚未改版的 Spec 使用，Feature 新版請改用 useMaterialFormData */
export const useMaterialFormFetchData = (opt: { lang: Lang; internalId: string; emptyData: MaterialSet; }): UseFetchDataResult<MaterialFormRawData, MaterialFormAdapter> =>
{
    // 宣告變數
    const loaderData = useLoaderData() as MaterialFormLoaderData | null;
    const queryState = useMemo(() => buildMaterialFormQueryState({ lang: opt.lang, internalId: opt.internalId, emptyData: opt.emptyData }), [opt.lang, opt.internalId, opt.emptyData]);
    const dataSource = useMaterialFormDataSource({ queryParam: queryState.queryParam, loaderData, lang: opt.lang, internalId: opt.internalId, emptyData: opt.emptyData });

    const refetchData = useCallback(async () =>
    {
        // 執行 function：轉接舊入口主資料重抓
        await dataSource.refetchData?.();
    }, [dataSource]);

    const refetchRefData = useCallback(async () =>
    {
        // 執行 function：轉接舊入口參考資料重抓
        await dataSource.refetchRefData?.();
    }, [dataSource]);

    // return
    return { adapter: dataSource.adapter as MaterialFormAdapter, rawData: dataSource.rawData, isLoading: dataSource.isLoading, errors: dataSource.errors as string[], refetchData, refetchRefData };
};
// #endregion

// #region Private Helper
/** 將 tag 清單依 map 轉成顯示文字 */
const buildNameTextByMap = (tags: MaterialTags[] | null | undefined, map: Record<string, string>): string =>
{
    // return
    return (tags ?? []).map(p => `${p.TagId ?? ""}`.trim()).filter(Boolean).map(id => map[id] ?? "").filter(Boolean).join("、");
};

/** 依單一 id 從 map 取得顯示名稱 */
const getNameTextByMap = (id: string | null | undefined, map: Record<string, string>): string =>
{
    // 宣告變數
    const safeId = `${id ?? ""}`.trim();
    if (!safeId) return "";

    // return
    return map[safeId] ?? "";
};

/** 將 Map 轉成可 hydration 的 entries */
const mapToEntries = (value: Map<string, string> | Record<string, string> | null | undefined): MatCateInfoFieldsHydrateData =>
{
    // return
    if (!value) return [];
    if (value instanceof Map) return Array.from(value.entries());
    return Object.entries(value);
};

/** 將 SSR/CSR 資料統一轉成 Map */
const toStringMap = (value: Map<string, string> | Record<string, string> | MatCateInfoFieldsHydrateData | null | undefined): Map<string, string> =>
{
    // return
    if (!value) return new Map<string, string>();
    if (value instanceof Map) return value;
    if (Array.isArray(value)) return new Map<string, string>(value);
    return new Map<string, string>(Object.entries(value));
};
// #endregion
