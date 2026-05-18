import { ApiBaseAdapter, type ApiAdapterError, type ApiLoaderData, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiBaseService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

const TurnstileProvider = "Turnstile";

export type CaptchaPublicConfig = components["schemas"]["CaptchaPublicConfig_DTO"];
export type CaptchaPublicConfigResult = CaptchaPublicConfig | null;
export type CaptchaRenderState = "disabled" | "ready" | "missingSiteKey" | "unsupportedProvider";
export type CaptchaPublicConfigLoaderData = ApiLoaderData<null, CaptchaConfigViewModel>;

export interface CaptchaConfigViewModel
{
    isEnabled: boolean;
    provider: string;
    siteKey: string;
    isTurnstile: boolean;
    canRender: boolean;
    renderState: CaptchaRenderState;
    messageText: string | null;
}

export type CaptchaLoaderGroup = {
    /** SSR / Loader：取得前台驗證碼公開設定 */
    getPublicConfigLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<CaptchaPublicConfigLoaderData>;
};

export type CaptchaHookGroup = {
    /** CSR Hook：取得前台驗證碼公開設定 */
    usePublicConfig: (
        opt?: { apiInstance?: AxiosInstance; deps?: EffectDeps; initial?: CaptchaPublicConfigLoaderData | null; onError?: (err: ApiAdapterError) => void; },
    ) => {
        config: CaptchaConfigViewModel;
        apiRes: ApiResponse<CaptchaConfigViewModel> | null;
        isLoading: boolean;
        errorText: string | null;
        refetch: () => Promise<void>;
    };
};

/** Captcha 系統功能 API，不走資料表型 ApiDataService */
export class CaptchaService extends ApiBaseService
{
    // #region Construct
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Captcha, apiInstance);
    }
    // #endregion

    // #region API Func
    /** 取得前台驗證碼公開設定 */
    async publicGetConfig(): Promise<ApiResponse<CaptchaPublicConfig[]>>
    {
        return await this.CallApi<CaptchaPublicConfig[]>(() => this.Api.get<ApiResponse<CaptchaPublicConfig[]>>(`${this.Module}/Public_GetConfig`));
    }

    /** 取得前台驗證碼公開設定第一筆 */
    async publicGetConfigData(): Promise<ApiResponse<CaptchaPublicConfigResult>>
    {
        const apiRes = await this.publicGetConfig();
        return this.normalizePublicConfig(apiRes);
    }
    // #endregion

    // #region Private Helper
    /** 將後端陣列 Data 轉成單筆設定 */
    private normalizePublicConfig(apiRes: ApiResponse<CaptchaPublicConfig[]>): ApiResponse<CaptchaPublicConfigResult>
    {
        const first = Array.isArray(apiRes.Data) ? apiRes.Data[0] ?? null : null;
        return { ...apiRes, Data: first };
    }
    // #endregion
}

/** 建立 Captcha 預設 ViewModel */
export const createDefaultCaptchaConfig = (): CaptchaConfigViewModel =>
{
    return { isEnabled: false, provider: "", siteKey: "", isTurnstile: false, canRender: false, renderState: "disabled", messageText: null };
};

/** 將 Captcha 後端 DTO 轉成前端 ViewModel */
export const toCaptchaConfigViewModel = (config: CaptchaPublicConfigResult): CaptchaConfigViewModel =>
{
    const isEnabled = config?.Enabled === true;
    const provider = (config?.Provider ?? "").trim();
    const siteKey = (config?.SiteKey ?? "").trim();
    const isTurnstile = provider.toLowerCase() === TurnstileProvider.toLowerCase();
    const renderState = getCaptchaRenderState({ isEnabled, isTurnstile, siteKey });

    return {
        isEnabled,
        provider,
        siteKey,
        isTurnstile,
        canRender: renderState === "ready",
        renderState,
        messageText: getCaptchaMessageText(renderState, provider),
    };
};

/** Captcha API Adapter：集中提供 Loader / Hook 與 DTO 轉換 */
export class CaptchaAdapterImpl extends ApiBaseAdapter<CaptchaService>
{
    // #region Property
    public readonly loader: CaptchaLoaderGroup;
    public readonly hooks: CaptchaHookGroup;
    // #endregion

