import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridQueryContext,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import { SpecJournalAdapter } from "@/SpecFetures/1819/Hooks/BizFunc/WEB/SpecJournal_Api";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { usePageStateMemory } from "@/SysCore/Utils/PageStateMemory/PageStateMemory_Hook";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, PGID, SpecJournalAuthorFields, SpecJournalIndexDetailFields, SpecJournalModelFields } from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";
import type { SpecJournalMode } from "./Server_SpecJournal_Form_Hook";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

export type SpecJournalFormModel = components["schemas"]["SpecJournal"];

type SpecJournalApiAdapter = ReturnType<typeof SpecJournalAdapter>;

type SpecJournalCudActions = ReturnType<SpecJournalApiAdapter["hooks"]["useCudActions"]>;

export interface SpecJournalListRenderers
{
    /** 渲染期刊標題欄位內容，JSX 請留在 Comp 實作 */
    buildTitleContentNode: (set: SpecJournalFormModel) => RowCell["content"];

    /** 渲染期刊作者欄位內容，JSX 請留在 Comp 實作 */
    buildAuthorContentNode: (set: SpecJournalFormModel) => RowCell["content"];
}

export interface SpecJournalListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface SpecJournalSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 期刊列表模式，分為預刊與正式期刊 */
    mode: SpecJournalMode;

    /** 標題搜尋關鍵字 */
    title?: string;

    /** 卷數搜尋條件，僅正式期刊使用 */
    volume?: string;

    /** 作者搜尋關鍵字 */
    author?: string;
}

