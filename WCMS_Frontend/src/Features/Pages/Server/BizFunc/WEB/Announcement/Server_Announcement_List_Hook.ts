import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WEB/Announcement_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { GetDataStatusContent } from "@/Features/Pages/Server/Scaffold/CommUnitComp/CommonComp";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDate, formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, AnnouncementDetailFields, AnnouncementFields, PGID } from "@/types/SchemaFields";
import { createElement, Fragment, type ReactNode, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type AnnouncementApiAdapter = ReturnType<typeof AnnouncementAdapter>;
type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;
type TagApiAdapter = ReturnType<typeof TagAdapter>;
type AnnouncementCudActions = ReturnType<AnnouncementApiAdapter["hooks"]["useCudActions"]>;
export interface AnnouncementSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 公告標題搜尋關鍵字 */
    title?: string;

    /** 公告分類搜尋條件 */
    categoryId?: string;
}

export interface AnnouncementListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 公告列表資料 */
    list: AnnouncementSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 分類 ID 對顯示文字 Map */
    categoryMap: Record<string, string>;

    /** 標籤 ID 對顯示文字 Map */
    tagMap: Record<string, string>;
}

export interface AnnouncementListAdapter
{
    /** 公告 API adapter */
    Announcement: AnnouncementApiAdapter;

    /** 分類 API adapter */
    Category: CategoryApiAdapter;

    /** 標籤 API adapter */
    Tag: TagApiAdapter;

    /** 公告 CUD 操作 */
    cudActions: AnnouncementCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type AnnouncementListGridTemplate = ServerListGridTemplate<AnnouncementSearchParams, AnnouncementListRawData, AnnouncementListAdapter, QueryListParam>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: AnnouncementCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const ANNOUNCEMENT_TITLE_SEARCH_KEY = "title";

export const ANNOUNCEMENT_CATEGORY_SEARCH_KEY = "categoryId";

/** 建立公告後台 ListGridTemplate 設定 */
export const useAnnouncementListGridTemplate = (opt: { lang: Lang; }): AnnouncementListGridTemplate =>
{
    return useMemo<AnnouncementListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Announcement,
            feature: {
                buildSearchFields: ({ rawData }) => buildAnnouncementSearchFields(rawData),
                toSearchParams: (values) => toAnnouncementSearchParams(values, opt.lang),
                buildSearchConditions: buildAnnouncementSearchConditions,
                buildQueryParam: buildAnnouncementQueryParam,
                useDataSource: useAnnouncementListGridDataSource,
                buildGridProps: (ctx) =>
                    buildAnnouncementGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};
// #endregion

// #region Private
/** 執行公告列表資料來源 Hook */
const useAnnouncementListGridDataSource = (
    ctx: ServerListGridDataSourceContext<AnnouncementSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<AnnouncementListRawData, AnnouncementListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() =>
    {
        return { Announcement: AnnouncementAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const cudActions = apiAdapter.Announcement.hooks.useCudActions({ onError });
    const grid = apiAdapter.Announcement.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.Announcement, lang: ctx.searchParams.lang, onError });
    const tag = apiAdapter.Tag.hooks.useMapByProgId({ progId: PGID.Announcement, lang: ctx.searchParams.lang, onError });
    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() =>
    {
        return [...(grid.errors ?? []), category.errorText, tag.errorText].filter((x): x is string => Boolean(x));
    }, [grid.errors, category.errorText, tag.errorText]);
    const rawData = useMemo<AnnouncementListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, category.map, tag.map]);
    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 建立公告搜尋欄位設定 */
const buildAnnouncementSearchFields = (rawData: AnnouncementListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, AnnouncementDetailFields.Title, "公告標題");
    const categoryTitle = getColumnTitle(rawData.modelDisplayName, AnnouncementFields.Categories, "分類");

    return [{ key: ANNOUNCEMENT_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }, {
        key: ANNOUNCEMENT_CATEGORY_SEARCH_KEY,
        title: categoryTitle,
        type: "select",
        options: buildCategorySearchOptions(rawData.categoryMap),
    }];
};

/** 將 SearchValues 轉為公告列表查詢參數 */
const toAnnouncementSearchParams = (values: SearchValues, lang: Lang): AnnouncementSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[ANNOUNCEMENT_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[ANNOUNCEMENT_CATEGORY_SEARCH_KEY]),
    };
};

