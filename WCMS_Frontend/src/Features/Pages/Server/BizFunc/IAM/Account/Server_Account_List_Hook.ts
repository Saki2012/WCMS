import { AccountAdapter } from "@/Features/Hooks/BizFunc/IAM/Account_Api";
import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/IAM/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PersonModelFields, PGID, RoleDataModelFields } from "@/types/SchemaFields";
import { createElement, type ReactNode, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type AccountSet = components["schemas"]["AccountSet_DTO"];
type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];
type AccountApiAdapter = ReturnType<typeof AccountAdapter>;
type RolePermissionApiAdapter = ReturnType<typeof RolePermissionAdapter>;
type AccountCudActions = ReturnType<AccountApiAdapter["hooks"]["useCudActions"]>;

export const ACCOUNT_USER_NAME_SEARCH_KEY = "userName";
export const ACCOUNT_ROLE_ID_SEARCH_KEY = "roleId";

export interface AccountSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 使用者名稱搜尋關鍵字 */
    userName?: string;

    /** 角色代號搜尋條件 */
    roleId?: string;
}

export interface AccountListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 帳號列表資料 */
    list: AccountSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 角色代號與顯示文字對照 */
    roleMap: Record<string, string>;
}

export interface AccountListAdapter
{
    /** 帳號 API adapter */
    Account: AccountApiAdapter;

    /** 角色權限 API adapter */
    RolePermission: RolePermissionApiAdapter;

    /** 帳號 CUD 操作 */
    cudActions: AccountCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type AccountListGridTemplate = ServerListGridTemplate<AccountSearchParams, AccountListRawData, AccountListAdapter, QueryListParam>;

/** 建立帳號後台 ListGridTemplate 設定 */
export const useAccountListGridTemplate = (opt: { lang: Lang; }): AccountListGridTemplate =>
{
    return useMemo<AccountListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Account,
            feature: {
                buildSearchFields: ({ rawData }) => buildAccountSearchFields(rawData),
                toSearchParams: (values) => toAccountSearchParams(values, opt.lang),
                buildSearchConditions: buildAccountSearchConditions,
                buildQueryParam: buildAccountQueryParam,
                useDataSource: useAccountListGridDataSource,
                buildGridProps: (ctx) =>
                    buildAccountGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};

/** 執行帳號列表資料來源 Hook */
const useAccountListGridDataSource = (
    ctx: ServerListGridDataSourceContext<AccountSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<AccountListRawData, AccountListAdapter> =>
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
        return { Account: AccountAdapter(), RolePermission: RolePermissionAdapter() };
    }, []);

    const cudActions = apiAdapter.Account.hooks.useCudActions({ onError });
    const grid = apiAdapter.Account.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const role = apiAdapter.RolePermission.hooks.useQueryList({ condition: buildRoleQueryParam(), deps: [], onError });
    const roleMap = useMemo(() => buildRoleMap(role.data ?? []), [role.data]);
    const isLoading = Boolean(grid.isLoading || role.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), role.errorText].filter((x): x is string => Boolean(x)), [grid.errors, role.errorText]);
    const rawData = useMemo<AccountListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            roleMap,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, roleMap]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await role.refetch();
    }, [role]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 建立帳號搜尋欄位設定 */
const buildAccountSearchFields = (rawData: AccountListRawData): SearchFieldConfig[] =>
{
    const userNameTitle = getColumnTitle(rawData.modelDisplayName, AccountFields.AccountName, "使用者名稱");
    const roleTitle = getColumnTitle(rawData.modelDisplayName, AccountFields.RoleId, "角色代號");

    return [{ key: ACCOUNT_USER_NAME_SEARCH_KEY, title: userNameTitle, type: "text", placeholder: `請輸入${userNameTitle}` }, {
        key: ACCOUNT_ROLE_ID_SEARCH_KEY,
        title: roleTitle,
        type: "select",
        options: buildRoleSearchOptions(rawData.roleMap),
    }];
};

/** 將 SearchValues 轉為帳號列表查詢參數 */
const toAccountSearchParams = (values: SearchValues, lang: Lang): AccountSearchParams =>
{
    return { lang, userName: getSearchStringValue(values[ACCOUNT_USER_NAME_SEARCH_KEY]), roleId: getSearchStringValue(values[ACCOUNT_ROLE_ID_SEARCH_KEY]) };
};

/** 建立帳號搜尋條件 */
const buildAccountSearchConditions = (ctx: { searchParams: AccountSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.userName)
    {
        conditions.push(`${AccountFields.AccountName} Like ${ctx.searchParams.userName}`);
    }

    if (ctx.searchParams.roleId)
    {
        conditions.push(`${AccountFields.RoleId} = ${ctx.searchParams.roleId}`);
    }

    return conditions;
};

