import { useClientDataQueryTemplate, type ClientDataQueryDataSourceResult, type ClientDataQueryTemplate } from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecHomePage1821Adapter } from "@/SpecFetures/1821/Hooks/WEB/HomePage_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type SpecHomePage1821Set = components["schemas"]["SpecHomePage1821Set_DTO"];
type HomePageModel = components["schemas"]["SpecHomePage1821Model_DTO"];
type BannerModel = components["schemas"]["SpecHomePage1821_Banner_DTO"];
type ShortcutModel = components["schemas"]["SpecHomePage1821_Shortcut_DTO"];
type FeatureCardModel = components["schemas"]["SpecHomePage1821_FeatureCard_DTO"];
type RelatedLinkModel = components["schemas"]["SpecHomePage1821_RelatedLink_DTO"];

type HomePageTemplate = ClientDataQueryTemplate<HomePageTemplateQueryParam, HomePageRawData | null, HomePageLoaderData | null, unknown, HomePageTemplateQueryParam, HomePageLoaderData>;

interface HomePageTemplateQueryParam
{
    lang: Lang;
}

export interface HomePageRawData
{
    homePage: HomePageModel | null;
    banners: BannerModel[];
    shortcuts: ShortcutModel[];
    featureCards: FeatureCardModel[];
    relatedLinks: RelatedLinkModel[];
}

export interface HomePageLoaderArgs
{
    lang: Lang;
    internalId: string;
}

export interface HomePageLoaderRes
{
    rawData: HomePageRawData;
    setData: SpecHomePage1821Set | null;
}

export interface HomePageLoaderData
{
    args: HomePageLoaderArgs;
    res: HomePageLoaderRes;
}
// #endregion

// #region Public
/** 建立首頁 loader 參數 */
export const buildHomePageLoaderArgs = (p: { lang: Lang; internalId: string; }): HomePageLoaderArgs =>
{
    return { lang: p.lang, internalId: getSafeString(p.internalId) };
};

/** 1821 招生首頁 loader */
export const HomePageLoader = (props: { lang: Lang; }) => async (args: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    const api = getSsrApi(args.request);
    const adapter = SpecHomePage1821Adapter(api);
    const internalId = await resolveHomePageInternalId(args, adapter, props.lang);
    const loaderArgs = buildHomePageLoaderArgs({ lang: props.lang, internalId });

    if (!loaderArgs.internalId) return buildEmptyLoaderData(loaderArgs);

    const setData = await loadHomePageSet(args, adapter, loaderArgs.internalId);
    const rawData = normalizeSetData(setData);

    return { args: loaderArgs, res: { rawData, setData } };
};

/** CSR Hook：首頁統一進入前台 DataQueryTemplate 管線 */
export const useHomePageTemplateData = (lang: Lang) =>
{
    const template = useMemo(() => createHomePageTemplate(lang), [lang]);
    const templateVm = useClientDataQueryTemplate(template);

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

/** 過濾未隱藏資料 */
const filterVisible = <T extends { IsHide?: boolean | null; }>(rows?: T[] | null) =>
{
    return (rows ?? []).filter((item) => item.IsHide !== true);
};

/** 建立空資料 */
const createEmptyRawData = (): HomePageRawData =>
{
    return { homePage: null, banners: [], shortcuts: [], featureCards: [], relatedLinks: [] };
};

/** 建立空 loader data */
const buildEmptyLoaderData = (args: HomePageLoaderArgs): HomePageLoaderData =>
{
    return { args, res: { rawData: createEmptyRawData(), setData: null } };
};

/** 正規化首頁 set */
const normalizeSetData = (setData: SpecHomePage1821Set | null): HomePageRawData =>
{
    if (!setData) return createEmptyRawData();

    return {
        homePage: setData.SpecHomePage1821 ?? null,
        banners: sortByRowId(filterVisible(setData.SpecHomePage1821_Banner)),
        shortcuts: sortByRowId(filterVisible(setData.SpecHomePage1821_Shortcut)).slice(0, 5),
        featureCards: sortByRowId(filterVisible(setData.SpecHomePage1821_FeatureCard)).slice(0, 2),
        relatedLinks: sortByRowId(filterVisible(setData.SpecHomePage1821_RelatedLink)),
    };
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

/** 從清單列資料取出 InternalId */
const getInternalIdFromListRow = (row?: SpecHomePage1821Set | null) =>
{
    return getSafeString(row?.SpecHomePage1821?.InternalId);
};

/** 讀首頁第一筆清單資料 */
const loadFirstHomePageRow = async (args: LoaderFunctionArgs, adapter: ReturnType<typeof SpecHomePage1821Adapter>, condition: QueryListParam) =>
{
    const api = getSsrApi(args.request);
    const queryListLoader = adapter.loader.createQueryListLoader({ getApiInstance: () => api, getCondition: () => condition });
    const env = await queryListLoader(args);
    const list = (env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : []) as SpecHomePage1821Set[];

    return list[0] ?? null;
};

/** 依 InternalId 讀首頁完整資料 */
const loadHomePageSet = async (args: LoaderFunctionArgs, adapter: ReturnType<typeof SpecHomePage1821Adapter>, internalId: string) =>
{
    if (!internalId) return null;

    const api = getSsrApi(args.request);
    const queryDataLoader = adapter.loader.createQueryDataLoader({ getApiInstance: () => api, getInternalId: () => internalId });
    const env = await queryDataLoader(args);

    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? null) : null;
};

/** 依語系解析首頁 InternalId，找不到時回退預設語系 */
const resolveHomePageInternalId = async (args: LoaderFunctionArgs, adapter: ReturnType<typeof SpecHomePage1821Adapter>, lang: Lang): Promise<string> =>
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

/** 建立首頁 DataQuery Template */
const createHomePageTemplate = (lang: Lang): HomePageTemplate =>
{
    return {
        featureKey: "Spec1821.HomePage",
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

/** DataSource：首頁以 SSR loaderData 為主 */
const useHomePageTemplateDataSource = (ctx: { loaderData: HomePageLoaderData | null; }): ClientDataQueryDataSourceResult<HomePageRawData | null> =>
{
    const rawData = ctx.loaderData?.res?.rawData ?? null;
    return { rawData, isLoading: false, errors: [], paginator: null };
};
// #endregion
