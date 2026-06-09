import type { PaginatorProps } from "@/SysCore/Components/Paginator/Paginator_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { IListViewState } from "@/SysCore/Interface/IListViewState";
import type { components } from "@/types/api";
import { useCallback, useMemo, useState } from "react";
import { useLoaderData } from "react-router-dom";

// #region Property
type QueryListParam = components["schemas"]["QueryListParam"];
type ClientDataQueryCondition = string | null | undefined;
type ClientDataQueryMode = "multiple" | "single";
type ClientSearchActionAlign = "left" | "right";
/** 前台資料查詢分頁設定，使用 null / undefined 代表不顯示分頁 */
interface ClientDataQueryPaginationConfig
{
    /** 預設頁碼 */
    defaultPageNumber?: number;
    /** 預設每頁筆數 */
    defaultPageSize?: number;
    /** 搜尋或重置後是否回到第一頁 */
    resetPageOnSearch?: boolean;
}
/** 前台搜尋列顯示設定，使用 null 代表不顯示搜尋列 */
interface ClientDataQuerySearchBarConfig
{
    /** 搜尋區塊標題 */
    title?: string;
    /** 搜尋按鈕位置 */
    actionAlign?: ClientSearchActionAlign;
    /** 搜尋按鈕文字 */
    searchButtonText?: string;
    /** 重置按鈕文字 */
    resetButtonText?: string;
    /** 一列最多幾個欄位 */
    columnCount?: 1 | 2 | 3;
}
/** 前台 SearchBar 統一模型 */
export interface ClientDataQuerySearchBarModel extends ClientDataQuerySearchBarConfig
{
    /** SearchBar 欄位設定 */
    fields: SearchFieldConfig[];
    /** SearchBar 目前已送出的搜尋值 */
    values: SearchValues;
    /** 送出 SearchBar 搜尋值 */
    onSearch: (values: SearchValues) => void;
    /** 清除 SearchBar 搜尋值 */
    onReset: () => void;
}
/** 前台分頁統一模型 */
export interface ClientDataQueryPaginatorModel
{
    /** 目前頁碼 */
    currentPage: number;
    /** 每頁筆數 */
    pageSize: number;
    /** 總頁數 */
    totalPages: number;
    /** 總筆數 */
    totalCount: number;
    /** 切換頁碼 */
    onPageChange: (page: number) => void;
}
/** 前台資料查詢基礎設定 */
interface ClientDataQueryTemplateBase
{
    /** 功能識別碼，通常對應 Feature 或 SpecFeature 名稱 */
    featureKey: string;
    /** 資料模式：multiple=list，single=detail/form */
    dataMode: ClientDataQueryMode;
    /** 預設搜尋值，不吃 URL query 時會以這裡為初始值 */
    initialSearchValues?: SearchValues;
    /** 預設清單狀態，包含 page / pageSize / sort / keyword */
    initialViewState?: Partial<IListViewState>;
    /** 分頁設定，null / undefined 代表不顯示分頁 */
    pagination?: ClientDataQueryPaginationConfig | null;
    /** 搜尋列設定，null 代表不顯示搜尋列，undefined 則依欄位自動判斷 */
    searchBar?: ClientDataQuerySearchBarConfig | null;
}
/** 建立搜尋條件時的 Context */
interface ClientDataQueryConditionContext<TSearchParams>
{
    /** SearchBar 送出後的原始搜尋值 */
    searchValues: SearchValues;
    /** 由 searchValues 轉換後的功能專用查詢參數 */
    searchParams: TSearchParams;
    /** 目前資料查詢狀態，含 page / pageSize / sort */
    viewState: IListViewState;
    /** 前台資料查詢模式 */
    dataMode: ClientDataQueryMode;
}
/** 建立 QueryParam 時的 Context */
interface ClientDataQueryParamContext<TSearchParams> extends ClientDataQueryConditionContext<TSearchParams>
{
    /** Feature 與 Spec 共同組出的搜尋條件清單 */
    searchConditions: string[];
    /** 將 searchConditions 以 And 串接後的搜尋條件字串 */
    searchCondition: string;
}
/** DataSource Hook 使用的 Context */
interface ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData> extends ClientDataQueryParamContext<TSearchParams>
{
    /** 完整 QueryListParam 或功能自定義 QueryParam */
    queryParam: TQueryParam;
    /** SSR Loader 回傳資料，供 DataSource 決定是否沿用 initial */
    loaderData: TLoaderData | null;
}
/** SearchBar 欄位建立 Context */
interface ClientDataQuerySearchFieldContext<TRawData, TAdapter>
{
    /** useDataSource 回傳的原始資料 */
    rawData: TRawData;
    /** useDataSource 回傳的 adapter 或輔助物件 */
    adapter?: TAdapter;
    /** SearchBar 目前已送出的搜尋值 */
    submittedValues: SearchValues;
    /** 目前資料查詢狀態，含 page / pageSize / sort */
    viewState: IListViewState;
}
/** 建立畫面 ViewModel 的 Context */
interface ClientDataQueryViewModelContext<TSearchParams, TRawData, TAdapter, TQueryParam, TLoaderData> extends ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData>
{
    /** useDataSource 回傳的原始資料 */
    rawData: TRawData;
    /** useDataSource 回傳的 adapter 或輔助物件 */
    adapter?: TAdapter;
    /** 重新查詢主資料 */
    refetchData: () => Promise<void>;
    /** 重新查詢參照資料 */
    refetchRefData: () => Promise<void>;
}
/** DataSource Hook 回傳格式 */
export interface ClientDataQueryDataSourceResult<TRawData, TAdapter = unknown>
{
    /** 可選的 adapter 或輔助物件，提供 buildViewModel 後續使用 */
    adapter?: TAdapter;
    /** 查詢後的原始資料 */
    rawData: TRawData;
    /** 資料是否載入中 */
    isLoading: boolean;
    /** 資料來源回傳的錯誤訊息集合 */
    errors: (string | null | undefined)[];
    /** DataSource 建立的分頁模型，沒有分頁時給 null */
    paginator?: ClientDataQueryPaginatorModel | null;
    /** 重新查詢主資料 */
    refetchData?: () => Promise<void> | void;
    /** 重新查詢參照資料 */
    refetchRefData?: () => Promise<void> | void;
}
/** Feature 基礎資料查詢流程設定 */
interface ClientDataQueryFeatureTiming<TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown>
{
    /** Feature 基礎 SearchBar 欄位設定 */
    searchFields?: SearchFieldConfig[];
    /** 依資料來源動態建立 Feature SearchBar 欄位 */
    buildSearchFields?: (ctx: ClientDataQuerySearchFieldContext<TRawData, TAdapter>) => SearchFieldConfig[];
    /** 將 SearchValues 轉換為 Feature 查詢參數 */
    toSearchParams?: (values: SearchValues, viewState: IListViewState) => TSearchParams;
    /** 建立 Feature 搜尋條件 */
    buildSearchConditions?: (ctx: ClientDataQueryConditionContext<TSearchParams>) => ClientDataQueryCondition[];
    /** 建立完整 QueryParam，包含欄位、條件、排序與分頁等設定 */
    buildQueryParam: (ctx: ClientDataQueryParamContext<TSearchParams>) => TQueryParam;
    /** 執行資料來源 Hook，通常用來呼叫 adapter.hooks.useQueryGridData / useQueryList */
    useDataSource: (ctx: ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData>) => ClientDataQueryDataSourceResult<TRawData, TAdapter>;
    /** 將 rawData 轉換為前台畫面需要的 ViewModel */
    buildViewModel: (ctx: ClientDataQueryViewModelContext<TSearchParams, TRawData, TAdapter, TQueryParam, TLoaderData>) => TViewModel;
}
/** Spec 客製資料查詢流程設定，可單獨使用，也可接在 Feature 後方 */
interface ClientDataQuerySpecTiming<TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown>
{
    /** Spec 追加的 SearchBar 欄位設定 */
    searchFields?: SearchFieldConfig[];
    /** 依資料來源動態建立 Spec SearchBar 欄位 */
    buildSearchFields?: (ctx: ClientDataQuerySearchFieldContext<TRawData, TAdapter>) => SearchFieldConfig[];
    /** 在目前查詢參數基礎上追加或覆寫 Spec 查詢參數 */
    toSearchParams?: (values: SearchValues, currentParams: TSearchParams, viewState: IListViewState) => TSearchParams;
    /** 建立 Spec 追加的搜尋條件 */
    buildSearchConditions?: (ctx: ClientDataQueryConditionContext<TSearchParams>) => ClientDataQueryCondition[];
    /** 建立或覆寫完整 QueryParam，Feature 存在時可包裝 Feature 結果 */
    buildQueryParam?: (ctx: ClientDataQueryParamContext<TSearchParams>, featureQueryParam?: TQueryParam) => TQueryParam;
    /** Spec Only 時執行資料來源 Hook；Feature 存在時預設仍走 Feature useDataSource */
    useDataSource?: (ctx: ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData>) => ClientDataQueryDataSourceResult<TRawData, TAdapter>;
    /** 建立或覆寫畫面資料，Feature 存在時可包裝 Feature ViewModel */
    buildViewModel?: (ctx: ClientDataQueryViewModelContext<TSearchParams, TRawData, TAdapter, TQueryParam, TLoaderData>, featureViewModel?: TViewModel) => TViewModel;
}
/** 前台資料查詢 Template，feature / spec 皆為可選入口，但至少需提供其中一個 */
export interface ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown> extends ClientDataQueryTemplateBase
{
    /** Feature 基礎資料查詢流程，可選 */
    feature?: ClientDataQueryFeatureTiming<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>;
    /** Spec 客製資料查詢流程，可選 */
    spec?: ClientDataQuerySpecTiming<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>;
}
/** QueryParam 建立結果，Loader 與 Hook 都應使用這個結果 */
export interface ClientDataQueryBuiltState<TSearchParams, TQueryParam>
{
    /** SearchBar 送出後的原始搜尋值 */
    searchValues: SearchValues;
    /** 已轉換完成的功能查詢參數 */
    searchParams: TSearchParams;
    /** 目前資料查詢狀態 */
    viewState: IListViewState;
    /** Feature 與 Spec 組出的搜尋條件清單 */
    searchConditions: string[];
    /** searchConditions 串接後的搜尋條件字串 */
    searchCondition: string;
    /** 完整 QueryParam */
    queryParam: TQueryParam;
}
/** Hook 回傳資料 */
export interface ClientDataQueryTemplateResult<TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown> extends ClientDataQueryBuiltState<TSearchParams, TQueryParam>
{
    /** 功能識別碼 */
    featureKey: string;
    /** 前台資料查詢模式 */
    dataMode: ClientDataQueryMode;
    /** SSR Loader 回傳資料 */
    loaderData: TLoaderData | null;
    /** 最終給 SearchBar 渲染的欄位設定 */
    searchFields: SearchFieldConfig[];
    /** SearchBar 已送出的搜尋值 */
    submittedValues: SearchValues;
    /** 給 ModuleContent 渲染 SearchBar 的模型 */
    searchBar: ClientDataQuerySearchBarModel | null;
    /** useDataSource 回傳的 adapter 或輔助物件 */
    adapter?: TAdapter;
    /** useDataSource 回傳的原始資料 */
    rawData: TRawData;
    /** 最終給前台 Component 使用的資料 */
    viewModel: TViewModel;
    /** DataSource 回傳的分頁模型 */
    paginator: ClientDataQueryPaginatorModel | null;
    /** 給 ModuleContent 渲染 Paginator 的 props */
    paginatorProps: PaginatorProps | null;
    /** 資料是否載入中 */
    isLoading: boolean;
    /** 統一整理後的錯誤訊息 */
    errorList: string[];
    /** 送出 SearchBar 搜尋值 */
    submitSearch: (values: SearchValues) => void;
    /** 清除 SearchBar 搜尋值 */
    resetSearch: () => void;
    /** 更新 viewState */
    updateViewState: (nextState: Partial<IListViewState> | ((prev: IListViewState) => Partial<IListViewState>)) => void;
    /** 更新目前頁碼 */
    setPageNumber: (pageNumber: number) => void;
    /** 更新排序狀態 */
    setSortState: (sortField?: string, sortDesc?: boolean) => void;
    /** 重新查詢主資料 */
    refetchData: () => Promise<void>;
    /** 重新查詢參照資料 */
    refetchRefData: () => Promise<void>;
}
// #endregion

