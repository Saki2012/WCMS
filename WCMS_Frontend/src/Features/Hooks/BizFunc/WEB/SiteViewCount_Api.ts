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
import { useCallback, useMemo, useState } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

type SiteViewCountSet = components["schemas"]["SiteViewCountSet_DTO"];
export type TryCountSiteViewRequest = components["schemas"]["TryCountSiteViewRequest_DTO"];
export type TryCountDetailViewRequest = components["schemas"]["TryCountDetailViewRequest_DTO"];
type TryCountResult = components["schemas"]["TryCountResult_DTO"];
type GetCurrentSiteOnlineCountResult = components["schemas"]["GetCurrentSiteOnlineCountResult_DTO"];

export type TryCountResultDto = TryCountResult;
export type GetCurrentSiteOnlineCountResultDto = GetCurrentSiteOnlineCountResult;

export interface GetRecentlySiteViewCountRequest
{
    SiteIndex?: string | null;
}

export type RecentlySiteViewCountArgs = { siteIndex: string; };
export type RecentlySiteViewCountLoaderData = ApiLoaderData<RecentlySiteViewCountArgs, GetCurrentSiteOnlineCountResult[]>;

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

    /** 查詢最近 10 分鐘內站台活躍瀏覽人數 */
    async getRecentlySiteViewCount(request: GetRecentlySiteViewCountRequest): Promise<ApiResponse<GetCurrentSiteOnlineCountResult[]>>
    {
        return await this.CallApi<GetCurrentSiteOnlineCountResult[]>(() =>
            this.Api.post<ApiResponse<GetCurrentSiteOnlineCountResult[]>>(`${this.Module}/GetRecentlySiteViewCount`, request)
        );
    }
    // #endregion
}

export class SiteViewCountAdapterImpl extends ApiDataAdapter<SiteViewCountSet, SiteViewCountService>
{
    // #region Property
    declare public loader: ApiDataLoaderGroup<SiteViewCountSet> & ExtraLoaders;
    declare public hooks: ApiDataHookGroup<SiteViewCountSet> & ExtraHooks;
    // #endregion

    // #region Protect Virtual Func
    protected override buildExtendedLoader(base: ApiDataLoaderGroup<SiteViewCountSet>): ApiDataLoaderGroup<SiteViewCountSet> & ExtraLoaders
    {
        const wrapCreateRecentlySiteViewCountLoader: ExtraLoaders["createRecentlySiteViewCountLoader"] = (opt) =>
        {
            return this.createRecentlySiteViewCountLoader(opt);
        };

        return { ...base, createRecentlySiteViewCountLoader: wrapCreateRecentlySiteViewCountLoader };
    }

    protected override buildExtendedHooks(base: ApiDataHookGroup<SiteViewCountSet>): ApiDataHookGroup<SiteViewCountSet> & ExtraHooks
    {
        const wrapUseRecentlySiteViewCount: ExtraHooks["useRecentlySiteViewCount"] = (opt) =>
        {
            return this.useRecentlySiteViewCount(opt);
        };

        const wrapUseCountActions: ExtraHooks["useCountActions"] = (opt) =>
        {
            return this.useCountActions(opt);
        };

        return { ...base, useRecentlySiteViewCount: wrapUseRecentlySiteViewCount, useCountActions: wrapUseCountActions };
    }
    // #endregion

    // #region Loader Func
    /** loader：建立最近 10 分鐘內站台活躍瀏覽人數查詢 */
    private createRecentlySiteViewCountLoader: ExtraLoaders["createRecentlySiteViewCountLoader"] = (opt) =>
    {
        return this.createApiLoader<RecentlySiteViewCountArgs, GetCurrentSiteOnlineCountResult[]>({
            action: "SiteViewCount.GetRecentlySiteViewCount",
            getArgs: opt.getArgs,
            call: (svc, args) => svc.getRecentlySiteViewCount(this.buildRecentlySiteViewCountRequest(args.siteIndex)),
            getApiInstance: opt.getApiInstance,
        });
    };
    // #endregion

    // #region Hook Func
    /** hook：查詢最近 10 分鐘內站台活躍瀏覽人數 */
    private useRecentlySiteViewCount: ExtraHooks["useRecentlySiteViewCount"] = (opt) =>
    {
        // 宣告變數
        const deps = opt.deps ?? [opt.siteIndex];
        const args = useMemo<RecentlySiteViewCountArgs>(() =>
        {
            return { siteIndex: opt.siteIndex };
        }, [opt.siteIndex]);

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

        const list = useMemo<GetCurrentSiteOnlineCountResult[]>(() =>
        {
            return query.data ?? [];
        }, [query.data]);

        const result = useMemo<GetCurrentSiteOnlineCountResult | null>(() =>
        {
            return this.getFirstResult(list);
        }, [list]);

        const count = useMemo<number>(() =>
        {
            return result?.CurrentOnlineCount ?? 0;
        }, [result]);

        // return
        return { ...query, data: result, result, list, count };
    };

    /** 提供 CSR 使用的統計 actions */
    private useCountActions: ExtraHooks["useCountActions"] = (opt) =>
    {
        // 宣告變數
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

        // return
        return { isCounting, tryCountSiteViewAsync, tryCountPageViewAsync, tryCountFilePreviewAsync, tryCountFileDownloadAsync, tryCountLinkClickAsync };
    };
    // #endregion

    // #region Private Helper
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
