import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";

import {
    buildClientDataQueryKey,
    buildClientDataQueryState,
    type ClientDataQueryDataSourceResult,
    type ClientDataQueryPaginatorModel,
    type ClientDataQuerySearchBarModel,
    type ClientDataQueryTemplate,
    getClientSearchStringValue,
    isSameClientDataQueryParam,
    useClientDataQueryTemplate,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { formatDate, getTodayRange, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    CategoryDetailFields,
    CategoryFields,
    PGID,
    SiteViewCountDetailModelFields,
    SiteViewCountHeaderModelFields,
    TagDataFields,
    TagDetailFields,
} from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];
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
    gridRes: ApiGridLoaderData<AnnouncementSet>;
    categoryRes: CategorySet[];
    tagRes: TagSet[];
    viewCountRes: SiteViewCountSet[];
}
export interface AnnouncementListLoaderData
{
    args: AnnouncementListLoaderArgs;
    res: AnnouncementListLoaderRes;
}
export interface UseAnnouncementListDataResult
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: AnnouncementSet[];
    categoryData: CategorySet[];
    tagData: TagSet[];
    viewCountMap: Record<string, number>;
    gridPropsFromList: GridProps;
    paginatorProps: PaginatorProps | null;
    searchBar: ClientDataQuerySearchBarModel | null;
    isLoading: boolean;
    errorList: string[];
    onPageChange: (page: number) => void;
}
/** 前端 grid 專用欄位 key，避免再依賴 Announcement.ViewCount */
const ANNOUNCEMENT_VIEW_COUNT_COL_KEY = "__announcementViewCount__";
type SiteViewCountDetailRow = { ProgId?: string | null; TargetInternalId?: string | null; PageViewCount?: number | null; };
type SiteViewCountSetLike = SiteViewCountSet & { SiteViewCountDetail?: SiteViewCountDetailRow[] | null; };
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
    AnnouncementListLoaderData
>;
// #endregion

// #region Public
/** SSR Loader：首屏撈 announcement + category + tag + siteviewcount */
export const AnnouncementListLoader = (
    p: {
        lang: Lang;
        opts?: IAnnouncementListOptions;
        overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
    },
) =>
async ({ request }: LoaderFunctionArgs): Promise<AnnouncementListLoaderData> =>
{
    // 宣告變數
    const ssrApi = getSsrApi(request);
    const announcement = AnnouncementAdapter(ssrApi);
    const category = CategoryAdapter(ssrApi);
    const tag = TagAdapter(ssrApi);
    const siteView = SiteViewCountAdapter(ssrApi);
    const { dayStart, dayEnd } = getTodayRange();
    const baseArgs = buildLoaderArgs({
        lang: p.lang,
        opts: p.opts,
        dayStart,
        dayEnd,
        overrides: {
            pageNumber: p.overrides?.pageNumber,
            pageSize: p.overrides?.pageSize,
            keyword: p.overrides?.keyword,
            categoryIds: p.overrides?.categoryIds,
            tagIds: p.overrides?.tagIds,
        },
    });
    const gridLoader = announcement.loader.createQueryGridDataLoader({ getCondition: () => baseArgs.listParam, getApiInstance: () => ssrApi });
    const cateLoader = category.loader.createQueryListLoader({ getCondition: () => baseArgs.cateParam, getApiInstance: () => ssrApi });
    const tagLoader = tag.loader.createQueryListLoader({ getCondition: () => baseArgs.tagParam, getApiInstance: () => ssrApi });
    const [gridRes, categoryLD, tagLD] = await Promise.all([
        gridLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
    ]);
    const listRes = gridRes.list.apiRes.Data ?? [];
    const viewCountParam = buildViewCountQuery(getAnnouncementInternalIds(listRes));
    const viewCountLoader = siteView.loader.createQueryListLoader({ getCondition: () => viewCountParam, getApiInstance: () => ssrApi });
    const viewCountLD = await viewCountLoader({ request } as LoaderFunctionArgs);
    return {
        args: { ...baseArgs, viewCountParam },
        res: { gridRes, categoryRes: categoryLD.apiRes.Data ?? [], tagRes: tagLD.apiRes.Data ?? [], viewCountRes: viewCountLD.apiRes.Data ?? [] },
    };
};
/** CSR Hook：Component 只拿 VM，資料查詢流程交給 Client_DataQueryTemplate */
export const useAnnouncementListData = (p: { lang: Lang; opts?: IAnnouncementListOptions; kw?: string; }): UseAnnouncementListDataResult =>
{
    const initial = useLoaderData() as AnnouncementListLoaderData;
    const template = useMemo(
        () =>
            createAnnouncementDataQueryTemplate({
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
            }),
        [
            p.lang,
            p.opts,
            p.kw,
            initial.args.dayStart,
            initial.args.dayEnd,
            initial.args.pageNumber,
            initial.args.pageSize,
            initial.args.categoryIds,
            initial.args.tagIds,
        ],
    );
    const templateVm = useClientDataQueryTemplate(template);
    return {
        ...templateVm.viewModel,
        paginatorProps: templateVm.paginatorProps,
        searchBar: templateVm.searchBar,
        isLoading: templateVm.isLoading,
        errorList: templateVm.errorList,
    };
};
// #endregion