// #region Public
/** 建立 Loader 與 Hook 共用的 Query 狀態，Loader 端也應呼叫這個函式 */
export const buildClientDataQueryState = <TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    submittedValues: SearchValues,
    viewState: IListViewState,
): ClientDataQueryBuiltState<TSearchParams, TQueryParam> =>
{
    const searchParams = buildTemplateSearchParams(template, submittedValues, viewState);
    const conditionCtx: ClientDataQueryConditionContext<TSearchParams> = { searchValues: submittedValues, searchParams, viewState, dataMode: template.dataMode };
    const searchConditions = buildTemplateSearchConditions(template, conditionCtx);
    const searchCondition = searchConditions.join(" And ");
    const queryCtx: ClientDataQueryParamContext<TSearchParams> = { ...conditionCtx, searchConditions, searchCondition };
    const queryParam = buildTemplateQueryParam(template, queryCtx);
    return { searchValues: submittedValues, searchParams, viewState, searchConditions, searchCondition, queryParam };
};
/** 產生 QueryParam 比對 key，供 loader / hook 判斷 SSR initial 是否可沿用 */
export const buildClientDataQueryKey = (queryParam?: unknown): string =>
{
    return JSON.stringify(queryParam ?? null);
};
/** 比對兩個 QueryParam 是否一致 */
export const isSameClientDataQueryParam = (left?: unknown, right?: unknown): boolean =>
{
    return buildClientDataQueryKey(left) === buildClientDataQueryKey(right);
};
/** 前台資料查詢共用流程：統一處理 search、viewState、queryParam、loaderData 與 viewModel */
export const useClientDataQueryTemplate = <TSearchParams, TRawData, TViewModel, TAdapter = unknown, TQueryParam = QueryListParam, TLoaderData = unknown>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
): ClientDataQueryTemplateResult<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData> =>
{
    const routeLoaderData = useLoaderData() as TLoaderData | null;
    const [submittedValues, setSubmittedValues] = useState<SearchValues>(template.initialSearchValues ?? {});
    const [viewState, setViewState] = useState<IListViewState>(() => buildInitialViewState(template));
    const builtState = useMemo(() => buildClientDataQueryState(template, submittedValues, viewState), [template, submittedValues, viewState]);
    const dataSourceContext: ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData> = {
        searchValues: submittedValues,
        searchParams: builtState.searchParams,
        viewState,
        dataMode: template.dataMode,
        searchConditions: builtState.searchConditions,
        searchCondition: builtState.searchCondition,
        queryParam: builtState.queryParam,
        loaderData: routeLoaderData,
    };
    const dataSource = useTemplateDataSource(template, dataSourceContext);
    const updateViewState = useCallback((nextState: Partial<IListViewState> | ((prev: IListViewState) => Partial<IListViewState>)): void =>
    {
        setViewState((prev) =>
        {
            const next = typeof nextState === "function" ? nextState(prev) : nextState;
            return { ...prev, ...next };
        });
    }, []);
    const resetPageNumber = useCallback((): void =>
    {
        if (!shouldResetPageOnSearch(template)) return;
        const pageNumber = template.pagination?.defaultPageNumber ?? template.initialViewState?.pageNumber ?? 1;
        updateViewState({ pageNumber });
    }, [template, updateViewState]);
    const submitSearch = useCallback((values: SearchValues): void =>
    {
        setSubmittedValues(values);
        resetPageNumber();
    }, [resetPageNumber]);
    const resetSearch = useCallback((): void =>
    {
        setSubmittedValues(template.initialSearchValues ?? {});
        resetPageNumber();
    }, [template, resetPageNumber]);
    const setPageNumber = useCallback((pageNumber: number): void =>
    {
        updateViewState({ pageNumber });
    }, [updateViewState]);
    const setSortState = useCallback((sortField?: string, sortDesc?: boolean): void =>
    {
        updateViewState({ sortField, sortDesc, pageNumber: 1 });
    }, [updateViewState]);
    const refetchData = useCallback(async (): Promise<void> =>
    {
        await dataSource.refetchData?.();
    }, [dataSource]);
    const refetchRefData = useCallback(async (): Promise<void> =>
    {
        await dataSource.refetchRefData?.();
    }, [dataSource]);
    const searchFields = useMemo<SearchFieldConfig[]>(() =>
    {
        const ctx: ClientDataQuerySearchFieldContext<TRawData, TAdapter> = {
            rawData: dataSource.rawData,
            adapter: dataSource.adapter,
            submittedValues,
            viewState,
        };

        return buildTemplateSearchFields(template, ctx);
    }, [template, dataSource.rawData, dataSource.adapter, submittedValues, viewState]);

    const searchBar = useMemo<ClientDataQuerySearchBarModel | null>(() =>
    {
        return buildSearchBarModel({
            config: template.searchBar,
            fields: searchFields,
            submittedValues,
            submitSearch,
            resetSearch,
        });
    }, [template.searchBar, searchFields, submittedValues, submitSearch, resetSearch]);

    const paginator = dataSource.paginator ?? null;

    const paginatorProps = useMemo<PaginatorProps | null>(() =>
    {
        return buildPaginatorProps(paginator);
    }, [paginator]);

    const viewModel = useMemo<TViewModel>(() =>
    {
        const ctx: ClientDataQueryViewModelContext<TSearchParams, TRawData, TAdapter, TQueryParam, TLoaderData> = {
            searchValues: submittedValues,
            searchParams: builtState.searchParams,
            viewState,
            dataMode: template.dataMode,
            searchConditions: builtState.searchConditions,
            searchCondition: builtState.searchCondition,
            queryParam: builtState.queryParam,
            loaderData: routeLoaderData,
            rawData: dataSource.rawData,
            adapter: dataSource.adapter,
            refetchData,
            refetchRefData,
        };

        return buildTemplateViewModel(template, ctx);
    }, [
        template,
        submittedValues,
        builtState.searchParams,
        builtState.searchConditions,
        builtState.searchCondition,
        builtState.queryParam,
        viewState,
        routeLoaderData,
        dataSource.rawData,
        dataSource.adapter,
        refetchData,
        refetchRefData,
    ]);

    const errorList = useMemo<string[]>(() =>
    {
        return (dataSource.errors ?? []).filter((item): item is string => Boolean(item));
    }, [dataSource.errors]);

    return {
        featureKey: template.featureKey,
        dataMode: template.dataMode,
        loaderData: routeLoaderData,
        searchFields,
        submittedValues,
        searchBar,
        searchValues: builtState.searchValues,
        searchParams: builtState.searchParams,
        viewState,
        searchConditions: builtState.searchConditions,
        searchCondition: builtState.searchCondition,
        queryParam: builtState.queryParam,
        adapter: dataSource.adapter,
        rawData: dataSource.rawData,
        viewModel,
        paginator,
        paginatorProps,
        isLoading: Boolean(dataSource.isLoading),
        errorList,
        submitSearch,
        resetSearch,
        updateViewState,
        setPageNumber,
        setSortState,
        refetchData,
        refetchRefData,
    };
};
// #endregion

