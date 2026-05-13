/*Header模塊*/
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { A11yContent } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useCallback, useEffect, useRef, useState } from "react";

import LogoImg from "@/SpecFetures/1819/Assets/Client/images/logo/LOGO_400x95.svg";

import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import React from "react";
import { SubmissionReviewSystem } from "./SubmissionReviewSystem";

type HeaderProps = { lang: Lang; site: INormSite; style: IFETheme; };

type MenuControl = {
    isMobileView: boolean;
    isMobileMenuOpen: boolean;
    toggleMobileMenu: () => void;
    closeMobileMenu: () => void;
    isDropdownOpen: (key: string) => boolean;
    toggleDropdown: (key: string) => void;
    closeAllDropdowns: () => void;
    handleLeafClick: () => void;
};

const MOBILE_BREAKPOINT = 991.98;

const getParentKey = (key: string): string =>
{
    // 宣告變數：取得目前節點的父層 key
    const lastIndex = key.lastIndexOf("-");
    // return
    return lastIndex === -1 ? "" : key.slice(0, lastIndex);
};

const removeBranchKeys = (keys: string[], rootKey: string): string[] =>
{
    // return：移除某個節點以及其底下所有子節點
    return keys.filter((item) => item !== rootKey && !item.startsWith(`${rootKey}-`));
};

