import DOMPurify from "dompurify";

// #region Property
type TrustedTypesRuleSet = {
    createHTML?: (value: string) => string;
    createScriptURL?: (value: string) => string;
};

type TrustedTypesPolicyLike = {
    createHTML?: (value: string) => unknown;
    createScriptURL?: (value: string) => unknown;
};

type TrustedTypesFactoryLike = {
    createPolicy: (name: string, rules: TrustedTypesRuleSet) => TrustedTypesPolicyLike;
    defaultPolicy?: TrustedTypesPolicyLike | null;
};

interface WcmsTrustedTypesWindow extends Window
{
    trustedTypes?: TrustedTypesFactoryLike;
    __wcmsTrustedTypesReady?: boolean;
    __wcmsDefaultTrustedTypesPolicy?: TrustedTypesPolicyLike;
}

const allowedSameOriginScriptPrefixes = ["/assets/", "/tinymce/", "/tinymce-i18n/"] as const;

const devAllowedSameOriginScriptPrefixes = [
    "/src/features/assets/",
    "/src/specfetures/",
    "/src/specfeatures/",
] as const;

/** Trusted Types 下允許動態建立的外部 Script URL；僅保留既有整合需要的來源。 */
const allowedExternalScriptPrefixes = [
    "https://translate.google.com/translate_a/element.js",
    "https://translate.googleapis.com/translate_a/",
    "https://translate.googleapis.com/translate_static/",
    "https://translate-pa.googleapis.com/translate_a/",
    "https://translate-pa.googleapis.com/translate_static/",
    "https://challenges.cloudflare.com/turnstile/",
] as const;
// #endregion

// #region Public
/** 建立指定 Window 的 default policy，供主頁與 TinyMCE iframe 在 Trusted Types 下共用 WCMS 規則。 */
export const ensureWcmsDefaultTrustedTypesPolicy = (targetWindow?: Window): void =>
{
    const win = getTargetWindow(targetWindow);
    if (!win) return;
    if (win.__wcmsTrustedTypesReady) return;
    if (!win.trustedTypes)
    {
        win.__wcmsTrustedTypesReady = true;
        return;
    }

    const existingDefaultPolicy = win.trustedTypes.defaultPolicy;
    if (existingDefaultPolicy)
    {
        win.__wcmsDefaultTrustedTypesPolicy = existingDefaultPolicy;
        win.__wcmsTrustedTypesReady = true;
        return;
    }

    try
    {
        win.__wcmsDefaultTrustedTypesPolicy = win.trustedTypes.createPolicy("default", {
            createHTML: sanitizeHtml,
            createScriptURL: (value: string) =>
            {
                if (isAllowedScriptUrl(value, win)) return value;
                throw new TypeError(`Blocked untrusted script URL: ${value}`);
            },
        });
        win.__wcmsTrustedTypesReady = true;
    } catch (error)
    {
        console.error("[WCMS][TrustedTypes] Failed to create default policy.", error);
    }
};

/** 產生可安全指定給 HTMLScriptElement.src 的 URL。 */
export const createTrustedScriptUrl = (value: string): unknown =>
{
    const win = getTargetWindow();
    if (!win) return value;

    ensureWcmsDefaultTrustedTypesPolicy(win);
    return win.__wcmsDefaultTrustedTypesPolicy?.createScriptURL?.(value) ?? value;
};

/** 指定 script src，避免 require-trusted-types-for 'script' 擋住動態載入。 */
export const setTrustedScriptElementSrc = (script: HTMLScriptElement, src: string): void =>
{
    script.src = createTrustedScriptUrl(src) as string;
};
// #endregion

// #region Private
/** 取得 Trusted Types 要套用的 Window；SSR 無 Window 時直接略過。 */
const getTargetWindow = (targetWindow?: Window): WcmsTrustedTypesWindow | null =>
{
    if (targetWindow) return targetWindow as WcmsTrustedTypesWindow;
    if (typeof window === "undefined") return null;
    return window as WcmsTrustedTypesWindow;
};

/** 取得允許的同源 script 路徑，DEV 額外允許 Vite /src 資源。 */
const getAllowedSameOriginScriptPrefixes = (): readonly string[] =>
{
    if (import.meta.env.DEV) return [...allowedSameOriginScriptPrefixes, ...devAllowedSameOriginScriptPrefixes];

    return allowedSameOriginScriptPrefixes;
};

/** 檢查動態 script URL 是否屬於 WCMS 允許載入的來源。 */
const isAllowedScriptUrl = (value: string, targetWindow: Window): boolean =>
{
    const url = new URL(value, targetWindow.location.origin);
    if (url.origin === targetWindow.location.origin)
    {
        const pathname = url.pathname.toLowerCase();
        return getAllowedSameOriginScriptPrefixes().some(prefix => pathname.startsWith(prefix.toLowerCase()));
    }

    return allowedExternalScriptPrefixes.some(prefix => url.href.startsWith(prefix));
};

/** 清理需要寫入 innerHTML 的內容，避免 Trusted Types 強制模式擋住 TinyMCE。 */
const sanitizeHtml = (value: string): string =>
{
    return DOMPurify.sanitize(value, {
        RETURN_TRUSTED_TYPE: false,
        ALLOW_DATA_ATTR: true,
        ADD_TAGS: ["iframe"],
        ADD_ATTR: ["target", "download", "allow", "allowfullscreen", "loading", "referrerpolicy", "frameborder", "data-internalid"],
        FORBID_TAGS: ["script"],
    }) as string;
};

ensureWcmsDefaultTrustedTypesPolicy();
// #endregion