// #region Private
/** 判斷目前是否有 Feature timing */
const hasFeatureTiming = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
): boolean =>
{
    return template.feature !== undefined;
};

/** 判斷目前是否有 Spec timing */
const hasSpecTiming = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
): boolean =>
{
    return template.spec !== undefined;
};

/** 檢查 Template 至少要提供 Feature 或 Spec 其中一個 timing */
const ensureTemplateTiming = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
): void =>
{
    if (hasFeatureTiming(template) || hasSpecTiming(template)) return;
    throw new Error(`[ClientDataQueryTemplate] ${template.featureKey} must provide feature or spec timing.`);
};

/** 建立預設 viewState */
const buildInitialViewState = (template: ClientDataQueryTemplateBase): IListViewState =>
{
    const pagination = template.pagination;
    const pageNumber = template.initialViewState?.pageNumber ?? pagination?.defaultPageNumber ?? 1;
    const pageSize = template.initialViewState?.pageSize ?? pagination?.defaultPageSize ?? 10;

    return {
        pageNumber,
        pageSize,
        keyword: template.initialViewState?.keyword,
        sortField: template.initialViewState?.sortField,
        sortDesc: template.initialViewState?.sortDesc,
    };
};

/** 建立 Feature / Spec 對應的 SearchParams，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSearchParams = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    submittedValues: SearchValues,
    viewState: IListViewState,
): TSearchParams =>
{
    ensureTemplateTiming(template);

    const featureParams = template.feature?.toSearchParams?.(submittedValues, viewState) ?? ({} as TSearchParams);
    return template.spec?.toSearchParams?.(submittedValues, featureParams, viewState) ?? featureParams;
};

/** 建立 Feature 與 Spec 的搜尋條件，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSearchConditions = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    ctx: ClientDataQueryConditionContext<TSearchParams>,
): string[] =>
{
    const list = [
        ...(template.feature?.buildSearchConditions?.(ctx) ?? []),
        ...(template.spec?.buildSearchConditions?.(ctx) ?? []),
    ];

    return list.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

/** 建立完整 QueryParam，Feature 存在時由 Spec 包裝 Feature 結果 */
const buildTemplateQueryParam = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    ctx: ClientDataQueryParamContext<TSearchParams>,
): TQueryParam =>
{
    const featureQueryParam = template.feature?.buildQueryParam(ctx);
    if (featureQueryParam !== undefined) return template.spec?.buildQueryParam?.(ctx, featureQueryParam) ?? featureQueryParam;
    if (template.spec?.buildQueryParam) return template.spec.buildQueryParam(ctx);

    throw new Error(`[ClientDataQueryTemplate] ${template.featureKey} spec.buildQueryParam is required when feature is not provided.`);
};

