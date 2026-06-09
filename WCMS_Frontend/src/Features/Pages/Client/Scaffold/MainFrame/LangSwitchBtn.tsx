import GlobalPic from "@/Features/Assets/Client/images/svg_icon/icon-custom-global-W.svg";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { DefaultLang, type Lang, LangLabelMap } from "@/SysCore/i18n/lang";
import { useLang } from "@/SysCore/i18n/LangContext";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import React, { useCallback, useMemo, useRef } from "react";
import { useFetcher, useLocation, useNavigate } from "react-router-dom";

// #region Property
/** 語系切換按鈕參數 */
interface LangSwitchBtnProps
{
    /** 目前前台站台路由資料 */
    site: INormSite;
}

/** 語系切換按鈕顯示與操作狀態 */
interface LangSwitchBtnState
{
    /** 目前可切換語系清單 */
    supportedLangs: Lang[];

    /** 目前作用中語系 */
    activeLang: Lang;

    /** 是否隱藏語系切換按鈕 */
    shouldHide: boolean;

    /** 是否使用 1816 規格樣式 */
    isSpec1816: boolean;

    /** 建立切換語系後的目標網址 */
    buildSwitchTo: (target: Lang) => string;

    /** 建立使用者意圖 prefetch 事件 */
    getIntentPrefetchHandlers: (url: string) => LangSwitchIntentHandlers;

    /** 處理語系連結點擊事件 */
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, target: Lang) => void;
}

/** 語系切換導頁行為 */
interface LangSwitchNavigationActions
{
    /** 目前 pathname */
    pathname: string;

    /** 建立切換語系後的目標網址 */
    buildSwitchTo: (target: Lang) => string;

    /** 處理語系連結點擊事件 */
    onLinkClick: (e: React.MouseEvent<HTMLAnchorElement>, target: Lang) => void;
}

/** 使用者意圖 prefetch 事件 */
interface LangSwitchIntentHandlers
{
    /** 滑鼠移入時預先載入 */
    onMouseEnter: () => void;

    /** 鍵盤 focus 時預先載入 */
    onFocus: () => void;

    /** 觸控開始時預先載入 */
    onTouchStart: () => void;
}

/** 語系切換內容參數 */
interface LangSwitchContentProps
{
    /** 語系切換按鈕狀態 */
    state: LangSwitchBtnState;
}

/** 兩語系切換按鈕參數 */
interface TwoLangSwitchProps
{
    /** 語系切換按鈕狀態 */
    state: LangSwitchBtnState;
}

/** 多語系下拉切換選單參數 */
interface DropdownLangSwitchProps
{
    /** 語系切換按鈕狀態 */
    state: LangSwitchBtnState;
}

/** 多語系下拉選單項目參數 */
interface DropdownLangItemProps
{
    /** 語系代碼 */
    lang: Lang;

    /** 語系切換按鈕狀態 */
    state: LangSwitchBtnState;
}

/** 語系文字顯示參數 */
interface LangTextProps
{
    /** 語系代碼 */
    lang: Lang;

    /** 是否使用 1816 規格樣式 */
    isSpec1816: boolean;
}
// #endregion

// #region Public
/** 前台語系切換按鈕。 */
export const LangSwitchBtn: React.FC<LangSwitchBtnProps> = ({ site }) =>
{
    const state = useLangSwitchBtnState(site);
    if (state.shouldHide) return null;

    return <LangSwitchContent state={state} />;
};
// #endregion

// #region Protected
/** 建立語系切換按鈕所需狀態與行為。 */
const useLangSwitchBtnState = (site: INormSite): LangSwitchBtnState =>
{
    const ctx = useLang();
    const activeLang = LibRouteLang.normalizeRouteLang(ctx.code);
    const supportedLangs = useSupportedLangs(site);
    const navigation = useLangSwitchNavigation(activeLang);
    const getIntentPrefetchHandlers = useIntentPrefetchHandlers();
    const shouldHide = supportedLangs.length <= 1 || LibRouteLang.isRouteLangBypassPathname(navigation.pathname);
    const isSpec1816 = import.meta.env.VITE_SPEC_CODE === "1816";

    return { supportedLangs, activeLang, shouldHide, isSpec1816, buildSwitchTo: navigation.buildSwitchTo, getIntentPrefetchHandlers, onLinkClick: navigation.onLinkClick };
};

/** 從站台路由資料推導可切換語系清單。 */
const useSupportedLangs = (site: INormSite): Lang[] =>
{
    return useMemo(() =>
    {
        const fromIndex = Object.keys(site.indexInfoByLang ?? {}).map(LibRouteLang.tryNormalizeRouteLang).filter((lang): lang is Lang => lang !== null);
        const fromTree = Object.keys(site.treeByLang ?? {}).map(LibRouteLang.tryNormalizeRouteLang).filter((lang): lang is Lang => lang !== null);
        const langs = Array.from(new Set<Lang>([DefaultLang, ...fromIndex, ...fromTree]));
        return langs;
    }, [site.indexInfoByLang, site.treeByLang]);
};

