import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import { PageManagementSetFields, PageManagementFields, PageManagementDetailFields, AccountFields, PGID } from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

import { CategoryAdapter, formatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
// ⚠️ 若你的實際 export 名稱不同，請把這行改成對應的 Adapter export
import { PageManagementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Pagemanagement/PageManagement_Api";

type PageManagementSet = components["schemas"]["PageManagementSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 頁面清單 */
export const PageListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => PageManagementAdapter(), []);

    const category = useCategoryMapByProgId(PGID.PageManagement, prop.lang);
    const list = usePageManagementListByAdapter(adapter, prop.lang, kw);

    const actions = usePageManagementActionsFromAdapter(dirUrl, adapter, list.refetchAll);

    const adjustedGrid = useMemo(() => {
        return SetAdjustFunction(prop.lang, list.gridProps, list.rawData, category.rawData, actions);
    }, [prop.lang, list.gridProps, list.rawData, category.rawData, actions]);

    const searchCompProp: SearchBarProps = {
        title: "頁面搜尋",
        subTitle: "搜尋頁面 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const isLoading = [list.isLoading, category.isLoading];
    const errors = [list.error, category.error];

    return (<ListComp Title={prop.title} Theme={prop.theme} LoadingList={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
};

/** Category：useMapByProgId（opts=map / raw=list） */
const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    // 宣告變數
    const adapter = useMemo(() => CategoryAdapter(), []);
    const query = adapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    const error = useMemo(() => {
        return query.errorText ?? null;
    }, [query.errorText]);

    // return
    return {
        opts: (query.map ?? {}) as Record<string, string>,
        rawData: (query.data ?? []) as CategoryDataSet[],
        isLoading: Boolean(query.isLoading),
        error,
    };
};

/** List：用 Adapter 做 model + count + paged query */
const usePageManagementListByAdapter = (adapter: ReturnType<typeof PageManagementAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const baseCondition = useMemo(() => {
        let condition = `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang} = ${lang}`;
        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title} Like ${query}`,
            );
        }
        return condition;
    }, [lang, query]);

    const baseParam = useMemo<QueryListParam>(() => {
        return {
            Fields: [
                PageManagementFields.PageId,
                PageManagementFields.CategoryId,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Lang}`,
                `${PageManagementFields._PageManagementDetail}.${PageManagementDetailFields.Title}`,
                PageManagementFields.ModifyUserId,
                `${PageManagementFields.ModifyUser}.${AccountFields.AccountName}`,
                PageManagementFields.CreateTime,
                PageManagementFields.ModifyTime,
                PageManagementFields.InternalId,
            ],
            Condition: baseCondition,
            OrderBy: [{ Col: PageManagementFields.CreateTime, Desc: true }],
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
        [PageManagementSetFields.PageManagement, PageManagementFields.CategoryId],
        [PageManagementSetFields.PageManagementDetail, PageManagementDetailFields.Title],
        [PageManagementSetFields.PageManagement, PageManagementFields.CreateTime],
        [PageManagementSetFields.PageManagement, PageManagementFields.ModifyUserId],
        [PageManagementSetFields.PageManagement, PageManagementFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        return (paged.data ?? []).map((item) => ParsePageManagementRow(item, columns, lang));
    }, [paged.data, columns, lang]);

    const gridProps: GridProps = useMemo(() => {
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
        // 執行 function：資料變更後，count 可能變，先抓 count 再抓 list
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(model.isLoading || count.isLoading || paged.isLoading);
    const error = model.errorText ?? count.errorText ?? paged.errorText ?? null;

    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchAll };
};

/** Actions：用 Adapter CUD 組出 UseActionsResult（對標其他 List） */
const usePageManagementActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof PageManagementAdapter>,
    afterChanged: () => Promise<void>,
): UseActionsResult => {
    // 宣告變數
    const navigate = useNavigate();
    const { publish } = useToast();

    const cud = adapter.hooks.useCudActions({
        onError: (e) => publish({ level: MessageStatus.Error, title: e.messageText }),
    });

    const onAddNew = useCallback(() => {
        navigate(dirUrl);
    }, [navigate, dirUrl]);

    const onEdit = useCallback((internalId: string) => {
        navigate(`${dirUrl}/${internalId}`);
    }, [navigate, dirUrl]);

    const onCancelBack = useCallback(() => {
        navigate(dirUrl.replace(/\/Form$/, "/List"));
    }, [navigate, dirUrl]);

    const onDelete = useCallback(async (internalId: string) => {
        const ok = window.confirm("確定要刪除嗎？");
        if (!ok) return;

        const res = await cud.deleteAsync(internalId);
        (res.SysMessage ?? []).forEach((m) => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
        if (res.IsSuccess) await afterChanged();
    }, [cud, publish, afterChanged]);

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
    rawData: PageManagementSet[],
    categoryData: CategoryDataSet[],
    actions: UseActionsResult
): GridProps => {
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const statusCell = row.cells.find(cell => cell.col.key === "DataStatus");
        if (statusCell && typeof statusCell.content === "number") {
            statusCell.content = GetDataStatusContent(statusCell.content);
        }

        const categoryCell = row.cells.find(p => p.col.key === PageManagementFields.CategoryId);
        const rawCatId = rawData?.[index]?.PageManagement?.CategoryId ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) {
            categoryCell.content = formatCategoriesName(rawCatId, categoryData, lang);
        }

        const internalId = rawData?.[index]?.PageManagement?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
        };

        return { ...row, cells: [...row.cells, newCell] };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (datastatus: number): React.ReactNode => {
    switch (datastatus) {
        case 0:
            return <div className="CustomState"><div className="icon-small top-bg">置頂</div></div>;
        case 1:
            return <div className="CustomState"><div className="icon-small hot-bg">熱門</div></div>;
        case 2:
            return <div className="CustomState"><div className="icon-small new-bg">最新</div></div>;
        case 3:
            return <div className="CustomState"><div className="icon-small hide-bg">隱藏</div></div>;
        default:
            return <span>未知狀態</span>;
    }
};

/** 由 ModelDisplaySchema + visibleKeys 建欄位 */
const BuildVisibleColumnsFromSchema = (
    schema: ModelDisplaySchema | null,
    visibleKeys: ReadonlyArray<readonly [string, string]>,
): ColumnConfig[] => {
    if (!schema?.Tables?.length) return [];

    return visibleKeys
        .map(([tableId, columnId]) => {
            const table = schema.Tables.find(t => t.TableId === tableId);
            const col = table?.Columns?.find(c => c.ColumnId === columnId);
            if (!col) return null;
            return { key: col.ColumnId, title: col.ColumnDisplayName } as ColumnConfig;
        })
        .filter((x): x is ColumnConfig => !!x);
};

/** 解析 PageManagementSet → GridRow（不再硬寫 zh-tw，移除 any） */
const ParsePageManagementRow = (item: PageManagementSet, columns: ColumnConfig[], lang: Lang): GridRow => {
    const data = item.PageManagement ?? {};
    const dt = item.PageManagementDetail?.find(d => d.Lang === lang);

    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case PageManagementDetailFields.Title:
                content = dt?.Title ?? "";
                break;
            case PageManagementFields.CreateTime:
            case PageManagementFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case PageManagementFields.ModifyUserId:
                content = item.PageManagement?.ModifyUser?.AccountName ?? "";
                break;
            default:
                content = String((data as Record<string, unknown>)[col.key] ?? "");
                break;
        }

        return { col, content };
    });

    return { cells };
};
