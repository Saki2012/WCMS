/*Header模塊*/
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import logImg from "@/SpecFetures/1810/Assets/Client/images/logo/logo_450x80.svg";
import subLogImg from "@/SpecFetures/1810/Assets/Client/images/logo/logo_M320_191x60.svg";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { type MouseEvent as ReactMouseEvent, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { SpecLangSwitchBtn } from "./SpecLangSwitchBtn";

// #region Property
declare global
{
    interface Window
    {
        google: any;
        googleTranslateElementInit: () => void;
    }
}
// #endregion

// #region Public
export const Header = ({ lang, site, style }: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const data = { Title: "國立臺灣藝術大學_研究發展處 LOGO", SrcImg: logImg, SubSrcImg: subLogImg };
    const headerRef = useRef<HTMLElement>(null);
    const location = useLocation();
    const isPreviewMode = isPreviewPathname(location.pathname);
    useHeaderBehaviorRef(headerRef, location.pathname, lang);
    return (
        <>
            <noscript>
                <div style={{ color: "red" }}>{"您的瀏覽器不支援 JavaScript，請開啟 Javascript 功能。"}</div>
            </noscript>
            <a href="#content" id="gotocenter" title="跳到頁面主要內容區" tabIndex={1} className="sr-only sr-only-focusable">跳到頁面主要內容區</a>
            <div id="site-header" className="LL_Header_DivBar main-header">
                <section className="header_section">
                    <header className="header_Box" ref={headerRef}>
                        <div className="container-fluid-customize h-100 mr-0 pr-0">
                            <div className="HeaderDivBox">
                                <div className="leftBox">
                                    <div className="logo">
                                        <h1>
                                            <LangNavLink className="P_logo" to="/" title={data.Title} tabIndex={1}>
                                                <img src={data.SrcImg} alt={data.Title} />
                                            </LangNavLink>
                                            <LangNavLink className="M320_logo" to="/" title={data.Title} tabIndex={1}>
                                                <img src={data.SubSrcImg} alt={data.Title} />
                                            </LangNavLink>
                                        </h1>
                                    </div>
                                </div>
                                <MainMenu lang={lang} site={site} style={style} pathname={location.pathname} isPreviewMode={isPreviewMode}></MainMenu>
                                <div className="overlayer"></div>
                                <div className="rightBox">
                                    <button className="main" type="button">
                                        <div>
                                            <i className="fa customize-bars" aria-hidden="true"></i>
                                        </div>
                                        <span>MENU</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                </section>
            </div>
            {/* <GoTopButton /> */}
        </>
    );
};


/** 1810 主選單 metisMenu-like 行為，對標舊 WebForms 的展開動畫與箭頭切換。 */
export const useLegacyMenuDOM = (menuRef: React.RefObject<HTMLUListElement>) =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const root = menuRef.current;
        if (!root) return;

        const onClick = (e: Event) => handleLegacyMenuClick(e, root);
        const onMouseDown = (e: Event) => preventLegacyMenuMouseFocus(e, root);
        root.addEventListener("click", onClick);
        root.addEventListener("mousedown", onMouseDown);

        const observer = bindHeaderMenuCloseObserver(root);

        return () =>
        {
            root.removeEventListener("click", onClick);
            root.removeEventListener("mousedown", onMouseDown);
            observer?.disconnect();
        };
    }, [menuRef]);
};

/** 阻止滑鼠點擊讓主選單連結取得 focus，避免 SPA 殘留 click 色。 */
const preventLegacyMenuMouseFocus = (e: Event, root: HTMLElement): void =>
{
    // 宣告變數
    const link = (e.target as Element).closest("a") as HTMLAnchorElement | null;

    // 執行 function
    if (!link || !root.contains(link)) return;
    e.preventDefault();
};

/** 處理 1810 主選單點擊。 */
const handleLegacyMenuClick = (e: Event, root: HTMLElement): void =>
{
    const link = (e.target as Element).closest("a") as HTMLAnchorElement | null;
    if (!link || !root.contains(link)) return;

    const li = link.closest("li") as HTMLElement | null;
    if (!li) return;

    const childUl = getDirectChildUl(li);
    if (!childUl)
    {
        blurNativeAnchorOnMouse(e, link);
        closeMenu();
        return;
    }

    e.preventDefault();
    toggleLegacyMenuBranch(li, childUl);
    blurNativeAnchorOnMouse(e, link);
};

