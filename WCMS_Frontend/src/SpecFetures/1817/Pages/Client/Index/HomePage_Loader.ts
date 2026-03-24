import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/BannerSlider_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import {
  AnnouncementDetailFields,
  AnnouncementFields,
  CategoryDetailFields,
  CategoryFields,
  PGID,
  TagDataFields,
  TagDetailFields,
} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];

type ApiLoaderDataCompat<TArgs, TData> =
  | { args: TArgs; env: ApiResponse<TData> }
  | { args: TArgs; apiRes: ApiResponse<TData> };

const getEnv = <TArgs, TData>(
  data: ApiLoaderDataCompat<TArgs, TData>,
): ApiResponse<TData> => {
  // return：兼容舊版 env / 新版 apiRes
  return "env" in data ? data.env : data.apiRes;
};

const takeFirstOrNull = <T,>(data: T | T[] | null | undefined): T | null => {
  // return：兼容偶發單筆 / 陣列回傳
  if (!data) return null;
  return Array.isArray(data) ? (data[0] ?? null) : data;
};

const formatLocalIsoByMinute = (date: Date): string => {
  // 宣告變數：補 0
  const pad2 = (num: number) => {
    return num < 10 ? `0${num}` : `${num}`;
  };

  // return：固定到分鐘精度，避免秒數造成 loader args 每次不同
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}T${pad2(date.getHours())}:${pad2(date.getMinutes())}:00.000`;
};

const buildCategoryQuery = (progId: string): QueryListParam => {
  // return：首頁公告共用分類
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

const buildTagQuery = (progId: string): QueryListParam => {
  // return：首頁公告共用標籤
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

const buildAnnouncementCondition = (props: {
  lang: Lang;
  nowIsoLocal: string;
  categoryIds: string;
}): string => {
  // return：1817 首頁公告條件
  return LibMerge(
    " And ",
    false,
    `${AnnouncementFields.ContentStatus} !& 4`,
    `${AnnouncementFields.Validate_Start} <= ${props.nowIsoLocal}`,
    `(${AnnouncementFields.Validate_End} >= ${props.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${props.lang}`,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    props.categoryIds
      ? `${AnnouncementFields.Categories} HasAny [${props.categoryIds}]`
      : "",
  );
};

const buildAnnouncementQuery = (props: {
  lang: Lang;
  nowIsoLocal: string;
  categoryIds: string;
  take: number;
}): QueryListParam => {
  // 宣告變數：條件
  const condition = buildAnnouncementCondition({
    lang: props.lang,
    nowIsoLocal: props.nowIsoLocal,
    categoryIds: props.categoryIds,
  });

  // return：單一 query，置頂優先，再依日期排序
  return {
    Fields: [
      AnnouncementFields.AnnouncementId,
      AnnouncementFields.InternalId,
      AnnouncementFields.Categories,
      AnnouncementFields.Tags,
      AnnouncementFields.ContentStatus,
      AnnouncementFields.Validate_Start,
      AnnouncementFields.Validate_End,
      AnnouncementFields.PictureId,
      `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
      `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
      `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
    ],
    Condition: condition,
    RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
    OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
    PageNumber: 1,
    PageSize: props.take,
  };
};

export interface HomePageRawData {
  carouselBanner: BannerSet | null;
  specialLinkBanner: BannerSet | null;
  newsList: AnnouncementSet[];
  exhibitionList: AnnouncementSet[];
  announcementCategories: CategorySet[];
  announcementTags: TagSet[];
}

export interface HomePageLoaderArgs {
  lang: Lang;
  nowIsoLocal: string;
  carouselBannerInternalId: string;
  specialLinkBannerInternalId: string;
  newsListParam: QueryListParam;
  exhibitionListParam: QueryListParam;
  categoryParam: QueryListParam;
  tagParam: QueryListParam;
}

export interface HomePageLoaderRes {
  rawData: HomePageRawData;
}

export interface HomePageLoaderData {
  args: HomePageLoaderArgs;
  res: HomePageLoaderRes;
}

