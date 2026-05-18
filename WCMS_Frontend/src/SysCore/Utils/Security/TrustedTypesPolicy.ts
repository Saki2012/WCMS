import DOMPurify from "dompurify";

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
};

interface WcmsTrustedTypesWindow extends Window
{
    trustedTypes?: TrustedTypesFactoryLike;
    __wcmsTrustedTypesReady?: boolean;
    __wcmsDefaultTrustedTypesPolicy?: TrustedTypesPolicyLike;
}

const allowedSameOriginScriptPrefixes = ["/assets/", "/tinymce/", "/tinymce-i18n/"] as const;

const allowedExternalScriptUrls = [
    "https://translate.google.com/translate_a/element.js",
] as const;

/** 檢查動態 script URL 是否屬於 WCMS 允許載入的來源。 */
const isAllowedScriptUrl = (value: string): boolean =>
{
    const url = new URL(value, window.location.origin);
    if (url.origin === window.location.origin) return allowedSameOriginScriptPrefixes.some(prefix => url.pathname.startsWith(prefix));

    return allowedExternalScriptUrls.some(allowed => url.href.startsWith(allowed));
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

/** 建立全站 default policy，供第三方套件在 Trusted Types 下正常運作。 */
export const ensureWcmsDefaultTrustedTypesPolicy = (): void =>
{
    if (typeof window === "undefined") return;

    const win = window as WcmsTrustedTypesWindow;
    if (win.__wcmsTrustedTypesReady) return;
    if (!win.trustedTypes)
    {
        win.__wcmsTrustedTypesReady = true;
        return;
    }

    try
    {
        win.__wcmsDefaultTrustedTypesPolicy = win.trustedTypes.createPolicy("default", {
            createHTML: sanitizeHtml,
            createScriptURL: (value: string) =>
            {
                if (isAllowedScriptUrl(value)) return value;
                throw new TypeError(`Blocked untrusted script URL: ${value}`);
            },
        });
    }
    catch
    {
        // default policy 可能已由其他入口建立；保留瀏覽器既有行為即可。
    }

    win.__wcmsTrustedTypesReady = true;
};

/** 產生可安全指定給 HTMLScriptElement.src 的 URL。 */
export const createTrustedScriptUrl = (value: string): unknown =>
{
    ensureWcmsDefaultTrustedTypesPolicy();

    const win = window as WcmsTrustedTypesWindow;
    return win.__wcmsDefaultTrustedTypesPolicy?.createScriptURL?.(value) ?? value;
};

/** 指定 script src，避免 require-trusted-types-for 'script' 擋住動態載入。 */
export const setTrustedScriptElementSrc = (script: HTMLScriptElement, src: string): void =>
{
    script.src = createTrustedScriptUrl(src) as string;
};

ensureWcmsDefaultTrustedTypesPolicy();
