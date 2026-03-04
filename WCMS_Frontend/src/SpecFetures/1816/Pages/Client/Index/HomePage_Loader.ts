import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tags/Tag_Api";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { Lang } from "@/SysCore/i18n/lang";
import type { components } from "@/types/api";
import {AnnouncementDetailFields,AnnouncementFields,CategoryDetailFields,CategoryFields,PGID,TagDataFields,TagDetailFields,} from "@/types/SchemaFields";
import type { LoaderFunctionArgs } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type BannerSet = components["schemas"]["BannerSet_DTO"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type CurrentOpenTime = components["schemas"]["SpecCurrentOpenTime_DTO"];

type ApiLoaderDataCompat<TArgs, TData> =
  | { args: TArgs; env: ApiResponse<TData> }
  | { args: TArgs; apiRes: ApiResponse<TData> };

const getEnv = <TArgs, TData>(d: ApiLoaderDataCompat<TArgs, TData>): ApiResponse<TData> => {
  // return：兼容舊版 apiRes / 新版 env 命名
  return "env" in d ? d.env : d.apiRes;
};

export interface HomePageRawData {
  linkIconsBanner: BannerSet | null;
  carouselBanner: BannerSet | null;
  collectionsBanner: BannerSet | null;
  specialLinkBanner: BannerSet | null;
  quickLinksBanner: BannerSet | null;

  currentOpenTime: CurrentOpenTime | null;

  newsList01: AnnouncementSet[];
  newsList02: AnnouncementSet[];
  newsList03: AnnouncementSet[];
  newsList04: AnnouncementSet[];
  newsCategories: CategorySet[];
  newsTags: TagSet[];
}

export interface HomePageLoaderArgs {
  lang: Lang;
  nowIsoLocal: string;

  linkIconsBannerInternalId: string;
  carouselBannerInternalId: string;
  collectionsBannerInternalId: string;
  specialLinkBannerInternalId: string;
  quickLinksBannerInternalId: string;

  newsTake: number;
  newsListParam01: QueryListParam;
  newsListParam02: QueryListParam;
  newsListParam03: QueryListParam;
  newsListParam04: QueryListParam;
  newsCateParam: QueryListParam;
  newsTagParam: QueryListParam;
}

export interface HomePageLoaderRes {
  rawData: HomePageRawData;
}

export interface HomePageLoaderData {
  args: HomePageLoaderArgs;
  res: HomePageLoaderRes;
}


// 1) nowIsoLocal 改成分鐘精度（秒=00、ms=000），避免每次請求都長得不一樣
const formatLocalIsoByMinute = (d: Date): string => {
  const pad2 = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  const y = d.getFullYear();
  const m = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const h = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${y}-${m}-${day}T${h}:${mi}:00.000`;
};

// 2) 首頁 loader 短 TTL cache（避免短時間內切語系/回首頁重打 12 包 API）
const HOME_CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 1 day

type CacheItem = { ts: number; data: HomePageLoaderData };
const homeLoaderCache = new Map<string, CacheItem>();

const getCacheKey = (lang: Lang, nowIsoLocal: string) => {const day = nowIsoLocal.slice(0, 10); return `${lang}|${day}`;};

const tryGetCache = (key: string): HomePageLoaderData | null => {
  const hit = homeLoaderCache.get(key);
  if (!hit) return null;
  if (Date.now() - hit.ts > HOME_CACHE_TTL_MS) {
    homeLoaderCache.delete(key);
    return null;
  }
  return hit.data;
};

const setCache = (key: string, data: HomePageLoaderData) => {
  homeLoaderCache.set(key, { ts: Date.now(), data });
};

const takeFirstOrNull = <T>(d: T | T[] | null | undefined): T | null => {
  // return：兼容後端偶發回傳 list 的狀況
  if (!d) return null;
  return Array.isArray(d) ? d[0] ?? null : d;
};

const buildCategoryQuery = (progId: string): QueryListParam => {
  // return
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
  // return
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

const buildAnnouncementHomeCondition = (p: { lang: Lang; nowIsoLocal: string; categoryId: string }): string => {
  // 宣告變數
  let cdt = "";
  cdt = LibMerge(" And ", false, cdt,
    // 執行：有效時間 + 非作廢
    `${AnnouncementFields.Validate_Start} <= ${p.nowIsoLocal}`,
    `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
    `${AnnouncementFields.ContentStatus} !& 4`,
    // 執行：語系 + 必填標題
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
    `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`
  );
  // 執行：分類（首頁 01~04）
  if (p.categoryId) cdt = LibMerge(" And ", false, cdt, `${AnnouncementFields.Categories} HasAny [${p.categoryId}]`);
  // return
  return cdt;
};