    // #region Construct
    constructor(createService: (apiInstance?: AxiosInstance) => CaptchaService)
    {
        super(createService);
        this.loader = { getPublicConfigLoader: (opt) => this.getPublicConfigLoader(opt) };
        this.hooks = { usePublicConfig: (opt) => this.usePublicConfig(opt) };
    }
    // #endregion

    // #region Public Func
    /** 將 Captcha 後端 DTO 轉成前端 ViewModel */
    public toViewModel(config: CaptchaPublicConfigResult): CaptchaConfigViewModel
    {
        return toCaptchaConfigViewModel(config);
    }
    // #endregion

    // #region Loader Func
    /** SSR / Loader：取得前台驗證碼公開設定 */
    private getPublicConfigLoader(opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; })
    {
        return this.createApiLoader<null, CaptchaConfigViewModel>({
            action: "Captcha.Public.GetConfig",
            getArgs: () => null,
            call: (svc) => this.queryPublicConfigAsync(svc),
            getApiInstance: opt?.getApiInstance,
        });
    }
    // #endregion

    // #region Hook Func
    /** CSR Hook：取得前台驗證碼公開設定 */
    private usePublicConfig(opt?: { apiInstance?: AxiosInstance; deps?: EffectDeps; initial?: CaptchaPublicConfigLoaderData | null; onError?: (err: ApiAdapterError) => void; })
    {
        const deps = opt?.deps ?? [];
        const args = useMemo(() => null, []);
        const query = this.useApiQuery<null, CaptchaConfigViewModel>({
            action: "Captcha.Public.GetConfig",
            args,
            initial: opt?.initial ?? null,
            call: (svc) => this.queryPublicConfigAsync(svc),
            fallbackError: "取得驗證碼設定失敗",
            deps,
            onError: opt?.onError,
            apiInstance: opt?.apiInstance,
        });
        const config = useMemo(() => query.data ?? createDefaultCaptchaConfig(), [query.data]);
        return { ...query, config };
    }
    // #endregion

    // #region Private Helper
    /** 呼叫 Captcha 設定 API 並轉成前端 ViewModel */
    private async queryPublicConfigAsync(svc: CaptchaService): Promise<ApiResponse<CaptchaConfigViewModel>>
    {
        const apiRes = await svc.publicGetConfigData();
        return this.normalizePublicConfigResult(apiRes);
    }

    /** 將 API 結果轉成 Captcha ViewModel 結果 */
    private normalizePublicConfigResult(apiRes: ApiResponse<CaptchaPublicConfigResult>): ApiResponse<CaptchaConfigViewModel>
    {
        if (!apiRes.IsSuccess) return { ...apiRes, Data: null };
        return { ...apiRes, Data: toCaptchaConfigViewModel(apiRes.Data) };
    }
    // #endregion
}

// #region Private Helper
/** 判斷 Captcha 是否可渲染 */
const getCaptchaRenderState = (opt: { isEnabled: boolean; isTurnstile: boolean; siteKey: string; }): CaptchaRenderState =>
{
    if (!opt.isEnabled) return "disabled";
    if (!opt.isTurnstile) return "unsupportedProvider";
    if (!opt.siteKey) return "missingSiteKey";
    return "ready";
};

/** 取得 Captcha 設定狀態訊息 */
const getCaptchaMessageText = (state: CaptchaRenderState, provider: string): string | null =>
{
    if (state === "ready" || state === "disabled") return null;
    if (state === "missingSiteKey") return "驗證碼服務尚未設定 SiteKey。";
    if (state === "unsupportedProvider") return `目前不支援此驗證碼 Provider：${provider || "未設定"}。`;
    return "驗證碼設定異常。";
};
// #endregion

export const CaptchaAdapter = (apiInstance?: AxiosInstance) =>
{
    return new CaptchaAdapterImpl((api?: AxiosInstance) => new CaptchaService(api ?? apiInstance));
};
