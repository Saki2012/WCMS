import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    buildServerListSelectOptions as buildSearchOptions,
    getServerSearchStringValue as getSearchStringValue,
    mapServerListIdToText as mapIdToText,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecCategoryAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecCategory_Api";
import { SpecResearchAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecResearch_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecResearchDetailFields, SpecResearchFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecResearchFormModel = components["schemas"]["SpecResearch"];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];

type SpecResearchApiAdapter = ReturnType<typeof SpecResearchAdapter>;

type SpecCategoryApiAdapter = ReturnType<typeof SpecCategoryAdapter>;

type TagApiAdapter = ReturnType<typeof TagAdapter>;

type SpecResearchCudActions = ReturnType<SpecResearchApiAdapter["hooks"]["useCudActions"]>;

export interface SpecResearchListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

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
    list: SpecResearchFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 類別原始資料 */
    categoryData: SpecCategoryFormModel[];

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
    buildTagContentNode: (ids: string | null | undefined, map: Record<string, string>) => RowCell["content"];
}

export type SpecResearchListGridTemplate = ServerListGridTemplate<SpecResearchSearchParams, SpecResearchListRawData, SpecResearchListAdapter, QueryListParam, SpecResearchListPageState>;

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

const SPEC_RESEARCH_LIST_STATE_KEY = "server-spec-research-list";

