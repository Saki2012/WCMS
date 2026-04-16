import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiGridInitial, ApiGridLoaderData, ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { getSsrApi } from "@/SysCore/Utils/API/APIBase";
import { FormatDate, getTodayRange } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
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

type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];

/** AnnouncementList options */
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
    isLoading: boolean;
    errorList: string[];
    onPageChange: (page: number) => void;
}

/** 前端 grid 專用欄位 key，避免再依賴 Announcement.ViewCount */
const ANNOUNCEMENT_VIEW_COUNT_COL_KEY = "__announcementViewCount__";

type SiteViewCountDetailRow = {
    ProgId?: string | null;
    TargetInternalId?: string | null;
    PageViewCount?: number | null;
};

type SiteViewCountSetLike = SiteViewCountSet & { SiteViewCountDetail?: SiteViewCountDetailRow[] | null; };

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

    // return
    return `${y}-${m}-${day}T${hh}:${mm}:${ss}`;
};

/** 依 Style 計算每頁筆數 */
const calcPageSize = (style?: number): number =>
{
    // 宣告變數
    const currentStyle = style ?? 0;

    // 執行 function
    if (currentStyle === 2) return 12;
    if (currentStyle === 8) return 0;

    // return
    return 10;
};

/** 跳脫查詢字串雙引號 */
const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

/** 組成 In 查詢可用字串 */
const buildQuotedValues = (values: string[]): string =>
{
    // 宣告變數
    const quoted = values.map(p => p.trim()).filter(Boolean).map(p => `"${escapeQueryValue(p)}"`);

    // return
    return quoted.join(",");
};

/** 正規化關鍵字 */
const normalizeKeyword = (value?: string): string | undefined =>
{
    // 宣告變數
    const keyword = `${value ?? ""}`.trim();

    // return
    return keyword ? keyword : undefined;
};

/** 建公告查詢條件 */
const buildAnnouncementCondition = (p: {
    lang: Lang;
    dayStart: number;
    dayEnd: number;
    categoryIds: string;
    tagIds: string;
    keyword?: string;
}): string =>
{
    // 宣告變數
    const dayStartText = formatQueryDateTime(p.dayStart);
    const dayEndText = formatQueryDateTime(p.dayEnd);

    let condition = LibMerge(
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
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`,
        );
    }

    if (p.categoryIds)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`,
        );
    }

    if (p.tagIds)
    {
        condition = LibMerge(
            " And ",
            false,
            condition,
            `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`,
        );
    }

    // return
    return condition;
};

/** 建公告 QueryListParam */
const buildAnnouncementQuery = (p: {
    condition: string;
    pageNumber: number;
    pageSize: number;
}): QueryListParam =>
{
    // return
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
        OrderBy: [
            { Col: AnnouncementFields.Validate_Start, Desc: true },
            { Col: AnnouncementFields.CreateTime, Desc: true },
        ],
        PageNumber: p.pageNumber,
        PageSize: p.pageSize,
    };
};

