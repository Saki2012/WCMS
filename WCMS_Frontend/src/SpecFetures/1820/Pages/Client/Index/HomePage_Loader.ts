import { SpecHomePage1820Adapter } from "@/SpecFetures/1820/Hooks/WEB/HomePage_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import type { LoaderFunctionArgs } from "react-router-dom";

type SpecHomePage1820Set = components["schemas"]["SpecHomePage1820Set_DTO"];
type HomePageModel = components["schemas"]["SpecHomePage1820Model_DTO"];
type BannerModel = components["schemas"]["SpecHomePage1820_BannerMedia_DTO"];
type DetailModel = components["schemas"]["SpecHomePage1820_Detail_DTO"];
type MarqueeModel = components["schemas"]["SpecHomePage1820_Marquee_DTO"];
type ResourceModel = components["schemas"]["SpecHomePage1820_Resource_DTO"];

export interface HomePageRawData
{
    homePage: HomePageModel | null;
    banners: BannerModel[];
    details: DetailModel[];
    marquees: MarqueeModel[];
    resources: ResourceModel[];
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
}

export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}

/** 先放固定值，之後再改成站台設定或 route 帶入 */
const HOME_PAGE_INTERNAL_ID = "";

/** 取得安全字串 */
const getSafeString = (value?: string | null) =>
{
    return `${value ?? ""}`.trim();
};

/** 取得語系 */
const resolveLang = (args: LoaderFunctionArgs): Lang =>
{
    const lang = getSafeString(args.params?.lang).toLowerCase();
    return (lang || "zh-tw") as Lang;
};

/** 依 RowId 排序 */
const sortByRowId = <T extends { RowId?: number | null; }>(rows?: T[] | null) =>
{
    return [...(rows ?? [])].sort((a, b) => (a.RowId ?? 0) - (b.RowId ?? 0));
};

/** 建立空資料 */
const createEmptyRawData = (): HomePageRawData =>
{
    return {
        homePage: null,
        banners: [],
        details: [],
        marquees: [],
        resources: [],
    };
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
    };
};

/** 建立 loader args */
export const buildHomePageLoaderArgs = (p: { lang: Lang; internalId: string; }): HomePageLoaderArgs =>
{
    return {
        lang: p.lang,
        internalId: getSafeString(p.internalId),
    };
};

/** 1820 首頁 loader */
export const HomePage_Loader = async (args: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    const lang = resolveLang(args);
    const loaderArgs = buildHomePageLoaderArgs({
        lang,
        internalId: HOME_PAGE_INTERNAL_ID,
    });

    if (!loaderArgs.internalId)
    {
        return {
            args: loaderArgs,
            res: {
                rawData: createEmptyRawData(),
                setData: null,
            },
        };
    }

    const api = getSsrApi(args);
    const adapter = SpecHomePage1820Adapter(api);

    const queryDataLoader = adapter.loader.createQueryDataLoader({
        getApiInstance: () => api,
        getInternalId: () => loaderArgs.internalId,
    });

    const env = await queryDataLoader(args);
    const setData = env.apiRes.IsSuccess ? (env.apiRes.Data ?? null) : null;
    const rawData = normalizeSetData(setData);

    return {
        args: loaderArgs,
        res: {
            rawData,
            setData,
        },
    };
};
