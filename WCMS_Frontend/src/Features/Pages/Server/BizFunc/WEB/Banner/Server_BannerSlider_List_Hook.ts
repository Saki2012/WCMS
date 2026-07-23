import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WEB/BannerSlider_Api";
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { createGridCrudActions, enhanceGridWithAdjustCell, type GridConfirmFn } from "@/Features/Pages/Server/Scaffold/Content/GridAdjustCellEnhance";
import {
    buildServerListColumns,
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
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { formatDateTime, LibCondition, LibText, Operator } from "@/SysCore/Utils/Library/LibData";
import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { AccountFields, BannerDetailFields, BannerDetailInfoFields, BannerFields, PGID } from "@/types/SchemaFields";
import { createElement, useCallback, useMemo } from "react";
import { type NavigateFunction, useLocation, useNavigate } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];

type BannerFormModel = components["schemas"]["Banner"];

type BannerSliderApiAdapter = ReturnType<typeof BannerSliderAdapter>;

type BannerSliderCudActions = ReturnType<BannerSliderApiAdapter["hooks"]["useCudActions"]>;

export interface BannerSliderListPageState
{
    /** SearchBar 已送出的搜尋值。 */
    searchValues: SearchValues;

    /** Grid 目前頁碼。 */
    pageNumber: number;
}

export interface BannerSliderSearchParams
{
    /** 目前列表語系 */
    lang: Lang;

    /** 廣告輪播標題搜尋關鍵字 */
    title?: string;
}

export interface BannerSliderListRawData
{
    /** 後端 ModelDisplayName 欄位顯示設定 */
    modelDisplayName: ModelDisplaySchema | null;

    /** 總筆數 */
    count: number;

    /** 廣告輪播列表資料 */
    list: BannerFormModel[];

    /** 目前頁碼 */
    pageNumber: number;

    /** 總頁數 */
    totalPages: number;

    /** 換頁事件 */
    onPageChange: (page: number) => void;

    /** 實際送出的 QueryListParam */
    param: QueryListParam;
}

export interface BannerSliderListAdapter
{
    /** 廣告輪播 API adapter */
    BannerSlider: BannerSliderApiAdapter;

    /** 廣告輪播 CUD 操作 */
    cudActions: BannerSliderCudActions;

    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;
}

export type BannerSliderListGridTemplate = ServerListGridTemplate<BannerSliderSearchParams, BannerSliderListRawData, BannerSliderListAdapter, QueryListParam, BannerSliderListPageState>;

type CrudDeps = {
    /** React Router 導頁方法 */
    navigate: NavigateFunction;

    /** 目前 List 對應的 Form 路徑 */
    dirUrl: string;

    /** 刪除資料方法 */
    deleteAsync: BannerSliderCudActions["deleteAsync"];

    /** 刪除後重新查詢 */
    afterDelete: () => Promise<void>;
};
// #endregion

// #region Public
export const BANNER_SLIDER_TITLE_SEARCH_KEY = "title";


const BANNER_SLIDER_LIST_STATE_KEY = "server-banner-slider-list";

const DEFAULT_BANNER_SLIDER_LIST_PAGE_STATE: BannerSliderListPageState = {
    searchValues: {},
    pageNumber: 1,
};

