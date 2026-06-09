import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecResearch_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecResearchDetailModelFields, SpecResearchModelFields, SpecResearchSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecResearchSet = components["schemas"]["SpecResearchSet_DTO"];

type SpecCategorySet = components["schemas"]["SpecCategorySet_DTO"];

type SpecResearchApiAdapter = ReturnType<typeof SpecResearchAdapter>;

type SpecCategoryApiAdapter = ReturnType<typeof SpecCategoryAdapter>;

type TagApiAdapter = ReturnType<typeof TagAdapter>;

type SpecResearchCudActions = ReturnType<SpecResearchApiAdapter["hooks"]["useCudActions"]>;


export interface SpecResearchSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 研究計畫文字搜尋關鍵字 */
    title?: string;

    /** 已選取的研究計畫類別代碼 */
    categoryId?: string;

    /** 已選取的研究計畫標籤代碼 */
    tagId?: string;
}


export interface SpecResearchListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 研究計畫列表資料 */
    list: SpecResearchSet[];

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


export interface SpecResearchListAdapter
{
    /** 研究計畫 API adapter */
    SpecResearch: SpecResearchApiAdapter;

    /** 研究計畫類別 API adapter */
    SpecCategory: SpecCategoryApiAdapter;

    /** 標籤 API adapter */
    Tag: TagApiAdapter;

    /** 研究計畫新增、修改、刪除操作 */
    cudActions: SpecResearchCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}


export interface SpecResearchListRenderers
{
    /** 渲染標籤欄位內容 */
    renderTagContent: (ids: string | null | undefined, map: Record<string, string>) => RowCell["content"];
}


export type SpecResearchListGridTemplate = ServerListGridTemplate<SpecResearchSearchParams, SpecResearchListRawData, SpecResearchListAdapter, QueryListParam>;


type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SpecResearchCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};


type SpecResearchVisibleColumn = {
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};
// #endregion

// #region Public
export const SPEC_RESEARCH_TITLE_SEARCH_KEY = "title";

export const SPEC_RESEARCH_CATEGORY_SEARCH_KEY = "categoryId";

export const SPEC_RESEARCH_TAG_SEARCH_KEY = "tagId";


/** 建立研究計畫純 Spec ListGridTemplate 設定 */
export const useSpecResearchListGridTemplate = (opt: { lang: Lang; renderers: SpecResearchListRenderers; }): SpecResearchListGridTemplate =>
{
    return useMemo<SpecResearchListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecResearch,
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecResearchSearchFields(rawData),
                toSearchParams: (values) => toSpecResearchSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecResearchSearchConditions,
                buildQueryParam: buildSpecResearchQueryParam,
                useDataSource: useSpecResearchListGridDataSource,
                buildGridProps: (ctx) =>
                    buildSpecResearchGridProps({
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
// #endregion

// #region Private
/** 執行研究計畫列表資料來源 Hook */
const useSpecResearchListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SpecResearchSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SpecResearchListRawData, SpecResearchListAdapter> =>
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
        return { SpecResearch: SpecResearchAdapter(), SpecCategory: SpecCategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const cudActions = apiAdapter.SpecResearch.hooks.useCudActions({ onError });
    const grid = apiAdapter.SpecResearch.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.SpecCategory.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: ctx.searchParams.lang });
    const tag = apiAdapter.Tag.hooks.useMapByProgId({ progId: PGID.SpecResearch, lang: ctx.searchParams.lang, onError });

    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText, tag.errorText].filter((item): item is string => Boolean(item)), [
        grid.errors,
        category.errorText,
        tag.errorText,
    ]);
    const rawData = useMemo<SpecResearchListRawData>(() =>
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


/** 建立研究計畫搜尋欄位設定 */
const buildSpecResearchSearchFields = (rawData: SpecResearchListRawData): SearchFieldConfig[] =>
{
    return [{ key: SPEC_RESEARCH_TITLE_SEARCH_KEY, title: "標題", type: "text", placeholder: "請輸入計畫名稱、論文名稱、合作項目或社團/課程" }, {
        key: SPEC_RESEARCH_CATEGORY_SEARCH_KEY,
        title: "類別",
        type: "select",
        options: buildSearchOptions(rawData.categoryMap),
    }, { key: SPEC_RESEARCH_TAG_SEARCH_KEY, title: "標籤", type: "select", options: buildSearchOptions(rawData.tagMap) }];
};


/** 將 SearchValues 轉為研究計畫列表查詢參數 */
const toSpecResearchSearchParams = (values: SearchValues, lang: Lang): SpecResearchSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[SPEC_RESEARCH_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[SPEC_RESEARCH_CATEGORY_SEARCH_KEY]),
        tagId: getSearchStringValue(values[SPEC_RESEARCH_TAG_SEARCH_KEY]),
    };
};


