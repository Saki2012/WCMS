import { ApiDataAdapter, type ApiDataHookGroup, type ApiDataLoaderGroup } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo, useState } from "react";

type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];
export type TryCountSiteViewRequest = components["schemas"]["TryCountSiteViewRequest_DTO"];
export type TryCountDetailViewRequest = components["schemas"]["TryCountDetailViewRequest_DTO"];
type TryCountResult = components["schemas"]["TryCountResult_DTO"];
export interface TryCountResultDto
{
    IsCounted?: boolean | null;
    CurrentCount?: number | null;
}

export class SiteViewCountService extends ApiDataService<SiteViewCountSet>
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SiteViewCount, apiInstance);
    }
    // #endregion

    // #region API Func
    /** 計算主站瀏覽次數 */
    async tryCountSiteView(request: TryCountSiteViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountSiteView`, request));
    }
    /** 計算頁面瀏覽次數 */
    async tryCountPageView(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountPageView`, request));
    }
    /** 計算檔案預覽次數 */
    async tryCountFilePreview(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountFilePreview`, request));
    }
    /** 計算檔案下載次數 */
    async tryCountFileDownload(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountFileDownload`, request));
    }
    /** 計算連結點擊次數 */
    async tryCountLinkClick(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountLinkClick`, request));
    }
    // #endregion
}

type ExtraHooks = {
    useCountActions: (
        opt?: { apiInstance?: AxiosInstance; },
    ) => {
        isCounting: boolean;
        tryCountSiteViewAsync: (siteIndex: string) => Promise<ApiResponse<TryCountResult | null>>;
        tryCountPageViewAsync: (request: TryCountDetailViewRequest) => Promise<ApiResponse<TryCountResult | null>>;
        tryCountFilePreviewAsync: (request: TryCountDetailViewRequest) => Promise<ApiResponse<TryCountResult | null>>;
        tryCountFileDownloadAsync: (request: TryCountDetailViewRequest) => Promise<ApiResponse<TryCountResult | null>>;
        tryCountLinkClickAsync: (request: TryCountDetailViewRequest) => Promise<ApiResponse<TryCountResult | null>>;
    };
};

export class SiteViewCountAdapterImpl extends ApiDataAdapter<SiteViewCountSet, SiteViewCountService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SiteViewCountSet>;
    declare public hooks: ApiDataHookGroup<SiteViewCountSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteViewCountSet>): ApiDataLoaderGroup<SiteViewCountSet>
    {
        return base;
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteViewCountSet>): ApiDataHookGroup<SiteViewCountSet> & ExtraHooks
    {
        const wrapUseCountActions: ExtraHooks["useCountActions"] = (opt) =>
        {
            return this.useCountActions(opt);
        };
        const merged: ApiDataHookGroup<SiteViewCountSet> & ExtraHooks = { ...base, useCountActions: wrapUseCountActions };
        return merged;
    }
    // #endregion

    // #region Hook Func
    /** 提供 CSR 使用的統計 actions */
    private useCountActions: ExtraHooks["useCountActions"] = (opt) =>
    {
        const [isCounting, setIsCounting] = useState<boolean>(false);
        const svc = useMemo(() => new SiteViewCountService(opt?.apiInstance), [opt?.apiInstance]);
        /** 包裝 count API 執行流程 */
        const runCountAsync = useCallback(async (callApi: () => Promise<ApiResponse<TryCountResult[]>>): Promise<ApiResponse<TryCountResult | null>> =>
        {
            setIsCounting(true);
            try
            {
                const apiRes = await callApi();
                return this.normalizeResult(apiRes);
            } finally
            {
                setIsCounting(false);
            }
        }, []);
        /** 計算主站瀏覽次數 */
        const tryCountSiteViewAsync = useCallback(async (siteIndex: string): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const request = this.buildSiteViewRequest(siteIndex);
            return await runCountAsync(() => svc.tryCountSiteView(request));
        }, [runCountAsync, svc]);
        /** 計算頁面瀏覽次數 */
        const tryCountPageViewAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            return await runCountAsync(() => svc.tryCountPageView(request));
        }, [runCountAsync, svc]);

        /** 計算檔案預覽次數 */
        const tryCountFilePreviewAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            return await runCountAsync(() => svc.tryCountFilePreview(request));
        }, [runCountAsync, svc]);

        /** 計算檔案下載次數 */
        const tryCountFileDownloadAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            return await runCountAsync(() => svc.tryCountFileDownload(request));
        }, [runCountAsync, svc]);

        /** 計算連結點擊次數 */
        const tryCountLinkClickAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            return await runCountAsync(() => svc.tryCountLinkClick(request));
        }, [runCountAsync, svc]);
        return { isCounting, tryCountSiteViewAsync, tryCountPageViewAsync, tryCountFilePreviewAsync, tryCountFileDownloadAsync, tryCountLinkClickAsync };
    };
    // #endregion

    // #region Private Helper
    /** 建立主站瀏覽 request */
    private buildSiteViewRequest(siteIndex: string): TryCountSiteViewRequest
    {
        return { SiteIndex: siteIndex };
    }
    /** 將後端陣列結果轉成單筆結果 */
    private normalizeResult(apiRes: ApiResponse<TryCountResult[]>): ApiResponse<TryCountResult | null>
    {
        const first = this.getFirstResult(apiRes.Data);
        return { ...apiRes, Data: first };
    }
    /** 取得第一筆統計結果 */
    private getFirstResult(data: TryCountResult[] | null | undefined): TryCountResult | null
    {
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0] ?? null;
    }
    // #endregion
}

export const SiteViewCountAdapter = (apiInstance?: AxiosInstance) =>
    new SiteViewCountAdapterImpl((api?: AxiosInstance) => new SiteViewCountService(api ?? apiInstance));