/** 切換 1810 主選單分支。 */
const toggleLegacyMenuBranch = (li: HTMLElement, childUl: HTMLElement): void =>
{
    const isOpen = li.classList.contains("active") && childUl.classList.contains("in");

    if (isOpen)
    {
        hideLegacyCollapse(childUl);
        return;
    }

    closeLegacySiblingBranches(li);
    showLegacyCollapse(childUl);
};

/** 展開 1810 collapse，模擬 metisMenu show。 */
const showLegacyCollapse = (childUl: HTMLElement): void =>
{
    // 宣告變數
    const li = childUl.parentElement as HTMLElement | null;
    if (!li || isLegacyCollapseOpen(childUl)) return;

    // 執行 function
    li.classList.add("active");
    setLegacyArrow(li, true);
    childUl.classList.remove("collapse", "in", "show");
    childUl.classList.add("collapsing");
    childUl.style.display = "block";
    childUl.style.overflow = "hidden";
    childUl.style.height = "0px";

    const targetHeight = childUl.scrollHeight;
    requestAnimationFrame(() => childUl.style.height = `${targetHeight}px`);
    window.setTimeout(() => completeLegacyShow(childUl), 350);
};

/** 收合 1810 collapse，模擬 metisMenu hide。 */
const hideLegacyCollapse = (childUl: HTMLElement): void =>
{
    // 宣告變數
    const li = childUl.parentElement as HTMLElement | null;
    if (!li || !isLegacyCollapseOpen(childUl)) return;

    // 執行 function
    li.classList.remove("active");
    setLegacyArrow(li, false);
    childUl.style.display = "block";
    childUl.style.overflow = "hidden";
    childUl.style.height = `${childUl.scrollHeight}px`;
    void childUl.offsetHeight;
    childUl.classList.remove("collapse", "in", "show");
    childUl.classList.add("collapsing");

    requestAnimationFrame(() => childUl.style.height = "0px");
    window.setTimeout(() => completeLegacyHide(childUl), 350);
};

/** 完成展開狀態。 */
const completeLegacyShow = (childUl: HTMLElement): void =>
{
    // 執行 function
    childUl.classList.remove("collapsing");
    childUl.classList.add("collapse", "in", "show");
    clearLegacyCollapseStyle(childUl);
};

/** 完成收合狀態。 */
const completeLegacyHide = (childUl: HTMLElement): void =>
{
    // 執行 function
    closeLegacyDescendants(childUl);
    childUl.classList.remove("collapsing", "in", "show");
    childUl.classList.add("collapse");
    clearLegacyCollapseStyle(childUl);
};

/** 關閉同層其他分支。 */
const closeLegacySiblingBranches = (li: HTMLElement): void =>
{
    const siblings = Array.from(li.parentElement?.children ?? []) as HTMLElement[];
    siblings.forEach(sibling =>
    {
        if (sibling === li) return;
        const sub = getDirectChildUl(sibling);
        if (sub?.classList.contains("in")) hideLegacyCollapse(sub);
    });
};

/** 關閉後代分支與箭頭。 */
const closeLegacyDescendants = (root: HTMLElement): void =>
{
    root.querySelectorAll("li.active").forEach(node =>
    {
        const li = node as HTMLElement;
        li.classList.remove("active");
        setLegacyArrow(li, false);
    });

    root.querySelectorAll("ul.in, ul.collapsing").forEach(node => resetLegacyCollapse(node as HTMLElement));
};

/** 重設 collapse 狀態。 */
const resetLegacyCollapse = (childUl: HTMLElement): void =>
{
    // 執行 function
    childUl.classList.remove("in", "show", "collapsing");
    childUl.classList.add("collapse");
    clearLegacyCollapseStyle(childUl);
};

/** 判斷主選單分支是否已展開。 */
const isLegacyCollapseOpen = (childUl: HTMLElement): boolean =>
{
    // return
    return childUl.classList.contains("in") || childUl.classList.contains("show");
};

/** 清除主選單動畫期間的 inline style。 */
const clearLegacyCollapseStyle = (childUl: HTMLElement): void =>
{
    // 執行 function
    childUl.style.height = "";
    childUl.style.display = "";
    childUl.style.overflow = "";
};

/** 取得直接子層 ul。 */
const getDirectChildUl = (li: HTMLElement): HTMLElement | null =>
{
    return li.querySelector(":scope > ul") as HTMLElement | null;
};

/** 切換 1810 箭頭方向。 */
const setLegacyArrow = (li: HTMLElement, open: boolean): void =>
{
    const icon = li.querySelector(":scope > a i.arrow");
    if (!icon) return;

    icon.classList.toggle("fa-angle-right", !open);
    icon.classList.toggle("fa-angle-down", open);
};

