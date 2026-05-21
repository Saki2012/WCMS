import { CategoryAdapter } from "@/Features/Hooks/BizFunc/COMM/Category_Api";
import { TagAdapter } from "@/Features/Hooks/BizFunc/COMM/Tag_Api";
import { GalleryAdapter } from "@/Features/Hooks/BizFunc/WEB/Gallery_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { GetDataStatusContent } from "@/Features/Pages/Server/Scaffold/CommUnitComp/CommonComp";
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
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { FormatDateTime } from "@/SysCore/Utils/Library/LibData";
import { LibMerge } from "@/SysCore/Utils/Library/LibMergeData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, GalleryFields, GalleryInfoFields, PGID } from "@/types/SchemaFields";
import { createElement, Fragment, useCallback, useMemo, type ReactNode } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

type QueryListParam = components["schemas"]["QueryListParam"];
type GallerySet = components["schemas"]["GallerySet_DTO"];
type CategorySet = components["schemas"]["CategoryDataSet_DTO"];
type TagSet = components["schemas"]["TagSet_DTO"];
type GalleryApiAdapter = ReturnType<typeof GalleryAdapter>;
type CategoryApiAdapter = ReturnType<typeof CategoryAdapter>;
type TagApiAdapter = ReturnType<typeof TagAdapter>;
type GalleryCudActions = ReturnType<GalleryApiAdapter["hooks"]["useCudActions"]>;
type CategoryMapValue = string | CategorySet | null | undefined;
type TagMapValue = string | TagSet | null | undefined;

export const GALLERY_TITLE_SEARCH_KEY = "title";

export interface GallerySearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 相簿標題搜尋關鍵字 */
    title?: string;
}

export interface GalleryListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 相簿列表資料 */
    list: GallerySet[];

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

export interface GalleryListAdapter
{
    /** 相簿 API adapter */
    Gallery: GalleryApiAdapter;

    /** 分類 API adapter */
    Category: CategoryApiAdapter;

    /** 標籤 API adapter */
    Tag: TagApiAdapter;

    /** 相簿 CUD 操作 */
    cudActions: GalleryCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type GalleryListGridTemplate = ServerListGridTemplate<GallerySearchParams, GalleryListRawData, GalleryListAdapter, QueryListParam>;

/** 建立相簿後台 ListGridTemplate 設定 */
export const useGalleryListGridTemplate = (opt: { lang: Lang; }): GalleryListGridTemplate =>
{
    return useMemo<GalleryListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Gallery,
            feature: {
                buildSearchFields: ({ rawData }) => buildGallerySearchFields(rawData),
                toSearchParams: (values) => toGallerySearchParams(values, opt.lang),
                buildSearchConditions: buildGallerySearchConditions,
                buildQueryParam: buildGalleryQueryParam,
                useDataSource: useGalleryListGridDataSource,
                buildGridProps: (ctx) => buildGalleryGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang]);
};

/** 執行相簿列表資料來源 Hook */
const useGalleryListGridDataSource = (
    ctx: ServerListGridDataSourceContext<GallerySearchParams, QueryListParam>,
): ServerListGridDataSourceResult<GalleryListRawData, GalleryListAdapter> =>
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
        return { Gallery: GalleryAdapter(), Category: CategoryAdapter(), Tag: TagAdapter() };
    }, []);

    const cudActions = apiAdapter.Gallery.hooks.useCudActions({ onError });
    const grid = apiAdapter.Gallery.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });
    const category = apiAdapter.Category.hooks.useMapByProgId({ progId: PGID.Gallery, lang: ctx.searchParams.lang, onError });
    const tag = apiAdapter.Tag.hooks.useMapByProgId({ progId: PGID.Gallery, lang: ctx.searchParams.lang, onError });

    const categoryMap = useMemo(() => buildCategoryTextMap(category.map ?? {}, ctx.searchParams.lang), [category.map, ctx.searchParams.lang]);
    const tagMap = useMemo(() => buildTagTextMap(tag.map ?? {}, ctx.searchParams.lang), [tag.map, ctx.searchParams.lang]);
    const isLoading = Boolean(grid.isLoading || category.isLoading || tag.isLoading);
    const errors = useMemo(() => [...(grid.errors ?? []), category.errorText, tag.errorText].filter((x): x is string => Boolean(x)), [grid.errors, category.errorText, tag.errorText]);
    const rawData = useMemo<GalleryListRawData>(() =>
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

/** 建立相簿搜尋欄位設定 */
const buildGallerySearchFields = (rawData: GalleryListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, GalleryInfoFields.Title, "標題");

    return [{ key: GALLERY_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }];
};

/** 將 SearchValues 轉為相簿列表查詢參數 */
const toGallerySearchParams = (values: SearchValues, lang: Lang): GallerySearchParams =>
{
    return { lang, title: getSearchStringValue(values[GALLERY_TITLE_SEARCH_KEY]) };
};

/** 建立相簿搜尋條件 */
const buildGallerySearchConditions = (ctx: { searchParams: GallerySearchParams; }): string[] =>
{
    if (!ctx.searchParams.title) return [];

    return [`${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title} Like ${ctx.searchParams.title}`];
};

