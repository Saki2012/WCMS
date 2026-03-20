import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement_Api";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Tag_Api";
import { SiteViewCountAdapter } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { getSsrApi, type ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDate } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
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
import { useMemo } from "react";
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
    pageSize: number;
    pageNumber: number;
    condition: string;
    listParam: QueryListParam;
    countParam: QueryListParam;
    cateParam: QueryListParam;
    tagParam: QueryListParam;
    viewCountParam: QueryListParam;
}

export interface AnnouncementListLoaderRes
{
    colNameRes: ModelDisplaySchema | null;
    listRes: AnnouncementSet[];
    countRes: number;
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

type SiteViewCountSetLike = SiteViewCountSet & {
    SiteViewCountDetail?: SiteViewCountDetailRow[] | null;
};

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);

const formatLocalIso = (d: Date): string =>
{
    // 宣告變數
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    const ms = `${d.getMilliseconds()}`.padStart(3, "0");

    // return
    return `${y}-${m}-${day}T${h}:${mi}:${s}.${ms}`;
};

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

const escapeQueryValue = (value: string): string =>
{
    // return
    return value.replace(/"/g, `""`);
};

const buildQuotedValues = (values: string[]): string =>
{
    // 宣告變數
    const quoted = values
        .map(p => p.trim())
        .filter(Boolean)
        .map(p => `"${escapeQueryValue(p)}"`);

    // return
    return quoted.join(",");
};

const buildAnnouncementCondition = (p: {
    lang: Lang;
    nowIsoLocal: string;
    categoryIds: string;
    tagIds: string;
    keyword?: string;
}): string =>
{
    // 宣告變數
    let condition = LibMerge(" And ", false,
        `${AnnouncementFields.Validate_Start} <= ${p.nowIsoLocal}`,
        `(${AnnouncementFields.Validate_End} >= ${p.nowIsoLocal} Or ${AnnouncementFields.Validate_End} is null)`,
        `${AnnouncementFields.ContentStatus} !& 4`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${p.lang}`,
        `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} != ''`,
    );

    if (p.keyword) condition = LibMerge(" And ", false, condition, `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${p.keyword}`);
    if (p.categoryIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Categories} HasAny [${p.categoryIds}]`);
    if (p.tagIds) condition = LibMerge(" And ", false, condition, `${AnnouncementFields.Tags} HasAny [${p.tagIds}]`);

    // return
    return condition;
};

const buildAnnouncementQuery = (p: {
    condition: string;
    pageNumber: number;
    pageSize: number;
}): QueryListParam =>
{
    // return
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,AnnouncementFields.InternalId,AnnouncementFields.ContentStatus,AnnouncementFields.PictureId,
            AnnouncementFields.PicDescription,AnnouncementFields.Categories,AnnouncementFields.Tags,AnnouncementFields.Validate_Start,
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
        PageNumber: p.pageNumber, PageSize: p.pageSize,
    };
};

