import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerSearchStringValue as getSearchStringValue,
    getServerColumnTitle as getColumnTitle,
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
import { formatDateTime, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, RoleDataFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type RolePermissionFormModel = components["schemas"]["RoleData"];

type RolePermissionApiAdapter = ReturnType<typeof RolePermissionAdapter>;

type RolePermissionCudActions = ReturnType<RolePermissionApiAdapter["hooks"]["useCudActions"]>;

export interface RolePermissionListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface RolePermissionSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 角色名稱搜尋關鍵字 */
    roleName?: string;
}

export interface RolePermissionListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 角色權限列表資料 */
    list: RolePermissionFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface RolePermissionListAdapter
{
    /** 角色權限 API adapter */
    RolePermission: RolePermissionApiAdapter;

    /** 角色權限 CUD 操作 */
    cudActions: RolePermissionCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type RolePermissionListGridTemplate = ServerListGridTemplate<RolePermissionSearchParams, RolePermissionListRawData, RolePermissionListAdapter, QueryListParam, RolePermissionListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: RolePermissionCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

/** ModelDisplayName 中 Account 導覽資料的表格代號。 */
const ACCOUNT_TABLE_ID = "Account";

type RolePermissionVisibleColumn = {
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId?: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};
// #endregion

// #region Public
export const ROLE_PERMISSION_ROLE_NAME_SEARCH_KEY = "roleName";


const ROLE_PERMISSION_LIST_STATE_KEY = "server-role-permission-list";

const DEFAULT_ROLE_PERMISSION_LIST_PAGE_STATE: RolePermissionListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立角色權限後台 ListGridTemplate 設定 */
export const useRolePermissionListGridTemplate = (opt: { lang: Lang; }): RolePermissionListGridTemplate =>
{
    const pageState = usePageStateMemory<RolePermissionListPageState>({
        stateKey: ROLE_PERMISSION_LIST_STATE_KEY,
        defaultState: DEFAULT_ROLE_PERMISSION_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<RolePermissionListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.RolePermission,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateRolePermissionSearchValues,
                updatePageNumber: updateRolePermissionPageNumber,
                getPagination: getRolePermissionPagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildRolePermissionSearchFields(rawData),
                toSearchParams: (values) => toRolePermissionSearchParams(values, opt.lang),
                buildSearchConditions: buildRolePermissionSearchConditions,
                buildQueryParam: buildRolePermissionQueryParam,
                useDataSource: useRolePermissionListGridDataSource,
                buildGridProps: (ctx) => buildRolePermissionGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新RolePermission記憶狀態，並固定回到第一頁。 */
const updateRolePermissionSearchValues = (state: RolePermissionListPageState, searchValues: SearchValues): RolePermissionListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新RolePermission列表記憶頁碼。 */
const updateRolePermissionPageNumber = (state: RolePermissionListPageState, pageNumber: number): RolePermissionListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的RolePermission分頁資訊。 */
const getRolePermissionPagination = (rawData: RolePermissionListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行角色權限列表資料來源 Hook */
const useRolePermissionListGridDataSource = (
    ctx: ServerListGridDataSourceContext<RolePermissionSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<RolePermissionListRawData, RolePermissionListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ RolePermission: RolePermissionAdapter() }), []);
    const cudActions = apiAdapter.RolePermission.hooks.useCudActions({ onError });
    const grid = apiAdapter.RolePermission.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<RolePermissionListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData };
};

/** 建立角色權限搜尋欄位設定 */
const buildRolePermissionSearchFields = (rawData: RolePermissionListRawData): SearchFieldConfig[] =>
{
    const roleNameTitle = getColumnTitle(rawData.modelDisplayName, RoleDataFields.RoleName, "角色名稱");

    return [{ key: ROLE_PERMISSION_ROLE_NAME_SEARCH_KEY, title: roleNameTitle, type: "text", placeholder: `請輸入${roleNameTitle}` }];
};

/** 將 SearchValues 轉為角色權限列表查詢參數 */
const toRolePermissionSearchParams = (values: SearchValues, lang: Lang): RolePermissionSearchParams =>
{
    return {
        lang,
        roleName: getSearchStringValue(values[ROLE_PERMISSION_ROLE_NAME_SEARCH_KEY]),
    };
};

/** 建立角色權限搜尋條件 */
const buildRolePermissionSearchConditions = (ctx: { searchParams: RolePermissionSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.roleName)
    {
        conditions.push(`${RoleDataFields.RoleName} Like ${ctx.searchParams.roleName}`);
    }

    return conditions;
};

/** 建立角色權限列表完整 QueryParam */
const buildRolePermissionQueryParam = (ctx: { pageNumber: number; searchParams: RolePermissionSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildRolePermissionQueryFields();
    const condition = LibCondition.joinConditions([ctx.searchCondition]);
    return { Fields: fields, Condition: condition, OrderBy: [{ Col: RoleDataFields.CreateTime, Desc: true }], PageNumber: ctx.pageNumber, PageSize: 10 };
};

/** 建立角色權限列表查詢欄位 */
const buildRolePermissionQueryFields = (): string[] =>
{
    return [
        RoleDataFields.InternalId,
        RoleDataFields.RoleId,
        RoleDataFields.RoleName,
        RoleDataFields.CreateTime,
        RoleDataFields.ModifyUserId,
        `${RoleDataFields.ModifyUser}.${AccountFields.AccountName}`,
        RoleDataFields.ModifyTime,
    ];
};

/** 將角色權限資料轉為 GridProps */
const buildRolePermissionGridProps = (
    opt: {
        raw: RolePermissionListRawData;
        lang: Lang;
        adapter?: RolePermissionListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = buildRolePermissionVisibleColumns();
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildRolePermissionRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceRolePermissionGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入角色權限 Grid 編輯與刪除動作 */
const enhanceRolePermissionGrid = (
    opt: {
        baseGrid: GridProps;
        raw: RolePermissionListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<RolePermissionFormModel>({
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
        getInternalId: (form) => form.InternalId ?? "",
    });
};

/** 建立角色權限列表顯示欄位設定 */
const buildRolePermissionVisibleColumns = (): RolePermissionVisibleColumn[] =>
{
    return [
        { key: RoleDataFields.RoleName, columnId: RoleDataFields.RoleName, fallback: "角色名稱" },
        { key: RoleDataFields.CreateTime, columnId: RoleDataFields.CreateTime, fallback: "建立時間" },
        { key: RoleDataFields.ModifyUserId, columnId: RoleDataFields.ModifyUserId, fallback: "修改者代號" },
        { key: AccountFields.AccountName, tableId: ACCOUNT_TABLE_ID, columnId: AccountFields.AccountName, fallback: "修改者" },
        { key: RoleDataFields.ModifyTime, columnId: RoleDataFields.ModifyTime, fallback: "修改時間" },
    ];
};

/** 建立角色權限列表列資料 */
const buildRolePermissionRows = (raw: RolePermissionListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((form) => buildRolePermissionRow(form, columns));
};

/** 建立角色權限列表單列資料 */
const buildRolePermissionRow = (form: RolePermissionFormModel, columns: ColumnConfig[]): GridRow =>
{
    const keyId = form.InternalId ?? LibText.Merge("|", false, form.RoleId, form.RoleName);
    const cells: RowCell[] = [
        { col: columns[0], content: form.RoleName ?? "" },
        { col: columns[1], content: formatDateTime(form.CreateTime) },
        { col: columns[2], content: form.ModifyUserId ?? "" },
        { col: columns[3], content: form.ModifyUser?.AccountName ?? "" },
        { col: columns[4], content: formatDateTime(form.ModifyTime) },
    ];

    return { keyId, cells };
};

// #endregion