/** 建立相簿列表完整 QueryParam */
const buildGalleryQueryParam = (ctx: { searchParams: GallerySearchParams; searchCondition: string; }): QueryListParam =>
{
    const fields = buildGalleryQueryFields();
    const langCondition = `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang} = ${ctx.searchParams.lang}`;
    const condition = LibMerge(" And ", false, langCondition, ctx.searchCondition);

    return {
        Fields: fields,
        Condition: condition,
        RankGroups: [{ Condition: `${GalleryFields.ContentStatus} & 1` }],
        OrderBy: [{ Col: GalleryFields.CreateTime, Desc: true }],
        PageNumber: 1,
        PageSize: 10,
    };
};

/** 建立相簿列表查詢欄位 */
const buildGalleryQueryFields = (): string[] =>
{
    return [
        GalleryFields.InternalId,
        GalleryFields.GalleryId,
        GalleryFields.Categories,
        GalleryFields.Tags,
        GalleryFields.ModifyUserId,
        GalleryFields.CoverPicSrcId,
        GalleryFields.ContentStatus,
        GalleryFields.CreateTime,
        GalleryFields.ModifyTime,
        `${GalleryFields.ModifyUser}.${AccountFields.AccountName}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Lang}`,
        `${GalleryFields._GalleryInfo}.${GalleryInfoFields.Title}`,
    ];
};

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: GalleryCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};

/** 將相簿資料轉為 GridProps */
const buildGalleryGridProps = (
    opt: {
        raw: GalleryListRawData;
        lang: Lang;
        adapter?: GalleryListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [GalleryFields.CoverPicSrcId, GalleryInfoFields.Title, GalleryFields.ModifyUserId, GalleryFields.ModifyTime];
    const columns = buildColumns(visibleCols, opt.raw);
    const rows = buildGalleryRows(opt.raw, opt.lang, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceGalleryGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入相簿 Grid 編輯與刪除動作 */
const enhanceGalleryGrid = (
    opt: {
        baseGrid: GridProps;
        raw: GalleryListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<GallerySet>({
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
        getInternalId: (set) => set.Gallery?.InternalId ?? "",
    });
};

/** 建立相簿列表欄位定義 */
const buildColumns = (visibleCols: string[], raw: GalleryListRawData): ColumnConfig[] =>
{
    return visibleCols.map((col) => ({ key: col, title: getColumnTitle(raw.modelDisplayName, col, `【${col}】`) }));
};

/** 建立相簿列表列資料 */
const buildGalleryRows = (raw: GalleryListRawData, lang: Lang, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((set) =>
    {
        const keyId = set.Gallery?.InternalId ?? LibMerge("|", false, set.Gallery?.GalleryId);
        const gallery = set.Gallery;
        const title = getGalleryTitle(set, lang);
        const cells: RowCell[] = [
            { col: columns[0], content: buildCoverCell(gallery?.CoverPicSrcId, title) },
            { col: columns[1], content: buildTitleCell(set, lang) },
            { col: columns[2], content: gallery?.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: FormatDateTime(gallery?.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 建立相簿封面圖片欄位內容 */
const buildCoverCell = (coverPicSrcId: string | null | undefined, title: string): ReactNode =>
{
    if (!coverPicSrcId) return null;

    return createElement("img", {
        src: FileManagementAPI.get_Server_Preview_Url(coverPicSrcId),
        alt: title || "相簿封面圖片",
        style: { width: "80px", height: "80px", objectFit: "cover" },
    });
};

/** 建立標題與資料狀態欄位內容 */
const buildTitleCell = (set: GallerySet, lang: Lang): ReactNode =>
{
    const title = getGalleryTitle(set, lang);

    return createElement(Fragment, null, createElement("span", { key: "title" }, title), GetDataStatusContent(set.Gallery?.ContentStatus ?? 0));
};

/** 取得相簿目前語系標題 */
const getGalleryTitle = (set: GallerySet, lang: Lang): string =>
{
    return (set.GalleryInfo ?? []).find((detail) => detail?.Lang === lang)?.Title ?? "";
};

/** 將分類 Hook 回傳值轉成文字 map，避免不同 Adapter map 版本造成型別不一致 */
const buildCategoryTextMap = (source: Record<string, CategoryMapValue>, lang: Lang): Record<string, string> =>
{
    return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        acc[key] = getCategoryText(value, lang);
        return acc;
    }, {});
};

/** 取得分類顯示文字 */
const getCategoryText = (value: CategoryMapValue, lang: Lang): string =>
{
    if (!value) return "";
    if (typeof value === "string") return value;

    return (value.CategoryDetail ?? []).find((detail) => detail?.Lang === lang)?.CategoryName ?? "";
};

/** 將標籤 Hook 回傳值轉成文字 map，避免不同 Adapter map 版本造成型別不一致 */
const buildTagTextMap = (source: Record<string, TagMapValue>, lang: Lang): Record<string, string> =>
{
    return Object.entries(source).reduce<Record<string, string>>((acc, [key, value]) =>
    {
        acc[key] = getTagText(value, lang);
        return acc;
    }, {});
};

/** 取得標籤顯示文字 */
const getTagText = (value: TagMapValue, lang: Lang): string =>
{
    if (!value) return "";
    if (typeof value === "string") return value;

    return (value.TagDetail ?? []).find((detail) => detail?.Lang === lang)?.TagName ?? "";
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
