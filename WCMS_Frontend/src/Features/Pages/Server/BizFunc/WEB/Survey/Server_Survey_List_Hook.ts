import { SurveyAdapter } from "@/Features/Hooks/BizFunc/WEB/Survey_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SurveyFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import {
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
    buildServerListColumns,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type SurveyFormModel = components["schemas"]["Survey"];

type SurveyApiAdapter = ReturnType<typeof SurveyAdapter>;

type SurveyCudActions = ReturnType<SurveyApiAdapter["hooks"]["useCudActions"]>;


export interface SurveyListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface SurveySearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 問卷名稱搜尋關鍵字 */
    title?: string;
}


export interface SurveyListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 問卷列表資料 */
    list: SurveyFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}


export interface SurveyListAdapter
{
    /** 問卷 API adapter */
    Survey: SurveyApiAdapter;

    /** 問卷 CUD 操作 */
    cudActions: SurveyCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}


export type SurveyListGridTemplate = ServerListGridTemplate<SurveySearchParams, SurveyListRawData, SurveyListAdapter, QueryListParam, SurveyListPageState>;


type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SurveyCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const SURVEY_NAME_SEARCH_KEY = "title";



const SURVEY_LIST_STATE_KEY = "server-survey-list";

const DEFAULT_SURVEY_LIST_PAGE_STATE: SurveyListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立問卷後台 ListGridTemplate 設定 */
export const useSurveyListGridTemplate = (opt: { lang: Lang; }): SurveyListGridTemplate =>
{
    const pageState = usePageStateMemory<SurveyListPageState>({
        stateKey: SURVEY_LIST_STATE_KEY,
        defaultState: DEFAULT_SURVEY_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SurveyListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Survey,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSurveySearchValues,
                updatePageNumber: updateSurveyPageNumber,
                getPagination: getSurveyPagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildSurveySearchFields(rawData),
                toSearchParams: (values) => toSurveySearchParams(values, opt.lang),
                buildSearchConditions: buildSurveySearchConditions,
                buildQueryParam: buildSurveyQueryParam,
                useDataSource: useSurveyListGridDataSource,
                buildGridProps: (ctx) => buildSurveyGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新Survey記憶狀態，並固定回到第一頁。 */
const updateSurveySearchValues = (state: SurveyListPageState, searchValues: SearchValues): SurveyListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新Survey列表記憶頁碼。 */
const updateSurveyPageNumber = (state: SurveyListPageState, pageNumber: number): SurveyListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的Survey分頁資訊。 */
const getSurveyPagination = (rawData: SurveyListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行問卷列表資料來源 Hook */
const useSurveyListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SurveySearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SurveyListRawData, SurveyListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() =>
    {
        return { Survey: SurveyAdapter() };
    }, []);

    const cudActions = apiAdapter.Survey.hooks.useCudActions({ onError });
    const grid = apiAdapter.Survey.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() => (grid.errors ?? []).filter((x): x is string => Boolean(x)), [grid.errors]);
    const rawData = useMemo<SurveyListRawData>(() =>
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

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData };
};


/** 建立問卷搜尋欄位設定 */
const buildSurveySearchFields = (rawData: SurveyListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, SurveyFields.SurveyName, "問卷名稱");

    return [{ key: SURVEY_NAME_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }];
};


/** 將 SearchValues 轉為問卷列表查詢參數 */
const toSurveySearchParams = (values: SearchValues, lang: Lang): SurveySearchParams =>
{
    return { lang, title: getSearchStringValue(values[SURVEY_NAME_SEARCH_KEY]) };
};


/** 建立問卷搜尋條件 */
const buildSurveySearchConditions = (ctx: { searchParams: SurveySearchParams; }): string[] =>
{
    if (!ctx.searchParams.title) return [];

    return [`${SurveyFields.SurveyName} Like ${ctx.searchParams.title}`];
};


/** 建立問卷列表完整 QueryParam */
const buildSurveyQueryParam = (ctx: { pageNumber: number; searchCondition: string; }): QueryListParam =>
{
    return { Fields: buildSurveyQueryFields(), Condition: ctx.searchCondition, OrderBy: [{ Col: SurveyFields.CreateTime, Desc: true }], PageNumber: ctx.pageNumber, PageSize: 10 };
};


/** 建立問卷列表查詢欄位 */
const buildSurveyQueryFields = (): string[] =>
{
    return [
        SurveyFields.InternalId,
        SurveyFields.SurveyId,
        SurveyFields.SurveyName,
        SurveyFields.ModifyUserId,
        SurveyFields.ModifyTime,
        SurveyFields.CreateTime,
        `${SurveyFields.ModifyUser}.${AccountFields.AccountName}`,
    ];
};


/** 將問卷資料轉為 GridProps */
const buildSurveyGridProps = (
    opt: {
        raw: SurveyListRawData;
        lang: Lang;
        adapter?: SurveyListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [SurveyFields.SurveyName, SurveyFields.ModifyUserId, SurveyFields.ModifyTime];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildSurveyRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSurveyGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};


/** 注入問卷 Grid 編輯與刪除動作 */
const enhanceSurveyGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SurveyListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SurveyFormModel>({
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
        getInternalId: item => item.InternalId ?? "",
    });
};



/** 建立問卷列表列資料 */
const buildSurveyRows = (raw: SurveyListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((item) =>
    {
        const keyId = item.InternalId ?? item.SurveyId ?? "";
        const cells: RowCell[] = [
            { col: columns[0], content: item.SurveyName ?? "" },
            { col: columns[1], content: item.ModifyUser?.AccountName ?? "" },
            { col: columns[2], content: formatDateTime(item.ModifyTime) },
        ];

        return { keyId, cells };
    });
};




// #endregion