/** 建立廣告輪播後台 ListGridTemplate 設定 */
export const useBannerSliderListGridTemplate = (opt: { lang: Lang; }): BannerSliderListGridTemplate =>
{
    const pageState = usePageStateMemory<BannerSliderListPageState>({
        stateKey: BANNER_SLIDER_LIST_STATE_KEY,
        defaultState: DEFAULT_BANNER_SLIDER_LIST_PAGE_STATE,
        scopeKeys: [opt.lang],
    });
    return useMemo<BannerSliderListGridTemplate>(() =>
    {
        return {
            featureKey: PGID.Banner,
            pageStateMemory: {
                controller: pageState,
                getSearchValues: (state) => state.searchValues,
                getPageNumber: (state) => state.pageNumber,
                updateSearchValues: updateBannerSliderSearchValues,
                updatePageNumber: updateBannerSliderPageNumber,
                getPagination: getBannerSliderPagination,
            },
            feature: {
                buildSearchFields: ({ rawData }) => buildBannerSliderSearchFields(rawData),
                toSearchParams: (values) => toBannerSliderSearchParams(values, opt.lang),
                buildSearchConditions: buildBannerSliderSearchConditions,
                buildQueryParam: buildBannerSliderQueryParam,
                useDataSource: useBannerSliderListGridDataSource,
                buildGridProps: (ctx) => buildBannerSliderGridProps({ raw: ctx.rawData, lang: ctx.searchParams.lang, adapter: ctx.adapter, refetchData: ctx.refetchData }),
            },
        };
    }, [opt.lang, pageState]);
};
// #endregion

// #region Private
/** 搜尋送出時更新BannerSlider記憶狀態，並固定回到第一頁。 */
const updateBannerSliderSearchValues = (state: BannerSliderListPageState, searchValues: SearchValues): BannerSliderListPageState =>
{
    return { ...state, searchValues, pageNumber: 1 };
};

/** 更新BannerSlider列表記憶頁碼。 */
const updateBannerSliderPageNumber = (state: BannerSliderListPageState, pageNumber: number): BannerSliderListPageState =>
{
    return { ...state, pageNumber };
};

/** 提供 Template 校正頁碼所需的BannerSlider分頁資訊。 */
const getBannerSliderPagination = (rawData: BannerSliderListRawData): { count: number; totalPages: number; } =>
{
    return { count: rawData.count, totalPages: rawData.totalPages };
};

