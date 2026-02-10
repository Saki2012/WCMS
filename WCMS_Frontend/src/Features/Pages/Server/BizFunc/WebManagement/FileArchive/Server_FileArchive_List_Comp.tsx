import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { FileArchiveSetFields, FileArchiveFields, FileArchiveInfoFields, AccountFields, PGID } from "@/types/SchemaFields";
import { CategoryAdapter, formatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

// ⚠️ 這個 import 名稱請依你專案實際 export 調整（對標 AnnouncementAdapter）
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WebManagement/FileArchive/FileArchive_Api";

type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 檔案室清單 */
export const Server_FileArchiveListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");

    const searchCompProp: SearchBarProps = {
        title: "檔案室搜尋",
        subTitle: "搜尋檔案室 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => FileArchiveAdapter(), []);

    // ✅ 改：Category 改用 useMapByProgId（Tag 之後確認欄位再加）
    const category = useCategoryMapByProgId(PGID.FileArchive, prop.lang);

    const list = useFileArchiveListByAdapter(adapter, prop.lang, kw);
    const actions = useFileArchiveActionsFromAdapter(dirUrl, adapter, list.refetchAll);

    const adjustedGrid = useMemo(() => {
        // return
        return SetAdjustFunction(prop.lang, list.gridProps, list.rawData, category.rawData, actions);
    }, [prop.lang, list.gridProps, list.rawData, category.rawData, actions]);

    const isLoading = useMemo(() => {
        // return
        return [list.isLoading, category.isLoading];
    }, [list.isLoading, category.isLoading]);

    const errors = useMemo(() => {
        // return
        return [list.error, category.error];
    }, [list.error, category.error]);

    // return（⚠️ 不改 DOM 結構）
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

/** ✅ Category：用 useMapByProgId 取 rawData + map */
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

/** 用 Adapter 取得檔案室列表（含 Count + 分頁） */
const useFileArchiveListByAdapter = (adapter: ReturnType<typeof FileArchiveAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const baseCondition = useMemo(() => {
        // 宣告變數
        let condition: string = `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang} = ${lang}`;
        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${query}`,
            );
        }

        // return
        return condition;
    }, [lang, query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                FileArchiveFields.InternalId,
                FileArchiveFields.FileArchiveId,
                FileArchiveFields.CategoriesId,
                FileArchiveFields.ContentStatus,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
                `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
                FileArchiveFields.ModifyUserId,
                `${FileArchiveFields.ModifyUser}.${AccountFields.AccountName}`,
                FileArchiveFields.CreateTime,
                FileArchiveFields.ModifyTime,
            ],
            Condition: baseCondition,
            RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
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
        [FileArchiveSetFields.FileArchive, FileArchiveFields.CategoriesId],
        [FileArchiveSetFields.FileArchiveInfo, FileArchiveInfoFields.Title],
        [FileArchiveSetFields.FileArchive, FileArchiveFields.CreateTime],
        [FileArchiveSetFields.FileArchive, FileArchiveFields.ModifyUserId],
        [FileArchiveFields.ModifyUser, AccountFields.AccountName],
        [FileArchiveSetFields.FileArchive, FileArchiveFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => ParseFileArchiveRow(item, columns, lang));
    }, [paged.data, columns, lang]);

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

/** 後台 actions：對標 Server_Announcement_List_Comp.tsx（以 Adapter CUD 組出 UseActionsResult） */
const useFileArchiveActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof FileArchiveAdapter>,
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
const SetAdjustFunction = (
    lang: Lang,
    gridProps: GridProps,
    rawData: FileArchiveSet[],
    categoryData: CategoryDataSet[],
    actions: UseActionsResult,
): GridProps => {
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];

        const baseCells: RowCell[] = row.cells.map(cell => {
            if (cell.col.key === FileArchiveInfoFields.Title) {
                return { ...cell, content: (<>{cell.content}{GetContentStatus(curData?.FileArchive?.ContentStatus ?? 0)}</>) };
            }

            if (cell.col.key === FileArchiveFields.CategoriesId) {
                const rawCatId = curData?.FileArchive?.CategoriesId ?? cell.content?.toString() ?? "";
                return { ...cell, content: formatCategoriesName(rawCatId, categoryData, lang) };
            }

            return cell;
        });

        const internalId = curData?.FileArchive?.InternalId ?? "";
        const toolbarCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
        };

        return { ...row, cells: [...baseCells, toolbarCell] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

const GetContentStatus = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) statusItems.push(<div className="icon-small top-bg">置頂</div>);
    if (contentStatus & 2) statusItems.push(<div className="icon-small hot-bg">熱門</div>);
    if (contentStatus & 4) statusItems.push(<div className="icon-small hide-bg">隱藏</div>);
    return <div className="CustomState">{statusItems}</div>;
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

/** 解析 FileArchiveSet → GridRow */
const ParseFileArchiveRow = (item: FileArchiveSet, columns: ColumnConfig[], lang: Lang): GridRow => {
    // 宣告變數
    const data = item.FileArchive ?? {};
    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case FileArchiveInfoFields.Title:
                content = item.FileArchiveInfo?.find(d => d.Lang === lang)?.Title ?? "";
                break;
            case FileArchiveFields.CreateTime:
            case FileArchiveFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case FileArchiveFields.ModifyUserId:
                content = item.FileArchive?.ModifyUser?.AccountName ?? "";
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
