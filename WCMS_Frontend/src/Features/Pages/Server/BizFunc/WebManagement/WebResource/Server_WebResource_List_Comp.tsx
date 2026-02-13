import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import { WebResourceSetFields, WebResourceFields, WebResourceInfoFields, AccountFields, PGID } from "@/types/SchemaFields";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";

import { CategoryAdapter, formatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { WebResourceAdapter } from "@/Features/Hooks/BizFunc/WebManagement/WebResource/WebResource_Api";

type WebResourceSet = components["schemas"]["WebResourceSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 網路資源清單 */
export const WebResourceListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    const [kw, setKw] = useState<string>("");
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => WebResourceAdapter(), []);
    const list = useWebResourceListByAdapter(adapter, prop.lang, kw);

    const category = useCategoryMapByProgId(PGID.WebResource, prop.lang);

    const actions = useWebResourceActionsFromAdapter(dirUrl, adapter, list.refetchAll);

    const adjustedGrid = useMemo(() => {
        return SetAdjustFunction(prop.lang, list.gridProps, list.rawData, category.rawData, actions);
    }, [prop.lang, list.gridProps, list.rawData, category.rawData, actions]);

    const searchCompProp: SearchBarProps = {
        title: "網路資源搜尋",
        subTitle: "搜尋網路資源 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const isLoading = [list.isLoading, category.isLoading];
    const errors = [list.error, category.error];

    // return（不動 DOM）
    return (<ListComp Title={prop.title} Theme={prop.theme} isLoading={isLoading} ErrorList={errors} Actions={actions} GridData={adjustedGrid} SearchBar={searchCompProp}></ListComp>);
};

/** 動態添加每行的動作功能（保留原結構，只改 category format function） */
const SetAdjustFunction = (lang: Lang, gridProps: GridProps, rawData: WebResourceSet[], categoryData: CategoryDataSet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const titleCell = row.cells.find(cell => cell.col.key === WebResourceInfoFields.Title);
        if (titleCell) {
            const titleText = curData.WebResourceInfo?.find(p => p.Lang === lang)?.Title
            titleCell.content = (<>{titleText}{GetDataStatusContent(curData?.WebResource?.ContentStatus ?? 0)}</>);
        }
        const categoryCell = row.cells.find(p => p.col.key === WebResourceFields.Categories);
        const rawCatId = rawData?.[index]?.WebResource?.Categories ?? categoryCell?.content?.toString() ?? "";
        if (categoryCell) { categoryCell.content = formatCategoriesName(rawCatId, categoryData, lang); }

        const internalId = rawData?.[index]?.WebResource?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
        };

        return { ...row, cells: [...row.cells, newCell] };
    });

    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
    const statusItems: React.ReactNode[] = [];
    if (contentStatus & 1) { statusItems.push(<div className="icon-small top-bg">置頂</div>); }
    if (contentStatus & 2) { statusItems.push(<div className="icon-small hot-bg">熱門</div>); }
    if (contentStatus & 4) { statusItems.push(<div className="icon-small hide-bg">隱藏</div>); }
    return <div className="CustomState">{statusItems}</div>;
};

/** Category：改走 useMapByProgId（opts=query.map / raw=query.data） */
const useCategoryMapByProgId = (progId: string, lang: Lang) => {
    const adapter = useMemo(() => CategoryAdapter(), []);
    const query = adapter.hooks.useMapByProgId({
        progId,
        lang,
        pageSize: 0,
        deps: [progId, lang],
    });

    return {
        opts: (query.map ?? {}) as Record<string, string>,
        rawData: (query.data ?? []) as CategoryDataSet[],
        isLoading: Boolean(query.isLoading),
        error: query.errorText ?? null,
    };
};

/** List：改用 Adapter hooks（對標你前面 PageManagement_List） */
const useWebResourceListByAdapter = (adapter: ReturnType<typeof WebResourceAdapter>, lang: Lang, query: string) => {
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const baseCondition = useMemo(() => {
        let condition = `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang} = ${lang}`;
        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title} Like ${query}`,
            );
        }
        return condition;
    }, [lang, query]);

    const baseParam = useMemo<QueryListParam>(() => {
        return {
            Fields: [
                WebResourceFields.InternalId,
                WebResourceFields.WebResourceId,
                WebResourceFields.Categories,
                WebResourceFields.ContentStatus,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Lang}`,
                `${WebResourceFields._WebResourceInfo}.${WebResourceInfoFields.Title}`,
                WebResourceFields.ModifyUserId,
                `${WebResourceFields.ModifyUser}.${AccountFields.AccountName}`,
                WebResourceFields.CreateTime,
                WebResourceFields.ModifyTime,
                WebResourceFields.InternalId,
            ],
            Condition: baseCondition,
            RankGroups: [{ Condition: `${WebResourceFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: WebResourceFields.CreateTime, Desc: true }],
            PageNumber: 1,
            PageSize: 10,
        };
    }, [baseCondition]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

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
        [WebResourceSetFields.WebResource, WebResourceFields.Categories],
        [WebResourceSetFields.WebResourceInfo, WebResourceInfoFields.Title],
        [WebResourceSetFields.WebResource, WebResourceFields.CreateTime],
        [WebResourceSetFields.WebResource, WebResourceFields.ModifyUserId],
        [WebResourceSetFields.WebResource, WebResourceFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        return (paged.data ?? []).map((item) => ParseWebResourceRow(item, columns, lang));
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
        await count.refetch();
        await paged.refetch();
    }, [count, paged]);

    const isLoading = Boolean(model.isLoading || count.isLoading || paged.isLoading);
    const error = model.errorText ?? count.errorText ?? paged.errorText ?? null;

    return { rawData: paged.data ?? [], gridProps, isLoading, error, refetchAll };
};

/** Actions：改用 adapter.hooks.useCudActions 組成 UseActionsResult（不動 ListComp/Toolbar 使用方式） */
const useWebResourceActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof WebResourceAdapter>,
    afterChanged: () => Promise<void>,
): UseActionsResult => {
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
        onInvalid: () => { /* WebResource List 目前不做 invalid */ },
        onCancelBack,
        onAddNew,
        onEdit,
        onPreview: () => { /* List 不用 */ },
    }), [cud.isSaving, onDelete, onCancelBack, onAddNew, onEdit]);
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

/** 解析 WebResourceSet → GridRow（改吃 lang，不用 any/unknown） */
const ParseWebResourceRow = (item: WebResourceSet, columns: ColumnConfig[], lang: Lang): GridRow => {
    const data = item.WebResource ?? {};
    const dt = item.WebResourceInfo?.find(d => d.Lang === lang);

    const dataMap = data as Record<string, string | number | null | undefined>;

    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case WebResourceInfoFields.Title:
                content = dt?.Title ?? "";
                break;
            case WebResourceFields.CreateTime:
            case WebResourceFields.ModifyTime:
                content = FormatDateTime(String(dataMap[col.key] ?? ""));
                break;
            case WebResourceFields.ModifyUserId:
                content = item.WebResource?.ModifyUser?.AccountName ?? "";
                break;
            default:
                content = String(dataMap[col.key] ?? "");
                break;
        }

        return { col, content };
    });

    return { cells };
};
