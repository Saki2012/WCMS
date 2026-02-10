import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import {
    AccountFields,
    SpecJournalIndexDetailFields,
    SpecJournalIndexModelFields,
    SpecJournalIndexSetFields,
} from "@/types/SchemaFields";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournalIndex_Api";

type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 期刊索引列表（對標 Server_Announcement_List_Comp.tsx：改用 Adapter + hooks） */
export const Server_SpecJournalIndex_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");

    const searchCompProp: SearchBarProps = {
        title: "搜尋",
        subTitle: "搜尋 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => SpecJournalIndexAdapter(), []);

    const list = useSpecJournalIndexListByAdapter(adapter, prop.lang, kw);
    const actions = useSpecJournalIndexActionsFromAdapter(dirUrl, adapter, list.refetchAll);

    const adjustedGrid = useMemo(() => {
        // return
        return SetAdjustFunction(list.gridProps, list.rawData, actions);
    }, [list.gridProps, list.rawData, actions]);

    const isLoading = useMemo(() => {
        // return
        return [list.isLoading];
    }, [list.isLoading]);

    const errors = useMemo(() => {
        // return
        return [list.error];
    }, [list.error]);

    // return
    return (
        <ListComp
            Title={prop.title}
            Theme={prop.theme}
            LoadingList={isLoading}
            ErrorList={errors}
            Actions={actions}
            GridData={adjustedGrid}
            SearchBar={searchCompProp}
        />
    );
};

//#region private Func

/** 用 Adapter 取得 SpecJournalIndex 列表（含 Count + 分頁） */
const useSpecJournalIndexListByAdapter = (adapter: ReturnType<typeof SpecJournalIndexAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();
    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);
    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });
    const baseCondition = useMemo(() => {
        // 宣告變數
        let condition: string = ``;
        if (!!query) {
            condition = LibMerge(" And ", false, condition, `${SpecJournalIndexModelFields.IndexName} Like ${query}`);
        }
        // return
        return condition;
    }, [query]);
    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                SpecJournalIndexModelFields.IndexId,
                SpecJournalIndexModelFields.IndexName,
                SpecJournalIndexModelFields.ModifyUserId,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalIndexModelFields.ModifyUser}.${AccountFields.AccountName}`,
                SpecJournalIndexModelFields.CreateTime,
                SpecJournalIndexModelFields.ModifyTime,
                SpecJournalIndexModelFields.InternalId,
            ],
            Condition: baseCondition,
            OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [baseCondition]);

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
        [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName],
        [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.CreateTime],
        [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyUserId],
        [SpecJournalIndexModelFields.ModifyUser, AccountFields.AccountName],
        [SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => ParseSpecJournalIndexRow(item, columns));
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
        // 執行 function：刪除/新增後 count 會變，先抓 count 再抓 list
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(model.isLoading || count.isLoading || paged.isLoading);
    const error = model.errorText ?? count.errorText ?? paged.errorText ?? null;

    // return
    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchAll };
};

/** 後台 actions：直接用 Adapter CUD（不再用 useActions.ts） */
const useSpecJournalIndexActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof SpecJournalIndexAdapter>,
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

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecJournalIndexSet[], actions: UseActionsResult): GridProps => {
    const hasAdjust = gridProps.columns.some(col => col.key === "__adjust__");
    const hasVolIssue = gridProps.columns.some(col => col.key === "__volIssue__");
    if (hasAdjust && hasVolIssue) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const volIssueCol: ColumnConfig = { key: "__volIssue__", title: "卷期" };

    const newColumns: ColumnConfig[] = (() => {
        const cols = [...gridProps.columns];
        if (!hasVolIssue) {
            const idx = cols.findIndex(c => c.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cols.length;
            cols.splice(insertAt, 0, volIssueCol);
        }
        if (!hasAdjust) cols.push(adjustCol);
        return cols;
    })();

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const internalId = curData?.SpecJournalIndex?.InternalId ?? "";
        const cells = [...row.cells];

        if (!hasVolIssue) {
            const idx = cells.findIndex(c => c.col.key === SpecJournalIndexModelFields.IndexName);
            const insertAt = idx >= 0 ? idx + 1 : cells.length;

            const volume = (
                <ul>
                    {(curData?.SpecJournalIndexDetail ?? []).map((dt, i) => (
                        <li key={`${dt.IndexId ?? ""}-${i}`}>
                            {`${dt.Volume}卷${dt.Issue}期`}
                        </li>
                    ))}
                </ul>
            );

            const volIssueCell: RowCell = {
                col: volIssueCol,
                content: volume,
            };

            cells.splice(insertAt, 0, volIssueCell);
        }

        if (!hasAdjust) {
            const adjustCell: RowCell = {
                col: adjustCol,
                content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
            };
            cells.push(adjustCell);
        }

        return { ...row, cells };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 由 ModelDisplaySchema + visibleKeys 建欄位（不依賴 provider） */
const BuildVisibleColumnsFromSchema = (
    schema: ModelDisplaySchema | null,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): ColumnConfig[] => {
    // 宣告變數
    if (!schema?.Tables?.length) return [];

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

/** 解析 SpecJournalIndexSet → GridRow */
const ParseSpecJournalIndexRow = (item: SpecJournalIndexSet, columns: ColumnConfig[]): GridRow => {
    // 宣告變數
    const data = item.SpecJournalIndex ?? {};
    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
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

    // return
    return { cells };
};

//#endregion
