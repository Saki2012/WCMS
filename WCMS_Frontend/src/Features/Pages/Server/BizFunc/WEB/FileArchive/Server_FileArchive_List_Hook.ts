import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { FileArchiveAdapter } from "@/Features/Hooks/BizFunc/WEB/FileArchive_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { GetDataStatusContent } from "@/Features/Pages/Server/Scaffold/CommUnitComp/CommonComp";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerCategoryTextMap as buildCategoryTextMap,
    buildServerListColumns,
    buildServerListIdListNode as mapIdsToList,
    buildServerListSelectOptions as buildCategorySearchOptions,
    buildServerTagTextMap as buildTagTextMap,
    getServerColumnTitle as getColumnTitle,
    getServerSearchStringValue as getSearchStringValue,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Helper";
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
import { findTextByKey, formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, FileArchiveFields, FileArchiveInfoFields, PGID } from "@/types/SchemaFields";
import { createElement, Fragment, type ReactNode, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type FileArchiveSet = components["schemas"]["FileArchiveSet_DTO"];

type FileArchiveApiAdapter = ReturnType<typeof FileArchiveAdapter>;

type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;

type TagApiAdapter = ReturnType<typeof TagAdapter>;

type FileArchiveCudActions = ReturnType<FileArchiveApiAdapter["hooks"]["useCudActions"]>;

export interface FileArchiveListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface FileArchiveSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 檔案室標題搜尋關鍵字 */
    title?: string;

    /** 檔案室分類搜尋條件 */
    categoryId?: string;
}

export interface FileArchiveListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 檔案室列表資料 */
    list: FileArchiveSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 分類代碼與顯示文字對照 */
    categoryMap: Record<string, string>;

    /** 標籤代碼與顯示文字對照 */
    tagMap: Record<string, string>;
}

export interface FileArchiveListAdapter
{
    /** 檔案室 API adapter */
    FileArchive: FileArchiveApiAdapter;

    /** 分類 API adapter */
    Category: CategoryApiAdapter;

    /** 標籤 API adapter */
    Tag: TagApiAdapter;

