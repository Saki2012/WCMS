import { safeTrim, splitTrimToArray } from "./LibText";

// #region Property
/** Cookie 每組資料的分隔符號 */
const COOKIE_PAIR_SEPARATOR = ";";
/** Cookie key/value 的分隔符號 */
const COOKIE_KEY_VALUE_SEPARATOR = "=";
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
    return readCookieValue(document.cookie, key);
};

/** 從 Request 取得 cookie header。 */
export const readRequestCookie = (request?: Request | null): string =>
{
    if (!request) return "";
    return request.headers.get("cookie") ?? "";
};

/** 從 Request 讀取指定 Cookie 值。 */
export const readRequestCookieValue = (request: Request | null | undefined, key: string): string | null =>
{
    return readCookieValue(readRequestCookie(request), key);
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