/** 建分類 QueryListParam */
const buildCategoryQuery = (progId: string): QueryListParam =>
{
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

/** 建標籤 QueryListParam */
const buildTagQuery = (progId: string): QueryListParam =>
{
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

/** 取公告 internalIds */
const getAnnouncementInternalIds = (rows: AnnouncementSet[]): string[] =>
{
    // return
    return rows.map(p => p.Announcement?.InternalId ?? "").filter(Boolean);
};

/** 建瀏覽數條件 */
const buildViewCountCondition = (internalIds: string[]): string =>
{
    // 宣告變數
    const idText = buildQuotedValues(internalIds);
    if (!idText) return "1=0";

    // return
    return `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId} = ${PGID.Announcement} And ${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId} In [${idText}]`;
};

/** 建瀏覽數 QueryListParam */
const buildViewCountQuery = (internalIds: string[]): QueryListParam =>
{
    // return
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

/** 組 loader / hook 共用參數 */
const buildLoaderArgs = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    dayStart: number;
    dayEnd: number;
    overrides?: Partial<{
        pageNumber: number;
        pageSize: number;
        keyword: string;
        categoryIds: string;
        tagIds: string;
    }>;
}): Omit<AnnouncementListLoaderArgs, "viewCountParam"> =>
{
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? calcPageSize(p.opts?.Style);
    const categoryIds = p.overrides?.categoryIds ?? (p.opts?.Category ?? "");
    const tagIds = p.overrides?.tagIds ?? (p.opts?.Tag ?? "");
    const keyword = normalizeKeyword(p.overrides?.keyword);

    const condition = buildAnnouncementCondition({
        lang: p.lang,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        categoryIds,
        tagIds,
        keyword,
    });

    return {
        lang: p.lang,
        dayStart: p.dayStart,
        dayEnd: p.dayEnd,
        pageSize,
        pageNumber,
        keyword,
        categoryIds,
        tagIds,
        condition,
        listParam: buildAnnouncementQuery({ condition, pageNumber, pageSize }),
        cateParam: buildCategoryQuery(PGID.Announcement),
        tagParam: buildTagQuery(PGID.Announcement),
    };
};

const matchQueryInitial = <TData>(
    currentParam: QueryListParam,
    initial: ApiLoaderData<QueryListParam, TData> | null | undefined,
): ApiLoaderData<QueryListParam, TData> | null =>
{
    const currentKey = JSON.stringify(currentParam ?? null);
    const initialKey = JSON.stringify(initial?.args ?? null);
    return currentKey === initialKey ? (initial ?? null) : null;
};

/** 取瀏覽數明細列 */
const getSiteViewCountDetails = (item: SiteViewCountSet): SiteViewCountDetailRow[] =>
{
    // 宣告變數
    const detailRows = (item as SiteViewCountSetLike).SiteViewCountDetail;

    // return
    if (!Array.isArray(detailRows)) return [];
    return detailRows;
};

/** 組公告瀏覽數 map */
const buildViewCountMap = (rows: SiteViewCountSet[]): Record<string, number> =>
{
    // 宣告變數
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

    // return
    return result;
};

/** 由資料組 gridProps */
const buildGridPropsFromList = (p: {
    lang: Lang;
    listData: AnnouncementSet[];
    viewCountMap: Record<string, number>;
    pageNumber: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}): GridProps =>
{
    // 宣告變數
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
            const content = resolveGridCellContent({
                colKey: col.key,
                item,
                detailTitle: detail?.Title ?? "",
                finalCount,
            });

            return { col, content };
        });

        return { keyId: internalId, cells };
    });

    // return
    return {
        columns,
        rows,
        CurrentPage: p.pageNumber,
        TotalPage: p.totalPages,
        onPageChange: p.onPageChange,
    };
};