    /** 檔案室 CUD 操作 */
    cudActions: FileArchiveCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type FileArchiveListGridTemplate = ServerListGridTemplate<FileArchiveSearchParams, FileArchiveListRawData, FileArchiveListAdapter, QueryListParam, FileArchiveListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: FileArchiveCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const FILE_ARCHIVE_TITLE_SEARCH_KEY = "title";

export const FILE_ARCHIVE_CATEGORY_SEARCH_KEY = "categoryId";


const FILE_ARCHIVE_LIST_STATE_KEY = "server-file-archive-list";

const DEFAULT_FILE_ARCHIVE_LIST_PAGE_STATE: FileArchiveListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立檔案室後台 ListGridTemplate 設定 */
export const useFileArchiveListGridTemplate = (opt: { lang: Lang; }): FileArchiveListGridTemplate =>
{
    const pageState = usePageStateMemory<FileArchiveListPageState>({
        stateKey: FILE_ARCHIVE_LIST_STATE_KEY,
        defaultState: DEFAULT_FILE_ARCHIVE_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<FileArchiveListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.FileArchive,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateFileArchiveSearchValues,
                updatePageNumber: updateFileArchivePageNumber,
                getPagination: getFileArchivePagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildFileArchiveSearchFields(rawData),
                toSearchParams: (values) => toFileArchiveSearchParams(values, opt.lang),
                buildSearchConditions: buildFileArchiveSearchConditions,
                buildQueryParam: buildFileArchiveQueryParam,
                useDataSource: useFileArchiveListGridDataSource,
                buildGridProps: (ctx) => buildFileArchiveGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新FileArchive記憶狀態，並固定回到第一頁。 */
const updateFileArchiveSearchValues = (state: FileArchiveListPageState, searchValues: SearchValues): FileArchiveListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新FileArchive列表記憶頁碼。 */
const updateFileArchivePageNumber = (state: FileArchiveListPageState, pageNumber: number): FileArchiveListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的FileArchive分頁資訊。 */
const getFileArchivePagination = (rawData: FileArchiveListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行檔案室列表資料來源 Hook */
const useFileArchiveListGridDataSource = (
    ctx: ServerListGridDataSourceContext<FileArchiveSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<FileArchiveListRawData, FileArchiveListAdapter> =>
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
        return { FileArchive: FileArchiveAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const cudActions = apiAdapter.FileArchive.hooks.useCudActions({ onError });
    const grid = apiAdapter.FileArchive.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: ctx.searchParams.lang, onError });
    const tag = apiAdapter.Tag.hooks.useMapByProgId({ progId: PGID.FileArchive, lang: ctx.searchParams.lang, onError });

    const categoryMap = useMemo(() => buildCategoryTextMap(category.map ?? {}, ctx.searchParams.lang), [category.map, ctx.searchParams.lang]);
    const tagMap = useMemo(() => buildTagTextMap(tag.map ?? {}, ctx.searchParams.lang), [tag.map, ctx.searchParams.lang]);
    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText, tag.errorText].filter((x): x is string => Boolean(x)), [
        grid.errors,
        category.errorText,
        tag.errorText,
    ]);
    const rawData = useMemo<FileArchiveListRawData>(() =>
    {
        return {
            modelDisplayName: grid.modelDisplayName,
            count: grid.count ?? 0,
            list: grid.list ?? [],
            pageNumber: grid.pageNumber ?? 1,
            totalPages: grid.totalPages ?? 1,
            onPageChange: grid.onPageChange,
            param: grid.param,
            categoryMap,
            tagMap,
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, categoryMap, tagMap]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await Promise.all([category.refetch(), tag.refetch()]);
    }, [category, tag]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 建立檔案室搜尋欄位設定 */
const buildFileArchiveSearchFields = (rawData: FileArchiveListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, FileArchiveInfoFields.Title, "標題");
    const categoryTitle = getColumnTitle(rawData.modelDisplayName, FileArchiveFields.CategoriesId, "分類");

    return [{ key: FILE_ARCHIVE_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }, {
        key: FILE_ARCHIVE_CATEGORY_SEARCH_KEY,
        title: categoryTitle,
        type: "select",
        options: buildCategorySearchOptions(rawData.categoryMap),
    }];
};

/** 將 SearchValues 轉為檔案室列表查詢參數 */
const toFileArchiveSearchParams = (values: SearchValues, lang: Lang): FileArchiveSearchParams =>
{
    return {
        lang,
        title: getSearchStringValue(values[FILE_ARCHIVE_TITLE_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[FILE_ARCHIVE_CATEGORY_SEARCH_KEY]),
    };
};

/** 建立檔案室搜尋條件 */
const buildFileArchiveSearchConditions = (ctx: { searchParams: FileArchiveSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.title)
    {
        conditions.push(`${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title} Like ${ctx.searchParams.title}`);
    }

    if (ctx.searchParams.categoryId)
    {
        conditions.push(`${FileArchiveFields.CategoriesId} HasAny [${ctx.searchParams.categoryId}]`);
    }

    return conditions;
};

/** 建立檔案室列表完整 QueryParam */
const buildFileArchiveQueryParam = (ctx: { pageNumber: number; searchParams: FileArchiveSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildFileArchiveQueryFields(),
        Condition: LibCondition.joinConditions([LibCondition.createCondition(`${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`, Operator.Equal, ctx.searchParams.lang), ctx.searchCondition]),
        RankGroups: [{ Condition: `${FileArchiveFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: FileArchiveFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立檔案室列表查詢欄位 */
const buildFileArchiveQueryFields = (): string[] =>
{
    return [
        FileArchiveFields.InternalId,
        FileArchiveFields.FileArchiveId,
        FileArchiveFields.CategoriesId,
        FileArchiveFields.TagsId,
        FileArchiveFields.ModifyUserId,
        FileArchiveFields.ContentStatus,
        FileArchiveFields.CreateTime,
        FileArchiveFields.ModifyTime,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Lang}`,
        `${FileArchiveFields._FileArchiveInfo}.${FileArchiveInfoFields.Title}`,
        `${FileArchiveFields.ModifyUser}.${AccountFields.AccountName}`,
    ];
};

/** 將檔案室資料轉為 GridProps */
const buildFileArchiveGridProps = (
    opt: {
        raw: FileArchiveListRawData;
        lang: Lang;
        adapter?: FileArchiveListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [FileArchiveFields.CategoriesId, FileArchiveInfoFields.Title, FileArchiveFields.ModifyUserId, FileArchiveFields.ModifyTime];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildFileArchiveRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceFileArchiveGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入檔案室 Grid 編輯與刪除動作 */
const enhanceFileArchiveGrid = (
    opt: {
        baseGrid: GridProps;
        raw: FileArchiveListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<FileArchiveSet>({
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
        getInternalId: (set) => set.FileArchive?.InternalId ?? "",
    });
};

/** 建立檔案室列表列資料 */
const buildFileArchiveRows = (raw: FileArchiveListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = set.FileArchive?.InternalId ?? LibText.Merge("|", false, set.FileArchive?.FileArchiveId);
        const cells: RowCell[] = [
            { col: columns[0], content: mapIdsToList(set.FileArchive?.CategoriesId, raw.categoryMap) },
            { col: columns[1], content: buildTitleCell(set, lang) },
            { col: columns[2], content: set.FileArchive?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: formatDateTime(set.FileArchive?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 建立標題與資料狀態欄位內容 */
const buildTitleCell = (set: FileArchiveSet, lang: Lang): ReactNode =>
{
    const title = findTextByKey(set.FileArchiveInfo, (d) => d?.Lang, lang, (d) => d?.Title);

    return createElement(Fragment, null, createElement("span", { key: "title" }, title), GetDataStatusContent(set.FileArchive?.ContentStatus ?? 0));
};

// #endregion
