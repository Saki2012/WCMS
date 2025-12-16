import React from "react";
import { Link, NavLink, type LinkProps, type NavLinkProps, type To } from "react-router-dom";
import { DefaultLang, SUPPORTED_LANGS, type Lang } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";

interface LangLinkProps extends Omit<LinkProps, "to"> {
    to: To;
    /** 強制指定語系（不給就用 LangContext 的 code） */
    lang?: Lang;
    /** 不加語系前綴（例如你想固定走 /401 或特殊頁） */
    noLangPrefix?: boolean;
}

interface LangNavLinkProps extends Omit<NavLinkProps, "to"> {
    to: To;
    /** 強制指定語系（不給就用 LangContext 的 code） */
    lang?: Lang;
    /** 不加語系前綴（例如你想固定走 /401 或特殊頁） */
    noLangPrefix?: boolean;
}

/** 判斷 pathname 是否已經包含支援語系前綴（例如 /en/...） */
const getLeadingLangPrefix = (pathname: string): Lang | null => {
    if (!pathname.startsWith("/")) return null;
    const seg1 = pathname.split("/").filter(Boolean)[0];
    if (!seg1) return null;
    const s = seg1.toLowerCase();
    return (SUPPORTED_LANGS as readonly string[]).includes(s) ? (s as Lang) : null;
};

const removeLeadingSegment = (pathname: string): string => {
    const rest = pathname.replace(/^\/[^/]+/, "");
    return rest === "" ? "/" : rest;
};

/** 將 pathname 依語系規則加上/移除 prefix（嚴格模式） */
export const buildLangPathname = (pathname: string, lang: Lang): string => {
    // 只處理「絕對路徑」，相對路徑一律原樣（避免破壞 react-router relative link）
    if (!pathname.startsWith("/")) return pathname;
    // 防呆：不要影響後台/服務路徑（通常前台不會用 Link 導到這些）
    if (pathname.startsWith("/Server") || pathname.startsWith("/Service")) return pathname;
    const leading = getLeadingLangPrefix(pathname);
    // 如果已經明確帶了語系前綴：
    if (leading) {
        // 預設語系不應出現在網址：/zh-tw/xxx -> /xxx
        if (leading === DefaultLang) return removeLeadingSegment(pathname);
        // 非 default：保持原樣（代表呼叫端刻意指定語系 URL）
        return pathname;
    }
    // 沒有語系前綴：依目前語系補上（default 不補）
    if (lang === DefaultLang) return pathname;
    // root '/' 特例：/ -> /en（不要 /en/）
    if (pathname === "/") return `/${lang}`;
    return `/${lang}${pathname}`;
};

const withLangTo = (to: To, lang: Lang): To => {
    if (typeof to === "string") return buildLangPathname(to, lang);
    // To 也可能是 { pathname, search, hash, state }
    const pathname = to.pathname ?? "";
    if (!pathname) return to;
    return { ...to, pathname: buildLangPathname(pathname, lang), };
};

export const LangLink: React.FC<LangLinkProps> = (props) => {
    const { to, lang, noLangPrefix, ...rest } = props;
    const ctx = useLang();
    const activeLang = (lang ?? ctx.code ?? DefaultLang) as Lang;
    const finalTo = React.useMemo(() => (noLangPrefix ? to : withLangTo(to, activeLang)), [to, activeLang, noLangPrefix],);
    return <Link to={finalTo} {...rest} />;
};

export const LangNavLink: React.FC<LangNavLinkProps> = (props) => {
    const { to, lang, noLangPrefix, ...rest } = props;
    const ctx = useLang();
    const activeLang = (lang ?? ctx.code ?? DefaultLang) as Lang;
    const finalTo = React.useMemo(() => (noLangPrefix ? to : withLangTo(to, activeLang)), [to, activeLang, noLangPrefix],);
    return <NavLink to={finalTo} {...rest} />;
};