const buildAnnouncementHomeQuery = (p: { condition: string; take: number }): QueryListParam => {
  // return
  return {
    Fields: [
      AnnouncementFields.AnnouncementId,
      AnnouncementFields.InternalId,
      AnnouncementFields.Categories,
      AnnouncementFields.Tags,
      AnnouncementFields.ContentStatus,
      AnnouncementFields.Validate_Start,
      AnnouncementFields.Validate_End,
      AnnouncementFields.ViewCount,
      `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
      `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
    ],
    Condition: p.condition,
    RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
    OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }],
    PageNumber: 1,
    PageSize: p.take,
  };
};

const fetchCurrentOpenTime = async (opt: { ssrApi: ReturnType<typeof getSsrApi> }): Promise<CurrentOpenTime | null> => {
  // 宣告變數
  const url = `${PGID.Calendar}/Spec_GetCurrentOpenTime`;

  try {
    // 執行 function
    const res = await opt.ssrApi.get<ApiResponse<CurrentOpenTime[]>>(url);
    const env = res.data;

    // return
    if (!env?.IsSuccess) return null;
    return env.Data?.[0] ?? null;
  } catch {
    // return
    return null;
  }
};

const buildDefaultArgs = (lang: Lang): HomePageLoaderArgs => {
  // 宣告變數：固定 internalId（來自 1816 prototype/既有實作）
  const nowIsoLocal = formatLocalIsoByMinute(new Date());
  const linkIconsBannerInternalId = "aaf84f7c-3521-4288-9c2e-c75b43f14c56";
  const carouselBannerInternalId = "d35e52e6-aba0-411f-bff0-560181e8663b";
  const collectionsBannerInternalId = "5db9cbbe-9319-401c-ae40-1580f87b30e5";
  const specialLinkBannerInternalId = "4f41bd57-a112-4aed-9e5a-50e08f816ffd";
  const quickLinksBannerInternalId = "b74facc4-6b1c-4642-b148-0a0aca751279";

  // 宣告變數：News（01~04）
  const newsTake = 5;
  const newsListParam01 = buildAnnouncementHomeQuery({
    condition: buildAnnouncementHomeCondition({ lang, nowIsoLocal, categoryId: "1" }),
    take: newsTake,
  });
  const newsListParam02 = buildAnnouncementHomeQuery({
    condition: buildAnnouncementHomeCondition({ lang, nowIsoLocal, categoryId: "2" }),
    take: newsTake,
  });
  const newsListParam03 = buildAnnouncementHomeQuery({
    condition: buildAnnouncementHomeCondition({ lang, nowIsoLocal, categoryId: "3" }),
    take: newsTake,
  });
  const newsListParam04 = buildAnnouncementHomeQuery({
    condition: buildAnnouncementHomeCondition({ lang, nowIsoLocal, categoryId: "4" }),
    take: newsTake,
  });
  const newsCateParam = buildCategoryQuery(PGID.Announcement);
  const newsTagParam = buildTagQuery(PGID.Announcement);

  // return
  return {
    lang,
    nowIsoLocal,
    linkIconsBannerInternalId,
    carouselBannerInternalId,
    collectionsBannerInternalId,
    specialLinkBannerInternalId,
    quickLinksBannerInternalId,
    newsTake,
    newsListParam01,
    newsListParam02,
    newsListParam03,
    newsListParam04,
    newsCateParam,
    newsTagParam,
  };
};

/**
 * ✅ 1816 首頁 loader（對標 1818 HomePage_Loader.ts）
 * - SSR：一次撈完首頁所有區塊需要的資料
 * - CSR：各 section 用 adapter.hooks 以 args/initial 接手（hydration 不重抓）
 */
