import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WEB/WebResource_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { GetDataStatusContent } from "@/Features/Pages/Server/Scaffold/CommUnitComp/CommonComp";
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
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { findTextByKey, formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, WebResourceFields, WebResourceInfoFields } from "@/types/SchemaFields";
import { createElement, Fragment, type ReactNode, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type WebResourceFormModel = components["schemas"]["WebResource"];

type WebResourceApiAdapter = ReturnType<typeof WebResourceAdapter>;

type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;

type WebResourceCudActions = ReturnType<WebResourceApiAdapter["hooks"]["useCudActions"]>;

export interface WebResourceListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface WebResourceSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 網路資源標題搜尋關鍵字 */
    title?: string;

    /** 網路資源分類搜尋條件 */
    categoryId?: string;
}

export interface WebResourceListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 網路資源列表資料 */
    list: WebResourceFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 分類代碼與顯示文字對照 */
    categoryMap: Record<string, string>;
}

export interface WebResourceListAdapter
{
    /** 網路資源 API adapter */
    WebResource: WebResourceApiAdapter;

    /** 分類 API adapter */
    Category: CategoryApiAdapter;

    /** 網路資源 CUD 操作 */
    cudActions: WebResourceCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type WebResourceListGridTemplate = ServerListGridTemplate<WebResourceSearchParams, WebResourceListRawData, WebResourceListAdapter, QueryListParam, WebResourceListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: WebResourceCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const WEB_RESOURCE_TITLE_SEARCH_KEY = "title";

export const WEB_RESOURCE_CATEGORY_SEARCH_KEY = "categoryId";


const WEB_RESOURCE_LIST_STATE_KEY = "server-web-resource-list";

const DEFAULT_WEB_RESOURCE_LIST_PAGE_STATE: WebResourceListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立網路資源後台 ListGridTemplate 設定 */
export const useWebResourceListGridTemplate = (opt: { lang: Lang; }): WebResourceListGridTemplate =>
{
    const pageState = usePageStateMemory<WebResourceListPageState>({
        stateKey: WEB_RESOURCE_LIST_STATE_KEY,
        defaultState: DEFAULT_WEB_RESOURCE_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<WebResourceListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.WebResource,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateWebResourceSearchValues,
                updatePageNumber: updateWebResourcePageNumber,
                getPagination: getWebResourcePagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildWebResourceSearchFields(rawData),
                toSearchParams: (values) => toWebResourceSearchParams(values, opt.lang),
                buildSearchConditions: buildWebResourceSearchConditions,
                buildQueryParam: buildWebResourceQueryParam,
                useDataSource: useWebResourceListGridDataSource,
                buildGridProps: (ctx) => buildWebResourceGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新WebResource記憶狀態，並固定回到第一頁。 */
const updateWebResourceSearchValues = (state: WebResourceListPageState, searchValues: SearchValues): WebResourceListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新WebResource列表記憶頁碼。 */
const updateWebResourcePageNumber = (state: WebResourceListPageState, pageNumber: number): WebResourceListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的WebResource分頁資訊。 */
const getWebResourcePagination = (rawData: WebResourceListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行網路資源列表資料來源 Hook */
const useWebResourceListGridDataSource = (
    ctx: ServerListGridDataSourceContext<WebResourceSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<WebResourceListRawData, WebResourceListAdapter> =>
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
        return { WebResource: WebResourceAdapter(), Category: CategoryAdapter() };
    }, []);

    const cudActions = apiAdapter.WebResource.hooks.useCudActions({ onError });
    const grid = apiAdapter.WebResource.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.WebResource, lang: ctx.searchParams.lang, onError });

    const categoryMap = useMemo(() => buildCategoryTextMap(category.map ?? {}, ctx.searchParams.lang), [category.map, ctx.searchParams.lang]);
    const isLoading = Boolean(grid.isLoading || category.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText].filter((x): x is string => Boolean(x)), [grid.errors, category.errorText]);
    const rawData = useMemo<WebResourceListRawData>(() =>
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

/** 建立網路資源搜尋欄位設定 */
const buildWebResourceSearchFields = (rawData: WebResourceListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, WebResourceInfoFields.Title, "標題");
    const categoryTitle = getColumnTitle(rawData.modelDisplayName, WebResourceFields.Categories, "分類");

    return [{ key: WEB_RESOURCE_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }, {
        key: WEB_RESOURCE_CATEGORY_SEARCH_KEY,
        title: categoryTitle,
        type: "select",
        options: buildCategorySearchOptions(rawData.categoryMap),
    }];
};

/** 將 SearchValues 轉為網路資源列表查詢參數 */
const toWebResourceSearchParams = (values: SearchValues, lang: Lang): WebResourceSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[WEB_RESOURCE_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[WEB_RESOURCE_CATEGORY_SEARCH_KEY]),
    };
};

