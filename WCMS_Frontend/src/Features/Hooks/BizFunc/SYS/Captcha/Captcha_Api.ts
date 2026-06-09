import { type ApiAdapterError, ApiBaseAdapter, type ApiLoaderData, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { ApiResponse } from "@/SysCore/Utils/API/APIBase";
import { ApiBaseService } from "@/SysCore/Utils/API/APIClient";
import type { components } from "@/types/api";
import { PGID } from "@/types/SchemaFields";
import type { AxiosInstance } from "axios";
import { useMemo } from "react";
import type { LoaderFunctionArgs } from "react-router-dom";

// #region Property
const TurnstileProvider = "Turnstile";
type CaptchaPublicConfig = components["schemas"]["CaptchaPublicConfig_DTO"];
type CaptchaPublicConfigResult = CaptchaPublicConfig | null;
type CaptchaRenderState = "disabled" | "ready" | "missingSiteKey" | "unsupportedProvider";
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
type CaptchaLoaderGroup = {
    /** SSR / Loader：取得前台驗證碼公開設定 */
    getPublicConfigLoader: (
        opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; },
    ) => (args: LoaderFunctionArgs) => Promise<CaptchaPublicConfigLoaderData>;
};
type CaptchaHookGroup = {
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
// #endregion

// #region Public
/** Captcha 系統功能 API，不走資料表型 ApiDataService */
export class CaptchaService extends ApiBaseService
{
    // #region Public
    constructor(apiInstance?: AxiosInstance)
    {
        super(PGID.Captcha, apiInstance);
    }
    /** 取得前台驗證碼公開設定 */
    public async publicGetConfig(): Promise<ApiResponse<CaptchaPublicConfig[]>>
    {
        return await this.CallApi<CaptchaPublicConfig[]>(() => this.Api.get<ApiResponse<CaptchaPublicConfig[]>>(`${this.Module}/Public_GetConfig`));
    }
    /** 取得前台驗證碼公開設定第一筆 */
    public async publicGetConfigData(): Promise<ApiResponse<CaptchaPublicConfigResult>>
    {
        const apiRes = await this.publicGetConfig();
        return this.normalizePublicConfig(apiRes);
    }
    // #endregion

    // #region Private
    /** 將後端陣列 Data 轉成單筆設定 */
    private normalizePublicConfig(apiRes: ApiResponse<CaptchaPublicConfig[]>): ApiResponse<CaptchaPublicConfigResult>
    {
        const first = Array.isArray(apiRes.Data) ? apiRes.Data[0] ?? null : null;
        return { ...apiRes, Data: first };
    }
    // #endregion
}
/** Captcha API Adapter：集中提供 Loader / Hook 與 DTO 轉換 */
export class CaptchaAdapterImpl extends ApiBaseAdapter<CaptchaService>
{
    // #region Property
    public readonly loader: CaptchaLoaderGroup;
    public readonly hooks: CaptchaHookGroup;
    // #endregion

    // #region Public
    constructor(createService: (apiInstance?: AxiosInstance) => CaptchaService)
    {
        super(createService);
        this.loader = { getPublicConfigLoader: (opt) => this.getPublicConfigLoader(opt) };
        this.hooks = { usePublicConfig: (opt) => this.usePublicConfig(opt) };
    }
    // #endregion

    // #region Protected
    /** SSR / Loader：取得前台驗證碼公開設定 */
    protected getPublicConfigLoader(opt?: { getApiInstance?: (args: LoaderFunctionArgs) => AxiosInstance | undefined; })
    {
        return this.createApiLoader<null, CaptchaConfigViewModel>({
            action: "Captcha.Public.GetConfig",
            getArgs: () => null,
            call: (svc) => this.queryPublicConfigAsync(svc),
            getApiInstance: opt?.getApiInstance,
        });
    }

    /** CSR Hook：取得前台驗證碼公開設定 */
    protected usePublicConfig(
        opt?: { apiInstance?: AxiosInstance; deps?: EffectDeps; initial?: CaptchaPublicConfigLoaderData | null; onError?: (err: ApiAdapterError) => void; },
    )
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
        const config = useMemo(() => query.data ?? this.createDefaultCaptchaConfig(), [query.data]);
        return { ...query, config };
    }
    // #endregion

    // #region Private
    /** 呼叫 Captcha 設定 API 並轉成前端 ViewModel */
    private async queryPublicConfigAsync(svc: CaptchaService): Promise<ApiResponse<CaptchaConfigViewModel>>
    {
        const apiRes = await svc.publicGetConfigData();
        if (!apiRes.IsSuccess) return { ...apiRes, Data: null };
        return { ...apiRes, Data: this.toCaptchaConfigViewModel(apiRes.Data) };
    }
    /** 建立 Captcha 預設 ViewModel */
    private createDefaultCaptchaConfig = (): CaptchaConfigViewModel =>
    {
        return { isEnabled: false, provider: "", siteKey: "", isTurnstile: false, canRender: false, renderState: "disabled", messageText: null };
    };

    /** 將 Captcha 後端 DTO 轉成前端 ViewModel */
    private toCaptchaConfigViewModel = (config: CaptchaPublicConfigResult): CaptchaConfigViewModel =>
    {
        const isEnabled = config?.Enabled === true;
        const provider = (config?.Provider ?? "").trim();
        const siteKey = (config?.SiteKey ?? "").trim();
        const isTurnstile = provider.toLowerCase() === TurnstileProvider.toLowerCase();
        const renderState = this.getCaptchaRenderState({ isEnabled, isTurnstile, siteKey });

        return {
            isEnabled,
            provider,
            siteKey,
            isTurnstile,
            canRender: renderState === "ready",
            renderState,
            messageText: this.getCaptchaMessageText(renderState, provider),
        };
    };

    /** 判斷 Captcha 是否可渲染 */
    private getCaptchaRenderState = (opt: { isEnabled: boolean; isTurnstile: boolean; siteKey: string; }): CaptchaRenderState =>
    {
        if (!opt.isEnabled) return "disabled";
        if (!opt.isTurnstile) return "unsupportedProvider";
        if (!opt.siteKey) return "missingSiteKey";
        return "ready";
    };

    /** 取得 Captcha 設定狀態訊息 */
    private getCaptchaMessageText = (state: CaptchaRenderState, provider: string): string | null =>
    {
        if (state === "ready" || state === "disabled") return null;
        if (state === "missingSiteKey") return "驗證碼服務尚未設定 SiteKey。";
        if (state === "unsupportedProvider") return `目前不支援此驗證碼 Provider：${provider || "未設定"}。`;
        return "驗證碼設定異常。";
    };
    // #endregion
}
/** 建立 Captcha Adapter 實例 */
export const CaptchaAdapter = (apiInstance?: AxiosInstance) => new CaptchaAdapterImpl((api?: AxiosInstance) => new CaptchaService(api ?? apiInstance));
// #endregion