// #region Private
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
/** 將 timestamp 轉查詢用本地時間字串 */
const formatQueryDateTime = (value: number): string =>
{
    // 宣告變數
    const d = new Date(value);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
};
/** 依 Style 計算每頁筆數 */
const calcPageSize = (style?: number): number =>
{
    const currentStyle = style ?? 0;
    if (currentStyle === 2) return 12;
    if (currentStyle === 8) return 0;
    return 10;
};
/** 組成 In 查詢可用字串 */
const buildQuotedValues = (values: string[]): string =>
{
    const quoted = LibText.toTrimmedStringArray(values).map(value => `"${LibCondition.escapeConditionValue(value)}"`);
    return quoted.join(",");
};
/** 建公告查詢條件 */
const buildAnnouncementCondition = (p: { lang: Lang; dayStart: number; dayEnd: number; categoryIds: string; tagIds: string; keyword?: string; }): string =>
{
    const dayStartText = formatQueryDateTime(p.dayStart);
    const dayEndText = formatQueryDateTime(p.dayEnd);
    let condition = LibText.Merge(
        " And ",
        false,
        `${AnnouncementFields.Validate_Start} <= ${dayEndText}`,
        `(${AnnouncementFields.Validate_End} >= ${dayStartText} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );
    if (p.keyword)
    {
        condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`);
    }
    if (p.categoryIds)
    {
        condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    }
    if (p.tagIds)
    {
        condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`);
    }
    return condition;
};
/** 建公告 QueryListParam */
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

/** 建分類 QueryListParam */
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
/** 建標籤 QueryListParam */
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
const getAnnouncementInternalIds = (rows: AnnouncementSet[]): string[] =>
{
    return rows.map(p => p.Announcement?.InternalId ?? "").filter(Boolean);
};
/** 建瀏覽數條件 */
const buildViewCountCondition = (internalIds: string[]): string =>
{
    const idText = buildQuotedValues(internalIds);
    if (!idText) return "1=0";
    return `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId} = ${PGID.Announcement} And ${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId} In [${idText}]`;
};
/** 建瀏覽數 QueryListParam */
const buildViewCountQuery = (internalIds: string[]): QueryListParam =>
{
    return {
        Fields: [
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.PageViewCount}`,
        ],
        Condition: buildViewCountCondition(internalIds),
        PageNumber: 0,
        PageSize: 0,
    };
};
/** 建立 Announcement 前台搜尋欄位 */
const buildAnnouncementSearchFields = (): SearchFieldConfig[] =>
{
    return [{
        key: SEARCH_KEYWORD_KEY,
        title: "關鍵字",
        label: "關鍵字",
        type: "text",
        placeholder: "請輸入公告標題",
        maxLength: 100,
    }] as unknown as SearchFieldConfig[];
};
/** 建立 Announcement 搜尋初始值 */
const buildAnnouncementSearchValues = (keyword?: string): SearchValues =>
{
    return { [SEARCH_KEYWORD_KEY]: LibText.safeTrim(keyword) } as SearchValues;
};
/** 建立 Announcement 初始 ViewState */
const buildAnnouncementInitialViewState = (
    p: { opts?: IAnnouncementListOptions; overrides?: Partial<{ pageNumber: number; pageSize: number; }>; },
): IListViewState =>
{
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? calcPageSize(p.opts?.Style);
    return { pageNumber, pageSize } as IListViewState;
};
/** 建立 Announcement 查詢參數 */
const buildAnnouncementSearchParams = (
    p: {
        lang: Lang;
        opts?: IAnnouncementListOptions;
        dayStart: number;
        dayEnd: number;
        overrides?: Partial<{ keyword: string; categoryIds: string; tagIds: string; }>;
        values: SearchValues;
        viewState: IListViewState;
    },
): AnnouncementSearchParams =>
{
    const keyword = getClientSearchStringValue(p.values, SEARCH_KEYWORD_KEY) ?? p.overrides?.keyword;
    const categoryIds = p.overrides?.categoryIds ?? (p.opts?.Category ?? "");
    const tagIds = p.overrides?.tagIds ?? (p.opts?.Tag ?? "");
    return {
        lang: p.lang,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        pageNumber: p.viewState.pageNumber,
        pageSize: p.viewState.pageSize,
        keyword,
        categoryIds,
        tagIds,
    };
};
/** 建立 Announcement QueryParam，Loader / Hook 都統一走這裡 */
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
    const pagination = p.opts?.Style === 8
        ? null
        : { defaultPageNumber: initialViewState.pageNumber, defaultPageSize: initialViewState.pageSize, resetPageOnSearch: true };
    return {
        featureKey: "AnnouncementList",
        dataMode: "multiple",
        initialSearchValues,
        initialViewState,
        pagination,
        searchBar: { title: "搜尋條件", actionAlign: "right", columnCount: 3 },
        feature: {
            searchFields: buildAnnouncementSearchFields(),
            toSearchParams: (values, viewState) => buildAnnouncementSearchParams({ ...p, values, viewState }),
            buildSearchConditions: (ctx) => [buildAnnouncementCondition(ctx.searchParams)],
            buildQueryParam: (ctx) => buildAnnouncementQueryArgs({ ...ctx.searchParams, condition: ctx.searchCondition }),
            useDataSource: (ctx) => useAnnouncementDataSource({ queryParam: ctx.queryParam, loaderData: ctx.loaderData }),
            buildViewModel: (ctx) => ctx.rawData,
        },
    };
};
/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (
    p: {
        lang: Lang;
        opts?: IAnnouncementListOptions;
        dayStart: number;
        dayEnd: number;
        overrides?: Partial<{ pageNumber: number; pageSize: number; keyword: string; categoryIds: string; tagIds: string; }>;
    },
): AnnouncementQueryParam =>
{
    const template = createAnnouncementDataQueryTemplate(p);
    const viewState = buildAnnouncementInitialViewState({ opts: p.opts, overrides: p.overrides });
    const searchValues = buildAnnouncementSearchValues(p.overrides?.keyword);
    return buildClientDataQueryState(template, searchValues, viewState).queryParam;
};
/** 取瀏覽數明細列 */
const getSiteViewCountDetails = (item: SiteViewCountSet): SiteViewCountDetailRow[] =>
{
    const detailRows = (item as SiteViewCountSetLike).SiteViewCountDetail;
    if (!Array.isArray(detailRows)) return [];
    return detailRows;
};
/** 組公告瀏覽數 map */
const buildViewCountMap = (rows: SiteViewCountSet[]): Record<string, number> =>
{
    const result: Record<string, number> = {};
    rows.forEach((item) =>
    {
        const detailRows = getSiteViewCountDetails(item);
        detailRows.forEach((detail) =>
        {
            const key = detail.TargetInternalId ?? "";
            if (!key) return;
            result[key] = (result[key] ?? 0) + Number(detail.PageViewCount ?? 0);
        });
    });
    return result;
};
/** 由資料組 gridProps */
const buildGridPropsFromList = (
    p: {
        lang: Lang;
        listData: AnnouncementSet[];
        viewCountMap: Record<string, number>;
        pageNumber: number;
        totalPages: number;
        onPageChange: (page: number) => void;
    },
): GridProps =>
{
    const columns: ColumnConfig[] = [
        { key: AnnouncementDetailFields.Title, title: "標題" },
        { key: AnnouncementFields.Validate_Start, title: "日期" },
        { key: AnnouncementFields.Categories, title: "分類" },
        { key: AnnouncementFields.Tags, title: "標籤" },
        { key: ANNOUNCEMENT_VIEW_COUNT_COL_KEY, title: "瀏覽" },
    ];
    const rows: GridRow[] = p.listData.map((item) =>
    {
        const detail = item.AnnouncementDetail?.find(x => x.Lang === p.lang);
        const internalId = item.Announcement?.InternalId ?? "";
        const finalCount = Number(p.viewCountMap[internalId] ?? 0);
        const cells: RowCell[] = columns.map((col) =>
        {
            const content = resolveGridCellContent({ colKey: col.key, item, detailTitle: detail?.Title ?? "", finalCount });
            return { col, content };
        });
        return { keyId: internalId, cells };
    });
    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};
