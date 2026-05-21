import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { MaterialAdapter } from "@/Features/Hooks/BizFunc/MAT/Material_Api";
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
import { AccountFields, MaterialFields, MaterialLangInfoFields, PGID } from "@/types/SchemaFields";
import { createElement, useCallback, useMemo, type ReactNode } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type MaterialSet = components["schemas"]["MaterialSet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type MaterialApiAdapter = ReturnType<typeof MaterialAdapter>;
type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;
type MaterialCudActions = ReturnType<MaterialApiAdapter["hooks"]["useCudActions"]>;
type CategoryMapValue = string | CategorySet | null | undefined;

export const MATERIAL_NAME_SEARCH_KEY = "materialName";
export const MATERIAL_CATEGORY_SEARCH_KEY = "categoryId";

export interface MaterialSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 物件名稱搜尋關鍵字 */
    materialName?: string;

    /** 物件類別搜尋條件 */
    categoryId?: string;
}

export interface MaterialListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 物件列表資料 */
    list: MaterialSet[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;

    /** 類別代碼與顯示文字對照 */
    categoryMap: Record<string, string>;
}

export interface MaterialListAdapter
{
    /** 物件 API adapter */
    Material: MaterialApiAdapter;

    /** 類別 API adapter */
    Category: CategoryApiAdapter;

    /** 物件 CUD 操作 */
    cudActions: MaterialCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type MaterialListGridTemplate = ServerListGridTemplate<MaterialSearchParams, MaterialListRawData, MaterialListAdapter, QueryListParam>;

/** 建立物件後台 ListGridTemplate 設定 */
export const useMaterialListGridTemplate = (opt: { lang: Lang; }): MaterialListGridTemplate =>
{
    return useMemo<MaterialListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Material,
            feature: {
                buildSearchFields: ({ rawData }) => buildMaterialSearchFields(rawData),
                toSearchParams: (values) => toMaterialSearchParams(values, opt.lang),
                buildSearchConditions: buildMaterialSearchConditions,
                buildQueryParam: buildMaterialQueryParam,
                useDataSource: useMaterialListGridDataSource,
                buildGridProps: (ctx) => buildMaterialGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};

/** 執行物件列表資料來源 Hook */
const useMaterialListGridDataSource = (
    ctx: ServerListGridDataSourceContext<MaterialSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<MaterialListRawData, MaterialListAdapter> =>
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
        return { Material: MaterialAdapter(), Category: CategoryAdapter() };
    }, []);

    const cudActions = apiAdapter.Material.hooks.useCudActions({ onError });
    const grid = apiAdapter.Material.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.Material, lang: ctx.searchParams.lang, onError });

    const categoryMap = useMemo(() => buildCategoryTextMap(category.map ?? {}, ctx.searchParams.lang), [category.map, ctx.searchParams.lang]);
    const isLoading = Boolean(grid.isLoading || category.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText].filter((x): x is string => Boolean(x)), [grid.errors, category.errorText]);
    const rawData = useMemo<MaterialListRawData>(() =>
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
        };
    }, [grid.modelDisplayName, grid.count, grid.list, grid.pageNumber, grid.totalPages, grid.onPageChange, grid.param, categoryMap]);

    const refetchData = useCallback(async (): Promise<void> =>
    {
        await grid.refetchData();
    }, [grid]);

    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await category.refetch();
    }, [category]);

    return { adapter: { ...apiAdapter, cudActions, navigate, dirUrl }, rawData, isLoading, errors, refetchData, refetchRefData };
};

/** 建立物件搜尋欄位設定 */
const buildMaterialSearchFields = (rawData: MaterialListRawData): SearchFieldConfig[] =>
{
    const materialName = getColumnTitle(rawData.modelDisplayName, MaterialLangInfoFields.MaterialName, "物件名稱");
    const categoryTitle = getColumnTitle(rawData.modelDisplayName, MaterialFields.CategoryId, "類別");

    return [
        { key: MATERIAL_NAME_SEARCH_KEY, title: materialName, type: "text", placeholder: `請輸入${materialName}` },
        { key: MATERIAL_CATEGORY_SEARCH_KEY, title: categoryTitle, type: "select", options: buildCategorySearchOptions(rawData.categoryMap) },
    ];
};

/** 將 SearchValues 轉為物件列表查詢參數 */
const toMaterialSearchParams = (values: SearchValues, lang: Lang): MaterialSearchParams =>
{
    return {
        lang,
        materialName: getSearchStringValue(values[MATERIAL_NAME_SEARCH_KEY]),
        categoryId: getSearchStringValue(values[MATERIAL_CATEGORY_SEARCH_KEY]),
    };
};

/** 建立物件搜尋條件 */
const buildMaterialSearchConditions = (ctx: { searchParams: MaterialSearchParams; }): string[] =>
{
    const conditions: string[] = [];

    if (ctx.searchParams.materialName)
    {
        conditions.push(`${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} Like ${ctx.searchParams.materialName}`);
    }

    if (ctx.searchParams.categoryId)
    {
        conditions.push(`${MaterialFields.CategoryId} = ${ctx.searchParams.categoryId}`);
    }

    return conditions;
};

