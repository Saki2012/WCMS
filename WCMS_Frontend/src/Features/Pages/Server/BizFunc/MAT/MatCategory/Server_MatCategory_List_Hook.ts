import { MatCategoryAdapter } from "@/Features/Hooks/BizFunc/MAT/MatCategory_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import type {
    ServerListGridDataSourceContext,
    ServerListGridDataSourceResult,
    ServerListGridTemplate,
} from "@/Features/Pages/Server/Scaffold/Content/ListGridTemplate/Server_ListGridTemplate_Hook";
import type { ColumnConfig, GridProps, GridRow, RowCell } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValue, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ApiAdapterError } from "@/SysCore/Utils/API/APIAdapter";
import { MessageStatus } from "@/SysCore/Utils/API/APIBase";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import {
    AccountModelFields,
    CategoryDetailFields,
    CategoryFields,
    MatCategoryInfoFieldDisplayFields,
    MatCategoryInfoFieldFields,
    PGID,
} from "@/types/SchemaFields";
import { useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
export type MatCategorySet = components["schemas"]["MatCategoryDataSet_DTO"];
type MatCategoryApiAdapter = ReturnType<typeof MatCategoryAdapter>;
type MatCategoryCudActions = ReturnType<MatCategoryApiAdapter["hooks"]["useCudActions"]>;

export const MAT_CATEGORY_NAME_SEARCH_KEY = "categoryName";

export interface MatCategoryListRenderers
{
    /** 渲染自定義欄位資訊，JSX 請留在 Comp 實作 */
    renderInfoFieldContent: (set: MatCategorySet, lang: Lang) => RowCell["content"];
}

export interface MatCategorySearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 物件類別名稱搜尋關鍵字 */
    categoryName?: string;
}

