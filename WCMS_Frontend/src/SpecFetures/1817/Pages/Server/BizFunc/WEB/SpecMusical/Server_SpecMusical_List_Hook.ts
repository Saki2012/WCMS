import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerSearchStringValue as getSearchStringValue,
    getServerTableColumnTitle as getColumnTitle,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridQueryContext,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText } from "@/SysCore/Utils/Library/LibData";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecMusicalFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

export type SpecMusicalFormModel = components["schemas"]["SpecMusical"];

type SpecMusicalApiAdapter = ReturnType<typeof SpecMusicalAdapter>;

type SpecMusicalCudActions = ReturnType<SpecMusicalApiAdapter["hooks"]["useCudActions"]>;

export interface SpecMusicalListRenderers
{
    /** 渲染封面圖欄位內容，JSX 請留在 Comp 實作 */
    buildCoverContentNode: (set: SpecMusicalFormModel) => RowCell["content"];
}

export interface SpecMusicalListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface SpecMusicalSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 樂器名稱搜尋關鍵字 */
    musicalName?: string;
}

export interface SpecMusicalListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 樂器列表資料 */
    list: SpecMusicalFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface SpecMusicalListAdapter
{
    /** 樂器 API adapter */
    SpecMusical: SpecMusicalApiAdapter;

    /** 樂器新增、修改、刪除操作 */
    cudActions: SpecMusicalCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type SpecMusicalListGridTemplate = ServerListGridTemplate<SpecMusicalSearchParams, SpecMusicalListRawData, SpecMusicalListAdapter, QueryListParam, SpecMusicalListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SpecMusicalCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

type SpecMusicalVisibleColumn = {
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
export const SPEC_MUSICAL_NAME_SEARCH_KEY = "musicalName";

const SPEC_MUSICAL_LIST_STATE_KEY = "server-spec-musical-list";

const DEFAULT_SPEC_MUSICAL_LIST_PAGE_STATE: SpecMusicalListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立樂器後台純 Spec ListGridTemplate 設定 */
export const useSpecMusicalListGridTemplate = (opt: { lang: Lang; renderers: SpecMusicalListRenderers; }): SpecMusicalListGridTemplate =>
{
    const pageState = usePageStateMemory<SpecMusicalListPageState>({
        stateKey: SPEC_MUSICAL_LIST_STATE_KEY,
        defaultState: DEFAULT_SPEC_MUSICAL_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SpecMusicalListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecMusical,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSpecMusicalSearchValues,
                updatePageNumber: updateSpecMusicalPageNumber,
                getPagination: getSpecMusicalPagination,
            },
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecMusicalSearchFields(rawData),
                toSearchParams: (values) => toSpecMusicalSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecMusicalSearchConditions,
                buildQueryParam: buildSpecMusicalQueryParam,
                useDataSource: useSpecMusicalListGridDataSource,
                buildGridProps: (ctx) =>
                    buildSpecMusicalGridProps({
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
/** 搜尋送出時更新SpecMusical記憶狀態，並固定回到第一頁。 */
const updateSpecMusicalSearchValues = (state: SpecMusicalListPageState, searchValues: SearchValues): SpecMusicalListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新SpecMusical列表記憶頁碼。 */
const updateSpecMusicalPageNumber = (state: SpecMusicalListPageState, pageNumber: number): SpecMusicalListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的SpecMusical分頁資訊。 */
const getSpecMusicalPagination = (rawData: SpecMusicalListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行樂器列表資料來源 Hook */
const useSpecMusicalListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SpecMusicalSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SpecMusicalListRawData, SpecMusicalListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ SpecMusical: SpecMusicalAdapter() }), []);
    const cudActions = apiAdapter.SpecMusical.hooks.useCudActions({ onError });
    const grid = apiAdapter.SpecMusical.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<SpecMusicalListRawData>(() =>
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

/** 建立樂器搜尋欄位設定 */
const buildSpecMusicalSearchFields = (rawData: SpecMusicalListRawData): SearchFieldConfig[] =>
{
    const musicalNameTitle = getColumnTitle(rawData.modelDisplayName, PGID.SpecMusical, SpecMusicalFields.MusicalName, "樂器名稱");

    return [{ key: SPEC_MUSICAL_NAME_SEARCH_KEY, title: musicalNameTitle, type: "text", placeholder: `請輸入${musicalNameTitle}` }];
};

/** 將 SearchValues 轉為樂器列表查詢參數 */
const toSpecMusicalSearchParams = (values: SearchValues, lang: Lang): SpecMusicalSearchParams =>
{
    return {
        lang,
        musicalName: getSearchStringValue(values[SPEC_MUSICAL_NAME_SEARCH_KEY]),
    };
};

/** 建立樂器搜尋條件 */
const buildSpecMusicalSearchConditions = (ctx: { searchParams: SpecMusicalSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.musicalName)
    {
        conditions.push(`${SpecMusicalFields.MusicalName} Like ${ctx.searchParams.musicalName}`);
    }

    return conditions;
};

/** 建立樂器列表完整 QueryParam */
const buildSpecMusicalQueryParam = (ctx: ServerListGridQueryContext<SpecMusicalSearchParams>): QueryListParam =>
{
    return {
        Fields: buildSpecMusicalQueryFields(),
        Condition: LibCondition.joinConditions([ctx.searchCondition]),
        OrderBy: [{ Col: SpecMusicalFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立樂器列表查詢欄位 */
const buildSpecMusicalQueryFields = (): string[] =>
{
    return [
        SpecMusicalFields.MusicalId,
        SpecMusicalFields.MusicalName,
        SpecMusicalFields.CoverPicId,
        SpecMusicalFields.Specification,
        SpecMusicalFields.ModifyUserId,
        `${SpecMusicalFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecMusicalFields.CreateTime,
        SpecMusicalFields.ModifyTime,
        SpecMusicalFields.InternalId,
    ];
};

/** 將樂器資料轉為 GridProps */
const buildSpecMusicalGridProps = (
    opt: {
        raw: SpecMusicalListRawData;
        lang: Lang;
        adapter?: SpecMusicalListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
        renderers: SpecMusicalListRenderers;
    },
): GridProps =>
{
    const visibleCols = buildSpecMusicalVisibleColumns();
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildSpecMusicalRows(opt.raw, columns, opt.renderers);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSpecMusicalGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入樂器 Grid 編輯與刪除動作 */
const enhanceSpecMusicalGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SpecMusicalListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecMusicalFormModel>({
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
        getInternalId: (formModel) => formModel.InternalId ?? "",
    });
};

/** 建立樂器顯示欄位設定 */
const buildSpecMusicalVisibleColumns = (): SpecMusicalVisibleColumn[] =>
{
    return [
        {
            key: SpecMusicalFields.CoverPicId,
            tableId: PGID.SpecMusical,
            columnId: SpecMusicalFields.CoverPicId,
            fallback: "封面圖",
        },
        {
            key: SpecMusicalFields.MusicalName,
            tableId: PGID.SpecMusical,
            columnId: SpecMusicalFields.MusicalName,
            fallback: "樂器名稱",
        },
        {
            key: SpecMusicalFields.CreateTime,
            tableId: PGID.SpecMusical,
            columnId: SpecMusicalFields.CreateTime,
            fallback: "建立時間",
        },
        {
            key: SpecMusicalFields.ModifyUserId,
            tableId: PGID.SpecMusical,
            columnId: SpecMusicalFields.ModifyUserId,
            fallback: "修改者",
        },
        {
            key: SpecMusicalFields.ModifyTime,
            tableId: PGID.SpecMusical,
            columnId: SpecMusicalFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};

/** 建立 Grid Rows */
const buildSpecMusicalRows = (raw: SpecMusicalListRawData, columns: ColumnConfig[], renderers: SpecMusicalListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildSpecMusicalRow(set, columns, renderers));
};

/** 建立單筆樂器 Row */
const buildSpecMusicalRow = (set: SpecMusicalFormModel, columns: ColumnConfig[], renderers: SpecMusicalListRenderers): GridRow =>
{
    const keyId = LibText.Merge("|", false, set.MusicalId, set.InternalId);
    const cells = columns.map((col) => buildSpecMusicalCell(set, col, renderers));

    return { keyId, cells };
};

/** 建立樂器欄位內容 */
const buildSpecMusicalCell = (set: SpecMusicalFormModel, col: ColumnConfig, renderers: SpecMusicalListRenderers): RowCell =>
{
    const content = resolveSpecMusicalCellContent(set, col.key, renderers);
    return { col, content };
};

/** 解析樂器欄位內容 */
const resolveSpecMusicalCellContent = (set: SpecMusicalFormModel, key: string, renderers: SpecMusicalListRenderers): RowCell["content"] =>
{
    const data = set;
    const dataRecord = data as Record<string, unknown>;

    switch (key)
    {
        case SpecMusicalFields.CoverPicId:
            return renderers.buildCoverContentNode(set);
        case SpecMusicalFields.CreateTime:
        case SpecMusicalFields.ModifyTime:
            return formatDateTime(String(dataRecord[key] ?? ""));
        case SpecMusicalFields.ModifyUserId:
            return data.ModifyUser?.AccountName ?? "";
        default:
            return String(dataRecord[key] ?? "");
    }
};

// #endregion