/** 處理 grid cell 顯示內容 */
const resolveGridCellContent = (p: {
    colKey: string;
    item: AnnouncementSet;
    detailTitle: string;
    finalCount: number;
}): string =>
{
    // 執行 function
    switch (p.colKey)
    {
        case AnnouncementDetailFields.Title:
            return p.detailTitle;
        case AnnouncementFields.Validate_Start:
            return FormatDate(p.item.Announcement?.Validate_Start) ?? "";
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

/** 取語系/分類/標籤/日期等重置 key */
const buildResetKey = (
    args: Pick<
        AnnouncementListLoaderArgs,
        "lang" | "dayStart" | "dayEnd" | "pageSize" | "categoryIds" | "tagIds" | "keyword"
    >,
): string =>
{
    // return
    return JSON.stringify({
        lang: args.lang,
        dayStart: args.dayStart,
        dayEnd: args.dayEnd,
        pageSize: args.pageSize,
        categoryIds: args.categoryIds,
        tagIds: args.tagIds,
        keyword: args.keyword ?? "",
    });
};

/** SSR Loader：首屏撈 announcement + category + tag + siteviewcount */
export const AnnouncementListLoader = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    overrides?: Partial<{
        pageNumber: number;
        pageSize: number;
        keyword: string;
        categoryIds: string;
        tagIds: string;
    }>;
}) =>
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

    const gridLoader = announcement.loader.createQueryGridDataLoader({
        getCondition: () => baseArgs.listParam,
        getApiInstance: () => ssrApi,
    });

    const cateLoader = category.loader.createQueryListLoader({
        getCondition: () => baseArgs.cateParam,
        getApiInstance: () => ssrApi,
    });

    const tagLoader = tag.loader.createQueryListLoader({
        getCondition: () => baseArgs.tagParam,
        getApiInstance: () => ssrApi,
    });

    const [gridRes, categoryLD, tagLD] = await Promise.all([
        gridLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
    ]);

    const listRes = gridRes.list.apiRes.Data ?? [];
    const viewCountParam = buildViewCountQuery(getAnnouncementInternalIds(listRes));

    const viewCountLoader = siteView.loader.createQueryListLoader({
        getCondition: () => viewCountParam,
        getApiInstance: () => ssrApi,
    });

    const viewCountLD = await viewCountLoader({ request } as LoaderFunctionArgs);

    return {
        args: { ...baseArgs, viewCountParam },
        res: {
            gridRes,
            categoryRes: categoryLD.apiRes.Data ?? [],
            tagRes: tagLD.apiRes.Data ?? [],
            viewCountRes: viewCountLD.apiRes.Data ?? [],
        },
    };
};
/** CSR Hook：Component 一行拿資料，切頁/條件變動時自動重撈 list + siteviewcount */
export const useAnnouncementListData = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    kw?: string;
}): UseAnnouncementListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as AnnouncementListLoaderData;
    const announcement = useMemo(() => AnnouncementAdapter(), []);
    const siteView = useMemo(() => SiteViewCountAdapter(), []);

    const currentArgs = useMemo(() =>
    {
        return buildLoaderArgs({
            lang: p.lang,
            opts: p.opts,
            dayStart: initial.args.dayStart,
            dayEnd: initial.args.dayEnd,
            overrides: {
                keyword: p.kw,
            },
        });
    }, [p.lang, p.opts, p.kw, initial.args.dayStart, initial.args.dayEnd]);

    const gridInitial = useMemo<ApiGridInitial<AnnouncementSet>>(() =>
    {
        return {
            model: initial.res.gridRes.model,
            count: matchQueryInitial(currentArgs.listParam, initial.res.gridRes.count),
            list: matchQueryInitial(currentArgs.listParam, initial.res.gridRes.list),
        };
    }, [currentArgs.listParam, initial.res.gridRes]);

    const grid = announcement.hooks.useQueryGridData({
        baseParam: currentArgs.listParam,
        deps: [currentArgs.condition, currentArgs.pageSize],
        initial: gridInitial,
    });

    const resetKey = useMemo(() =>
    {
        return buildResetKey(currentArgs);
    }, [currentArgs]);

    const prevResetKeyRef = useRef<string>(resetKey);

    useEffect(() =>
    {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        grid.onPageChange(1);
    }, [resetKey, grid.onPageChange]);

    const viewCountParam = useMemo(() =>
    {
        return buildViewCountQuery(getAnnouncementInternalIds(grid.list ?? []));
    }, [grid.list]);

    const viewCountInitial = useMemo(() =>
    {
        return matchQueryInitial(
            viewCountParam,
            buildQueryInitial(initial.args.viewCountParam, initial.res.viewCountRes),
        );
    }, [viewCountParam, initial.args.viewCountParam, initial.res.viewCountRes]);

    const viewCountParamKey = useMemo(() =>
    {
        return JSON.stringify(viewCountParam ?? null);
    }, [viewCountParam]);

    const useViewCount = siteView.hooks.useQueryList({
        condition: viewCountParam,
        initial: viewCountInitial,
        deps: [viewCountParamKey],
    });

    const viewCountMap = useMemo(() =>
    {
        return buildViewCountMap(useViewCount.data ?? []);
    }, [useViewCount.data]);

    const categoryData = useMemo(() =>
    {
        return initial.res.categoryRes ?? [];
    }, [initial.res.categoryRes]);

    const tagData = useMemo(() =>
    {
        return initial.res.tagRes ?? [];
    }, [initial.res.tagRes]);

    const gridPropsFromList = useMemo(() =>
    {
        return buildGridPropsFromList({
            lang: p.lang,
            listData: grid.list ?? [],
            viewCountMap,
            pageNumber: grid.pageNumber,
            totalPages: grid.totalPages,
            onPageChange: grid.onPageChange,
        });
    }, [p.lang, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, viewCountMap]);

    const errorList = useMemo(() =>
    {
        return [grid.errorText, useViewCount.errorText].filter((x): x is string => Boolean(x));
    }, [grid.errorText, useViewCount.errorText]);

    const isLoading = Boolean(grid.isLoading || useViewCount.isLoading);

    return {
        pageSize: currentArgs.pageSize,
        pageNumber: grid.pageNumber,
        totalPages: grid.totalPages,
        totalCount: grid.count,
        listData: grid.list ?? [],
        categoryData,
        tagData,
        viewCountMap,
        gridPropsFromList,
        isLoading,
        errorList,
        onPageChange: grid.onPageChange,
    };
};
const buildQueryInitial = <TData>(
    args: QueryListParam,
    data: TData,
): ApiLoaderData<QueryListParam, TData> =>
{
    return { args, apiRes: { IsSuccess: true, Data: data, SysMessage: [] } };
};