/** 建立網路資源搜尋條件 */
const buildWebResourceSearchConditions = (ctx: { searchParams: WebResourceSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.title)
    {
        conditions.push(`${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} Like ${ctx.searchParams.title}`);
    }

    if (ctx.searchParams.categoryId)
    {
        conditions.push(`${WebResourceFields.Categories} HasAny [${ctx.searchParams.categoryId}]`);
    }

    return conditions;
};

/** 建立網路資源列表完整 QueryParam */
const buildWebResourceQueryParam = (ctx: { pageNumber: number; searchParams: WebResourceSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildWebResourceQueryFields(),
        Condition: LibCondition.joinConditions([LibCondition.createCondition(`${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`, Operator.Equal, ctx.searchParams.lang), ctx.searchCondition]),
        RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立網路資源列表查詢欄位 */
const buildWebResourceQueryFields = (): string[] =>
{
    return [
        WebResourceFields.InternalId,
        WebResourceFields.WebResourceId,
        WebResourceFields.Categories,
        WebResourceFields.Tags,
        WebResourceFields.ContentStatus,
        WebResourceFields.PicId,
        WebResourceFields.PicDescription,
        WebResourceFields.ModifyUserId,
        WebResourceFields.CreateTime,
        WebResourceFields.ModifyTime,
        `${WebResourceFields.ModifyUser}.${AccountFields.AccountName}`,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
        `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
    ];
};

/** 將網路資源資料轉為 GridProps */
const buildWebResourceGridProps = (
    opt: {
        raw: WebResourceListRawData;
        lang: Lang;
        adapter?: WebResourceListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [
        WebResourceFields.PicId,
        WebResourceFields.Categories,
        WebResourceInfoFields.Title,
        WebResourceFields.ModifyUserId,
        WebResourceFields.ModifyTime,
    ];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildWebResourceRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceWebResourceGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入網路資源 Grid 編輯與刪除動作 */
const enhanceWebResourceGrid = (
    opt: {
        baseGrid: GridProps;
        raw: WebResourceListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<WebResourceFormModel>({
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
        getInternalId: (formModel) => formModel.InternalId ?? "",
    });
};

/** 建立網路資源列表列資料 */
const buildWebResourceRows = (raw: WebResourceListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((formModel) =>
    {
        const keyId = formModel.InternalId ?? LibText.Merge("|", false, formModel.WebResourceId);
        const webResource = formModel;
        const cells: RowCell[] = [
            { col: columns[0], content: buildPictureCell(webResource?.PicId, webResource?.PicDescription) },
            { col: columns[1], content: mapIdsToList(webResource?.Categories, raw.categoryMap) },
            { col: columns[2], content: buildTitleCell(formModel, lang) },
            { col: columns[3], content: webResource?.ModifyUser?.AccountName ?? "" },
            { col: columns[4], content: formatDateTime(webResource?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 建立網路資源封面圖片欄位內容 */
const buildPictureCell = (picId: string | null | undefined, picDescription: string | null | undefined): ReactNode =>
{
    if (!picId) return null;

    return createElement("img", {
        src: FileManagementAPI.get_Server_Preview_Url(picId),
        alt: picDescription ?? "網路資源封面圖片",
        style: { width: "80px", height: "80px", objectFit: "cover" },
    });
};

/** 建立標題與資料狀態欄位內容 */
const buildTitleCell = (formModel: WebResourceFormModel, lang: Lang): ReactNode =>
{
    const title = findTextByKey(formModel._WebResourceInfo, (d) => d?.Lang, lang, (d) => d?.Title);

    return createElement(Fragment, null, createElement("span", { key: "title" }, title), GetDataStatusContent(formModel.ContentStatus ?? 0));
};

// #endregion
