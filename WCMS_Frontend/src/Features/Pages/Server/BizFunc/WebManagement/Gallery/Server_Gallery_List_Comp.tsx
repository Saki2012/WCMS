import type { SearchBarProps } from "@/SysCore/Components/SearchBar/Searchbar_ForServer_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import type { GridProps, ColumnConfig, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import { useCallback, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GallerySetFields, GalleryFields, GalleryInfoFields, AccountFields } from "@/types/SchemaFields";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { ListComp } from "@/Features/Pages/Server/Scaffold/Content/List_Comp";
import type { UseActionsResult } from "@/Features/Hooks/Common/useActions";
import { GridCol_Toolbar } from "@/Features/Pages/Server/Scaffold/Toolbar/Toolbar_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";

// ⚠️ 請依你專案實際 export 命名調整：這裡假設 Gallery_Api.ts 有 export GalleryAdapter
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Gallery/Gallery_Api";

type GallerySet = components["schemas"]["GallerySet_DTO"];
type QueryListParam = components["schemas"]["QueryListParam"];

/** 相簿清單 */
export const Server_GalleryListComp = (prop: { title: string; theme: IBETheme; lang: Lang }) => {
    // 宣告變數
    const [kw, setKw] = useState<string>("");

    const searchCompProp: SearchBarProps = {
        title: "相簿搜尋",
        subTitle: "搜尋相簿 ...",
        settingTitle: "搜尋設定",
        onSubmit: setKw,
        onReset: () => setKw(""),
    };

    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, `/Form`), [pathname]);

    const adapter = useMemo(() => GalleryAdapter(), []);

    const list = useGalleryListByAdapter(adapter, prop.lang, kw);
    const actions = useGalleryActionsFromAdapter(dirUrl, adapter, list.refetchAll);

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

    // return（不改 DOM 結構）
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

/** 用 Adapter 取得相簿列表（含 Count + 分頁） */
const useGalleryListByAdapter = (adapter: ReturnType<typeof GalleryAdapter>, lang: Lang, query: string) => {
    // 宣告變數
    const { publish } = useToast();

    const onError = useCallback((e: ApiAdapterError) => {
        // 執行 function
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const model = adapter.hooks.useModelDisplayName({ deps: [lang], onError });

    const baseCondition = useMemo(() => {
        // 宣告變數
        let condition: string = `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${lang}`;
        if (!!query) {
            condition = LibMerge(
                " And ",
                false,
                condition,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} Like ${query}`,
            );
        }

        // return
        return condition;
    }, [lang, query]);

    const baseParam = useMemo<QueryListParam>(() => {
        // return
        return {
            Fields: [
                GalleryFields.InternalId,
                GalleryFields.GalleryId,
                GalleryFields.CoverPicSrcId,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
                `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
                GalleryFields.ContentStatus,
                GalleryFields.Validate_Start,
                GalleryFields.CreateTime,
                GalleryFields.ModifyTime,
                GalleryFields.ModifyUserId,
                `${GalleryFields.ModifyUser}.${AccountFields.AccountName}`,
            ],
            Condition: baseCondition,
            RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
            OrderBy: [{ Col: GalleryFields.CreateTime, Desc: true }],
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
        [GallerySetFields.Gallery, GalleryFields.CoverPicSrcId],
        [GallerySetFields.GalleryInfo, GalleryInfoFields.Title],
        [GallerySetFields.Gallery, GalleryFields.Validate_Start],
        [GallerySetFields.Gallery, GalleryFields.CreateTime],
        [GallerySetFields.Gallery, GalleryFields.ModifyTime],
        [GallerySetFields.Gallery, GalleryFields.ModifyUserId],
        [GalleryFields.ModifyUser, AccountFields.AccountName],
    ] as const), []);

    const columns = useMemo<ColumnConfig[]>(() => {
        // return
        return BuildVisibleColumnsFromSchema(model.data, visibleKeys);
    }, [model.data, visibleKeys]);

    const rows = useMemo<GridRow[]>(() => {
        // return
        return (paged.data ?? []).map((item) => ParseGalleryRow(item, columns, lang));
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

/** Actions：用 Adapter CUD（不再用 useActions / Provider） */
const useGalleryActionsFromAdapter = (
    dirUrl: string,
    adapter: ReturnType<typeof GalleryAdapter>,
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
        (res.SysMessage ?? []).forEach((m) => publish({ level: m.Status, code: m.MessageCode, title: m.Message }));
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

/** 動態添加每行的動作功能（保留原邏輯：封面圖 + 狀態 icon + Toolbar append 欄） */
const SetAdjustFunction = (gridProps: GridProps, rawData: GallerySet[], actions: UseActionsResult): GridProps => {
    if (gridProps.columns.some(col => col.key === "__adjust__")) return gridProps;
    if (gridProps.rows.length === 0) return gridProps;
    const adjustCol: ColumnConfig = { key: "__adjust__", title: "動作" };
    const newColumns: ColumnConfig[] = [...gridProps.columns, adjustCol];
    const newRows: GridRow[] = gridProps.rows.map((row, index) => {
        const internalId = rawData?.[index]?.Gallery?.InternalId ?? "";
        const pic = row.cells.find(cell => cell.col.key === GalleryFields.CoverPicSrcId);
        const title = row.cells.find(cell => cell.col.key === GalleryInfoFields.Title)?.content?.toString() ?? "";
        if (pic) pic.content = (<img src={`${FileManagementAPI.PREVIEW_URL}/${pic.content?.toString()}`} alt={title} style={{ width: "80px", height: "80px", objectFit: "cover" }} />);
        const curData = rawData?.[index];
        const titleCell = row.cells.find(cell => cell.col.key === GalleryInfoFields.Title);
        if (titleCell) titleCell.content = (<>{title}{GetDataStatusContent(curData?.Gallery?.ContentStatus ?? 0)}</>);
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

/** 由 ModelDisplaySchema + visibleKeys 建欄位 */
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

/** 解析 GallerySet → GridRow（去掉 any、title 依 lang） */
const ParseGalleryRow = (item: GallerySet, columns: ColumnConfig[], lang: Lang): GridRow => {
    // 宣告變數
    const data = item.Gallery ?? {};
    const dt = item.GalleryInfo?.find(p => p.Lang === lang);

    const cells: RowCell[] = columns.map(col => {
        let content = "";

        switch (col.key) {
            case GalleryInfoFields.Title:
                content = dt?.Title ?? "";
                break;
            case GalleryFields.CreateTime:
            case GalleryFields.ModifyTime:
                content = FormatDateTime(String((data as Record<string, unknown>)[col.key] ?? ""));
                break;
            case GalleryFields.ModifyUserId:
                content = item.Gallery?.ModifyUser?.AccountName ?? "";
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
