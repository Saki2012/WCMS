import type { GridProps } from "@/SysCore/Components/Grid/Grid_Data";
import type { SearchFieldConfig, SearchValues } from "@/SysCore/Components/SearchBar/SearchBar_Data";
import type { components } from "@/types/api";
import { useCallback, useMemo, useState } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
type ServerListCondition = string | null | undefined;

export interface ServerListGridConditionContext<TSearchParams>
{
    /** SearchBar 送出後的原始搜尋值 */
    searchValues: SearchValues;

    /** 由 searchValues 轉換後的功能專用查詢參數 */
    searchParams: TSearchParams;
}

export interface ServerListGridQueryContext<TSearchParams>
{
    /** SearchBar 送出後的原始搜尋值 */
    searchValues: SearchValues;

    /** 由 searchValues 轉換後的功能專用查詢參數 */
    searchParams: TSearchParams;

    /** Feature 與 Spec 共同組出的搜尋條件清單 */
    searchConditions: string[];

    /** 將 searchConditions 以 And 串接後的搜尋條件字串 */
    searchCondition: string;
}

export interface ServerListGridDataSourceContext<TSearchParams, TQueryParam = QueryListParam> extends ServerListGridQueryContext<TSearchParams>
{
    /** 完整 QueryListParam 或功能自定義 QueryParam */
    queryParam: TQueryParam;
}

export interface ServerListGridSearchFieldContext<TRawData, TAdapter>
{
    /** useDataSource 回傳的原始資料 */
    rawData: TRawData;

    /** useDataSource 回傳的 adapter 或輔助物件 */
    adapter?: TAdapter;

    /** SearchBar 目前已送出的搜尋值 */
    submittedValues: SearchValues;
}

export interface ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam = QueryListParam>
    extends ServerListGridDataSourceContext<TSearchParams, TQueryParam>
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

export interface ServerListGridDataSourceResult<TRawData, TAdapter = unknown>
{
    /** 可選的 adapter 或輔助物件，提供 buildGridProps 後續使用 */
    adapter?: TAdapter;

    /** 查詢後的原始資料 */
    rawData: TRawData;

    /** 資料是否載入中 */
    isLoading: boolean;

    /** 資料來源回傳的錯誤訊息集合 */
    errors: (string | null | undefined)[];

    /** 重新查詢主資料 */
    refetchData?: () => Promise<void> | void;

    /** 重新查詢參照資料 */
    refetchRefData?: () => Promise<void> | void;
}

export interface ServerListGridFeatureTiming<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** Feature 基礎 SearchBar 欄位設定 */
    searchFields?: SearchFieldConfig[];

    /** 依資料來源動態建立 Feature SearchBar 欄位 */
    buildSearchFields?: (ctx: ServerListGridSearchFieldContext<TRawData, TAdapter>) => SearchFieldConfig[];

    /** 將 SearchValues 轉換為 Feature 查詢參數 */
    toSearchParams?: (values: SearchValues) => TSearchParams;

    /** 建立 Feature 搜尋條件 */
    buildSearchConditions?: (ctx: ServerListGridConditionContext<TSearchParams>) => ServerListCondition[];

    /** 建立完整 QueryParam，包含欄位、條件、排序與分頁等設定 */
    buildQueryParam: (ctx: ServerListGridQueryContext<TSearchParams>) => TQueryParam;

    /** 執行資料來源 Hook，通常用來呼叫 adapter.hooks.useQueryGridData */
    useDataSource: (ctx: ServerListGridDataSourceContext<TSearchParams, TQueryParam>) => ServerListGridDataSourceResult<TRawData, TAdapter>;

    /** 將資料來源結果轉換為 GridProps */
    buildGridProps: (ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>) => GridProps;
}

export interface ServerListGridSpecTiming<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** Spec 追加的 SearchBar 欄位設定 */
    searchFields?: SearchFieldConfig[];

    /** 依資料來源動態建立 Spec SearchBar 欄位 */
    buildSearchFields?: (ctx: ServerListGridSearchFieldContext<TRawData, TAdapter>) => SearchFieldConfig[];

    /** 在目前查詢參數基礎上追加或覆寫 Spec 查詢參數 */
    toSearchParams?: (values: SearchValues, currentParams: TSearchParams) => TSearchParams;

    /** 建立 Spec 追加的搜尋條件 */
    buildSearchConditions?: (ctx: ServerListGridConditionContext<TSearchParams>) => ServerListCondition[];

    /** 建立或覆寫完整 QueryParam，Feature 存在時可包裝 Feature 結果 */
    buildQueryParam?: (ctx: ServerListGridQueryContext<TSearchParams>, featureQueryParam?: TQueryParam) => TQueryParam;

    /** Spec Only 時執行資料來源 Hook；Feature 存在時預設仍走 Feature useDataSource */
    useDataSource?: (ctx: ServerListGridDataSourceContext<TSearchParams, TQueryParam>) => ServerListGridDataSourceResult<TRawData, TAdapter>;

    /** 建立或覆寫 GridProps，Feature 存在時可包裝 Feature 結果 */
    buildGridProps?: (ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>, featureGridProps?: GridProps) => GridProps;
}

