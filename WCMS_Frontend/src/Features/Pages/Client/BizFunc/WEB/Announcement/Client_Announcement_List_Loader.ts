import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import {
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryMemoryState,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
    getClientSearchStringValue,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import { getClientSearchBarText } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SearchBar/Client_SearchBar_I18n";
import type { ColumnConfig, GridProps, GridRow } from "@/SysCore/Components/Grid/Grid_Data";
import { getModelColumnDisplayName } from "@/SysCore/Components/Grid/Grid_ModelDisplay";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { formatDate, getTodayRange, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    CategoryDetailFields,
    CategoryFields,
    PGID,
    SiteViewCountDetailFields,
    SiteViewCountHeaderFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";
import { getClientSlotPath } from "../../../Scaffold/Slot/Client_SlotPath";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementFormModel = components["schemas"]["Announcement"];
type CategoryFormModel = components["schemas"]["Category"];
type TagFormModel = components["schemas"]["TagData"];
type SiteViewCountFormModel = components["schemas"]["SiteViewCountHeader"];
export interface IAnnouncementListOptions
{
    Category?: string;
    Tag?: string;
    Style?: number;
}

export interface AnnouncementListLoaderArgs
{
    lang: Lang;
    dayStart: number;
    dayEnd: number;
    pageSize: number;
    pageNumber: number;
    keyword?: string;
    categoryIds: string;
    tagIds: string;
    condition: string;
    listParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
    viewCountParam: QueryListParam;
}

export interface AnnouncementListLoaderRes
{
    gridRes: ApiGridLoaderData<AnnouncementFormModel>;
    categoryRes: CategoryFormModel[];
    tagRes: TagFormModel[];
    viewCountRes: SiteViewCountFormModel[];
    viewCountModelRes: ApiLoaderData<null, ModelDisplaySchema[]>;
}

export interface AnnouncementListLoaderData
{
    args: AnnouncementListLoaderArgs;
    res: AnnouncementListLoaderRes;
    /** Spec 額外 SSR initial data，供客製列表在首屏沿用。 */
    spec?: unknown | null;
}

export interface AnnouncementListLoaderSpecContext
{
    /** SSR request，提供 Spec loader 沿用目前請求。 */
    request: LoaderFunctionArgs["request"];
    /** SSR API instance，讓 Spec loader 不需重複建立 request context。 */
    apiInstance: AxiosInstance;
    /** Feature 已完成的 loader 參數，Spec 可沿用搜尋條件與時間範圍。 */
    args: AnnouncementListLoaderArgs;
    /** Announcement List options，供 Spec 判斷版型與固定分類標籤。 */
    opts?: IAnnouncementListOptions;
    /** 外部覆寫查詢參數，供 Spec 與 Feature 首屏一致。 */
    overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
}

export interface AnnouncementListLoaderSpecSlot
{
    /** 載入 Spec 額外 SSR initial data，例如第二組客製 Grid。 */
    loadExtraData?: (context: AnnouncementListLoaderSpecContext) => Promise<unknown>;
}

export interface UseAnnouncementListDataResult
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: AnnouncementFormModel[];
    categoryData: CategoryFormModel[];
    tagData: TagFormModel[];
    viewCountMap: Record<string, number>;
    gridPropsFromList: GridProps;
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    onPageChange: (page: number) => void;
}

/** 前端 grid 專用欄位 key，避免再依賴 Announcement.ViewCount。 */
const ANNOUNCEMENT_VIEW_COUNT_COL_KEY = "__announcementViewCount__";
type SiteViewCountDetailRow = { ProgId?: string | null; TargetInternalId?: string | null; PageViewCount?: number | null; };
type SiteViewCountFormModelLike = SiteViewCountFormModel & { SiteViewCountDetail?: SiteViewCountDetailRow[] | null; };
const SEARCH_KEYWORD_KEY = "keyword";

type AnnouncementSearchParams = {
    lang: Lang;
    dayStart: number;
    dayEnd: number;
    pageSize: number;
    pageNumber: number;
    keyword?: string;
    categoryIds: string;
    tagIds: string;
};

type AnnouncementQueryParam = Omit<AnnouncementListLoaderArgs, "viewCountParam">;
type AnnouncementListViewModel = Omit<UseAnnouncementListDataResult, "isLoading" | "errorList" | "searchBar">;
type AnnouncementDataQueryTemplate = ClientDataQueryTemplate<
    AnnouncementSearchParams,
    AnnouncementListViewModel,
    AnnouncementListViewModel,
    unknown,
    AnnouncementQueryParam,
    AnnouncementListLoaderData,
    ClientDataQueryMemoryState
>;

export type AnnouncementListDataQuerySpecSlot = NonNullable<AnnouncementDataQueryTemplate["spec"]>;
let _resolvedAnnouncementListDataQuerySpec: AnnouncementListDataQuerySpecSlot | null = null;
let _resolvedAnnouncementListLoaderSpec: AnnouncementListLoaderSpecSlot | null = null;
/** Announcement 預設 DataQuery 客製 slot，Spec 未覆寫時不做任何事。 */
export const extendAnnouncementListDataQuerySpec: AnnouncementListDataQuerySpecSlot = {};
/** Announcement 預設 Loader 客製 slot，Spec 未覆寫時不載入額外 SSR 資料。 */
export const extendAnnouncementListLoaderSpec: AnnouncementListLoaderSpecSlot = {};
// #endregion

// #region Public
/** SSR Loader：首屏撈 announcement + category + tag + siteviewcount。 */
export const AnnouncementListLoader = (
    p: {
        pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>;
        lang: Lang;
        opts?: IAnnouncementListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
    },
) =>
async ({ request }: LoaderFunctionArgs): Promise<AnnouncementListLoaderData> =>
{
    const ssrApi = getSsrApi(request);
    const announcement = AnnouncementAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const siteView = SiteViewCountAdapter(ssrApi);
    const { dayStart, dayEnd } = getTodayRange();
    const baseArgs = buildLoaderArgs({ ...p, dayStart, dayEnd });
    const loaders = buildAnnouncementSsrLoaders({ announcement, category, tag, siteView, baseArgs, ssrApi });
    const [gridRes, categoryLD, tagLD, viewCountModelLD] = await Promise.all([
        loaders.grid({ request } as LoaderFunctionArgs),
        loaders.category({ request } as LoaderFunctionArgs),
        loaders.tag({ request } as LoaderFunctionArgs),
        loaders.viewCountModel({ request } as LoaderFunctionArgs),
    ]);
    const viewCountParam = buildViewCountQuery(getAnnouncementInternalIds(gridRes.list.apiRes.Data ?? []));
    const viewCountLoader = siteView.loader.createQueryListLoader({ getCondition: () => viewCountParam, getApiInstance: () => ssrApi });
    const viewCountLD = await viewCountLoader({ request } as LoaderFunctionArgs);
    const finalArgs: AnnouncementListLoaderArgs = { ...baseArgs, viewCountParam };
    const spec = await loadAnnouncementSpecData({ request, apiInstance: ssrApi, args: finalArgs, opts: p.opts, overrides: p.overrides });
    return buildAnnouncementLoaderResult({ finalArgs, gridRes, categoryLD, tagLD, viewCountLD, viewCountModelLD, spec });
};

/** CSR Hook：Component 只拿 VM，資料查詢流程交給 Client_DataQueryTemplate。 */
export const useAnnouncementListData = (p: { lang: Lang; opts?: IAnnouncementListOptions; kw?: string; }): UseAnnouncementListDataResult =>
{
    const initial = useLoaderData() as AnnouncementListLoaderData;
    const defaultPageState = useMemo<ClientDataQueryMemoryState>(() => ({
        searchValues: buildAnnouncementSearchValues(p.kw),
        viewState: buildAnnouncementInitialViewState({ opts: p.opts, overrides: { pageNumber: initial.args.pageNumber, pageSize: initial.args.pageSize } }),
    }), [p.lang, initial.args.pageNumber, initial.args.pageSize]);
    const pageState = usePageStateMemory<ClientDataQueryMemoryState>({ stateKey: "Client.AnnouncementList", scopeKeys: [p.lang], defaultState: defaultPageState });
    const template = useMemo(() =>
        createAnnouncementDataQueryTemplate({
            pageState,
            lang: p.lang,
            opts: p.opts,
            dayStart: initial.args.dayStart,
            dayEnd: initial.args.dayEnd,
            overrides: {
                pageNumber: initial.args.pageNumber,
                pageSize: initial.args.pageSize,
                keyword: p.kw,
                categoryIds: initial.args.categoryIds,
                tagIds: initial.args.tagIds,
            },
        }), [p.lang, p.opts, p.kw, initial.args.dayStart, initial.args.dayEnd, initial.args.pageNumber, initial.args.pageSize, initial.args.categoryIds, initial.args.tagIds, pageState]);
    const templateVm = useClientDataQueryTemplate(template);
    return { ...templateVm.viewModel, paginatorProps: templateVm.paginatorProps, searchBar: templateVm.searchBar, isLoading: templateVm.isLoading, errorList: templateVm.errorList };
};
// #endregion

// #region Protected
/** 取得 Announcement List Loader Spec，有 Spec 時載入額外 SSR initial data。 */
const getResolvedAnnouncementListLoaderSpec = (): AnnouncementListLoaderSpecSlot =>
{
    if (_resolvedAnnouncementListLoaderSpec) return _resolvedAnnouncementListLoaderSpec;
    _resolvedAnnouncementListLoaderSpec = resolveSpecFunc<AnnouncementListLoaderSpecSlot>(getClientSlotPath("Slot_Announcement_List_Loader"), extendAnnouncementListLoaderSpec, ["extendAnnouncementListLoaderSpec"]);
    return _resolvedAnnouncementListLoaderSpec;
};

/** 取得 Announcement List DataQuery Spec，有 Spec 時調整查詢流程。 */
const getResolvedAnnouncementListDataQuerySpec = (): AnnouncementListDataQuerySpecSlot =>
{
    if (_resolvedAnnouncementListDataQuerySpec) return _resolvedAnnouncementListDataQuerySpec;
    _resolvedAnnouncementListDataQuerySpec = resolveSpecFunc<AnnouncementListDataQuerySpecSlot>(getClientSlotPath("Slot_Announcement_List_Loader"), extendAnnouncementListDataQuerySpec, ["extendAnnouncementListDataQuerySpec"]);
    return _resolvedAnnouncementListDataQuerySpec;
};
// #endregion

// #region Private
/** 建立 Announcement SSR Loader 集合。 */
const buildAnnouncementSsrLoaders = (p: {
    announcement: ReturnType<typeof AnnouncementAdapter>;
    category: ReturnType<typeof CategoryAdapter>;
    tag: ReturnType<typeof TagAdapter>;
    siteView: ReturnType<typeof SiteViewCountAdapter>;
    baseArgs: AnnouncementQueryParam;
    ssrApi: AxiosInstance;
}) =>
{
    return {
        grid: p.announcement.loader.createQueryGridDataLoader({ getCondition: () => p.baseArgs.listParam, getApiInstance: () => p.ssrApi }),
        category: p.category.loader.createQueryListLoader({ getCondition: () => p.baseArgs.cateParam, getApiInstance: () => p.ssrApi }),
        tag: p.tag.loader.createQueryListLoader({ getCondition: () => p.baseArgs.tagParam, getApiInstance: () => p.ssrApi }),
        viewCountModel: p.siteView.loader.createModelDisplayNameLoader({ getApiInstance: () => p.ssrApi }),
    };
};

/** 載入 Announcement Spec 額外 SSR 資料。 */
const loadAnnouncementSpecData = async (context: AnnouncementListLoaderSpecContext): Promise<unknown | null> =>
{
    return await getResolvedAnnouncementListLoaderSpec().loadExtraData?.(context) ?? null;
};

/** 建立 Announcement SSR Loader 回傳資料。 */
const buildAnnouncementLoaderResult = (p: {
    finalArgs: AnnouncementListLoaderArgs;
    gridRes: ApiGridLoaderData<AnnouncementFormModel>;
    categoryLD: ApiLoaderData<QueryListParam, CategoryFormModel[]>;
    tagLD: ApiLoaderData<QueryListParam, TagFormModel[]>;
    viewCountLD: ApiLoaderData<QueryListParam, SiteViewCountFormModel[]>;
    viewCountModelLD: ApiLoaderData<null, ModelDisplaySchema[]>;
    spec: unknown | null;
}): AnnouncementListLoaderData =>
{
    return {
        args: p.finalArgs,
        res: {
            gridRes: p.gridRes,
            categoryRes: p.categoryLD.apiRes.Data ?? [],
            tagRes: p.tagLD.apiRes.Data ?? [],
            viewCountRes: p.viewCountLD.apiRes.Data ?? [],
            viewCountModelRes: p.viewCountModelLD,
        },
        spec: p.spec,
    };
};

const pad = (n: number): string => n < 10 ? `0${n}` : `${n}`;

/** 將 timestamp 轉查詢用本地時間字串。 */
const formatQueryDateTime = (value: number): string =>
{
    const d = new Date(value);
    const dateText = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
    const timeText = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
    return `${dateText}T${timeText}`;
};

/** 依 Style 計算每頁筆數。 */
const calcPageSize = (style?: number): number =>
{
    const currentStyle = style ?? 0;
    if (currentStyle === 2) return 12;
    if (currentStyle === 8) return 0;
    return 10;
};

/** 組成 In 查詢可用字串。 */
const buildQuotedValues = (values: string[]): string =>
{
    return LibText.toTrimmedStringArray(values)
        .map(value => `"${LibCondition.escapeConditionValue(value)}"`)
        .join(",");
};

/** 建公告查詢條件。 */
const buildAnnouncementCondition = (p: { lang: Lang; dayStart: number; dayEnd: number; categoryIds: string; tagIds: string; keyword?: string; }): string =>
{
    let condition = buildAnnouncementBaseCondition(p);
    if (p.keyword) condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`);
    if (LibText.safeTrim(p.categoryIds) !== "") condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    if (LibText.safeTrim(p.tagIds) !== "") condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`);
    return condition;
};

