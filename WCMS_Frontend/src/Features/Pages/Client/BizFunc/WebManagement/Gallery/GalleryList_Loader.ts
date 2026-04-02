import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    CategoryDataSetFields,
    CategoryDetailFields,
    CategoryFields,
    GalleryFields,
    GalleryInfoFields,
    PGID,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type CategoryDetail = components["schemas"]["CategoryDetail_DTO"];

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
    categoryParam: QueryListParam;
    lang: Lang;
    categoryIds: string;
    tagIds: string;
}

export interface GalleryListLoaderRes
{
    gridData: ApiGridLoaderData<GallerySet>;
    categoryData: ApiLoaderData<QueryListParam, CategorySet[]>;
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
const buildCondition = (
    p: {
        lang: Lang;
        categoryIds: string;
        tagIds: string;
    },
): string =>
{
    let condition = "";

    if (p.categoryIds)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${GalleryFields.Categories} HasAny [${p.categoryIds}]`,
        );
    }

    if (p.tagIds)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${GalleryFields.Tags} HasAny [${p.tagIds}]`,
        );
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
const buildBaseParam = (
    p: {
        lang: Lang;
        categoryIds: string;
        tagIds: string;
    },
): QueryListParam =>
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
        OrderBy: [
            { Col: GalleryFields.Validate_Start, Desc: true },
            { Col: GalleryFields.CreateTime, Desc: true },
        ],
        PageNumber: 1,
        PageSize: 12,
    };
};

/** 建立 Gallery 分類查詢參數 */
const buildCategoryParam = (lang: Lang): QueryListParam =>
{
    return {
        Fields: [
            `${CategoryDataSetFields.Category}.${CategoryFields.CategoryId}`,
            `${CategoryDataSetFields.Category}.${CategoryFields.ProgId}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryDataSetFields.CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: LibMerge(
            " And ",
            false,
            `${CategoryFields.ProgId} = ${PGID.Gallery}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName} != ''`,
        ),
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 判斷 SSR grid initial 是否可沿用 */
const isGridInitialMatched = (
    p: {
        loaderData: GalleryListLoaderData | null;
        lang: Lang;
        categoryIds: string;
        tagIds: string;
    },
): boolean =>
{
    if (!p.loaderData) return false;
    if (p.loaderData.args.lang !== p.lang) return false;
    if (p.loaderData.args.categoryIds !== p.categoryIds) return false;
    if (p.loaderData.args.tagIds !== p.tagIds) return false;

    return true;
};

/** 建立主清單的 initial */
const buildGridInitial = (
    p: {
        loaderData: GalleryListLoaderData | null;
        lang: Lang;
        categoryIds: string;
        tagIds: string;
    },
): ApiGridInitial<GallerySet> | undefined =>
{
    if (!isGridInitialMatched(p)) return undefined;
    if (!p.loaderData?.res?.gridData) return undefined;

    return {
        model: p.loaderData.res.gridData.model,
        count: p.loaderData.res.gridData.count,
        list: p.loaderData.res.gridData.list,
    };
};

/** 建立分類清單的 initial */
const buildCategoryInitial = (
    p: {
        loaderData: GalleryListLoaderData | null;
        lang: Lang;
    },
): ApiLoaderData<QueryListParam, CategorySet[]> | null =>
{
    if (!p.loaderData) return null;
    if (p.loaderData.args.lang !== p.lang) return null;

    return p.loaderData.res.categoryData ?? null;
};

/** 將分類資料整理成 id -> name map */
const toCategoryMap = (
    p: {
        data: CategorySet[];
        lang: Lang;
    },
): Record<string, string> =>
{
    return p.data.reduce((acc, item) =>
    {
        const categoryId = item.Category?.CategoryId;
        if (!categoryId) return acc;

        const detail = (item.CategoryDetail ?? []).find(
            (row: CategoryDetail) => row.Lang === p.lang,
        );

        acc[String(categoryId)] = detail?.CategoryName ?? "";
        return acc;
    }, {} as Record<string, string>);
};

/** 讀取分類 map */
const useGalleryCategoryMap = (
    p: {
        lang: Lang;
        loaderData: GalleryListLoaderData | null;
    },
) =>
{
    const adapter = useMemo(() => CategoryAdapter(), []);
    const categoryParam = useMemo(
        () => buildCategoryParam(p.lang),
        [p.lang],
    );

    const initial = useMemo(
        () =>
            buildCategoryInitial({
                loaderData: p.loaderData,
                lang: p.lang,
            }),
        [p.loaderData, p.lang],
    );

    const query = adapter.hooks.useQueryList({
        condition: categoryParam,
        initial,
        deps: [p.lang],
    });

    const map = useMemo(
        () =>
            toCategoryMap({
                data: query.data ?? [],
                lang: p.lang,
            }),
        [query.data, p.lang],
    );

    return {
        data: query.data ?? [],
        map,
        isLoading: query.isLoading,
        errorText: query.errorText,
    };
};

/** SSR loader：主清單 + 分類一起預載 */
export const GalleryList_Loader =
    (p: { lang: Lang; opts: IGalleryListOptions; }) =>
    async ({ request }: LoaderFunctionArgs): Promise<GalleryListLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const gallery = GalleryAdapter(ssrApi);
        const category = CategoryAdapter(ssrApi);

        const categoryIds = getCategoryIds(p.opts);
        const tagIds = getTagIds(p.opts);

        const baseParam = buildBaseParam({
            lang: p.lang,
            categoryIds,
            tagIds,
        });

        const categoryParam = buildCategoryParam(p.lang);

        const gridLoader = gallery.loader.createQueryGridDataLoader({
            getCondition: () => baseParam,
            getApiInstance: () => ssrApi,
        });

        const categoryLoader = category.loader.createQueryListLoader({
            getCondition: () => categoryParam,
            getApiInstance: () => ssrApi,
        });

        const [gridData, categoryData] = await Promise.all([
            gridLoader({ request } as LoaderFunctionArgs),
            categoryLoader({ request } as LoaderFunctionArgs),
        ]);

        return {
            args: {
                baseParam,
                categoryParam,
                lang: p.lang,
                categoryIds,
                tagIds,
            },
            res: {
                gridData,
                categoryData,
            },
        };
    };

/** Gallery list 單一資料入口 */
export const useGalleryListFetchData = (
    p: {
        lang: Lang;
        opts?: IGalleryListOptions;
    },
): GalleryListFetchDataResult =>
{
    const loaderData = useLoaderData() as GalleryListLoaderData | null;
    const adapter = useMemo(() => GalleryAdapter(), []);

    const categoryIds = getCategoryIds(p.opts);
    const tagIds = getTagIds(p.opts);

    const baseParam = useMemo(
        () =>
            buildBaseParam({
                lang: p.lang,
                categoryIds,
                tagIds,
            }),
        [p.lang, categoryIds, tagIds],
    );

    const gridInitial = useMemo<ApiGridInitial<GallerySet> | undefined>(
        () => buildGridInitial({ loaderData, lang: p.lang, categoryIds, tagIds }),
        [loaderData, p.lang, categoryIds, tagIds],
    );

    const grid = adapter.hooks.useQueryGridData({
        baseParam,
        deps: [p.lang, categoryIds, tagIds],
        initial: gridInitial,
    });

    const category = useGalleryCategoryMap({ lang: p.lang, loaderData });

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
        categoryMap: category.map,
        isLoading: Boolean(grid.isLoading || category.isLoading),
        errors,
        errorText,
        pageNumber: grid.pageNumber,
        totalPages: grid.totalPages,
        onPageChange: grid.onPageChange,
        param: grid.param,
    };
};