export interface MatCategoryListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 物件類別列表資料 */
    list: MatCategorySet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface MatCategoryListAdapter
{
    /** 物件類別 API adapter */
    MatCategory: MatCategoryApiAdapter;

    /** 物件類別新增、修改、刪除操作 */
    cudActions: MatCategoryCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type MatCategoryListGridTemplate = ServerListGridTemplate<MatCategorySearchParams, MatCategoryListRawData, MatCategoryListAdapter, QueryListParam>;

/** 建立物件類別後台 Feature ListGridTemplate 設定 */
export const useMatCategoryListGridTemplate = (opt: { lang: Lang; renderers: MatCategoryListRenderers; }): MatCategoryListGridTemplate =>
{
    return useMemo<MatCategoryListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.MatCategory,
            feature: {
                buildSearchFields: ({ rawData }) => buildMatCategorySearchFields(rawData),
                toSearchParams: (values) => toMatCategorySearchParams(values, opt.lang),
                buildSearchConditions: buildMatCategorySearchConditions,
                buildQueryParam: buildMatCategoryQueryParam,
                useDataSource: useMatCategoryListGridDataSource,
                buildGridProps: (ctx) => buildMatCategoryGridProps({
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

/** 執行物件類別列表資料來源 Hook */
const useMatCategoryListGridDataSource = (
    ctx: ServerListGridDataSourceContext<MatCategorySearchParams, QueryListParam>,
): ServerListGridDataSourceResult<MatCategoryListRawData, MatCategoryListAdapter> =>
{
    const { publish } = useToast();
    const navigate = useNavigate();
    const pathname = useLocation().pathname;
    const dirUrl = useMemo(() => pathname.replace(/\/List$/, "/Form"), [pathname]);

    const onError = useCallback((e: ApiAdapterError): void =>
    {
        publish({ level: MessageStatus.Error, title: e.messageText });
    }, [publish]);

    const apiAdapter = useMemo(() => ({ MatCategory: MatCategoryAdapter() }), []);
    const cudActions = apiAdapter.MatCategory.hooks.useCudActions({ onError });
    const grid = apiAdapter.MatCategory.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const rawData = useMemo<MatCategoryListRawData>(() =>
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

/** 建立物件類別搜尋欄位設定 */
const buildMatCategorySearchFields = (rawData: MatCategoryListRawData): SearchFieldConfig[] =>
{
    const categoryNameTitle = getColumnTitle(rawData.modelDisplayName, CategoryDetailFields.CategoryName, "物件類別名稱");

    return [{ key: MAT_CATEGORY_NAME_SEARCH_KEY, title: categoryNameTitle, type: "text", placeholder: `請輸入${categoryNameTitle}` }];
};

/** 將 SearchValues 轉為物件類別列表查詢參數 */
const toMatCategorySearchParams = (values: SearchValues, lang: Lang): MatCategorySearchParams =>
{
    return {
        lang,
        categoryName: getSearchStringValue(values[MAT_CATEGORY_NAME_SEARCH_KEY]),
    };
};

/** 建立物件類別搜尋條件 */
const buildMatCategorySearchConditions = (ctx: { searchParams: MatCategorySearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.categoryName)
    {
        conditions.push(`${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName} Like ${ctx.searchParams.categoryName}`);
    }

    return conditions;
};

/** 建立物件類別列表完整 QueryParam */
const buildMatCategoryQueryParam = (ctx: { searchParams: MatCategorySearchParams; searchCondition: string; }): QueryListParam =>
{
    const materialCategoryCondition = `${CategoryFields.ProgId} = ${PGID.Material}`;
    const langCondition = `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, materialCategoryCondition, langCondition, ctx.searchCondition);

    return {
        Fields: buildMatCategoryQueryFields(),
        Condition: condition,
        OrderBy: [{ Col: CategoryFields.ModifyTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立物件類別列表查詢欄位 */
const buildMatCategoryQueryFields = (): string[] =>
{
    return [
        CategoryFields.InternalId,
        CategoryFields.CategoryId,
        CategoryFields.ModifyTime,
        CategoryFields.ModifyUserId,
        `${CategoryFields.ModifyUser}.${AccountModelFields.AccountName}`,
        `${CategoryFields._CategoryDetail}.${CategoryDetailFields.Lang}`,
        `${CategoryFields._CategoryDetail}.${CategoryDetailFields.CategoryName}`,
        `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.Lang}`,
        `${CategoryFields._MatCategoryInfoField}.${MatCategoryInfoFieldFields._MatCategoryInfoFieldDisplay}.${MatCategoryInfoFieldDisplayFields.FieldDisplayName}`,
    ];
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: MatCategoryCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

/** 將物件類別資料轉為 GridProps */
const buildMatCategoryGridProps = (
    opt: {
        raw: MatCategoryListRawData;
        lang: Lang;
        adapter?: MatCategoryListAdapter;
        refetchData: () => Promise<void>;
        renderers: MatCategoryListRenderers;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [CategoryDetailFields.CategoryName, "自定義欄位資訊", CategoryFields.ModifyUserId, CategoryFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildMatCategoryRows(opt.raw, opt.lang, columns, opt.renderers);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceMatCategoryGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入物件類別 Grid 編輯與刪除動作 */
const enhanceMatCategoryGrid = (
    opt: {
        baseGrid: GridProps;
        raw: MatCategoryListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<MatCategorySet>({
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
        getInternalId: (set) => set.Category?.InternalId ?? "",
    });
};

/** 建立物件類別列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: MatCategoryListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, col) }));
};

/** 建立物件類別列表列資料 */
const buildMatCategoryRows = (raw: MatCategoryListRawData, lang: Lang, columns: ColumnConfig[], renderers: MatCategoryListRenderers): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildMatCategoryRow(set, lang, columns, renderers));
};

/** 建立物件類別列表單列資料 */
const buildMatCategoryRow = (set: MatCategorySet, lang: Lang, columns: ColumnConfig[], renderers: MatCategoryListRenderers): GridRow =>
{
    const category = set.Category;
    const keyId = category?.InternalId ?? LibMerge("|", false, category?.CategoryId);
    const cells: RowCell[] = [
        { col: columns[0], content: getCategoryName(set, lang) },
        { col: columns[1], content: renderers.renderInfoFieldContent(set, lang) },
        { col: columns[2], content: category?.ModifyUser?.AccountName ?? "" },
        { col: columns[3], content: FormatDateTime(category?.ModifyTime) },
    ];

    return { keyId, cells };
};

/** 取得指定語系的物件類別名稱 */
const getCategoryName = (set: MatCategorySet, lang: Lang): string =>
{
    return (set.CategoryDetail ?? []).find((detail) => detail?.Lang === lang)?.CategoryName ?? "";
};

/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((table) => table.Columns ?? []).find((column) => column.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
