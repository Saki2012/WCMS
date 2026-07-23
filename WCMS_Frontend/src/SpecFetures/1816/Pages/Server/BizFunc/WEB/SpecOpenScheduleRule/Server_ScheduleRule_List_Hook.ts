import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
    type ServerListVisibleColumn,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecOpenScheduleRuleAdapter } from "@/SpecFetures/1816/Hooks/BizFunc/Calendar/SpecOpenScheduleRule_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import { DefaultLang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDate, formatDateTime, LibCondition } from "@/SysCore/Utils/Library/LibData";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecOpenScheduleRuleFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SpecOpenScheduleRuleFormModel = components["schemas"]["SpecOpenScheduleRule"];

type ScheduleRuleApiAdapter = ReturnType<typeof SpecOpenScheduleRuleAdapter>;

type ScheduleRuleCudActions = ReturnType<ScheduleRuleApiAdapter["hooks"]["useCudActions"]>;

type ScheduleRuleGridQuery = ReturnType<ScheduleRuleApiAdapter["hooks"]["useQueryGridData"]>;

interface ScheduleRuleListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

interface ScheduleRuleSearchParams
{
    /** 學年度搜尋關鍵字。 */
    academicYearId?: string;
}

interface ScheduleRuleListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定。 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數。 */
    count: number;

    /** 學年度開館規則 FormModel 列表。 */
    list: SpecOpenScheduleRuleFormModel[];

    /** 目前頁碼。 */
    pageNumber: number;

    /** 總頁數。 */
    totalPages: number;

    /** 換頁事件。 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam。 */
    param: QueryListParam;
}

interface ScheduleRuleListAdapter
{
    /** 學年度開館規則 API Adapter。 */
    ScheduleRule: ScheduleRuleApiAdapter;

    /** 學年度開館規則新增、修改、刪除操作。 */
    cudActions: ScheduleRuleCudActions;

    /** React Router 導頁方法。 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑。 */
    dirUrl: string;
}

type ScheduleRuleListGridTemplate = ServerListGridTemplate<ScheduleRuleSearchParams, ScheduleRuleListRawData, ScheduleRuleListAdapter, QueryListParam, ScheduleRuleListPageState>;

interface BuildScheduleRuleGridOptions
{
    /** 列表查詢結果。 */
    raw: ScheduleRuleListRawData;

    /** 列表 Adapter 與 CRUD 操作。 */
    adapter?: ScheduleRuleListAdapter;

    /** 重新查詢列表。 */
    refetchData: () => Promise<void>;

    /** 權限判斷。 */
    can?: (mask: number) => boolean;

    /** 無權限提示。 */
    notifyNoPermission?: (msg: string) => void;

    /** Grid 確認方法。 */
    confirm?: GridConfirmFn;
}
// #endregion

// #region Initialization
/** ScheduleRule 學年度搜尋欄位 key。 */
const SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY = "academicYearId";

/** ScheduleRule 列表狀態記憶 key。 */
const SCHEDULE_RULE_LIST_STATE_KEY = "server-schedule-rule-list";

/** ScheduleRule 列表預設記憶狀態。 */
const DEFAULT_SCHEDULE_RULE_LIST_PAGE_STATE: ScheduleRuleListPageState = {
    searchValues: {},
    pageNumber: 1,
};
// #endregion

