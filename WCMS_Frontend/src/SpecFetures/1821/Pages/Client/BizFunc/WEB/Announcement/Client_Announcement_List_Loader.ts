import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type {
    AnnouncementListLoaderData,
    AnnouncementListLoaderSpecContext,
    AnnouncementListLoaderSpecSlot,
    IAnnouncementListOptions,
} from "@/Features/Pages/Client/BizFunc/WEB/Announcement/Client_Announcement_List_Loader";
import {
    buildClientDataQueryKey,
    getClientSearchStringValue,
    isSameClientDataQueryParam,
} from "@/Features/Pages/Client/Scaffold/DataQueryTemplate/Client_DataQueryTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { formatDate, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import {
    AnnouncementDetailFields,
    AnnouncementFields,
    PGID,
    SiteViewCountDetailModelFields,
    SiteViewCountHeaderModelFields,
} from "@/types/SchemaFields";
import { useEffect, useMemo, useRef } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";
import { useLoaderData } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];
type SiteViewCountDetailRow = { ProgId?: string | null; TargetInternalId?: string | null; PageViewCount?: number | null; };
type SiteViewCountSetLike = SiteViewCountSet & { SiteViewCountDetail?: SiteViewCountDetailRow[] | null; };
type Spec1821ArchiveQueryParam = Omit<Spec1821ArchiveLoaderArgs, "viewCountParam">;
const SEARCH_KEYWORD_KEY = "keyword";
const SPEC1821_ARCHIVE_VIEW_COUNT_COL_KEY = "__spec1821ArchiveViewCount__";
export interface Spec1821ArchiveLoaderArgs
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
    viewCountParam: QueryListParam;
}
export interface Spec1821ArchiveLoaderRes
{
    gridRes: ApiGridLoaderData<AnnouncementSet>;
    viewCountRes: SiteViewCountSet[];
}
export interface Spec1821ArchiveLoaderData
{
    args: Spec1821ArchiveLoaderArgs;
    res: Spec1821ArchiveLoaderRes;
}
export interface Spec1821ArchiveListVm
{
    pageSize: number;
    pageNumber: number;
    totalPages: number;
    totalCount: number;
    listData: AnnouncementSet[];
    viewCountMap: Record<string, number>;
    gridPropsFromList: GridProps;
    paginatorProps: PaginatorProps | null;
    isLoading: boolean;
    errorList: string[];
}
export interface UseSpec1821ArchiveListParam
{
    lang: Lang;
    opts?: IAnnouncementListOptions;
    searchValues?: SearchValues;
}
interface Spec1821ArchiveGridQueryResult
{
    list?: AnnouncementSet[] | null;
    pageNumber: number;
    totalPages: number;
    count: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
    errorText?: string | null;
}
// #endregion

// #region Public
/** SPEC1821 Loader 擴充：SSR 首屏追加歷年消息資料。 */
export const extendAnnouncementListLoaderSpec: AnnouncementListLoaderSpecSlot = {
    loadExtraData: async (context) => await loadSpec1821ArchiveInitialData(context),
};
/** SPEC1821 歷年消息 Hook：沿用 SSR initial data，再由 CSR 接手搜尋與分頁。 */
export const useSpec1821AnnouncementArchiveListData = (p: UseSpec1821ArchiveListParam): Spec1821ArchiveListVm =>
{
    const loaderData = useLoaderData() as AnnouncementListLoaderData;
    const initial = (loaderData?.spec ?? null) as Spec1821ArchiveLoaderData | null;
    const currentArgs = useMemo(() =>
        buildSpec1821ArchiveArgs({
            lang: p.lang,
            opts: p.opts,
            dayStart: loaderData.args.dayStart,
            dayEnd: loaderData.args.dayEnd,
            searchValues: p.searchValues,
        }), [p.lang, p.opts, p.searchValues, loaderData.args.dayStart, loaderData.args.dayEnd]);
    return useSpec1821ArchiveDataSource({ queryParam: currentArgs, initial });
};
// #endregion

