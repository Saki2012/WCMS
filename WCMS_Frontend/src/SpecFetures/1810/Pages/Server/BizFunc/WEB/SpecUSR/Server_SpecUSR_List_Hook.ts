import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecUSRDetailFields, SpecUSRModelFields, SpecUSRSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecUSRSet = components["schemas"]["SpecUSRSet_DTO"];
type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];
type SpecUSRApiAdapter = ReturnType<typeof SpecUSRAdapter>;
type SpecCategoryApiAdapter = ReturnType<typeof SpecCategoryAdapter>;
type TagApiAdapter = ReturnType<typeof TagAdapter>;
type SpecUSRCudActions = ReturnType<SpecUSRApiAdapter["hooks"]["useCudActions"]>;

export const SPEC_USR_TITLE_SEARCH_KEY = "title";
export const SPEC_USR_CATEGORY_SEARCH_KEY = "categoryId";
export const SPEC_USR_TAG_SEARCH_KEY = "tagId";

export interface SpecUSRSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 計畫名稱或計畫理念搜尋關鍵字 */
    title?: string;

    /** 已選取的計畫成果類別代碼 */
    categoryId?: string;

    /** 已選取的計畫成果標籤代碼 */
    tagId?: string;
}

export interface SpecUSRListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 計畫成果列表資料 */
    list: SpecUSRSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 類別原始資料 */
    categoryData: SpecCategorySet[];

    /** 類別代碼與顯示文字對照 */
    categoryMap: Record<string, string>;

    /** 標籤代碼與顯示文字對照 */
    tagMap: Record<string, string>;
}

export interface SpecUSRListAdapter
{
    /** 計畫成果 API adapter */
    SpecUSR: SpecUSRApiAdapter;

    /** 計畫成果類別 API adapter */
    SpecCategory: SpecCategoryApiAdapter;

    /** 標籤 API adapter */
    Tag: TagApiAdapter;

    /** 計畫成果新增、修改、刪除操作 */
    cudActions: SpecUSRCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export interface SpecUSRListRenderers
{
    /** 渲染標籤欄位內容 */
    renderTagContent: (ids: string | null | undefined, map: Record<string, string>) => RowCell["content"];
}

export type SpecUSRListGridTemplate = ServerListGridTemplate<SpecUSRSearchParams, SpecUSRListRawData, SpecUSRListAdapter, QueryListParam>;

/** 建立計畫成果純 Spec ListGridTemplate 設定 */
export const useSpecUSRListGridTemplate = (opt: { lang: Lang; renderers: SpecUSRListRenderers; }): SpecUSRListGridTemplate =>
{
    return useMemo<SpecUSRListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecUSR,
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecUSRSearchFields(rawData),
                toSearchParams: (values) => toSpecUSRSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecUSRSearchConditions,
                buildQueryParam: buildSpecUSRQueryParam,
                useDataSource: useSpecUSRListGridDataSource,
                buildGridProps: (ctx) =>
                    buildSpecUSRGridProps({
                        raw: ctx.rawData,
                        lang: ctx.searchParams.lang,
                        adapter: ctx.adapter,
                        refetchData: ctx.refetchData,
                        renderers: opt.renderers,
                    }),
            },
        };
    }, [opt.lang, opt.renderers]);
};

/** 執行計畫成果列表資料來源 Hook */
const useSpecUSRListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SpecUSRSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SpecUSRListRawData, SpecUSRListAdapter> =>
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
        return { SpecUSR: SpecUSRAdapter(), SpecCategory: SpecCategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const cudActions = apiAdapter.SpecUSR.hooks.useCudActions({ onError });
    const grid = apiAdapter.SpecUSR.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.SpecCategory.hooks.useMapByProgId({ progId: PGID.SpecUSR, lang: ctx.searchParams.lang });
    const tag = apiAdapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecUSR, lang: ctx.searchParams.lang, onError });

    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText, tag.errorText].filter((item): item is string => Boolean(item)), [
        grid.errors,
        category.errorText,
        tag.errorText,
    ]);
    const rawData = useMemo<SpecUSRListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryData: category.data ?? [],
            categoryMap: category.map ?? {},
            tagMap: tag.map ?? {},
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, category.data, category.map, tag.map]);

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