// #region Public
/** 建立學年度開館規則純 Spec ListGridTemplate 設定。 */
export const useScheduleRuleListGridTemplate = (): ScheduleRuleListGridTemplate =>
{
    const pageState = usePageStateMemory<ScheduleRuleListPageState>({
        stateKey: SCHEDULE_RULE_LIST_STATE_KEY,
        defaultState: DEFAULT_SCHEDULE_RULE_LIST_PAGE_STATE,
    });

    return useMemo<ScheduleRuleListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecOpenScheduleRule,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: state => state.searchValues,
                getPageNumber: state => state.pageNumber,
                updateSearchValues: updateScheduleRuleSearchValues,
                updatePageNumber: updateScheduleRulePageNumber,
                getPagination: getScheduleRulePagination,
            },
            spec: {
                buildSearchFields: ({ rawData }) => buildScheduleRuleSearchFields(rawData),
                toSearchParams: toScheduleRuleSearchParams,
                buildSearchConditions: buildScheduleRuleSearchConditions,
                buildQueryParam: buildScheduleRuleQueryParam,
                useDataSource: useScheduleRuleListGridDataSource,
                buildGridProps: ctx => buildScheduleRuleGridProps({ raw: ctx.rawData, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新 ScheduleRule 記憶狀態，並固定回到第一頁。 */
const updateScheduleRuleSearchValues = (state: ScheduleRuleListPageState, searchValues: SearchValues): ScheduleRuleListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新 ScheduleRule 列表記憶頁碼。 */
const updateScheduleRulePageNumber = (state: ScheduleRuleListPageState, pageNumber: number): ScheduleRuleListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的 ScheduleRule 分頁資訊。 */
const getScheduleRulePagination = (rawData: ScheduleRuleListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行學年度開館規則列表資料來源 Hook。 */
const useScheduleRuleListGridDataSource = (
    ctx: ServerListGridDataSourceContext<ScheduleRuleSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<ScheduleRuleListRawData, ScheduleRuleListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);
    const onError = useCallback((error: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: error.messageText });
    }, [publish]);
    const apiAdapter = useMemo(() => ({ ScheduleRule: SpecOpenScheduleRuleAdapter() }), []);
    const cudActions = apiAdapter.ScheduleRule.hooks.useCudActions({ onError });
    const grid = apiAdapter.ScheduleRule.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        onError,
    });
    const rawData = useMemo(
        () => buildScheduleRuleRawData(grid),
        [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param],
    );
    const refetchData = useCallback(async (): Promise<void> => await grid.refetchData(), [grid]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData };
};

/** 將 API Grid 查詢結果整理為 ScheduleRule List raw data。 */
const buildScheduleRuleRawData = (grid: ScheduleRuleGridQuery): ScheduleRuleListRawData =>
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
};

/** 建立學年度開館規則搜尋欄位設定。 */
const buildScheduleRuleSearchFields = (rawData: ScheduleRuleListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, SpecOpenScheduleRuleFields.AcademicYearId, "學年度");
    return [{ key: SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }];
};

/** 將 SearchValues 轉為學年度開館規則查詢參數。 */
const toScheduleRuleSearchParams = (values: SearchValues): ScheduleRuleSearchParams =>
{
    return { academicYearId: getSearchStringValue(values[SCHEDULE_RULE_ACADEMIC_YEAR_SEARCH_KEY]) };
};

/** 建立學年度開館規則搜尋條件。 */
const buildScheduleRuleSearchConditions = (ctx: { searchParams: ScheduleRuleSearchParams; }): string[] =>
{
    const academicYearId = ctx.searchParams.academicYearId;
    if (!academicYearId) return [];
    return [`${SpecOpenScheduleRuleFields.AcademicYearId} Like ${academicYearId}`];
};

