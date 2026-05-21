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

    /** 在 Feature 查詢參數基礎上追加或覆寫 Spec 查詢參數 */
    toSearchParams?: (values: SearchValues, featureParams: TSearchParams) => TSearchParams;

    /** 建立 Spec 追加的搜尋條件 */
    buildSearchConditions?: (ctx: ServerListGridConditionContext<TSearchParams>) => ServerListCondition[];

    /** 在 Feature QueryParam 基礎上追加或覆寫完整 QueryParam */
    buildQueryParam?: (ctx: ServerListGridQueryContext<TSearchParams>, featureQueryParam: TQueryParam) => TQueryParam;

    /** 在 Feature GridProps 基礎上追加或覆寫 GridProps */
    buildGridProps?: (ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>, featureGridProps: GridProps) => GridProps;
}

export interface ServerListGridSpecOnlyTiming<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** Spec 純客製 SearchBar 欄位設定 */
    searchFields?: SearchFieldConfig[];

    /** 依資料來源動態建立 Spec 純客製 SearchBar 欄位 */
    buildSearchFields?: (ctx: ServerListGridSearchFieldContext<TRawData, TAdapter>) => SearchFieldConfig[];

    /** 將 SearchValues 轉換為 Spec 純客製查詢參數 */
    toSearchParams?: (values: SearchValues) => TSearchParams;

    /** 建立 Spec 純客製搜尋條件 */
    buildSearchConditions?: (ctx: ServerListGridConditionContext<TSearchParams>) => ServerListCondition[];

    /** 建立完整 QueryParam，包含欄位、條件、排序與分頁等設定 */
    buildQueryParam: (ctx: ServerListGridQueryContext<TSearchParams>) => TQueryParam;

    /** 執行資料來源 Hook，通常用來呼叫 adapter.hooks.useQueryGridData */
    useDataSource: (ctx: ServerListGridDataSourceContext<TSearchParams, TQueryParam>) => ServerListGridDataSourceResult<TRawData, TAdapter>;

    /** 將資料來源結果轉換為 GridProps */
    buildGridProps: (ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>) => GridProps;
}

export interface ServerListGridFeatureTemplate<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** 功能識別碼，通常對應 Feature 或 SpecFeature 名稱 */
    featureKey: string;

    /** Feature 基礎 ListGrid 流程設定 */
    feature: ServerListGridFeatureTiming<TSearchParams, TRawData, TAdapter, TQueryParam>;

    /** Spec 客製 ListGrid 流程設定 */
    spec?: ServerListGridSpecTiming<TSearchParams, TRawData, TAdapter, TQueryParam>;
}

export interface ServerListGridSpecOnlyTemplate<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam>
{
    /** 功能識別碼，通常對應 SpecFeature 名稱 */
    featureKey: string;

    /** 純 Spec 客製時不提供 Feature 流程 */
    feature?: undefined;

    /** Spec 純客製 ListGrid 流程設定 */
    spec: ServerListGridSpecOnlyTiming<TSearchParams, TRawData, TAdapter, TQueryParam>;
}

export type ServerListGridTemplate<TSearchParams, TRawData, TAdapter = unknown, TQueryParam = QueryListParam> =
    | ServerListGridFeatureTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>
    | ServerListGridSpecOnlyTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>;

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

/** 判斷目前是否為 Feature 套裝流程 */
const hasFeatureTiming = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
): template is ServerListGridFeatureTemplate<TSearchParams, TRawData, TAdapter, TQueryParam> =>
{
    return template.feature !== undefined;
};

/** 建立 Feature 或純 Spec 對應的 SearchParams */
const buildTemplateSearchParams = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    submittedValues: SearchValues,
): TSearchParams =>
{
    if (hasFeatureTiming(template))
    {
        const featureParams = template.feature.toSearchParams?.(submittedValues) ?? ({} as TSearchParams);
        return template.spec?.toSearchParams?.(submittedValues, featureParams) ?? featureParams;
    }

    return template.spec.toSearchParams?.(submittedValues) ?? ({} as TSearchParams);
};

/** 建立 Feature 與 Spec 的搜尋條件，執行順序固定為 Feature 先、Spec 後 */
const buildTemplateSearchConditions = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridConditionContext<TSearchParams>,
): string[] =>
{
    const list = hasFeatureTiming(template)
        ? [...(template.feature.buildSearchConditions?.(ctx) ?? []), ...(template.spec?.buildSearchConditions?.(ctx) ?? [])]
        : [...(template.spec.buildSearchConditions?.(ctx) ?? [])];

    return list.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
};

/** 建立完整 QueryParam，Feature + Spec 時由 Spec 包裝 Feature 結果；純 Spec 時由 Spec 直接回傳完整 QueryParam */
const buildTemplateQueryParam = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridQueryContext<TSearchParams>,
): TQueryParam =>
{
    if (hasFeatureTiming(template))
    {
        const featureQueryParam = template.feature.buildQueryParam(ctx);
        return template.spec?.buildQueryParam?.(ctx, featureQueryParam) ?? featureQueryParam;
    }

    return template.spec.buildQueryParam(ctx);
};

/** 建立 SearchBar 欄位，Feature 欄位先放，Spec 欄位後追加 */
const buildTemplateSearchFields = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridSearchFieldContext<TRawData, TAdapter>,
): SearchFieldConfig[] =>
{
    if (hasFeatureTiming(template))
    {
        const featureFields = template.feature.buildSearchFields?.(ctx) ?? template.feature.searchFields ?? [];
        const specFields = template.spec?.buildSearchFields?.(ctx) ?? template.spec?.searchFields ?? [];

        return [...featureFields, ...specFields];
    }

    return template.spec.buildSearchFields?.(ctx) ?? template.spec.searchFields ?? [];
};

/** 建立 GridProps，Feature + Spec 時由 Spec 包裝 Feature 結果；純 Spec 時由 Spec 直接建立 GridProps */
const buildTemplateGridProps = <TSearchParams, TRawData, TAdapter, TQueryParam>(
    template: ServerListGridTemplate<TSearchParams, TRawData, TAdapter, TQueryParam>,
    ctx: ServerListGridBuildGridContext<TSearchParams, TRawData, TAdapter, TQueryParam>,
): GridProps =>
{
    if (hasFeatureTiming(template))
    {
        const featureGridProps = template.feature.buildGridProps(ctx);
        return template.spec?.buildGridProps?.(ctx, featureGridProps) ?? featureGridProps;
    }

    return template.spec.buildGridProps(ctx);
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
    const dataSource = hasFeatureTiming(template)
        ? template.feature.useDataSource(dataSourceContext)
        : template.spec.useDataSource(dataSourceContext);

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