/** 監聽 header 關閉時重設主選單。 */
const bindHeaderMenuCloseObserver = (root: HTMLElement): MutationObserver | null =>
{
    const headerBox = document.querySelector(".header_Box");
    if (!headerBox) return null;

    const observer = new MutationObserver(() =>
    {
        if (!headerBox.classList.contains("active")) closeLegacyDescendants(root);
    });
    observer.observe(headerBox, { attributes: true, attributeFilter: ["class"] });
    return observer;
};

/** 滑鼠點擊後移除 focus，模擬舊站換頁後不殘留焦點色。 */
const blurNativeAnchorOnMouse = (e: Event, link: HTMLAnchorElement): void =>
{
    const mouseEvent = e as MouseEvent;
    if ((mouseEvent.detail ?? 0) > 0) link.blur();
};

/** React 連結滑鼠點擊後移除 focus。 */
const blurReactAnchorOnMouse = (e: ReactMouseEvent<HTMLAnchorElement>): void =>
{
    if (e.detail > 0) e.currentTarget.blur();
};
// #endregion

// #region Private
const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];
    return buildMenuItems(roots, 0);
};


const MainMenu = (prop: { lang: Lang; site: INormSite; style: IFETheme; pathname: string; isPreviewMode: boolean; }) =>
{
    const translateRef = useRef<HTMLDivElement>(null);
    const navsRef = useRef<HTMLDivElement>(null);
    const menuItems = GetMenuData(prop.lang, prop.site);
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const scriptId = "google-translate-script";
        const exist = document.getElementById(scriptId);
        if (exist) return;
        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
        script.async = true;
        document.body.appendChild(script);
        window.googleTranslateElementInit = () =>
        {
            if (translateRef.current)
            {
                new window.google.translate.TranslateElement({ pageLanguage: prop.lang }, translateRef.current);
            }
        };
    }, [prop.lang]);

    const menuRef = useRef<HTMLUListElement>(null);
    useLegacyMenuDOM(menuRef);

    return (
        <div className="menulayer">
            <button type="button" className="closemain" tabIndex={1}>
                <div>
                    <i className="fa customize-close" aria-hidden="true"></i>
                </div>
                <span>CLOSE</span>
            </button>
            {/* // contentmenu // */}
            <div className="contentmenu">
                <div className="google_box" ref={translateRef}>
                    <div className="container-custom">
                        <div id="google_translate_element" tabIndex={1}></div>
                    </div>
                </div>
                {/* // topBox上方選單 // */}
                <div className="topBox">
                    <div className="navsBox" ref={navsRef}>
                        <ul className={clsx("nav", "Customize_Nav")}>
                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to={resolvePreviewSafeMenuUrl("/", prop.isPreviewMode)} title="首頁" onClick={(e) => handlePreviewMenuLinkClick(e, prop.isPreviewMode)}>首頁</LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to={resolvePreviewSafeMenuUrl("https://www.ntua.edu.tw/", prop.isPreviewMode)} title="臺藝大校首頁" onClick={(e) => handlePreviewMenuLinkClick(e, prop.isPreviewMode)}>
                                    臺藝大校首頁
                                </LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to={resolvePreviewSafeMenuUrl("Sitemap", prop.isPreviewMode)} title="網站導覽" onClick={(e) => handlePreviewMenuLinkClick(e, prop.isPreviewMode)}>網站導覽</LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <SpecLangSwitchBtn site={prop.site} />
                            </li>
                        </ul>
                    </div>
                </div>
                {/* // topBox上方選單 end // */}
                <div className="SearchBar">
                    <div className="search_DivBox">
                        <input
                            className="search_input"
                            type="text"
                            placeholder="Search"
                            id="search-box"
                            onKeyUp={() =>
                            {
                                "Search(event)";
                            }}
                            tabIndex={1}
                            title="Search"
                        />
                    </div>
                </div>
                {/* // menuBox // */}
                <nav className="menuBox">
                    <ul id="menu" ref={menuRef}>
                        <MainMenuItems1810 items={menuItems} depth={1} isPreviewMode={prop.isPreviewMode} />
                    </ul>
                </nav>
                {/* // down-social // */}
                <div className="down-social">
                    <a
                        href="#"
                        onClick={(e) =>
                        {
                            e.preventDefault();
                        }}
                        className="Facebook"
                        title="Facebook(另開新視窗)"
                        rel="noopener noreferrer"
                        target="_blank"
                        tabIndex={1}
                    >
                        <i className="fa Customize-facebook" aria-hidden="true"></i>
                        <span className="sr-only">Facebook</span>
                    </a>

                    <a
                        href="#"
                        onClick={(e) =>
                        {
                            e.preventDefault();
                        }}
                        className="Instagram"
                        title="Instagram(另開新視窗)"
                        rel="noopener noreferrer"
                        target="_blank"
                        tabIndex={1}
                    >
                        <i className="fa Customize-instagram" aria-hidden="true"></i>
                        <span className="sr-only">Instagram</span>
                    </a>

                    <a
                        href="#"
                        onClick={(e) =>
                        {
                            e.preventDefault();
                        }}
                        className="LINE"
                        title="LINE(另開新視窗)"
                        rel="noopener noreferrer"
                        target="_blank"
                        tabIndex={1}
                    >
                        <i className="fa Customize-line" aria-hidden="true"></i>
                        <span className="sr-only">LINE</span>
                    </a>
                </div>
            </div>
        </div>
    );
};



