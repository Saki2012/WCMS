import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    useClientDataQueryTemplate,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import type { Module_SpecProduction_OptionsJson } from "@/SpecFetures/1820/Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    CategoryDetailFields,
    CategoryFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    MaterialFields,
    MaterialLangInfoFields,
    MaterialPictureFields,
    MaterialTagsFields,
    PageManagementDetailFields,
    PageManagementFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

import { findTextByKey } from "@/SysCore/Utils/Library/LibData";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type MaterialSet = components["schemas"]["MaterialSet_DTO"];

type MaterialTag = components["schemas"]["MaterialTags_DTO"];

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];


const EMPTY_QUERY: QueryListParam = { Fields: [], Condition: "1 = 0", PageNumber: 1, PageSize: 1 };


interface SpecProductionListLoaderArgs
{
    lang: Lang;
    opt?: Module_SpecProduction_OptionsJson;
    baseParam: QueryListParam | null;
    pageParam: QueryListParam;
}


interface SpecProductionListRawData
{
    pageContent: string;
    catName: string;
    prodData: Map<MaterialTag, MaterialSet[]>;
}


interface SpecProductionListLoaderData
{
    args: SpecProductionListLoaderArgs;
    res: SpecProductionListRawData;
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
    opt?: Module_SpecProduction_OptionsJson;
}


type SpecProductionListAdapter = { Page: ReturnType<typeof PageManagementAdapter>; Material: ReturnType<typeof MaterialAdapter>; };

type SpecProductionListTemplate = ClientDataQueryTemplate<
    SpecProductionListSearchParams,
    SpecProductionListRawData,
    SpecProductionListRawData,
    SpecProductionListAdapter,
    SpecProductionListQueryParam,
    SpecProductionListLoaderData
>;

type SpecProductionListDataSourceContext = Parameters<NonNullable<NonNullable<SpecProductionListTemplate["spec"]>["useDataSource"]>>[0];
// #endregion

// #region Public
/** 前台物件列表 SSR Loader */

export const Client_SpecProduction_List_Loader =
    (p: { lang: Lang; opts?: Module_SpecProduction_OptionsJson; }) => async ({ request }: LoaderFunctionArgs): Promise<SpecProductionListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const adapter = { Page: PageManagementAdapter(ssrApi), Material: MaterialAdapter(ssrApi) };
        const queryState = buildSpecProductionListQueryState({ lang: p.lang, opt: p.opts });
        const baseParam = queryState.queryParam.materialParam === EMPTY_QUERY ? null : queryState.queryParam.materialParam;
        const pageParam = queryState.queryParam.pageParam;
        if (!baseParam)
        {
            return { args: { lang: p.lang, opt: p.opts, baseParam: null, pageParam }, res: buildEmptyRawData() };
        }
        const materialLoader = adapter.Material.loader.createQueryListLoader({ getCondition: () => baseParam, getApiInstance: () => ssrApi });
        const pageLoader = adapter.Page.loader.createQueryListLoader({ getCondition: () => pageParam, getApiInstance: () => ssrApi });
        const [materialLD, pageLD] = await Promise.all([materialLoader({ request } as LoaderFunctionArgs), pageLoader({ request } as LoaderFunctionArgs)]);
        const materialList = materialLD.apiRes.Data ?? [];
        const pageList = pageLD.apiRes.Data ?? [];
        return { args: { lang: p.lang, opt: p.opts, baseParam, pageParam }, res: buildRawData({ materialList, pageList, lang: p.lang }) };
    };


