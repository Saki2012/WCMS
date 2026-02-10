import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { ToolbarActions } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/SpecModule/SpecJournal/SpecJournal_Api";
import { AccountFields, PGID, SpecJournalIndexDetailFields, SpecJournalModelFields, SpecJournalSetFields } from "@/types/SchemaFields";
import { CategoryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";

type SpecJournalSet = components["schemas"]["SpecJournalSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];



/** 後台期刊列表 */
export const Server_SpecJournal_List_Comp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
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

    const adapter = useMemo(() => SpecJournalAdapter(), []);

    // ⚠️ 保留原本行為：此頁仍會拉 Category（多用於共用 Toolbar/Filter 狀態），不改業務邏輯
    const useCategory = useCategoryMapByProgId(PGID.SpecMusical, prop.lang);

    const list = useSpecJournalListByAdapter(adapter, prop.lang, kw);
    const actions = useSpecJournalActionsFromAdapter(dirUrl, adapter, list.refetchAll);

    const toolbarActions = useMemo<ToolbarActions>(() => {
        // 宣告變數：ToolbarActions 的 onInvalid 需要 (internalId, reason) 參數；此頁不使用 reason，保留介面相容
        const cur = actions;

        // return
        return {
            ...cur,
            onInvalid: (internalId: string, reason?: unknown) => {
                // 執行 function：沿用既有 onInvalid 行為（忽略 reason）
                cur.onInvalid(internalId);
            },
        } as ToolbarActions;
    }, [actions]);

    const adjustedGrid = useMemo(() => {
        // return
        return SetAdjustFunction(list.gridProps, list.rawData, toolbarActions);
    }, [list.gridProps, list.rawData, toolbarActions]);

    const isLoading = useMemo(() => {
        // return
        return [list.isLoading, useCategory.isLoading];
    }, [list.isLoading, useCategory.isLoading]);

    const errors = useMemo(() => {
        // return
        return [list.error, useCategory.error];
    }, [list.error, useCategory.error]);

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
        ></ListComp>
    );
};

/** 動態添加每行的動作功能 */
const SetAdjustFunction = (gridProps: GridProps, rawData: SpecJournalSet[], actions: ToolbarActions): GridProps => {
    // 宣告：避免重複插入
    const hasAdjust = gridProps.columns.some(col => col.key === "__adjust__");
    const hasVolIssue = gridProps.columns.some(col => col.key === "__volIssue__");
    if (hasAdjust && hasVolIssue) return gridProps;

    // 宣告：無資料不處理
    if (gridProps.rows.length === 0) return gridProps;

    const titleColKey = gridProps.columns.find(c => c.title === '標題')?.key;


    // 宣告：新增欄位
    const volIssueCol: ColumnConfig = { key: "__volIssue__", title: "卷期" };
    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };

    // 執行：組欄位（卷期放第一欄、動作放最後）
    const newColumns: ColumnConfig[] = (() => {
        // 宣告變數
        const cols: ColumnConfig[] = [...gridProps.columns];
        if (!hasVolIssue) cols.unshift(volIssueCol);
        if (!hasAdjust) cols.push(adjustCol);

        // return
        return cols;
    })();

    // 執行：組每列 cell（卷期放第一格、動作放最後一格）
    const newRows: GridRow[] = gridProps.rows.map((row, idx) => {
        // 宣告變數
        const curData = rawData?.[idx];
        const internalId = curData?.SpecJournal?.InternalId ?? "";
        const cells: RowCell[] = [...row.cells];
        if (titleColKey) {
            const titleCellIdx = cells.findIndex(c => c.col.key === titleColKey);
            if (titleCellIdx >= 0) {
                cells[titleCellIdx] = {
                    ...cells[titleCellIdx],
                    content: (
                        <>
                            <p className="mb-0">{curData?.SpecJournal?.Title}</p>
                            <p className="mb-0">{curData?.SpecJournal?.Title_en}</p>
                        </>
                    ),
                };
            }
        }
        // 卷期：第一格（content 你之後自行補）
        if (!hasVolIssue) {
            const volDt = curData.SpecJournal?._JournalIndexDetail;
            const volume = `${volDt?.Volume}卷${volDt?.Issue}期`;
            const volIssueCell: RowCell = { col: volIssueCol, content: volume };
            cells.unshift(volIssueCell);
        }

        // 動作：最後一格
        if (!hasAdjust) {
            const adjustCell: RowCell = {
                col: adjustCol,
                content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
            };
            cells.push(adjustCell);
        }

        // return
        return { ...row, cells };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 用 Adapter 取得期刊列表（含 Count + 分頁） */
const useSpecJournalListByAdapter = (adapter: ReturnType<typeof SpecJournalAdapter>, lang: Lang, query: string) => {
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
            condition = LibMerge(" And ", false, condition, `${SpecJournalModelFields.Title} Like ${query}`);
        }

        // return
        return condition;
    }, [query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                SpecJournalModelFields.JournalId, SpecJournalModelFields.Title, SpecJournalModelFields.Title_en, SpecJournalModelFields.ModifyUserId,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
                `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
                `${SpecJournalModelFields.ModifyUser}.${AccountFields.AccountName}`,
                SpecJournalModelFields.CreateTime,
                SpecJournalModelFields.ModifyTime,
                SpecJournalModelFields.InternalId,
            ],
            Condition: baseCondition,
            OrderBy: [
                { Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`, Desc: true },
                { Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`, Desc: true },
            ],
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
        [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.Title],
        [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.CreateTime],
        [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ModifyUserId],
        [SpecJournalModelFields.ModifyUser, AccountFields.AccountName],
        [SpecJournalSetFields.SpecJournal, SpecJournalModelFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map(item => ParseSpecJournalRow(item, columns));
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

/** 後台 actions：直接用 Adapter CUD（不再用 provider/useActions） */
const useSpecJournalActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof SpecJournalAdapter>,
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

/** 解析 SpecJournalSet → GridRow */
const ParseSpecJournalRow = (item: SpecJournalSet, columns: ColumnConfig[]): GridRow => {
    // 宣告變數
    const data = item.SpecJournal ?? {};
    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case SpecJournalModelFields.CreateTime:
            case SpecJournalModelFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case SpecJournalModelFields.ModifyUserId:
                content = item.SpecJournal?.ModifyUser?.AccountName ?? "";
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

/** ✅ Category：用 useMapByProgId 取 map + rawData */
const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const categoryAdapter = useMemo(() => CategoryAdapter(), []);

    // 執行 function
    const query = categoryAdapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    const error = useMemo(() => {
        // return
        return query.errorText ?? null;
    }, [query.errorText]);

    const isLoading = Boolean(query.isLoading);

    // return
    return { rawData: (query.data ?? []) as CategoryDataSet[], map: query.map, isLoading, error };
};