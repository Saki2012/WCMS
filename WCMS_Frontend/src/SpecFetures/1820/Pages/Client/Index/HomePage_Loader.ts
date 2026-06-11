import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { type ClientDataQueryDataSourceResult, type ClientDataQueryTemplate, useClientDataQueryTemplate } from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecHomePage1820Adapter, type WeatherLoaderData } from "@/SpecFetures/1820/Hooks/WEB/HomePage_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { LibCondition, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import { AnnouncementDetailFields, AnnouncementFields, PGID } from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecHomePage1820Set = components["schemas"]["SpecHomePage1820Set_DTO"];

type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];

type BannerModel = components["schemas"]["SpecHomePage1820_BannerMedia_DTO"];

type DetailModel = components["schemas"]["SpecHomePage1820_Detail_DTO"];

type MarqueeModel = components["schemas"]["SpecHomePage1820_Marquee_DTO"];

type ResourceModel = components["schemas"]["SpecHomePage1820_Resource_DTO"];

type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];

export interface HomePageRawData
{
    homePage: HomePageModel | null;
    banners: BannerModel[];
    details: DetailModel[];
    marquees: MarqueeModel[];
    resources: ResourceModel[];
    announcements: AnnouncementSet[];
    announcementCategoryMap: Record<string, string>;
}

export interface HomePageLoaderArgs
{
    lang: Lang;
    internalId: string;
}

export interface HomePageLoaderRes
{
    rawData: HomePageRawData;
    setData: SpecHomePage1820Set | null;
    weatherInitial: WeatherLoaderData | null;
}

export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}

interface HomePageTemplateQueryParam
{
    lang: Lang;
}

type HomePageTemplate = ClientDataQueryTemplate<HomePageTemplateQueryParam, HomePageRawData | null, HomePageLoaderData | null, unknown, HomePageTemplateQueryParam, HomePageLoaderData>;
// #endregion

// #region Public
/** 建立 loader args */
export const buildHomePageLoaderArgs = (p: { lang: Lang; internalId: string; }): HomePageLoaderArgs =>
{
    return { lang: p.lang, internalId: getSafeString(p.internalId) };
};

/** 1820 首頁 loader */
/** 1820 首頁 loader */

export const HomePageLoader = (props: { lang: Lang; }) => async (args: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    const api = getSsrApi(args.request);
    const adapter = SpecHomePage1820Adapter(api);
    const announcementAdapter = AnnouncementAdapter(api);
    const categoryAdapter = CategoryAdapter(api);

    const internalId = await resolveHomePageInternalId(args, adapter, props.lang);
    const loaderArgs = buildHomePageLoaderArgs({ lang: props.lang, internalId });

    if (!loaderArgs.internalId)
    {
        return { args: loaderArgs, res: { rawData: createEmptyRawData(), setData: null, weatherInitial: null } };
    }

    const setData = await loadHomePageSet(args, adapter, loaderArgs.internalId);
    const rawData = normalizeSetData(setData);

    const announcementParam = buildAnnouncementQueryParam({ lang: props.lang, categoryIds: rawData.homePage?.AnnouncementCategoryIds });

    const [announcements, announcementCategoryMap, weatherInitial] = await Promise.all([
        loadAnnouncementList(args, announcementAdapter, announcementParam),
        loadAnnouncementCategoryMap(args, categoryAdapter, props.lang),
        loadWeatherInitial(args, adapter),
    ]);

    return { args: loaderArgs, res: { rawData: { ...rawData, announcements, announcementCategoryMap }, setData, weatherInitial } };
};

/** CSR Hook：首頁統一透過 Client_DataQueryTemplate 取資料 */

