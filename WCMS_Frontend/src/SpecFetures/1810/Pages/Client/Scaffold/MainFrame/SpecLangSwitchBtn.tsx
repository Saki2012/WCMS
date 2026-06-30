import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { dispatchPreviewLangChange } from "@/Features/Pages/Client/Scaffold/Preview/PreviewLangEvent";
import { DefaultLang, isSupportedLang, type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import React, { useCallback, useMemo, useRef } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router-dom";

// #region Property
interface SpecLangSwitchBtnProps
{
    site: INormSite;
}

interface SpecLangSwitchState
{
    supportedLangs: Lang[];
    activeLang: Lang;
    shouldHide: boolean;
    buildSwitchTo: (target: Lang) => string;
    getIntentPrefetchHandlers: (url: string) => LangSwitchIntentHandlers;
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, target: Lang) => void;
}

interface LangSwitchIntentHandlers
{
    onMouseEnter: () => void;
    onFocus: () => void;
    onTouchStart: () => void;
}
// #endregion

// #region Public
/** 1810 語系切換按鈕，Preview 模式下不觸發 route prefetch / 導頁。 */
export const SpecLangSwitchBtn: React.FC<SpecLangSwitchBtnProps> = ({ site }) =>
{
    // 宣告變數
    const state = useSpecLangSwitchState(site);

    // return
    if (state.shouldHide) return null;
    if (state.supportedLangs.length === 2) return <TwoLangSwitch state={state} />;
    return <DropdownLangSwitch state={state} />;
};
// #endregion

// #region Section
/** 建立兩語系切換按鈕。 */
const TwoLangSwitch = (props: { state: SpecLangSwitchState; }) =>
{
    // 宣告變數
    const other = props.state.supportedLangs.find(x => x !== props.state.activeLang) ?? props.state.supportedLangs[1] ?? DefaultLang;
    const switchUrl = props.state.buildSwitchTo(other);
    const intentHandlers = props.state.getIntentPrefetchHandlers(switchUrl);

    // return
    return (
        <a className="nav-link" href={switchUrl} title={LangLabelMap?.[other] ?? other} {...intentHandlers} onClick={(e) => props.state.onLinkClick(e, other)}>
            {LangLabelMap?.[other] ?? other}
        </a>
    );
};

/** 建立三語系以上下拉切換選單。 */
const DropdownLangSwitch = (props: { state: SpecLangSwitchState; }) =>
{
    // return
    return (
        <div className="icons">
            <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
                <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" title="Language" tabIndex={0} onClick={(e) => e.preventDefault()}>
                    <div className="link-text">{LangLabelMap?.[props.state.activeLang] ?? props.state.activeLang}</div>
                </a>
                <ul className="dropdown-menu">
                    {props.state.supportedLangs.map(l => <DropdownLangItem key={l} lang={l} state={props.state} />)}
                </ul>
            </div>
        </div>
    );
};

/** 建立語系下拉項目。 */
const DropdownLangItem = (props: { lang: Lang; state: SpecLangSwitchState; }) =>
{
    // 宣告變數
    const url = props.state.buildSwitchTo(props.lang);
    const intentHandlers = props.state.getIntentPrefetchHandlers(url);

    // return
    return (
        <li>
            <a href={url} className={`dropdown-item ${props.lang === props.state.activeLang ? "active" : ""}`} {...intentHandlers} onClick={(e) => props.state.onLinkClick(e, props.lang)}>
                {LangLabelMap?.[props.lang] ?? props.lang}
            </a>
        </li>
    );
};
// #endregion

// #region Private
/** 建立 1810 語系切換狀態。 */
const useSpecLangSwitchState = (site: INormSite): SpecLangSwitchState =>
{
    // 宣告變數
    const ctx = useLang();
    const location = useLocation();
    const navigate = useNavigate();
    const activeLang = normalizeLang(ctx.code);
    const isPreviewMode = isPreviewPathname(location.pathname);
    const supportedLangs = useSupportedLangs(site);
    const buildSwitchTo = useBuildSwitchTo(location, isPreviewMode);
    const getIntentPrefetchHandlers = useIntentPrefetchHandlers(!isPreviewMode);

    // 執行 function
    const go = useCallback((target: Lang) =>
    {
        if (target === activeLang) return;
        setLangCookie(target);
        if (isPreviewMode)
        {
            ctx.setCode(target);
            dispatchPreviewLangChange(target);
            return;
        }
        navigate(buildSwitchTo(target), { replace: true });
    }, [activeLang, buildSwitchTo, ctx, isPreviewMode, navigate]);

    const onLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, target: Lang) =>
    {
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(target);
    }, [go]);

    // return
    return { supportedLangs, activeLang, shouldHide: resolveShouldHide(location.pathname, supportedLangs), buildSwitchTo, getIntentPrefetchHandlers, onLinkClick };
};