/** 後台 ListGrid Template，feature / spec 皆為可選入口，但至少需提供其中一個 */
export interface ServerListGridTemplate<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** 功能識別碼，通常對應 Feature 或 SpecFeature 名稱 */
    featureKey: string;

    /** Feature 基礎 ListGrid 流程，可選 */
    feature?: ServerListGridFeatureTiming<TSearchParams, TRawData, TAdapter, TQueryParam>;

    /** Spec 客製 ListGrid 流程，可選 */
    spec?: ServerListGridSpecTiming<TSearchParams, TRawData, TAdapter, TQueryParam>;
}

export interface ServerListGridTemplateViewModel<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** 功能識別碼 */
    featureKey: string;

    /** 最終給 SearchBar 渲染的欄位設定 */
    searchFields: SearchFieldConfig[];

    /** SearchBar 已送出的搜尋值 */
    submittedValues: SearchValues;

    /** 已轉換完成的功能查詢參數 */
    searchParams: TSearchParams;

    /** Feature 與 Spec 組出的搜尋條件清單 */
    searchConditions: string[];

    /** searchConditions 串接後的搜尋條件字串 */
    searchCondition: string;

    /** 完整 QueryParam */
    queryParam: TQueryParam;

    /** useDataSource 回傳的 adapter 或輔助物件 */
    adapter?: TAdapter;

    /** useDataSource 回傳的原始資料 */
    rawData: TRawData;

    /** 最終給 Grid 使用的資料與設定 */
    gridData: GridProps;

    /** 資料是否載入中 */
    isLoading: boolean;

    /** 統一整理後的錯誤訊息 */
    errors: string[];

    /** 送出 SearchBar 搜尋值 */
    submitSearch: (values: SearchValues) => void;

    /** 清除 SearchBar 搜尋值 */
    resetSearch: () => void;

    /** 重新查詢主資料 */
    refetchData: () => Promise<void>;

    /** 重新查詢參照資料 */
    refetchRefData: () => Promise<void>;
}

/** 判斷目前是否有 Feature timing */
const hasFeatureTiming = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
): boolean =>
{
    return template.feature !== undefined;
};

/** 判斷目前是否有 Spec timing */
const hasSpecTiming = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
): boolean =>
{
    return template.spec !== undefined;
};

/** 檢查 Template 至少要提供 Feature 或 Spec 其中一個 timing */
const ensureTemplateTiming = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
): void =>
{
    if (hasFeatureTiming(template) || hasSpecTiming(template)) return;
    throw new Error(`[ServerListGridTemplate] ${template.featureKey} must provide feature or spec timing.`);
};

/** 建立 Feature / Spec 對應的 SearchParams，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSearchParams = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    submittedValues: SearchValues,
): TSearchParams =>
{
    ensureTemplateTiming(template);

    const featureParams = template.feature?.toSearchParams?.(submittedValues) ?? ({} as TSearchParams);
    return template.spec?.toSearchParams?.(submittedValues, featureParams) ?? featureParams;
};

/** 建立 Feature 與 Spec 的搜尋條件，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSearchConditions = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridConditionContext<TSearchParams>,
): string[] =>
{
    const list = [
        ...(template.feature?.buildSearchConditions?.(ctx) ?? []),
        ...(template.spec?.buildSearchConditions?.(ctx) ?? []),
    ];

    return list.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

/** 建立完整 QueryParam，Feature 存在時由 Spec 包裝 Feature 結果 */
const buildTemplateQueryParam = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridQueryContext<TSearchParams>,
): TQueryParam =>
{
    const featureQueryParam = template.feature?.buildQueryParam(ctx);
    if (featureQueryParam !== undefined) return template.spec?.buildQueryParam?.(ctx, featureQueryParam) ?? featureQueryParam;
    if (template.spec?.buildQueryParam) return template.spec.buildQueryParam(ctx);

    throw new Error(`[ServerListGridTemplate] ${template.featureKey} spec.buildQueryParam is required when feature is not provided.`);
};