/** 建立學年度開館規則列表完整 QueryParam。 */
const buildScheduleRuleQueryParam = (ctx: { pageNumber: number; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildScheduleRuleQueryFields(),
        Condition: LibCondition.joinConditions([ctx.searchCondition]),
        OrderBy: [{ Col: SpecOpenScheduleRuleFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立學年度開館規則列表查詢欄位。 */
const buildScheduleRuleQueryFields = (): string[] =>
{
    return [
        SpecOpenScheduleRuleFields.AcademicYearId,
        SpecOpenScheduleRuleFields.AcademicStart,
        SpecOpenScheduleRuleFields.AcademicEnd,
        SpecOpenScheduleRuleFields.CreateTime,
        SpecOpenScheduleRuleFields.ModifyUserId,
        `${SpecOpenScheduleRuleFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecOpenScheduleRuleFields.ModifyTime,
        SpecOpenScheduleRuleFields.InternalId,
    ];
};

/** 將學年度開館規則 FormModel 轉為 GridProps。 */
const buildScheduleRuleGridProps = (opt: BuildScheduleRuleGridOptions): GridProps =>
{
    const columns = buildServerListColumns(buildScheduleRuleVisibleColumns(), opt.raw.modelDisplayName);
    const rows = buildScheduleRuleRows(opt.raw, columns);
    const baseGrid: GridProps = {
        columns,
        rows,
        CurrentPage: opt.raw.pageNumber,
        TotalPage: opt.raw.totalPages,
        onPageChange: opt.raw.onPageChange,
    };
    if (!opt.adapter) return baseGrid;
    return enhanceScheduleRuleGrid(baseGrid, opt);
};

/** 注入學年度開館規則 Grid 編輯與刪除動作。 */
const enhanceScheduleRuleGrid = (baseGrid: GridProps, opt: BuildScheduleRuleGridOptions): GridProps =>
{
    const adapter = opt.adapter;
    if (!adapter) return baseGrid;
    const actions = createGridCrudActions<SpecOpenScheduleRuleFormModel>({
        onEdit: internalId => adapter.navigate(`${adapter.dirUrl}/${internalId}`),
        deleteAsync: adapter.cudActions.deleteAsync,
        afterDelete: opt.refetchData,
    });
    return enhanceGridWithAdjustCell(baseGrid, {
        lang: DefaultLang,
        rawList: opt.raw.list,
        actions,
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
        getInternalId: formModel => formModel.InternalId ?? "",
    });
};

/** 建立學年度開館規則列表顯示欄位設定。 */
const buildScheduleRuleVisibleColumns = (): ServerListVisibleColumn[] =>
{
    return [
        { key: SpecOpenScheduleRuleFields.AcademicYearId, fallback: "學年度" },
        { key: SpecOpenScheduleRuleFields.AcademicStart, fallback: "學年開始日" },
        { key: SpecOpenScheduleRuleFields.AcademicEnd, fallback: "學年結束日" },
        { key: SpecOpenScheduleRuleFields.CreateTime, fallback: "建立時間" },
        { key: AccountFields.AccountName, tableId: SpecOpenScheduleRuleFields.ModifyUser, columnId: AccountFields.AccountName, fallback: "修改者" },
        { key: SpecOpenScheduleRuleFields.ModifyTime, fallback: "修改時間" },
    ];
};

/** 建立學年度開館規則列表列資料。 */
const buildScheduleRuleRows = (rawData: ScheduleRuleListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return rawData.list.map(formModel => buildScheduleRuleRow(formModel, columns));
};

/** 建立學年度開館規則列表單列資料。 */
const buildScheduleRuleRow = (formModel: SpecOpenScheduleRuleFormModel, columns: ColumnConfig[]): GridRow =>
{
    const keyId = formModel.InternalId ?? formModel.AcademicYearId ?? "";
    const cells = columns.map(col => ({ col, content: getScheduleRuleCellContent(col.key, formModel) }));
    return { keyId, cells };
};

/** 依欄位 key 取得學年度開館規則 Grid 內容。 */
const getScheduleRuleCellContent = (key: string, formModel: SpecOpenScheduleRuleFormModel): RowCell["content"] =>
{
    switch (key)
    {
        case SpecOpenScheduleRuleFields.AcademicYearId:
            return formModel.AcademicYearId ?? "";
        case SpecOpenScheduleRuleFields.AcademicStart:
            return formatDate(formModel.AcademicStart);
        case SpecOpenScheduleRuleFields.AcademicEnd:
            return formatDate(formModel.AcademicEnd);
        case SpecOpenScheduleRuleFields.CreateTime:
            return formatDateTime(formModel.CreateTime);
        case AccountFields.AccountName:
            return formModel.ModifyUser?.AccountName ?? "";
        case SpecOpenScheduleRuleFields.ModifyTime:
            return formatDateTime(formModel.ModifyTime);
        default:
            return "";
    }
};
// #endregion
