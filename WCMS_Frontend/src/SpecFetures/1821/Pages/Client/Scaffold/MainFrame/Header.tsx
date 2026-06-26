/** Header 模組：依照 1821 prototype 的 Site-Header 結構整理前台 Header。 */
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { A11yContent } from "@/Features/Pages/Client/Scaffold/MainFrame/Header";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LogoImg from "@/SpecFetures/1821/Assets/Client/images/logo/LOGO_500x50.svg";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { type MouseEvent as ReactMouseEvent, type RefObject, useEffect, useMemo, useRef, useState } from "react";

// #region Property
interface HeaderProp
{
    lang: Lang;
    site: INormSite;
    style: IFETheme;
}
interface HeaderSectionProp
{
    lang: Lang;
    site: INormSite;
}
interface HeaderText
{
    home: string;
    ntuaHome: string;
    sitemap: string;
    search: string;
    searchPlaceholder: string;
    searchSubmit: string;
    logoTitle: string;
    mobileMenu: string;
}
interface FontSizeOption
{
    size: number;
    label: string;
    title: string;
}
interface FontSizeButtonProp
{
    option: FontSizeOption;
    activeSize: number;
    onChange: (size: number) => void;
}
interface SearchControlProp
{
    buttonId: string;
    inputId: string;
    placeholder: string;
    text: HeaderText;
}
interface MainMenuProp
{
    menuItems: MenuItemData[];
}
interface MenuItemProp
{
    menuItem: MenuItemData;
}
interface DropdownItemListProp
{
    items: MenuItemData[];
    parentDepth: number;
}
interface DropdownChildItemProp
{
    menuItem: MenuItemData;
    itemKey: string;
    parentDepth: number;
}
interface BootstrapDropdownInstance
{
    toggle: () => void;
}
interface BootstrapDropdownConstructor
{
    new(element: Element): BootstrapDropdownInstance;
    getOrCreateInstance?: (element: Element) => BootstrapDropdownInstance;
}
interface BootstrapWindow extends Window
{
    bootstrap?: {
        Dropdown?: BootstrapDropdownConstructor;
    };
}
const DEFAULT_FONT_SIZE = 16;
const HEADER_SHADOW_SCROLL_TOP = 180;
const FONT_SIZE_STORAGE_KEY = "font-zoom";
const CUSTOM_SIZE_ROOT_ID = "Customsize";
const NTUA_HOME_URL = "https://www.ntua.edu.tw/";
const FIRST_DROPDOWN_DEPTH = 0;
const FONT_SIZE_OPTIONS: FontSizeOption[] = [
    { size: 20, label: "大", title: "字型-大" },
    { size: 18, label: "中", title: "字型-中" },
    { size: 16, label: "小", title: "字型-小" },
];
// #endregion

// #region Public
/** 前台 Header 主元件，負責組合上方快捷列、主選單、陰影與手機選單遮罩。 */
export const Header = (props: HeaderProp) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
    useHeaderShadow(headerRef);
    useMobileMenuCollapse({
        headerRef,
        collapseSelector: "#navbar-content",
        togglerSelector: ".navbar-toggler",
        overlaySelector: ".overlayer",
        hamburgerSelector: ".hamburger",
        headerActiveClass: "active",
        lockBodyScroll: true,
        disableBootstrapAutoToggle: true,
    });
    return (
        <>
            <A11yContent />
            <div id="Site-Header" className="ALL_Header_DivBar main-header" ref={headerRef}>
                <HeaderSection lang={props.lang} site={props.site} />
                <MenuSection lang={props.lang} site={props.site} />
                <BottomLineSection />
                <div className="overlayer" aria-hidden="true" />
            </div>
        </>
    );
};
// #endregion

// #region Section
/** Header 上半部快捷列，對標 prototype 的 header_section / topbox。 */
const HeaderSection = (props: HeaderSectionProp) =>
{
    const text = getHeaderText(props.lang);
    const fontSizeAction = useFontSizeAction();
    return (
        <section className="header_section">
            <header className="header_Box py-lg-2 py-md-0 py-sm-0 py-0 bg-custom-white">
                <div className="navsBox">
                    <div className="container-customize0">
                        <div className="topbox d-flex justify-content-lg-between justify-content-md-center justify-content-sm-center justify-content-center align-items-center">
                            <DesktopLogo text={text} />
                            <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                                <TopNavList lang={props.lang} site={props.site} text={text} />
                                <HeaderToolList fontSizeAction={fontSizeAction} text={text} />
                            </ul>
                        </div>
                    </div>
                </div>
            </header>
        </section>
    );
};

