import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { DefaultLang, isSupportedLang, type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import React, { useCallback, useMemo, useRef } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router-dom";

// #region Public
export const SpecLangSwitchBtn: React.FC<{ site: INormSite; }> = ({ site }) =>
{
    // 宣告變數：語系/路由/導頁工具
    const ctx = useLang();
    const location = useLocation();
    const navigate = useNavigate();
    const fetcher = useFetcher();
    const lastPrefetchUrlRef = useRef<string | null>(null);

    // 執行 function：避免同一個 url 重複 prefetch
    const prefetchUrl = useCallback((url: string) =>
    {
        if (!url) return;
        if (lastPrefetchUrlRef.current === url) return;
        lastPrefetchUrlRef.current = url;
        fetcher.load(url);
    }, [fetcher]);

    // 執行 function：hover / focus / touch 時先 prefetch
    const getIntentPrefetchHandlers = useCallback((url: string) =>
    {
        return { onMouseEnter: () => prefetchUrl(url), onFocus: () => prefetchUrl(url), onTouchStart: () => prefetchUrl(url) };
    }, [prefetchUrl]);

    // 宣告變數：從 site 推導可用語系列表
    const supportedLangs = useMemo(() =>
    {
        const fromIndex = Object.keys(site.indexInfoByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
        const fromTree = Object.keys(site.treeByLang ?? {}).map(s => s.toLowerCase()).filter(isSupportedLang) as Lang[];
        return Array.from(new Set<Lang>([DefaultLang, ...fromIndex, ...fromTree]));
    }, [site.indexInfoByLang, site.treeByLang]);

    // 宣告變數：目前語系
    const activeLang = (ctx.code ?? DefaultLang) as Lang;

    // 執行 function：產生切換後網址，保留 query / hash
    const buildSwitchTo = useCallback((target: Lang) =>
    {
        const pathname = location.pathname;
        const parts = pathname.split("/").filter(Boolean);

        if (parts[0] && isSupportedLang(parts[0])) parts.shift();

        const base = "/" + parts.join("/");
        const cleanBase = base === "/" ? "/" : base;
        const nextPath = target === DefaultLang ? cleanBase : (cleanBase === "/" ? `/${target}` : `/${target}${cleanBase}`);

        return `${nextPath}${location.search}${location.hash}`;
    }, [location.pathname, location.search, location.hash]);

    // 執行 function：寫入語系 cookie，避免被 loader 再導回舊語系
    const setLangCookie = useCallback((lang: Lang) =>
    {
        if (typeof document === "undefined") return;

        const maxAge = 60 * 60 * 24 * 365;
        const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

        document.cookie = `${LANG_COOKIE_KEY}=${encodeURIComponent(lang)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
    }, []);

    // 執行 function：切換語系
    const go = useCallback((target: Lang) =>
    {
        if (target === activeLang) return;
        setLangCookie(target);
        navigate(buildSwitchTo(target), { replace: true });
    }, [activeLang, buildSwitchTo, navigate, setLangCookie]);

    // 執行 function：攔截左鍵點擊，改走 router navigation
    const onLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, target: Lang) =>
    {
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        e.preventDefault();
        go(target);
    }, [go]);

    // 宣告變數：後台與 service 路徑不顯示
    const path = location.pathname.toLowerCase();
    const isServerRoute = path === "/server" || path.startsWith("/server/");
    const isServiceRoute = path === "/service" || path.startsWith("/service/");

    if (supportedLangs.length <= 1 || isServerRoute || isServiceRoute) return null;

    // 執行 function：只有兩語系時顯示單一切換按鈕
    if (supportedLangs.length === 2)
    {
        const other = supportedLangs.find(x => x !== activeLang) ?? supportedLangs[1];
        const switchUrl = buildSwitchTo(other);
        const intentHandlers = getIntentPrefetchHandlers(switchUrl);

        return (
            <a
                className="nav-link"
                href={switchUrl}
                role="button"
                title={LangLabelMap?.[other] ?? other}
                tabIndex={0}
                {...intentHandlers}
                onClick={(e) => onLinkClick(e, other)}
            >
                <div className="link-text">{LangLabelMap?.[other] ?? other}</div>
            </a>
        );
    }

    // 執行 function：三語系以上時顯示 dropdown
    return (
        <div className="icons">
            <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
                <a
                    className="dropdown-toggle"
                    data-bs-toggle="dropdown"
                    aria-expanded="false"
                    role="button"
                    title="Language"
                    tabIndex={0}
                    onClick={(e) => e.preventDefault()}
                >
                    <div className="link-text">{LangLabelMap?.[activeLang] ?? activeLang}</div>
                </a>

                <ul className="dropdown-menu">
                    {supportedLangs.map(l =>
                    {
                        const url = buildSwitchTo(l);
                        const intentHandlers = getIntentPrefetchHandlers(url);

                        return (
                            <li key={l}>
                                <a
                                    href={url}
                                    className={`dropdown-item ${l === activeLang ? "active" : ""}`}
                                    {...intentHandlers}
                                    onClick={(e) => onLinkClick(e, l)}
                                >
                                    {LangLabelMap?.[l] ?? l}
                                </a>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
};
// #endregion
