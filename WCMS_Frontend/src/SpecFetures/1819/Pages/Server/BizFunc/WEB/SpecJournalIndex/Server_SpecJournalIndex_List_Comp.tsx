import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { type SpecJournalIndexListAdapter, useSpecJournalIndexListFetchData } from "./Server_SpecJournalIndex_List_Hook";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

/** 期刊索引列表 */
export const Server_SpecJournalIndex_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang; }) =>
{
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = { title: "搜尋", subTitle: "搜尋 ...", onSubmit: setKw, onReset: () => setKw("") };
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);
    const fetchData = useSpecJournalIndexListFetchData({ lang: prop.lang, kw });
    const actions = useSpecJournalIndexListActions(dirUrl, fetchData.adapter, fetchData.refetchData);
    const visibleKeys = useMemo<ReadonlyArray<readonly [string, string]>>(
        () => ([
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.CreateTime],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyUserId],
            [SpecJournalIndexModelFields.ModifyUser, AccountFields.AccountName],
            [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyTime],
        ] as const),
        [],
    );
    const columns = useMemo<ColumnConfig[]>(() =>
    {
        return BuildVisibleColumnsFromSchema(fetchData.rawData.modelDisplayName, visibleKeys);
    }, [fetchData.rawData.modelDisplayName, visibleKeys]);
    const rows = useMemo<GridRow[]>(() =>
    {
        return (fetchData.rawData.list ?? []).map((item) => ParseSpecJournalIndexRow(item, columns));
    }, [fetchData.rawData.list, columns]);
    const baseGrid = useMemo<GridProps>(() =>
    {
        return {
            columns,
            rows,
            rawData: fetchData.rawData.list ?? [],
            CurrentPage: fetchData.rawData.pageNumber,
            TotalPage: fetchData.rawData.totalPages,
            onPageChange: fetchData.rawData.onPageChange,
        };
    }, [columns, rows, fetchData.rawData.list, fetchData.rawData.pageNumber, fetchData.rawData.totalPages, fetchData.rawData.onPageChange]);
    const adjustedGrid = useMemo<GridProps>(() =>
    {
        return SetAdjustFunction(baseGrid, fetchData.rawData.list, actions);
    }, [baseGrid, fetchData.rawData.list, actions]);
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            isLoading={fetchData.isLoading}
            ErrorList={fetchData.errors}
            Actions={actions}
            GridData={adjustedGrid}
            SearchBar={searchCompProp}
        />
    );
};

// #region private Hook
/** 列表 actions */
const useSpecJournalIndexListActions = (dirUrl: string, adapter: SpecJournalIndexListAdapter, afterChanged: () => Promise<void>): UseActionsResult =>
{
    const navigate = useNavigate();
    const { publish } = useToast();
    const cud = adapter.SpecJournalIndex.hooks.useCudActions({ onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }) });
    const onAddNew = useCallback(() =>
    {
        navigate(dirUrl);
    }, [navigate, dirUrl]);
    const onEdit = useCallback((internalId: string) =>
    {
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);
    const onCancelBack = useCallback(() =>
    {
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);
    const onDelete = useCallback(async (internalId: string) =>
    {
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;
        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach((m) => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
        if (res.IsSuccess) await afterChanged();
    }, [cud, publish, afterChanged]);
    // return
    return useMemo(() => ({
        isExecuting: cud.isSaving,
        onSave: async () => false,
        onDelete,
        onInvalid: () =>
        {/* List 目前不做失效 */},
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () =>
        {/* List 不用 */},
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
};
// #endregion

// #region private Func
/** 動態添加每行動作欄與卷期欄 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecJournalIndexSet[], actions: UseActionsResult): GridProps =>
{
    // 宣告變數
    const hasAdjust = gridProps.columns.some((col) => col.key === "__adjust__");
    const hasVolIssue = gridProps.columns.some((col) => col.key === "__volIssue__");
    if (hasAdjust && hasVolIssue) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const volIssueCol: ColumnConfig = { key: "__volIssue__", title: "卷期" };
    const newColumns: ColumnConfig[] = (() =>
    {
        const cols = [...gridProps.columns];
        if (!hasVolIssue)
        {
            const idx = cols.findIndex((c) => c.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cols.length;
            cols.splice(insertAt, 0, volIssueCol);
        }
        if (!hasAdjust) cols.push(adjustCol);
        return cols;
    })();

    const newRows: GridRow[] = gridProps.rows.map((row, index) =>
    {
        const curData = rawData?.[index];
        const internalId = curData?.SpecJournalIndex?.InternalId ?? "";
        const cells = [...row.cells];
        if (!hasVolIssue)
        {
            const idx = cells.findIndex((c) => c.col.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cells.length;
            const volumeContent = (
                <ul>{(curData?.SpecJournalIndexDetail ?? []).map((dt, i) => <li key={`${dt.IndexId ?? ""}-${i}`}>{`${dt.Volume}卷${dt.Issue}期`}</li>)}</ul>
            );
            const volIssueCell: RowCell = { col: volIssueCol, content: volumeContent };
            cells.splice(insertAt, 0, volIssueCell);
        }
        if (!hasAdjust)
        {
            const adjustCell: RowCell = { col: adjustCol, content: <GridCol_Toolbar key={internalId} action={actions} internalId={internalId} /> };
            cells.push(adjustCell);
        }
        return { ...row, cells };
    });
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 依 ModelDisplaySchema 建立顯示欄位 */
const BuildVisibleColumnsFromSchema = (schema: ModelDisplaySchema | null, visibleKeys: ReadonlyArray<readonly [string, string]>): ColumnConfig[] =>
{
    if (!schema?.Tables?.length) return [];
    return visibleKeys.map(([tableId, columnId]) =>
    {
        const table = schema.Tables.find((t) => t.TableId === tableId);
        const col = table?.Columns?.find((c) => c.ColumnId === columnId);
        if (!col) return null;
        return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
    }).filter((x): x is ColumnConfig => Boolean(x));
};

/** 解析單筆資料為 GridRow */
const ParseSpecJournalIndexRow = (item: SpecJournalIndexSet, columns: ColumnConfig[]): GridRow =>
{
    const data = item.SpecJournalIndex ?? {};
    const cells: RowCell[] = columns.map((col) =>
    {
        let content = "";
        switch (col.key)
        {
            case SpecJournalIndexModelFields.CreateTime:
            case SpecJournalIndexModelFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case SpecJournalIndexModelFields.ModifyUserId:
                content = item.SpecJournalIndex?.ModifyUser?.AccountName ?? "";
                break;
            default:
                content = String((data as Record<string, unknown>)[col.key] ?? "");
                break;
        }
        return { col, content };
    });
    return { keyId: item.SpecJournalIndex?.InternalId ?? "", cells };
};
// #endregion
