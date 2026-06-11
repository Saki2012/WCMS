import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerSearchStringValue as getSearchStringValue,
    getServerTableColumnTitle as getColumnTitle,
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
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];

type RolePermissionApiAdapter = ReturnType<typeof RolePermissionAdapter>;

type RolePermissionCudActions = ReturnType<RolePermissionApiAdapter["hooks"]["useCudActions"]>;

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
    list: RolePermissionSet[];

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

export type RolePermissionListGridTemplate = ServerListGridTemplate<RolePermissionSearchParams, RolePermissionListRawData, RolePermissionListAdapter, QueryListParam>;

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

type RolePermissionVisibleColumn = {
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
export const ROLE_PERMISSION_ROLE_NAME_SEARCH_KEY = "roleName";

/** 建立角色權限後台 ListGridTemplate 設定 */
export const useRolePermissionListGridTemplate = (opt: { lang: Lang; }): RolePermissionListGridTemplate =>
{
    return useMemo<RolePermissionListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.RolePermission,
            feature: {
                buildSearchFields: ({ rawData }) => buildRolePermissionSearchFields(rawData),
                toSearchParams: (values) => toRolePermissionSearchParams(values, opt.lang),
                buildSearchConditions: buildRolePermissionSearchConditions,
                buildQueryParam: buildRolePermissionQueryParam,
                useDataSource: useRolePermissionListGridDataSource,
                buildGridProps: (ctx) => buildRolePermissionGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};
// #endregion

// #region Private
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
    const roleNameTitle = getColumnTitle(rawData.modelDisplayName, RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName, "角色名稱");

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
        conditions.push(`${RoleDataModelFields.RoleName} Like ${ctx.searchParams.roleName}`);
    }

    return conditions;
};

/** 建立角色權限列表完整 QueryParam */
const buildRolePermissionQueryParam = (ctx: { searchParams: RolePermissionSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildRolePermissionQueryFields();
    const condition = LibCondition.joinConditions([ctx.searchCondition]);
    return { Fields: fields, Condition: condition, OrderBy: [{ Col: RoleDataModelFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10 };
};

/** 建立角色權限列表查詢欄位 */
const buildRolePermissionQueryFields = (): string[] =>
{
    return [
        RoleDataModelFields.InternalId,
        RoleDataModelFields.RoleId,
        RoleDataModelFields.RoleName,
        RoleDataModelFields.CreateTime,
        RoleDataModelFields.ModifyUserId,
        `${RoleDataModelFields.ModifyUser}.${AccountFields.AccountName}`,
        RoleDataModelFields.ModifyTime,
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
    const actions = createGridCrudActions<RolePermissionSet>({
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
        getInternalId: (set) => set.RoleData?.InternalId ?? "",
    });
};

/** 建立角色權限列表顯示欄位設定 */
const buildRolePermissionVisibleColumns = (): RolePermissionVisibleColumn[] =>
{
    return [
        { key: RoleDataModelFields.RoleName, tableId: RolePermissionSetFields.RoleData, columnId: RoleDataModelFields.RoleName, fallback: "角色名稱" },
        { key: RoleDataModelFields.CreateTime, tableId: RolePermissionSetFields.RoleData, columnId: RoleDataModelFields.CreateTime, fallback: "建立時間" },
        { key: RoleDataModelFields.ModifyUserId, tableId: RolePermissionSetFields.RoleData, columnId: RoleDataModelFields.ModifyUserId, fallback: "修改者代號" },
        { key: AccountFields.AccountName, tableId: RoleDataModelFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        { key: RoleDataModelFields.ModifyTime, tableId: RolePermissionSetFields.RoleData, columnId: RoleDataModelFields.ModifyTime, fallback: "修改時間" },
    ];
};

/** 建立角色權限列表列資料 */
const buildRolePermissionRows = (raw: RolePermissionListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildRolePermissionRow(set, columns));
};

/** 建立角色權限列表單列資料 */
const buildRolePermissionRow = (set: RolePermissionSet, columns: ColumnConfig[]): GridRow =>
{
    const role = set.RoleData;
    const keyId = role?.InternalId ?? LibText.Merge("|", false, role?.RoleId, role?.RoleName);
    const cells: RowCell[] = [
        { col: columns[0], content: role?.RoleName ?? "" },
        { col: columns[1], content: formatDateTime(role?.CreateTime) },
        { col: columns[2], content: role?.ModifyUserId ?? "" },
        { col: columns[3], content: role?.ModifyUser?.AccountName ?? "" },
        { col: columns[4], content: formatDateTime(role?.ModifyTime) },
    ];

    return { keyId, cells };
};

// #endregion