// #region Protected
/** SPEC1821 SSR 時載入歷年消息第一頁資料。 */
const loadSpec1821ArchiveInitialData = async (context: AnnouncementListLoaderSpecContext): Promise<Spec1821ArchiveLoaderData> =>
{
    const announcement = AnnouncementAdapter(context.apiInstance);
    const siteView = SiteViewCountAdapter(context.apiInstance);
    const baseArgs = buildSpec1821ArchiveArgsFromFeatureArgs(context.args);
    const gridLoader = announcement.loader.createQueryGridDataLoader({ getCondition: () => baseArgs.listParam, getApiInstance: () => context.apiInstance });
    const gridRes = await gridLoader({ request: context.request } as LoaderFunctionArgs);
    const listData = gridRes.list.apiRes.Data ?? [];
    const viewCountParam = buildSpec1821ViewCountQuery(getAnnouncementInternalIds(listData));
    const viewCountLoader = siteView.loader.createQueryListLoader({ getCondition: () => viewCountParam, getApiInstance: () => context.apiInstance });
    const viewCountLD = await viewCountLoader({ request: context.request } as LoaderFunctionArgs);
    return { args: { ...baseArgs, viewCountParam }, res: { gridRes, viewCountRes: viewCountLD.apiRes.Data ?? [] } };
};
/** SPEC1821 歷年消息 DataSource，負責 CSR 查詢與 SSR initial 沿用。 */
const useSpec1821ArchiveDataSource = (p: { queryParam: Spec1821ArchiveQueryParam; initial: Spec1821ArchiveLoaderData | null; }): Spec1821ArchiveListVm =>
{
    const announcement = useMemo(() => AnnouncementAdapter(), []);
    const siteView = useMemo(() => SiteViewCountAdapter(), []);
    const gridInitial = useMemo(() => buildArchiveGridInitial(p.queryParam, p.initial), [p.queryParam, p.initial]);
    const grid = announcement.hooks.useQueryGridData({ baseParam: p.queryParam.listParam, deps: [p.queryParam.condition, p.queryParam.pageSize], initial: gridInitial });
    useResetArchivePageOnSearchChange({ queryParam: p.queryParam, onPageChange: grid.onPageChange });
    const viewCountParam = useMemo(() => buildSpec1821ViewCountQuery(getAnnouncementInternalIds(grid.list ?? [])), [grid.list]);
    const viewCountInitial = useMemo(() => buildArchiveViewCountInitial(viewCountParam, p.initial), [viewCountParam, p.initial]);
    const viewCountParamKey = useMemo(() => JSON.stringify(viewCountParam ?? null), [viewCountParam]);
    const useViewCount = siteView.hooks.useQueryList({ condition: viewCountParam, initial: viewCountInitial, deps: [viewCountParamKey] });
    return buildSpec1821ArchiveVm({ queryParam: p.queryParam, grid, viewCountRows: useViewCount.data ?? [], viewCountLoading: useViewCount.isLoading, viewCountError: useViewCount.errorText });
};
// #endregion

