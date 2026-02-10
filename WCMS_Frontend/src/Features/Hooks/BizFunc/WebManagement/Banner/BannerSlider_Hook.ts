import { BannerSliderAdapter } from "@/Features/Hooks/BizFunc/WebManagement/Banner/BannerSlider_Api";
import type { ApiLoaderData } from "@/SysCore/Utils/API/APIAdapter";
import type { components } from "@/types/api";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";

type QueryListParam = components["schemas"]["QueryListParam"];
export type BannerSet = components["schemas"]["BannerSet_DTO"];
// 應該是作為Loader，暫時先擺一旁
/** 建立 Banner QueryListParam（前台通常希望拿完整 Set，所以 Fields 不指定） */
export const buildBannerQueryListParam = (
    condition: string,
    opt?: { pageNumber?: number; pageSize?: number; },
): QueryListParam =>
{
    // 宣告變數
    const pageNumber = opt?.pageNumber ?? 0;
    const pageSize = opt?.pageSize ?? 0;

    // return
    return {
        Condition: condition,
        PageNumber: pageNumber,
        PageSize: pageSize,
    };
};

/** SSR 用：Banner QueryList loader（回傳 ApiLoaderData，可直接當 hook 的 initial） */
export const createBannerQueryListLoader = (opt: { condition: string; apiInstance?: AxiosInstance; }) =>
{
    // 宣告變數
    const adapter = BannerSliderAdapter(opt.apiInstance);
    const loader = adapter.loader.createQueryListLoader({
        getApiInstance: () => opt.apiInstance,
        getCondition: () => buildBannerQueryListParam(opt.condition),
    });

    // return
    return loader;
};

/** CSR/SSR 共用：用 QueryList 取得第一筆 BannerSet（支援 initial） */
export const useBannerSetByCondition = (opt: {
    condition: string;
    initial?: ApiLoaderData<QueryListParam, BannerSet[]> | null;
    deps?: ReadonlyArray<string | number | boolean | object | null | undefined>;
    apiInstance?: AxiosInstance;
}) =>
{
    // 宣告變數
    const adapter = useMemo(() => BannerSliderAdapter(opt.apiInstance), [opt.apiInstance]);
    const deps = opt.deps ?? [opt.condition];

    // 執行 function
    const query = adapter.hooks.useQueryList({
        condition: buildBannerQueryListParam(opt.condition, { pageNumber: 0, pageSize: 1 }),
        initial: opt.initial ?? null,
        deps,
        apiInstance: opt.apiInstance,
    });

    const first = query.data?.[0] ?? null;

    // return
    return {
        data: first,
        apiRes: query.apiRes,
        isLoading: query.isLoading,
        errorText: query.errorText,
        refetch: query.refetch,
    };
};

/** SSR 用：Banner QueryData loader（internalId 已知時） */
export const createBannerQueryDataLoader = (opt: { internalId: string; apiInstance?: AxiosInstance; }) =>
{
    // 宣告變數
    const adapter = BannerSliderAdapter(opt.apiInstance);
    const loader = adapter.loader.createQueryDataLoader({
        getApiInstance: () => opt.apiInstance,
        getInternalId: () => opt.internalId,
    });

    // return
    return loader;
};

/** CSR/SSR 共用：已知 internalId 時，直接 QueryData（支援 initial） */
export const useBannerSetByInternalId = (opt: {
    internalId: string;
    initial?: ApiLoaderData<string, BannerSet> | null;
    deps?: ReadonlyArray<string | number | boolean | object | null | undefined>;
    apiInstance?: AxiosInstance;
}) =>
{
    // 宣告變數
    const adapter = useMemo(() => BannerSliderAdapter(opt.apiInstance), [opt.apiInstance]);
    const deps = opt.deps ?? [opt.internalId];

    // 執行 function
    const query = adapter.hooks.useQueryData({
        internalId: opt.internalId,
        initial: opt.initial ?? null,
        deps,
        apiInstance: opt.apiInstance,
    });

    // return
    return {
        data: query.data,
        env: query.apiRes,
        isLoading: query.isLoading,
        errorText: query.errorText,
        refetch: query.refetch,
    };
};