/** 建立 SearchBar 欄位，Feature 欄位先放，Spec 欄位後追加 */
const buildTemplateSearchFields = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridSearchFieldContext<TRawData, TAdapter>,
): SearchFieldConfig[] =>
{
    const featureFields = template.feature?.buildSearchFields?.(ctx) ?? template.feature?.searchFields ?? [];
    const specFields = template.spec?.buildSearchFields?.(ctx) ?? template.spec?.searchFields ?? [];

    return [...featureFields, ...specFields];
};

/** 建立 GridProps，Feature 存在時由 Spec 包裝 Feature 結果 */
const buildTemplateGridProps = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>,
): GridProps =>
{
    const featureGridProps = template.feature?.buildGridProps(ctx);
    if (featureGridProps !== undefined) return template.spec?.buildGridProps?.(ctx, featureGridProps) ?? featureGridProps;
    if (template.spec?.buildGridProps) return template.spec.buildGridProps(ctx);

    throw new Error(`[ServerListGridTemplate] ${template.featureKey} spec.buildGridProps is required when feature is not provided.`);
};

/** 執行資料來源 Hook，Feature 存在時以 Feature 為主，Spec Only 時走 Spec */
const useTemplateDataSource = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridDataSourceContext<TSearchParams, TQueryParam>,
): ServerListGridDataSourceResult<TRawData, TAdapter> =>
{
    if (template.feature) return template.feature.useDataSource(ctx);
    if (template.spec?.useDataSource) return template.spec.useDataSource(ctx);

    throw new Error(`[ServerListGridTemplate] ${template.featureKey} spec.useDataSource is required when feature is not provided.`);
};

/** 後台 ListGrid 共用流程：支援 Feature Only、Feature + Spec、Spec Only 三種情境 */
export const useServerListGridTemplate = <TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
): ServerListGridTemplateViewModel<TSearchParams, TRawData, TAdapter, TQueryParam> =>
{
    const [submittedValues, setSubmittedValues] = useState<SearchValues>({});

    const searchParams = useMemo<TSearchParams>(() =>
    {
        return buildTemplateSearchParams(template, submittedValues);
    }, [template, submittedValues]);

    const searchConditions = useMemo<string[]>(() =>
    {
        return buildTemplateSearchConditions(template, { searchValues: submittedValues, searchParams });
    }, [template, submittedValues, searchParams]);

    const searchCondition = useMemo<string>(() =>
    {
        return searchConditions.join(" And ");
    }, [searchConditions]);

    const queryParam = useMemo<TQueryParam>(() =>
    {
        const ctx: ServerListGridQueryContext<TSearchParams> = { searchValues: submittedValues, searchParams, searchConditions, searchCondition };
        return buildTemplateQueryParam(template, ctx);
    }, [template, submittedValues, searchParams, searchConditions, searchCondition]);

    const dataSourceContext: ServerListGridDataSourceContext<TSearchParams, TQueryParam> = {
        searchValues: submittedValues,
        searchParams,
        searchConditions,
        searchCondition,
        queryParam,
    };
    const dataSource = useTemplateDataSource(template, dataSourceContext);

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
        const ctx: ServerListGridSearchFieldContext<TRawData, TAdapter> = { rawData: dataSource.rawData, adapter: dataSource.adapter, submittedValues };
        return buildTemplateSearchFields(template, ctx);
    }, [template, dataSource.rawData, dataSource.adapter, submittedValues]);

    const gridData = useMemo<GridProps>(() =>
    {
        const ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam> = {
            searchValues: submittedValues,
            searchParams,
            searchConditions,
            searchCondition,
            queryParam,
            rawData: dataSource.rawData,
            adapter: dataSource.adapter,
            refetchData,
            refetchRefData,
        };

        return buildTemplateGridProps(template, ctx);
    }, [
        template,
        submittedValues,
        searchParams,
        searchConditions,
        searchCondition,
        queryParam,
        dataSource.rawData,
        dataSource.adapter,
        refetchData,
        refetchRefData,
    ]);

    const errors = useMemo<string[]>(() =>
    {
        return (dataSource.errors ?? []).filter((item): item is string => Boolean(item));
    }, [dataSource.errors]);

    return {
        featureKey: template.featureKey,
        searchFields,
        submittedValues,
        searchParams,
        searchConditions,
        searchCondition,
        queryParam,
        adapter: dataSource.adapter,
        rawData: dataSource.rawData,
        gridData,
        isLoading: Boolean(dataSource.isLoading),
        errors,
        submitSearch: setSubmittedValues,
        resetSearch: () => setSubmittedValues({}),
        refetchData,
        refetchRefData,
    };
};