/** 1810 主選單項目列表，直接輸出舊版 CSS 期待的 ul/li/a 結構。 */
const MainMenuItems1810 = (props: { items: MenuItemData[]; depth: number; isPreviewMode: boolean; }) =>
{
    // return
    return (
        <>
            {props.items.map((item, index) => <MainMenuItem1810 key={`${item.Id}-${index}`} item={item} depth={props.depth} isPreviewMode={props.isPreviewMode} />)}
        </>
    );
};

/** 1810 主選單單一項目。 */
const MainMenuItem1810 = (props: { item: MenuItemData; depth: number; isPreviewMode: boolean; }) =>
{
    // 宣告變數
    const hasSub = hasMainMenuSubItems(props.item);
    const liClass = clsx(props.depth === 1 && "m-number");
    const url = resolvePreviewSafeMenuUrl(props.item.Url, props.isPreviewMode);
    const target = props.isPreviewMode ? undefined : props.item.URL_Open;

    // return
    return (
        <li className={liClass}>
            <LangLink to={url} title={props.item.SrcData} target={target} onClick={(e) => handleMainMenuLinkClick(e, hasSub, props.isPreviewMode)}>
                {renderMainMenuTitle(props.item.SrcData, props.depth)}
                {hasSub && <i className="fa fa-angle-right arrow" aria-hidden="true" />}
            </LangLink>
            {hasSub && (
                <ul className="collapse">
                    <MainMenuItems1810 items={props.item.SubItem} depth={props.depth + 1} isPreviewMode={props.isPreviewMode} />
                </ul>
            )}
        </li>
    );
};

/** 1810 主選單文字，避免 h2 吃到 Bootstrap 預設大字級。 */
const renderMainMenuTitle = (title: string, _depth: number) =>
{
    // return
    return title;
};


/** 主選單連結點擊處理，Preview 內全部阻止導頁。 */
const handleMainMenuLinkClick = (e: ReactMouseEvent<HTMLAnchorElement>, hasSub: boolean, isPreviewMode: boolean): void =>
{
    if (hasSub || isPreviewMode) e.preventDefault();
    if (isPreviewMode && !hasSub) closeMenu();
    blurReactAnchorOnMouse(e);
};

/** 判斷主選單是否有子項目。 */
const hasMainMenuSubItems = (item: MenuItemData): boolean =>
{
    // return
    return !!item.SubItem?.length;
};

/** 判斷主選單分支是否含目前路徑。 */
const hasMainMenuActiveRoute = (item: MenuItemData, pathname: string): boolean =>
{
    // 宣告變數
    const matchType = getMainMenuUrlMatchType(pathname, item.Url);

    // return
    return !!matchType || item.SubItem.some(child => hasMainMenuActiveRoute(child, pathname));
};

/** 判斷目前網址與主選單 URL 的關係。 */
const getMainMenuUrlMatchType = (currentPath: string, itemUrl?: string): "exact" | "ancestor" | null =>
{
    // 宣告變數
    if (!itemUrl || itemUrl === "#" || isMainMenuExternalUrl(itemUrl)) return null;

    const cur = stripMainMenuLangPrefix(currentPath);
    const url = stripMainMenuLangPrefix(itemUrl);

    // return
    if (cur === url) return "exact";
    if (url !== "/" && cur.startsWith(`${url}/`)) return "ancestor";
    return null;
};

