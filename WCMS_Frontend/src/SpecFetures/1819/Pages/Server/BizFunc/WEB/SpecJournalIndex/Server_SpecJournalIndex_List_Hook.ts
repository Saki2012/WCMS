import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecJournalIndexDetailFields, SpecJournalIndexModelFields, SpecJournalIndexSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

export type SpecJournalIndexSet = components["schemas"]["SpecJournalIndexSet_DTO"];

type SpecJournalIndexApiAdapter = ReturnType<typeof SpecJournalIndexAdapter>;

type SpecJournalIndexCudActions = ReturnType<SpecJournalIndexApiAdapter["hooks"]["useCudActions"]>;


export interface SpecJournalIndexListRenderers
{
    /** 渲染卷期欄位內容，JSX 請留在 Comp 實作 */
    renderVolumeIssueContent: (set: SpecJournalIndexSet) => RowCell["content"];
}


export interface SpecJournalIndexSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 期刊目次名稱搜尋關鍵字 */
    indexName?: string;
}


export interface SpecJournalIndexListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 期刊目次列表資料 */
    list: SpecJournalIndexSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}


export interface SpecJournalIndexListAdapter
{
    /** 期刊目次 API adapter */
    SpecJournalIndex: SpecJournalIndexApiAdapter;

    /** 期刊目次新增、修改、刪除操作 */
    cudActions: SpecJournalIndexCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}


export type SpecJournalIndexListGridTemplate = ServerListGridTemplate<SpecJournalIndexSearchParams, SpecJournalIndexListRawData, SpecJournalIndexListAdapter, QueryListParam>;


type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SpecJournalIndexCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};


type SpecJournalIndexVisibleColumn = {
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};
// #endregion

// #region Public
export const SPEC_JOURNAL_INDEX_NAME_SEARCH_KEY = "indexName";


/** 建立期刊目次後台純 Spec ListGridTemplate 設定 */
export const useSpecJournalIndexListGridTemplate = (opt: { lang: Lang; renderers: SpecJournalIndexListRenderers; }): SpecJournalIndexListGridTemplate =>
{
    return useMemo<SpecJournalIndexListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecJournalIndex,
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecJournalIndexSearchFields(rawData),
                toSearchParams: (values) => toSpecJournalIndexSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecJournalIndexSearchConditions,
                buildQueryParam: buildSpecJournalIndexQueryParam,
                useDataSource: useSpecJournalIndexListGridDataSource,
                buildGridProps: (ctx) => buildSpecJournalIndexGridProps({
                    raw: ctx.rawData,
                    lang: ctx.searchParams.lang,
                    adapter: ctx.adapter,
                    refetchData: ctx.refetchData,
                    renderers: opt.renderers,
                }),
            },
        };
    }, [opt.lang, opt.renderers]);
};
// #endregion

// #region Private
/** 執行期刊目次列表資料來源 Hook */
const useSpecJournalIndexListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SpecJournalIndexSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SpecJournalIndexListRawData, SpecJournalIndexListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ SpecJournalIndex: SpecJournalIndexAdapter() }), []);
    const cudActions = apiAdapter.SpecJournalIndex.hooks.useCudActions({ onError });
    const grid = apiAdapter.SpecJournalIndex.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<SpecJournalIndexListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData };
};


/** 建立期刊目次搜尋欄位設定 */
const buildSpecJournalIndexSearchFields = (rawData: SpecJournalIndexListRawData): SearchFieldConfig[] =>
{
    const indexNameTitle = getColumnTitle(rawData.modelDisplayName, SpecJournalIndexSetFields.SpecJournalIndex, SpecJournalIndexModelFields.IndexName, "期刊目次名稱");

    return [{ key: SPEC_JOURNAL_INDEX_NAME_SEARCH_KEY, title: indexNameTitle, type: "text", placeholder: `請輸入${indexNameTitle}` }];
};


/** 將 SearchValues 轉為期刊目次列表查詢參數 */
const toSpecJournalIndexSearchParams = (values: SearchValues, lang: Lang): SpecJournalIndexSearchParams =>
{
    return {
        lang,
        indexName: getSearchStringValue(values[SPEC_JOURNAL_INDEX_NAME_SEARCH_KEY]),
    };
};


/** 建立期刊目次搜尋條件 */
const buildSpecJournalIndexSearchConditions = (ctx: { searchParams: SpecJournalIndexSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.indexName)
    {
        conditions.push(`${SpecJournalIndexModelFields.IndexName} Like ${ctx.searchParams.indexName}`);
    }

    return conditions;
};


