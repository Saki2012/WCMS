import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridQueryContext,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecJournalIndexAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournalIndex_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecJournalIndexDetailFields, SpecJournalIndexFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

export type SpecJournalIndexFormModel = components["schemas"]["SpecJournalIndex"];

type SpecJournalIndexApiAdapter = ReturnType<typeof SpecJournalIndexAdapter>;

type SpecJournalIndexCudActions = ReturnType<SpecJournalIndexApiAdapter["hooks"]["useCudActions"]>;

export interface SpecJournalIndexListRenderers
{
    /** 渲染卷期欄位內容，JSX 請留在 Comp 實作 */
    buildVolumeIssueContentNode: (set: SpecJournalIndexFormModel) => RowCell["content"];
}

export interface SpecJournalIndexListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
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
    list: SpecJournalIndexFormModel[];

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

export type SpecJournalIndexListGridTemplate = ServerListGridTemplate<SpecJournalIndexSearchParams, SpecJournalIndexListRawData, SpecJournalIndexListAdapter, QueryListParam, SpecJournalIndexListPageState>;

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
    tableId?: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};
// #endregion

// #region Public
export const SPEC_JOURNAL_INDEX_NAME_SEARCH_KEY = "indexName";

const SPEC_JOURNAL_INDEX_LIST_STATE_KEY = "server-spec-journal-index-list";

const DEFAULT_SPEC_JOURNAL_INDEX_LIST_PAGE_STATE: SpecJournalIndexListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立期刊目次後台純 Spec ListGridTemplate 設定 */
export const useSpecJournalIndexListGridTemplate = (opt: { lang: Lang; renderers: SpecJournalIndexListRenderers; }): SpecJournalIndexListGridTemplate =>
{
    const pageState = usePageStateMemory<SpecJournalIndexListPageState>({
        stateKey: SPEC_JOURNAL_INDEX_LIST_STATE_KEY,
        defaultState: DEFAULT_SPEC_JOURNAL_INDEX_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SpecJournalIndexListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecJournalIndex,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSpecJournalIndexSearchValues,
                updatePageNumber: updateSpecJournalIndexPageNumber,
                getPagination: getSpecJournalIndexPagination,
            },
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecJournalIndexSearchFields(rawData),
                toSearchParams: (values) => toSpecJournalIndexSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecJournalIndexSearchConditions,
                buildQueryParam: buildSpecJournalIndexQueryParam,
                useDataSource: useSpecJournalIndexListGridDataSource,
                buildGridProps: (ctx) =>
                    buildSpecJournalIndexGridProps({
                        raw: ctx.rawData,
                        lang: ctx.searchParams.lang,
                        adapter: ctx.adapter,
                        refetchData: ctx.refetchData,
                        renderers: opt.renderers,
                    }),
            },
        };
    }, [opt.lang, opt.renderers, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新SpecJournalIndex記憶狀態，並固定回到第一頁。 */
const updateSpecJournalIndexSearchValues = (state: SpecJournalIndexListPageState, searchValues: SearchValues): SpecJournalIndexListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新SpecJournalIndex列表記憶頁碼。 */
const updateSpecJournalIndexPageNumber = (state: SpecJournalIndexListPageState, pageNumber: number): SpecJournalIndexListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的SpecJournalIndex分頁資訊。 */
const getSpecJournalIndexPagination = (rawData: SpecJournalIndexListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

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
    const indexNameTitle = getColumnTitle(rawData.modelDisplayName, SpecJournalIndexFields.IndexName, "期刊目次名稱");

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
        conditions.push(`${SpecJournalIndexFields.IndexName} Like ${ctx.searchParams.indexName}`);
    }

    return conditions;
};

/** 建立期刊目次列表完整 QueryParam */
const buildSpecJournalIndexQueryParam = (ctx: ServerListGridQueryContext<SpecJournalIndexSearchParams>): QueryListParam =>
{
    return {
        Fields: buildSpecJournalIndexQueryFields(),
        Condition: LibCondition.joinConditions([ctx.searchCondition]),
        OrderBy: [{ Col: SpecJournalIndexFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立期刊目次列表查詢欄位 */
const buildSpecJournalIndexQueryFields = (): string[] =>
{
    return [
        SpecJournalIndexFields.IndexId,
        SpecJournalIndexFields.IndexName,
        SpecJournalIndexFields.ModifyUserId,
        `${SpecJournalIndexFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
        `${SpecJournalIndexFields._SpecJournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
        `${SpecJournalIndexFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecJournalIndexFields.CreateTime,
        SpecJournalIndexFields.ModifyTime,
        SpecJournalIndexFields.InternalId,
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
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
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
    const actions = createGridCrudActions<SpecJournalIndexFormModel>({
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
        getInternalId: (set) => set.InternalId ?? "",
    });
};

/** 建立期刊目次顯示欄位設定 */
const buildSpecJournalIndexVisibleColumns = (): SpecJournalIndexVisibleColumn[] =>
{
    return [
        {
            key: SpecJournalIndexFields.IndexName,
            columnId: SpecJournalIndexFields.IndexName,
            fallback: "期刊目次名稱",
        },
        {
            key: "__volIssue__",
            tableId: SpecJournalIndexFields._SpecJournalIndexDetail,
            columnId: SpecJournalIndexDetailFields.Volume,
            fallback: "卷期",
        },
        {
            key: SpecJournalIndexFields.CreateTime,
            columnId: SpecJournalIndexFields.CreateTime,
            fallback: "建立時間",
        },
        {
            key: SpecJournalIndexFields.ModifyUserId,
            columnId: SpecJournalIndexFields.ModifyUserId,
            fallback: "修改者",
        },
        {
            key: SpecJournalIndexFields.ModifyTime,
            columnId: SpecJournalIndexFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};

/** 建立 Grid Rows */
const buildSpecJournalIndexRows = (raw: SpecJournalIndexListRawData, columns: ColumnConfig[], renderers: SpecJournalIndexListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildSpecJournalIndexRow(set, columns, renderers));
};

/** 建立單筆期刊目次 Row */
const buildSpecJournalIndexRow = (set: SpecJournalIndexFormModel, columns: ColumnConfig[], renderers: SpecJournalIndexListRenderers): GridRow =>
{
    const keyId = LibText.Merge("|", false, set.IndexId, set.InternalId);
    const cells = columns.map((col) => buildSpecJournalIndexCell(set, col, renderers));

    return { keyId, cells };
};

/** 建立期刊目次欄位內容 */
const buildSpecJournalIndexCell = (set: SpecJournalIndexFormModel, col: ColumnConfig, renderers: SpecJournalIndexListRenderers): RowCell =>
{
    const content = resolveSpecJournalIndexCellContent(set, col.key, renderers);
    return { col, content };
};

/** 解析期刊目次欄位內容 */
const resolveSpecJournalIndexCellContent = (set: SpecJournalIndexFormModel, key: string, renderers: SpecJournalIndexListRenderers): RowCell["content"] =>
{
    const data = set;

    switch (key)
    {
        case "__volIssue__":
            return renderers.buildVolumeIssueContentNode(set);
        case SpecJournalIndexFields.CreateTime:
        case SpecJournalIndexFields.ModifyTime:
            return formatDateTime(String((data as Record<string, unknown>)[key] ?? ""));
        case SpecJournalIndexFields.ModifyUserId:
            return set.ModifyUser?.AccountName ?? "";
        default:
            return String((data as Record<string, unknown>)[key] ?? "");
    }
};

// #endregion
