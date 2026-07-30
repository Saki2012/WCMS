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
import { SpecUSRAdapter } from "@/SpecFetures/1810/Hooks/WEB/SpecUSR_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecUSRDetailFields, SpecUSRFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecUSRFormModel = components["schemas"]["SpecUSR"];

type SpecCategoryFormModel = components["schemas"]["SpecCategory"];

type SpecUSRApiAdapter = ReturnType<typeof SpecUSRAdapter>;

type SpecCategoryApiAdapter = ReturnType<typeof SpecCategoryAdapter>;

type TagApiAdapter = ReturnType<typeof TagAdapter>;

type SpecUSRCudActions = ReturnType<SpecUSRApiAdapter["hooks"]["useCudActions"]>;

export interface SpecUSRListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

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
    list: SpecUSRFormModel[];

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
    buildTagContentNode: (ids: string | null | undefined, map: Record<string, string>) => RowCell["content"];
}

export type SpecUSRListGridTemplate = ServerListGridTemplate<SpecUSRSearchParams, SpecUSRListRawData, SpecUSRListAdapter, QueryListParam, SpecUSRListPageState>;

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
// #endregion

// #region Public
export const SPEC_USR_TITLE_SEARCH_KEY = "title";

export const SPEC_USR_CATEGORY_SEARCH_KEY = "categoryId";

export const SPEC_USR_TAG_SEARCH_KEY = "tagId";

const SPEC_USR_LIST_STATE_KEY = "server-spec-usr-list";

