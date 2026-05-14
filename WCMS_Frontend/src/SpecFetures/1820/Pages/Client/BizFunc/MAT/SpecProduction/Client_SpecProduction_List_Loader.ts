import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import type { Module_SpecProduction_OptionsJson } from "@/SpecFetures/1820/Pages/Server/BizFunc/WEB/SiteMenu/SpecModule_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
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
const getMaterialKey = (item: MaterialSet): string =>
{
    return item.Material?.InternalId ?? item.Material?.MaterialId ?? "";
};

/** 依 TagId 分組 MaterialSet，Map key 使用第一個遇到的 MaterialTag 物件 */
const groupMaterialByTag = (list: MaterialSet[]): Map<MaterialTag, MaterialSet[]> =>
{
    const tagMap = new Map<string, { tag: MaterialTag; list: MaterialSet[]; keys: Set<string>; }>();

    list.forEach((item) =>
    {
        item.MaterialTags?.forEach((tag) =>
        {
            if (!tag.TagId) return;

            const materialKey = getMaterialKey(item);
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
    return list[0]?.PageManagementDetail?.find((p) => p.Lang === lang)?.Content ?? "";
};

/** 取得類別名稱 */
const getCategoryName = (list: MaterialSet[], lang: Lang): string =>
{
    return list[0]?.Material?.Category?._CategoryDetail?.find((p) => p.Lang === lang)?.CategoryName ?? "";
};

/** 建立前台物件列表 rawData */
const buildRawData = (p: { materialList: MaterialSet[]; pageList: PageManagementSet[]; lang: Lang; }): SpecProductionListRawData =>
{
    return { pageContent: getPageContent(p.pageList, p.lang), catName: getCategoryName(p.materialList, p.lang), prodData: groupMaterialByTag(p.materialList) };
};

/** 前台物件列表 SSR Loader */
export const Client_SpecProduction_List_Loader =
    (p: { lang: Lang; opts?: Module_SpecProduction_OptionsJson; }) => async ({ request }: LoaderFunctionArgs): Promise<SpecProductionListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const adapter = { Page: PageManagementAdapter(ssrApi), Material: MaterialAdapter(ssrApi) };
        const baseParam = buildMaterialParam({ categoryId: p.opts?.CategoryId, tagIds: p.opts?.TagIds });
        const pageParam = buildPageParam({ pageInternalId: p.opts?.PageId ?? "" });
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
    const loaderData = useLoaderData() as SpecProductionListLoaderData | null;
    const adapter = useMemo(() => ({ Page: PageManagementAdapter(), Material: MaterialAdapter() }), []);

    const baseParam = useMemo(() => buildMaterialParam({ categoryId: props.options?.CategoryId, tagIds: props.options?.TagIds }) ?? EMPTY_QUERY, [
        props.options?.CategoryId,
        props.options?.TagIds,
    ]);

    const basePageParam = useMemo(() => buildPageParam({ pageInternalId: props.options?.PageId ?? "" }), [props.options?.PageId]);

    const listInitial: ApiLoaderData<QueryListParam, MaterialSet[]> | null = null;
    const pageInitial: ApiLoaderData<QueryListParam, PageManagementSet[]> | null = null;

    const usePage = adapter.Page.hooks.useQueryList({ condition: basePageParam, initial: pageInitial, deps: [basePageParam] });

    const useList = adapter.Material.hooks.useQueryList({ condition: baseParam, initial: listInitial, deps: [baseParam] });

    const rawData = useMemo<SpecProductionListRawData>(() =>
    {
        if (useList.data || usePage.data)
        {
            return buildRawData({ materialList: useList.data ?? [], pageList: usePage.data ?? [], lang: props.lang });
        }

        return loaderData?.res ?? buildEmptyRawData();
    }, [loaderData, props.lang, usePage.data, useList.data]);

    const errorList = useMemo(() =>
    {
        return [usePage.errorText, useList.errorText].filter((x): x is string => Boolean(x));
    }, [usePage.errorText, useList.errorText]);

    return { rawData, isLoading: Boolean(usePage.isLoading || useList.isLoading), errorList };
};
