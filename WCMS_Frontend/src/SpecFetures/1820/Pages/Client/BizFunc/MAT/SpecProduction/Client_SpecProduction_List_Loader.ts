import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    buildClientLoaderInitial,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { Module_SpecProduction_OptionsJson } from "@/SpecFetures/1820/Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import {
    MaterialFields,
    MaterialLangInfoFields,
    MaterialPictureFields,
    MaterialTagsFields,
    PageManagementDetailFields,
    PageManagementFields,
    PGID,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialFormModel = components["schemas"]["Material"];
type PageManagementFormModel = components["schemas"]["PageManagement"];

export interface SpecProductionInfoField
{
    field: string;
    label: string;
}

export interface SpecProductionGroup
{
    tagId: string;
    tagName: string;
    items: MaterialFormModel[];
}

interface SpecProductionListLoaderArgs
{
    lang: Lang;
    categoryId: string;
    tagIds: string;
    pageId: string;
    materialParam: QueryListParam;
    pageParam: QueryListParam;
}

interface SpecProductionListLoaderRes
{
    materialList: MaterialFormModel[];
    pageList: PageManagementFormModel[];
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    infoFields: SpecProductionInfoField[];
}

interface SpecProductionListLoaderData
{
    args: SpecProductionListLoaderArgs;
    res: SpecProductionListLoaderRes;
}

interface SpecProductionListRawData
{
    pageContent: string;
    catName: string;
    groups: SpecProductionGroup[];
    infoFields: SpecProductionInfoField[];
}

interface UseSpecProductionListFetchDataResult
{
    rawData: SpecProductionListRawData;
    isLoading: boolean;
    errorList: string[];
}

interface SpecProductionListQueryParam
{
    materialParam: QueryListParam;
    pageParam: QueryListParam;
}

interface SpecProductionListSearchParams
{
    lang: Lang;
    categoryId: string;
    tagIds: string;
    pageId: string;
}

type SpecProductionListAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    Page: ReturnType<typeof PageManagementAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
};

type SpecProductionListTemplate = ClientDataQueryTemplate<
    SpecProductionListSearchParams,
    SpecProductionListRawData,
    SpecProductionListRawData,
    SpecProductionListAdapter,
    SpecProductionListQueryParam,
    SpecProductionListLoaderData
>;

type SpecProductionListDataSourceContext = Parameters<NonNullable<NonNullable<SpecProductionListTemplate["spec"]>["useDataSource"]>>[0];
const EMPTY_MATERIAL_QUERY: QueryListParam = { Fields: [MaterialFields.InternalId], Condition: "1 = 0", PageNumber: 0, PageSize: 0 };
const EMPTY_PAGE_QUERY: QueryListParam = { Fields: [PageManagementFields.InternalId], Condition: "1 = 0", PageNumber: 0, PageSize: 0 };
// #endregion

// #region Public
/** 前台情境圖文導覽 SSR Loader。 */
export const Client_SpecProduction_List_Loader = (props: { lang: Lang; opts?: Module_SpecProduction_OptionsJson; }) => async (args: LoaderFunctionArgs): Promise<SpecProductionListLoaderData> =>
{
    const queryState = buildSpecProductionListQueryState({ lang: props.lang, options: props.opts });
    const loaderArgs = buildLoaderArgs(queryState.searchParams, queryState.queryParam);
    const adapter = buildAdapter(getSsrApi(args.request));
    return await loadSpecProductionData(adapter, loaderArgs, args);
};