/** 建立 SearchBar 欄位，Feature 欄位先放，Spec 欄位後追加 */
const buildTemplateSearchFields = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    ctx: ClientDataQuerySearchFieldContext<TRawData, TAdapter>,
): SearchFieldConfig[] =>
{
    const featureFields = template.feature?.buildSearchFields?.(ctx) ?? template.feature?.searchFields ?? [];
    const specFields = template.spec?.buildSearchFields?.(ctx) ?? template.spec?.searchFields ?? [];

    return [...featureFields, ...specFields];
};

/** 建立 ViewModel，Feature 存在時由 Spec 包裝 Feature 結果 */
const buildTemplateViewModel = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    ctx: ClientDataQueryViewModelContext<TSearchParams, TRawData, TAdapter, TQueryParam, TLoaderData>,
): TViewModel =>
{
    const featureViewModel = template.feature?.buildViewModel(ctx);
    if (featureViewModel !== undefined) return template.spec?.buildViewModel?.(ctx, featureViewModel) ?? featureViewModel;
    if (template.spec?.buildViewModel) return template.spec.buildViewModel(ctx);

    throw new Error(`[ClientDataQueryTemplate] ${template.featureKey} spec.buildViewModel is required when feature is not provided.`);
};

/** 執行資料來源 Hook，Feature 存在時以 Feature 為主，Spec Only 時走 Spec */
const useTemplateDataSource = <TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>(
    template: ClientDataQueryTemplate<TSearchParams, TRawData, TViewModel, TAdapter, TQueryParam, TLoaderData>,
    ctx: ClientDataQueryDataSourceContext<TSearchParams, TQueryParam, TLoaderData>,
): ClientDataQueryDataSourceResult<TRawData, TAdapter> =>
{
    if (template.feature) return template.feature.useDataSource(ctx);
    if (template.spec?.useDataSource) return template.spec.useDataSource(ctx);

    throw new Error(`[ClientDataQueryTemplate] ${template.featureKey} spec.useDataSource is required when feature is not provided.`);
};

