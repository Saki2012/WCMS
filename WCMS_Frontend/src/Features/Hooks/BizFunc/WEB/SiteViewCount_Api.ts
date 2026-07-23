import {
    type ApiAdapterError,
    ApiDataAdapter,
    type ApiDataHookGroup,
    type ApiDataLoaderGroup,
    type ApiLoaderData,
    type EffectDeps,
} from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiDataService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useCallback, useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
type SiteViewCountModel = components["schemas"]["SiteViewCountHeader"];
type TryCountSiteViewRequest = components["schemas"]["TryCountSiteViewRequest_DTO"];
export type TryCountDetailViewRequest = components["schemas"]["TryCountDetailViewRequest_DTO"];
type TryCountResult = components["schemas"]["TryCountResult_DTO"];
type GetCurrentSiteOnlineCountResult = components["schemas"]["GetCurrentSiteOnlineCountResult_DTO"];
interface GetRecentlySiteViewCountRequest
{
    SiteIndex?: string | null;
}
type RecentlySiteViewCountArgs = { siteIndex: string; };
type RecentlySiteViewCountLoaderData = ApiLoaderData<RecentlySiteViewCountArgs, GetCurrentSiteOnlineCountResult[]>;
interface ICreateRecentlySiteViewCountLoader
{
    getArgs: (args: LoaderFunctionArgs) => RecentlySiteViewCountArgs;
    getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined;
}
interface IUseRecentlySiteViewCount
{
    siteIndex: string;
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    onError?: (err: ApiAdapterError) => void;
    initial?: RecentlySiteViewCountLoaderData | null;
}
type RecentlySiteViewCountHookResult = {
    data: GetCurrentSiteOnlineCountResult | null;
    result: GetCurrentSiteOnlineCountResult | null;
    count: number;
    list: GetCurrentSiteOnlineCountResult[];
    apiRes: ApiResponse<GetCurrentSiteOnlineCountResult[]> | null;
    isLoading: boolean;
    errorText: string | null;
    refetch: () => Promise<void>;
};
type ExtraLoaders = {
    /** SSR loader：查詢最近 10 分鐘內站台活躍瀏覽人數 */
    createRecentlySiteViewCountLoader: (opt: ICreateRecentlySiteViewCountLoader) => (args: LoaderFunctionArgs) => Promise<RecentlySiteViewCountLoaderData>;
};
type ExtraHooks = {
    /** CSR / Hydration hook：查詢最近 10 分鐘內站台活躍瀏覽人數 */
    useRecentlySiteViewCount: (opt: IUseRecentlySiteViewCount) => RecentlySiteViewCountHookResult;
    /** CSR action：提供前台瀏覽、檔案、連結等計次行為 */
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
// #endregion

// #region Public
export class SiteViewCountService extends ApiDataService<SiteViewCountModel>
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.SiteViewCount, apiInstance);
    }
    /** 計算主站瀏覽次數 */
    public async tryCountSiteView(request: TryCountSiteViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountSiteView`, request));
    }
    /** 計算頁面瀏覽次數 */
    public async tryCountPageView(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountPageView`, request));
    }
    /** 計算檔案預覽次數 */
    public async tryCountFilePreview(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountFilePreview`, request));
    }
    /** 計算檔案下載次數 */
    public async tryCountFileDownload(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountFileDownload`, request));
    }
    /** 計算連結點擊次數 */
    public async tryCountLinkClick(request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult[]>>
    {
        return await this.CallApi<TryCountResult[]>(() => this.Api.post<ApiResponse<TryCountResult[]>>(`${this.Module}/TryCountLinkClick`, request));
    }
    /** 查詢最近 10 分鐘內站台活躍瀏覽人數 */
    public async getRecentlySiteViewCount(request: GetRecentlySiteViewCountRequest): Promise<ApiResponse<GetCurrentSiteOnlineCountResult[]>>
    {
        return await this.CallApi<GetCurrentSiteOnlineCountResult[]>(() =>
            this.Api.post<ApiResponse<GetCurrentSiteOnlineCountResult[]>>(`${this.Module}/GetRecentlySiteViewCount`, request)
        );
    }
    // #endregion
}
export class SiteViewCountAdapterImpl extends ApiDataAdapter<SiteViewCountModel, SiteViewCountService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SiteViewCountModel> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SiteViewCountModel> & ExtraHooks;
    // #endregion

    // #region Protected Virtual
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteViewCountModel>): ApiDataLoaderGroup<SiteViewCountModel> & ExtraLoaders
    {
        const wrapCreateRecentlySiteViewCountLoader: ExtraLoaders["createRecentlySiteViewCountLoader"] = (opt) => this.createRecentlySiteViewCountLoader(opt);
        return { ...base, createRecentlySiteViewCountLoader: wrapCreateRecentlySiteViewCountLoader };
    }
    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteViewCountModel>): ApiDataHookGroup<SiteViewCountModel> & ExtraHooks
    {
        const wrapUseRecentlySiteViewCount: ExtraHooks["useRecentlySiteViewCount"] = (opt) => this.useRecentlySiteViewCount(opt);
        const wrapUseCountActions: ExtraHooks["useCountActions"] = (opt) => this.useCountActions(opt);
        return { ...base, useRecentlySiteViewCount: wrapUseRecentlySiteViewCount, useCountActions: wrapUseCountActions };
    }
    // #endregion

    // #region Protected
    /** loader：建立最近 10 分鐘內站台活躍瀏覽人數查詢 */
    protected createRecentlySiteViewCountLoader: ExtraLoaders["createRecentlySiteViewCountLoader"] = (opt) =>
    {
        return this.createApiLoader<RecentlySiteViewCountArgs, GetCurrentSiteOnlineCountResult[]>({
            action: "SiteViewCount.GetRecentlySiteViewCount",
            getArgs: opt.getArgs,
            call: (svc, args) => svc.getRecentlySiteViewCount(this.buildRecentlySiteViewCountRequest(args.siteIndex)),
            getApiInstance: opt.getApiInstance,
        });
    };
    /** hook：查詢最近 10 分鐘內站台活躍瀏覽人數 */
    protected useRecentlySiteViewCount: ExtraHooks["useRecentlySiteViewCount"] = (opt) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.siteIndex];
        const args = useMemo<RecentlySiteViewCountArgs>(() => ({ siteIndex: opt.siteIndex }), [opt.siteIndex]);
        // 執行 function：CSR / Hydration 共用查詢
        const query = this.useApiQuery<RecentlySiteViewCountArgs, GetCurrentSiteOnlineCountResult[]>({
            action: "SiteViewCount.GetRecentlySiteViewCount",
            args,
            initial: opt.initial ?? null,
            call: (svc, queryArgs) => svc.getRecentlySiteViewCount(this.buildRecentlySiteViewCountRequest(queryArgs.siteIndex)),
            fallbackError: "查詢最近站台瀏覽人數失敗",
            deps,
            onError: opt.onError,
            apiInstance: opt.apiInstance,
        });
        const list = useMemo<GetCurrentSiteOnlineCountResult[]>(() => query.data ?? [], [query.data]);
        const result = useMemo<GetCurrentSiteOnlineCountResult | null>(() => this.getFirstResult(list), [list]);
        const count = useMemo<number>(() => result?.CurrentOnlineCount ?? 0, [result]);
        return { ...query, data: result, result, list, count };
    };
    /** 提供 CSR 使用的統計 actions */
    protected useCountActions: ExtraHooks["useCountActions"] = (opt) =>
    {
        // 宣告變數：計次屬於手動觸發 action，避免 useApiQuery 在 render / deps 變更時自動送出計次。
        const siteViewAction = this.useApiAction<TryCountSiteViewRequest, TryCountResult[]>({
            action: "SiteViewCount.TryCountSiteView",
            fallbackError: "計算主站瀏覽次數失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, request) => svc.tryCountSiteView(request),
        });
        const pageViewAction = this.useApiAction<TryCountDetailViewRequest, TryCountResult[]>({
            action: "SiteViewCount.TryCountPageView",
            fallbackError: "計算頁面瀏覽次數失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, request) => svc.tryCountPageView(request),
        });
        const filePreviewAction = this.useApiAction<TryCountDetailViewRequest, TryCountResult[]>({
            action: "SiteViewCount.TryCountFilePreview",
            fallbackError: "計算檔案預覽次數失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, request) => svc.tryCountFilePreview(request),
        });
        const fileDownloadAction = this.useApiAction<TryCountDetailViewRequest, TryCountResult[]>({
            action: "SiteViewCount.TryCountFileDownload",
            fallbackError: "計算檔案下載次數失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, request) => svc.tryCountFileDownload(request),
        });
        const linkClickAction = this.useApiAction<TryCountDetailViewRequest, TryCountResult[]>({
            action: "SiteViewCount.TryCountLinkClick",
            fallbackError: "計算連結點擊次數失敗",
            apiInstance: opt?.apiInstance,
            call: (svc, request) => svc.tryCountLinkClick(request),
        });
        const isCounting = siteViewAction.isLoading || pageViewAction.isLoading || filePreviewAction.isLoading || fileDownloadAction.isLoading
            || linkClickAction.isLoading;

        /** 計算主站瀏覽次數 */
        const tryCountSiteViewAsync = useCallback(async (siteIndex: string): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const request = this.buildSiteViewRequest(siteIndex);
            const apiRes = await siteViewAction.execute(request);
            return this.normalizeResult(apiRes);
        }, [siteViewAction.execute]);
        /** 計算頁面瀏覽次數 */
        const tryCountPageViewAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const apiRes = await pageViewAction.execute(request);
            return this.normalizeResult(apiRes);
        }, [pageViewAction.execute]);
        /** 計算檔案預覽次數 */
        const tryCountFilePreviewAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const apiRes = await filePreviewAction.execute(request);
            return this.normalizeResult(apiRes);
        }, [filePreviewAction.execute]);
        /** 計算檔案下載次數 */
        const tryCountFileDownloadAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const apiRes = await fileDownloadAction.execute(request);
            return this.normalizeResult(apiRes);
        }, [fileDownloadAction.execute]);
        /** 計算連結點擊次數 */
        const tryCountLinkClickAsync = useCallback(async (request: TryCountDetailViewRequest): Promise<ApiResponse<TryCountResult | null>> =>
        {
            const apiRes = await linkClickAction.execute(request);
            return this.normalizeResult(apiRes);
        }, [linkClickAction.execute]);
        return { isCounting, tryCountSiteViewAsync, tryCountPageViewAsync, tryCountFilePreviewAsync, tryCountFileDownloadAsync, tryCountLinkClickAsync };
    };
    // #endregion

    // #region Private
    /** 建立主站瀏覽 request */
    private buildSiteViewRequest(siteIndex: string): TryCountSiteViewRequest
    {
        return { SiteIndex: siteIndex };
    }
    /** 建立最近瀏覽人數 request */
    private buildRecentlySiteViewCountRequest(siteIndex: string): GetRecentlySiteViewCountRequest
    {
        return { SiteIndex: siteIndex };
    }
    /** 將後端陣列結果轉成單筆結果 */
    private normalizeResult<T>(apiRes: ApiResponse<T[]>): ApiResponse<T | null>
    {
        const first = this.getFirstResult(apiRes.Data);
        return { ...apiRes, Data: first };
    }
    /** 取得第一筆 API 結果 */
    private getFirstResult<T>(data: T[] | null | undefined): T | null
    {
        if (!Array.isArray(data) || data.length === 0) return null;
        return data[0] ?? null;
    }
    // #endregion
}
export const SiteViewCountAdapter = (apiInstance?: AxiosInstance) =>
    new SiteViewCountAdapterImpl((api?: AxiosInstance) => new SiteViewCountService(api ?? apiInstance));
// #endregion