/** 建立公告搜尋條件 */
const buildAnnouncementSearchConditions = (ctx: { searchParams: AnnouncementSearchParams; }): string[] =>
{
    const conditions: string[] = [];
    if (ctx.searchParams.title)
    {
        conditions.push(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${ctx.searchParams.title}`);
    }

    if (ctx.searchParams.categoryId)
    {
        conditions.push(`${AnnouncementFields.Categories} HasAny [${ctx.searchParams.categoryId}]`);
    }

    return conditions;
};

/** 建立公告列表完整 QueryParam */
const buildAnnouncementQueryParam = (ctx: { searchParams: AnnouncementSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: [
            AnnouncementFields.AnnouncementId,
            AnnouncementFields.Categories,
            AnnouncementFields.Tags,
            AnnouncementFields.ContentStatus,
            AnnouncementFields.Validate_Start,
            AnnouncementFields.Validate_End,
            AnnouncementFields.ModifyUserId,
            AnnouncementFields.CreateTime,
            AnnouncementFields.ModifyTime,
            AnnouncementFields.InternalId,
            `${AnnouncementFields.ModifyUser}.${AccountFields.AccountName}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
            `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
        ],
        Condition: LibCondition.joinConditions([
            ctx.searchCondition,
            LibCondition.createCondition(`${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`, Operator.Equal, ctx.searchParams.lang),
        ]),
        RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: AnnouncementFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立分類下拉搜尋選項 */
const buildCategorySearchOptions = (categoryMap: Record<string, string>): SearchFieldConfig["options"] =>
{
    return Object.entries(categoryMap).map(([value, title]) => ({ value, title: title || value }));
};

/** 將公告資料轉為 GridProps */
const buildAnnouncementGridProps = (
    opt: {
        raw: AnnouncementListRawData;
        lang: Lang;
        adapter?: AnnouncementListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [
        AnnouncementFields.Categories,
        AnnouncementDetailFields.Title,
        AnnouncementFields.Validate_Start,
        AnnouncementFields.Validate_End,
        AnnouncementFields.ModifyUserId,
        AnnouncementFields.ModifyTime,
    ];

    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildAnnouncementRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceAnnouncementGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入公告 Grid 編輯與刪除動作 */
const enhanceAnnouncementGrid = (
    opt: {
        baseGrid: GridProps;
        raw: AnnouncementListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<AnnouncementSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(opt.baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.Announcement?.InternalId ?? "",
    });
};

/** 建立公告列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: AnnouncementListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) =>
    {
        const title = getColumnTitle(raw.modelDisplayName, col, `【${col}】`);
        return { key: col, title };
    });
};

/** 建立公告列表列資料 */
const buildAnnouncementRows = (raw: AnnouncementListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = LibText.Merge("|", false, set.Announcement?.AnnouncementId);
        const a = set.Announcement;
        const detail = createElement(
            Fragment,
            null,
            createElement("span", null, (set.AnnouncementDetail ?? []).find(d => d?.Lang === lang)?.Title ?? ""),
            GetDataStatusContent(set.Announcement?.ContentStatus ?? 0),
        );

        const cells: RowCell[] = [
            { col: columns[0], content: mapIdsToText(a?.Categories, raw.categoryMap) },
            { col: columns[1], content: detail },
            { col: columns[2], content: formatDate(a?.Validate_Start) },
            { col: columns[3], content: formatDate(a?.Validate_End) },
            { col: columns[4], content: a?.ModifyUser?.AccountName ?? "" },
            { col: columns[5], content: formatDateTime(a?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 將逗號分隔的 ID 字串轉為顯示清單 */
const mapIdsToText = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
    const parts = (ids ?? "").split(",").map((x) => x.trim()).filter(Boolean);
    const names = parts.map((id) => map[id] ?? id);

    return createElement(
        "ul",
        { className: "m-0 p-0", style: { listStylePosition: "inside" } },
        names.map((line, i) => createElement("li", { key: `${line}-${i}`, className: "m-0 p-0" }, line)),
    );
};

/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: unknown): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
// #endregion
