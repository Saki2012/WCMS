import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WEB/PageManagement_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerCategoryTextMap as buildCategoryTextMap,
    buildServerListColumns,
    buildServerListIdListNode as mapIdsToList,
    buildServerListSelectOptions as buildCategorySearchOptions,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { findTextByKey, formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PageManagementDetailFields, PageManagementFields, PGID } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];

type PageManagementApiAdapter = ReturnType<typeof PageManagementAdapter>;

type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;

type PageManagementCudActions = ReturnType<PageManagementApiAdapter["hooks"]["useCudActions"]>;

export interface PageManagementListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface PageManagementSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 頁面標題搜尋關鍵字 */
    title?: string;

    /** 頁面類別搜尋條件 */
    categoryId?: string;
}

export interface PageManagementListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 頁面列表資料 */
    list: PageManagementSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 類別代碼與顯示文字對照 */
    categoryMap: Record<string, string>;
}

export interface PageManagementListAdapter
{
    /** 頁面管理 API adapter */
    PageManagement: PageManagementApiAdapter;

    /** 類別 API adapter */
    Category: CategoryApiAdapter;

    /** 頁面管理 CUD 操作 */
    cudActions: PageManagementCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type PageManagementListGridTemplate = ServerListGridTemplate<PageManagementSearchParams, PageManagementListRawData, PageManagementListAdapter, QueryListParam, PageManagementListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: PageManagementCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const PAGE_MANAGEMENT_TITLE_SEARCH_KEY = "title";

export const PAGE_MANAGEMENT_CATEGORY_SEARCH_KEY = "categoryId";


const PAGE_MANAGEMENT_LIST_STATE_KEY = "server-page-management-list";

const DEFAULT_PAGE_MANAGEMENT_LIST_PAGE_STATE: PageManagementListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立頁面管理後台 ListGridTemplate 設定 */
export const usePageManagementListGridTemplate = (opt: { lang: Lang; }): PageManagementListGridTemplate =>
{
    const pageState = usePageStateMemory<PageManagementListPageState>({
        stateKey: PAGE_MANAGEMENT_LIST_STATE_KEY,
        defaultState: DEFAULT_PAGE_MANAGEMENT_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<PageManagementListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.PageManagement,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updatePageManagementSearchValues,
                updatePageNumber: updatePageManagementPageNumber,
                getPagination: getPageManagementPagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildPageManagementSearchFields(rawData),
                toSearchParams: (values) => toPageManagementSearchParams(values, opt.lang),
                buildSearchConditions: buildPageManagementSearchConditions,
                buildQueryParam: buildPageManagementQueryParam,
                useDataSource: usePageManagementListGridDataSource,
                buildGridProps: (ctx) => buildPageManagementGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新PageManagement記憶狀態，並固定回到第一頁。 */
const updatePageManagementSearchValues = (state: PageManagementListPageState, searchValues: SearchValues): PageManagementListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新PageManagement列表記憶頁碼。 */
const updatePageManagementPageNumber = (state: PageManagementListPageState, pageNumber: number): PageManagementListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的PageManagement分頁資訊。 */
const getPageManagementPagination = (rawData: PageManagementListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行頁面管理列表資料來源 Hook */
const usePageManagementListGridDataSource = (
    ctx: ServerListGridDataSourceContext<PageManagementSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<PageManagementListRawData, PageManagementListAdapter> =>
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
        return { PageManagement: PageManagementAdapter(), Category: CategoryAdapter() };
    }, []);

    const cudActions = apiAdapter.PageManagement.hooks.useCudActions({ onError });
    const grid = apiAdapter.PageManagement.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.PageManagement, lang: ctx.searchParams.lang, onError });

    const categoryMap = useMemo(() => buildCategoryTextMap(category.map ?? {}, ctx.searchParams.lang), [category.map, ctx.searchParams.lang]);
    const isLoading = Boolean(grid.isLoading || category.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText].filter((x): x is string => Boolean(x)), [grid.errors, category.errorText]);
    const rawData = useMemo<PageManagementListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryMap,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, categoryMap]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await category.refetch();
    }, [category]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 建立頁面管理搜尋欄位設定 */
const buildPageManagementSearchFields = (rawData: PageManagementListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, PageManagementDetailFields.Title, "標題");
    const categoryTitle = getColumnTitle(rawData.modelDisplayName, PageManagementFields.CategoryId, "類別");

    return [
        { key: PAGE_MANAGEMENT_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` },
        { key: PAGE_MANAGEMENT_CATEGORY_SEARCH_KEY, title: categoryTitle, type: "select", options: buildCategorySearchOptions(rawData.categoryMap) },
    ];
};

/** 將 SearchValues 轉為頁面管理列表查詢參數 */
const toPageManagementSearchParams = (values: SearchValues, lang: Lang): PageManagementSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[PAGE_MANAGEMENT_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[PAGE_MANAGEMENT_CATEGORY_SEARCH_KEY]),
    };
};

/** 建立頁面管理搜尋條件 */
const buildPageManagementSearchConditions = (ctx: { searchParams: PageManagementSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.title)
    {
        conditions.push(`${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title} Like ${ctx.searchParams.title}`);
    }

    if (ctx.searchParams.categoryId)
    {
        conditions.push(`${PageManagementFields.CategoryId} = ${ctx.searchParams.categoryId}`);
    }

    return conditions;
};

/** 建立頁面管理列表完整 QueryParam */
const buildPageManagementQueryParam = (ctx: { pageNumber: number; searchParams: PageManagementSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildPageManagementQueryFields(),
        Condition: LibCondition.joinConditions([LibCondition.createCondition(`${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`, Operator.Equal, ctx.searchParams.lang), ctx.searchCondition]),
        OrderBy: [{ Col: PageManagementFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立頁面管理列表查詢欄位 */
const buildPageManagementQueryFields = (): string[] =>
{
    return [
        PageManagementFields.InternalId,
        PageManagementFields.PageId,
        PageManagementFields.CategoryId,
        PageManagementFields.ModifyUserId,
        PageManagementFields.ModifyTime,
        `${PageManagementFields.ModifyUser}.${AccountFields.AccountName}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
        `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title}`,
    ];
};

/** 將頁面管理資料轉為 GridProps */
const buildPageManagementGridProps = (
    opt: {
        raw: PageManagementListRawData;
        lang: Lang;
        adapter?: PageManagementListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [PageManagementFields.CategoryId, PageManagementDetailFields.Title, PageManagementFields.ModifyUserId, PageManagementFields.ModifyTime];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildPageManagementRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhancePageManagementGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入頁面管理 Grid 編輯與刪除動作 */
const enhancePageManagementGrid = (
    opt: {
        baseGrid: GridProps;
        raw: PageManagementListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<PageManagementSet>({
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
        getInternalId: (set) => set.PageManagement?.InternalId ?? "",
    });
};

/** 建立頁面管理列表列資料 */
const buildPageManagementRows = (raw: PageManagementListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const pageManagement = set.PageManagement;
        const keyId = pageManagement?.InternalId ?? LibText.Merge("|", false, pageManagement?.PageId);
        const cells: RowCell[] = [
            { col: columns[0], content: mapIdsToList(pageManagement?.CategoryId, raw.categoryMap) },
            { col: columns[1], content: getPageManagementTitle(set, lang) },
            { col: columns[2], content: pageManagement?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: formatDateTime(pageManagement?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 取得頁面目前語系標題 */
const getPageManagementTitle = (set: PageManagementSet, lang: Lang): string =>
{
    return findTextByKey(set.PageManagementDetail, (detail) => detail?.Lang, lang, (detail) => detail?.Title);
};

// #endregion