/** 前台情境圖文導覽 Hook。 */
export const useClientSpecProductionListFetchData = (
    props: { lang: Lang; options?: Module_SpecProduction_OptionsJson; },
): UseSpecProductionListFetchDataResult =>
{
    const template = useMemo(() => createSpecProductionListDataQueryTemplate({ lang: props.lang, options: props.options }), [props.lang, props.options]);
    const templateVm = useClientDataQueryTemplate(template);

    return { rawData: templateVm.viewModel, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
// #endregion

// #region Private
/** 建立 SSR 與 CSR 共用 Adapter。 */
const buildAdapter = (apiInstance?: Parameters<typeof MaterialAdapter>[0]): SpecProductionListAdapter =>
{
    return {
        Material: MaterialAdapter(apiInstance),
        Page: PageManagementAdapter(apiInstance),
        Category: CategoryAdapter(apiInstance),
        Tag: TagAdapter(apiInstance),
        MatCategory: MatCategoryAdapter(apiInstance),
    };
};

/** 執行 SSR 主資料與參照資料查詢。 */
const loadSpecProductionData = async (
    adapter: SpecProductionListAdapter,
    loaderArgs: SpecProductionListLoaderArgs,
    routeArgs: LoaderFunctionArgs,
): Promise<SpecProductionListLoaderData> =>
{
    const materialLoader = adapter.Material.loader.createQueryListLoader({ getCondition: () => loaderArgs.materialParam });
    const pageLoader = adapter.Page.loader.createQueryListLoader({ getCondition: () => loaderArgs.pageParam });
    const categoryLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: loaderArgs.lang });
    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: PGID.Material, lang: loaderArgs.lang });
    const infoFieldLoader = adapter.MatCategory.loader.createMatCateInfoFieldsLoader({ catId: loaderArgs.categoryId, lang: loaderArgs.lang });
    const [materialLD, pageLD, categoryLD, tagLD, infoFieldLD] = await Promise.all([
        materialLoader(routeArgs),
        pageLoader(routeArgs),
        categoryLoader(routeArgs),
        tagLoader(routeArgs),
        infoFieldLoader(routeArgs),
    ]);

    return {
        args: loaderArgs,
        res: {
            materialList: materialLD.apiRes.Data ?? [],
            pageList: pageLD.apiRes.Data ?? [],
            categoryMap: categoryLD.apiRes.Data ?? {},
            tagMap: tagLD.apiRes.Data ?? {},
            infoFields: mapToInfoFields(infoFieldLD.apiRes.Data),
        },
    };
};

/** 建立 Loader 參數。 */
const buildLoaderArgs = (searchParams: SpecProductionListSearchParams, queryParam: SpecProductionListQueryParam): SpecProductionListLoaderArgs =>
{
    return { ...searchParams, materialParam: queryParam.materialParam, pageParam: queryParam.pageParam };
};

/** 建立 Material 查詢參數。 */
const buildMaterialParam = (p: SpecProductionListSearchParams): QueryListParam =>
{
    if (!p.categoryId || !p.tagIds) return EMPTY_MATERIAL_QUERY;
    return {
        Fields: buildMaterialFields(),
        Condition: buildMaterialCondition(p),
        OrderBy: [{ Col: MaterialFields.CreateTime, Desc: true }],
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 建立 Material 查詢欄位。 */
const buildMaterialFields = (): string[] =>
{
    return [
        MaterialFields.InternalId,
        MaterialFields.MaterialId,
        MaterialFields.CategoryId,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.RowNo}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureId}`,
        `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureName}`,
        `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId}`,
    ];
};

/** 建立 Material 固定條件。 */
const buildMaterialCondition = (p: SpecProductionListSearchParams): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(MaterialFields.CategoryId, Operator.Equal, p.categoryId),
        LibCondition.createCondition(`${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId}`, Operator.In, p.tagIds),
        LibCondition.createCondition(`${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`, Operator.Equal, p.lang),
    ]);
};

/** 建立介紹頁面查詢參數。 */
const buildPageParam = (p: SpecProductionListSearchParams): QueryListParam =>
{
    if (!p.pageId) return EMPTY_PAGE_QUERY;
    return {
        Fields: [
            PageManagementFields.PageId,
            PageManagementFields.InternalId,
            `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
            `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Content}`,
        ],
        Condition: buildPageCondition(p),
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 建立介紹頁面查詢條件。 */
const buildPageCondition = (p: SpecProductionListSearchParams): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(PageManagementFields.InternalId, Operator.Equal, p.pageId),
        LibCondition.createCondition(`${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`, Operator.Equal, p.lang),
    ]);
};

/** 依設定順序建立 Tag 分組。 */
const groupMaterialByTag = (list: MaterialFormModel[], tagIds: string, tagMap: Record<string, string>): SpecProductionGroup[] =>
{
    const groups = buildGroupMap(tagIds, tagMap);
    list.forEach(item => appendMaterialToGroups(groups, item));
    return Array.from(groups.values()).filter(group => group.items.length > 0);
};

/** 建立選定 Tag 的分組 Map。 */
const buildGroupMap = (tagIds: string, tagMap: Record<string, string>): Map<string, SpecProductionGroup & { keys: Set<string>; }> =>
{
    const groups = new Map<string, SpecProductionGroup & { keys: Set<string>; }>();
    splitCsv(tagIds).forEach(tagId => groups.set(tagId, { tagId, tagName: tagMap[tagId] ?? tagId, items: [], keys: new Set<string>() }));
    return groups;
};

