import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    BannerDetailFields,
    BannerDetailInfoFields,
    BannerFields,
    CategoryDetailFields,
    CategoryFields,
    GalleryFields,
    GalleryInfoFields,
    PGID,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

export interface HomePageRawData
{
    heroBanner: BannerSet | null;
    admissionsBanner: BannerSet | null;
    linksBanner: BannerSet | null;

    aboutWebResource: WebResourceSet | null;
    aboutPage: PageManagementSet | null;

    newsTopList: AnnouncementSet[];
    newsList: AnnouncementSet[];
    newsMerged: AnnouncementSet[];
    newsCategories: CategorySet[];
    newsTags: TagSet[];

    galleryTopList: GallerySet[];
    galleryList: GallerySet[];
    galleryMerged: GallerySet[];
    galleryCategories: CategorySet[];
    galleryTags: TagSet[];
}
export interface HomePageLoaderArgs
{
    lang: Lang;
    nowIsoLocal: string;

    heroBannerInternalId: string;
    admissionsBannerInternalId: string;
    linksBannerId: string;

    aboutWebResourceInternalId: string;
    aboutPageInternalId: string;

    newsCategoryIds: string;
    galleryCategoryIds: string;
    take: number;

    linksBannerParam: QueryListParam;

    newsTopParam: QueryListParam;
    newsListParam: QueryListParam;
    newsCateParam: QueryListParam;
    newsTagParam: QueryListParam;

