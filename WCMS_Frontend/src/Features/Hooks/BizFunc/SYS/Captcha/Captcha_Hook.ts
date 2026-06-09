import { type ApiAdapterError, type EffectDeps } from "@/SysCore/Utils/API/APIAdapter";
import type { AxiosInstance } from "axios";
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CaptchaAdapter, type CaptchaConfigViewModel, type CaptchaPublicConfigLoaderData } from "./Captcha_Api";

// #region Property
type CaptchaClientState = "idle" | "passed" | "required" | "expired" | "error";
interface CaptchaMessageOptions
{
    requiredText?: string;
    expiredText?: string;
    errorText?: string;
    configInvalidText?: string;
}
interface UseCaptchaControllerOptions
{
    apiInstance?: AxiosInstance;
    deps?: EffectDeps;
    initial?: CaptchaPublicConfigLoaderData | null;
    messages?: CaptchaMessageOptions;
    onConfigError?: (err: ApiAdapterError) => void;
    onTokenChange?: (token: string | null) => void;
}
export interface CaptchaController
{
    config: CaptchaConfigViewModel;
    captchaToken: string | null;
    resetKey: number;
    clientState: CaptchaClientState;
    isLoading: boolean;
    isPassed: boolean;
    isRequired: boolean;
    configErrorText: string | null;
    validationErrorText: string | null;
    rootRef: RefObject<HTMLFieldSetElement>;
    refetchConfig: () => Promise<void>;
    resetCaptcha: () => void;
    validateCaptcha: () => boolean;
    handleTokenChange: (token: string | null) => void;
    handleExpired: () => void;
    handleError: (errorCode?: string) => void;
}
const defaultMessages: Required<CaptchaMessageOptions> = {
    requiredText: "請先完成驗證碼。",
    expiredText: "驗證碼已逾時，請重新驗證。",
    errorText: "驗證碼載入或驗證發生錯誤，請重新驗證。",
    configInvalidText: "驗證碼設定異常，暫時無法送出。",
};
// #endregion

// #region Public
/** 建立 Captcha 設定、token 狀態與送出前檢查流程 */
export const useCaptchaController = (opt?: UseCaptchaControllerOptions): CaptchaController =>
{
    const messages = useMemo(() => ({ ...defaultMessages, ...(opt?.messages ?? {}) }), [opt?.messages]);
    const adapter = useMemo(() => CaptchaAdapter(opt?.apiInstance), [opt?.apiInstance]);
    const configQuery = adapter.hooks.usePublicConfig({ apiInstance: opt?.apiInstance, deps: opt?.deps, initial: opt?.initial, onError: opt?.onConfigError });
    const [captchaToken, setCaptchaToken] = useState<string | null>(null);
    const [resetKey, setResetKey] = useState<number>(0);
    const [clientState, setClientState] = useState<CaptchaClientState>("idle");
    const [validationErrorText, setValidationErrorText] = useState<string | null>(null);
    const rootRef = useRef<HTMLFieldSetElement | null>(null);
    const focusCaptcha = useCallback(() =>
    {
        if (typeof window === "undefined") return;
        window.setTimeout(() => rootRef.current?.focus(), 0);
    }, []);
    const setToken = useCallback((token: string | null) =>
    {
        setCaptchaToken(token);
        opt?.onTokenChange?.(token);
    }, [opt?.onTokenChange]);
    /** 清除 token 並要求 Turnstile 重新渲染 */
    const resetCaptcha = useCallback(() =>
    {
        setToken(null);
        setClientState("idle");
        setValidationErrorText(null);
        setResetKey((value) => value + 1);
    }, [setToken]);
    /** 接收 Turnstile callback token */
    const handleTokenChange = useCallback((token: string | null) =>
    {
        setToken(token);
        setClientState(token ? "passed" : "idle");
        setValidationErrorText(null);
    }, [setToken]);
    /** 處理 Turnstile token 過期 */
    const handleExpired = useCallback(() =>
    {
        setToken(null);
        setClientState("expired");
        setValidationErrorText(messages.expiredText);
    }, [messages.expiredText, setToken]);
    /** 處理 Turnstile 載入或驗證錯誤 */
    const handleError = useCallback((_errorCode?: string) =>
    {
        setToken(null);
        setClientState("error");
        setValidationErrorText(messages.errorText);
    }, [messages.errorText, setToken]);
    /** 送出前檢查 Captcha 狀態 */
    const validateCaptcha = useCallback((): boolean =>
    {
        if (!configQuery.config.isEnabled) return true;
        if (!configQuery.config.canRender)
        {
            setClientState("error");
            setValidationErrorText(configQuery.config.messageText ?? messages.configInvalidText);
            focusCaptcha();
            return false;
        }
        if (!captchaToken)
        {
            setClientState("required");
            setValidationErrorText(messages.requiredText);
            focusCaptcha();
            return false;
        }
        setValidationErrorText(null);
        return true;
    }, [captchaToken, configQuery.config, focusCaptcha, messages.configInvalidText, messages.requiredText]);
    useEffect(() =>
    {
        if (configQuery.config.canRender || !captchaToken) return;
        setToken(null);
        setClientState("idle");
    }, [captchaToken, configQuery.config.canRender, setToken]);
    return {
        config: configQuery.config,
        captchaToken: configQuery.config.isEnabled ? captchaToken : null,
        resetKey,
        clientState,
        isLoading: configQuery.isLoading,
        isPassed: clientState === "passed" && Boolean(captchaToken),
        isRequired: configQuery.config.isEnabled,
        configErrorText: configQuery.errorText,
        validationErrorText,
        rootRef,
        refetchConfig: configQuery.refetch,
        resetCaptcha,
        validateCaptcha,
        handleTokenChange,
        handleExpired,
        handleError,
    };
};
// #endregion