/** 將單筆 Material 加入所屬 Tag。 */
const appendMaterialToGroups = (groups: Map<string, SpecProductionGroup & { keys: Set<string>; }>, item: MaterialFormModel): void =>
{
    const materialKey = LibText.safeTrim(item.InternalId ?? item.MaterialId);
    (item._MaterialTags ?? []).forEach(tag => appendMaterialToGroup(groups.get(LibText.safeTrim(tag.TagId)), item, materialKey));
};

/** 將 Material 加入單一分組並避免重複。 */
const appendMaterialToGroup = (group: (SpecProductionGroup & { keys: Set<string>; }) | undefined, item: MaterialFormModel, materialKey: string): void =>
{
    if (!group || (materialKey && group.keys.has(materialKey))) return;
    group.items.push(item);
    if (materialKey) group.keys.add(materialKey);
};

/** 取得介紹頁面內容。 */
const getPageContent = (list: PageManagementFormModel[], lang: Lang): string =>
{
    const detail = list[0]?._PageManagementDetail?.find(item => item.Lang === lang) ?? list[0]?._PageManagementDetail?.[0];
    return detail?.Content ?? "";
};

/** 建立前台畫面資料。 */
const buildRawData = (p: SpecProductionListLoaderRes & SpecProductionListSearchParams): SpecProductionListRawData =>
{
    return {
        pageContent: getPageContent(p.pageList, p.lang),
        catName: p.categoryMap[p.categoryId] ?? "",
        groups: groupMaterialByTag(p.materialList, p.tagIds, p.tagMap),
        infoFields: p.infoFields,
    };
};

/** 建立 Loader 與 Hook 共用查詢狀態。 */
const buildSpecProductionListQueryState = (p: { lang: Lang; options?: Module_SpecProduction_OptionsJson; }) =>
{
    const template = createSpecProductionListDataQueryTemplate(p);
    const viewState: IListViewState = { pageNumber: 1, pageSize: 0 };
    return buildClientDataQueryState(template, {} as SearchValues, viewState);
};

/** 建立 SpecProduction List DataQuery Template。 */
const createSpecProductionListDataQueryTemplate = (p: { lang: Lang; options?: Module_SpecProduction_OptionsJson; }): SpecProductionListTemplate =>
{
    return {
        featureKey: "Spec1820.SpecProduction.List",
        dataMode: "multiple",
        initialSearchValues: {},
        initialViewState: { pageNumber: 1, pageSize: 0 },
        pagination: null,
        searchBar: null,
        spec: {
            toSearchParams: () => normalizeSearchParams(p),
            buildQueryParam: ({ searchParams }) => ({ materialParam: buildMaterialParam(searchParams), pageParam: buildPageParam(searchParams) }),
            useDataSource: ctx => useSpecProductionListDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};

/** 正規化 SiteMenu ModuleOptions。 */
const normalizeSearchParams = (p: { lang: Lang; options?: Module_SpecProduction_OptionsJson; }): SpecProductionListSearchParams =>
{
    return {
        lang: p.lang,
        categoryId: LibText.safeTrim(p.options?.CategoryId),
        tagIds: splitCsv(p.options?.TagIds).join(","),
        pageId: LibText.safeTrim(p.options?.PageId),
    };
};

/** DataSource：接回 FormModel、參照 Map 與 SSR initial。 */
const useSpecProductionListDataSource = (
    ctx: SpecProductionListDataSourceContext,
): ClientDataQueryDataSourceResult<SpecProductionListRawData, SpecProductionListAdapter> =>
{
    const adapter = useMemo<SpecProductionListAdapter>(() => buildAdapter(), []);
    const initial = useSpecProductionInitial(ctx);
    const material = adapter.Material.hooks.useQueryList({ condition: ctx.queryParam.materialParam, initial: initial.material, deps: [initial.materialKey] });
    const page = adapter.Page.hooks.useQueryList({ condition: ctx.queryParam.pageParam, initial: initial.page, deps: [initial.pageKey] });
    const category = adapter.Category.hooks.useMapByProgId({ progId: PGID.Material, lang: ctx.searchParams.lang, initial: initial.category });
    const tag = adapter.Tag.hooks.useMapByProgId({ progId: PGID.Material, lang: ctx.searchParams.lang, initial: initial.tag });
    const infoFields = adapter.MatCategory.hooks.useMatCateInfoFields({ catId: ctx.searchParams.categoryId, lang: ctx.searchParams.lang, initial: initial.infoFields });
    const rawData = useMemo(() =>
    {
        return buildRawData({
            ...ctx.searchParams,
            materialList: material.data ?? [],
            pageList: page.data ?? [],
            categoryMap: category.map,
            tagMap: tag.map,
            infoFields: mapToInfoFields(infoFields.map),
        });
    }, [ctx.searchParams, material.data, page.data, category.map, tag.map, infoFields.map]);
    const refetchData = useCallback(async () =>
    {
        await Promise.all([material.refetch(), page.refetch()]);
    }, [material.refetch, page.refetch]);
    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([category.refetch(), tag.refetch(), infoFields.refetch()]);
    }, [category.refetch, tag.refetch, infoFields.refetch]);

    return {
        adapter,
        rawData,
        isLoading: Boolean(material.isLoading || page.isLoading || category.isLoading || tag.isLoading || infoFields.isLoading),
        errors: [material.errorText, page.errorText, category.errorText, tag.errorText, infoFields.errorText],
        paginator: null,
        refetchData,
        refetchRefData,
    };
};