    galleryTopParam: QueryListParam;
    galleryListParam: QueryListParam;
    galleryCateParam: QueryListParam;
    galleryTagParam: QueryListParam;
}
export interface HomePageLoaderRes
{
    rawData: HomePageRawData;
}
export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatLocalIso = (d: Date): string =>
{
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    const ms = `${d.getMilliseconds()}`.padStart(3, "0");
    return `${y}-${m}-${day}T${h}:${mi}:${s}.${ms}`;
};
const takeTopThenFill = <T>(
    top: T[] | undefined,
    rest: T[] | undefined,
    limit: number,
    getKey: (x: T) => string,
): T[] =>
{
    const seen = new Set<string>();
    const out: T[] = [];
    for (const it of top ?? [])
    {
        const k = getKey(it);
        if (!seen.has(k) && out.length < limit)
        {
            seen.add(k);
            out.push(it);
        }
    }
    for (const it of rest ?? [])
    {
        if (out.length >= limit) break;
        const k = getKey(it);
        if (!seen.has(k))
        {
            seen.add(k);
            out.push(it);
        }
    }
    return out;
};
const takeFirstOrNull = <T>(d: T | T[] | null | undefined): T | null =>
{
    if (!d) return null;
    return Array.isArray(d) ? d[0] ?? null : d;
};
const buildBannerByBannerIdParam = (bannerId: string): QueryListParam =>
{
    return {
        Fields: [
            BannerFields.InternalId,
            BannerFields.BannerId,
            BannerFields.BannerCategoryName,
            `${BannerFields._BannerDetail}.${BannerDetailFields.RowId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Sort}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_Start}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields.Validate_End}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Content}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL}`,
            `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.URL_Open}`,
        ],
        Condition: bannerId ? `${BannerFields.BannerId} = ${bannerId}` : "",
        OrderBy: [{ Col: BannerFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 1,
    };
};
const buildCategoryQuery = (progId: string): QueryListParam =>
{
    return {
        Fields: [
            CategoryFields.InternalId,
            CategoryFields.CategoryId,
            CategoryFields.ProgId,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: progId ? `${CategoryFields.ProgId} = ${progId}` : "",
        OrderBy: [{ Col: CategoryFields.CreateTime, Desc: false }],
        PageNumber: 0,
        PageSize: 0,
    };
};
const buildTagQuery = (progId: string): QueryListParam =>
{
    return {
        Fields: [
            TagDataFields.InternalId,
            TagDataFields.TagId,
            TagDataFields.ProgId,
            `${TagDataFields._TagDetail}.${TagDetailFields.Lang}`,
            `${TagDataFields._TagDetail}.${TagDetailFields.TagName}`,
        ],
        Condition: progId ? `${TagDataFields.ProgId} = ${progId}` : "",
        OrderBy: [{ Col: TagDataFields.ModifyTime, Desc: true }],
        PageNumber: 0,
        PageSize: 0,
    };
};
const buildAnnouncementHomeCondition = (
    p: { lang: Lang; nowIsoLocal: string; categoryIds: string; isTop: boolean; },
): string =>
{
    let cdt = "";
    cdt = LibMerge(
        " And ",
        false,
        cdt,
        `${AnnouncementFields.Validate_Start} <= ${p.nowIsoLocal}`,
        `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
    );
    // 執行：置頂/非置頂
    cdt = p.isTop
        ? LibMerge(" And ", false, cdt, `${AnnouncementFields.ContentStatus} & 1`)
        : LibMerge(" And ", false, cdt, `${AnnouncementFields.ContentStatus} !& 1`);
    cdt = LibMerge(
        " And ",
        false,
        cdt,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
    );
    cdt = LibMerge(
        " And ",
        false,
        cdt,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );
    if (p.categoryIds)
    {
        cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    }
    return cdt;
};
const buildAnnouncementHomeQuery = (p: { condition: string; take: number; }): QueryListParam =>
{
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.InternalId,
            AnnouncementFields.ContentStatus,
            AnnouncementFields.PictureId,
            AnnouncementFields.PicDescription,
            AnnouncementFields.Categories,
            AnnouncementFields.Tags,
            AnnouncementFields.Validate_Start,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
        ],
        Condition: p.condition,
        OrderBy: [
            { Col: AnnouncementFields.Validate_Start, Desc: true },
            { Col: AnnouncementFields.CreateTime, Desc: true },
        ],
        PageNumber: 1,
        PageSize: p.take,
    };
};
const buildGalleryHomeCondition = (
    p: { lang: Lang; nowIsoLocal: string; categoryIds: string; isTop: boolean; },
): string =>
{
    let cdt = "";
    cdt = LibMerge(" And ", false, cdt, `${GalleryFields.Validate_Start} <= ${p.nowIsoLocal}`);
    cdt = LibMerge(" And ", false, cdt, `${GalleryFields.ContentStatus} !& 4`);
    cdt = p.isTop
        ? LibMerge(" And ", false, cdt, `${GalleryFields.ContentStatus} & 1`)
        : LibMerge(" And ", false, cdt, `${GalleryFields.ContentStatus} !& 1`);
    // 執行：語系（避免找不到 info）
    cdt = LibMerge(" And ", false, cdt, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${p.lang}`);
    cdt = LibMerge(" And ", false, cdt, `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} != ''`);
    if (p.categoryIds) cdt = LibMerge(" And ", false, cdt, `${GalleryFields.Categories} HasAny [${p.categoryIds}]`);
    return cdt;
};
const buildGalleryHomeQuery = (p: { condition: string; take: number; }): QueryListParam =>
{
    return {
        Fields: [
            GalleryFields.GalleryId,
            GalleryFields.InternalId,
            GalleryFields.Categories,
            GalleryFields.Tags,
            GalleryFields.ContentStatus,
            GalleryFields.Validate_Start,
            GalleryFields.CoverPicSrcId,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
            `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Content}`,
        ],
        Condition: p.condition,
        OrderBy: [{ Col: GalleryFields.Validate_Start, Desc: true }],
        PageNumber: 1,
        PageSize: p.take,
    };
};

/**
 * ✅ 首頁 loader factory：對標 AnnouncementList_Loader.ts
 * - 回傳 res.rawData：一次包含首頁所有 section 需要的資料
 * - args 也保留：後續 hydration hook 要做「同條件 refetch」可直接用
 */
export const HomePageLoader =
    (p: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
    {
        const ssrApi = getSsrApi(request);
        const banner = BannerSliderAdapter(ssrApi);
        const web = WebResourceAdapter(ssrApi);
        const page = PageManagementAdapter(ssrApi);
        const announce = AnnouncementAdapter(ssrApi);
        const cate = CategoryAdapter(ssrApi);
        const tag = TagAdapter(ssrApi);
        const gallery = GalleryAdapter(ssrApi);
        // 宣告：常用參數（可被 overrides 覆蓋）
        const nowIsoLocal = formatLocalIso(new Date());
        const heroBannerInternalId = "5ec21378-41ae-4921-96b9-66c57f05fe76";
        const admissionsBannerInternalId = "a25c98f9-e254-43f4-9468-9afac6939f9f";
        const linksBannerId = "Banner20251119001";
        const aboutWebResourceInternalId = "6d052cd7-3bf2-40aa-ba42-4289190ba8dc";
        const aboutPageInternalId = "4c7132ea-88e9-44a1-a9c5-3f89042275b6";
        const newsCategoryIds = "Category20251113009";
        const galleryCategoryIds = "Category20251113010";
        const take = 6;
        // 宣告：QueryListParam（links / news / gallery + category/tag）
        const linksBannerParam = buildBannerByBannerIdParam(linksBannerId);
        const newsTopCdt = buildAnnouncementHomeCondition({
            lang: p.lang,
            nowIsoLocal,
            categoryIds: newsCategoryIds,
            isTop: true,
        });
        const newsListCdt = buildAnnouncementHomeCondition({
            lang: p.lang,
            nowIsoLocal,
            categoryIds: newsCategoryIds,
            isTop: false,
        });
        const newsTopParam = buildAnnouncementHomeQuery({ condition: newsTopCdt, take });
        const newsListParam = buildAnnouncementHomeQuery({ condition: newsListCdt, take });
        const newsCateParam = buildCategoryQuery(PGID.Announcement);
        const newsTagParam = buildTagQuery(PGID.Announcement);

        const galleryTopCdt = buildGalleryHomeCondition({
            lang: p.lang,
            nowIsoLocal,
            categoryIds: galleryCategoryIds,
            isTop: true,
        });
        const galleryListCdt = buildGalleryHomeCondition({
            lang: p.lang,
            nowIsoLocal,
            categoryIds: galleryCategoryIds,
            isTop: false,
        });
        const galleryTopParam = buildGalleryHomeQuery({ condition: galleryTopCdt, take });
        const galleryListParam = buildGalleryHomeQuery({ condition: galleryListCdt, take });
        const galleryCateParam = buildCategoryQuery(PGID.Gallery);
        const galleryTagParam = buildTagQuery(PGID.Gallery);

        // 執行：建立 loaders（全部走 adapter.loader）
        const heroBannerLoader = banner.loader.createQueryDataLoader({
            getInternalId: () => heroBannerInternalId,
            getApiInstance: () => ssrApi,
        });
        const admissionsBannerLoader = banner.loader.createQueryDataLoader({
            getInternalId: () => admissionsBannerInternalId,
            getApiInstance: () => ssrApi,
        });
        const linksBannerLoader = banner.loader.createQueryListLoader({
            getCondition: () => linksBannerParam,
            getApiInstance: () => ssrApi,
        });

        const aboutWebLoader = web.loader.createQueryDataLoader({
            getInternalId: () => aboutWebResourceInternalId,
            getApiInstance: () => ssrApi,
        });
        const aboutPageLoader = page.loader.createQueryDataLoader({
            getInternalId: () => aboutPageInternalId,
            getApiInstance: () => ssrApi,
        });

        const newsTopLoader = announce.loader.createQueryListLoader({
            getCondition: () => newsTopParam,
            getApiInstance: () => ssrApi,
        });
        const newsListLoader = announce.loader.createQueryListLoader({
            getCondition: () => newsListParam,
            getApiInstance: () => ssrApi,
        });
        const newsCateLoader = cate.loader.createQueryListLoader({
            getCondition: () => newsCateParam,
            getApiInstance: () => ssrApi,
        });
        const newsTagLoader = tag.loader.createQueryListLoader({
            getCondition: () => newsTagParam,
            getApiInstance: () => ssrApi,
        });

        const galleryTopLoader = gallery.loader.createQueryListLoader({
            getCondition: () => galleryTopParam,
            getApiInstance: () => ssrApi,
        });
        const galleryListLoader = gallery.loader.createQueryListLoader({
            getCondition: () => galleryListParam,
            getApiInstance: () => ssrApi,
        });
        const galleryCateLoader = cate.loader.createQueryListLoader({
            getCondition: () => galleryCateParam,
            getApiInstance: () => ssrApi,
        });
        const galleryTagLoader = tag.loader.createQueryListLoader({
            getCondition: () => galleryTagParam,
            getApiInstance: () => ssrApi,
        });

        // 執行：一次撈完（SSR）
        const [
            heroLD,
            admissionsLD,
            linksLD,
            aboutWebLD,
            aboutPageLD,
            newsTopLD,
            newsListLD,
            newsCateLD,
            newsTagLD,
            galleryTopLD,
            galleryListLD,
            galleryCateLD,
            galleryTagLD,
        ] = await Promise.all([
            heroBannerLoader({ request } as LoaderFunctionArgs),
            admissionsBannerLoader({ request } as LoaderFunctionArgs),
            linksBannerLoader({ request } as LoaderFunctionArgs),
            aboutWebLoader({ request } as LoaderFunctionArgs),
            aboutPageLoader({ request } as LoaderFunctionArgs),
            newsTopLoader({ request } as LoaderFunctionArgs),
            newsListLoader({ request } as LoaderFunctionArgs),
            newsCateLoader({ request } as LoaderFunctionArgs),
            newsTagLoader({ request } as LoaderFunctionArgs),
            galleryTopLoader({ request } as LoaderFunctionArgs),
            galleryListLoader({ request } as LoaderFunctionArgs),
            galleryCateLoader({ request } as LoaderFunctionArgs),
            galleryTagLoader({ request } as LoaderFunctionArgs),
        ]);

        // 宣告：整理回傳資料（只拿 Data）
        const heroBanner = takeFirstOrNull<BannerSet>(heroLD.apiRes.Data);
        const admissionsBanner = takeFirstOrNull<BannerSet>(admissionsLD.apiRes.Data);
        const linksBanner = (linksLD.apiRes.Data?.[0] ?? null) as BannerSet | null;
        const aboutWebResource = takeFirstOrNull<WebResourceSet>(aboutWebLD.apiRes.Data);
        const aboutPage = takeFirstOrNull<PageManagementSet>(aboutPageLD.apiRes.Data);
        const newsTopList = newsTopLD.apiRes.Data ?? [];
        const newsList = newsListLD.apiRes.Data ?? [];
        const newsMerged = takeTopThenFill(
            newsTopList,
            newsList,
            take,
            x => x.Announcement?.InternalId ?? String(x.Announcement?.AnnouncementId ?? ""),
        );

        const newsCategories = newsCateLD.apiRes.Data ?? [];
        const newsTags = newsTagLD.apiRes.Data ?? [];

        const galleryTopList = galleryTopLD.apiRes.Data ?? [];
        const galleryList = galleryListLD.apiRes.Data ?? [];
        const galleryMerged = takeTopThenFill(
            galleryTopList,
            galleryList,
            take,
            x => x.Gallery?.InternalId ?? String(x.Gallery?.GalleryId ?? ""),
        );

        const galleryCategories = galleryCateLD.apiRes.Data ?? [];
        const galleryTags = galleryTagLD.apiRes.Data ?? [];

        // return
        return {
            args: {
                lang: p.lang,
                nowIsoLocal,
                heroBannerInternalId,
                admissionsBannerInternalId,
                linksBannerId,
                aboutWebResourceInternalId,
                aboutPageInternalId,
                newsCategoryIds,
                galleryCategoryIds,
                take,
                linksBannerParam,
                newsTopParam,
                newsListParam,
                newsCateParam,
                newsTagParam,
                galleryTopParam,
                galleryListParam,
                galleryCateParam,
                galleryTagParam,
            },
            res: {
                rawData: {
                    heroBanner,
                    admissionsBanner,
                    linksBanner,
                    aboutWebResource,
                    aboutPage,
                    newsTopList,
                    newsList,
                    newsMerged,
                    newsCategories,
                    newsTags,
                    galleryTopList,
                    galleryList,
                    galleryMerged,
                    galleryCategories,
                    galleryTags,
                },
            },
        };
    };
