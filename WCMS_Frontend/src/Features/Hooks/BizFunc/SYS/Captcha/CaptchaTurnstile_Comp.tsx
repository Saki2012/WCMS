import { useEffect, useId, useMemo, useRef, useState } from "react";
// #region Property
type TurnstileTheme = "auto" | "light" | "dark";
type TurnstileSize = "normal" | "compact" | "flexible";
type TurnstileStatus = "idle" | "loading" | "ready" | "error";
type TurnstileWidgetId = string;
type TurnstileRenderOptions = {
    sitekey: string;
    action?: string;
    cData?: string;
    theme?: TurnstileTheme;
    size?: TurnstileSize;
    tabindex?: number;
    language?: string;
    callback?: (token: string) => void;
    "expired-callback"?: () => void;
    "error-callback"?: (errorCode?: string) => void;
};
type TurnstileClient = {
    render: (container: HTMLElement, options: TurnstileRenderOptions) => TurnstileWidgetId;
    reset: (widgetId?: TurnstileWidgetId) => void;
    remove: (widgetId: TurnstileWidgetId) => void;
};
declare global
{
    interface Window
    {
        turnstile?: TurnstileClient;
    }
}
export interface CaptchaTurnstileProps
{
    siteKey: string;
    resetKey: number;
    className?: string;
    describedBy?: string;
    action?: string;
    cData?: string;
    theme?: TurnstileTheme;
    size?: TurnstileSize;
    tabIndex?: number;
    language?: string;
    nonce?: string;
    loadingText?: string;
    loadErrorText?: string;
    onTokenChange: (token: string | null) => void;
    onExpired?: () => void;
    onError?: (errorCode?: string) => void;
}
const TURNSTILE_SCRIPT_ID = "cloudflare-turnstile-api";
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
let turnstileScriptPromise: Promise<TurnstileClient> | null = null;
// #endregion

// #region Public
/** Cloudflare Turnstile explicit render 元件，避免 SSR hydration 前改動 DOM */
export const CaptchaTurnstile_Comp = (props: CaptchaTurnstileProps) =>
{
    const containerId = useId();
    const statusId = `${containerId}-status`;
    const containerRef = useRef<HTMLDivElement | null>(null);
    const widgetIdRef = useRef<TurnstileWidgetId | null>(null);
    const callbackRef = useRef({ onTokenChange: props.onTokenChange, onExpired: props.onExpired, onError: props.onError });
    const [status, setStatus] = useState<TurnstileStatus>("idle");
    const [errorText, setErrorText] = useState<string | null>(null);
    const siteKey = props.siteKey.trim();
    const loadingText = props.loadingText ?? "驗證碼載入中。";
    const loadErrorText = props.loadErrorText ?? "驗證碼載入失敗，請重新整理頁面後再試。";
    useEffect(() =>
    {
        callbackRef.current = { onTokenChange: props.onTokenChange, onExpired: props.onExpired, onError: props.onError };
    }, [props.onTokenChange, props.onExpired, props.onError]);
    const renderOptions = useMemo<TurnstileRenderOptions>(() =>
    {
        return {
            sitekey: siteKey,
            action: props.action,
            cData: props.cData,
            theme: props.theme ?? "auto",
            size: props.size ?? "normal",
            tabindex: props.tabIndex,
            language: props.language,
            callback: (token: string) => callbackRef.current.onTokenChange(token),
            "expired-callback": () =>
            {
                callbackRef.current.onTokenChange(null);
                callbackRef.current.onExpired?.();
            },
            "error-callback": (errorCode?: string) =>
            {
                callbackRef.current.onTokenChange(null);
                callbackRef.current.onError?.(errorCode);
            },
        };
    }, [siteKey, props.action, props.cData, props.theme, props.size, props.tabIndex, props.language]);
    useEffect(() =>
    {
        if (!siteKey || !containerRef.current) return;
        let isActive = true;
        setStatus("loading");
        setErrorText(null);
        void loadTurnstileScript(props.nonce).then((client) =>
        {
            if (!isActive || !containerRef.current) return;
            clearTurnstileWidget(widgetIdRef.current, containerRef.current);
            widgetIdRef.current = client.render(containerRef.current, renderOptions);
            setStatus("ready");
        }).catch(() =>
        {
            if (!isActive) return;
            setStatus("error");
            setErrorText(loadErrorText);
            callbackRef.current.onError?.("load-error");
        });
        return () =>
        {
            isActive = false;
            clearTurnstileWidget(widgetIdRef.current, containerRef.current);
            widgetIdRef.current = null;
        };
    }, [siteKey, props.resetKey, props.nonce, renderOptions, loadErrorText]);
    return (
        <div className={props.className} aria-describedby={props.describedBy}>
            <div ref={containerRef} />
            <p
                id={statusId}
                className={status === "error" ? "text-danger small mb-0" : "visually-hidden"}
                role={status === "error" ? "alert" : undefined}
                aria-live="polite"
            >
                {status === "loading" ? loadingText : errorText ?? ""}
            </p>
        </div>
    );
};
// #endregion

// #region EntityComp
/** 建立 Turnstile script 標籤 */
const buildTurnstileScript = (nonce?: string): HTMLScriptElement =>
{
    const script = document.createElement("script");
    const currentNonce = nonce ?? getDocumentNonce();
    script.id = TURNSTILE_SCRIPT_ID;
    script.src = TURNSTILE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    if (currentNonce) script.nonce = currentNonce;
    return script;
};
// #endregion

// #region Private
/** 載入 Turnstile script，重複元件共用同一個 Promise */
const loadTurnstileScript = (nonce?: string): Promise<TurnstileClient> =>
{
    if (typeof window === "undefined" || typeof document === "undefined") return Promise.reject(new Error("Turnstile only runs in browser."));
    const current = window.turnstile;
    if (current) return Promise.resolve(current);
    if (turnstileScriptPromise) return turnstileScriptPromise;
    turnstileScriptPromise = new Promise<TurnstileClient>((resolve, reject) =>
    {
        const existing = document.getElementById(TURNSTILE_SCRIPT_ID) as HTMLScriptElement | null;
        const script = existing ?? buildTurnstileScript(nonce);
        script.addEventListener("load", () => resolveLoadedClient(resolve, reject), { once: true });
        script.addEventListener("error", () => reject(new Error("Load Turnstile script failed.")), { once: true });
        if (!existing) document.head.appendChild(script);
    });
    return turnstileScriptPromise;
};

/** 取得目前 SSR script nonce，讓 CSP 嚴格模式可共用 */
const getDocumentNonce = (): string | undefined =>
{
    return document.querySelector<HTMLScriptElement>("script[nonce]")?.nonce || undefined;
};
/** script 載入後確認 Turnstile client 可用 */
const resolveLoadedClient = (resolve: (client: TurnstileClient) => void, reject: (reason: Error) => void): void =>
{
    const client = window.turnstile;
    if (client) resolve(client);
    else reject(new Error("Turnstile client is not ready."));
};
/** 清除 Turnstile widget，避免 CSR 切頁或 StrictMode 重複掛載殘留 iframe */
const clearTurnstileWidget = (widgetId: TurnstileWidgetId | null, container: HTMLDivElement | null): void =>
{
    if (widgetId)
    {
        try
        {
            window.turnstile?.remove(widgetId);
        } catch
        {
            /* Turnstile widget may already be removed. */
        }
    }
    if (container) container.innerHTML = "";
};
// #endregion
