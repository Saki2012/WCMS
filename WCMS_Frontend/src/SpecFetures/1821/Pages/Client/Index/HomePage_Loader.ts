import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import {
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryTemplate,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { SpecHomePage1821Adapter } from "@/SpecFetures/1821/Hooks/WEB/HomePage_Api";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import {
    formatLocalIso,
    LibCondition,
    Operator,
} from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    FileArchiveDetailFields,
    FileArchiveFields,
    FileArchiveInfoFields,
    FileArchiveUrlDetailFields,
    FileManageModelFields,
    SpecHomePage1821ModelFields,
    WebResourceFields,
    WebResourceInfoFields,
} from "@/types/SchemaFields";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type SpecHomePage1821Model = components["schemas"]["SpecHomePage1821Model_DTO"];
type SpecHomePage1821Set = components["schemas"]["SpecHomePage1821Set_DTO"];
type SpecHomePage1821Banner = components["schemas"]["SpecHomePage1821_Banner_DTO"];
type SpecHomePage1821Shortcut = components["schemas"]["SpecHomePage1821_Shortcut_DTO"];
type SpecHomePage1821ShortcutModuleItem = components["schemas"]["SpecHomePage1821_ShortcutModuleItem_DTO"];
type SpecHomePageModuleType = components["schemas"]["SpecHomePageModuleType"];
type HomePageModuleTypeValue = Exclude<SpecHomePageModuleType, 0>;

interface HomePageOptions
{
    categoryIds: string;
    tagIds: string;
}

interface HomePageShortcutModuleViewModel
{
    setting: SpecHomePage1821ShortcutModuleItem;
    moduleType: HomePageModuleTypeValue;
    announcementList: AnnouncementSet[];
    fileArchiveList: FileArchiveSet[];
}

interface HomePageShortcutViewModel
{
    shortcut: SpecHomePage1821Shortcut;
    modules: HomePageShortcutModuleViewModel[];
}

interface HomePageFeatureCardViewModel
{
    key: string;
    title: string;
    pictureId: string;
    pictureDescription: string;
}

interface HomePageLinkViewModel
{
    key: string;
    title: string;
    url: string;
    pictureId: string;
    pictureDescription: string;
}

const HomePageModuleType = {
    Announcement: 1,
    FileArchive: 2,
} as const satisfies Record<string, HomePageModuleTypeValue>;
const MAX_SHORTCUT_ITEMS = 6;

type HomePageTemplate = ClientDataQueryTemplate<
    HomePageTemplateQueryParam,
    HomePageRawData | null,
    HomePageLoaderData | null,
    unknown,
    HomePageTemplateQueryParam,
    HomePageLoaderData
>;

interface HomePageTemplateQueryParam
{
    lang: Lang;
}