/** 從 site 推導可切換語系列表。 */
const useSupportedLangs = (site: INormSite): Lang[] =>
{
    return useMemo(() =>
    {
        const fromIndex = Object.keys(site.indexInfoByLang ?? {}).map(normalizeLang).filter(isSupportedLang);
        const fromTree = Object.keys(site.treeByLang ?? {}).map(normalizeLang).filter(isSupportedLang);
        return Array.from(new Set<Lang>([DefaultLang, ...fromIndex, ...fromTree]));
    }, [site.indexInfoByLang, site.treeByLang]);
};

/** 建立切換語系後的網址。 */
const useBuildSwitchTo = (location: ReturnType<typeof useLocation>, isPreviewMode: boolean) =>
{
    return useCallback((target: Lang): string =>
    {
        if (isPreviewMode) return "#";
        const parts = location.pathname.split("/").filter(Boolean);
        if (parts[0] && isSupportedLang(parts[0])) parts.shift();
        const cleanBase = parts.length ? `/${parts.join("/")}` : "/";
        const nextPath = target === DefaultLang ? cleanBase : (cleanBase === "/" ? `/${target}` : `/${target}${cleanBase}`);
        return `${nextPath}${location.search}${location.hash}`;
    }, [isPreviewMode, location.hash, location.pathname, location.search]);
};

/** 建立 hover、focus、touch 的預先載入事件。 */
const useIntentPrefetchHandlers = (enabled: boolean): (url: string) => LangSwitchIntentHandlers =>
{
    // 宣告變數
    const fetcher = useFetcher();
    const lastPrefetchUrlRef = useRef<string | null>(null);

    // 執行 function
    const prefetchUrl = useCallback((url: string): void =>
    {
        if (!enabled || !url || url === "#") return;
        if (lastPrefetchUrlRef.current === url) return;
        lastPrefetchUrlRef.current = url;
        fetcher.load(url);
    }, [enabled, fetcher]);

    // return
    return useCallback((url: string) => ({ onMouseEnter: () => prefetchUrl(url), onFocus: () => prefetchUrl(url), onTouchStart: () => prefetchUrl(url) }), [prefetchUrl]);
};

/** 寫入語系 Cookie，避免 loader 導回舊語系。 */
const setLangCookie = (lang: Lang): void =>
{
    // 宣告變數
    if (typeof document === "undefined") return;
    const maxAge = 60 * 60 * 24 * 365;
    const secure = typeof window !== "undefined" && window.location.protocol === "https:" ? "; Secure" : "";

    // 執行 function
    document.cookie = `${LANG_COOKIE_KEY}=${encodeURIComponent(lang)}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
};

/** 判斷是否隱藏語系切換。 */
const resolveShouldHide = (pathname: string, supportedLangs: Lang[]): boolean =>
{
    // 宣告變數
    const path = pathname.toLowerCase();
    const isServerRoute = path === "/server" || path.startsWith("/server/");
    const isServiceRoute = path === "/service" || path.startsWith("/service/");

    // return
    return supportedLangs.length <= 1 || isServerRoute || isServiceRoute;
};

/** 判斷目前是否在 Preview Template 或 fake node route。 */
const isPreviewPathname = (pathname: string): boolean =>
{
    // 宣告變數
    const path = stripLangPrefix(normalizePath(pathname)).toLowerCase();

    // return
    return path === "/template" || path.endsWith("/template") || path === "/preview" || path.startsWith("/preview/");
};

/** 標準化語系代碼。 */
const normalizeLang = (value?: string | null): Lang =>
{
    // 宣告變數
    const lang = String(value ?? DefaultLang).toLowerCase();

    // return
    return isSupportedLang(lang) ? lang : DefaultLang;
};

/** 標準化路徑。 */
const normalizePath = (path: string): string =>
{
    // 宣告變數
    const clean = (path ?? "/").split("?")[0].split("#")[0];

    // return
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 移除語系路徑前綴。 */
const stripLangPrefix = (path: string): string =>
{
    // 宣告變數
    const p = normalizePath(path);
    const segs = p.split("/").filter(Boolean);
    const first = segs[0]?.toLowerCase();

    // return
    if (!first || !isSupportedLang(first)) return p;
    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};
// #endregion