export const useHomePageTemplateData = (lang: Lang) =>
{
    // 宣告變數
    const template = useMemo(() => createHomePageTemplate(lang), [lang]);
    const templateVm = useClientDataQueryTemplate(template);

    // return
    return { loaderData: templateVm.viewModel, rawData: templateVm.rawData, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
// #endregion

// #region Private
/** 取得安全字串 */

const getSafeString = (value?: string | null) =>
{
    return `${value ?? ""}`.trim();
};

/** 跳脫查詢字串 */
const escapeQueryValue = (value?: string | null) =>
{
    return getSafeString(value).replace(/"/g, `""`);
};

/** 依 RowId 排序 */
const sortByRowId = <T extends { RowId?: number | null; }>(rows?: T[] | null) =>
{
    return [...(rows ?? [])].sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
};

/** 建立空資料 */
const createEmptyRawData = (): HomePageRawData =>
{
    return { homePage: null, banners: [], details: [], marquees: [], resources: [], announcements: [], announcementCategoryMap: {} };
};

/** 正規化首頁 set */
const normalizeSetData = (setData: SpecHomePage1820Set | null): HomePageRawData =>
{
    if (!setData) return createEmptyRawData();

    return {
        homePage: setData.SpecHomePage1820 ?? null,
        banners: sortByRowId(setData.SpecHomePage1820_BannerMedia),
        details: sortByRowId(setData.SpecHomePage1820_Detail),
        marquees: sortByRowId(setData.SpecHomePage1820_Marquee),
        resources: sortByRowId(setData.SpecHomePage1820_Resource),
        announcements: [],
        announcementCategoryMap: {},
    };
};

/** 讀取公告分類名稱對照 */
const loadAnnouncementCategoryMap = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof CategoryAdapter>,
    lang: Lang,
): Promise<Record<string, string>> =>
{
    const api = getSsrApi(args.request);

    const mapLoader = adapter.loader.createMapByProgIdLoader({ progId: PGID.Announcement, lang, getApiInstance: () => api });

    const env = await mapLoader(args);
    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? {}) : {};
};

/** 建立首頁 queryList 條件 */
const buildHomePageQueryParam = (lang?: Lang): QueryListParam =>
{
    const safeLang = escapeQueryValue(lang);

    return {
        Fields: ["InternalId", "Lang", "CreateTime", "ModifyTime"],
        Condition: safeLang ? `Lang = "${safeLang}"` : "",
        OrderBy: [{ Col: "ModifyTime", Desc: true }, { Col: "CreateTime", Desc: true }],
        PageNumber: 1,
        PageSize: 1,
    };
};

/** 從 queryList 的列資料取出 InternalId */
const getInternalIdFromListRow = (row?: SpecHomePage1820Set | null) =>
{
    if (!row) return "";

    if ("InternalId" in row) return getSafeString(row.SpecHomePage1820?.InternalId);
    return getSafeString(row.SpecHomePage1820?.InternalId);
};

/** 讀首頁第一筆清單資料 */
const loadFirstHomePageRow = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof SpecHomePage1820Adapter>,
    condition: QueryListParam,
): Promise<SpecHomePage1820Set | null> =>
{
    const api = getSsrApi(args.request);

    const queryListLoader = adapter.loader.createQueryListLoader({ getApiInstance: () => api, getCondition: () => condition });

    const env = await queryListLoader(args);
    const list = (env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : []) as SpecHomePage1820Set[];

    return list[0] ?? null;
};

/** 依 InternalId 讀首頁完整資料 */
const loadHomePageSet = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof SpecHomePage1820Adapter>,
    internalId: string,
): Promise<SpecHomePage1820Set | null> =>
{
    if (!internalId) return null;

    const api = getSsrApi(args.request);

    const queryDataLoader = adapter.loader.createQueryDataLoader({ getApiInstance: () => api, getInternalId: () => internalId });

    const env = await queryDataLoader(args);
    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? null) : null;
};

/** 依語系解析首頁 InternalId */
const resolveHomePageInternalId = async (args: LoaderFunctionArgs, adapter: ReturnType<typeof SpecHomePage1820Adapter>, lang: Lang): Promise<string> =>
{
    const currentRow = await loadFirstHomePageRow(args, adapter, buildHomePageQueryParam(lang));
    const currentId = getInternalIdFromListRow(currentRow);
    if (currentId) return currentId;

    const defaultRow = await loadFirstHomePageRow(args, adapter, buildHomePageQueryParam("zh-tw"));
    const defaultId = getInternalIdFromListRow(defaultRow);
    if (defaultId) return defaultId;

    const anyRow = await loadFirstHomePageRow(args, adapter, buildHomePageQueryParam());
    return getInternalIdFromListRow(anyRow);
};