/** 執行廣告輪播列表資料來源 Hook */
const useBannerSliderListGridDataSource = (
    ctx: ServerListGridDataSourceContext<BannerSliderSearchParams, QueryListParam>,
): ServerListGridDataSourceResult<BannerSliderListRawData, BannerSliderListAdapter> =>
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
        return { BannerSlider: BannerSliderAdapter() };
    }, []);

    const cudActions = apiAdapter.BannerSlider.hooks.useCudActions({ onError });
    const grid = apiAdapter.BannerSlider.hooks.useQueryGridData({
        baseParam: ctx.queryParam,
        deps: [ctx.queryParam.Condition ?? "", ctx.queryParam.PageSize ?? 0],
        modelDeps: [ctx.searchParams.lang],
        onError,
    });

    const isLoading = Boolean(grid.isLoading);
    const errors = useMemo(() => (grid.errors ?? []).filter((x): x is string => Boolean(x)), [grid.errors]);
    const rawData = useMemo<BannerSliderListRawData>(() =>
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

/** 建立廣告輪播搜尋欄位設定 */
const buildBannerSliderSearchFields = (rawData: BannerSliderListRawData): SearchFieldConfig[] =>
{
    const title = getColumnTitle(rawData.modelDisplayName, BannerDetailInfoFields.Title, "標題");

    return [{ key: BANNER_SLIDER_TITLE_SEARCH_KEY, title, type: "text", placeholder: `請輸入${title}` }];
};

/** 將 SearchValues 轉為廣告輪播列表查詢參數 */
const toBannerSliderSearchParams = (values: SearchValues, lang: Lang): BannerSliderSearchParams =>
{
    return { lang, title: getSearchStringValue(values[BANNER_SLIDER_TITLE_SEARCH_KEY]) };
};

/** 建立廣告輪播搜尋條件 */
const buildBannerSliderSearchConditions = (ctx: { searchParams: BannerSliderSearchParams; }): string[] =>
{
    if (!ctx.searchParams.title) return [];

    return [`${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title} Like ${ctx.searchParams.title}`];
};

/** 建立廣告輪播列表完整 QueryParam */
const buildBannerSliderQueryParam = (ctx: { pageNumber: number; searchParams: BannerSliderSearchParams; searchCondition: string; }): QueryListParam =>
{
    return {
        Fields: buildBannerSliderQueryFields(),
        Condition: LibCondition.joinConditions([
            LibCondition.createCondition(`${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`, Operator.Equal, ctx.searchParams.lang),
            ctx.searchCondition,
        ]),
        OrderBy: [{ Col: BannerFields.CreateTime, Desc: true }],
        PageNumber: ctx.pageNumber,
        PageSize: 10,
    };
};

/** 建立廣告輪播列表查詢欄位 */
const buildBannerSliderQueryFields = (): string[] =>
{
    return [
        BannerFields.InternalId,
        BannerFields.BannerId,
        BannerFields.BannerCategoryName,
        BannerFields.ModifyUserId,
        BannerFields.ModifyTime,
        BannerFields.CreateTime,
        `${BannerFields.ModifyUser}.${AccountFields.AccountName}`,
        `${BannerFields._BannerDetail}.${BannerDetailFields.PicSrcId}`,
        `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Lang}`,
        `${BannerFields._BannerDetail}.${BannerDetailFields._BannerDetailInfo}.${BannerDetailInfoFields.Title}`,
    ];
};

/** 將廣告輪播資料轉為 GridProps */
const buildBannerSliderGridProps = (
    opt: {
        raw: BannerSliderListRawData;
        lang: Lang;
        adapter?: BannerSliderListAdapter;
        refetchData: () => Promise<void>;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const visibleCols = [BannerDetailFields.PicSrcId, BannerFields.BannerCategoryName, BannerFields.ModifyUserId, BannerFields.ModifyTime];
    const columns = buildServerListColumns(visibleCols, opt.raw.modelDisplayName);
    const rows = buildBannerSliderRows(opt.raw, columns);
    const baseGrid: GridProps = { columns, rows, CurrentPage: opt.raw.pageNumber ?? 1, TotalPage: opt.raw.totalPages ?? 1, onPageChange: opt.raw.onPageChange };

    if (!opt.adapter) return baseGrid;

    return enhanceBannerSliderGrid({
        baseGrid,
        raw: opt.raw,
        lang: opt.lang,
        crud: { navigate: opt.adapter.navigate, dirUrl: opt.adapter.dirUrl, deleteAsync: opt.adapter.cudActions.deleteAsync, afterDelete: opt.refetchData },
        can: opt.can,
        notifyNoPermission: opt.notifyNoPermission,
        confirm: opt.confirm,
    });
};

/** 注入廣告輪播 Grid 編輯與刪除動作 */
const enhanceBannerSliderGrid = (
    opt: {
        baseGrid: GridProps;
        raw: BannerSliderListRawData;
        lang: Lang;
        crud: CrudDeps;
        can?: (mask: number) => boolean;
        notifyNoPermission?: (msg: string) => void;
        confirm?: GridConfirmFn;
    },
): GridProps =>
{
    const actions = createGridCrudActions<BannerFormModel>({
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

/** 建立廣告輪播列表列資料 */
const buildBannerSliderRows = (raw: BannerSliderListRawData, columns: ColumnConfig[]): GridRow[] =>
{
    return (raw.list ?? []).map((formModel) =>
    {
        const keyId = LibText.Merge("|", false, formModel.BannerId);
        const cells: RowCell[] = [
            { col: columns[0], content: buildBannerSliderImage(formModel) },
            { col: columns[1], content: formModel.BannerCategoryName ?? "" },
            { col: columns[2], content: formModel.ModifyUser?.AccountName ?? "" },
            { col: columns[3], content: formatDateTime(formModel.ModifyTime) },
        ];

        return { keyId, cells };
    });
};

/** 建立廣告輪播圖片預覽 */
const buildBannerSliderImage = (formModel: BannerFormModel): RowCell["content"] =>
{
    const picSrcId = formModel._BannerDetail?.[0]?.PicSrcId;
    if (!picSrcId) return null;

    return createElement("img", { src: FileManagementAPI.get_Server_Preview_Url(picSrcId), alt: "廣告輪播圖片預覽", style: { width: "145px", height: "80px", objectFit: "fill" } });
};

// #endregion