const Header = (props: HeaderProps) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const [openDropdownKeys, setOpenDropdownKeys] = useState<string[]>([]);

    const closeAllDropdowns = useCallback((): void =>
    {
        // 執行 function：關閉所有手機版子選單
        setOpenDropdownKeys([]);
    }, []);

    const closeMobileMenu = useCallback((): void =>
    {
        // 執行 function：關閉手機版主選單與所有子選單
        setIsMobileMenuOpen(false);
        closeAllDropdowns();
    }, [closeAllDropdowns]);

    const toggleMobileMenu = useCallback((): void =>
    {
        // 執行 function：切換手機版主選單開關
        setIsMobileMenuOpen((prev) =>
        {
            const next = !prev;
            if (!next) closeAllDropdowns();
            return next;
        });
    }, [closeAllDropdowns]);

    const isDropdownOpen = useCallback((key: string): boolean =>
    {
        // return：判斷某個手機版子選單是否展開
        return openDropdownKeys.includes(key);
    }, [openDropdownKeys]);

    const toggleDropdown = useCallback((key: string): void =>
    {
        // 執行 function：切換手機版某個子選單，並關閉同層兄弟節點
        setOpenDropdownKeys((prev) =>
        {
            if (prev.includes(key)) return removeBranchKeys(prev, key);

            const parentKey = getParentKey(key);
            const siblingRoots = prev.filter((item) => getParentKey(item) === parentKey && item !== key);
            const next = prev.filter((item) => !siblingRoots.some((rootKey) => item === rootKey || item.startsWith(`${rootKey}-`)));

            return [...next, key];
        });
    }, []);

    const handleLeafClick = useCallback((): void =>
    {
        // 執行 function：點擊葉節點時，自動收回手機版主選單
        if (!isMobileView) return;
        closeMobileMenu();
    }, [closeMobileMenu, isMobileView]);

    useEffect(() =>
    {
        // 執行 function：判斷目前是否為手機 breakpoint
        if (typeof window === "undefined") return;

        const updateViewport = () =>
        {
            const mobile = window.innerWidth <= MOBILE_BREAKPOINT;
            setIsMobileView(mobile);

            if (!mobile)
            {
                setIsMobileMenuOpen(false);
                setOpenDropdownKeys([]);
            }
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, []);

    useEffect(() =>
    {
        // 執行 function：prototype scroll 到一定高度才加陰影
        if (typeof window === "undefined") return;

        const header = headerRef.current;
        if (!header) return;

        const threshold = 180;

        const onScroll = () =>
        {
            // 執行 function：同步 header shadow 狀態
            header.classList.toggle("shadow", window.scrollY >= threshold);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    useEffect(() =>
    {
        // 執行 function：同步 body 捲動鎖定
        if (typeof document === "undefined") return;

        document.body.style.overflow = isMobileMenuOpen ? "hidden" : "auto";

        return () =>
        {
            document.body.style.overflow = "auto";
        };
    }, [isMobileMenuOpen]);

    useEffect(() =>
    {
        // 執行 function：點 menu 外部時收回手機版 menu
        if (typeof document === "undefined") return;
        if (!isMobileMenuOpen) return;

        const onPointerDown = (event: PointerEvent) =>
        {
            const header = headerRef.current;
            const menuSection = header?.querySelector(".menu_section");
            const target = event.target as Node | null;

            if (!header || !menuSection || !target) return;
            if (!menuSection.contains(target)) closeMobileMenu();
        };

        document.addEventListener("pointerdown", onPointerDown);

        return () => document.removeEventListener("pointerdown", onPointerDown);
    }, [closeMobileMenu, isMobileMenuOpen]);

    useEffect(() =>
    {
        // 執行 function：按 Esc 收回手機版 menu
        if (typeof document === "undefined") return;

        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key !== "Escape") return;
            closeMobileMenu();
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [closeMobileMenu]);

    return (
        <>
            <A11yContent />
            <div id="Site-Header" className={`ALL_Header_DivBar main-header${isMobileMenuOpen ? " active" : ""}`} ref={headerRef}>
                <Header_Section lang={props.lang} site={props.site} />
                <Menu_Section
                    {...props}
                    isMobileView={isMobileView}
                    isMobileMenuOpen={isMobileMenuOpen}
                    toggleMobileMenu={toggleMobileMenu}
                    closeMobileMenu={closeMobileMenu}
                    isDropdownOpen={isDropdownOpen}
                    toggleDropdown={toggleDropdown}
                    closeAllDropdowns={closeAllDropdowns}
                    handleLeafClick={handleLeafClick}
                />
                <div className="overlayer" aria-hidden="true" onClick={closeMobileMenu} />
            </div>
        </>
    );
};

export default Header;

const Header_Section = (props: { lang: Lang; site: INormSite; }) =>
{
    const sizeGroupRef = useRef<HTMLUListElement | null>(null);

    useEffect(() =>
    {
        // 執行 function：字級切換按鈕 active 樣式控制
        const root = sizeGroupRef.current;
        if (!root) return;

        const onClick = (ev: MouseEvent) =>
        {
            const target = (ev.target as Element).closest(".A-LMS") as HTMLElement | null;
            if (!target || !root.contains(target)) return;

            if (target.tagName === "A") ev.preventDefault();

            root.querySelectorAll<HTMLElement>(".A-LMS").forEach((btn) =>
            {
                btn.classList.remove("active");
                btn.setAttribute("aria-pressed", "false");
            });

            target.classList.add("active");
            target.setAttribute("aria-pressed", "true");
        };

        root.addEventListener("click", onClick);

        return () => root.removeEventListener("click", onClick);
    }, []);

    return (
        <section className="header_section">
            <header className="header_Box bg-white">
                <div className="navsBox">
                    <div className="container-customize0">
                        <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                            <NavBar lang={props.lang} />
                            <li>
                                <ul className="nav custom_nav py-0 justify-content-center my-1" ref={sizeGroupRef}>
                                    <LangSwitchBtn site={props.site} />
                                    {/* <SearchBar /> */}
                                </ul>
                            </li>
                            <SubmissionReviewSystem />
                        </ul>
                    </div>
                </div>
            </header>
        </section>
    );
};

const NavBar = (props: { lang: Lang; }) =>
{
    const title = props.lang === "zh-tw"
        ? { Home: "首頁", TKU: "淡江大學", SiteMap: "網站導覽" }
        : props.lang === "en"
        ? { Home: "Home", TKU: "NCHU", SiteMap: "SiteMap" }
        : {};

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center my-1">
                <li className="nav-item pe-2">
                    <Accesskey type="U" lang={props.lang} />
                </li>
                <li className="nav-item no-divider-line">
                    <LangLink className="nav-link" to="/" target="_self" title={title.Home}>{title.Home}</LangLink>
                </li>
                <li className="nav-item">
                    <LangLink className="nav-link" to="https://www.tku.edu.tw/" target="_self" title={title.TKU}>{title.TKU}</LangLink>
                </li>
                <li className="nav-item">
                    <LangNavLink to={`/${SITEMAP_SEGMENT}`} className="nav-link" target="_self" title={title.SiteMap}>{title.SiteMap}</LangNavLink>
                </li>
            </ul>
        </li>
    );
};

const SearchBar = () =>
{
    const doZoom = useCallback((px: number) =>
    {
        // 執行 function：切換 font-size 並保存
        document.documentElement.style.fontSize = `${px}px`;
        localStorage.setItem("font-zoom", String(px));
    }, []);

    useEffect(() =>
    {
        // 執行 function：初始化讀取 font-size 設定
        const saved = +localStorage.getItem("font-zoom")!;
        if (saved) doZoom(saved);
    }, [doZoom]);

    return (
        <li>
            <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-sm-inline-block d-none">
                <a className="search-button" id="top-sss" data-bs-toggle="dropdown">
                    <i className="far fa-search" />
                    <span className="sr-only">Search</span>
                </a>
            </div>
            <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="top-sss">
                <input type="search" id="search-box" placeholder="Search..." />
                <button className="far fa-search" type="button" />
            </div>
        </li>
    );
};

const Menu_Section = (props: HeaderProps & MenuControl) =>
{
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() =>
    {
        // 執行 function：桌機版保留 submenu 方向修正與 Enter dropdown 控制
        if (typeof window === "undefined") return;
        if (props.isMobileView) return;

        const root = menuRef.current;
        if (!root) return;

        const updateDir = (hostEl: HTMLElement) =>
        {
            // 執行 function：子選單超出右側時改為往左展開
            const submenu = hostEl.querySelector<HTMLElement>(".dropdown-menu");
            if (!submenu) return;
            // 先清掉再判斷（避免殘留）
            hostEl.classList.remove("show-left");
            const rect = submenu.getBoundingClientRect();
            const winW = window.innerWidth || document.documentElement.clientWidth;
            if (rect.right > winW)
            {
                hostEl.classList.add("show-left");
            }
        };

        const submenuEls = Array.from(root.querySelectorAll<HTMLElement>(".submenu"));
        const onMouseEnter = (e: Event) =>
        {
            const el = e.currentTarget as HTMLElement;
            requestAnimationFrame(() => updateDir(el));
        };
        const onKeyEnter = (e: KeyboardEvent) =>
        {
            if (e.key !== "Enter") return;
            updateDir(e.currentTarget as HTMLElement);
        };

        submenuEls.forEach((el) =>
        {
            el.addEventListener("mouseenter", onMouseEnter);
            el.addEventListener("keydown", onKeyEnter);
        });

        const toggleEls = Array.from(root.querySelectorAll<HTMLElement>(".dropdown-toggle"));
        const onToggleKeyDown = (e: KeyboardEvent) =>
        {
            // 執行 function：桌機 Enter 時仍交給 Bootstrap dropdown
            if (e.key !== "Enter") return;

            const win = window as Window & { bootstrap?: { Dropdown?: new(element: Element) => { toggle: () => void; }; }; };

            const dropdownClass = win.bootstrap?.Dropdown;
            if (!dropdownClass) return;

            e.preventDefault();
            new dropdownClass(e.currentTarget as Element).toggle();
        };

        toggleEls.forEach((el) => el.addEventListener("keydown", onToggleKeyDown));

        return () =>
        {
            submenuEls.forEach((el) =>
            {
                el.removeEventListener("mouseenter", onMouseEnter);
                el.removeEventListener("keydown", onKeyEnter);
            });
            toggleEls.forEach((el) => el.removeEventListener("keydown", onToggleKeyDown));
        };
    }, [props.isMobileView]);

    return (
        <section className="menu_section">
            <div className="customMENU_Box bg-white">
                <div className="menuBox">
                    <div className="container-customize0">
                        <div className="navbar navbar-expand-lg navbar-dark px-0 py-0" ref={menuRef}>
                            <LogoComp />
                            <MobileBtn isMobileMenuOpen={props.isMobileMenuOpen} toggleMobileMenu={props.toggleMobileMenu} />
                            <MainMenu {...props} />
                            <PCBtn />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const LogoComp = () =>
{
    return (
        <h1 className="logo">
            <LangLink className="navbar-brand" to="/" tabIndex={0} title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    );
};

const MobileBtn = (props: { isMobileMenuOpen: boolean; toggleMobileMenu: () => void; }) =>
{
    const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：切換手機版主選單
        event.preventDefault();
        props.toggleMobileMenu();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：支援 Enter / Space 切換手機版主選單
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.toggleMobileMenu();
    };

    return (
        <>
            <div className="mobile-box ml-auto me-2">
                <div className="icons">
                    <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block d-sm-none">{/* 預留搜尋按鈕 */}</div>
                </div>
            </div>

            <a
                className={`navbar-toggler menu-react-toggler${props.isMobileMenuOpen ? "" : " collapsed"}`}
                href="#"
                role="button"
                tabIndex={0}
                aria-controls="navbar-content"
                aria-label={props.isMobileMenuOpen ? "Close menu" : "Open menu"}
                aria-expanded={props.isMobileMenuOpen}
                onClick={handleClick}
                onKeyDown={handleKeyDown}
            >
                <div className="hamburger-toggle">
                    <div className={`hamburger${props.isMobileMenuOpen ? " active" : ""}`}>
                        <span />
                        <span />
                        <span />
                    </div>
                </div>
            </a>
        </>
    );
};

const MainMenu = (props: HeaderProps & MenuControl) =>
{
    const menuItems = GetMenuData(props.lang, props.site);

    return (
        <div id="navbar-content" className={`collapse navbar-collapse overflow-scroll-Y${props.isMobileMenuOpen ? " show" : ""}`}>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {menuItems.map((item, idx) =>
                {
                    const itemKey = `root-${idx}`;

                    return (
                        <React.Fragment key={itemKey}>
                            {item.SubItem?.length === 0
                                ? <SingleMenuItem menuItem={item} handleLeafClick={props.handleLeafClick} />
                                : (
                                    <DropdownMenuItem
                                        menuItem={item}
                                        itemKey={itemKey}
                                        isMobileView={props.isMobileView}
                                        isOpen={props.isDropdownOpen(itemKey)}
                                        isDropdownOpen={props.isDropdownOpen}
                                        toggleDropdown={props.toggleDropdown}
                                        handleLeafClick={props.handleLeafClick}
                                    />
                                )}
                        </React.Fragment>
                    );
                })}
            </ul>
        </div>
    );
};

const PCBtn = () =>
{
    return (
        <div className="pc-box">
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-inline-block">{/* 預留搜尋按鈕 */}</div>
            </div>
        </div>
    );
};

/** 1. 一般單選 */
const SingleMenuItem = (props: { menuItem: MenuItemData; handleLeafClick: () => void; }) =>
{
    const handleClick = () =>
    {
        // 執行 function：葉節點點擊後收回手機版 menu
        props.handleLeafClick();
    };

    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                aria-current="page"
                to={props.menuItem.Url || "#"}
                role="button"
                tabIndex={0}
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                onClick={handleClick}
            >
                {/^https?:\/\//i.test(props.menuItem.Url || "") && <i className="fad fa-link me-2"></i>}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

/** 2. 多層下拉 */
const DropdownMenuItem = (
    props: {
        menuItem: MenuItemData;
        itemKey: string;
        isMobileView: boolean;
        isOpen: boolean;
        isDropdownOpen: (key: string) => boolean;
        toggleDropdown: (key: string) => void;
        handleLeafClick: () => void;
    },
) =>
{
    const handleToggleClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：手機版點父層時只做展開/收合
        if (!props.isMobileView) return;
        event.preventDefault();
        event.stopPropagation();
        props.toggleDropdown(props.itemKey);
    };

    const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：手機版支援 Enter / Space 展開父層
        if (!props.isMobileView) return;
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.toggleDropdown(props.itemKey);
    };

    return (
        <li className={`nav-item dropdown${props.isMobileView && props.isOpen ? " show" : ""}`}>
            <LangNavLink
                className={`nav-link dropdown-toggle${props.isMobileView && props.isOpen ? " show" : ""}`}
                to={props.menuItem.Url || "#"}
                role="button"
                tabIndex={0}
                data-bs-toggle={props.isMobileView ? undefined : "dropdown"}
                data-bs-auto-close={props.isMobileView ? undefined : "outside"}
                target={props.menuItem.URL_Open}
                aria-expanded={props.isMobileView ? props.isOpen : undefined}
                onClick={handleToggleClick}
                onKeyDown={handleToggleKeyDown}
            >
                {props.menuItem.SrcData}
            </LangNavLink>

            <ul className={`dropdown-menu${props.isMobileView && props.isOpen ? " show" : ""}`}>
                {renderDropdownItems({
                    items: props.menuItem.SubItem ?? [],
                    parentDepth: 0,
                    parentKey: props.itemKey,
                    isMobileView: props.isMobileView,
                    isDropdownOpen: props.isDropdownOpen,
                    toggleDropdown: props.toggleDropdown,
                    handleLeafClick: props.handleLeafClick,
                    isOpenByKey: props.isDropdownOpen,
                })}
            </ul>
        </li>
    );
};

type RenderDropdownItemsProps = {
    items: MenuItemData[];
    parentDepth: number;
    parentKey: string;
    isMobileView: boolean;
    isDropdownOpen: (key: string) => boolean;
    toggleDropdown: (key: string) => void;
    handleLeafClick: () => void;
    isOpenByKey: (key: string) => boolean;
};

/**
 * 遞迴渲染多層選單
 * parentDepth = 0 代表「第二層」
 */
const renderDropdownItems = (props: RenderDropdownItemsProps): React.ReactElement[] =>
{
    return props.items.map((item, index) =>
    {
        const hasChildren = (item.SubItem ?? []).length > 0;
        const itemKey = `${props.parentKey}-${index}`;
        const isExternal = /^https?:\/\//i.test(item.Url || "");

        if (!hasChildren)
        {
            // return：純連結項目
            return (
                <li key={itemKey}>
                    <LangNavLink
                        className="dropdown-item"
                        to={item.Url || "#"}
                        role="button"
                        tabIndex={0}
                        target={item.URL_Open}
                        onClick={props.handleLeafClick}
                    >
                        {isExternal && <i className="fad fa-link me-2"></i>}
                        {item.SrcData}
                    </LangNavLink>
                </li>
            );
        }

        const isOpen = props.isOpenByKey(itemKey);
        const submenuClassName = props.parentDepth === 0 ? "dropdown-menu" : "dropdown-menu dropdown-submenu";

        const handleToggleClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
        {
            // 執行 function：手機版點父層子選單時切換展開
            if (!props.isMobileView) return;
            event.preventDefault();
            event.stopPropagation();
            props.toggleDropdown(itemKey);
        };

        const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
        {
            // 執行 function：手機版支援 Enter / Space 切換子選單
            if (!props.isMobileView) return;
            if (event.key !== "Enter" && event.key !== " ") return;
            event.preventDefault();
            props.toggleDropdown(itemKey);
        };

        return (
            <li key={itemKey} className={`dropend submenu${props.isMobileView && isOpen ? " show" : ""}`}>
                <LangNavLink
                    to={item.Url || "#"}
                    role="button"
                    tabIndex={0}
                    className={`dropdown-item dropdown-toggle${props.isMobileView && isOpen ? " show" : ""}`}
                    data-bs-toggle={props.isMobileView ? undefined : "dropdown"}
                    data-bs-auto-close={props.isMobileView ? undefined : "outside"}
                    target={item.URL_Open}
                    aria-expanded={props.isMobileView ? isOpen : undefined}
                    onClick={handleToggleClick}
                    onKeyDown={handleToggleKeyDown}
                >
                    {item.SrcData}
                </LangNavLink>

                <ul className={`${submenuClassName}${props.isMobileView && isOpen ? " show" : ""}`}>
                    {renderDropdownItems({
                        items: item.SubItem ?? [],
                        parentDepth: props.parentDepth + 1,
                        parentKey: itemKey,
                        isMobileView: props.isMobileView,
                        isDropdownOpen: props.isDropdownOpen,
                        toggleDropdown: props.toggleDropdown,
                        handleLeafClick: props.handleLeafClick,
                        isOpenByKey: props.isOpenByKey,
                    })}
                </ul>
            </li>
        );
    });
};

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    // 宣告變數：依語系取出 tree roots
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];
    // return：轉成 header menu 結構
    return buildMenuItems(roots, 0);
};