/** 建立物件列表完整 QueryParam */
const buildMaterialQueryParam = (ctx: { searchParams: MaterialSearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildMaterialQueryFields();
    const langCondition = `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang} = ${ctx.searchParams.lang}`;
    const nameRequiredCondition = `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName} != ''`;
    const condition = LibMerge(" And ", false, langCondition, nameRequiredCondition, ctx.searchCondition);

    return { Fields: fields, Condition: condition, OrderBy: [{ Col: MaterialFields.ModifyTime, Desc: true }], PageNumber: 1, PageSize: 10 };
};

/** 建立物件列表查詢欄位 */
const buildMaterialQueryFields = (): string[] =>
{
    return [
        MaterialFields.InternalId,
        MaterialFields.MaterialId,
        MaterialFields.CategoryId,
        MaterialFields.ModifyUserId,
        MaterialFields.ModifyTime,
        `${MaterialFields.ModifyUser}.${AccountFields.AccountName}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.Lang}`,
        `${MaterialFields._MaterialLangInfo}.${MaterialLangInfoFields.MaterialName}`,
    ];
};

/** 建立類別下拉搜尋選項 */
const buildCategorySearchOptions = (categoryMap: Record<string, string>): SearchFieldConfig["options"] =>
{
    return Object.entries(categoryMap).map(([value, title]) => ({ value, title: title || value }));
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: MaterialCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

/** 將物件資料轉為 GridProps */
const buildMaterialGridProps = (
    opt: {
        raw: MaterialListRawData;
        lang: Lang;
        adapter?: MaterialListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [MaterialFields.MaterialId, MaterialLangInfoFields.MaterialName, MaterialFields.CategoryId, MaterialFields.ModifyUserId, MaterialFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildMaterialRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceMaterialGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入物件 Grid 編輯與刪除動作 */
const enhanceMaterialGrid = (
    opt: {
        baseGrid: GridProps;
        raw: MaterialListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<MaterialSet>({
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
        getInternalId: (set) => set.Material?.InternalId ?? "",
    });
};

/** 建立物件列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: MaterialListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, `【${col}】`) }));
};

/** 建立物件列表列資料 */
const buildMaterialRows = (raw: MaterialListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) => buildMaterialRow(set, lang, columns, raw.categoryMap));
};

/** 建立物件列表單列資料 */
const buildMaterialRow = (set: MaterialSet, lang: Lang, columns: ColumnConfig[], categoryMap: Record<string, string>): GridRow =>
{
    const material = set.Material;
    const keyId = material?.InternalId ?? LibMerge("|", false, material?.MaterialId);
    const cells: RowCell[] = [
        { col: columns[0], content: material?.MaterialId ?? "" },
        { col: columns[1], content: buildNameContent(set, lang) },
        { col: columns[2], content: mapIdsToList(material?.CategoryId, categoryMap) },
        { col: columns[3], content: material?.ModifyUser?.AccountName ?? "" },
        { col: columns[4], content: FormatDateTime(material?.ModifyTime) },
    ];

    return { keyId, cells };
};

/** 建立物件名稱內容 */
const buildNameContent = (set: MaterialSet, lang: Lang): ReactNode =>
{
    const title = (set.MaterialLangInfo ?? []).find((detail) => detail?.Lang === lang)?.MaterialName ?? "";

    return createElement("div", { className: "d-flex flex-column gap-1" }, createElement("span", null, title));
};

/** 將逗號分隔代碼轉為清單顯示 */
const mapIdsToList = (ids: string | null | undefined, map: Record<string, string>): ReactNode =>
{
    const names = (ids ?? "").split(",").map((x) => x.trim()).filter(Boolean).map((id) => map[id] ?? id);

    return createElement(
        "ul",
        { className: "m-0 p-0", style: { listStylePosition: "inside" } },
        names.map((line, index) => createElement("li", { key: `${line}-${index}`, className: "m-0 p-0" }, line)),
    );
};

/** 將類別 Hook 回傳值轉成文字 map，避免不同 Adapter map 版本造成型別不一致 */
const buildCategoryTextMap = (source: Record<string, CategoryMapValue>, lang: Lang): Record<string, string> =>
{
    return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        acc[key] = getCategoryText(value, lang);
        return acc;
    }, {});
};

/** 取得類別顯示文字 */
const getCategoryText = (value: CategoryMapValue, lang: Lang): string =>
{
    if (!value) return "";
    if (typeof value === "string") return value;

    return (value.CategoryDetail ?? []).find((detail) => detail?.Lang === lang)?.CategoryName ?? "";
};

/** 依欄位代碼取得 ModelDisplayName 顯示文字 */
const getColumnTitle = (modelDisplayName: ModelDisplaySchema | null, columnId: string, fallback: string): string =>
{
    const tables = modelDisplayName?.Tables ?? [];
    const hit = tables.flatMap((t) => t.Columns ?? []).find((c) => c.ColumnId === columnId);
    return hit?.ColumnDisplayName ?? fallback;
};

/** 取得 SearchValue 的文字值 */
const getSearchStringValue = (value: SearchValue): string | undefined =>
{
    if (typeof value !== "string") return undefined;

    const text = value.trim();
    return text.length > 0 ? text : undefined;
};