/** 處理 grid cell 顯示內容 */
const resolveGridCellContent = (p: { colKey: string; item: AnnouncementSet; detailTitle: string; finalCount: number; }): string =>
{
    switch (p.colKey)
    {
        case AnnouncementDetailFields.Title:
            return p.detailTitle;
        case AnnouncementFields.Validate_Start:
            return formatDate(p.item.Announcement?.Validate_Start) ?? "";
        case AnnouncementFields.Categories:
            return p.item.Announcement?.Categories ?? "";
        case AnnouncementFields.Tags:
            return p.item.Announcement?.Tags ?? "";
        case ANNOUNCEMENT_VIEW_COUNT_COL_KEY:
            return String(p.finalCount);
        default:
            return "";
    }
};
/** Announcement DataSource：統一處理 CSR 查詢與 SSR initial 沿用 */
const useAnnouncementDataSource = (
    p: { queryParam: AnnouncementQueryParam; loaderData: AnnouncementListLoaderData | null; },
): ClientDataQueryDataSourceResult<AnnouncementListViewModel> =>
{
    const initial = p.loaderData as AnnouncementListLoaderData;
    const currentArgs = p.queryParam;
    const announcement = useMemo(() => AnnouncementAdapter(), []);
    const siteView = useMemo(() => SiteViewCountAdapter(), []);
    const gridInitial = useMemo<ApiGridInitial<AnnouncementSet>>(() =>
    {
        const countInitial = isSameClientDataQueryParam(currentArgs.listParam, initial.res.gridRes.count?.args) ? initial.res.gridRes.count : null;
        const listInitial = isSameClientDataQueryParam(currentArgs.listParam, initial.res.gridRes.list?.args) ? initial.res.gridRes.list : null;
        return { model: initial.res.gridRes.model, count: countInitial, list: listInitial };
    }, [currentArgs.listParam, initial.res.gridRes]);
    const grid = announcement.hooks.useQueryGridData({
        baseParam: currentArgs.listParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        initial: gridInitial,
    });
    const resetKey = useMemo(
        () =>
            buildClientDataQueryKey({
                lang: currentArgs.lang,
                dayStart: currentArgs.dayStart,
                dayEnd: currentArgs.dayEnd,
                pageSize: currentArgs.pageSize,
                categoryIds: currentArgs.categoryIds,
                tagIds: currentArgs.tagIds,
                keyword: currentArgs.keyword ?? "",
            }),
        [currentArgs],
    );
    const prevResetKeyRef = useRef<string>(resetKey);
    useEffect(() =>
    {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        grid.onPageChange(1);
    }, [resetKey, grid.onPageChange]);
    const viewCountParam = useMemo(() => buildViewCountQuery(getAnnouncementInternalIds(grid.list ?? [])), [grid.list]);
    const viewCountInitial = useMemo(() =>
    {
        if (!isSameClientDataQueryParam(viewCountParam, initial.args.viewCountParam)) return null;
        return buildQueryInitial(initial.args.viewCountParam, initial.res.viewCountRes);
    }, [viewCountParam, initial.args.viewCountParam, initial.res.viewCountRes]);
    const viewCountParamKey = useMemo(() => JSON.stringify(viewCountParam ?? null), [viewCountParam]);
    const useViewCount = siteView.hooks.useQueryList({ condition: viewCountParam, initial: viewCountInitial, deps: [viewCountParamKey] });
    const viewCountMap = useMemo(() => buildViewCountMap(useViewCount.data ?? []), [useViewCount.data]);
    const categoryData = useMemo(() => initial.res.categoryRes ?? [], [initial.res.categoryRes]);
    const tagData = useMemo(() => initial.res.tagRes ?? [], [initial.res.tagRes]);
    const gridPropsFromList = useMemo(
        () =>
            buildGridPropsFromList({
                lang: currentArgs.lang,
                listData: grid.list ?? [],
                viewCountMap,
                pageNumber: grid.pageNumber,
                totalPages: grid.totalPages,
                onPageChange: grid.onPageChange,
            }),
        [currentArgs.lang, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, viewCountMap],
    );
    const paginatorProps = useMemo<PaginatorProps | null>(() =>
    {
        if (currentArgs.pageSize === 0) return null;
        return { currentPage: grid.pageNumber, totalPages: grid.totalPages, onPageChange: grid.onPageChange };
    }, [currentArgs.pageSize, grid.pageNumber, grid.totalPages, grid.onPageChange]);
    const paginator = useMemo<ClientDataQueryPaginatorModel | null>(() =>
    {
        if (!paginatorProps) return null;
        return {
            currentPage: paginatorProps.currentPage,
            pageSize: currentArgs.pageSize,
            totalPages: paginatorProps.totalPages,
            totalCount: grid.count,
            onPageChange: paginatorProps.onPageChange,
        };
    }, [paginatorProps, currentArgs.pageSize, grid.count]);
    const rawData = useMemo<AnnouncementListViewModel>(
        () => ({
            pageSize: currentArgs.pageSize,
            pageNumber: grid.pageNumber,
            totalPages: grid.totalPages,
            totalCount: grid.count,
            listData: grid.list ?? [],
            categoryData,
            tagData,
            viewCountMap,
            gridPropsFromList,
            paginatorProps,
            onPageChange: grid.onPageChange,
        }),
        [
            currentArgs.pageSize,
            grid.pageNumber,
            grid.totalPages,
            grid.count,
            grid.list,
            categoryData,
            tagData,
            viewCountMap,
            gridPropsFromList,
            paginatorProps,
            grid.onPageChange,
        ],
    );
    const errors = useMemo(() => [grid.errorText, useViewCount.errorText], [grid.errorText, useViewCount.errorText]);
    return { rawData, isLoading: Boolean(grid.isLoading || useViewCount.isLoading), errors, paginator };
};
const buildQueryInitial = <TData>(args: QueryListParam, data: TData): ApiLoaderData<QueryListParam, TData> =>
{
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};
// #endregion
