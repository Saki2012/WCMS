import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDate, FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecOpenScheduleRuleModelFields, SpecOpenScheduleRuleSetFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type SpecOpenScheduleRuleSet = components["schemas"]["SpecOpenScheduleRuleSet_DTO"];
type ScheduleRuleApiAdapter = ReturnType<typeof SpecOpenScheduleRuleAdapter>;
type ScheduleRuleCudActions = ReturnType<ScheduleRuleApiAdapter["hooks"]["useCudActions"]>;

export const SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY = "academicYearId";

export interface ScheduleRuleSearchParams
{
    /** 學年度搜尋關鍵字 */
    academicYearId?: string;
}

export interface ScheduleRuleListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 學年度開放規則列表資料 */
    list: SpecOpenScheduleRuleSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface ScheduleRuleListAdapter
{
    /** 學年度開放規則 API adapter */
    ScheduleRule: ScheduleRuleApiAdapter;

    /** 學年度開放規則新增、修改、刪除操作 */
    cudActions: ScheduleRuleCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type ScheduleRuleListGridTemplate = ServerListGridTemplate<ScheduleRuleSearchParams, ScheduleRuleListRawData, ScheduleRuleListAdapter, QueryListParam>;

/** 建立學年度開放規則純 Spec ListGridTemplate 設定 */
export const useScheduleRuleListGridTemplate = (): ScheduleRuleListGridTemplate =>
{
    return useMemo<ScheduleRuleListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecOpenScheduleRule,
            spec: {
                buildSearchFields: ({ rawData }) => buildScheduleRuleSearchFields(rawData),
                toSearchParams: toScheduleRuleSearchParams,
                buildSearchConditions: buildScheduleRuleSearchConditions,
                buildQueryParam: buildScheduleRuleQueryParam,
                useDataSource: useScheduleRuleListGridDataSource,
                buildGridProps: (ctx) => buildScheduleRuleGridProps({ raw: ctx.rawData, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, []);
};

/** 執行學年度開放規則列表資料來源 Hook */
const useScheduleRuleListGridDataSource = (
    ctx: ServerListGridDataSourceContext<ScheduleRuleSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<ScheduleRuleListRawData, ScheduleRuleListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ ScheduleRule: SpecOpenScheduleRuleAdapter() }), []);
    const cudActions = apiAdapter.ScheduleRule.hooks.useCudActions({ onError });
    const grid = apiAdapter.ScheduleRule.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        onError,
    });

    const rawData = useMemo<ScheduleRuleListRawData>(() =>
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

/** 建立學年度開放規則搜尋欄位設定 */
const buildScheduleRuleSearchFields = (rawData: ScheduleRuleListRawData): SearchFieldConfig[] =>
{
    const academicYearTitle = getColumnTitle(
        rawData.modelDisplayName,
        SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
        SpecOpenScheduleRuleModelFields.AcademicYearId,
        "學年度",
    );

    return [{ key: SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY, title: academicYearTitle, type: "text", placeholder: `請輸入${academicYearTitle}` }];
};

/** 將 SearchValues 轉為學年度開放規則查詢參數 */
const toScheduleRuleSearchParams = (values: SearchValues): ScheduleRuleSearchParams =>
{
    return {
        academicYearId: getSearchStringValue(values[SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY]),
    };
};

/** 建立學年度開放規則搜尋條件 */
const buildScheduleRuleSearchConditions = (ctx: { searchParams: ScheduleRuleSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.academicYearId)
    {
        conditions.push(`${SpecOpenScheduleRuleModelFields.AcademicYearId} Like ${ctx.searchParams.academicYearId}`);
    }

    return conditions;
};

/** 建立學年度開放規則列表完整 QueryParam */
const buildScheduleRuleQueryParam = (ctx: { searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildScheduleRuleQueryFields(),
        Condition: LibMerge(" And ", false, ctx.searchCondition),
        OrderBy: [{ Col: SpecOpenScheduleRuleModelFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立學年度開放規則列表查詢欄位 */
const buildScheduleRuleQueryFields = (): string[] =>
{
    return [
        SpecOpenScheduleRuleModelFields.AcademicYearId,
        SpecOpenScheduleRuleModelFields.AcademicStart,
        SpecOpenScheduleRuleModelFields.AcademicEnd,
        SpecOpenScheduleRuleModelFields.CreateTime,
        SpecOpenScheduleRuleModelFields.ModifyUserId,
        `${SpecOpenScheduleRuleModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecOpenScheduleRuleModelFields.ModifyTime,
        SpecOpenScheduleRuleModelFields.InternalId,
    ];
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: ScheduleRuleCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

type ScheduleRuleVisibleColumn = {
    /** Grid 欄位 key */
    key: string;

    /** ModelDisplayName 對應表格代號 */
    tableId: string;

    /** ModelDisplayName 對應欄位代號 */
    columnId: string;

    /** 找不到 ModelDisplayName 時的預設標題 */
    fallback: string;
};

/** 將學年度開放規則資料轉為 GridProps */
const buildScheduleRuleGridProps = (
    opt: {
        raw: ScheduleRuleListRawData;
        adapter?: ScheduleRuleListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = buildScheduleRuleVisibleColumns();
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildScheduleRuleRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceScheduleRuleGrid({
        baseGrid,
        raw: opt.raw,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入學年度開放規則 Grid 編輯與刪除動作 */
const enhanceScheduleRuleGrid = (
    opt: {
        baseGrid: GridProps;
        raw: ScheduleRuleListRawData;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecOpenScheduleRuleSet>({
        onEdit: (internalId) => opt.crud.navigate(`${opt.crud.dirUrl}/${internalId}`),
        deleteAsync: opt.crud.deleteAsync,
        afterDelete: opt.crud.afterDelete,
    });

    return enhanceGridWithAdjustCell(opt.baseGrid, {
        lang: DefaultLang,
        rawList: opt.raw.list ?? [],
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: (set) => set.SpecOpenScheduleRule?.InternalId ?? "",
    });
};

/** 建立學年度開放規則列表顯示欄位設定 */
const buildScheduleRuleVisibleColumns = (): ScheduleRuleVisibleColumn[] =>
{
    return [
        {
            key: SpecOpenScheduleRuleModelFields.AcademicYearId,
            tableId: SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
            columnId: SpecOpenScheduleRuleModelFields.AcademicYearId,
            fallback: "學年度",
        },
        {
            key: SpecOpenScheduleRuleModelFields.AcademicStart,
            tableId: SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
            columnId: SpecOpenScheduleRuleModelFields.AcademicStart,
            fallback: "學年開始日",
        },
        {
            key: SpecOpenScheduleRuleModelFields.AcademicEnd,
            tableId: SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
            columnId: SpecOpenScheduleRuleModelFields.AcademicEnd,
            fallback: "學年結束日",
        },
        {
            key: SpecOpenScheduleRuleModelFields.CreateTime,
            tableId: SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
            columnId: SpecOpenScheduleRuleModelFields.CreateTime,
            fallback: "建立時間",
        },
        {
            key: AccountFields.AccountName,
            tableId: SpecOpenScheduleRuleModelFields.ModifyUser,
            columnId: AccountFields.AccountName,
            fallback: "修改者",
        },
        {
            key: SpecOpenScheduleRuleModelFields.ModifyTime,
            tableId: SpecOpenScheduleRuleSetFields.SpecOpenScheduleRule,
            columnId: SpecOpenScheduleRuleModelFields.ModifyTime,
            fallback: "修改時間",
        },
    ];
};

/** 建立學年度開放規則列表欄位定義 */
const buildColumns = (visibleCols: ScheduleRuleVisibleColumn[], raw: ScheduleRuleListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col.key, title: getColumnTitle(raw.modelDisplayName, col.tableId, col.columnId, col.fallback) }));
};

/** 建立學年度開放規則列表列資料 */
const buildScheduleRuleRows = (raw: ScheduleRuleListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildScheduleRuleRow(set, columns));
};

/** 建立學年度開放規則列表單列資料 */
const buildScheduleRuleRow = (set: SpecOpenScheduleRuleSet, columns: ColumnConfig[]): GridRow =>
{
    const scheduleRule = set.SpecOpenScheduleRule;
    const keyId = scheduleRule?.InternalId ?? `${scheduleRule?.AcademicYearId ?? ""}`;
    const cells = columns.map((col) => ({ col, content: getScheduleRuleCellContent(col.key, set) }));

    return { keyId, cells };
};

/** 依欄位 key 取得學年度開放規則 Grid 內容 */
const getScheduleRuleCellContent = (key: string, set: SpecOpenScheduleRuleSet): RowCell["content"] =>
{
    const scheduleRule = set.SpecOpenScheduleRule;

    switch (key)
    {
        case SpecOpenScheduleRuleModelFields.AcademicYearId:
            return scheduleRule?.AcademicYearId ?? "";
        case SpecOpenScheduleRuleModelFields.AcademicStart:
            return FormatDate(scheduleRule?.AcademicStart);
        case SpecOpenScheduleRuleModelFields.AcademicEnd:
            return FormatDate(scheduleRule?.AcademicEnd);
        case SpecOpenScheduleRuleModelFields.CreateTime:
            return FormatDateTime(scheduleRule?.CreateTime);
        case AccountFields.AccountName:
            return scheduleRule?.ModifyUser?.AccountName ?? "";
        case SpecOpenScheduleRuleModelFields.ModifyTime:
            return FormatDateTime(scheduleRule?.ModifyTime);
        default:
            return "";
    }
};

/** 依表格與欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, tableId: string, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const table = tables.find((item) => item.TableId === tableId);
    const hit = table?.Columns?.find((item) => item.ColumnId === columnId);

    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