/** 建立計畫成果搜尋欄位設定 */
const buildSpecUSRSearchFields = (rawData: SpecUSRListRawData): SearchFieldConfig[] =>
{
    return [{ key: SPEC_USR_TITLE_SEARCH_KEY, title: "標題", type: "text", placeholder: "請輸入計畫名稱或計畫理念" }, {
        key: SPEC_USR_CATEGORY_SEARCH_KEY,
        title: "類別",
        type: "select",
        options: buildSearchOptions(rawData.categoryMap),
    }, { key: SPEC_USR_TAG_SEARCH_KEY, title: "標籤", type: "select", options: buildSearchOptions(rawData.tagMap) }];
};

/** 將 SearchValues 轉為計畫成果列表查詢參數 */
const toSpecUSRSearchParams = (values: SearchValues, lang: Lang): SpecUSRSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[SPEC_USR_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[SPEC_USR_CATEGORY_SEARCH_KEY]),
        tagId: getSearchStringValue(values[SPEC_USR_TAG_SEARCH_KEY]),
    };
};

/** 建立計畫成果搜尋條件 */
const buildSpecUSRSearchConditions = (ctx: { searchParams: SpecUSRSearchParams; }): string[] =>
{
    const conditions: string[] = [];
    const titleCondition = buildSpecUSRTitleCondition(ctx.searchParams.title);

    if (titleCondition) conditions.push(titleCondition);
    if (ctx.searchParams.categoryId) conditions.push(`${SpecUSRModelFields.CategoryId} HasAny ${ctx.searchParams.categoryId}`);
    if (ctx.searchParams.tagId) conditions.push(`${SpecUSRModelFields.Tags} HasAny [${ctx.searchParams.tagId}]`);

    return conditions;
};

/** 建立計畫名稱與計畫理念模糊查詢條件 */
const buildSpecUSRTitleCondition = (title?: string): string =>
{
    const query = title?.trim() ?? "";
    if (!query) return "";

    let condition = "";

    if (/^\d+$/.test(query))
    {
        condition = LibMerge(" Or ", false, condition, `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year} = ${query}`);
        condition = LibMerge(" Or ", false, condition, `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear} = ${query}`);
    }

    condition = LibMerge(" Or ", false, condition, `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName} Like ${query}`);
    condition = LibMerge(" Or ", false, condition, `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept} Like ${query}`);

    return condition ? `(${condition})` : "";
};

