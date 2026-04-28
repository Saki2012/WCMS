import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { MatCategoryAdapter, type MatCateInfoFieldsLoaderData } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { UseFetchDataResult } from "@/SysCore/Utils/API/FetchDataType";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { useLoaderData } from "react-router-dom";
import type { LoaderFunctionArgs } from "react-router-dom";

type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type MaterialTags = components["schemas"]["MaterialTags_DTO"];
type MatCateInfoFieldsHydrateData = Array<[string, string]>;

// #region Property
interface MaterialFormLoaderArgs
{
    internalId: string;
    progId: PGID;
    lang: Lang;
}

interface MaterialFormLoaderRes
{
    dataRes: MaterialSet | null;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    matCateInfoFieldsMap: MatCateInfoFieldsHydrateData;
}

interface MaterialFormLoaderData
{
    args: MaterialFormLoaderArgs;
    res: MaterialFormLoaderRes;
}

type MaterialFormRawData = {
    formData: MaterialSet;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    matCateInfoFieldsMap: Map<string, string>;
    categoryNameText: string;
    tagNameText: string;
    args: MaterialFormLoaderArgs;
};

type MaterialFormAdapter = {
    Material: ReturnType<typeof MaterialAdapter>;
    Category: ReturnType<typeof CategoryAdapter>;
    Tag: ReturnType<typeof TagAdapter>;
    MatCategory: ReturnType<typeof MatCategoryAdapter>;
};
// #endregion

// #region Public
/** SSR Loader：首屏撈 Material + CategoryMap + TagMap + 動態欄位 */
export const Client_Material_Form_Loader = (props: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<MaterialFormLoaderData> =>
{
    const internalId = getSafeInternalId(params?.internalId);
    const ssrApi = getSsrApi(request);
    const adapter = { Material: MaterialAdapter(ssrApi), Category: CategoryAdapter(ssrApi), Tag: TagAdapter(ssrApi), MatCategory: MatCategoryAdapter(ssrApi) };
    const args = buildMaterialFormLoaderArgs({ lang: props.lang, internalId });

    if (!internalId)
    {
        return { args, res: { dataRes: null, categoryMap: {}, tagMap: {}, matCateInfoFieldsMap: [] } };
    }

    const dataLoader = adapter.Material.loader.createQueryDataLoader({ getInternalId: () => internalId, getApiInstance: () => ssrApi });
    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });
    const tagLoader = adapter.Tag.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });

    const [dataLD, cateLD, tagLD] = await Promise.all([
        dataLoader({ request, params } as LoaderFunctionArgs),
        cateLoader({ request, params } as LoaderFunctionArgs),
        tagLoader({ request, params } as LoaderFunctionArgs),
    ]);

    const dataRes = dataLD.apiRes.Data ?? null;
    const catId = `${dataRes?.Material?.CategoryId ?? ""}`.trim();

    const matCateInfoFieldsLD = catId
        ? await adapter.MatCategory.loader.createMatCateInfoFieldsLoader({ catId, lang: args.lang, getApiInstance: () => ssrApi })(
            { request, params } as LoaderFunctionArgs,
        )
        : null;

    return {
        args,
        res: {
            dataRes,
            categoryMap: cateLD.apiRes.Data ?? {},
            tagMap: tagLD.apiRes.Data ?? {},
            matCateInfoFieldsMap: mapToEntries(matCateInfoFieldsLD?.apiRes.Data),
        },
    };
};