export interface SpecJournalListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 期刊列表資料 */
    list: SpecJournalFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface SpecJournalListAdapter
{
    /** 期刊 API adapter */
    SpecJournal: SpecJournalApiAdapter;

    /** 期刊新增、修改、刪除操作 */
    cudActions: SpecJournalCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type SpecJournalListGridTemplate = ServerListGridTemplate<SpecJournalSearchParams, SpecJournalListRawData, SpecJournalListAdapter, QueryListParam, SpecJournalListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: SpecJournalCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const SPEC_JOURNAL_TITLE_SEARCH_KEY = "title";

export const SPEC_JOURNAL_VOLUME_SEARCH_KEY = "volume";

export const SPEC_JOURNAL_AUTHOR_SEARCH_KEY = "author";

const SPEC_JOURNAL_LIST_STATE_KEY = "server-spec-journal-list";

const DEFAULT_SPEC_JOURNAL_LIST_PAGE_STATE: SpecJournalListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立期刊後台純 Spec ListGridTemplate 設定 */
export const useSpecJournalListGridTemplate = (opt: { lang: Lang; mode: SpecJournalMode; renderers: SpecJournalListRenderers; }): SpecJournalListGridTemplate =>
{
    const pageState = usePageStateMemory<SpecJournalListPageState>({
        stateKey: SPEC_JOURNAL_LIST_STATE_KEY,
        defaultState: DEFAULT_SPEC_JOURNAL_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<SpecJournalListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.SpecJournal,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateSpecJournalSearchValues,
                updatePageNumber: updateSpecJournalPageNumber,
                getPagination: getSpecJournalPagination,
            },
            spec: {
                buildSearchFields: ({ rawData }) => buildSpecJournalSearchFields(rawData, opt.mode),
                toSearchParams: (values) => toSpecJournalSearchParams(values, opt.lang, opt.mode),
                buildSearchConditions: buildSpecJournalSearchConditions,
                buildQueryParam: buildSpecJournalQueryParam,
                useDataSource: useSpecJournalListGridDataSource,
                buildGridProps: (ctx) =>
                    buildSpecJournalGridProps({
                        raw: ctx.rawData,
                        lang: ctx.searchParams.lang,
                        mode: ctx.searchParams.mode,
                        adapter: ctx.adapter,
                        refetchData: ctx.refetchData,
                        renderers: opt.renderers,
                    }),
            },
        };
    }, [opt.lang, opt.mode, opt.renderers, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新SpecJournal記憶狀態，並固定回到第一頁。 */
const updateSpecJournalSearchValues = (state: SpecJournalListPageState, searchValues: SearchValues): SpecJournalListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新SpecJournal列表記憶頁碼。 */
const updateSpecJournalPageNumber = (state: SpecJournalListPageState, pageNumber: number): SpecJournalListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的SpecJournal分頁資訊。 */
const getSpecJournalPagination = (rawData: SpecJournalListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行期刊列表資料來源 Hook */
const useSpecJournalListGridDataSource = (
    ctx: ServerListGridDataSourceContext<SpecJournalSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<SpecJournalListRawData, SpecJournalListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const adapter = useMemo(() => ({ SpecJournal: SpecJournalAdapter() }), []);
    const cudActions = adapter.SpecJournal.hooks.useCudActions({ onError });
    const grid = adapter.SpecJournal.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<SpecJournalListRawData>(() =>
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

    return { adapter: { ...adapter, cudActions, navigate, dirUrl }, rawData, isLoading: grid.isLoading, errors: grid.errors ?? [], refetchData };
};

/** 建立期刊搜尋欄位設定 */
const buildSpecJournalSearchFields = (rawData: SpecJournalListRawData, mode: SpecJournalMode): SearchFieldConfig[] =>
{
    const fields: SearchFieldConfig[] = [{
        key: SPEC_JOURNAL_TITLE_SEARCH_KEY,
        title: getColumnTitle(rawData.modelDisplayName, SpecJournalModelFields.Title, "標題"),
        type: "text",
        placeholder: "請輸入標題",
    }];
    fields.push(buildSpecJournalAuthorSearchField(rawData));
    if (mode === "journal") fields.push(buildSpecJournalVolumeSearchField(rawData));
    return fields;
};

/** 建立期刊卷數搜尋欄位 */
const buildSpecJournalVolumeSearchField = (rawData: SpecJournalListRawData): SearchFieldConfig =>
{
    const title = getColumnTitle(rawData.modelDisplayName, SpecJournalIndexDetailFields.Volume, "卷數");
    return { key: SPEC_JOURNAL_VOLUME_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}`, helpText: "僅接受數字，送出搜尋時會自動移除非數字字元" };
};

/** 建立期刊作者搜尋欄位 */
const buildSpecJournalAuthorSearchField = (rawData: SpecJournalListRawData): SearchFieldConfig =>
{
    const title = getColumnTitle(rawData.modelDisplayName, SpecJournalAuthorFields.AuthorName, "作者");
    return { key: SPEC_JOURNAL_AUTHOR_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` };
};

/** 將 SearchValues 轉為期刊列表查詢參數 */
const toSpecJournalSearchParams = (values: SearchValues, lang: Lang, mode: SpecJournalMode): SpecJournalSearchParams =>
{
    return {
        lang,
        mode,
        title: getSearchStringValue(values[SPEC_JOURNAL_TITLE_SEARCH_KEY]),
        volume: getNumericSearchStringValue(values[SPEC_JOURNAL_VOLUME_SEARCH_KEY]),
        author: getSearchStringValue(values[SPEC_JOURNAL_AUTHOR_SEARCH_KEY]),
    };
};

/** 建立期刊搜尋條件 */
const buildSpecJournalSearchConditions = (ctx: { searchParams: SpecJournalSearchParams; }): string[] =>
{
    const conditions = buildSpecJournalModeConditions(ctx.searchParams.mode);

    if (ctx.searchParams.title) conditions.push(buildSpecJournalTitleCondition(ctx.searchParams.title));
    if (ctx.searchParams.mode === "journal" && ctx.searchParams.volume) conditions.push(buildSpecJournalVolumeCondition(ctx.searchParams.volume));
    if (ctx.searchParams.author) conditions.push(buildSpecJournalAuthorCondition(ctx.searchParams.author));

    return conditions;
};

/** 建立預刊 / 期刊模式基礎條件 */
const buildSpecJournalModeConditions = (mode: SpecJournalMode): string[] =>
{
    const indexCondition = mode === "preprint" ? "Is Null" : "Is Not Null";
    return [`${SpecJournalModelFields.JournalIndexId} ${indexCondition}`, `${SpecJournalModelFields.JournalIndexRowId} ${indexCondition}`];
};

/** 建立中英文標題搜尋條件 */
const buildSpecJournalTitleCondition = (title: string): string =>
{
    const orCondition = LibCondition.joinConditions([
        LibCondition.createCondition(SpecJournalModelFields.Title, Operator.Like, title),
        LibCondition.createCondition(SpecJournalModelFields.Title_en, Operator.Like, title),
    ], LibCondition.JoinMode.Or);
    return `(${orCondition})`;
};

/** 建立期刊卷數搜尋條件 */
const buildSpecJournalVolumeCondition = (volume: string): string =>
{
    return `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume} = ${volume}`;
};

/** 建立中英文作者搜尋條件 */
const buildSpecJournalAuthorCondition = (author: string): string =>
{
    const orCondition = LibCondition.joinConditions([
        LibCondition.createCondition(`${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`, Operator.Like, author),
        LibCondition.createCondition(`${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`, Operator.Like, author),
    ], LibCondition.JoinMode.Or);
    return `(${orCondition})`;
};

/** 建立期刊列表完整 QueryParam */
const buildSpecJournalQueryParam = (ctx: ServerListGridQueryContext<SpecJournalSearchParams>): QueryListParam =>
{
    return {
        Fields: buildSpecJournalQueryFields(),
        Condition: LibCondition.joinConditions([ctx.searchCondition]),
        OrderBy: buildSpecJournalOrderBy(ctx.searchParams.mode),
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立期刊列表查詢欄位 */
const buildSpecJournalQueryFields = (): string[] =>
{
    return [
        SpecJournalModelFields.JournalId,
        SpecJournalModelFields.Title,
        SpecJournalModelFields.Title_en,
        SpecJournalModelFields.ModifyUserId,
        `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`,
        `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
        `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName}`,
        `${SpecJournalModelFields._SpecJournalAuthor}.${SpecJournalAuthorFields.AuthorName_en}`,
        `${SpecJournalModelFields.ModifyUser}.${AccountFields.AccountName}`,
        SpecJournalModelFields.CreateTime,
        SpecJournalModelFields.ModifyTime,
        SpecJournalModelFields.InternalId,
    ];
};

/** 建立期刊排序條件 */
const buildSpecJournalOrderBy = (mode: SpecJournalMode): QueryListParam["OrderBy"] =>
{
    if (mode === "preprint") return [{ Col: SpecJournalModelFields.ModifyTime, Desc: true }];

    return [{ Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Volume}`, Desc: true }, {
        Col: `${SpecJournalModelFields._JournalIndexDetail}.${SpecJournalIndexDetailFields.Issue}`,
        Desc: true,
    }];
};

/** 將期刊資料轉為 GridProps */
const buildSpecJournalGridProps = (
    opt: {
        raw: SpecJournalListRawData;
        lang: Lang;
        mode: SpecJournalMode;
        adapter?: SpecJournalListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
        renderers: SpecJournalListRenderers;
    },
): GridProps =>
{
    const columns = buildColumns(opt.raw, opt.mode);
    const rows = buildSpecJournalRows(opt.raw, columns, opt.mode, opt.renderers);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceSpecJournalGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入期刊 Grid 編輯與刪除動作 */
const enhanceSpecJournalGrid = (
    opt: {
        baseGrid: GridProps;
        raw: SpecJournalListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<SpecJournalFormModel>({
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

/** 建立欄位清單 */
const buildColumns = (raw: SpecJournalListRawData, mode: SpecJournalMode): ColumnConfig[] =>
{
    const base: ColumnConfig[] = [
        buildSchemaColumn(SpecJournalModelFields.Title, raw),
        buildSchemaColumn(SpecJournalAuthorFields.AuthorName, raw),
        buildSchemaColumn(SpecJournalModelFields.CreateTime, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyUserId, raw),
        buildSchemaColumn(SpecJournalModelFields.ModifyTime, raw),
    ];

    if (mode === "preprint") return base;
    return [{ key: "__volIssue__", title: "卷期" }, ...base];
};

/** 依 schema 找對應欄位標題 */
const buildSchemaColumn = (colId: string, raw: SpecJournalListRawData): ColumnConfig =>
{
    return { key: colId, title: getColumnTitle(raw.modelDisplayName, colId, `【${colId}】`) };
};

/** 建立 Grid rows */
const buildSpecJournalRows = (raw: SpecJournalListRawData, columns: ColumnConfig[], mode: SpecJournalMode, renderers: SpecJournalListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildSpecJournalRow(set, columns, mode, renderers));
};

/** 建立單筆期刊 Grid row */
const buildSpecJournalRow = (set: SpecJournalFormModel, columns: ColumnConfig[], mode: SpecJournalMode, renderers: SpecJournalListRenderers): GridRow =>
{
    const keyId = LibText.Merge("|", false, set.JournalId, set.InternalId);
    const cells: RowCell[] = [];
    let colIdx = 0;

    if (mode === "journal") cells.push({ col: columns[colIdx++], content: renderVolIssue(set) });

    cells.push({ col: columns[colIdx++], content: renderers.buildTitleContentNode(set) });
    cells.push({ col: columns[colIdx++], content: renderers.buildAuthorContentNode(set) });
    cells.push({ col: columns[colIdx++], content: formatDateTime(set.CreateTime) });
    cells.push({ col: columns[colIdx++], content: set.ModifyUser?.AccountName ?? "" });
    cells.push({ col: columns[colIdx++], content: formatDateTime(set.ModifyTime) });

    return { keyId, cells };
};

/** 顯示卷期文字 */
const renderVolIssue = (set: SpecJournalFormModel): string =>
{
    const detail = set._JournalIndexDetail;
    const volume = detail?.Volume ?? "";
    const issue = detail?.Issue ?? "";
    const hasValue = Boolean(volume) || Boolean(issue);
    return hasValue ? `${volume}卷${issue}期` : "";
};

/** 取得數字搜尋文字值 */
const getNumericSearchStringValue = (value: SearchValue): string | undefined =>
{
    const textValue = getSearchStringValue(value);
    const numericValue = textValue?.replace(/\D/g, "") ?? "";
    return numericValue.length > 0 ? numericValue : undefined;
};

// #endregion
