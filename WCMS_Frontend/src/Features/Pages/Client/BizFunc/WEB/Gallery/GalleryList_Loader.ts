import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { type ApiResponse, getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import { GalleryFields, GalleryInfoFields, PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];

export interface IGalleryListOptions
{
    Title: string;
    Category?: string;
    Tag?: string;
    Style: number;
}

export interface GalleryListLoaderArgs
{
    baseParam: QueryListParam;
    progId: PGID;
    lang: Lang;
    categoryIds: string;
    tagIds: string;
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

export interface GalleryListFetchDataResult
{
    list: GallerySet[];
    categoryMap: Record<string, string>;
    isLoading: boolean;
    errors: string[];
    errorText: string | null;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    param: QueryListParam;
}

export type GalleryListAdapter = { Gallery: ReturnType<typeof GalleryAdapter>; Category: ReturnType<typeof CategoryAdapter>; };

/** 取得分類條件字串 */
const getCategoryIds = (opts?: IGalleryListOptions): string =>
{
    return `${opts?.Category ?? ""}`.trim();
};

/** 取得標籤條件字串 */
const getTagIds = (opts?: IGalleryListOptions): string =>
{
    return `${opts?.Tag ?? ""}`.trim();
};

/** 建立 Gallery 查詢條件 */
const buildCondition = (p: { lang: Lang; categoryIds: string; tagIds: string; }): string =>
{
    let condition = "";

    if (p.categoryIds)
    {
        condition = LibMerge(" And ", false, condition, `${GalleryFields.Categories} HasAny [${p.categoryIds}]`);
    }

    if (p.tagIds)
    {
        condition = LibMerge(" And ", false, condition, `${GalleryFields.Tags} HasAny [${p.tagIds}]`);
    }

    condition = LibMerge(
        " And ",
        false,
        condition,
        `${GalleryFields.ContentStatus} !& 4`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${p.lang}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} != ''`,
    );

    return condition;
};

/** 建立主清單查詢參數 */
const buildBaseParam = (p: { lang: Lang; categoryIds: string; tagIds: string; }): QueryListParam =>
{
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
        Condition: buildCondition(p),
        RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: GalleryFields.Validate_Start, Desc: true }, { Col: GalleryFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 12,
    };
};

/** 建立 Gallery list loader / hook 共用參數 */
const buildGalleryListLoaderArgs = (p: { lang: Lang; categoryIds: string; tagIds: string; }): GalleryListLoaderArgs =>
{
    const baseParam = buildBaseParam({ lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds });

    return { baseParam, progId: PGID.Gallery, lang: p.lang, categoryIds: p.categoryIds, tagIds: p.tagIds };
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

/** 判斷 SSR grid initial 是否可沿用 */
const isGridInitialMatched = (p: { loaderData: GalleryListLoaderData | null; args: GalleryListLoaderArgs; }): boolean =>
{
    if (!p.loaderData) return false;
    if (p.loaderData.args.lang !== p.args.lang) return false;
    if (p.loaderData.args.categoryIds !== p.args.categoryIds) return false;
    if (p.loaderData.args.tagIds !== p.args.tagIds) return false;

    return true;
};

/** 建立主清單的 initial */
const buildGridInitial = (p: { loaderData: GalleryListLoaderData | null; args: GalleryListLoaderArgs; }): ApiGridInitial<GallerySet> | undefined =>
{
    if (!isGridInitialMatched(p)) return undefined;
    if (!p.loaderData?.res?.gridData) return undefined;

    return { model: p.loaderData.res.gridData.model, count: p.loaderData.res.gridData.count, list: p.loaderData.res.gridData.list };
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryInitial = (p: { loaderData: GalleryListLoaderData | null; args: GalleryListLoaderArgs; }): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return matchInitialArgs(
        { progId: p.args.progId, lang: p.args.lang },
        { progId: p.loaderData.args.progId, lang: p.loaderData.args.lang },
        p.loaderData.res.categoryMap ?? {},
    );
};

/** SSR loader：主清單 + 分類 map 一起預載 */
export const GalleryList_Loader = (p: { lang: Lang; opts: IGalleryListOptions; }) => async ({ request }: LoaderFunctionArgs): Promise<GalleryListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const adapter = { Gallery: GalleryAdapter(ssrApi), Category: CategoryAdapter(ssrApi) };

    const categoryIds = getCategoryIds(p.opts);
    const tagIds = getTagIds(p.opts);
    const args = buildGalleryListLoaderArgs({ lang: p.lang, categoryIds, tagIds });

    const gridLoader = adapter.Gallery.loader.createQueryGridDataLoader({ getCondition: () => args.baseParam, getApiInstance: () => ssrApi });
    const cateLoader = adapter.Category.loader.createMapByProgIdLoader({ progId: args.progId, lang: args.lang, getApiInstance: () => ssrApi });

    const [gridData, cateLD] = await Promise.all([gridLoader({ request } as LoaderFunctionArgs), cateLoader({ request } as LoaderFunctionArgs)]);

    return { args, res: { gridData, categoryMap: cateLD.apiRes.Data ?? {} } };
};

/** Gallery list 單一資料入口 */
export const useGalleryListFetchData = (p: { lang: Lang; opts?: IGalleryListOptions; }): GalleryListFetchDataResult =>
{
    const loaderData = useLoaderData() as GalleryListLoaderData | null;

    const adapter = useMemo<GalleryListAdapter>(() =>
    {
        return { Gallery: GalleryAdapter(), Category: CategoryAdapter() };
    }, []);

    const categoryIds = getCategoryIds(p.opts);
    const tagIds = getTagIds(p.opts);

    const currentArgs = useMemo(() =>
    {
        return buildGalleryListLoaderArgs({ lang: p.lang, categoryIds, tagIds });
    }, [p.lang, categoryIds, tagIds]);

    const gridInitial = useMemo<ApiGridInitial<GallerySet> | undefined>(() =>
    {
        return buildGridInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    const cateInitial = useMemo(() =>
    {
        return buildCategoryInitial({ loaderData, args: currentArgs });
    }, [loaderData, currentArgs]);

    /** 主清單 */
    const grid = adapter.Gallery.hooks.useQueryGridData({ baseParam: currentArgs.baseParam, deps: [p.lang, categoryIds, tagIds], initial: gridInitial });

    /** 分類 map */
    const category = adapter.Category.hooks.useMapByProgId({
        progId: currentArgs.progId,
        lang: currentArgs.lang,
        initial: cateInitial,
        deps: [currentArgs.progId, currentArgs.lang],
    });

    const errors = useMemo(() =>
    {
        return [...grid.errors, category.errorText].filter((item): item is string => Boolean(item));
    }, [grid.errors, category.errorText]);

    const errorText = useMemo(() =>
    {
        return errors.length > 0 ? errors.join("；") : null;
    }, [errors]);

    return {
        list: grid.list ?? [],
        categoryMap: category.map ?? {},
        isLoading: Boolean(grid.isLoading || category.isLoading),
        errors,
        errorText,
        pageNumber: grid.pageNumber,
        totalPages: grid.totalPages,
        onPageChange: grid.onPageChange,
        param: grid.param,
    };
};