/** 建立計畫成果列表完整 QueryParam */
const buildSpecUSRQueryParam = (ctx: { searchParams: SpecUSRSearchParams; searchCondition: string; }): QueryListParam =>
{
    const langCondition = `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, langCondition, ctx.searchCondition);

    return {
        Fields: buildSpecUSRQueryFields(),
        Condition: condition,
        RankGroups: [{ Condition: `${SpecUSRModelFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: SpecUSRModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立計畫成果列表查詢欄位 */
const buildSpecUSRQueryFields = (): string[] =>
{
    return [
        SpecUSRModelFields.InternalId,
        SpecUSRModelFields.USRId,
        SpecUSRModelFields.CategoryId,
        SpecUSRModelFields.Tags,
        SpecUSRModelFields.ContentStatus,
        SpecUSRModelFields.CreateTime,
        SpecUSRModelFields.ModifyUserId,
        `${SpecUSRModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecUSRModelFields.ModifyTime,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.RowId}`,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
        `${SpecUSRModelFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,
    ];
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SpecUSRCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

type SpecUSRVisibleColumn = {
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};

/** 將計畫成果資料轉為 GridProps */
const buildSpecUSRGridProps = (
    opt: {
        raw: SpecUSRListRawData;
        lang: Lang;
        renderers: SpecUSRListRenderers;
        adapter?: SpecUSRListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = buildSpecUSRVisibleColumns();
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecUSRRows({ raw: opt.raw, lang: opt.lang, columns, renderers: opt.renderers });
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSpecUSRGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入計畫成果 Grid 編輯與刪除動作 */
const enhanceSpecUSRGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SpecUSRListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecUSRSet>({
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
        getInternalId: (set) => set.SpecUSR?.InternalId ?? "",
    });
};

/** 建立計畫成果列表顯示欄位設定 */
const buildSpecUSRVisibleColumns = (): SpecUSRVisibleColumn[] =>
{
    return [
        { key: SpecUSRModelFields.CategoryId, tableId: SpecUSRSetFields.SpecUSR, columnId: SpecUSRModelFields.CategoryId, fallback: "計畫類別" },
        { key: SpecUSRModelFields.Tags, tableId: SpecUSRSetFields.SpecUSR, columnId: SpecUSRModelFields.Tags, fallback: "標籤" },
        { key: SpecUSRDetailFields.Year, tableId: SpecUSRSetFields.SpecUSRDetail, columnId: SpecUSRDetailFields.Year, fallback: "年度" },
        { key: SpecUSRDetailFields.AcademicYear, tableId: SpecUSRSetFields.SpecUSRDetail, columnId: SpecUSRDetailFields.AcademicYear, fallback: "學年度" },
        { key: SpecUSRDetailFields.ProjectName, tableId: SpecUSRSetFields.SpecUSRDetail, columnId: SpecUSRDetailFields.ProjectName, fallback: "計畫名稱" },
        {
            key: SpecUSRDetailFields.ProjectConcept,
            tableId: SpecUSRSetFields.SpecUSRDetail,
            columnId: SpecUSRDetailFields.ProjectConcept,
            fallback: "計畫理念",
        },
        { key: SpecUSRModelFields.CreateTime, tableId: SpecUSRSetFields.SpecUSR, columnId: SpecUSRModelFields.CreateTime, fallback: "建立時間" },
        { key: AccountFields.AccountName, tableId: SpecUSRModelFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        { key: SpecUSRModelFields.ModifyTime, tableId: SpecUSRSetFields.SpecUSR, columnId: SpecUSRModelFields.ModifyTime, fallback: "修改時間" },
    ];
};

/** 建立計畫成果列表欄位定義 */
const buildColumns = (visibleCols: SpecUSRVisibleColumn[], raw: SpecUSRListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col.key, title: getColumnTitle(raw.modelDisplayName, col.tableId, col.columnId, col.fallback) }));
};

/** 建立計畫成果列表列資料 */
const buildSpecUSRRows = (opt: { raw: SpecUSRListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecUSRListRenderers; }): GridRow[] =>
{
    return (opt.raw.list ?? []).map((set) => buildSpecUSRRow({ set, raw: opt.raw, lang: opt.lang, columns: opt.columns, renderers: opt.renderers }));
};

/** 建立計畫成果列表單列資料 */
const buildSpecUSRRow = (opt: { set: SpecUSRSet; raw: SpecUSRListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecUSRListRenderers; }): GridRow =>
{
    const detail = (opt.set.SpecUSRDetail ?? []).find((item) => item?.Lang === opt.lang);
    const cells = opt.columns.map((col) => ({
        col,
        content: getSpecUSRCellContent({ key: col.key, set: opt.set, detail, raw: opt.raw, renderers: opt.renderers }),
    }));
    const keyId = opt.set.SpecUSR?.InternalId ?? LibMerge("|", false, opt.set.SpecUSR?.USRId, detail?.RowId);

    return { keyId, cells };
};

/** 依欄位 key 取得計畫成果 Grid 內容 */
const getSpecUSRCellContent = (
    opt: {
        key: string;
        set: SpecUSRSet;
        detail: NonNullable<SpecUSRSet["SpecUSRDetail"]>[number] | undefined;
        raw: SpecUSRListRawData;
        renderers: SpecUSRListRenderers;
    },
): RowCell["content"] =>
{
    const item = opt.set.SpecUSR;

    switch (opt.key)
    {
        case SpecUSRModelFields.CategoryId:
            return mapIdToText(item?.CategoryId, opt.raw.categoryMap);
        case SpecUSRModelFields.Tags:
            return opt.renderers.renderTagContent(item?.Tags, opt.raw.tagMap);
        case SpecUSRDetailFields.Year:
            return opt.detail?.Year ?? "";
        case SpecUSRDetailFields.AcademicYear:
            return opt.detail?.AcademicYear?.toString() ?? "";
        case SpecUSRDetailFields.ProjectName:
            return opt.detail?.ProjectName ?? "";
        case SpecUSRDetailFields.ProjectConcept:
            return opt.detail?.ProjectConcept ?? "";
        case SpecUSRModelFields.CreateTime:
            return FormatDateTime(item?.CreateTime);
        case AccountFields.AccountName:
            return item?.ModifyUser?.AccountName ?? "";
        case SpecUSRModelFields.ModifyTime:
            return FormatDateTime(item?.ModifyTime);
        default:
            return "";
    }
};

/** 建立搜尋選項 */
const buildSearchOptions = (map: Record<string, string>) =>
{
    return Object.entries(map).filter(([key]) => Boolean(key)).map(([value, title]) => ({ value, title: title || value }));
};

/** 將代碼轉成顯示文字 */
const mapIdToText = (id: string | number | null | undefined, map: Record<string, string>): string =>
{
    const key = id == null ? "" : String(id);
    return key ? (map[key] ?? key) : "";
};

/** 依表格與欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const table = tables.find((item) => item.TableId === tableId);
    const hit = table?.Columns?.find((item) => item.ColumnId === columnId);

    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