const DEFAULT_SPEC_USR_LIST_PAGE_STATE: SpecUSRListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立計畫成果純 Spec ListGridTemplate 設定 */
export const useSpecUSRListGridTemplate = (opt: { lang: Lang; renderers: SpecUSRListRenderers; }): SpecUSRListGridTemplate =>
{
    const pageState = usePageStateMemory<SpecUSRListPageState>({
        stateKey: SPEC_USR_LIST_STATE_KEY,
        defaultState: DEFAULT_SPEC_USR_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SpecUSRListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecUSR,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSpecUSRSearchValues,
                updatePageNumber: updateSpecUSRPageNumber,
                getPagination: getSpecUSRPagination,
            },
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
    }, [opt.lang, opt.renderers, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新SpecUSR記憶狀態，並固定回到第一頁。 */
const updateSpecUSRSearchValues = (state: SpecUSRListPageState, searchValues: SearchValues): SpecUSRListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新SpecUSR列表記憶頁碼。 */
const updateSpecUSRPageNumber = (state: SpecUSRListPageState, pageNumber: number): SpecUSRListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的SpecUSR分頁資訊。 */
const getSpecUSRPagination = (rawData: SpecUSRListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
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
    if (ctx.searchParams.categoryId) conditions.push(`${SpecUSRFields.CategoryId} HasAny ${ctx.searchParams.categoryId}`);
    if (ctx.searchParams.tagId) conditions.push(`${SpecUSRFields.Tags} HasAny [${ctx.searchParams.tagId}]`);

    return conditions;
};

/** 建立計畫名稱與計畫理念模糊查詢條件 */
const buildSpecUSRTitleCondition = (title?: string): string =>
{
    const query = LibText.safeTrim(title);
    if (!query) return "";
    const isNumVal = /^\d+$/.test(query);
    const condition = LibCondition.joinConditions([
        isNumVal ? LibCondition.createCondition(`${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`, Operator.Equal, query) : null,
        isNumVal ? LibCondition.createCondition(`${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`, Operator.Equal, query) : null,
        LibCondition.createCondition(`${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`, Operator.Like, query),
        LibCondition.createCondition(`${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`, Operator.Like, query),
    ], LibCondition.JoinMode.Or);
    return condition ? `(${condition})` : "";
};

/** 建立計畫成果列表完整 QueryParam */
const buildSpecUSRQueryParam = (ctx: { searchParams: SpecUSRSearchParams; searchCondition: string; pageNumber: number; }): QueryListParam =>
{
    return {
        Fields: buildSpecUSRQueryFields(),
        Condition: LibCondition.joinConditions([LibCondition.createCondition(`${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`, Operator.Equal, ctx.searchParams.lang), ctx.searchCondition]),
        RankGroups: [{ Condition: `${SpecUSRFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: SpecUSRFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立計畫成果列表查詢欄位 */
const buildSpecUSRQueryFields = (): string[] =>
{
    return [
        SpecUSRFields.InternalId,
        SpecUSRFields.USRId,
        SpecUSRFields.CategoryId,
        SpecUSRFields.Tags,
        SpecUSRFields.ContentStatus,
        SpecUSRFields.CreateTime,
        SpecUSRFields.ModifyUserId,
        `${SpecUSRFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecUSRFields.ModifyTime,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.RowId}`,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.Lang}`,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.Year}`,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.AcademicYear}`,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectName}`,
        `${SpecUSRFields._SpecUSRDetail}.${SpecUSRDetailFields.ProjectConcept}`,
    ];
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
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
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
    const actions = createGridCrudActions<SpecUSRFormModel>({
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

/** 建立計畫成果列表顯示欄位設定 */
const buildSpecUSRVisibleColumns = (): SpecUSRVisibleColumn[] =>
{
    return [
        { key: SpecUSRFields.CategoryId, tableId: "", columnId: SpecUSRFields.CategoryId, fallback: "計畫類別" },
        { key: SpecUSRFields.Tags, tableId: "", columnId: SpecUSRFields.Tags, fallback: "標籤" },
        { key: SpecUSRDetailFields.Year, tableId: SpecUSRFields._SpecUSRDetail, columnId: SpecUSRDetailFields.Year, fallback: "年度" },
        { key: SpecUSRDetailFields.AcademicYear, tableId: SpecUSRFields._SpecUSRDetail, columnId: SpecUSRDetailFields.AcademicYear, fallback: "學年度" },
        { key: SpecUSRDetailFields.ProjectName, tableId: SpecUSRFields._SpecUSRDetail, columnId: SpecUSRDetailFields.ProjectName, fallback: "計畫名稱" },
        {
            key: SpecUSRDetailFields.ProjectConcept,
            tableId: SpecUSRFields._SpecUSRDetail,
            columnId: SpecUSRDetailFields.ProjectConcept,
            fallback: "計畫理念",
        },
        { key: SpecUSRFields.CreateTime, tableId: "", columnId: SpecUSRFields.CreateTime, fallback: "建立時間" },
        { key: AccountFields.AccountName, tableId: SpecUSRFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        { key: SpecUSRFields.ModifyTime, tableId: "", columnId: SpecUSRFields.ModifyTime, fallback: "修改時間" },
    ];
};

/** 建立計畫成果列表列資料 */
const buildSpecUSRRows = (opt: { raw: SpecUSRListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecUSRListRenderers; }): GridRow[] =>
{
    return (opt.raw.list ?? []).map((set) => buildSpecUSRRow({ set, raw: opt.raw, lang: opt.lang, columns: opt.columns, renderers: opt.renderers }));
};

/** 建立計畫成果列表單列資料 */
const buildSpecUSRRow = (opt: { set: SpecUSRFormModel; raw: SpecUSRListRawData; lang: Lang; columns: ColumnConfig[]; renderers: SpecUSRListRenderers; }): GridRow =>
{
    const detail = (opt.set._SpecUSRDetail ?? []).find((item) => item?.Lang === opt.lang);
    const cells = opt.columns.map((col) => ({
        col,
        content: getSpecUSRCellContent({ key: col.key, set: opt.set, detail, raw: opt.raw, renderers: opt.renderers }),
    }));
    const keyId = opt.set.InternalId ?? LibText.Merge("|", false, opt.set.USRId, detail?.RowId);

    return { keyId, cells };
};

/** 依欄位 key 取得計畫成果 Grid 內容 */
const getSpecUSRCellContent = (
    opt: {
        key: string;
        set: SpecUSRFormModel;
        detail: NonNullable<SpecUSRFormModel["_SpecUSRDetail"]>[number] | undefined;
        raw: SpecUSRListRawData;
        renderers: SpecUSRListRenderers;
    },
): RowCell["content"] =>
{
    const item = opt.set;

    switch (opt.key)
    {
        case SpecUSRFields.CategoryId:
            return mapIdToText(item?.CategoryId, opt.raw.categoryMap);
        case SpecUSRFields.Tags:
            return opt.renderers.buildTagContentNode(item?.Tags, opt.raw.tagMap);
        case SpecUSRDetailFields.Year:
            return opt.detail?.Year ?? "";
        case SpecUSRDetailFields.AcademicYear:
            return opt.detail?.AcademicYear?.toString() ?? "";
        case SpecUSRDetailFields.ProjectName:
            return opt.detail?.ProjectName ?? "";
        case SpecUSRDetailFields.ProjectConcept:
            return opt.detail?.ProjectConcept ?? "";
        case SpecUSRFields.CreateTime:
            return formatDateTime(item?.CreateTime);
        case AccountFields.AccountName:
            return item?.ModifyUser?.AccountName ?? "";
        case SpecUSRFields.ModifyTime:
            return formatDateTime(item?.ModifyTime);
        default:
            return "";
    }
};

// #endregion