export interface HomePageRawData
{
    homePage: SpecHomePage1821Model | null;
    banners: SpecHomePage1821Banner[];
    shortcuts: HomePageShortcutViewModel[];
    featureCards: HomePageFeatureCardViewModel[];
    linkList: HomePageLinkViewModel[];
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

const ANNOUNCEMENT_TAKE = 6;
const FILE_ARCHIVE_TAKE = 5;
// #endregion

// #region Public
export const buildHomePageLoaderArgs = (p: {
    lang: Lang;
    internalId: string;
}): HomePageLoaderArgs =>
{
    return { lang: p.lang, internalId: getSafeString(p.internalId) };
};

export const HomePageLoader = (props: { lang: Lang; }) => async (args: LoaderFunctionArgs): Promise<HomePageLoaderData> =>
{
    const api = getSsrApi(args.request);
    const adapter = SpecHomePage1821Adapter(api);
    const internalId = await resolveHomePageInternalId(
        args,
        adapter,
        props.lang,
    );
    const loaderArgs = buildHomePageLoaderArgs({
        lang: props.lang,
        internalId,
    });

    if (!loaderArgs.internalId) return buildEmptyLoaderData(loaderArgs);

    const setData = await loadHomePageSet(args, adapter, loaderArgs.internalId);
    const rawData = await normalizeSetData(args, setData, props.lang);

    return { args: loaderArgs, res: { rawData, setData } };
};

export const useHomePageTemplateData = (lang: Lang) =>
{
    const template = useMemo(() => createHomePageTemplate(lang), [lang]);
    const templateVm = useClientDataQueryTemplate(template);

    return {
        loaderData: templateVm.viewModel,
        rawData: templateVm.rawData,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
    };
};
// #endregion

// #region Private
const getSafeString = (value?: string | null) =>
{
    return `${value ?? ""}`.trim();
};

const escapeQueryValue = (value?: string | null) =>
{
    return getSafeString(value).replace(/"/g, `""`);
};

const sortByRowNo = <T extends { RowNo?: number | null; RowId?: number | null; }>(rows?: T[] | null) =>
{
    return [...(rows ?? [])].sort((a, b) => (a.RowNo ?? a.RowId ?? 0) - (b.RowNo ?? b.RowId ?? 0));
};

const createEmptyRawData = (): HomePageRawData =>
{
    return { homePage: null, banners: [], shortcuts: [], featureCards: [], linkList: [] };
};

const buildEmptyLoaderData = (args: HomePageLoaderArgs): HomePageLoaderData =>
{
    return { args, res: { rawData: createEmptyRawData(), setData: null } };
};

const normalizeSetData = async (args: LoaderFunctionArgs, setData: SpecHomePage1821Set | null, lang: Lang): Promise<HomePageRawData> =>
{
    if (!setData) return createEmptyRawData();
    const homePage = setData.SpecHomePage1821 ?? null;
    const banners = sortByRowNo(setData.SpecHomePage1821_Banner);
    const shortcuts = sortByRowNo(setData.SpecHomePage1821_Shortcut).slice(0, MAX_SHORTCUT_ITEMS);
    const moduleItems = sortByRowNo(setData.SpecHomePage1821_ShortcutModuleItem);
    const nowIsoLocal = formatLocalIso(new Date());
    const shortcutViewModels = await buildShortcutViewModels(args, lang, shortcuts, moduleItems, nowIsoLocal);
    const linkList = await loadSection4Links(args, lang, homePage);
    return { homePage, banners, shortcuts: shortcutViewModels, featureCards: buildFeatureCards(homePage), linkList };
};

const buildFeatureCards = (homePage: SpecHomePage1821Model | null): HomePageFeatureCardViewModel[] =>
{
    if (!homePage) return [];
    return [
        {
            key: "card1",
            title: getSafeString(homePage.Card1Title),
            pictureId: getSafeString(homePage.Card1PicId),
            pictureDescription: getSafeString(
                homePage.Card1Pic?.FileDescription
                    ?? homePage.Card1Pic?.FileName
                    ?? homePage.Card1Title,
            ),
        },
        {
            key: "card2",
            title: getSafeString(homePage.Card2Title),
            pictureId: getSafeString(homePage.Card2PicId),
            pictureDescription: getSafeString(
                homePage.Card2Pic?.FileDescription
                    ?? homePage.Card2Pic?.FileName
                    ?? homePage.Card2Title,
            ),
        },
    ].filter((item) => item.title || item.pictureId);
};

const buildShortcutViewModels = async (
    args: LoaderFunctionArgs,
    lang: Lang,
    shortcuts: SpecHomePage1821Shortcut[],
    moduleItems: SpecHomePage1821ShortcutModuleItem[],
    nowIsoLocal: string,
): Promise<HomePageShortcutViewModel[]> =>
{
    const groupedItems = groupModuleItemsByParent(moduleItems);

    return Promise.all(
        shortcuts.map(async (shortcut) =>
        {
            const modules = shortcut.IsLink === true
                ? []
                : await buildShortcutModules(
                    args,
                    lang,
                    groupedItems[shortcut.RowId ?? 0] ?? [],
                    nowIsoLocal,
                );
            return { shortcut, modules };
        }),
    );
};

const groupModuleItemsByParent = (
    moduleItems: SpecHomePage1821ShortcutModuleItem[],
): Record<number, SpecHomePage1821ShortcutModuleItem[]> =>
{
    return moduleItems.reduce<
        Record<number, SpecHomePage1821ShortcutModuleItem[]>
    >((result, item) =>
    {
        const parentRowId = Number(item.ParentRowId ?? 0);
        if (!parentRowId) return result;
        result[parentRowId] = [...(result[parentRowId] ?? []), item];
        return result;
    }, {});
};

const buildShortcutModules = async (
    args: LoaderFunctionArgs,
    lang: Lang,
    moduleItems: SpecHomePage1821ShortcutModuleItem[],
    nowIsoLocal: string,
): Promise<HomePageShortcutModuleViewModel[]> =>
{
    const viewModels = await Promise.all(
        moduleItems.map(async (item) =>
        {
            const moduleType = Number(
                item.ModuleType ?? 0,
            ) as HomePageModuleTypeValue;
            if (!isSupportedModuleType(moduleType)) return null;

            const options = parseHomePageOptions(item.ModuleOptions);
            const announcementList = moduleType === HomePageModuleType.Announcement
                ? await loadAnnouncementList(args, lang, options, nowIsoLocal)
                : [];
            const fileArchiveList = moduleType === HomePageModuleType.FileArchive
                ? await loadFileArchiveList(args, lang, options)
                : [];

            return { setting: item, moduleType, announcementList, fileArchiveList };
        }),
    );

    return viewModels.filter((item): item is HomePageShortcutModuleViewModel => Boolean(item));
};

const isSupportedModuleType = (
    value: number,
): value is HomePageModuleTypeValue =>
{
    return (
        value === HomePageModuleType.Announcement
        || value === HomePageModuleType.FileArchive
    );
};

const parseHomePageOptions = (value?: string | null): HomePageOptions =>
{
    const fallback = { categoryIds: "", tagIds: "" };
    const text = getSafeString(value);
    if (!text) return fallback;

    try
    {
        const parsed = JSON.parse(text) as Partial<HomePageOptions>;
        return {
            categoryIds: getSafeString(parsed.categoryIds),
            tagIds: getSafeString(parsed.tagIds),
        };
    } catch
    {
        return fallback;
    }
};

const loadAnnouncementList = async (
    args: LoaderFunctionArgs,
    lang: Lang,
    options: HomePageOptions,
    nowIsoLocal: string,
): Promise<AnnouncementSet[]> =>
{
    const api = getSsrApi(args.request);
    const adapter = AnnouncementAdapter(api);
    const loader = adapter.loader.createQueryListLoader({
        getApiInstance: () => api,
        getCondition: () =>
            buildAnnouncementHomeQuery({
                condition: buildAnnouncementHomeCondition({
                    lang,
                    options,
                    nowIsoLocal,
                }),
                take: ANNOUNCEMENT_TAKE,
            }),
    });
    const env = await loader(args);
    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : [];
};

const buildAnnouncementHomeCondition = (p: {
    lang: Lang;
    options: HomePageOptions;
    nowIsoLocal: string;
}): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(
            AnnouncementFields.Validate_Start,
            Operator.LessThanOrEqual,
            p.nowIsoLocal,
        ),
        `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        LibCondition.createCondition(
            AnnouncementFields.ContentStatus,
            Operator.BitwiseHasNone,
            4,
        ),
        LibCondition.createCondition(
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            Operator.Equal,
            p.lang,
        ),
        LibCondition.createCondition(
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
            Operator.NotEqual,
            "",
            true,
        ),
        p.options.categoryIds
            ? LibCondition.createCondition(
                AnnouncementFields.Categories,
                Operator.HasAny,
                p.options.categoryIds,
            )
            : null,
        p.options.tagIds
            ? LibCondition.createCondition(
                AnnouncementFields.Tags,
                Operator.HasAny,
                p.options.tagIds,
            )
            : null,
    ]);
};

const buildAnnouncementHomeQuery = (p: {
    condition: string;
    take: number;
}): QueryListParam =>
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
        RankGroups: [
            {
                Condition: LibCondition.joinConditions([LibCondition.createCondition(AnnouncementFields.ContentStatus, Operator.BitwiseHasAny, 1)]),
            },
        ],
        OrderBy: [
            { Col: AnnouncementFields.Validate_Start, Desc: true },
            { Col: AnnouncementFields.CreateTime, Desc: true },
        ],
        PageNumber: 1,
        PageSize: p.take,
    };
};

const loadFileArchiveList = async (
    args: LoaderFunctionArgs,
    lang: Lang,
    options: HomePageOptions,
): Promise<FileArchiveSet[]> =>
{
    const api = getSsrApi(args.request);
    const adapter = FileArchiveAdapter(api);
    const loader = adapter.loader.createQueryListLoader({
        getApiInstance: () => api,
        getCondition: () =>
            buildFileArchiveHomeQuery({
                condition: buildFileArchiveHomeCondition({ lang, options }),
                take: FILE_ARCHIVE_TAKE,
            }),
    });
    const env = await loader(args);
    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : [];
};

const buildFileArchiveHomeCondition = (p: {
    lang: Lang;
    options: HomePageOptions;
}): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(
            FileArchiveFields.ContentStatus,
            Operator.BitwiseHasNone,
            4,
        ),
        LibCondition.createCondition(
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
            Operator.Equal,
            p.lang,
        ),
        LibCondition.createCondition(
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
            Operator.NotEqual,
            "",
            true,
        ),
        p.options.categoryIds
            ? LibCondition.createCondition(
                FileArchiveFields.CategoriesId,
                Operator.HasAny,
                p.options.categoryIds,
            )
            : null,
        p.options.tagIds
            ? LibCondition.createCondition(
                FileArchiveFields.TagsId,
                Operator.HasAny,
                p.options.tagIds,
            )
            : null,
    ]);
};

const buildFileArchiveHomeQuery = (p: {
    condition: string;
    take: number;
}): QueryListParam =>
{
    return {
        Fields: [
            FileArchiveFields.InternalId,
            FileArchiveFields.FileArchiveId,
            FileArchiveFields.CategoriesId,
            FileArchiveFields.TagsId,
            FileArchiveFields.ContentStatus,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.RowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrcId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileName}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.InternalId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveDetail}.${FileArchiveDetailFields.FileSrc}.${FileManageModelFields.FileExtension}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.FileArchiveId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.ParentRowId}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.Url}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.UrlDescription}`,
            `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields._FileArchiveUrlDetail}.${FileArchiveUrlDetailFields.WindowTarget}`,
        ],
        Condition: p.condition,
        RankGroups: [
            {
                Condition: LibCondition.joinConditions([LibCondition.createCondition(FileArchiveFields.ContentStatus, Operator.BitwiseHasAny, 1)]),
            },
        ],
        OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: p.take,
    };
};