const DEFAULT_SPEC_RESEARCH_LIST_PAGE_STATE: SpecResearchListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立研究計畫純 Spec ListGridTemplate 設定 */
export const useSpecResearchListGridTemplate = (opt: { lang: Lang; renderers: SpecResearchListRenderers; }): SpecResearchListGridTemplate =>
{
    const pageState = usePageStateMemory<SpecResearchListPageState>({
        stateKey: SPEC_RESEARCH_LIST_STATE_KEY,
        defaultState: DEFAULT_SPEC_RESEARCH_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SpecResearchListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecResearch,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSpecResearchSearchValues,
                updatePageNumber: updateSpecResearchPageNumber,
                getPagination: getSpecResearchPagination,
            },
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
    }, [opt.lang, opt.renderers, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新SpecResearch記憶狀態，並固定回到第一頁。 */
const updateSpecResearchSearchValues = (state: SpecResearchListPageState, searchValues: SearchValues): SpecResearchListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新SpecResearch列表記憶頁碼。 */
const updateSpecResearchPageNumber = (state: SpecResearchListPageState, pageNumber: number): SpecResearchListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的SpecResearch分頁資訊。 */
const getSpecResearchPagination = (rawData: SpecResearchListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

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
    if (ctx.searchParams.categoryId) conditions.push(`${SpecResearchFields.CategoryId} HasAny ${ctx.searchParams.categoryId}`);
    if (ctx.searchParams.tagId) conditions.push(`${SpecResearchFields.Tags} HasAny [${ctx.searchParams.tagId}]`);

    return conditions;
};

/** 建立研究計畫文字模糊查詢條件 */
const buildSpecResearchTitleCondition = (title?: string): string =>
{
    const query = title?.trim() ?? "";
    if (!query) return "";
    const condition = LibCondition.joinConditions([
        LibCondition.createCondition(`${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.ProjectName}`, Operator.Like, query),
        LibCondition.createCondition(`${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.PaperTitle}`, Operator.Like, query),
        LibCondition.createCondition(`${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.CooperationProject}`, Operator.Like, query),
        LibCondition.createCondition(`${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Courses}`, Operator.Like, query),
    ], LibCondition.JoinMode.Or);
    return condition ? `(${condition})` : "";
};

/** 建立研究計畫列表完整 QueryParam */
const buildSpecResearchQueryParam = (ctx: { searchParams: SpecResearchSearchParams; searchCondition: string; pageNumber: number; }): QueryListParam =>
{
    return {
        Fields: buildSpecResearchQueryFields(),
        Condition: LibCondition.joinConditions([
            LibCondition.createCondition(`${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Lang}`, Operator.Equal, ctx.searchParams.lang),
            ctx.searchCondition,
        ]),
        RankGroups: [{ Condition: `${SpecResearchFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: SpecResearchFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立研究計畫列表查詢欄位 */
const buildSpecResearchQueryFields = (): string[] =>
{
    return [
        SpecResearchFields.InternalId,
        SpecResearchFields.ResearchId,
        SpecResearchFields.CategoryId,
        SpecResearchFields.Tags,
        SpecResearchFields.ContentStatus,
        SpecResearchFields.CreateTime,
        SpecResearchFields.ModifyUserId,
        `${SpecResearchFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecResearchFields.ModifyTime,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.RowId}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Lang}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Year}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.AcademicYear}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Semester}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.ProjectName}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.PaperTitle}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.CooperationProject}`,
        `${SpecResearchFields._SpecResearchDetail}.${SpecResearchDetailFields.Courses}`,
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
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
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
    const actions = createGridCrudActions<SpecResearchFormModel>({
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
        getInternalId: (set) => set.InternalId ?? "",
    });
};

/** 建立研究計畫列表顯示欄位設定 */
const buildSpecResearchVisibleColumns = (): SpecResearchVisibleColumn[] =>
{
    return [
        {
            key: SpecResearchFields.CategoryId,
            tableId: "",
            columnId: SpecResearchFields.CategoryId,
            fallback: "計畫類別",
        },
        { key: SpecResearchFields.Tags, tableId: "", columnId: SpecResearchFields.Tags, fallback: "標籤" },
        {
            key: SpecResearchDetailFields.Year,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.Year,
            fallback: "年度",
        },
        {
            key: SpecResearchDetailFields.AcademicYear,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.AcademicYear,
            fallback: "學年度",
        },
        {
            key: SpecResearchDetailFields.Semester,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.Semester,
            fallback: "學期",
        },
        {
            key: SpecResearchDetailFields.ProjectName,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.ProjectName,
            fallback: "計畫名稱",
        },
        {
            key: SpecResearchDetailFields.PaperTitle,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.PaperTitle,
            fallback: "論文名稱",
        },
        {
            key: SpecResearchDetailFields.CooperationProject,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.CooperationProject,
            fallback: "合作項目",
        },
        {
            key: SpecResearchDetailFields.Courses,
            tableId: SpecResearchFields._SpecResearchDetail,
            columnId: SpecResearchDetailFields.Courses,
            fallback: "社團/課程",
        },
        {
            key: SpecResearchFields.CreateTime,
            tableId: "",
            columnId: SpecResearchFields.CreateTime,
            fallback: "建立時間",
        },
        { key: AccountFields.AccountName, tableId: SpecResearchFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        {
            key: SpecResearchFields.ModifyTime,
            tableId: "",
            columnId: SpecResearchFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};

/** 建立研究計畫列表列資料 */
const buildSpecResearchRows = (opt: { raw: SpecResearchListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecResearchListRenderers; }): GridRow[] =>
{
    return (opt.raw.list ?? []).map((set) => buildSpecResearchRow({ set, raw: opt.raw, lang: opt.lang, columns: opt.columns, renderers: opt.renderers }));
};

/** 建立研究計畫列表單列資料 */
const buildSpecResearchRow = (
    opt: { set: SpecResearchFormModel; raw: SpecResearchListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecResearchListRenderers; },
): GridRow =>
{
    const detail = (opt.set._SpecResearchDetail ?? []).find((item) => item?.Lang === opt.lang);
    const cells = opt.columns.map((col) => ({
        col,
        content: getSpecResearchCellContent({ key: col.key, set: opt.set, detail, raw: opt.raw, renderers: opt.renderers }),
    }));
    const keyId = opt.set.InternalId ?? LibText.Merge("|", false, opt.set.ResearchId, detail?.RowId);

    return { keyId, cells };
};

/** 依欄位 key 取得研究計畫 Grid 內容 */
const getSpecResearchCellContent = (
    opt: {
        key: string;
        set: SpecResearchFormModel;
        detail: NonNullable<SpecResearchFormModel["_SpecResearchDetail"]>[number] | undefined;
        raw: SpecResearchListRawData;
        renderers: SpecResearchListRenderers;
    },
): RowCell["content"] =>
{
    const item = opt.set;

    switch (opt.key)
    {
        case SpecResearchFields.CategoryId:
            return mapIdToText(item?.CategoryId, opt.raw.categoryMap);
        case SpecResearchFields.Tags:
            return opt.renderers.buildTagContentNode(item?.Tags, opt.raw.tagMap);
        case SpecResearchDetailFields.Year:
            return opt.detail?.Year ?? "";
        case SpecResearchDetailFields.AcademicYear:
            return opt.detail?.AcademicYear?.toString() ?? "";
        case SpecResearchDetailFields.Semester:
            return opt.detail?.Semester?.toString() ?? "";
        case SpecResearchDetailFields.ProjectName:
            return opt.detail?.ProjectName ?? "";
        case SpecResearchDetailFields.PaperTitle:
            return opt.detail?.PaperTitle ?? "";
        case SpecResearchDetailFields.CooperationProject:
            return opt.detail?.CooperationProject ?? "";
        case SpecResearchDetailFields.Courses:
            return opt.detail?.Courses ?? "";
        case SpecResearchFields.CreateTime:
            return formatDateTime(item?.CreateTime);
        case AccountFields.AccountName:
            return item?.ModifyUser?.AccountName ?? "";
        case SpecResearchFields.ModifyTime:
            return formatDateTime(item?.ModifyTime);
        default:
            return "";
    }
};

// #endregion