/** Header 下半部主選單，對標 prototype 的 menu_section。 */
const MenuSection = (props: HeaderSectionProp) =>
{
    const menuRef = useRef<HTMLDivElement | null>(null);
    const menuItems = useMemo(() => getMenuData(props.lang, props.site), [props.lang, props.site]);
    useMenuDropdownAction(menuRef, menuItems);
    return (
        <section className="menu_section">
            <div className="customMENU_Box py-lg-2 pt-0 pb-3 bg-change-custom">
                <div className="menuBox">
                    <div className="container-customize0">
                        <div className="navbar navbar-expand-lg navbar-dark px-0 py-0" ref={menuRef}>
                            <MobileLogo text={getHeaderText(props.lang)} />
                            <MobileActionGroup text={getHeaderText(props.lang)} />
                            <MainMenu menuItems={menuItems} />
                            <PCActionGroup />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/** Header 底線區塊，保留 prototype 的 Line_section BOTTOM。 */
const BottomLineSection = () =>
{
    return <section className="Line_section BOTTOM" />;
};
// #endregion

// #region EntityComp
/** 桌機版 Logo，位於 Header 上半部左側。 */
const DesktopLogo = (props: { text: HeaderText; }) =>
{
    return (
        <h1 className="logo d-lg-block d-md-none d-sm-none d-none">
            <LangLink className="navbar-brand" to="/" tabIndex={0} title={props.text.logoTitle}>
                <img src={LogoImg} alt={props.text.logoTitle} />
            </LangLink>
        </h1>
    );
};

/** 手機版 Logo，位於主選單列左側。 */
const MobileLogo = (props: { text: HeaderText; }) =>
{
    return (
        <h1 className="logo d-lg-none d-md-block d-sm-block d-block">
            <LangLink className="navbar-brand" to="/" tabIndex={0} title={props.text.logoTitle}>
                <img src={LogoImg} alt={props.text.logoTitle} />
            </LangLink>
        </h1>
    );
};

/** Header 快捷連結清單，包含 Accesskey、首頁、臺藝大首頁、語系與網站導覽。 */
const TopNavList = (props: HeaderSectionProp & { text: HeaderText; }) =>
{
    return (
        <li>
            <ul className="nav custom_nav justify-content-center py-0 my-1">
                <li className="nav-item">
                    <Accesskey type="U" lang={props.lang} />
                </li>
                <li className="nav-item">
                    <LangLink className="nav-link" to="/" tabIndex={0} target="_self" title={props.text.home}>{props.text.home}</LangLink>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href={NTUA_HOME_URL} tabIndex={0} target="_blank" rel="noopener noreferrer" title={props.text.ntuaHome}>{props.text.ntuaHome}</a>
                </li>
                <LangSwitchBtn site={props.site} />
                <li className="nav-item">
                    <LangNavLink to={`/${SITEMAP_SEGMENT}`} className="nav-link" tabIndex={0} target="_self" title={props.text.sitemap}>{props.text.sitemap}</LangNavLink>
                </li>
            </ul>
        </li>
    );
};

/** Header 工具列，包含字級切換與桌機搜尋。 */
const HeaderToolList = (props: { fontSizeAction: ReturnType<typeof useFontSizeAction>; text: HeaderText; }) =>
{
    return (
        <li>
            <ul className="nav custom_nav justify-content-center py-0">
                {FONT_SIZE_OPTIONS.map(option => <FontSizeButton key={option.size} option={option} activeSize={props.fontSizeAction.fontSize} onChange={props.fontSizeAction.changeFontSize} />)}
                <li>
                    <SearchControl buttonId="top-sss" inputId="search-box" placeholder={props.text.searchPlaceholder} text={props.text} />
                </li>
            </ul>
        </li>
    );
};

/** 單一字級切換按鈕，更新 active 與 aria-pressed 狀態。 */
const FontSizeButton = (props: FontSizeButtonProp) =>
{
    const isActive = props.activeSize === props.option.size;
    const handleClick = (event: ReactMouseEvent<HTMLAnchorElement>) =>
    {
        event.preventDefault();
        props.onChange(props.option.size);
    };
    return (
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
                    <a className={`A-LMS${isActive ? " active" : ""}`} href={`#font-size-${props.option.size}`} role="button" title={props.option.title} tabIndex={0} data-size={props.option.size} aria-pressed={isActive} onClick={handleClick}>
                        <div className="LMS-text">{props.option.label}</div>
                    </a>
                </div>
            </div>
        </li>
    );
};

/** 搜尋控制元件，供桌機與手機共用 dropdown 結構。 */
const SearchControl = (props: SearchControlProp) =>
{
    return (
        <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
            <a href={`#${props.buttonId}`} className="search-button" role="button" title={props.text.search} id={props.buttonId} data-bs-toggle="dropdown" aria-expanded="false" tabIndex={0} onClick={preventLinkButtonDefault}>
                <i className="far fa-search" aria-hidden="true"></i>
                <span className="sr-only">{props.text.search}</span>
            </a>
            <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby={props.buttonId}>
                <label className="sr-only" htmlFor={props.inputId}>{props.text.search}</label>
                <input type="search" id={props.inputId} placeholder={props.placeholder} tabIndex={0} />
                <button className="far fa-search" type="button" tabIndex={0} aria-label={props.text.searchSubmit}></button>
            </div>
        </div>
    );
};

/** 手機版工具區，包含搜尋與漢堡按鈕。 */
const MobileActionGroup = (props: { text: HeaderText; }) =>
{
    return (
        <>
            <div className="mobile-box ms-auto me-2">
                <div className="icons">
                    <SearchControl buttonId="mobile-sss" inputId="mobile-search-box" placeholder={props.text.searchPlaceholder} text={props.text} />
                </div>
            </div>
            <button className="navbar-toggler collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#navbar-content" aria-controls="navbar-content" aria-expanded="false" aria-label={props.text.mobileMenu}>
                <div className="hamburger-toggle">
                    <div className="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </button>
        </>
    );
};

/** PC 右側預留工具區，保留 prototype 的 pc-box 位置。 */
const PCActionGroup = () =>
{
    return <div className="pc-box d-none" />;
};

/** 主選單容器，負責輸出第一層 SiteMenu。 */
const MainMenu = (props: MainMenuProp) =>
{
    return (
        <div className="collapse navbar-collapse overflow-scroll-Y" id="navbar-content">
            <ul className="navbar-nav m-auto mb-2 mb-lg-0">
                {props.menuItems.map((item, index) => (item.SubItem?.length ? <DropdownMenuItem key={getMenuItemKey(item, index)} menuItem={item} /> : <SingleMenuItem key={getMenuItemKey(item, index)} menuItem={item} />))}
            </ul>
        </div>
    );
};

/** 第一層單一連結選單。 */
const SingleMenuItem = (props: MenuItemProp) =>
{
    const isExternal = isExternalUrl(props.menuItem.Url);
    return (
        <li className="nav-item">
            <LangNavLink className="nav-link" aria-current="page" to={resolveMenuUrl(props.menuItem)} role="button" tabIndex={0} title={props.menuItem.SrcData} aria-label={props.menuItem.SrcData} target={props.menuItem.URL_Open}>
                {isExternal && <i className="fad fa-link me-2" aria-hidden="true"></i>}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

/** 第一層下拉選單。 */
const DropdownMenuItem = (props: MenuItemProp) =>
{
    return (
        <li className="nav-item dropdown">
            <LangNavLink
                className="nav-link dropdown-toggle"
                to={resolveMenuUrl(props.menuItem)}
                role="button"
                tabIndex={0}
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                target={props.menuItem.URL_Open}
                title={props.menuItem.SrcData}
                aria-expanded="false"
            >
                {props.menuItem.SrcData}
            </LangNavLink>
            <ul className="dropdown-menu">
                <DropdownItemList items={props.menuItem.SubItem ?? []} parentDepth={FIRST_DROPDOWN_DEPTH} />
            </ul>
        </li>
    );
};

/** 下拉選單子項清單，支援多層遞迴。 */
const DropdownItemList = (props: DropdownItemListProp) =>
{
    return (
        <>
            {props.items.map((item, index) => <DropdownChildItem key={getMenuItemKey(item, index, props.parentDepth)} menuItem={item} itemKey={getMenuItemKey(item, index, props.parentDepth)} parentDepth={props.parentDepth} />)}
        </>
    );
};

/** 下拉選單單一子項，依是否有子層決定連結或 submenu。 */
const DropdownChildItem = (props: DropdownChildItemProp) =>
{
    const hasChildren = (props.menuItem.SubItem ?? []).length > 0;
    const submenuClassName = props.parentDepth === FIRST_DROPDOWN_DEPTH ? "dropdown-menu" : "dropdown-menu dropdown-submenu";
    if (!hasChildren) return <DropdownLeafItem menuItem={props.menuItem} />;
    return (
        <li className="dropend submenu">
            <LangNavLink
                to={resolveMenuUrl(props.menuItem)}
                role="button"
                tabIndex={0}
                className="dropdown-item dropdown-toggle"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                target={props.menuItem.URL_Open}
                title={props.menuItem.SrcData}
                aria-expanded="false"
            >
                {props.menuItem.SrcData}
            </LangNavLink>
            <ul className={submenuClassName}>
                <DropdownItemList items={props.menuItem.SubItem ?? []} parentDepth={props.parentDepth + 1} />
            </ul>
        </li>
    );
};

/** 下拉選單葉節點連結。 */
const DropdownLeafItem = (props: MenuItemProp) =>
{
    const isExternal = isExternalUrl(props.menuItem.Url);
    return (
        <li>
            <LangNavLink className="dropdown-item" to={resolveMenuUrl(props.menuItem)} role="button" tabIndex={0} target={props.menuItem.URL_Open} title={props.menuItem.SrcData}>
                {isExternal && <i className="fad fa-link me-2" aria-hidden="true"></i>}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};
// #endregion

// #region Private
/** 取得 Header 文案，避免各元件內散落寫死字串。 */
const getHeaderText = (lang: Lang): HeaderText =>
{
    if (lang === "en")
    {
        return {
            home: "Home",
            ntuaHome: "NTUA Home",
            sitemap: "Site Map",
            search: "Search",
            searchPlaceholder: "Search admissions site...",
            searchSubmit: "Submit search",
            logoTitle: "National Taiwan University of Arts Office of Academic Affairs Admissions Website LOGO",
            mobileMenu: "Open main menu",
        };
    }
    return { home: "首頁", ntuaHome: "臺藝大首頁", sitemap: "網站導覽", search: "搜尋", searchPlaceholder: "搜尋招生資訊網...", searchSubmit: "送出搜尋", logoTitle: "國立臺灣藝術大學 教務處 招生資訊網 LOGO", mobileMenu: "開啟主選單" };
};

/** 取得 SiteMenu 樹狀資料並轉成 Header 可用格式。 */
const getMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    return buildMenuItems(roots, 0);
};

/** Header 捲動超過門檻時加上 shadow。 */
const useHeaderShadow = (headerRef: RefObject<HTMLDivElement | null>) =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const updateShadow = () => headerRef.current?.classList.toggle("shadow", window.scrollY >= HEADER_SHADOW_SCROLL_TOP);
        updateShadow();
        window.addEventListener("scroll", updateShadow, { passive: true });
        return () => window.removeEventListener("scroll", updateShadow);
    }, [headerRef]);
};

/** 字級控制 Hook，對應 prototype 的 A-LMS 大中小字級。 */
const useFontSizeAction = () =>
{
    const [fontSize, setFontSize] = useState(DEFAULT_FONT_SIZE);
    useEffect(() => setFontSize(readSavedFontSize() ?? DEFAULT_FONT_SIZE), []);
    useEffect(() =>
    {
        applyFontSize(fontSize);
        saveFontSize(fontSize);
    }, [fontSize]);
    return { fontSize, changeFontSize: setFontSize };
};

/** 套用字級到 Customsize；若頁面尚未包 Customsize 則退回 documentElement。 */
const applyFontSize = (fontSize: number) =>
{
    if (typeof document === "undefined") return;
    const root = document.getElementById(CUSTOM_SIZE_ROOT_ID) ?? document.documentElement;
    root.style.fontSize = `${fontSize}px`;
};

/** 讀取使用者上次選擇的字級。 */
const readSavedFontSize = (): number | null =>
{
    if (typeof localStorage === "undefined") return null;
    const saved = Number(localStorage.getItem(FONT_SIZE_STORAGE_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : null;
};

/** 保存使用者選擇的字級。 */
const saveFontSize = (fontSize: number) =>
{
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(FONT_SIZE_STORAGE_KEY, String(fontSize));
};

/** 綁定主選單互動，處理 submenu 邊界、Enter 切換與互斥收合。 */
const useMenuDropdownAction = (menuRef: RefObject<HTMLDivElement | null>, menuItems: MenuItemData[]) =>
{
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const root = menuRef.current;
        if (!root) return;
        const cleanups = [bindSubmenuDirection(root), bindDropdownToggleKeydown(root), bindDropdownCloseAction(root)];
        return () => cleanups.forEach(cleanup => cleanup());
    }, [menuRef, menuItems]);
};

/** 綁定 submenu 超出右側時改往左顯示。 */
const bindSubmenuDirection = (root: HTMLElement): () => void =>
{
    const submenuEls = Array.from(root.querySelectorAll<HTMLElement>(".submenu"));
    const onMouseOver = (event: Event) => updateSubmenuDirectionByEvent(event);
    const onKeyDown = (event: KeyboardEvent) =>
    {
        if (event.key === "Enter") updateSubmenuDirectionByEvent(event);
    };
    submenuEls.forEach(el =>
    {
        el.addEventListener("mouseover", onMouseOver);
        el.addEventListener("keydown", onKeyDown);
    });
    return () =>
        submenuEls.forEach(el =>
        {
            el.removeEventListener("mouseover", onMouseOver);
            el.removeEventListener("keydown", onKeyDown);
        });
};

/** 依目前事件來源重新判斷 submenu 顯示方向。 */
const updateSubmenuDirectionByEvent = (event: Event) =>
{
    const host = event.currentTarget as HTMLElement;
    if (!host.contains(event.target as Node)) return;
    requestAnimationFrame(() => updateSubmenuDirection(host));
};

/** 判斷 submenu 是否超出右側邊界。 */
const updateSubmenuDirection = (host: HTMLElement) =>
{
    const submenu = host.querySelector<HTMLElement>(".dropdown-menu");
    if (!submenu) return;
    host.classList.remove("show-left");
    const windowWidth = window.innerWidth || document.documentElement.clientWidth;
    if (submenu.getBoundingClientRect().right > windowWidth) host.classList.add("show-left");
};

/** 綁定 Enter 鍵切換 Bootstrap Dropdown。 */
const bindDropdownToggleKeydown = (root: HTMLElement): () => void =>
{
    const toggleEls = Array.from(root.querySelectorAll<HTMLElement>(".dropdown-toggle"));
    const onKeyDown = (event: KeyboardEvent) =>
    {
        if (event.key !== "Enter") return;
        event.preventDefault();
        toggleBootstrapDropdown(event.currentTarget as HTMLElement);
    };
    toggleEls.forEach(el => el.addEventListener("keydown", onKeyDown));
    return () => toggleEls.forEach(el => el.removeEventListener("keydown", onKeyDown));
};

/** 透過 Bootstrap API 切換 Dropdown。 */
const toggleBootstrapDropdown = (toggleElement: HTMLElement) =>
{
    const Dropdown = (window as BootstrapWindow).bootstrap?.Dropdown;
    if (!Dropdown) return;
    const instance = Dropdown.getOrCreateInstance ? Dropdown.getOrCreateInstance(toggleElement) : new Dropdown(toggleElement);
    instance.toggle();
};

/** 綁定第一層選單互斥收合、點外面收合與 Esc 收合。 */
const bindDropdownCloseAction = (root: HTMLElement): () => void =>
{
    let lastHoverHost: HTMLElement | null = null;
    const onPointerOver = (event: Event) =>
    {
        lastHoverHost = closeByTopDropdownHover(root, event, lastHoverHost);
    };
    const onFocusIn = (event: Event) => closeByTopDropdownFocus(root, event);
    const onRootClick = (event: MouseEvent) => closeByRootClick(root, event);
    const onDocPointerDown = (event: Event) =>
    {
        if (!root.contains(event.target as Node)) closeAllExcept(root);
    };
    const onDocKeyDown = (event: KeyboardEvent) =>
    {
        if (event.key === "Escape") closeAllExcept(root);
    };
    root.addEventListener("pointerover", onPointerOver);
    root.addEventListener("focusin", onFocusIn);
    root.addEventListener("click", onRootClick);
    document.addEventListener("pointerdown", onDocPointerDown);
    document.addEventListener("keydown", onDocKeyDown);
    return () => clearDropdownCloseAction(root, onPointerOver, onFocusIn, onRootClick, onDocPointerDown, onDocKeyDown);
};

/** 清除選單互斥收合事件。 */
const clearDropdownCloseAction = (root: HTMLElement, onPointerOver: (event: Event) => void, onFocusIn: (event: Event) => void, onRootClick: (event: MouseEvent) => void, onDocPointerDown: (event: Event) => void, onDocKeyDown: (event: KeyboardEvent) => void) =>
{
    root.removeEventListener("pointerover", onPointerOver);
    root.removeEventListener("focusin", onFocusIn);
    root.removeEventListener("click", onRootClick);
    document.removeEventListener("pointerdown", onDocPointerDown);
    document.removeEventListener("keydown", onDocKeyDown);
};

/** 滑入不同第一層 dropdown 時，收合其它選單。 */
const closeByTopDropdownHover = (root: HTMLElement, event: Event, lastHoverHost: HTMLElement | null): HTMLElement | null =>
{
    const host = (event.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
    if (!host || !root.contains(host) || lastHoverHost === host) return lastHoverHost;
    closeAllExcept(root, host);
    return host;
};

/** 焦點進入不同第一層 dropdown 時，收合其它選單。 */
const closeByTopDropdownFocus = (root: HTMLElement, event: Event) =>
{
    const host = (event.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
    if (host && root.contains(host)) closeAllExcept(root, host);
};

/** 點擊第一層或葉節點連結時，依情境收合選單。 */
const closeByRootClick = (root: HTMLElement, event: MouseEvent) =>
{
    const el = event.target as Element | null;
    if (!el) return;
    const topToggle = el.closest(".navbar-nav > .nav-item.dropdown > .dropdown-toggle") as HTMLElement | null;
    if (topToggle && root.contains(topToggle)) return closeByTopToggle(root, topToggle);
    const insideMenu = el.closest(".dropdown-menu") as HTMLElement | null;
    const isLeafAnchor = !!el.closest("a") && !el.closest(".dropdown-toggle");
    if (insideMenu && isLeafAnchor) closeAllExcept(root);
};

/** 點擊第一層 toggle 時，保留目前選單並關閉其它選單。 */
const closeByTopToggle = (root: HTMLElement, topToggle: HTMLElement) =>
{
    const host = topToggle.closest(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
    if (host) closeAllExcept(root, host);
};

/** 收合除了 keep 之外的所有第一層 dropdown。 */
const closeAllExcept = (root: HTMLElement, keep?: HTMLElement) =>
{
    getTopDropdownHosts(root).forEach(host =>
    {
        if (keep && host === keep) return;
        if (isDropdownHostOpen(host)) closeDropdownHost(host);
    });
    root.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(menu =>
    {
        if (!keep || !keep.contains(menu)) menu.classList.remove("show");
    });
};

/** 取得第一層 dropdown 容器。 */
const getTopDropdownHosts = (root: HTMLElement): HTMLElement[] =>
{
    return Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown"));
};

/** 收合指定 dropdown 容器與其所有子選單。 */
const closeDropdownHost = (host: HTMLElement) =>
{
    host.classList.remove("show");
    host.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(menu => menu.classList.remove("show"));
    host.querySelectorAll<HTMLElement>(".dropdown-toggle").forEach(toggle => toggle.setAttribute("aria-expanded", "false"));
};

/** 判斷 dropdown 容器目前是否開啟。 */
const isDropdownHostOpen = (host: HTMLElement): boolean =>
{
    if (host.classList.contains("show")) return true;
    if (host.querySelector(".dropdown-menu.show")) return true;
    return !!host.querySelector("[aria-expanded=\"true\"]");
};

/** 判斷網址是否為外站連結。 */
const isExternalUrl = (url?: string): boolean =>
{
    return /^https?:\/\//i.test(url ?? "");
};

/** 統一處理選單空連結。 */
const resolveMenuUrl = (menuItem: MenuItemData): string =>
{
    return menuItem.Url || "#";
};

/** 產生選單 key，優先使用文字與網址，index 僅作最後區分。 */
const getMenuItemKey = (menuItem: MenuItemData, index: number, parentDepth = 0): string =>
{
    return `${parentDepth}-${menuItem.SrcData}-${menuItem.Url}-${index}`;
};

/** 阻止假連結造成頁面跳動，仍保留 Bootstrap dropdown 冒泡事件。 */
const preventLinkButtonDefault = (event: ReactMouseEvent<HTMLAnchorElement>) =>
{
    event.preventDefault();
};
// #endregion