const loadSection4Links = async (
    args: LoaderFunctionArgs,
    lang: Lang,
    homePage: SpecHomePage1821Model | null,
): Promise<HomePageLinkViewModel[]> =>
{
    if (!homePage) return [];

    const api = getSsrApi(args.request);
    const adapter = WebResourceAdapter(api);
    const loader = adapter.loader.createQueryListLoader({
        getApiInstance: () => api,
        getCondition: () =>
            buildWebResourceHomeQuery({
                condition: buildWebResourceHomeCondition({
                    lang,
                    options: parseHomePageOptions(homePage.LinkOptions),
                }),
            }),
    });
    const env = await loader(args);
    const rows = env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : [];

    return rows
        .map((item) => toLinkViewModel(item, lang))
        .filter((item): item is HomePageLinkViewModel => Boolean(item));
};

const buildWebResourceHomeCondition = (p: {
    lang: Lang;
    options: HomePageOptions;
}): string =>
{
    return LibCondition.joinConditions([
        LibCondition.createCondition(
            WebResourceFields.ContentStatus,
            Operator.BitwiseHasNone,
            4,
        ),
        LibCondition.createCondition(
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            Operator.Equal,
            p.lang,
        ),
        LibCondition.createCondition(
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            Operator.NotEqual,
            "",
            true,
        ),
        p.options.categoryIds
            ? LibCondition.createCondition(
                WebResourceFields.Categories,
                Operator.HasAny,
                p.options.categoryIds,
            )
            : null,
        p.options.tagIds
            ? LibCondition.createCondition(
                WebResourceFields.Tags,
                Operator.HasAny,
                p.options.tagIds,
            )
            : null,
    ]);
};