const buildCategoryQuery = (progId: string): QueryListParam =>
{
    // return
    return {
        Fields: [
            CategoryFields.InternalId,CategoryFields.CategoryId,CategoryFields.ProgId,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
            `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        ],
        Condition: progId ? `${CategoryFields.ProgId} = ${progId}` : "",
        OrderBy: [{ Col: CategoryFields.CreateTime, Desc: false }],
        PageNumber: 0, PageSize: 0,
    };
};

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

const getAnnouncementInternalIds = (rows: AnnouncementSet[]): string[] =>
{
    // return
    return rows
        .map(p => p.Announcement?.InternalId ?? "")
        .filter(Boolean);
};

const buildViewCountCondition = (internalIds: string[]): string =>
{
    // 宣告變數
    const idText = buildQuotedValues(internalIds);
    if (!idText) return "1=0";

    // return
    return `${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.ProgId} = ${PGID.Announcement} And ${SiteViewCountHeaderModelFields._SiteViewCountDetail}.${SiteViewCountDetailModelFields.TargetInternalId} In [${idText}]`;
};

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

const buildLoaderArgs = (p: {
    lang: Lang;
    opts?: IAnnouncementListOptions;
    overrides?: Partial<{
        pageNumber: number;
        pageSize: number;
        keyword: string;
        categoryIds: string;
        tagIds: string;
    }>;
}): Omit<AnnouncementListLoaderArgs, "viewCountParam"> =>
{
    // 宣告變數
    const pageNumber = p.overrides?.pageNumber ?? 1;
    const pageSize = p.overrides?.pageSize ?? calcPageSize(p.opts?.Style);
    const nowIsoLocal = formatLocalIso(new Date());
    const categoryIds = p.overrides?.categoryIds ?? (p.opts?.Category ?? "");
    const tagIds = p.overrides?.tagIds ?? (p.opts?.Tag ?? "");
    const condition = buildAnnouncementCondition({
        lang: p.lang,
        nowIsoLocal,
        categoryIds,
        tagIds,
        keyword: p.overrides?.keyword,
    });

    // return
    return {
        pageSize,
        pageNumber,
        condition,
        listParam: buildAnnouncementQuery({ condition, pageNumber, pageSize }),
        countParam: buildAnnouncementQuery({ condition, pageNumber: 0, pageSize: 0 }),
        cateParam: buildCategoryQuery(PGID.Announcement),
        tagParam: buildTagQuery(PGID.Announcement),
    };
};

const buildLoaderInitial = <TArgs, TData>(args: TArgs, data: TData): ApiLoaderData<TArgs, TData> =>
{
    // 宣告變數
    const apiRes: ApiResponse<TData> = { IsSuccess: true, Data: data, SysMessage: [] };

    // return
    return { args, apiRes };
};

const matchInitialArgs = <TArgs, TData>(
    currentArgs: TArgs,
    initialArgs: TArgs,
    initialData: TData,
): ApiLoaderData<TArgs, TData> | null =>
{
    // 宣告變數
    const currentKey = JSON.stringify(currentArgs ?? null);
    const initialKey = JSON.stringify(initialArgs ?? null);

    // return
    if (currentKey !== initialKey) return null;
    return buildLoaderInitial(initialArgs, initialData);
};

const getSiteViewCountDetails = (item: SiteViewCountSet): SiteViewCountDetailRow[] =>
{
    // 宣告變數
    const detailRows = (item as SiteViewCountSetLike).SiteViewCountDetail;

    // return
    if (!Array.isArray(detailRows)) return [];
    return detailRows;
};

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
    const baseArgs = buildLoaderArgs(p);

    const colNameLoader = announcement.loader.createModelDisplayNameLoader({
        getApiInstance: () => ssrApi,
    });

    const listLoader = announcement.loader.createQueryListLoader({
        getCondition: () => baseArgs.listParam,
        getApiInstance: () => ssrApi,
    });

    const countLoader = announcement.loader.createQueryCountLoader({
        getCondition: () => baseArgs.countParam,
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

    const [colLD, listLD, countLD, categoryLD, tagLD] = await Promise.all([
        colNameLoader({ request } as LoaderFunctionArgs),
        listLoader({ request } as LoaderFunctionArgs),
        countLoader({ request } as LoaderFunctionArgs),
        cateLoader({ request } as LoaderFunctionArgs),
        tagLoader({ request } as LoaderFunctionArgs),
    ]);

    const listRes = listLD.apiRes.Data ?? [];
    const viewCountParam = buildViewCountQuery(getAnnouncementInternalIds(listRes));
    const viewCountLoader = siteView.loader.createQueryListLoader({
        getCondition: () => viewCountParam,
        getApiInstance: () => ssrApi,
    });

    const viewCountLD = await viewCountLoader({ request } as LoaderFunctionArgs);

    // return
    return {
        args: {
            ...baseArgs,
            viewCountParam,
        },
        res: {
            colNameRes: colLD.apiRes.Data?.[0] ?? null,
            listRes,
            countRes: countLD.apiRes.Data ?? 0,
            categoryRes: categoryLD.apiRes.Data ?? [],
            tagRes: tagLD.apiRes.Data ?? [],
            viewCountRes: viewCountLD.apiRes.Data ?? [],
        },
    };
};

/** CSR Hook：Component 一行拿資料，切頁時自動重撈 list + siteviewcount */
export const useAnnouncementListData = (p: {
    lang: Lang;
}): UseAnnouncementListDataResult =>
{
    // 宣告變數
    const initial = useLoaderData() as AnnouncementListLoaderData;
    const announcement = useMemo(() => AnnouncementAdapter(), []);
    const siteView = useMemo(() => SiteViewCountAdapter(), []);

    const listInitial = useMemo(() =>
    {
        return buildLoaderInitial(initial.args.listParam, initial.res.listRes);
    }, [initial.args.listParam, initial.res.listRes]);

    const countInitial = useMemo(() =>
    {
        return buildLoaderInitial(initial.args.countParam, initial.res.countRes);
    }, [initial.args.countParam, initial.res.countRes]);

    const useCount = announcement.hooks.useQueryCount({
        condition: initial.args.countParam,
        initial: countInitial,
        deps: [initial.args.condition],
    });

    const useList = announcement.hooks.usePagedQueryList({
        baseParam: initial.args.listParam,
        count: useCount.data ?? 0,
        initial: listInitial,
        deps: [initial.args.condition, initial.args.pageSize],
    });

    const viewCountParam = useMemo(() =>
    {
        return buildViewCountQuery(getAnnouncementInternalIds(useList.data ?? []));
    }, [useList.data]);

    const viewCountInitial = useMemo(() =>
    {
        return matchInitialArgs(viewCountParam, initial.args.viewCountParam, initial.res.viewCountRes);
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
            listData: useList.data ?? [],
            viewCountMap,
            pageNumber: useList.pageNumber,
            totalPages: useList.totalPages,
            onPageChange: useList.onPageChange,
        });
    }, [p.lang, useList.data, useList.pageNumber, useList.totalPages, useList.onPageChange, viewCountMap]);

    const errorList = useMemo(() =>
    {
        return [
            useCount.errorText,
            useList.errorText,
            useViewCount.errorText,
        ].filter((x): x is string => Boolean(x));
    }, [useCount.errorText, useList.errorText, useViewCount.errorText]);

    const isLoading = Boolean(useCount.isLoading || useList.isLoading || useViewCount.isLoading);

    // return
    return {
        pageSize: initial.args.pageSize,
        pageNumber: useList.pageNumber,
        totalPages: useList.totalPages,
        totalCount: useCount.data ?? 0,
        listData: useList.data ?? [],
        categoryData,
        tagData,
        viewCountMap,
        gridPropsFromList,
        isLoading,
        errorList,
        onPageChange: useList.onPageChange,
    };
};