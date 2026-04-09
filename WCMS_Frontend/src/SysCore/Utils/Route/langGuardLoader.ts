// src/SysCore/Utils/Route/langGuardLoader.ts
import { DefaultLang, isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import { type LoaderFunctionArgs, redirect } from "react-router-dom";
/** 後台路徑前綴：完全不做語系處理 */
const BYPASS_PREFIXES = new Set(["server"]);

export const langGuardLoader = async ({ request }: LoaderFunctionArgs) =>
{
    const url = new URL(request.url);
    const parts = url.pathname.split("/").filter(Boolean);
    const seg1 = parts[0];

    // 1) /Server/... 完全不處理（避免影響後台）
    if (seg1 && BYPASS_PREFIXES.has(seg1.toLowerCase()))
    {
        return { resolvedLang: DefaultLang as Lang, pathname: url.pathname };
    }

    const seg1Lang = toCanonicalLangStrict(seg1);
    const rest = url.pathname.replace(/^\/[^/]+/, ""); // 去掉第一段後剩餘路徑（含 leading "/" 或空字串）

    // 2) 第一段是本站支援語系（或 alias 被 map 成支援語系）
    if (seg1Lang)
    {
        // 2-1) default lang 不允許出現在網址上：/zh-tw/xxx -> /xxx
        if (seg1Lang === DefaultLang)
        {
            const toPath = rest && rest.startsWith("/") ? rest : "/";
            throw redirect(`${toPath}${url.search}${url.hash}`, 302);
        }

        // 2-2) 非 default：語系段必須 canonical（如果 alias 有 mapping，這裡會導到 canonical）
        const seg1Lower = seg1?.toLowerCase() ?? "";
        if (seg1Lower !== seg1Lang)
        {
            throw redirect(`/${seg1Lang}${rest}${url.search}${url.hash}`, 302);
        }

        return { resolvedLang: seg1Lang as Lang, pathname: url.pathname };
    }

    // // 3) 嚴格：如果第一段「像語系碼」但不支援 => 直接 401
    // if (isPotentialLangSegment(seg1))
    // {
    //     const from = encodeURIComponent(url.pathname + url.search + url.hash);
    //     throw redirect(`${UNAUTHORIZED_PATH}?from=${from}`, 302);
    // }

    // 4) 沒語系段（一般前台路由）=> 視為 default
    const cookieLang = readCookieLang(request);
    const acceptLang = pickLangFromAcceptLanguage(request);
    const preferred = (cookieLang ?? acceptLang ?? DefaultLang) as Lang;

    // 非 default：要導到 /:lang 形態
    if (preferred !== DefaultLang)
    {
        const toPath = url.pathname === "/" ? `/${preferred}` : `/${preferred}${url.pathname}`;
        throw redirect(`${toPath}${url.search}${url.hash}`, 302);
    }

    return { resolvedLang: DefaultLang as Lang, pathname: url.pathname };
};

// #region Cookies相關
const getCookieValue = (cookieStr: string, name: string): string | undefined =>
{
    if (!cookieStr) return undefined;
    const escapedName = name.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
    const patternText = `(?:^|;\\s*)${escapedName}=([^;]*)`;
    const pattern = new RegExp(patternText);
    const m = cookieStr.match(pattern);
    return m ? decodeURIComponent(m[1]) : undefined;
};

const mapLangAlias = (raw: string): Lang | null =>
{
    const s = raw.trim().toLowerCase().replace(/_/g, "-");
    if (!s) return null;

    // exact hit
    if (isSupportedLang(s)) return s as Lang;

    // en-xx → en
    if (s === "en-us" || s.startsWith("en-")) return isSupportedLang("en") ? ("en" as Lang) : null;

    // zh-hant-xx / zh-tw → zh-tw
    if (s === "zh-tw" || s === "zh-hant-tw" || s.startsWith("zh-hant"))
    {
        return isSupportedLang("zh-tw") ? ("zh-tw" as Lang) : null;
    }

    // （未來如果你支援 zh-cn，再放開這段）
    // if (s === "zh-cn" || s.startsWith("zh-hans")) return isSupportedLang("zh-cn") ? ("zh-cn" as Lang) : null;

    return null;
};

// 嚴格收斂（支援 alias → canonical）
const toCanonicalLangStrict = (seg?: string | null): Lang | null =>
{
    if (!seg) return null;

    let s = "";
    try
    {
        s = decodeURIComponent(seg).trim().toLowerCase();
    } catch
    {
        s = String(seg).trim().toLowerCase();
    }

    if (!s) return null;

    if (isSupportedLang(s)) return s as Lang;
    return mapLangAlias(s);
};

const readCookieLang = (request: Request): Lang | null =>
{
    const cookieStr = request.headers.get("cookie")
        ?? (typeof document !== "undefined" ? document.cookie : "");
    const v = getCookieValue(cookieStr, LANG_COOKIE_KEY);
    return v ? toCanonicalLangStrict(v) : null;
};

// Accept-Language 解析（q 值排序）
const parseAcceptLanguage = (header: string): string[] =>
{
    if (!header) return [];
    return header
        .split(",")
        .map(p =>
        {
            const [tag, qpart] = p.trim().split(";");
            const q = qpart?.toLowerCase().startsWith("q=") ? Number(qpart.slice(2)) : 1;
            return { tag: tag.trim(), q: Number.isFinite(q) ? q : 1 };
        })
        .sort((a, b) => b.q - a.q)
        .map(x => x.tag)
        .filter(Boolean);
};

const pickLangFromAcceptLanguage = (request: Request): Lang | null =>
{
    const header = request.headers.get("accept-language")
        ?? (typeof navigator !== "undefined" ? (navigator.languages?.join(",") || navigator.language || "") : "");

    for (const tag of parseAcceptLanguage(header))
    {
        const c = toCanonicalLangStrict(tag);
        if (c) return c;
    }
    return null;
};
// #endregion