const buildWebResourceHomeQuery = (p: {
    condition: string;
}): QueryListParam =>
{
    return {
        Fields: [
            WebResourceFields.InternalId,
            WebResourceFields.WebResourceId,
            WebResourceFields.PicId,
            WebResourceFields.PicDescription,
            WebResourceFields.Categories,
            WebResourceFields.Tags,
            WebResourceFields.ContentStatus,
            WebResourceFields.CreateTime,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Content}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.ResUrl}`,
            `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Url_OpenType}`,
        ],
        Condition: p.condition,
        RankGroups: [
            {
                Condition: LibCondition.joinConditions([LibCondition.createCondition(WebResourceFields.ContentStatus, Operator.BitwiseHasAny, 1)]),
            },
        ],
        OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
        PageNumber: 0,
        PageSize: 0,
    };
};

const toLinkViewModel = (
    item: WebResourceSet,
    lang: Lang,
): HomePageLinkViewModel | null =>
{
    const detail = item.WebResourceInfo?.find((info) => info.Lang === lang)
        ?? item.WebResourceInfo?.[0];
    const title = getSafeString(detail?.Title);
    const url = getSafeString(detail?.ResUrl);
    if (!title && !url) return null;

    return {
        key: getSafeString(
            item.WebResource?.InternalId ?? item.WebResource?.WebResourceId ?? title,
        ),
        title,
        url,
        pictureId: getSafeString(item.WebResource?.PicId),
        pictureDescription: getSafeString(
            item.WebResource?.PicDescription ?? title,
        ),
    };
};

const buildHomePageQueryParam = (lang?: Lang): QueryListParam =>
{
    const safeLang = escapeQueryValue(lang);

    return {
        Fields: [
            SpecHomePage1821ModelFields.InternalId,
            SpecHomePage1821ModelFields.Lang,
            SpecHomePage1821ModelFields.CreateTime,
            SpecHomePage1821ModelFields.ModifyTime,
        ],
        Condition: safeLang
            ? `${SpecHomePage1821ModelFields.Lang} = "${safeLang}"`
            : "",
        OrderBy: [
            { Col: SpecHomePage1821ModelFields.ModifyTime, Desc: true },
            { Col: SpecHomePage1821ModelFields.CreateTime, Desc: true },
        ],
        PageNumber: 1,
        PageSize: 1,
    };
};

const getInternalIdFromListRow = (row?: SpecHomePage1821Set | null) =>
{
    return getSafeString(row?.SpecHomePage1821?.InternalId);
};

const loadFirstHomePageRow = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof SpecHomePage1821Adapter>,
    condition: QueryListParam,
) =>
{
    const api = getSsrApi(args.request);
    const queryListLoader = adapter.loader.createQueryListLoader({
        getApiInstance: () => api,
        getCondition: () => condition,
    });
    const env = await queryListLoader(args);
    const list = env.apiRes.IsSuccess ? (env.apiRes.Data ?? []) : [];

    return list[0] ?? null;
};

const loadHomePageSet = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof SpecHomePage1821Adapter>,
    internalId: string,
) =>
{
    if (!internalId) return null;

    const api = getSsrApi(args.request);
    const queryDataLoader = adapter.loader.createQueryDataLoader({
        getApiInstance: () => api,
        getInternalId: () => internalId,
    });
    const env = await queryDataLoader(args);

    return env.apiRes.IsSuccess ? (env.apiRes.Data ?? null) : null;
};

const resolveHomePageInternalId = async (
    args: LoaderFunctionArgs,
    adapter: ReturnType<typeof SpecHomePage1821Adapter>,
    lang: Lang,
): Promise<string> =>
{
    const currentRow = await loadFirstHomePageRow(
        args,
        adapter,
        buildHomePageQueryParam(lang),
    );
    const currentId = getInternalIdFromListRow(currentRow);
    if (currentId) return currentId;

    const defaultRow = await loadFirstHomePageRow(
        args,
        adapter,
        buildHomePageQueryParam(DefaultLang),
    );
    const defaultId = getInternalIdFromListRow(defaultRow);
    if (defaultId) return defaultId;

    const anyRow = await loadFirstHomePageRow(
        args,
        adapter,
        buildHomePageQueryParam(),
    );
    return getInternalIdFromListRow(anyRow);
};

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

const useHomePageTemplateDataSource = (ctx: {
    loaderData: HomePageLoaderData | null;
}): ClientDataQueryDataSourceResult<HomePageRawData | null> =>
{
    const rawData = ctx.loaderData?.res?.rawData ?? null;
    return { rawData, isLoading: false, errors: [], paginator: null };
};
// #endregion