/** 判斷搜尋後是否需要回第一頁 */
const shouldResetPageOnSearch = (template: ClientDataQueryTemplateBase): boolean =>
{
    return template.pagination?.resetPageOnSearch ?? Boolean(template.pagination);
};

/** 將 DataSource 分頁模型轉成共用 Paginator props */
const buildPaginatorProps = (paginator?: ClientDataQueryPaginatorModel | null): PaginatorProps | null =>
{
    if (!paginator) return null;
    return {
        currentPage: paginator.currentPage,
        totalPages: paginator.totalPages,
        onPageChange: paginator.onPageChange,
    };
};

/** 建立 SearchBar model，沒有欄位或明確給 null 時不渲染 */
const buildSearchBarModel = (p: {
    config?: ClientDataQuerySearchBarConfig | null;
    fields: SearchFieldConfig[];
    submittedValues: SearchValues;
    submitSearch: (values: SearchValues) => void;
    resetSearch: () => void;
}): ClientDataQuerySearchBarModel | null =>
{
    if (p.config === null) return null;
    if (p.fields.length === 0) return null;

    return {
        title: p.config?.title ?? "搜尋條件",
        actionAlign: p.config?.actionAlign ?? "left",
        searchButtonText: p.config?.searchButtonText ?? "搜尋",
        resetButtonText: p.config?.resetButtonText ?? "重置",
        columnCount: p.config?.columnCount ?? 3,
        fields: p.fields,
        values: p.submittedValues,
        onSearch: p.submitSearch,
        onReset: p.resetSearch,
    };
};
// #endregion
