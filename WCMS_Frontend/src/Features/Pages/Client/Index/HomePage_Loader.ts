import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
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

import { formatLocalIso, LibCondition, Operator } from "@/SysCore/Utils/Library/LibData";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type BannerFormModel = components["schemas"]["Banner"];
type WebResourceFormModel = components["schemas"]["WebResource"];
type PageManagementFormModel = components["schemas"]["PageManagement"];
type AnnouncementFormModel = components["schemas"]["Announcement"];
type GalleryFormModel = components["schemas"]["Gallery"];
type CategoryFormModel = components["schemas"]["Category"];
type TagFormModel = components["schemas"]["TagData"];
export interface HomePageRawData
{
    heroBanner: BannerFormModel | null;
    admissionsBanner: BannerFormModel | null;
    linksBanner: BannerFormModel | null;

    aboutWebResource: WebResourceFormModel | null;
    aboutPage: PageManagementFormModel | null;

    newsTopList: AnnouncementFormModel[];
    newsList: AnnouncementFormModel[];
    newsMerged: AnnouncementFormModel[];
    newsCategories: CategoryFormModel[];
    newsTags: TagFormModel[];

    galleryTopList: GalleryFormModel[];
    galleryList: GalleryFormModel[];
    galleryMerged: GalleryFormModel[];
    galleryCategories: CategoryFormModel[];
    galleryTags: TagFormModel[];
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
// #endregion

// #region Public
/*** ✅ 首頁 loader factory：對標 AnnouncementList_Loader.ts
 * - 回傳 res.rawData：一次包含首頁所有 section 需要的資料
 * - args 也保留：後續 hydration hook 要做「同條件 refetch」可直接用
 */
export const HomePageLoader = (p: { lang: Lang; }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
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
    const newsTopCdt = buildAnnouncementHomeCondition({ lang: p.lang, nowIsoLocal, categoryIds: newsCategoryIds, isTop: true });
    const newsListCdt = buildAnnouncementHomeCondition({ lang: p.lang, nowIsoLocal, categoryIds: newsCategoryIds, isTop: false });
    const newsTopParam = buildAnnouncementHomeQuery({ condition: newsTopCdt, take });
    const newsListParam = buildAnnouncementHomeQuery({ condition: newsListCdt, take });
    const newsCateParam = buildCategoryQuery(PGID.Announcement);
    const newsTagParam = buildTagQuery(PGID.Announcement);

    const galleryTopCdt = buildGalleryHomeCondition({ lang: p.lang, nowIsoLocal, categoryIds: galleryCategoryIds, isTop: true });
    const galleryListCdt = buildGalleryHomeCondition({ lang: p.lang, nowIsoLocal, categoryIds: galleryCategoryIds, isTop: false });
    const galleryTopParam = buildGalleryHomeQuery({ condition: galleryTopCdt, take });
    const galleryListParam = buildGalleryHomeQuery({ condition: galleryListCdt, take });
    const galleryCateParam = buildCategoryQuery(PGID.Gallery);
    const galleryTagParam = buildTagQuery(PGID.Gallery);

    // 執行：建立 loaders（全部走 adapter.loader）
    const heroBannerLoader = banner.loader.createQueryDataLoader({ getInternalId: () => heroBannerInternalId, getApiInstance: () => ssrApi });
    const admissionsBannerLoader = banner.loader.createQueryDataLoader({ getInternalId: () => admissionsBannerInternalId, getApiInstance: () => ssrApi });
    const linksBannerLoader = banner.loader.createQueryListLoader({ getCondition: () => linksBannerParam, getApiInstance: () => ssrApi });

    const aboutWebLoader = web.loader.createQueryDataLoader({ getInternalId: () => aboutWebResourceInternalId, getApiInstance: () => ssrApi });
    const aboutPageLoader = page.loader.createQueryDataLoader({ getInternalId: () => aboutPageInternalId, getApiInstance: () => ssrApi });

    const newsTopLoader = announce.loader.createQueryListLoader({ getCondition: () => newsTopParam, getApiInstance: () => ssrApi });
    const newsListLoader = announce.loader.createQueryListLoader({ getCondition: () => newsListParam, getApiInstance: () => ssrApi });
    const newsCateLoader = cate.loader.createQueryListLoader({ getCondition: () => newsCateParam, getApiInstance: () => ssrApi });
    const newsTagLoader = tag.loader.createQueryListLoader({ getCondition: () => newsTagParam, getApiInstance: () => ssrApi });

    const galleryTopLoader = gallery.loader.createQueryListLoader({ getCondition: () => galleryTopParam, getApiInstance: () => ssrApi });
    const galleryListLoader = gallery.loader.createQueryListLoader({ getCondition: () => galleryListParam, getApiInstance: () => ssrApi });
    const galleryCateLoader = cate.loader.createQueryListLoader({ getCondition: () => galleryCateParam, getApiInstance: () => ssrApi });
    const galleryTagLoader = tag.loader.createQueryListLoader({ getCondition: () => galleryTagParam, getApiInstance: () => ssrApi });

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
    const heroBanner = takeFirstOrNull<BannerFormModel>(heroLD.apiRes.Data);
    const admissionsBanner = takeFirstOrNull<BannerFormModel>(admissionsLD.apiRes.Data);
    const linksBanner = (linksLD.apiRes.Data?.[0] ?? null) as BannerFormModel | null;
    const aboutWebResource = takeFirstOrNull<WebResourceFormModel>(aboutWebLD.apiRes.Data);
    const aboutPage = takeFirstOrNull<PageManagementFormModel>(aboutPageLD.apiRes.Data);
    const newsTopList = newsTopLD.apiRes.Data ?? [];
    const newsList = newsListLD.apiRes.Data ?? [];
    const newsMerged = takeTopThenFill(newsTopList, newsList, take, x => x?.InternalId ?? String(x?.AnnouncementId ?? ""));

    const newsCategories = newsCateLD.apiRes.Data ?? [];
    const newsTags = newsTagLD.apiRes.Data ?? [];

    const galleryTopList = galleryTopLD.apiRes.Data ?? [];
    const galleryList = galleryListLD.apiRes.Data ?? [];
    const galleryMerged = takeTopThenFill(galleryTopList, galleryList, take, x => x?.InternalId ?? String(x?.GalleryId ?? ""));

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
// #endregion

// #region Private
const takeTopThenFill = <T>(top: T[] | undefined, rest: T[] | undefined, limit: number, getKey: (x: T) => string): T[] =>
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
const buildAnnouncementHomeCondition = (p: { lang: Lang; nowIsoLocal: string; categoryIds: string; isTop: boolean; }): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(AnnouncementFields.Validate_Start, Operator.LessThanOrEqual, p.nowIsoLocal),
        `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        LibCondition.createCondition(AnnouncementFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(AnnouncementFields.ContentStatus, p.isTop ? Operator.BitwiseHasAny : Operator.BitwiseHasNone, 1),
        LibCondition.createCondition(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`, Operator.NotEqual, "", true),
        LibCondition.createCondition(AnnouncementFields.Categories, Operator.HasAny, p.categoryIds),
    ]);
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
        OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }, { Col: AnnouncementFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: p.take,
    };
};
const buildGalleryHomeCondition = (p: { lang: Lang; nowIsoLocal: string; categoryIds: string; isTop: boolean; }): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(GalleryFields.Validate_Start, Operator.LessThanOrEqual, p.nowIsoLocal),
        LibCondition.createCondition(GalleryFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(GalleryFields.ContentStatus, p.isTop ? Operator.BitwiseHasAny : Operator.BitwiseHasNone, 1),
        LibCondition.createCondition(`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`, Operator.NotEqual, "", true),
        LibCondition.createCondition(GalleryFields.Categories, Operator.HasAny, p.categoryIds),
    ]);
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
// #endregion