/** 移除主選單語系路徑前綴。 */
const stripMainMenuLangPrefix = (path: string): string =>
{
    // 宣告變數
    const p = normalizeMainMenuPath(path);
    const segs = p.split("/").filter(Boolean);
    const first = segs[0]?.toLowerCase();

    // return
    if (!first || !isMainMenuLangCode(first)) return p;
    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};

/** 標準化主選單網址。 */
const normalizeMainMenuPath = (path: string): string =>
{
    // 宣告變數
    const clean = (path ?? "/").split("?")[0].split("#")[0];

    // return
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 判斷是否為主選單語系代碼。 */
const isMainMenuLangCode = (value: string): boolean =>
{
    // return
    return value === "zh-tw" || value === "zh-cn" || value === "en";
};

/** 判斷主選單是否外部連結。 */
const isMainMenuExternalUrl = (url?: string | null): boolean =>
{
    // return
    return !!url && (/^https?:\/\//i.test(url) || url.startsWith("//"));
};

/** Preview 內選單連結固定使用 #，避免誤導到不存在 route。 */
const resolvePreviewSafeMenuUrl = (url: string, isPreviewMode: boolean): string =>
{
    // return
    return isPreviewMode ? "#" : url;
};

/** Preview 內 header 上方連結只關閉選單，不執行導頁。 */
const handlePreviewMenuLinkClick = (e: ReactMouseEvent<HTMLAnchorElement>, isPreviewMode: boolean): void =>
{
    // 執行 function
    if (isPreviewMode) e.preventDefault();
    closeMenu();
    blurReactAnchorOnMouse(e);
};

/** 判斷目前是否在 Preview Template 或 fake node route。 */
const isPreviewPathname = (pathname: string): boolean =>
{
    // 宣告變數
    const path = stripMainMenuLangPrefix(normalizeMainMenuPath(pathname)).toLowerCase();

    // return
    return path === "/template" || path.endsWith("/template") || path === "/preview" || path.startsWith("/preview/");
};

const closeMenu = () =>
{
    const headerBox = document.querySelector(".header_Box");
    if (headerBox)
    {
        document.body.style.overflow = "auto";
        headerBox.classList.remove("active");
    }
};

const closeHeaderMenu = (headerEl: HTMLElement) =>
{
    // 執行 function：統一關閉 header menu
    document.body.style.overflow = "auto";
    headerEl.classList.remove("active");
};


const openHeaderMenu = (headerEl: HTMLElement) =>
{
    // 執行 function：統一開啟 header menu
    document.body.style.overflow = "hidden";
    headerEl.classList.add("active");
};

const toggleHeaderMenu = (headerEl: HTMLElement) =>
{
    // 宣告變數
    const isActive = headerEl.classList.contains("active");

    // 執行 function
    if (isActive) closeHeaderMenu(headerEl);
    else openHeaderMenu(headerEl);
};

const useHeaderBehaviorRef = (headerRef: React.RefObject<HTMLElement | null>, pathname: string, lang: Lang) =>
{
    useEffect(() =>
    {
        // 宣告變數
        if (typeof window === "undefined") return;

        const headerEl = headerRef.current;
        if (!headerEl) return;

        const btnMain = headerEl.querySelector("button.main");
        const btnClose = headerEl.querySelector("button.closemain");
        const overlay = headerEl.querySelector("div.overlayer");

        const handleToggle = () => toggleHeaderMenu(headerEl);
        const handleScroll = () =>
        {
            const scroll = window.scrollY;
            const logos = document.querySelectorAll(".logo");
            const mains = document.querySelectorAll(".main");
            const siteheader = document.querySelectorAll("#site-header");

            siteheader.forEach((el) => el.classList.toggle("fixed", scroll >= 100));
            // siteheader.forEach((el) => el.classList.toggle('w-100', scroll >= 100));
            logos.forEach((el) => el.classList.toggle("hide", scroll >= 100));
            mains.forEach((el) => el.classList.toggle("bg-custom-s5", scroll >= 100));
        };

        // 執行 function：重綁事件
        btnMain?.addEventListener("click", handleToggle);
        btnClose?.addEventListener("click", handleToggle);
        overlay?.addEventListener("click", handleToggle);
        window.addEventListener("scroll", handleScroll);

        // return：清理舊事件與狀態
        return () =>
        {
            btnMain?.removeEventListener("click", handleToggle);
            btnClose?.removeEventListener("click", handleToggle);
            overlay?.removeEventListener("click", handleToggle);
            window.removeEventListener("scroll", handleScroll);
            closeHeaderMenu(headerEl);
        };
    }, [headerRef, pathname, lang]);
}
// #endregion
