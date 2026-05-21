import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecMusicalAdapter } from "@/SpecFetures/1817/Hooks/BizFunc/WEB/SpecMusical_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecMusicalModelFields, SpecMusicalSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
export type SpecMusicalSet = components["schemas"]["SpecMusicalSet_DTO"];
type SpecMusicalApiAdapter = ReturnType<typeof SpecMusicalAdapter>;
type SpecMusicalCudActions = ReturnType<SpecMusicalApiAdapter["hooks"]["useCudActions"]>;

export const SPEC_MUSICAL_NAME_SEARCH_KEY = "musicalName";

export interface SpecMusicalListRenderers
{
    /** 渲染封面圖欄位內容，JSX 請留在 Comp 實作 */
    renderCoverContent: (set: SpecMusicalSet) => RowCell["content"];
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
    list: SpecMusicalSet[];

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

export type SpecMusicalListGridTemplate = ServerListGridTemplate<SpecMusicalSearchParams, SpecMusicalListRawData, SpecMusicalListAdapter, QueryListParam>;

/** 建立樂器後台純 Spec ListGridTemplate 設定 */
export const useSpecMusicalListGridTemplate = (opt: { lang: Lang; renderers: SpecMusicalListRenderers; }): SpecMusicalListGridTemplate =>
{
    return useMemo<SpecMusicalListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecMusical,
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecMusicalSearchFields(rawData),
                toSearchParams: (values) => toSpecMusicalSearchParams(values, opt.lang),
                buildSearchConditions: buildSpecMusicalSearchConditions,
                buildQueryParam: buildSpecMusicalQueryParam,
                useDataSource: useSpecMusicalListGridDataSource,
                buildGridProps: (ctx) => buildSpecMusicalGridProps({
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
    const musicalNameTitle = getColumnTitle(rawData.modelDisplayName, SpecMusicalSetFields.SpecMusical, SpecMusicalModelFields.MusicalName, "樂器名稱");

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
        conditions.push(`${SpecMusicalModelFields.MusicalName} Like ${ctx.searchParams.musicalName}`);
    }

    return conditions;
};

/** 建立樂器列表完整 QueryParam */
const buildSpecMusicalQueryParam = (ctx: { searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildSpecMusicalQueryFields(),
        Condition: LibMerge(" And ", false, ctx.searchCondition),
        OrderBy: [{ Col: SpecMusicalModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立樂器列表查詢欄位 */
const buildSpecMusicalQueryFields = (): string[] =>
{
    return [
        SpecMusicalModelFields.MusicalId,
        SpecMusicalModelFields.MusicalName,
        SpecMusicalModelFields.CoverPicId,
        SpecMusicalModelFields.Specification,
        SpecMusicalModelFields.ModifyUserId,
        `${SpecMusicalModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecMusicalModelFields.CreateTime,
        SpecMusicalModelFields.ModifyTime,
        SpecMusicalModelFields.InternalId,
    ];
};

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
    const columns = buildColumns(visibleCols, opt.raw);
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
    const actions = createGridCrudActions<SpecMusicalSet>({
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
        getInternalId: (set) => set.SpecMusical?.InternalId ?? "",
    });
};

/** 建立樂器顯示欄位設定 */
const buildSpecMusicalVisibleColumns = (): SpecMusicalVisibleColumn[] =>
{
    return [
        {
            key: SpecMusicalModelFields.CoverPicId,
            tableId: SpecMusicalSetFields.SpecMusical,
            columnId: SpecMusicalModelFields.CoverPicId,
            fallback: "封面圖",
        },
        {
            key: SpecMusicalModelFields.MusicalName,
            tableId: SpecMusicalSetFields.SpecMusical,
            columnId: SpecMusicalModelFields.MusicalName,
            fallback: "樂器名稱",
        },
        {
            key: SpecMusicalModelFields.CreateTime,
            tableId: SpecMusicalSetFields.SpecMusical,
            columnId: SpecMusicalModelFields.CreateTime,
            fallback: "建立時間",
        },
        {
            key: SpecMusicalModelFields.ModifyUserId,
            tableId: SpecMusicalSetFields.SpecMusical,
            columnId: SpecMusicalModelFields.ModifyUserId,
            fallback: "修改者",
        },
        {
            key: SpecMusicalModelFields.ModifyTime,
            tableId: SpecMusicalSetFields.SpecMusical,
            columnId: SpecMusicalModelFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};

/** 建立 Grid 欄位 */
const buildColumns = (visibleCols: SpecMusicalVisibleColumn[], raw: SpecMusicalListRawData): ColumnConfig[] =>
{
    return visibleCols.map((item) => ({
        key: item.key,
        title: getColumnTitle(raw.modelDisplayName, item.tableId, item.columnId, item.fallback),
    }));
};

/** 建立 Grid Rows */
const buildSpecMusicalRows = (raw: SpecMusicalListRawData, columns: ColumnConfig[], renderers: SpecMusicalListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildSpecMusicalRow(set, columns, renderers));
};

/** 建立單筆樂器 Row */
const buildSpecMusicalRow = (set: SpecMusicalSet, columns: ColumnConfig[], renderers: SpecMusicalListRenderers): GridRow =>
{
    const keyId = LibMerge("|", false, set.SpecMusical?.MusicalId, set.SpecMusical?.InternalId);
    const cells = columns.map((col) => buildSpecMusicalCell(set, col, renderers));

    return { keyId, cells };
};

/** 建立樂器欄位內容 */
const buildSpecMusicalCell = (set: SpecMusicalSet, col: ColumnConfig, renderers: SpecMusicalListRenderers): RowCell =>
{
    const content = resolveSpecMusicalCellContent(set, col.key, renderers);
    return { col, content };
};

/** 解析樂器欄位內容 */
const resolveSpecMusicalCellContent = (set: SpecMusicalSet, key: string, renderers: SpecMusicalListRenderers): RowCell["content"] =>
{
    const data = set.SpecMusical;
    const dataRecord = (data ?? {}) as Record<string, unknown>;

    switch (key)
    {
        case SpecMusicalModelFields.CoverPicId:
            return renderers.renderCoverContent(set);
        case SpecMusicalModelFields.CreateTime:
        case SpecMusicalModelFields.ModifyTime:
            return FormatDateTime(String(dataRecord[key] ?? ""));
        case SpecMusicalModelFields.ModifyUserId:
            return data?.ModifyUser?.AccountName ?? "";
        default:
            return String(dataRecord[key] ?? "");
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