/** 建立公告固定條件。 */
const buildAnnouncementBaseCondition = (p: { lang: Lang; dayStart: number; dayEnd: number; }): string =>
{
    const dayStartText = formatQueryDateTime(p.dayStart);
    const dayEndText = formatQueryDateTime(p.dayEnd);
    return LibText.Merge(
        " And ",
        false,
        `${AnnouncementFields.Validate_Start} <= ${dayEndText}`,
        `(${AnnouncementFields.Validate_End} >= ${dayStartText} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );
};

/** 建公告 QueryListParam。 */
const buildAnnouncementQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
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
        RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: AnnouncementFields.Validate_Start, Desc: true }, { Col: AnnouncementFields.CreateTime, Desc: true }],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};

/** 建分類 QueryListParam。 */
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

/** 建標籤 QueryListParam。 */
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
/** 取公告 internalIds */
export const getAnnouncementInternalIds = (rows: AnnouncementFormModel[]): string[] =>
{
    return rows.map(p => p?.InternalId ?? "").filter(Boolean);
};

/** 建瀏覽數條件。 */
const buildViewCountCondition = (internalIds: string[]): string =>
{
    const idText = buildQuotedValues(internalIds);
    if (!idText) return "1=0";
    return `${SiteViewCountHeaderFields._SiteViewCountDetail}.${SiteViewCountDetailFields.ProgId} = ${PGID.Announcement} And ${SiteViewCountHeaderFields._SiteViewCountDetail}.${SiteViewCountDetailFields.TargetInternalId} In [${idText}]`;
};

/** 建瀏覽數 QueryListParam。 */
export const buildViewCountQuery = (internalIds: string[]): QueryListParam =>
{
    return {
        Fields: [
            `${SiteViewCountHeaderFields._SiteViewCountDetail}.${SiteViewCountDetailFields.ProgId}`,
            `${SiteViewCountHeaderFields._SiteViewCountDetail}.${SiteViewCountDetailFields.TargetInternalId}`,
            `${SiteViewCountHeaderFields._SiteViewCountDetail}.${SiteViewCountDetailFields.PageViewCount}`,
        ],
        Condition: buildViewCountCondition(internalIds),
        PageNumber: 0,
        PageSize: 0,
    };
};

/** 建立 Announcement 前台搜尋欄位。 */
const buildAnnouncementSearchFields = (lang: Lang): SearchFieldConfig[] =>
{
    const isEnglish = lang === "en";
    return [{
        key: SEARCH_KEYWORD_KEY,
        title: isEnglish ? "Keyword" : "關鍵字",
        label: isEnglish ? "Keyword" : "關鍵字",
        type: "text",
        placeholder: isEnglish ? "Enter an announcement title" : "請輸入公告標題",
        maxLength: 100,
    }] as unknown as SearchFieldConfig[];
};

/** 建立 Announcement 搜尋初始值。 */
const buildAnnouncementSearchValues = (keyword?: string): SearchValues =>
{
    return { [SEARCH_KEYWORD_KEY]: LibText.safeTrim(keyword) } as SearchValues;
};

/** 建立 Announcement 初始 ViewState。 */
const buildAnnouncementInitialViewState = (p: { opts?: IAnnouncementListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; }): IListViewState =>
{
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? calcPageSize(p.opts?.Style);
    return { pageNumber, pageSize } as IListViewState;
};

/** 建立 Announcement 搜尋參數。 */
const buildAnnouncementSearchParams = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    dayStart: number;
    dayEnd: number;
    overrides?: Partial<{ keyword: string; categoryIds: string; tagIds: string; }>;
    values: SearchValues;
    viewState: IListViewState;
}): AnnouncementSearchParams =>
{
    const keyword = getClientSearchStringValue(p.values, SEARCH_KEYWORD_KEY) ?? p.overrides?.keyword;
    const categoryIds = p.overrides?.categoryIds ?? (p.opts?.Category ?? "");
    const tagIds = p.overrides?.tagIds ?? (p.opts?.Tag ?? "");
    return { lang: p.lang, dayStart: p.dayStart, dayEnd: p.dayEnd, pageNumber: p.viewState.pageNumber, pageSize: p.viewState.pageSize, keyword, categoryIds, tagIds };
};

/** 建立 Announcement QueryParam，Loader / Hook 都統一走這裡。 */
const buildAnnouncementQueryArgs = (p: AnnouncementSearchParams & { condition: string; }): AnnouncementQueryParam =>
{
    return {
        lang: p.lang,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        pageSize: p.pageSize,
        pageNumber: p.pageNumber,
        keyword: p.keyword,
        categoryIds: p.categoryIds,
        tagIds: p.tagIds,
        condition: p.condition,
        listParam: buildAnnouncementQuery({ condition: p.condition, pageNumber: p.pageNumber, pageSize: p.pageSize }),
        cateParam: buildCategoryQuery(PGID.Announcement),
        tagParam: buildTagQuery(PGID.Announcement),
    };
};
/** 建立 Announcement DataQueryTemplate */
const createAnnouncementDataQueryTemplate = (
    p: {
        pageState?: ReturnType<typeof usePageStateMemory<ClientDataQueryMemoryState>>;
        lang: Lang;
        opts?: IAnnouncementListOptions;
        dayStart: number;
        dayEnd: number;
        overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
    },
): AnnouncementDataQueryTemplate =>
{
    const initialViewState = buildAnnouncementInitialViewState({ opts: p.opts, overrides: p.overrides });
    const initialSearchValues = buildAnnouncementSearchValues(p.overrides?.keyword);
    const pagination = p.opts?.Style === 8 ? null : { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true };
    const searchBarText = getClientSearchBarText(p.lang);
    return {
        featureKey: "AnnouncementList",
        dataMode: "multiple",
        ...(p.pageState
            ? {
                pageStateMemory: {
                    controller: p.pageState,
                    getSearchValues: state => state.searchValues,
                    getViewState: state => state.viewState,
                    updateSearchValues: (state, values, pageNumber) => ({ ...state, searchValues: values, viewState: { ...state.viewState, pageNumber } }),
                    updateViewState: (state, nextViewState) => ({ ...state, viewState: nextViewState }),
                    getPagination: raw => ({ count: raw.totalCount, totalPages: raw.totalPages }),
                },
            }
            : {}),
        initialSearchValues,
        initialViewState,
        pagination,
        searchBar: { ...searchBarText, actionAlign: "right", columnCount: 3 },
        spec: getResolvedAnnouncementListDataQuerySpec(),
        feature: {
            searchFields: buildAnnouncementSearchFields(p.lang),
            toSearchParams: (values, viewState) => buildAnnouncementSearchParams({ ...p, values, viewState }),
            buildSearchConditions: ctx => [buildAnnouncementCondition(ctx.searchParams)],
            buildQueryParam: ctx => buildAnnouncementQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: ctx => useAnnouncementDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: ctx => ctx.rawData,
        },
    } as AnnouncementDataQueryTemplate;
};

/** 組 loader / hook 共用參數。 */
const buildLoaderArgs = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    dayStart: number;
    dayEnd: number;
    overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
}): AnnouncementQueryParam =>
{
    const template = createAnnouncementDataQueryTemplate(p);
    const viewState = buildAnnouncementInitialViewState({ opts: p.opts, overrides: p.overrides });
    const searchValues = buildAnnouncementSearchValues(p.overrides?.keyword);
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};
/** 取瀏覽數明細列 */
const getSiteViewCountDetails = (item: SiteViewCountFormModel): SiteViewCountDetailRow[] =>
{
    const detailRows = (item as SiteViewCountFormModelLike)._SiteViewCountDetail;
    if (!Array.isArray(detailRows)) return [];
    return detailRows;
};
/** 組公告瀏覽數 map */
const buildViewCountMap = (rows: SiteViewCountFormModel[]): Record<string, number> =>
{
    const result: Record<string, number> = {};
    rows.forEach(item => getSiteViewCountDetails(item).forEach(detail => addViewCount(result, detail)));
    return result;
};

/** 將一筆瀏覽數累加至 Map。 */
const addViewCount = (result: Record<string, number>, detail: SiteViewCountDetailRow): void =>
{
    const key = detail.TargetInternalId ?? "";
    if (!key) return;
    result[key] = (result[key] ?? 0) + Number(detail.PageViewCount ?? 0);
};

/** 依後端 Model Metadata 建立公告 Grid 欄位。 */
const buildAnnouncementGridColumns = (model: ModelDisplaySchema | null, viewCountModel: ModelDisplaySchema | null): ColumnConfig[] =>
{
    return [
        { key: AnnouncementDetailFields.Title, title: getModelColumnDisplayName(model, AnnouncementFields._AnnouncementDetail, AnnouncementDetailFields.Title) },
        { key: AnnouncementFields.Validate_Start, title: getModelColumnDisplayName(model, "", AnnouncementFields.Validate_Start) },
        { key: AnnouncementFields.Categories, title: getModelColumnDisplayName(model, "", AnnouncementFields.Categories) },
        { key: AnnouncementFields.Tags, title: getModelColumnDisplayName(model, "", AnnouncementFields.Tags) },
        { key: ANNOUNCEMENT_VIEW_COUNT_COL_KEY, title: getModelColumnDisplayName(viewCountModel, SiteViewCountHeaderFields._SiteViewCountDetail, SiteViewCountDetailFields.PageViewCount) },
    ];
};

/** 由資料組 gridProps。 */
const buildGridPropsFromList = (p: {
    lang: Lang;
    modelDisplayName: ModelDisplaySchema | null;
    viewCountModelDisplayName: ModelDisplaySchema | null;
    listData: AnnouncementFormModel[];
    viewCountMap: Record<string, number>;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}): GridProps =>
{
    const columns = buildAnnouncementGridColumns(p.modelDisplayName, p.viewCountModelDisplayName);
    const rows = p.listData.map(item => buildAnnouncementGridRow(p.lang, item, columns, p.viewCountMap));
    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};

/** 建立公告 Grid 單列。 */
const buildAnnouncementGridRow = (lang: Lang, item: AnnouncementFormModel, columns: ColumnConfig[], viewCountMap: Record<string, number>): GridRow =>
{
    const detail = item._AnnouncementDetail?.find(x => x.Lang === lang);
    const internalId = item?.InternalId ?? "";
    const finalCount = Number(viewCountMap[internalId] ?? 0);
    const cells = columns.map(col => ({ col, content: resolveGridCellContent({ colKey: col.key, item, detailTitle: detail?.Title ?? "", finalCount }) }));
    return { keyId: internalId, cells };
};

/** 處理 grid cell 顯示內容。 */
const resolveGridCellContent = (p: { colKey: string; item: AnnouncementFormModel; detailTitle: string; finalCount: number; }): string =>
{
    switch (p.colKey)
    {
        case AnnouncementDetailFields.Title:
            return p.detailTitle;
        case AnnouncementFields.Validate_Start:
            return formatDate(p.item?.Validate_Start) ?? "";
        case AnnouncementFields.Categories:
            return p.item?.Categories ?? "";
        case AnnouncementFields.Tags:
            return p.item?.Tags ?? "";
        case ANNOUNCEMENT_VIEW_COUNT_COL_KEY:
            return String(p.finalCount);
        default:
            return "";
    }
};

/** Announcement DataSource：統一處理 CSR 查詢與 SSR initial 沿用。 */
const useAnnouncementDataSource = (p: { queryParam: AnnouncementQueryParam; loaderData: AnnouncementListLoaderData | null; }): ClientDataQueryDataSourceResult<AnnouncementListViewModel> =>
{
    const initial = p.loaderData as AnnouncementListLoaderData;
    const currentArgs = p.queryParam;
    const announcement = useMemo(() => AnnouncementAdapter(), []);
    const siteView = useMemo(() => SiteViewCountAdapter(), []);
    const gridInitial = useMemo<ApiGridInitial<AnnouncementFormModel>>(() => buildAnnouncementGridInitial(currentArgs.listParam, initial), [currentArgs.listParam, initial.res.gridRes]);
    const grid = announcement.hooks.useQueryGridData({ baseParam: currentArgs.listParam, deps: [currentArgs.condition, currentArgs.pageSize], modelDeps: [currentArgs.lang], initial: gridInitial });
    const viewCountModel = siteView.hooks.useModelDisplayName({ initial: initial.res.viewCountModelRes ?? null, deps: [currentArgs.lang] });
    const viewCountParam = useMemo(() => buildViewCountQuery(getAnnouncementInternalIds(grid.list ?? [])), [grid.list]);
    const viewCountInitial = useMemo(() => buildAnnouncementViewCountInitial(viewCountParam, initial), [viewCountParam, initial.args.viewCountParam, initial.res.viewCountRes]);
    const viewCountParamKey = useMemo(() => JSON.stringify(viewCountParam ?? null), [viewCountParam]);
    const useViewCount = siteView.hooks.useQueryList({ condition: viewCountParam, initial: viewCountInitial, deps: [viewCountParamKey] });
    const viewCountMap = useMemo(() => buildViewCountMap(useViewCount.data ?? []), [useViewCount.data]);
    return buildAnnouncementDataSourceResult({ currentArgs, initial, grid, viewCountModel, useViewCount, viewCountMap });
};

/** 建立 Announcement Grid SSR initial。 */
const buildAnnouncementGridInitial = (listParam: QueryListParam, initial: AnnouncementListLoaderData): ApiGridInitial<AnnouncementFormModel> =>
{
    const countInitial = isSameClientDataQueryParam(listParam, initial.res.gridRes.count?.args) ? initial.res.gridRes.count : null;
    const listInitial = isSameClientDataQueryParam(listParam, initial.res.gridRes.list?.args) ? initial.res.gridRes.list : null;
    return { model: initial.res.gridRes.model, count: countInitial, list: listInitial };
};

/** 建立 Announcement 瀏覽數 SSR initial。 */
const buildAnnouncementViewCountInitial = (viewCountParam: QueryListParam, initial: AnnouncementListLoaderData): ApiLoaderData<QueryListParam, SiteViewCountFormModel[]> | null =>
{
    if (!isSameClientDataQueryParam(viewCountParam, initial.args.viewCountParam)) return null;
    return buildQueryInitial(initial.args.viewCountParam, initial.res.viewCountRes);
};

/** 整理 Announcement DataSource 回傳資料。 */
const buildAnnouncementDataSourceResult = (p: {
    currentArgs: AnnouncementQueryParam;
    initial: AnnouncementListLoaderData;
    grid: ReturnType<ReturnType<typeof AnnouncementAdapter>["hooks"]["useQueryGridData"]>;
    viewCountModel: ReturnType<ReturnType<typeof SiteViewCountAdapter>["hooks"]["useModelDisplayName"]>;
    useViewCount: ReturnType<ReturnType<typeof SiteViewCountAdapter>["hooks"]["useQueryList"]>;
    viewCountMap: Record<string, number>;
}): ClientDataQueryDataSourceResult<AnnouncementListViewModel> =>
{
    const categoryData = p.initial.res.categoryRes ?? [];
    const tagData = p.initial.res.tagRes ?? [];
    const gridPropsFromList = buildGridPropsFromList({
        lang: p.currentArgs.lang,
        modelDisplayName: p.grid.modelDisplayName,
        viewCountModelDisplayName: p.viewCountModel.data,
        listData: p.grid.list ?? [],
        viewCountMap: p.viewCountMap,
        pageNumber: p.grid.pageNumber,
        totalPages: p.grid.totalPages,
        onPageChange: p.grid.onPageChange,
    });
    const paginatorProps = buildAnnouncementPaginatorProps(p.currentArgs.pageSize, p.grid.pageNumber, p.grid.totalPages, p.grid.onPageChange);
    const rawData: AnnouncementListViewModel = {
        pageSize: p.currentArgs.pageSize,
        pageNumber: p.grid.pageNumber,
        totalPages: p.grid.totalPages,
        totalCount: p.grid.count,
        listData: p.grid.list ?? [],
        categoryData,
        tagData,
        viewCountMap: p.viewCountMap,
        gridPropsFromList,
        paginatorProps,
        onPageChange: p.grid.onPageChange,
    };
    const paginator = buildAnnouncementPaginator(p.currentArgs.pageSize, p.grid.count, paginatorProps);
    const errors = [p.grid.errorText, p.viewCountModel.errorText, p.useViewCount.errorText];
    return { rawData, isLoading: Boolean(p.grid.isLoading || p.viewCountModel.isLoading || p.useViewCount.isLoading), errors, paginator };
};

/** 建立 Announcement PaginatorProps。 */
const buildAnnouncementPaginatorProps = (pageSize: number, pageNumber: number, totalPages: number, onPageChange: (page: number) => void): PaginatorProps | null =>
{
    if (pageSize === 0) return null;
    return { currentPage: pageNumber, totalPages, onPageChange };
};

/** 建立 Announcement DataQuery paginator。 */
const buildAnnouncementPaginator = (pageSize: number, count: number, paginatorProps: PaginatorProps | null): ClientDataQueryPaginatorModel | null =>
{
    if (!paginatorProps) return null;
    return { currentPage: paginatorProps.currentPage, pageSize, totalPages: paginatorProps.totalPages, totalCount: count, onPageChange: paginatorProps.onPageChange };
};

/** 建立標準 Query initial。 */
const buildQueryInitial = <TData>(args: QueryListParam, data: TData): ApiLoaderData<QueryListParam, TData> =>
{
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};
// #endregion
