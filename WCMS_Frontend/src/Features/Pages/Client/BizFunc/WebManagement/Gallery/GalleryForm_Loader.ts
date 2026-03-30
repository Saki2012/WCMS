import { CategoryAdapter, type CategoryMapLoaderData } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery_Api";
import { TagAdapter, type TagMapLoaderData } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import { type LoaderFunctionArgs, useLoaderData, useParams } from "react-router-dom";

type GallerySet = components["schemas"]["GallerySet_DTO"];

export interface GalleryFormLoaderArgs
{
    internalId: string;
}

export interface GalleryFormLoaderRes
{
    dataRes: GallerySet | null;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
}

export interface GalleryFormLoaderData
{
    args: GalleryFormLoaderArgs;
    res: GalleryFormLoaderRes;
}

export interface GalleryFormFetchDataResult
{
    internalId: string;
    data: GallerySet;
    title: string;
    categoryMap: Record<string, string>;
    tagMap: Record<string, string>;
    isLoading: boolean;
    errorText: string | null;
    errorList: string[];
}

const emptyData: GallerySet = {
    Gallery: {},
    GalleryInfo: [],
    GalleryPhotos: [],
    GalleryPhotosInfo: [],
};

/** 轉成安全的 internalId */
const getSafeInternalId = (value?: string): string =>
{
    return `${value ?? ""}`.trim();
};

/** 建立 SSR initial，避免 hydration 首次重抓 */
const buildInitialData = (
    p: {
        loaderData: GalleryFormLoaderData | null;
        internalId: string;
        fallbackData: GallerySet;
    },
): ApiLoaderData<string, GallerySet> | null =>
{
    if (!p.loaderData?.args?.internalId) return null;
    if (p.loaderData.args.internalId !== p.internalId) return null;

    return {
        args: p.internalId,
        apiRes: {
            IsSuccess: true,
            Data: p.loaderData.res.dataRes ?? p.fallbackData,
            SysMessage: [],
        },
    };
};

/** 依語系取得標題 */
const getTitleByLang = (
    p: {
        data: GallerySet;
        lang: Lang;
    },
): string =>
{
    const title = p.data.GalleryInfo?.find(
        (item) => item?.Lang?.toLowerCase() === p.lang.toLowerCase(),
    )?.Title;

    return title ?? "";
};

/** SSR loader：預載 Gallery 單筆資料 + category/tag map */
export const GalleryForm_Loader =
    (p: { lang: Lang; }) => async ({ request, params }: LoaderFunctionArgs): Promise<GalleryFormLoaderData> =>
    {
        const internalId = getSafeInternalId(params?.internalId);
        const ssrApi = getSsrApi(request);
        if (!internalId)
        {
            return {
                args: { internalId },
                res: {
                    dataRes: null,
                    categoryMap: {},
                    tagMap: {},
                },
            };
        }
        const galleryAdapter = GalleryAdapter(ssrApi);
        const categoryAdapter = CategoryAdapter(ssrApi);
        const tagAdapter = TagAdapter(ssrApi);
        const dataLoader = galleryAdapter.loader.createQueryDataLoader({
            getInternalId: () => internalId,
            getApiInstance: () => ssrApi,
        });
        const categoryLoader = categoryAdapter.loader.createMapByProgIdLoader({
            progId: PGID.Gallery,
            lang: p.lang,
            getApiInstance: () => ssrApi,
        });
        const tagLoader = tagAdapter.loader.createMapByProgIdLoader({
            progId: PGID.Gallery,
            lang: p.lang,
            getApiInstance: () => ssrApi,
        });
        const [dataLD, categoryLD, tagLD] = await Promise.all([
            dataLoader({ request, params } as LoaderFunctionArgs),
            categoryLoader({ request, params } as LoaderFunctionArgs),
            tagLoader({ request, params } as LoaderFunctionArgs),
        ]);
        return {
            args: { internalId },
            res: {
                dataRes: dataLD.apiRes.Data ?? null,
                categoryMap: categoryLD.apiRes.Data ?? {},
                tagMap: tagLD.apiRes.Data ?? {},
            },
        };
    };

/** GalleryForm 單一資料入口 */
export const useGalleryFormFetchData = (
    p: {
        lang: Lang;
        emptyData?: GallerySet;
    },
): GalleryFormFetchDataResult =>
{
    const { internalId: routeInternalId } = useParams();
    const loaderData = useLoaderData() as GalleryFormLoaderData | null;
    const galleryAdapter = useMemo(() => GalleryAdapter(), []);
    const categoryAdapter = useMemo(() => CategoryAdapter(), []);
    const tagAdapter = useMemo(() => TagAdapter(), []);

    const internalId = getSafeInternalId(routeInternalId);
    const fallbackData = p.emptyData ?? emptyData;

    const initialData = useMemo(
        () =>
            buildInitialData({
                loaderData,
                internalId,
                fallbackData,
            }),
        [loaderData, internalId, fallbackData],
    );

    const queryData = galleryAdapter.hooks.useQueryData({
        internalId,
        initial: initialData,
        deps: [internalId, p.lang],
    });

    const categoryInitial = useMemo(() => buildCategoryMapInitial({ loaderData, lang: p.lang }), [loaderData, p.lang]);
    const tagInitial = useMemo(() => buildTagMapInitial({ loaderData, lang: p.lang }), [loaderData, p.lang]);
    const category = categoryAdapter.hooks.useMapByProgId({
        progId: PGID.Gallery,
        lang: p.lang,
        initial: categoryInitial,
    });
    const tag = tagAdapter.hooks.useMapByProgId({ progId: PGID.Gallery, lang: p.lang, initial: tagInitial });
    const data = useMemo(() => queryData.data ?? fallbackData, [queryData.data, fallbackData]);
    const title = useMemo(() => getTitleByLang({ data, lang: p.lang }), [data, p.lang]);
    const categoryMap = useMemo(() => loaderData?.res.categoryMap ?? category.map ?? {}, [
        loaderData?.res.categoryMap,
        category.map,
    ]);
    const tagMap = useMemo(() => loaderData?.res.tagMap ?? tag.map ?? {}, [loaderData?.res.tagMap, tag.map]);

    const errorList = useMemo(() =>
    {
        return [
            queryData.errorText,
            category.errorText,
            tag.errorText,
        ].filter((item): item is string => Boolean(item));
    }, [queryData.errorText, category.errorText, tag.errorText]);

    return {
        internalId,
        data,
        title,
        categoryMap,
        tagMap,
        isLoading: Boolean(queryData.isLoading || category.isLoading || tag.isLoading),
        errorText: errorList[0] ?? null,
        errorList,
    };
};

/** 建立 Category map initial，避免 hydration 首次重抓 */
const buildCategoryMapInitial = (
    p: {
        loaderData: GalleryFormLoaderData | null;
        lang: Lang;
    },
): CategoryMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return {
        args: {
            progId: PGID.Gallery,
            lang: p.lang,
        },
        apiRes: {
            IsSuccess: true,
            Data: p.loaderData.res.categoryMap ?? {},
            SysMessage: [],
        },
    };
};

/** 建立 Tag map initial，避免 hydration 首次重抓 */
const buildTagMapInitial = (
    p: {
        loaderData: GalleryFormLoaderData | null;
        lang: Lang;
    },
): TagMapLoaderData | null =>
{
    if (!p.loaderData) return null;

    return {
        args: {
            progId: PGID.Gallery,
            lang: p.lang,
        },
        apiRes: {
            IsSuccess: true,
            Data: p.loaderData.res.tagMap ?? {},
            SysMessage: [],
        },
    };
};