/** 建立語系切換導頁行為。 */
const useLangSwitchNavigation = (activeLang: Lang): LangSwitchNavigationActions =>
{
    const location = useLocation();
    const navigate = useNavigate();
    const buildSwitchTo = useCallback((target: Lang): string =>
    {
        const nextPath = LibRouteLang.buildLangPathname(location.pathname, target);
        const url = `${nextPath}${location.search}${location.hash}`;
        return url;
    }, [location.pathname, location.search, location.hash]);

    const go = useCallback((target: Lang): void =>
    {
        if (target === activeLang) return;
        LibRouteLang.writeRouteLangCookie(target);
        navigate(buildSwitchTo(target), { replace: true });
    }, [activeLang, buildSwitchTo, navigate]);

    const onLinkClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, target: Lang): void =>
    {
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        go(target);
    }, [go]);

    return { pathname: location.pathname, buildSwitchTo, onLinkClick };
};

/** 建立 hover、focus、touch 的預先載入事件。 */
const useIntentPrefetchHandlers = (): (url: string) => LangSwitchIntentHandlers =>
{
    const fetcher = useFetcher();
    const lastPrefetchUrlRef = useRef<string | null>(null);

    const prefetchUrl = useCallback((url: string): void =>
    {
        if (!url) return;
        if (lastPrefetchUrlRef.current === url) return;

        lastPrefetchUrlRef.current = url;
        fetcher.load(url);
    }, [fetcher]);

    return useCallback((url: string): LangSwitchIntentHandlers =>
    {
        return { onMouseEnter: () => prefetchUrl(url), onFocus: () => prefetchUrl(url), onTouchStart: () => prefetchUrl(url) };
    }, [prefetchUrl]);
};
// #endregion

// #region EntityComp
/** 建立語系切換內容。 */
const LangSwitchContent = ({ state }: LangSwitchContentProps) =>
{
    if (state.supportedLangs.length === 2) return <TwoLangSwitch state={state} />;

    return <DropdownLangSwitch state={state} />;
};

/** 建立兩語系切換按鈕。 */
const TwoLangSwitch = ({ state }: TwoLangSwitchProps) =>
{
    const other = resolveOtherLang(state.supportedLangs, state.activeLang);
    const switchUrl = state.buildSwitchTo(other);
    const intentHandlers = state.getIntentPrefetchHandlers(switchUrl);

    return (
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
                    <LangLink to={switchUrl} noLangPrefix type="button" role="button" title={LangLabelMap?.[other] ?? other} {...intentHandlers} onClick={(e) => state.onLinkClick(e, other)}>
                        <LangText lang={other} isSpec1816={state.isSpec1816} />
                    </LangLink>
                </div>
            </div>
        </li>
    );
};

/** 建立多語系下拉切換選單。 */
const DropdownLangSwitch = ({ state }: DropdownLangSwitchProps) =>
{
    return (
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 dropdown">
                    <a className="dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false" role="button" title="Language" onClick={(e) => e.preventDefault()}>
                        <div className="link-text">{LangLabelMap?.[state.activeLang] ?? state.activeLang}</div>
                    </a>
                    <ul className="dropdown-menu">
                        {state.supportedLangs.map(lang => <DropdownLangItem key={lang} lang={lang} state={state} />)}
                    </ul>
                </div>
            </div>
        </li>
    );
};

/** 建立多語系下拉選單項目。 */
const DropdownLangItem = ({ lang, state }: DropdownLangItemProps) =>
{
    const url = state.buildSwitchTo(lang);
    const intentHandlers = state.getIntentPrefetchHandlers(url);

    return (
        <li>
            <a href={url} className={`dropdown-item ${lang === state.activeLang ? "active" : ""}`} {...intentHandlers} onClick={(e) => state.onLinkClick(e, lang)}>
                {LangLabelMap?.[lang] ?? lang}
            </a>
        </li>
    );
};

/** 建立語系顯示文字。 */
const LangText = ({ lang, isSpec1816 }: LangTextProps) =>
{
    if (!isSpec1816) return <div className="link-text">{LangLabelMap?.[lang] ?? lang}</div>;

    return (
        <div className="link-text">
            <img src={GlobalPic} alt="" className="me-1" />
            {lang === "zh-tw" ? "中文" : "ＥＮ"}
        </div>
    );
};
// #endregion

// #region Private
/** 取得兩語系模式下的另一個語系。 */
const resolveOtherLang = (supportedLangs: Lang[], activeLang: Lang): Lang =>
{
    const lang = supportedLangs.find(item => item !== activeLang) ?? supportedLangs[1] ?? DefaultLang;
    return lang;
};
// #endregion