export const HomePageLoader = (p: { lang: Lang }) => async ({ request }: LoaderFunctionArgs): Promise<HomePageLoaderData> => {
  // 宣告變數
  const ssrApi = getSsrApi(request);
  const args = buildDefaultArgs(p.lang);

  const cacheKey = getCacheKey(args.lang, args.nowIsoLocal);
  const cached = tryGetCache(cacheKey);
  if (cached) return cached;

  const banner = BannerSliderAdapter(ssrApi);
  const announce = AnnouncementAdapter(ssrApi);
  const cate = CategoryAdapter(ssrApi);
  const tag = TagAdapter(ssrApi);

  // 執行：banner loaders
  const linkIconsLoader = banner.loader.createQueryDataLoader({ getInternalId: () => args.linkIconsBannerInternalId, getApiInstance: () => ssrApi });
  const carouselLoader = banner.loader.createQueryDataLoader({ getInternalId: () => args.carouselBannerInternalId, getApiInstance: () => ssrApi });
  const collectionsLoader = banner.loader.createQueryDataLoader({ getInternalId: () => args.collectionsBannerInternalId, getApiInstance: () => ssrApi });
  const specialLinkLoader = banner.loader.createQueryDataLoader({ getInternalId: () => args.specialLinkBannerInternalId, getApiInstance: () => ssrApi });
  const quickLinksLoader = banner.loader.createQueryDataLoader({ getInternalId: () => args.quickLinksBannerInternalId, getApiInstance: () => ssrApi });

  // 執行：news/category/tag loaders
  const news01Loader = announce.loader.createQueryListLoader({ getCondition: () => args.newsListParam01, getApiInstance: () => ssrApi });
  const news02Loader = announce.loader.createQueryListLoader({ getCondition: () => args.newsListParam02, getApiInstance: () => ssrApi });
  const news03Loader = announce.loader.createQueryListLoader({ getCondition: () => args.newsListParam03, getApiInstance: () => ssrApi });
  const news04Loader = announce.loader.createQueryListLoader({ getCondition: () => args.newsListParam04, getApiInstance: () => ssrApi });
  const cateLoader = cate.loader.createQueryListLoader({ getCondition: () => args.newsCateParam, getApiInstance: () => ssrApi });
  const tagLoader = tag.loader.createQueryListLoader({ getCondition: () => args.newsTagParam, getApiInstance: () => ssrApi });

  // 執行：一次撈完
  const [linkLD, carouselLD, collectionsLD, specialLD, quickLD, news01LD, news02LD, news03LD, news04LD, cateLD, tagLD, openTime] = await Promise.all([
    linkIconsLoader({ request } as LoaderFunctionArgs),
    carouselLoader({ request } as LoaderFunctionArgs),
    collectionsLoader({ request } as LoaderFunctionArgs),
    specialLinkLoader({ request } as LoaderFunctionArgs),
    quickLinksLoader({ request } as LoaderFunctionArgs),
    news01Loader({ request } as LoaderFunctionArgs),
    news02Loader({ request } as LoaderFunctionArgs),
    news03Loader({ request } as LoaderFunctionArgs),
    news04Loader({ request } as LoaderFunctionArgs),
    cateLoader({ request } as LoaderFunctionArgs),
    tagLoader({ request } as LoaderFunctionArgs),
    fetchCurrentOpenTime({ ssrApi }),
  ]);

  // 宣告變數：整理資料（只保留 Data）
  const linkIconsBanner = takeFirstOrNull<BannerSet>(getEnv(linkLD).Data);
  const carouselBanner = takeFirstOrNull<BannerSet>(getEnv(carouselLD).Data);
  const collectionsBanner = takeFirstOrNull<BannerSet>(getEnv(collectionsLD).Data);
  const specialLinkBanner = takeFirstOrNull<BannerSet>(getEnv(specialLD).Data);
  const quickLinksBanner = takeFirstOrNull<BannerSet>(getEnv(quickLD).Data);

  const newsList01 = getEnv(news01LD).Data ?? [];
  const newsList02 = getEnv(news02LD).Data ?? [];
  const newsList03 = getEnv(news03LD).Data ?? [];
  const newsList04 = getEnv(news04LD).Data ?? [];

  const newsCategories = getEnv(cateLD).Data ?? [];
  const newsTags = getEnv(tagLD).Data ?? [];

  const result: HomePageLoaderData = {
    args,
    res: {
      rawData: {
        linkIconsBanner,
        carouselBanner,
        collectionsBanner,
        specialLinkBanner,
        quickLinksBanner,
        currentOpenTime: openTime,
        newsList01,
        newsList02,
        newsList03,
        newsList04,
        newsCategories,
        newsTags,
  } },
  };
  setCache(cacheKey, result);
  return result;
};