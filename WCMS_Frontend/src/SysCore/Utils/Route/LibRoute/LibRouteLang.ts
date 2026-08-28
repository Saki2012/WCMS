import { RouteLanguageCookieDefinition } from "@/SysCore/Security/Browser/Cookies/RouteLanguageCookieDefinition";
import { writeBrowserCookie } from "@/SysCore/Security/Browser/Cookies/BrowserCookieService";
import { DefaultLang, isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { LibCookie, LibText } from "@/SysCore/Utils/Library/LibData";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import * as LibRoutePath from "./LibRoutePath";

// #region Property
/** Accept-Language 權重預設值 */
const DEFAULT_ACCEPT_LANGUAGE_Q_VALUE = 1;
/** Accept-Language 主項分隔符號 */
const ACCEPT_LANGUAGE_ITEM_SEPARATOR = ",";
/** Accept-Language 參數分隔符號 */
const ACCEPT_LANGUAGE_PARAM_SEPARATOR = ";";
/** Accept-Language q-value 前綴 */
const ACCEPT_LANGUAGE_Q_PREFIX = "q=";
/** 語系 alias 內底線符號 */
const LANG_UNDERSCORE_SEPARATOR = "_";
/** 語系 canonical 分隔符號 */
const LANG_CANONICAL_SEPARATOR = "-";
/** 英文語系 canonical 值 */
const EN_LANG: Lang = "en";
/** 繁中語系 canonical 值 */
const ZH_TW_LANG: Lang = "zh-tw";
/** Route 語系處理略過的路徑 segment */
export const ROUTE_LANG_BYPASS_SEGMENTS = ["server", "service"] as const;
/** URL 解析用的預設 base url */
const DEFAULT_URL_BASE = "http://localhost";
/** Accept-Language 解析後的項目 */
interface AcceptLanguageEntry
{
    /** 語系標籤 */
    tag: string;
    /** 權重分數 */
    q: number;
    /** 原始順序 */
    index: number;
}
// #endregion

// #region Public
/** 寫入使用者目前選擇的路由語系 Cookie。 */
export const writeRouteLangCookie = (lang: Lang): void =>
{
    writeBrowserCookie(RouteLanguageCookieDefinition, lang);
};

/** 嘗試將輸入語系轉成系統支援的 route canonical 語系。 */
export const tryNormalizeRouteLang = (value?: string | null): Lang | null =>
{
    const text = decodeRouteLangText(value);
    if (text.length === 0) return null;
    if (isSupportedLang(text)) return text as Lang;
    const alias = mapRouteLangAlias(text);
    return alias;
};

/** 將輸入語系轉成系統支援的 route canonical 語系，失敗時回預設語系。 */
export const normalizeRouteLang = (value?: string | null): Lang =>
{
    const lang = tryNormalizeRouteLang(value);
    return lang ?? DefaultLang;
};

/** 嘗試從 route segment 解析語系。 */
export const tryParseRouteLangSegment = (segment?: string | null): Lang | null =>
{
    const lang = tryNormalizeRouteLang(segment);
    return lang;
};

/** 解析 Accept-Language header，並依 q-value 排序回傳語系標籤。 */
export const parseAcceptLanguage = (header?: string | null): string[] =>
{
    const items = LibText.splitTrimToArray(header, ACCEPT_LANGUAGE_ITEM_SEPARATOR);
    const entries = items.map(parseAcceptLanguageEntry).filter((item): item is AcceptLanguageEntry => item !== null);
    const tags = entries.sort(sortAcceptLanguageEntry).map(item => item.tag).filter(tag => tag.length > 0);
    return tags;
};

/** 從 Accept-Language header 挑出第一個系統支援語系。 */
export const pickRouteLangFromAcceptLanguage = (header?: string | null): Lang | null =>
{
    const tags = parseAcceptLanguage(header);
    const lang = tags.map(tryNormalizeRouteLang).find((item): item is Lang => item !== null) ?? null;
    return lang;
};

/** 從 pathname 第一層 route segment 解析語系。 */
export const getLeadingRouteLang = (pathname?: string | null): Lang | null =>
{
    const segment = LibRoutePath.getLeadingPathSegment(pathname);
    const lang = tryParseRouteLangSegment(segment);
    return lang;
};

/** 判斷 pathname 是否屬於不需要 route 語系處理的區段。 */
export const isRouteLangBypassPathname = (pathname?: string | null): boolean =>
{
    const isBypass = ROUTE_LANG_BYPASS_SEGMENTS.some(segment => LibRoutePath.isPathSegmentPrefix(pathname, segment));
    return isBypass;
};

/** 從 pathname 解析 route 語系，沒有語系時回預設語系。 */
export const resolveRouteLangFromPathname = (pathname?: string | null): Lang =>
{
    const lang = getLeadingRouteLang(pathname);
    return lang ?? DefaultLang;
};

/** 從 URL 解析 route 語系，沒有語系時回 null。 */
export const resolveRouteLangFromUrl = (value?: string | URL | null): Lang | null =>
{
    const url = buildUrl(value);
    const lang = getLeadingRouteLang(url?.pathname);
    return lang;
};

/** 從 Request 的 Cookie 讀取 route 語系。 */
export const readRouteLangCookieFromRequest = (request?: Request | null): Lang | null =>
{
    const value = LibCookie.readRequestCookieValue(request, LANG_COOKIE_KEY);
    const lang = tryNormalizeRouteLang(value);
    return lang;
};

/** 從 Client Cookie 讀取 route 語系。 */
export const readRouteLangCookieFromClient = (): Lang | null =>
{
    const value = LibCookie.readClientCookieValue(LANG_COOKIE_KEY);
    const lang = tryNormalizeRouteLang(value);
    return lang;
};

/** 從 Request 的 Accept-Language 讀取 route 語系。 */
export const readRouteLangFromRequestAcceptLanguage = (request?: Request | null): Lang | null =>
{
    const header = request?.headers.get("accept-language") ?? "";
    const lang = pickRouteLangFromAcceptLanguage(header);
    return lang;
};

/** 從 Request 解析 route 語系，優先順序為 URL、Cookie、Accept-Language、DefaultLang。 */
export const resolveRouteLangFromRequest = (request?: Request | null): Lang =>
{
    const urlLang = resolveRouteLangFromUrl(request?.url);
    const cookieLang = readRouteLangCookieFromRequest(request);
    const acceptLang = readRouteLangFromRequestAcceptLanguage(request);
    const lang = urlLang ?? cookieLang ?? acceptLang ?? DefaultLang;
    return lang;
};

/** 移除 pathname 第一層 route 語系 segment。 */
export const stripLeadingRouteLang = (pathname?: string | null): string =>
{
    const lang = getLeadingRouteLang(pathname);
    if (!lang) return LibRoutePath.normalizeInternalPath(pathname);
    const path = LibRoutePath.removeLeadingPathSegment(pathname);
    return path;
};

/** 依指定語系建立 route pathname。 */
export const buildLangPathname = (pathname: string, lang: Lang): string =>
{
    if (!pathname.startsWith("/")) return pathname;
    if (isRouteLangBypassPathname(pathname)) return pathname;

    const basePath = stripLeadingRouteLang(pathname);
    if (lang === DefaultLang) return basePath;

    const nextPath = basePath === "/" ? `/${lang}` : `/${lang}${basePath}`;
    return nextPath;
};
// #endregion

// #region Private
/** 解碼並正規化 route 語系文字。 */
const decodeRouteLangText = (value?: string | null): string =>
{
    const text = LibText.safeTrim(value);
    if (text.length === 0) return "";
    const decoded = decodeTextOrRaw(text);
    const normalized = decoded.toLowerCase().replaceAll(LANG_UNDERSCORE_SEPARATOR, LANG_CANONICAL_SEPARATOR);
    return normalized;
};

/** 安全 decode URI component。 */
const decodeTextOrRaw = (value: string): string =>
{
    try
    {
        return decodeURIComponent(value).trim();
    } catch
    {
        return value.trim();
    }
};

/** 將語系 alias 對應到系統支援語系。 */
const mapRouteLangAlias = (value: string): Lang | null =>
{
    if (isEnglishAlias(value)) return isSupportedLang(EN_LANG) ? EN_LANG : null;
    if (isZhTwAlias(value)) return isSupportedLang(ZH_TW_LANG) ? ZH_TW_LANG : null;

    return null;
};

/** 判斷是否為英文語系 alias。 */
const isEnglishAlias = (value: string): boolean =>
{
    const isAlias = value === EN_LANG || value.startsWith(`${EN_LANG}${LANG_CANONICAL_SEPARATOR}`);
    return isAlias;
};

/** 判斷是否為繁中語系 alias。 */
const isZhTwAlias = (value: string): boolean =>
{
    const isAlias = value === ZH_TW_LANG || value === "zh-hant-tw" || value.startsWith("zh-hant");
    return isAlias;
};

/** 解析單一 Accept-Language 項目。 */
const parseAcceptLanguageEntry = (value: string, index: number): AcceptLanguageEntry | null =>
{
    const parts = LibText.splitTrimToArray(value, ACCEPT_LANGUAGE_PARAM_SEPARATOR);
    const tag = parts[0] ?? "";
    if (tag.length === 0) return null;

    const q = parseAcceptLanguageQValue(parts);
    return { tag, q, index };
};

/** 解析 Accept-Language q-value。 */
const parseAcceptLanguageQValue = (parts: string[]): number =>
{
    const qPart = parts.find(item => item.toLowerCase().startsWith(ACCEPT_LANGUAGE_Q_PREFIX));
    if (!qPart) return DEFAULT_ACCEPT_LANGUAGE_Q_VALUE;

    const q = Number(qPart.slice(ACCEPT_LANGUAGE_Q_PREFIX.length));
    return Number.isFinite(q) ? q : DEFAULT_ACCEPT_LANGUAGE_Q_VALUE;
};

/** 排序 Accept-Language 項目。 */
const sortAcceptLanguageEntry = (a: AcceptLanguageEntry, b: AcceptLanguageEntry): number =>
{
    if (b.q !== a.q) return b.q - a.q;
    return a.index - b.index;
};

/** 建立 URL 物件。 */
const buildUrl = (value?: string | URL | null): URL | null =>
{
    if (value instanceof URL) return value;

    const text = LibText.safeTrim(value);
    if (text.length === 0) return null;

    return buildUrlFromText(text);
};

/** 從文字建立 URL 物件。 */
const buildUrlFromText = (value: string): URL | null =>
{
    try
    {
        return new URL(value, DEFAULT_URL_BASE);
    } catch
    {
        return null;
    }
};
// #endregion