/** 建立各 Hook 可沿用的 SSR initial。 */
const useSpecProductionInitial = (ctx: SpecProductionListDataSourceContext) =>
{
    const loaderData = ctx.loaderData;
    const materialKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam.materialParam), [ctx.queryParam.materialParam]);
    const pageKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam.pageParam), [ctx.queryParam.pageParam]);
    const material = useMemo(() => buildListInitial<MaterialFormModel>(loaderData, ctx.queryParam.materialParam, "materialList"), [loaderData, materialKey]);
    const page = useMemo(() => buildListInitial<PageManagementFormModel>(loaderData, ctx.queryParam.pageParam, "pageList"), [loaderData, pageKey]);
    const category = useMemo(() => buildCategoryInitial(loaderData, ctx.searchParams), [loaderData, ctx.searchParams.lang]);
    const tag = useMemo(() => buildTagInitial(loaderData, ctx.searchParams), [loaderData, ctx.searchParams.lang]);
    const infoFields = useMemo(() => buildInfoFieldInitial(loaderData, ctx.searchParams), [loaderData, ctx.searchParams.categoryId, ctx.searchParams.lang]);
    return { material, page, category, tag, infoFields, materialKey, pageKey };
};

/** 建立 QueryList initial。 */
const buildListInitial = <T>(loaderData: SpecProductionListLoaderData | null, query: QueryListParam, key: "materialList" | "pageList"): ApiLoaderData<QueryListParam, T[]> | null =>
{
    const initialQuery = key === "materialList" ? loaderData?.args.materialParam : loaderData?.args.pageParam;
    if (!initialQuery || !isSameClientDataQueryParam(query, initialQuery)) return null;
    return buildClientLoaderInitial(initialQuery, (loaderData?.res[key] ?? []) as T[]);
};

/** 建立 Category Map initial。 */
const buildCategoryInitial = (loaderData: SpecProductionListLoaderData | null, search: SpecProductionListSearchParams): CategoryMapLoaderData | null =>
{
    if (!isSameLoaderSearch(loaderData, search)) return null;
    return buildClientLoaderInitial({ progId: PGID.Material, lang: search.lang, pageSize: undefined }, loaderData?.res.categoryMap ?? {});
};

/** 建立 Tag Map initial。 */
const buildTagInitial = (loaderData: SpecProductionListLoaderData | null, search: SpecProductionListSearchParams): TagMapLoaderData | null =>
{
    if (!isSameLoaderSearch(loaderData, search)) return null;
    return buildClientLoaderInitial({ progId: PGID.Material, lang: search.lang, pageSize: undefined }, loaderData?.res.tagMap ?? {});
};

/** 建立動態欄位 initial。 */
const buildInfoFieldInitial = (loaderData: SpecProductionListLoaderData | null, search: SpecProductionListSearchParams): Map<string, string> | null =>
{
    if (!isSameLoaderSearch(loaderData, search)) return null;
    if (loaderData?.args.categoryId !== search.categoryId) return null;
    return new Map((loaderData?.res.infoFields ?? []).map(item => [item.field, item.label]));
};

/** 確認 SSR Loader 與目前語系設定一致。 */
const isSameLoaderSearch = (loaderData: SpecProductionListLoaderData | null, search: SpecProductionListSearchParams): boolean =>
{
    return loaderData?.args.lang === search.lang;
};

/** 將 Map 轉成可序列化欄位清單。 */
const mapToInfoFields = (source?: Map<string, string> | null): SpecProductionInfoField[] =>
{
    return Array.from(source ?? new Map<string, string>()).map(([field, label]) => ({ field, label }));
};

/** 解析 CSV 並去除重複值。 */
const splitCsv = (value?: string | null): string[] =>
{
    return Array.from(new Set((value ?? "").split(",").map(item => item.trim()).filter(Boolean)));
};
// #endregion
