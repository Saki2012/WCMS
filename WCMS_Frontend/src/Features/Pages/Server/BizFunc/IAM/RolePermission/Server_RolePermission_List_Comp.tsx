import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useMemo, useState } from "react";
import { useLocation, useNavigate, type NavigateFunction } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import type { components } from "@/types/api";

import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { AccountFields, RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import { useRolePermissionListFetchData, type RolePermissionListRawData } from "./Server_RolePermission_List_Hook";

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"];

/** 角色權限列表 */
export const Server_RolePermission_Comp = (prop: {
    title: string;
    theme: IBETheme;
    lang: Lang;
}) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {
        title: "角色搜尋",
        subTitle: "搜尋角色 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);
    const getData = useRolePermissionListFetchData({ lang: prop.lang, kw });
    const navigate = useNavigate();

    const cudActions = getData.adapter.hooks.useCudActions();

    const actions = useMemo<UseActionsResult>(() => {
        // return：給 ListComp 上方工具列使用
        return {
            isExecuting: cudActions.isSaving,
            onSave: async () => false,
            onDelete: async (internalId: string) => {
                const res = await cudActions.deleteAsync(internalId);
                if (res.IsSuccess) await getData.refetchData();
            },
            onInvalid: () => { /* List 暫不處理 invalid */ },
            onCancelBack: () => navigate(dirUrl.replace(/\/Form$/, "/List")),
            onAddNew: () => navigate(dirUrl),
            onEdit: (internalId: string) => navigate(`${dirUrl}/${internalId}`),
            onPreview: () => { /* List 不使用 */ },
        };
    }, [cudActions.isSaving, cudActions.deleteAsync, getData.refetchData, navigate, dirUrl]);

    const gridData = useMemo(() => {
        // return：在 comp 端做 adjust cell 注入
        return buildRolePermissionGridProps({
            raw: getData.rawData,
            lang: prop.lang,
            crud: {
                navigate,
                dirUrl,
                deleteAsync: cudActions.deleteAsync,
                afterDelete: getData.refetchData,
            },
        });
    }, [getData.rawData, prop.lang, navigate, dirUrl, cudActions.deleteAsync, getData.refetchData]);

    // return（DOM 結構不動）
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={getData.isLoading}
            ErrorList={getData.errors}
            Actions={actions}
            GridData={gridData}
            SearchBar={searchCompProp}
        />
    );
};

//#region GridProps
type CrudDeps = {
    navigate: NavigateFunction;
    dirUrl: string;
    deleteAsync: (internalId: string) => Promise<ApiResponse<RolePermissionSet>>;
    afterDelete: () => Promise<void>;
};

/** RolePermission 專用：rawData → GridProps（含 ActionCell / Delete confirm） */
const buildRolePermissionGridProps = (opt: {
    raw: RolePermissionListRawData;
    lang: Lang;
    crud: CrudDeps;
    can?: (mask: number) => boolean;
    notifyNoPermission?: (msg: string) => void;
    confirm?: GridConfirmFn;
}): GridProps => {
    // 宣告變數
    const visibleKeys: ReadonlyArray<readonly [string, string]> = [
        [RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.CreateTime],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyUserId],
        [RoleDataModelFields.ModifyUser, AccountFields.AccountName],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyTime],
    ];

    // 執行 function：Grid 基礎資料
    const columns = buildColumns(visibleKeys, opt.raw);
    const rows = buildRolePermissionRows(opt.raw, columns);

    const baseGrid: GridProps = {
        columns,
        rows,
        CurrentPage: opt.raw.pageNumber ?? 1,
        TotalPage: opt.raw.totalPages ?? 1,
        onPageChange: opt.raw.onPageChange,
    };

    // 執行 function：動作按鈕（Edit/Delete）
    const actions = createGridCrudActions<RolePermissionSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    // return：enhance 注入 __adjust__
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.RoleData?.InternalId ?? "",
    });
};

/** 欄位定義（順序＝顯示順序） */
const buildColumns = (
    visibleKeys: ReadonlyArray<readonly [string, string]>,
    raw: RolePermissionListRawData,
): ColumnConfig[] => {
    // return
    return visibleKeys.map(([tableId, columnId]) => {
        const hit = findSchemaColumn(raw.modelDisplayName, tableId, columnId);

        return {
            key: columnId,
            title: hit?.ColumnDisplayName ?? `【${columnId}】`,
        };
    });
};

/** 從 schema 找對應欄位 */
const findSchemaColumn = (
    schema: ModelDisplaySchema | null,
    tableId: string,
    columnId: string,
) => {
    // 宣告變數
    const tables = schema?.Tables ?? [];
    const table = tables.find((t) => t.TableId === tableId);

    // return
    return table?.Columns?.find((c) => c.ColumnId === columnId);
};

/** 列資料（cells 順序必須跟 columns 對齊） */
const buildRolePermissionRows = (
    raw: RolePermissionListRawData,
    columns: ColumnConfig[],
): GridRow[] => {
    // return
    return (raw.list ?? []).map((set) => {
        // 宣告變數
        const keyId = LibMerge("|", false, set.RoleData?.InternalId, set.RoleData?.RoleName);
        const role = set.RoleData;

        const cells: RowCell[] = [
            { col: columns[0], content: role?.RoleName ?? "" },
            { col: columns[1], content: FormatDateTime(role?.CreateTime) },
            { col: columns[2], content: role?.ModifyUserId ?? "" },
            { col: columns[3], content: role?.ModifyUser?.AccountName ?? "" },
            { col: columns[4], content: FormatDateTime(role?.ModifyTime) },
        ];

        // return
        return { keyId, cells };
    });
};
//#endregion