// #region Private
/** 依 Style 計算歷年消息每頁筆數。 */
const calcSpec1821ArchivePageSize = (style?: number): number =>
{
    const currentStyle = style ?? 0;
    if (currentStyle === 2) return 12;
    return 10;
};
/** 將 timestamp 轉查詢用本地時間字串。 */
const formatQueryDateTime = (value: number): string =>
{
    const d = new Date(value);
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    const ss = pad(d.getSeconds());
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
};
/** 補齊時間文字用的兩位數格式。 */
const pad = (n: number): string =>
{
    return n < 10 ? `0${n}` : `${n}`;
};
/** 從 Feature 首屏參數建立歷年消息 SSR 查詢參數。 */
const buildSpec1821ArchiveArgsFromFeatureArgs = (args: AnnouncementListLoaderData["args"]): Spec1821ArchiveQueryParam =>
{
    return buildSpec1821ArchiveQueryParam({
        lang: args.lang,
        dayStart: args.dayStart,
        dayEnd: args.dayEnd,
        pageNumber: 1,
        pageSize: args.pageSize,
        keyword: args.keyword,
        categoryIds: args.categoryIds,
        tagIds: args.tagIds,
    });
};
/** 從目前搜尋值建立歷年消息 CSR 查詢參數。 */
const buildSpec1821ArchiveArgs = (p: { lang: Lang; opts?: IAnnouncementListOptions; dayStart: number; dayEnd: number; searchValues?: SearchValues; }): Spec1821ArchiveQueryParam =>
{
    const keyword = getClientSearchStringValue(p.searchValues ?? {}, SEARCH_KEYWORD_KEY);
    return buildSpec1821ArchiveQueryParam({
        lang: p.lang,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        pageNumber: 1,
        pageSize: calcSpec1821ArchivePageSize(p.opts?.Style),
        keyword,
        categoryIds: p.opts?.Category ?? "",
        tagIds: p.opts?.Tag ?? "",
    });
};
/** 建立 SPEC1821 歷年消息 QueryParam。 */
const buildSpec1821ArchiveQueryParam = (p: Omit<Spec1821ArchiveQueryParam, "condition" | "listParam">): Spec1821ArchiveQueryParam =>
{
    const condition = buildSpec1821ArchiveCondition(p);
    return { ...p, condition, listParam: buildSpec1821ArchiveQuery({ condition, pageNumber: p.pageNumber, pageSize: p.pageSize }) };
};
/** 建立 SPEC1821 歷年消息查詢條件。 */
const buildSpec1821ArchiveCondition = (p: { lang: Lang; dayStart: number; dayEnd: number; categoryIds: string; tagIds: string; keyword?: string; }): string =>
{
    const dayStartText = formatQueryDateTime(p.dayStart);
    const dayEndText = formatQueryDateTime(p.dayEnd);
    let condition = LibText.Merge(
        " And ",
        false,
        `${AnnouncementFields.Validate_Start} <= ${dayEndText}`,
        `${AnnouncementFields.Validate_End} < ${dayStartText}`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );
    if (p.keyword) condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`);
    if (LibText.safeTrim(p.categoryIds) !== "") condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    if (LibText.safeTrim(p.tagIds) !== "") condition = LibText.Merge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`);
    return condition;
};
/** 建立 SPEC1821 歷年消息 QueryListParam。 */
const buildSpec1821ArchiveQuery = (p: { condition: string; pageNumber: number; pageSize: number; }): QueryListParam =>
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
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};
/** 取公告 internalIds。 */
const getAnnouncementInternalIds = (rows: AnnouncementSet[]): string[] =>
{
    return rows.map(p => p.Announcement?.InternalId ?? "").filter(Boolean);
};
/** 組成 In 查詢可用字串。 */
const buildQuotedValues = (values: string[]): string =>
{
    const quoted = LibText.toTrimmedStringArray(values).map(value => `"${LibCondition.escapeConditionValue(value)}"`);
    return quoted.join(",");
};
/** 建立瀏覽數查詢條件。 */
const buildSpec1821ViewCountCondition = (internalIds: string[]): string =>
{
    const idText = buildQuotedValues(internalIds);
    if (!idText) return "1=0";
    return `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId} = ${PGID.Announcement} And ${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId} In [${idText}]`;
};
/** 建立瀏覽數 QueryListParam。 */
const buildSpec1821ViewCountQuery = (internalIds: string[]): QueryListParam =>
{
    return {
        Fields: [
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId}`,
            `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.PageViewCount}`,
        ],
        Condition: buildSpec1821ViewCountCondition(internalIds),
        PageNumber: 0,
        PageSize: 0,
    };
};
/** 建立歷年消息 Grid SSR initial。 */
const buildArchiveGridInitial = (queryParam: Spec1821ArchiveQueryParam, initial: Spec1821ArchiveLoaderData | null): ApiGridInitial<AnnouncementSet> =>
{
    const isSameParam = Boolean(initial && isSameClientDataQueryParam(queryParam.listParam, initial.args.listParam));
    return { model: initial?.res.gridRes.model ?? null, count: isSameParam ? initial?.res.gridRes.count ?? null : null, list: isSameParam ? initial?.res.gridRes.list ?? null : null };
};
/** 建立歷年消息瀏覽數 SSR initial。 */
const buildArchiveViewCountInitial = (viewCountParam: QueryListParam, initial: Spec1821ArchiveLoaderData | null): ApiLoaderData<QueryListParam, SiteViewCountSet[]> | null =>
{
    if (!initial || !isSameClientDataQueryParam(viewCountParam, initial.args.viewCountParam)) return null;
    return { args: initial.args.viewCountParam, apiRes: { IsSuccess: true, Data: initial.res.viewCountRes, SysMessage: [] } };
};
/** 搜尋條件異動時回到歷年消息第一頁。 */
const useResetArchivePageOnSearchChange = (p: { queryParam: Spec1821ArchiveQueryParam; onPageChange: (page: number) => void; }): void =>
{
    const resetKey = useMemo(
        () =>
            buildClientDataQueryKey({
                lang: p.queryParam.lang,
                dayStart: p.queryParam.dayStart,
                dayEnd: p.queryParam.dayEnd,
                pageSize: p.queryParam.pageSize,
                categoryIds: p.queryParam.categoryIds,
                tagIds: p.queryParam.tagIds,
                keyword: p.queryParam.keyword ?? "",
            }),
        [p.queryParam],
    );
    const prevResetKeyRef = useRef<string>(resetKey);
    useEffect(() =>
    {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        p.onPageChange(1);
    }, [resetKey, p.onPageChange]);
};
/** 組歷年消息瀏覽數 map。 */
const buildViewCountMap = (rows: SiteViewCountSet[]): Record<string, number> =>
{
    const result: Record<string, number> = {};
    rows.forEach((item) =>
        (item as SiteViewCountSetLike).SiteViewCountDetail?.forEach((detail) =>
        {
            const key = detail.TargetInternalId ?? "";
            if (!key) return;
            result[key] = (result[key] ?? 0) + Number(detail.PageViewCount ?? 0);
        })
    );
    return result;
};
/** 由歷年消息資料組 GridProps。 */
const buildSpec1821ArchiveGridProps = (p: { lang: Lang; listData: AnnouncementSet[]; viewCountMap: Record<string, number>; pageNumber: number; totalPages: number; onPageChange: (page: number) => void; }): GridProps =>
{
    const columns = buildSpec1821ArchiveColumns();
    const rows: GridRow[] = p.listData.map((item) => buildSpec1821ArchiveGridRow({ item, lang: p.lang, columns, viewCountMap: p.viewCountMap }));
    return { columns, rows, CurrentPage: p.pageNumber, TotalPage: p.totalPages, onPageChange: p.onPageChange };
};
/** 建立歷年消息欄位。 */
const buildSpec1821ArchiveColumns = (): ColumnConfig[] =>
{
    return [{ key: AnnouncementDetailFields.Title, title: "標題" }, { key: AnnouncementFields.Validate_Start, title: "日期" }, { key: AnnouncementFields.Categories, title: "分類" }, { key: AnnouncementFields.Tags, title: "標籤" }, {
        key: SPEC1821_ARCHIVE_VIEW_COUNT_COL_KEY,
        title: "瀏覽",
    }];
};
/** 建立歷年消息單列 GridRow。 */
const buildSpec1821ArchiveGridRow = (p: { item: AnnouncementSet; lang: Lang; columns: ColumnConfig[]; viewCountMap: Record<string, number>; }): GridRow =>
{
    const internalId = p.item.Announcement?.InternalId ?? "";
    const detail = p.item.AnnouncementDetail?.find(x => x.Lang === p.lang);
    const finalCount = Number(p.viewCountMap[internalId] ?? 0);
    const cells: RowCell[] = p.columns.map(col => ({ col, content: resolveSpec1821ArchiveCellText({ colKey: col.key, item: p.item, detailTitle: detail?.Title ?? "", finalCount }) }));
    return { keyId: internalId, cells };
};
/** 建立歷年消息 Cell 文字。 */
const resolveSpec1821ArchiveCellText = (p: { colKey: string; item: AnnouncementSet; detailTitle: string; finalCount: number; }): string =>
{
    if (p.colKey === AnnouncementDetailFields.Title) return p.detailTitle;
    if (p.colKey === AnnouncementFields.Validate_Start) return formatDate(p.item.Announcement?.Validate_Start) ?? "";
    if (p.colKey === AnnouncementFields.Categories) return p.item.Announcement?.Categories ?? "";
    if (p.colKey === AnnouncementFields.Tags) return p.item.Announcement?.Tags ?? "";
    if (p.colKey === SPEC1821_ARCHIVE_VIEW_COUNT_COL_KEY) return String(p.finalCount);
    return "";
};
/** 建立歷年消息 ViewModel。 */
const buildSpec1821ArchiveVm = (p: { queryParam: Spec1821ArchiveQueryParam; grid: Spec1821ArchiveGridQueryResult; viewCountRows: SiteViewCountSet[]; viewCountLoading: boolean; viewCountError: string | null; }): Spec1821ArchiveListVm =>
{
    const viewCountMap = buildViewCountMap(p.viewCountRows);
    const paginatorProps = p.queryParam.pageSize === 0 ? null : { currentPage: p.grid.pageNumber, totalPages: p.grid.totalPages, onPageChange: p.grid.onPageChange };
    return {
        pageSize: p.queryParam.pageSize,
        pageNumber: p.grid.pageNumber,
        totalPages: p.grid.totalPages,
        totalCount: p.grid.count,
        listData: p.grid.list ?? [],
        viewCountMap,
        gridPropsFromList: buildSpec1821ArchiveGridProps({ lang: p.queryParam.lang, listData: p.grid.list ?? [], viewCountMap, pageNumber: p.grid.pageNumber, totalPages: p.grid.totalPages, onPageChange: p.grid.onPageChange }),
        paginatorProps,
        isLoading: Boolean(p.grid.isLoading || p.viewCountLoading),
        errorList: [p.grid.errorText, p.viewCountError].filter((x): x is string => Boolean(x)),
    };
};
// #endregion