/** 建立研究計畫搜尋條件 */
const buildSpecResearchSearchConditions = (ctx: { searchParams: SpecResearchSearchParams; }): string[] =>
{
    const conditions: string[] = [];
    const titleCondition = buildSpecResearchTitleCondition(ctx.searchParams.title);

    if (titleCondition) conditions.push(titleCondition);
    if (ctx.searchParams.categoryId) conditions.push(`${SpecResearchModelFields.CategoryId} HasAny ${ctx.searchParams.categoryId}`);
    if (ctx.searchParams.tagId) conditions.push(`${SpecResearchModelFields.Tags} HasAny [${ctx.searchParams.tagId}]`);

    return conditions;
};


/** 建立研究計畫文字模糊查詢條件 */
const buildSpecResearchTitleCondition = (title?: string): string =>
{
    const query = title?.trim() ?? "";
    if (!query) return "";

    let condition = "";
    condition = LibMerge(" Or ", false, condition, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName} Like ${query}`);
    condition = LibMerge(" Or ", false, condition, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle} Like ${query}`);
    condition = LibMerge(
        " Or ",
        false,
        condition,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject} Like ${query}`,
    );
    condition = LibMerge(" Or ", false, condition, `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses} Like ${query}`);

    return condition ? `(${condition})` : "";
};


/** 建立研究計畫列表完整 QueryParam */
const buildSpecResearchQueryParam = (ctx: { searchParams: SpecResearchSearchParams; searchCondition: string; }): QueryListParam =>
{
    const langCondition = `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, langCondition, ctx.searchCondition);

    return {
        Fields: buildSpecResearchQueryFields(),
        Condition: condition,
        RankGroups: [{ Condition: `${SpecResearchModelFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: SpecResearchModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};


/** 建立研究計畫列表查詢欄位 */
const buildSpecResearchQueryFields = (): string[] =>
{
    return [
        SpecResearchModelFields.InternalId,
        SpecResearchModelFields.ResearchId,
        SpecResearchModelFields.CategoryId,
        SpecResearchModelFields.Tags,
        SpecResearchModelFields.ContentStatus,
        SpecResearchModelFields.CreateTime,
        SpecResearchModelFields.ModifyUserId,
        `${SpecResearchModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecResearchModelFields.ModifyTime,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.RowId}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Lang}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Year}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.AcademicYear}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Semester}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.ProjectName}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.PaperTitle}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.CooperationProject}`,
        `${SpecResearchModelFields._SpecResearchDetail}.${SpecResearchDetailModelFields.Courses}`,
    ];
};


/** 將研究計畫資料轉為 GridProps */
const buildSpecResearchGridProps = (
    opt: {
        raw: SpecResearchListRawData;
        lang: Lang;
        renderers: SpecResearchListRenderers;
        adapter?: SpecResearchListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = buildSpecResearchVisibleColumns();
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecResearchRows({ raw: opt.raw, lang: opt.lang, columns, renderers: opt.renderers });
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSpecResearchGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};


/** 注入研究計畫 Grid 編輯與刪除動作 */
const enhanceSpecResearchGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SpecResearchListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecResearchSet>({
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
        getInternalId: (set) => set.SpecResearch?.InternalId ?? "",
    });
};


/** 建立研究計畫列表顯示欄位設定 */
const buildSpecResearchVisibleColumns = (): SpecResearchVisibleColumn[] =>
{
    return [
        {
            key: SpecResearchModelFields.CategoryId,
            tableId: SpecResearchSetFields.SpecResearch,
            columnId: SpecResearchModelFields.CategoryId,
            fallback: "計畫類別",
        },
        { key: SpecResearchModelFields.Tags, tableId: SpecResearchSetFields.SpecResearch, columnId: SpecResearchModelFields.Tags, fallback: "標籤" },
        {
            key: SpecResearchDetailModelFields.Year,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.Year,
            fallback: "年度",
        },
        {
            key: SpecResearchDetailModelFields.AcademicYear,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.AcademicYear,
            fallback: "學年度",
        },
        {
            key: SpecResearchDetailModelFields.Semester,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.Semester,
            fallback: "學期",
        },
        {
            key: SpecResearchDetailModelFields.ProjectName,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.ProjectName,
            fallback: "計畫名稱",
        },
        {
            key: SpecResearchDetailModelFields.PaperTitle,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.PaperTitle,
            fallback: "論文名稱",
        },
        {
            key: SpecResearchDetailModelFields.CooperationProject,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.CooperationProject,
            fallback: "合作項目",
        },
        {
            key: SpecResearchDetailModelFields.Courses,
            tableId: SpecResearchSetFields.SpecResearchDetail,
            columnId: SpecResearchDetailModelFields.Courses,
            fallback: "社團/課程",
        },
        {
            key: SpecResearchModelFields.CreateTime,
            tableId: SpecResearchSetFields.SpecResearch,
            columnId: SpecResearchModelFields.CreateTime,
            fallback: "建立時間",
        },
        { key: AccountFields.AccountName, tableId: SpecResearchModelFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        {
            key: SpecResearchModelFields.ModifyTime,
            tableId: SpecResearchSetFields.SpecResearch,
            columnId: SpecResearchModelFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};


/** 建立研究計畫列表欄位定義 */
const buildColumns = (visibleCols: SpecResearchVisibleColumn[], raw: SpecResearchListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col.key, title: getColumnTitle(raw.modelDisplayName, col.tableId, col.columnId, col.fallback) }));
};


/** 建立研究計畫列表列資料 */
const buildSpecResearchRows = (opt: { raw: SpecResearchListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecResearchListRenderers; }): GridRow[] =>
{
    return (opt.raw.list ?? []).map((set) => buildSpecResearchRow({ set, raw: opt.raw, lang: opt.lang, columns: opt.columns, renderers: opt.renderers }));
};


/** 建立研究計畫列表單列資料 */
const buildSpecResearchRow = (
    opt: { set: SpecResearchSet; raw: SpecResearchListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecResearchListRenderers; },
): GridRow =>
{
    const detail = (opt.set.SpecResearchDetail ?? []).find((item) => item?.Lang === opt.lang);
    const cells = opt.columns.map((col) => ({
        col,
        content: getSpecResearchCellContent({ key: col.key, set: opt.set, detail, raw: opt.raw, renderers: opt.renderers }),
    }));
    const keyId = opt.set.SpecResearch?.InternalId ?? LibMerge("|", false, opt.set.SpecResearch?.ResearchId, detail?.RowId);

    return { keyId, cells };
};


/** 依欄位 key 取得研究計畫 Grid 內容 */
const getSpecResearchCellContent = (
    opt: {
        key: string;
        set: SpecResearchSet;
        detail: NonNullable<SpecResearchSet["SpecResearchDetail"]>[number] | undefined;
        raw: SpecResearchListRawData;
        renderers: SpecResearchListRenderers;
    },
): RowCell["content"] =>
{
    const item = opt.set.SpecResearch;

    switch (opt.key)
    {
        case SpecResearchModelFields.CategoryId:
            return mapIdToText(item?.CategoryId, opt.raw.categoryMap);
        case SpecResearchModelFields.Tags:
            return opt.renderers.renderTagContent(item?.Tags, opt.raw.tagMap);
        case SpecResearchDetailModelFields.Year:
            return opt.detail?.Year ?? "";
        case SpecResearchDetailModelFields.AcademicYear:
            return opt.detail?.AcademicYear?.toString() ?? "";
        case SpecResearchDetailModelFields.Semester:
            return opt.detail?.Semester?.toString() ?? "";
        case SpecResearchDetailModelFields.ProjectName:
            return opt.detail?.ProjectName ?? "";
        case SpecResearchDetailModelFields.PaperTitle:
            return opt.detail?.PaperTitle ?? "";
        case SpecResearchDetailModelFields.CooperationProject:
            return opt.detail?.CooperationProject ?? "";
        case SpecResearchDetailModelFields.Courses:
            return opt.detail?.Courses ?? "";
        case SpecResearchModelFields.CreateTime:
            return formatDateTime(item?.CreateTime);
        case AccountFields.AccountName:
            return item?.ModifyUser?.AccountName ?? "";
        case SpecResearchModelFields.ModifyTime:
            return formatDateTime(item?.ModifyTime);
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
// #endregion