const buildDefaultArgs = (lang: Lang): HomePageLoaderArgs => {
  // 宣告變數：時間
  const nowIsoLocal = formatLocalIsoByMinute(new Date());

  // 宣告變數：1817 首頁固定 banner internalId
  const carouselBannerInternalId = "41d46011-6fd7-4da4-917f-c917fa034c19";
  const specialLinkBannerInternalId = "9a09525e-e4e8-4d5a-9a33-c42e8430508b";

  // 宣告變數：1817 首頁公告分類
  const newsCategoryIds = "Category20251125001,Category20251125002";
  const exhibitionCategoryIds =
    "Category20251125003,Category20251125004,Category20251125005";

  // 宣告變數：首頁只取 6 筆
  const take = 6;

  // return：首頁 loader args
  return {
    lang,
    nowIsoLocal,
    carouselBannerInternalId,
    specialLinkBannerInternalId,
    newsListParam: buildAnnouncementQuery({
      lang,
      nowIsoLocal,
      categoryIds: newsCategoryIds,
      take,
    }),
    exhibitionListParam: buildAnnouncementQuery({
      lang,
      nowIsoLocal,
      categoryIds: exhibitionCategoryIds,
      take,
    }),
    categoryParam: buildCategoryQuery(PGID.Announcement),
    tagParam: buildTagQuery(PGID.Announcement),
  };
};

export const HomePageLoader =
  (props: { lang: Lang }) =>
  async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> => {
    // 宣告變數：SSR api / args / adapter
    const ssrApi = getSsrApi(request);
    const args = buildDefaultArgs(props.lang);

    const bannerAdapter = BannerSliderAdapter(ssrApi);
    const announcementAdapter = AnnouncementAdapter(ssrApi);
    const categoryAdapter = CategoryAdapter(ssrApi);
    const tagAdapter = TagAdapter(ssrApi);

    // 宣告變數：banner loaders
    const carouselLoader = bannerAdapter.loader.createQueryDataLoader({
      getInternalId: () => args.carouselBannerInternalId,
      getApiInstance: () => ssrApi,
    });

    const specialLinkLoader = bannerAdapter.loader.createQueryDataLoader({
      getInternalId: () => args.specialLinkBannerInternalId,
      getApiInstance: () => ssrApi,
    });

    // 宣告變數：announcement/category/tag loaders
    const newsLoader = announcementAdapter.loader.createQueryListLoader({
      getCondition: () => args.newsListParam,
      getApiInstance: () => ssrApi,
    });

    const exhibitionLoader =
      announcementAdapter.loader.createQueryListLoader({
        getCondition: () => args.exhibitionListParam,
        getApiInstance: () => ssrApi,
      });

    const categoryLoader = categoryAdapter.loader.createQueryListLoader({
      getCondition: () => args.categoryParam,
      getApiInstance: () => ssrApi,
    });

    const tagLoader = tagAdapter.loader.createQueryListLoader({
      getCondition: () => args.tagParam,
      getApiInstance: () => ssrApi,
    });

    // 執行 function：首頁所需資料一次抓完
    const [
      carouselLoaderData,
      specialLinkLoaderData,
      newsLoaderData,
      exhibitionLoaderData,
      categoryLoaderData,
      tagLoaderData,
    ] = await Promise.all([
      carouselLoader({ request } as LoaderFunctionArgs),
      specialLinkLoader({ request } as LoaderFunctionArgs),
      newsLoader({ request } as LoaderFunctionArgs),
      exhibitionLoader({ request } as LoaderFunctionArgs),
      categoryLoader({ request } as LoaderFunctionArgs),
      tagLoader({ request } as LoaderFunctionArgs),
    ]);

    // 宣告變數：整理 data
    const carouselBanner = takeFirstOrNull<BannerSet>(
      getEnv(carouselLoaderData).Data,
    );

    const specialLinkBanner = takeFirstOrNull<BannerSet>(
      getEnv(specialLinkLoaderData).Data,
    );

    const newsList = getEnv(newsLoaderData).Data ?? [];
    const exhibitionList = getEnv(exhibitionLoaderData).Data ?? [];
    const announcementCategories = getEnv(categoryLoaderData).Data ?? [];
    const announcementTags = getEnv(tagLoaderData).Data ?? [];

    // return：給首頁與 section hooks hydration 使用
    return {
      args,
      res: {
        rawData: {
          carouselBanner,
          specialLinkBanner,
          newsList,
          exhibitionList,
          announcementCategories,
          announcementTags,
        },
      },
    };
  };