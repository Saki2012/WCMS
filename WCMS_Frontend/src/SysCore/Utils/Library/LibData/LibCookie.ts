import { safeTrim, splitTrimToArray } from "./LibText";

// #region Property
/** Cookie SameSite 可用模式 */
export type CookieSameSite = "Strict" | "Lax" | "None";
/** 寫入 Client Cookie 的參數 */
export interface WriteClientCookieOptions
{
    /** Cookie 名稱 */
    name: string;

    /** Cookie 值 */
    value: string;

    /** Cookie Path，預設為 / */
    path?: string;

    /** Cookie Domain */
    domain?: string;

    /** Cookie 存活秒數 */
    maxAgeSeconds?: number;

    /** Cookie 到期時間 */
    expires?: Date;

    /** Cookie SameSite 設定，預設為 Lax */
    sameSite?: CookieSameSite;

    /** 是否加上 Secure */
    isSecure?: boolean;
}
/** 刪除 Client Cookie 的參數 */
export interface DeleteClientCookieOptions
{
    /** Cookie 名稱 */
    name: string;

    /** Cookie Path，需與寫入時一致 */
    path?: string;

    /** Cookie Domain，需與寫入時一致 */
    domain?: string;
}
/** Cookie 每組資料的分隔符號 */
const COOKIE_PAIR_SEPARATOR = ";";
/** Cookie key/value 的分隔符號 */
const COOKIE_KEY_VALUE_SEPARATOR = "=";
/** 預設 Cookie Path */
const DEFAULT_COOKIE_PATH = "/";
/** 刪除 Cookie 使用的 Max-Age 秒數 */
const DELETE_COOKIE_MAX_AGE_SECONDS = 0;
/** 刪除 Cookie 使用的過期時間 */
const DELETE_COOKIE_EXPIRES = new Date(0);
// #endregion

// #region Public
/** 從 Cookie header 字串讀取指定 Cookie 值。 */
export const readCookieValue = (cookieHeader: string | null | undefined, key: string): string | null =>
{
    const cookieKey = safeTrim(key);
    if (cookieKey.length === 0) return null;
    const parts = splitTrimToArray(cookieHeader, COOKIE_PAIR_SEPARATOR);
    for (const part of parts)
    {
        const value = readCookiePartValue(part, cookieKey);
        if (value !== null) return value;
    }
    return null;
};
/** 從 document.cookie 讀取指定 Cookie 值。 */
export const readClientCookieValue = (key: string): string | null =>
{
    if (typeof document === "undefined") return null;

    const value = readCookieValue(document.cookie, key);
    return value;
};
/** 從 Request 取得 cookie header。 */
export const readRequestCookie = (request?: Request | null): string =>
{
    if (!request) return "";
    const cookieHeader = request.headers.get("cookie") ?? "";
    return cookieHeader;
};
/** 從 Request 讀取指定 Cookie 值。 */
export const readRequestCookieValue = (request: Request | null | undefined, key: string): string | null =>
{
    const cookieHeader = readRequestCookie(request);
    const value = readCookieValue(cookieHeader, key);
    return value;
};
/** 寫入 Client Cookie。 */
export const writeClientCookie = (options: WriteClientCookieOptions): void =>
{
    if (typeof document === "undefined") return;
    const cookieText = buildClientCookieText(options);
    if (cookieText.length === 0) return;
    document.cookie = cookieText;
};
/** 刪除 Client Cookie。 */
export const deleteClientCookie = (options: DeleteClientCookieOptions): void =>
{
    writeClientCookie({ name: options.name, value: "", path: options.path, domain: options.domain, maxAgeSeconds: DELETE_COOKIE_MAX_AGE_SECONDS, expires: DELETE_COOKIE_EXPIRES });
};
// #endregion

// #region Private
/** 從單一 Cookie 片段讀取指定 key 的值。 */
const readCookiePartValue = (part: string, key: string): string | null =>
{
    const eqIndex = part.indexOf(COOKIE_KEY_VALUE_SEPARATOR);
    if (eqIndex < 0) return null;
    const partKey = safeTrim(part.slice(0, eqIndex));
    if (partKey !== key) return null;
    const rawValue = safeTrim(part.slice(eqIndex + 1));
    return decodeCookieValue(rawValue);
};
/** 建立 Client Cookie 寫入字串。 */
const buildClientCookieText = (options: WriteClientCookieOptions): string =>
{
    const name = safeTrim(options.name);
    if (name.length === 0) return "";
    const parts = [`${name}=${encodeURIComponent(options.value)}`];
    appendCookieBaseAttributes(parts, options);
    appendCookieExpireAttributes(parts, options);
    appendCookieSecurityAttributes(parts, options);
    return parts.join("; ");
};
/** 加入 Cookie 基本屬性。 */
const appendCookieBaseAttributes = (parts: string[], options: WriteClientCookieOptions): void =>
{
    parts.push(`Path=${safeTrim(options.path) || DEFAULT_COOKIE_PATH}`);
    if (safeTrim(options.domain).length > 0) parts.push(`Domain=${safeTrim(options.domain)}`);
};
/** 加入 Cookie 到期屬性。 */
const appendCookieExpireAttributes = (parts: string[], options: WriteClientCookieOptions): void =>
{
    if (Number.isFinite(options.maxAgeSeconds)) parts.push(`Max-Age=${options.maxAgeSeconds}`);
    if (options.expires instanceof Date) parts.push(`Expires=${options.expires.toUTCString()}`);
};
/** 加入 Cookie 安全屬性。 */
const appendCookieSecurityAttributes = (parts: string[], options: WriteClientCookieOptions): void =>
{
    parts.push(`SameSite=${options.sameSite ?? "Lax"}`);
    if (options.isSecure) parts.push("Secure");
};
/** 安全解碼 Cookie 值。 */
const decodeCookieValue = (value: string): string =>
{
    try
    {
        return decodeURIComponent(value);
    } catch
    {
        return value;
    }
};
// #endregion