/** 建立帳號列表完整 QueryParam */
const buildAccountQueryParam = (ctx: { searchParams: AccountSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildAccountQueryFields();
    const condition = LibMerge(" And ", false, ctx.searchCondition);

    return { Fields: fields, Condition: condition, OrderBy: [{ Col: AccountFields.CreateTime, Desc: true }], PageNumber: 1, PageSize: 10 };
};

/** 建立帳號列表查詢欄位 */
const buildAccountQueryFields = (): string[] =>
{
    return [
        AccountFields.InternalId,
        AccountFields.AccountId,
        AccountFields.AccountName,
        AccountFields.RoleId,
        AccountFields.ModifyTime,
        AccountFields.CreateTime,
        `${AccountFields.Person}.${PersonModelFields.PersonImgId}`,
        `${AccountFields.Role}.${RoleDataModelFields.RoleName}`,
    ];
};

/** 建立角色下拉查詢參數 */
const buildRoleQueryParam = (): QueryListParam =>
{
    return {
        Fields: [RoleDataModelFields.RoleId, RoleDataModelFields.RoleName],
        OrderBy: [{ Col: RoleDataModelFields.RoleId, Desc: false }],
        PageNumber: 1,
        PageSize: 0,
    };
};

/** 建立角色下拉搜尋選項 */
const buildRoleSearchOptions = (roleMap: Record<string, string>): SearchFieldConfig["options"] =>
{
    return Object.entries(roleMap).map(([value, title]) => ({ value, title: title || value }));
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: AccountCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

/** 將帳號資料轉為 GridProps */
const buildAccountGridProps = (
    opt: {
        raw: AccountListRawData;
        lang: Lang;
        adapter?: AccountListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [PersonModelFields.PersonImgId, AccountFields.AccountId, AccountFields.AccountName, AccountFields.RoleId, AccountFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildAccountRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceAccountGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入帳號 Grid 編輯與刪除動作 */
const enhanceAccountGrid = (
    opt: {
        baseGrid: GridProps;
        raw: AccountListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<AccountSet>({
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
        getInternalId: (set) => set.Account?.InternalId ?? "",
    });
};

/** 建立帳號列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: AccountListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, getAccountColumnFallback(col)) }));
};

/** 建立帳號列表列資料 */
const buildAccountRows = (raw: AccountListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildAccountRow(set, columns, raw.roleMap));
};

/** 建立帳號列表單列資料 */
const buildAccountRow = (set: AccountSet, columns: ColumnConfig[], roleMap: Record<string, string>): GridRow =>
{
    const account = set.Account;
    const keyId = account?.InternalId ?? LibMerge("|", false, account?.AccountId);
    const cells: RowCell[] = [
        { col: columns[0], content: buildAccountImage(set) },
        { col: columns[1], content: account?.AccountId ?? "" },
        { col: columns[2], content: account?.AccountName ?? "" },
        { col: columns[3], content: buildRoleContent(account?.RoleId, account?.Role?.RoleName, roleMap) },
        { col: columns[4], content: FormatDateTime(account?.ModifyTime) },
    ];

    return { keyId, cells };
};

/** 建立帳號圖片預覽 */
const buildAccountImage = (set: AccountSet): RowCell["content"] =>
{
    const personImgId = set.Account?.Person?.PersonImgId;
    if (!personImgId) return null;

    return createElement("img", {
        src: FileManagementAPI.get_Server_Preview_Url(personImgId),
        alt: "帳號圖片預覽",
        style: { width: "72px", height: "72px", objectFit: "cover", borderRadius: "50%" },
    });
};

/** 建立角色欄位顯示內容 */
const buildRoleContent = (roleId: string | null | undefined, roleName: string | null | undefined, roleMap: Record<string, string>): ReactNode =>
{
    const id = roleId ?? "";
    const name = roleName ?? roleMap[id] ?? "";

    if (!id) return name;
    if (!name || name === id) return id;

    return createElement("div", { className: "d-flex flex-column gap-1" }, createElement("span", null, name), createElement("small", null, id));
};

/** 將角色資料轉成下拉 map */
const buildRoleMap = (roles: RolePermissionSet[]): Record<string, string> =>
{
    return roles.reduce<Record<string, string>>((acc, set) =>
    {
        const roleId = set.RoleData?.RoleId ?? "";
        if (!roleId) return acc;

        const roleName = set.RoleData?.RoleName ?? "";
        acc[roleId] = roleName ? `${roleName}（${roleId}）` : roleId;
        return acc;
    }, {});
};

/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得帳號列表欄位預設顯示文字 */
const getAccountColumnFallback = (columnId: string): string =>
{
    const map: Record<string, string> = {
        [PersonModelFields.PersonImgId]: "圖片",
        [AccountFields.AccountId]: "帳號",
        [AccountFields.AccountName]: "使用者名稱",
        [AccountFields.RoleId]: "角色代號",
        [AccountFields.ModifyTime]: "修改時間",
    };

    return map[columnId] ?? `【${columnId}】`;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