/** 建立期刊目次列表完整 QueryParam */
const buildSpecJournalIndexQueryParam = (ctx: { searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildSpecJournalIndexQueryFields(),
        Condition: LibMerge(" And ", false, ctx.searchCondition),
        OrderBy: [{ Col: SpecJournalIndexModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};


/** 建立期刊目次列表查詢欄位 */
const buildSpecJournalIndexQueryFields = (): string[] =>
{
    return [
        SpecJournalIndexModelFields.IndexId,
        SpecJournalIndexModelFields.IndexName,
        SpecJournalIndexModelFields.ModifyUserId,
        `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
        `${SpecJournalIndexModelFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
        `${SpecJournalIndexModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecJournalIndexModelFields.CreateTime,
        SpecJournalIndexModelFields.ModifyTime,
        SpecJournalIndexModelFields.InternalId,
    ];
};


/** 將期刊目次資料轉為 GridProps */
const buildSpecJournalIndexGridProps = (
    opt: {
        raw: SpecJournalIndexListRawData;
        lang: Lang;
        adapter?: SpecJournalIndexListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
        renderers: SpecJournalIndexListRenderers;
    },
): GridProps =>
{
    const visibleCols = buildSpecJournalIndexVisibleColumns();
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildSpecJournalIndexRows(opt.raw, columns, opt.renderers);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSpecJournalIndexGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};


/** 注入期刊目次 Grid 編輯與刪除動作 */
const enhanceSpecJournalIndexGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SpecJournalIndexListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecJournalIndexSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(opt.baseGrid, {
        lang: opt.lang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.SpecJournalIndex?.InternalId ?? "",
    });
};


/** 建立期刊目次顯示欄位設定 */
const buildSpecJournalIndexVisibleColumns = (): SpecJournalIndexVisibleColumn[] =>
{
    return [
        {
            key: SpecJournalIndexModelFields.IndexName,
            tableId: SpecJournalIndexSetFields.SpecJournalIndex,
            columnId: SpecJournalIndexModelFields.IndexName,
            fallback: "期刊目次名稱",
        },
        {
            key: "__volIssue__",
            tableId: SpecJournalIndexSetFields.SpecJournalIndexDetail,
            columnId: SpecJournalIndexDetailFields.Volume,
            fallback: "卷期",
        },
        {
            key: SpecJournalIndexModelFields.CreateTime,
            tableId: SpecJournalIndexSetFields.SpecJournalIndex,
            columnId: SpecJournalIndexModelFields.CreateTime,
            fallback: "建立時間",
        },
        {
            key: SpecJournalIndexModelFields.ModifyUserId,
            tableId: SpecJournalIndexSetFields.SpecJournalIndex,
            columnId: SpecJournalIndexModelFields.ModifyUserId,
            fallback: "修改者",
        },
        {
            key: SpecJournalIndexModelFields.ModifyTime,
            tableId: SpecJournalIndexSetFields.SpecJournalIndex,
            columnId: SpecJournalIndexModelFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};


/** 建立 Grid 欄位 */
const buildColumns = (visibleCols: SpecJournalIndexVisibleColumn[], raw: SpecJournalIndexListRawData): ColumnConfig[] =>
{
    return visibleCols.map((item) => ({
        key: item.key,
        title: item.key === "__volIssue__" ? item.fallback : getColumnTitle(raw.modelDisplayName, item.tableId, item.columnId, item.fallback),
    }));
};


/** 建立 Grid Rows */
const buildSpecJournalIndexRows = (raw: SpecJournalIndexListRawData, columns: ColumnConfig[], renderers: SpecJournalIndexListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildSpecJournalIndexRow(set, columns, renderers));
};


/** 建立單筆期刊目次 Row */
const buildSpecJournalIndexRow = (set: SpecJournalIndexSet, columns: ColumnConfig[], renderers: SpecJournalIndexListRenderers): GridRow =>
{
    const keyId = LibMerge("|", false, set.SpecJournalIndex?.IndexId, set.SpecJournalIndex?.InternalId);
    const cells = columns.map((col) => buildSpecJournalIndexCell(set, col, renderers));

    return { keyId, cells };
};


/** 建立期刊目次欄位內容 */
const buildSpecJournalIndexCell = (set: SpecJournalIndexSet, col: ColumnConfig, renderers: SpecJournalIndexListRenderers): RowCell =>
{
    const content = resolveSpecJournalIndexCellContent(set, col.key, renderers);
    return { col, content };
};


/** 解析期刊目次欄位內容 */
const resolveSpecJournalIndexCellContent = (set: SpecJournalIndexSet, key: string, renderers: SpecJournalIndexListRenderers): RowCell["content"] =>
{
    const data = set.SpecJournalIndex ?? {};

    switch (key)
    {
        case "__volIssue__":
            return renderers.renderVolumeIssueContent(set);
        case SpecJournalIndexModelFields.CreateTime:
        case SpecJournalIndexModelFields.ModifyTime:
            return formatDateTime(String((data as Record<string, unknown>)[key] ?? ""));
        case SpecJournalIndexModelFields.ModifyUserId:
            return set.SpecJournalIndex?.ModifyUser?.AccountName ?? "";
        default:
            return String((data as Record<string, unknown>)[key] ?? "");
    }
};


/** 取得搜尋文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;
    const trimValue = value.trim();
    return trimValue.length > 0 ? trimValue : undefined;
};


/** 從 ModelDisplayName 取得欄位顯示名稱 */
const getColumnTitle = (schema: ModelDisplaySchema | null, tableId: string, columnId: string, fallback: string): string =>
{
    const table = schema?.Tables?.find((item) => item.TableId === tableId);
    const column = table?.Columns?.find((item) => item.ColumnId === columnId);
    return column?.ColumnDisplayName ?? fallback;
};
// #endregion
