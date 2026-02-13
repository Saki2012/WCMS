import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme"
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data"
import { useCallback, useMemo, useState } from "react"
import { useLocation, useNavigate } from 'react-router-dom';
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp"
import type { components } from "@/types/api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { AccountFields, RoleDataModelFields, RolePermissionSetFields } from "@/types/SchemaFields";
import { RolePermissionAdapter } from "@/Features/Hooks/BizFunc/AccountManage/RolePermission/RolePermission_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";

type RolePermissionSet = components["schemas"]["RolePermissionSet_DTO"]
type QueryListParam = components["schemas"]["QueryListParam"]

/** 公告列表
 * @returns
 */
export const Server_RolePermission_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => RolePermissionAdapter(), []);

    const useRolePermissionList = useList(adapter, prop.lang, kw);
    const actions = useRolePermissionActionsFromAdapter(dirUrl, adapter, useRolePermissionList.refetchAll);

    const adjustedGrid = useMemo(() => {
        // return
        return SetAdjustFunction(useRolePermissionList.gridProps, useRolePermissionList.rawData, actions);
    }, [useRolePermissionList.gridProps, useRolePermissionList.rawData, actions]);

    const isLoading = useMemo(() => {
        // return
        return [useRolePermissionList.isLoading];
    }, [useRolePermissionList.isLoading]);

    const errors = useMemo(() => {
        // return
        return [useRolePermissionList.error];
    }, [useRolePermissionList.error]);

    const searchCompProp: SearchBarProps = {
        title: "公告搜尋",
        subTitle: "搜尋公告 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    // return（DOM 結構不動）
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={isLoading}
            ErrorList={errors}
            Actions={actions}
            GridData={adjustedGrid}
            SearchBar={searchCompProp}
        />
    );
}

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: RolePermissionSet[], actions: UseActionsResult): GridProps => {
    // 宣告變數
    if (gridProps.columns.some(col => col.key === '__adjust__')) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: '__adjust__', title: '動作' };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index]
        const internalId = curData?.RoleData?.InternalId ?? "";
        const newCell: RowCell = { col: adjustCol, content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />) };
        return { ...row, cells: [...row.cells, newCell] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 用 Adapter 取得清單（含 ModelDisplayName + Count + 分頁） */
const useList = (adapter: ReturnType<typeof RolePermissionAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const condition = useMemo(() => {
        // 宣告變數
        let c: string = ``;
        if (!!query) c = LibMerge(" And ", false, c, `${RoleDataModelFields.RoleName} Like ${query}`);
        // return
        return c;
    }, [query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                RoleDataModelFields.InternalId,
                RoleDataModelFields.RoleName,
                RoleDataModelFields.ModifyUserId,
                `${RoleDataModelFields.ModifyUser}.${AccountFields.AccountName}`,
                RoleDataModelFields.CreateTime,
                RoleDataModelFields.ModifyTime,
                RoleDataModelFields.RoleName,
            ],
            Condition: condition,
            OrderBy: [
                { Col: RoleDataModelFields.CreateTime, Desc: true },
            ],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [condition]);

    const count = adapter.hooks.useQueryCount({
        condition: baseParam,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const paged = adapter.hooks.usePagedQueryList({
        baseParam,
        count: count.data ?? 0,
        deps: [baseParam.Condition ?? ""],
        onError,
    });

    const visibleKeys = useMemo<ReadonlyArray<readonly [string, string]>>(() => ([
        [RolePermissionSetFields.RoleData, RoleDataModelFields.RoleName],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.CreateTime],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyUserId],
        [RoleDataModelFields.ModifyUser, AccountFields.AccountName],
        [RolePermissionSetFields.RoleData, RoleDataModelFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => ParseRolePermissionRow(item, columns));
    }, [paged.data, columns]);

    const gridProps: GridProps = useMemo(() => {
        // return
        return {
            columns,
            rows,
            rawData: paged.data ?? [],
            CurrentPage: paged.pageNumber,
            TotalPage: paged.totalPages,
            onPageChange: (page: number) => paged.onPageChange(page),
        };
    }, [columns, rows, paged.data, paged.pageNumber, paged.totalPages, paged.onPageChange]);

    const refetchAll = useCallback(async () => {
        // 執行 function
        await model.refetch();
        await count.refetch();
        await paged.refetch();
    }, [model, count, paged]);

    const isLoading = Boolean(model.isLoading || count.isLoading || paged.isLoading);
    const error = model.errorText ?? count.errorText ?? paged.errorText ?? null;

    // return
    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchAll };
};

/** 後台 actions：直接用 Adapter CUD（不再用 useActions.ts） */
const useRolePermissionActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof RolePermissionAdapter>,
    afterChanged: () => Promise<void>,
): UseActionsResult => {
    // 宣告變數
    const navigate = useNavigate();
    const { publish } = useToast();

    const cud = adapter.hooks.useCudActions({
        onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }),
    });

    const onAddNew = useCallback(() => {
        // 執行 function
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((internalId: string) => {
        // 執行 function
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() => {
        // 執行 function：List 通常不會用到，但保持介面完整
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);

    const onDelete = useCallback(async (internalId: string) => {
        // 宣告變數
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;

        // 執行 function
        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach(m => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
        if (res.IsSuccess) await afterChanged();
    }, [cud, publish, afterChanged]);

    // return
    return useMemo(() => ({
        isExecuting: cud.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: () => { /* List row 失效目前不做 */ },
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () => { /* List 不用 */ },
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};

/** 從 ModelDisplaySchema + visibleKeys 產生 columns */
const BuildVisibleColumnsFromSchema = (
    schema: ModelDisplaySchema | null,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): ColumnConfig[] => {
    // 宣告變數
    if (!schema?.Tables?.length) return [];
    if (!visibleKeys || visibleKeys.length === 0) return [];

    // return
    return visibleKeys
        .map(([tableId, columnId]) => {
            const table = schema.Tables.find(t => t.TableId === tableId);
            const col = table?.Columns?.find(c => c.ColumnId === columnId);
            if (!col) return null;
            return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
        })
        .filter((x): x is ColumnConfig => !!x);
};

/** 解析 RolePermission row（避免 any） */
const ParseRolePermissionRow = (item: RolePermissionSet, columns: ColumnConfig[]): GridRow => {
    // 宣告變數
    const data = item.RoleData;

    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case RoleDataModelFields.CreateTime:
            case RoleDataModelFields.ModifyTime:
                content = FormatDateTime(data?.[col.key as typeof RoleDataModelFields.CreateTime] as unknown as string);
                break;

            case RoleDataModelFields.ModifyUserId:
                content = data?.ModifyUser?.AccountName ?? "";
                break;

            case RoleDataModelFields.RoleName:
                content = data?.RoleName ?? "";
                break;

            default:
                content = "";
                break;
        }

        return { col, content };
    });

    // return
    return { cells };
};