/** 前台物件列表 Hook，提供 Comp 直接吃的 props */
export const useClientSpecProductionListFetchData = (
    props: { lang: Lang; options?: Module_SpecProduction_OptionsJson; },
): UseSpecProductionListFetchDataResult =>
{
    // 宣告變數
    const template = useMemo(() =>
    {
        return createSpecProductionListDataQueryTemplate({ lang: props.lang, opt: props.options });
    }, [props.lang, props.options]);

    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { rawData: templateVm.viewModel, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
// #endregion

// #region Private
/** 建立空 rawData */

const buildEmptyRawData = (): SpecProductionListRawData =>
{
    return { pageContent: "", catName: "", prodData: new Map<MaterialTag, MaterialSet[]>() };
};


/** 建立 Material 查詢參數 */
const buildMaterialParam = (p: { categoryId?: string; tagIds?: string; }): QueryListParam | null =>
{
    if (!p.categoryId || !p.tagIds) return null;

    const tagValues = p.tagIds.split(",").map((x) => x.trim()).filter(Boolean).map((x) => `"${x}"`).join(",");
    if (!tagValues) return null;

    const categoryCond = `${MaterialFields.CategoryId} = "${p.categoryId}"`;
    const tagCond = `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId} In (${tagValues})`;

    return {
        Fields: [
            MaterialFields.InternalId,
            MaterialFields.MaterialId,
            MaterialFields.CategoryId,

            `${MaterialFields.Category}.${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${MaterialFields.Category}.${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,

            `${MaterialFields.Category}.${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields.Field}`,
            `${MaterialFields.Category}.${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.Lang}`,
            `${MaterialFields.Category}.${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.FieldDisplayName}`,

            `${MaterialFields._MaterialLangInfo}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
            `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialInfoJson}`,

            `${MaterialFields._MaterialPicture}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.RowId}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureId}`,
            `${MaterialFields._MaterialPicture}.${MaterialPictureFields.PictureName}`,

            `${MaterialFields._MaterialTags}.${MaterialTagsFields.TagId}`,
            `${MaterialFields._MaterialTags}.${MaterialTagsFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${MaterialFields._MaterialTags}.${MaterialTagsFields.Tag}.${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: LibMerge(" And ", false, categoryCond, tagCond),
        OrderBy: [{ Col: MaterialFields.CategoryId, Desc: false }],
    };
};


/** 建立 Page 查詢參數 */
const buildPageParam = (p: { pageInternalId?: string; }): QueryListParam =>
{
    return {
        Fields: [
            PageManagementFields.PageId,
            PageManagementFields.InternalId,
            `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
            `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Content}`,
        ],
        Condition: `${PageManagementFields.InternalId} = "${p.pageInternalId}"`,
        OrderBy: [{ Col: PageManagementFields.PageId, Desc: false }],
    };
};


/** 取得物件唯一鍵，避免同一物件重複塞入同一個 Tag 群組 */
/** 依 TagId 分組 MaterialSet，Map key 使用第一個遇到的 MaterialTag 物件 */
const groupMaterialByTag = (list: MaterialSet[]): Map<MaterialTag, MaterialSet[]> =>
{
    const tagMap = new Map<string, { tag: MaterialTag; list: MaterialSet[]; keys: Set<string>; }>();

    list.forEach((item) =>
    {
        item.MaterialTags?.forEach((tag) =>
        {
            if (!tag.TagId) return;

            const materialKey = item.Material?.InternalId ?? item.Material?.MaterialId ?? "";
            const group = tagMap.get(tag.TagId) ?? { tag, list: [], keys: new Set<string>() };

            if (materialKey.length <= 0 || !group.keys.has(materialKey))
            {
                group.list.push(item);
                if (materialKey.length > 0) group.keys.add(materialKey);
            }

            tagMap.set(tag.TagId, group);
        });
    });

    return new Map(Array.from(tagMap.values()).map((x) => [x.tag, x.list]));
};


/** 取得頁面內容 */
const getPageContent = (list: PageManagementSet[], lang: Lang): string =>
{
    return findTextByKey(list[0]?.PageManagementDetail, (p) => p?.Lang, lang, (p) => p?.Content);
};


/** 取得類別名稱 */
const getCategoryName = (list: MaterialSet[], lang: Lang): string =>
{
    return findTextByKey(list[0]?.Material?.Category?._CategoryDetail, (p) => p?.Lang, lang, (p) => p?.CategoryName);
};


/** 建立前台物件列表 rawData */
const buildRawData = (p: { materialList: MaterialSet[]; pageList: PageManagementSet[]; lang: Lang; }): SpecProductionListRawData =>
{
    return { pageContent: getPageContent(p.pageList, p.lang), catName: getCategoryName(p.materialList, p.lang), prodData: groupMaterialByTag(p.materialList) };
};



/** 建立 loader / hook 共用查詢狀態 */
const buildSpecProductionListQueryState = (p: SpecProductionListSearchParams) =>
{
    // 宣告變數
    const template = createSpecProductionListDataQueryTemplate(p);
    const searchValues: SearchValues = {};
    const viewState: IListViewState = { pageNumber: 1, pageSize: 0 };

    // return
    return buildClientDataQueryState(template, searchValues, viewState);
};


/** 建立 SpecProduction List DataQuery Template */

const createSpecProductionListDataQueryTemplate = (p: SpecProductionListSearchParams): SpecProductionListTemplate =>
{
    // return
    return {
        featureKey: "Spec1820.SpecProduction.List",
        dataMode: "multiple",
        initialViewState: { pageNumber: 1, pageSize: 0 },
        pagination: null,
        searchBar: null,
        spec: {
            toSearchParams: () => ({ lang: p.lang, opt: p.opt }),
            buildQueryParam: ({ searchParams }) => ({
                materialParam: buildMaterialParam({ categoryId: searchParams.opt?.CategoryId, tagIds: searchParams.opt?.TagIds }) ?? EMPTY_QUERY,
                pageParam: buildPageParam({ pageInternalId: searchParams.opt?.PageId ?? "" }),
            }),
            useDataSource: (ctx) => useSpecProductionListDataSource(ctx),
            buildViewModel: ({ rawData }) => rawData,
        },
    };
};


/** DataSource：用 Template 統一接頁面內容與物件清單 */
const useSpecProductionListDataSource = (
    ctx: SpecProductionListDataSourceContext,
): ClientDataQueryDataSourceResult<SpecProductionListRawData, SpecProductionListAdapter> =>
{
    // 宣告變數
    const loaderData = ctx.loaderData ?? null;
    const adapter = useMemo<SpecProductionListAdapter>(() => ({ Page: PageManagementAdapter(), Material: MaterialAdapter() }), []);
    const materialKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam.materialParam), [ctx.queryParam.materialParam]);
    const pageKey = useMemo(() => buildClientDataQueryKey(ctx.queryParam.pageParam), [ctx.queryParam.pageParam]);

    // 執行 function
    const usePage = adapter.Page.hooks.useQueryList({ condition: ctx.queryParam.pageParam, initial: null, deps: [pageKey] });
    const useList = adapter.Material.hooks.useQueryList({ condition: ctx.queryParam.materialParam, initial: null, deps: [materialKey] });

    const rawData = useMemo<SpecProductionListRawData>(() =>
    {
        if (useList.data || usePage.data)
        {
            return buildRawData({ materialList: useList.data ?? [], pageList: usePage.data ?? [], lang: ctx.searchParams.lang });
        }

        return loaderData?.res ?? buildEmptyRawData();
    }, [loaderData, ctx.searchParams.lang, usePage.data, useList.data]);

    // return
    return {
        adapter,
        rawData,
        isLoading: Boolean(usePage.isLoading || useList.isLoading),
        errors: [usePage.errorText, useList.errorText],
        paginator: null,
    };
};
// #endregion