/** CSR Hook：詳細頁使用，SSR 有資料時不重抓 */
export const useMaterialFormFetchData = (
    opt: { lang: Lang; internalId: string; emptyData: MaterialSet; },
): UseFetchDataResult<MaterialFormRawData, MaterialFormAdapter> =>
{
    const loaderData = useLoaderData() as MaterialFormLoaderData | null;
    const safeInternalId = getSafeInternalId(opt.internalId);

    const adapter = useMemo<MaterialFormAdapter>(() =>
    {
        return { Material: MaterialAdapter(), Category: CategoryAdapter(), Tag: TagAdapter(), MatCategory: MatCategoryAdapter() };
    }, []);

    const currentArgs = useMemo(() =>
    {
        return buildMaterialFormLoaderArgs({ lang: opt.lang, internalId: safeInternalId });
    }, [opt.lang, safeInternalId]);

    const dataInitial = useMemo(() =>
    {
        return buildDataInitial({ loaderData, internalId: safeInternalId, fallbackData: opt.emptyData });
    }, [loaderData, safeInternalId, opt.emptyData]);

    const cateInitial = useMemo(() =>
    {
        return buildCategoryInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    const tagInitial = useMemo(() =>
    {
        return buildTagInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    const matCateInfoFieldsInitial = useMemo(() =>
    {
        return buildMatCateInfoFieldsInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    /** 主資料 */
    const useData = adapter.Material.hooks.useQueryData({ internalId: safeInternalId, initial: dataInitial, deps: [safeInternalId] });

    /** 分類 map */
    const useCategory = adapter.Category.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: cateInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    /** 標籤 map */
    const useTag = adapter.Tag.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: tagInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    const formData = useMemo<MaterialSet>(() =>
    {
        return useData.data ?? opt.emptyData;
    }, [useData.data, opt.emptyData]);

    /** 物件類別動態欄位 map */
    const useMatCateInfoFields = adapter.MatCategory.hooks.useMatCateInfoFields({
        catId: formData.Material?.CategoryId,
        lang: currentArgs.lang,
        initial: matCateInfoFieldsInitial ? toStringMap(matCateInfoFieldsInitial.apiRes.Data) : null,
        deps: [formData.Material?.CategoryId ?? "", currentArgs.lang],
    });

    const categoryNameText = useMemo(() =>
    {
        return getNameTextByMap(formData.Material?.CategoryId, useCategory.map ?? {});
    }, [formData.Material?.CategoryId, useCategory.map]);

    const tagNameText = useMemo(() =>
    {
        return buildNameTextByMap(formData.MaterialTags, useTag.map ?? {});
    }, [formData.MaterialTags, useTag.map]);

    const isLoading = Boolean(useData.isLoading || useCategory.isLoading || useTag.isLoading || useMatCateInfoFields.isLoading);

    const errors = useMemo(() =>
    {
        const list = [useData.errorText, useCategory.errorText, useTag.errorText, useMatCateInfoFields.errorText];
        return list.filter((p): p is string => Boolean(p));
    }, [useData.errorText, useCategory.errorText, useTag.errorText, useMatCateInfoFields.errorText]);

    const rawData = useMemo<MaterialFormRawData>(() =>
    {
        return {
            formData,
            categoryMap: useCategory.map ?? {},
            tagMap: useTag.map ?? {},
            matCateInfoFieldsMap: toStringMap(useMatCateInfoFields.map),
            categoryNameText,
            tagNameText,
            args: currentArgs,
        };
    }, [formData, useCategory.map, useTag.map, useMatCateInfoFields.map, categoryNameText, tagNameText, currentArgs]);

    const refetchData = useCallback(async () =>
    {
        await Promise.resolve(useData.refetch());
    }, [useData]);

    const refetchRefData = useCallback(async () =>
    {
        await Promise.all([Promise.resolve(useCategory.refetch()), Promise.resolve(useTag.refetch()), Promise.resolve(useMatCateInfoFields.refetch())]);
    }, [useCategory, useTag, useMatCateInfoFields]);

    return { adapter, rawData, isLoading, errors, refetchData, refetchRefData };
};
// #endregion

// #region Private
/** 統一整理安全 internalId */
const getSafeInternalId = (value?: string): string =>
{
    return `${value ?? ""}`.trim();
};

/** 共用：依目前 Material feature 組出 loader / hook 共用參數 */
const buildMaterialFormLoaderArgs = (p: { lang: Lang; internalId: string; }): MaterialFormLoaderArgs =>
{
    const safeInternalId = getSafeInternalId(p.internalId);

    return { internalId: safeInternalId, progId: PGID.Material, lang: p.lang };
};

/** 組出給 hydration 用的 initial 格式 */
const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    return { args, apiRes };
};

/** 比對目前參數與 loader 參數是否一致 */
const matchInitialArgs = <TArgs, TData>(currentArgs: TArgs, initialArgs: TArgs, initialData: TData): ApiLoaderData<TArgs, TData> | null =>
{
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);
    if (currentKey !== initialKey) return null;

    return buildLoaderInitial(initialArgs, initialData);
};

/** 建立主資料 initial，避免 hydration 首次重抓 */
const buildDataInitial = (
    p: { loaderData: MaterialFormLoaderData | null; internalId: string; fallbackData: MaterialSet; },
): ApiLoaderData<string, MaterialSet> | null =>
{
    if (!p.loaderData?.args?.internalId) return null;
    if (p.loaderData.args.internalId !== p.internalId) return null;

    return buildLoaderInitial(p.internalId, p.loaderData.res.dataRes ?? p.fallbackData);
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};

/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): TagMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.tagMap ?? {},
    );
};

/** 建立物件類別動態欄位 initial，避免 hydration 首次重抓 */
const buildMatCateInfoFieldsInitial = (p: { loaderData: MaterialFormLoaderData | null; args: MaterialFormLoaderArgs; }): MatCateInfoFieldsLoaderData | null =>
{
    if (!p.loaderData) return null;

    const catId = `${p.loaderData.res.dataRes?.Material?.CategoryId ?? ""}`.trim();
    if (!catId) return null;

    return matchInitialArgs({ catId, lang: p.args.lang }, { catId, lang: p.loaderData.args.lang }, toStringMap(p.loaderData.res.matCateInfoFieldsMap));
};

/** 將 tag 清單依 map 轉成顯示文字 */
const buildNameTextByMap = (tags: MaterialTags[] | null | undefined, map: Record<string, string>): string =>
{
    return (tags ?? []).map(p => `${p.TagId ?? ""}`.trim()).filter(Boolean).map(id => map[id] ?? "").filter(Boolean).join("、");
};

/** 依單一 id 從 map 取得顯示名稱 */
const getNameTextByMap = (id: string | null | undefined, map: Record<string, string>): string =>
{
    const safeId = `${id ?? ""}`.trim();
    if (!safeId) return "";

    return map[safeId] ?? "";
};

/** 將 Map 轉成可 hydration 的 entries */
const mapToEntries = (value: Map<string, string> | Record<string, string> | null | undefined): MatCateInfoFieldsHydrateData =>
{
    if (!value) return [];
    if (value instanceof Map) return Array.from(value.entries());

    return Object.entries(value);
};

/** 將 SSR/CSR 資料統一轉成 Map */
const toStringMap = (value: Map<string, string> | Record<string, string> | MatCateInfoFieldsHydrateData | null | undefined): Map<string, string> =>
{
    if (!value) return new Map<string, string>();
    if (value instanceof Map) return value;
    if (Array.isArray(value)) return new Map<string, string>(value);

    return new Map<string, string>(Object.entries(value));
};
// #endregion
