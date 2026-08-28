import { safeTrim } from "@/SysCore/Utils/Library/LibData/LibText";
import type { BrowserCookieDefinition } from "./BrowserCookieDefinition";
import { resolveBrowserCookieSecurityPolicy } from "./BrowserCookieSecurityPolicy";

// #region Property
/** 預設 Cookie Path */
const DEFAULT_COOKIE_PATH = "/";
/** HTTPS protocol 文字 */
const HTTPS_PROTOCOL = "https:";
/** 刪除 Cookie 使用的 Max-Age 秒數 */
const DELETE_COOKIE_MAX_AGE_SECONDS = 0;
/** 刪除 Cookie 使用的過期時間 */
const DELETE_COOKIE_EXPIRES = new Date(0);
// #endregion

// #region Public
/** 寫入由 Browser 管理的 Client-issued Cookie，安全屬性統一由 Browser Cookie Security Policy 決定。 */
export const writeBrowserCookie = (definition: BrowserCookieDefinition, value: string): void =>
{
    if (typeof document === "undefined") return;
    const cookieText = buildBrowserCookieText(definition, value);
    if (!cookieText) return;
    document.cookie = cookieText;
};

/** 刪除由 Browser 管理的 Client-issued Cookie。 */
export const deleteBrowserCookie = (definition: BrowserCookieDefinition): void =>
{
    writeBrowserCookie({ ...definition, maxAgeSeconds: DELETE_COOKIE_MAX_AGE_SECONDS, expires: DELETE_COOKIE_EXPIRES }, "");
};
// #endregion

// #region Private
/** 建立 Browser Cookie 字串。 */
const buildBrowserCookieText = (definition: BrowserCookieDefinition, value: string): string =>
{
    const name = safeTrim(definition.name);
    if (!name) return "";

    const parts = [`${name}=${encodeURIComponent(value)}`];
    appendBaseAttributes(parts, definition);
    appendExpireAttributes(parts, definition);
    appendSecurityAttributes(parts, name);
    return parts.join("; ");
};

/** 加入 Cookie 基本屬性。 */
const appendBaseAttributes = (parts: string[], definition: BrowserCookieDefinition): void =>
{
    parts.push(`Path=${safeTrim(definition.path) || DEFAULT_COOKIE_PATH}`);
    const domain = safeTrim(definition.domain);
    if (domain) parts.push(`Domain=${domain}`);
};

/** 加入 Cookie 到期屬性。 */
const appendExpireAttributes = (parts: string[], definition: BrowserCookieDefinition): void =>
{
    if (Number.isFinite(definition.maxAgeSeconds)) parts.push(`Max-Age=${definition.maxAgeSeconds}`);
    if (definition.expires instanceof Date) parts.push(`Expires=${definition.expires.toUTCString()}`);
};

/** 套用 Browser Cookie 的中央 SameSite / Secure Policy。 */
const appendSecurityAttributes = (parts: string[], cookieName: string): void =>
{
    const policy = resolveBrowserCookieSecurityPolicy(cookieName);
    const isHttps = typeof window !== "undefined" && window.location.protocol === HTTPS_PROTOCOL;
    if (policy.requireSecure && !isHttps) throw new Error(`[WCMS][Security] Cookie ${cookieName} requires HTTPS.`);

    parts.push(`SameSite=${policy.sameSite}`);
    if (isHttps) parts.push("Secure");
};
// #endregion
