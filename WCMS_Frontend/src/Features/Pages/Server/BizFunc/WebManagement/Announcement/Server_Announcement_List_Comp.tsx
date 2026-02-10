import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { components } from "@/types/api";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import { AnnouncementAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Announcement/Announcement_Api";
import type { Lang } from "@/SysCore/i18n/lang";
import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { AnnouncementDetailFields, AnnouncementFields, AnnouncementSetFields, AccountFields, PGID } from "@/types/SchemaFields";
import { CategoryAdapter, formatCategoriesName } from "@/Features/Hooks/BizFunc/WebManagement/Category/Category_Api";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
type AnnouncementSet = components["schemas"]["AnnouncementSet_DTO"];
type CategoryDataSet = components["schemas"]["CategoryDataSet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 公告列表 */
export const Server_AnnouncementListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");
    const searchCompProp: SearchBarProps = {
        title: "公告搜尋",
        subTitle: "搜尋公告 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => AnnouncementAdapter(), []);

    // ✅ 改：Category 改用 useMapByProgId（取 data + map）
    const category = useCategoryMapByProgId(PGID.Announcement, prop.lang);

    const list = useAnnouncementListByAdapter(adapter, prop.lang, kw);
    const actions = useAnnouncementActionsFromAdapter(dirUrl, adapter, list.refetchAll);

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

/** 用 Adapter 取得公告列表（含 Count + 分頁） */
const useAnnouncementListByAdapter = (adapter: ReturnType<typeof AnnouncementAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const baseCondition = useMemo(() => {
        // 宣告變數
        let condition: string = `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang} = ${lang}`;
        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title} Like ${query}`,
            );
        }

        // return
        return condition;
    }, [lang, query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                AnnouncementFields.AnnouncementId,
                AnnouncementFields.Categories,
                AnnouncementFields.ContentStatus,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Lang}`,
                `${AnnouncementFields._AnnouncementDetail}.${AnnouncementDetailFields.Title}`,
                AnnouncementFields.Validate_Start,
                AnnouncementFields.ModifyUserId,
                `${AnnouncementFields.ModifyUser}.${AccountFields.AccountName}`,
                AnnouncementFields.CreateTime,
                AnnouncementFields.ModifyTime,
                AnnouncementFields.InternalId,
            ],
            Condition: baseCondition,
            RankGroups: [{ Condition: `${AnnouncementFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: AnnouncementFields.CreateTime, Desc: true }],
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
        [AnnouncementSetFields.Announcement, AnnouncementFields.Categories],
        [AnnouncementSetFields.AnnouncementDetail, AnnouncementDetailFields.Title],
        [AnnouncementSetFields.Announcement, AnnouncementFields.Validate_Start],
        [AnnouncementSetFields.Announcement, AnnouncementFields.CreateTime],
        [AnnouncementSetFields.Announcement, AnnouncementFields.ModifyUserId],
        [AnnouncementFields.ModifyUser, AccountFields.AccountName],
        [AnnouncementSetFields.Announcement, AnnouncementFields.ModifyTime],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => ParseAnnouncementRow(item, columns, lang));
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

/** 後台 actions：直接用 Adapter CUD（不再用 useActions.ts） */
const useAnnouncementActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof AnnouncementAdapter>,
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
    rawData: AnnouncementSet[],
    categoryData: CategoryDataSet[],
    actions: UseActionsResult,
): GridProps => {
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;

    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];

    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const curData = rawData?.[index];
        const titleCell = row.cells.find(cell => cell.col.key === AnnouncementDetailFields.Title);

        if (titleCell) {
            const titleText = curData.AnnouncementDetail?.find(p => p.Lang === lang)?.Title
            titleCell.content = (<>{titleText}{GetDataStatusContent(curData?.Announcement?.ContentStatus ?? 0)}</>);
        }

        const categoryCell = row.cells.find(p => p.col.key === AnnouncementFields.Categories);
        const rawCatId = curData?.Announcement?.Categories ?? categoryCell?.content?.toString() ?? "";

        if (categoryCell) {
            // ✅ 改：優先用 map 轉（更快），必要時仍可 fallback 用 data
            categoryCell.content = formatCategoriesName(rawCatId, categoryData, lang);
        }

        const internalId = curData?.Announcement?.InternalId ?? "";
        const newCell: RowCell = {
            col: adjustCol,
            content: (<GridCol_Toolbar key={internalId} action={actions} internalId={internalId} />),
        };

        return { ...row, cells: [...row.cells, newCell] };
    });

    // return
    return { ...gridProps, columns: newColumns, rows: newRows };
};

/** 目前說只有公告/檔案室/網路資源/相簿會用到 */
const GetDataStatusContent = (contentStatus: number): React.ReactNode => {
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

/** 解析 AnnouncementSet → GridRow */
const ParseAnnouncementRow = (item: AnnouncementSet, columns: ColumnConfig[], lang: Lang): GridRow => {
    // 宣告變數
    const data = item.Announcement ?? {};
    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case AnnouncementDetailFields.Title:
                content = item.AnnouncementDetail?.find(d => d.Lang === lang)?.Title ?? "";
                break;
            case AnnouncementFields.Validate_Start:
                content = FormatDate(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case AnnouncementFields.CreateTime:
            case AnnouncementFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case AnnouncementFields.ModifyUserId:
                content = item.Announcement?.ModifyUser?.AccountName ?? "";
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