/** 轉查詢時間字串 */
const formatQueryDateTime = (value: Date) =>
{
    const pad = (num: number) => `${num}`.padStart(2, "0");
    const yyyy = value.getFullYear();
    const mm = pad(value.getMonth() + 1);
    const dd = pad(value.getDate());
    const hh = pad(value.getHours());
    const mi = pad(value.getMinutes());
    const ss = pad(value.getSeconds());

    return `${yyyy}-${mm}-${dd}T${hh}:${mi}:${ss}`;
};

/** 建立公告查詢條件 */
const buildAnnouncementCondition = (p: { lang: Lang; categoryIds?: string | null; }) =>
{
    const nowText = formatQueryDateTime(new Date());
    const categoryIds = getSafeString(p.categoryIds);
    if (!categoryIds) return "";

    return LibCondition.joinConditions([
        LibCondition.createCondition(AnnouncementFields.Validate_Start, Operator.LessThanOrEqual, nowText),
        `(${AnnouncementFields.Validate_End} >= ${nowText} Or ${AnnouncementFields.Validate_End} is null)`,
        LibCondition.createCondition(AnnouncementFields.ContentStatus, Operator.BitwiseHasNone, 4),
        LibCondition.createCondition(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`, Operator.Equal, p.lang),
        LibCondition.createCondition(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`, Operator.NotEqual, "", true),
        LibCondition.createCondition(AnnouncementFields.Categories, Operator.HasAny, categoryIds),
    ]);
};
/** 建立公告 queryList 條件 */
const buildAnnouncementQueryParam = (p: { lang: Lang; categoryIds?: string | null; }): QueryListParam | null =>
{
    const condition = buildAnnouncementCondition(p);
    if (!condition) return null;
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.InternalId,
            AnnouncementFields.ContentStatus,
            AnnouncementFields.PictureId,
            AnnouncementFields.PicDescription,
            AnnouncementFields.Categories,
            AnnouncementFields.Validate_Start,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.SubTitle}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Content}`,
        ],
        Condition: condition,
        RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }, { Col: AnnouncementFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 12,
    };
};

/** 讀取首頁天氣資料 */
const loadWeatherInitial = async (args: LoaderFunctionArgs, adapter: ReturnType<typeof SpecHomePage1820Adapter>): Promise<WeatherLoaderData | null> =>
{
    const api = getSsrApi(args.request);

    const weatherLoader = adapter.loader.createWeatherLoader({ getApiInstance: () => api });

    const env = await weatherLoader(args);
    return env?.apiRes?.IsSuccess ? env : null;
};

/** 讀取首頁公告清單 */
const loadAnnouncementList = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof AnnouncementAdapter>,
    condition: QueryListParam | null,
): Promise<AnnouncementSet[]> =>
{
    if (!condition) return [];

    const api = getSsrApi(args.request);

    const queryListLoader = adapter.loader.createQueryListLoader({ getApiInstance: () => api, getCondition: () => condition });

    const env = await queryListLoader(args);
    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : [];
};
/** 建立首頁 DataQuery Template，讓首頁資料流程也進入前台 Template 管線 */
const createHomePageTemplate = (lang: Lang): HomePageTemplate =>
{
    // return
    return {
        featureKey: "Spec1820.HomePage",
        dataMode: "single",
        initialViewState: { pageNumber: 1, pageSize: 1 },
        pagination: null,
        searchBar: null,
        spec: {
            toSearchParams: () => ({ lang }),
            buildQueryParam: ({ searchParams }) => searchParams,
            useDataSource: (ctx) => useHomePageTemplateDataSource(ctx),
            buildViewModel: ({ loaderData }) => loaderData ?? null,
        },
    };
};

/** DataSource：首頁目前以 SSR loaderData 為主，先統一掛入 Template 流程 */
const useHomePageTemplateDataSource = (ctx: { loaderData: HomePageLoaderData | null; }): ClientDataQueryDataSourceResult<HomePageRawData | null> =>
{
    // 宣告變數
    const rawData = ctx.loaderData?.res?.rawData ?? null;

    // return
    return { rawData, isLoading: false, errors: [], paginator: null };
};
// #endregion
