import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LogoImg from "@/SpecFetures/1816/Assets/Client/images/logo/LOGO_266x41.svg";
import { A11yContent, type HeaderProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { SearchData } from "../../Index/Section/SearchData";

const MOBILE_BREAKPOINT = 991.98;
const SHADOW_SCROLL_TOP = 180;
const MEGA_MENU_ANIMATION_MS = 220;

const isKeyboardActivateKey = (event: React.KeyboardEvent): boolean =>
{
    return event.key === "Enter" || event.key === " " || event.key === "Spacebar" || event.code === "Space";
};

const Header = (props: HeaderProps) =>
{
    // 宣告變數：Site-Header root ref
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
    const location = useLocation();

    const closeMobileMenu = useCallback((): void =>
    {
        // 執行 function：關閉手機版主選單
        setIsMobileMenuOpen(false);
    }, []);

    const toggleMobileMenu = useCallback((): void =>
    {
        // 執行 function：切換手機版主選單
        setIsMobileMenuOpen((prev) => !prev);
    }, []);

    useViewportMode(setIsMobileView, closeMobileMenu);
    useHeaderShadow(headerRef);
    useBodyScrollLock(isMobileMenuOpen);
    useCloseOnOutside(headerRef, isMobileMenuOpen, closeMobileMenu);
    useCloseOnEscape(isMobileMenuOpen, closeMobileMenu);
    useCloseOnRouteChange(location.pathname, location.search, location.hash, closeMobileMenu);
    useCloseOnFocusLeave(headerRef, isMobileMenuOpen, closeMobileMenu);

    return (
        <>
            <A11yContent />
            <div id="Site-Header" className={`ALL_Header_DivBar main-header${isMobileMenuOpen ? " active" : ""}`} ref={headerRef}>
                <section className="menu_section p-lg-0 p-2">
                    <div className="customMENU_Box bg-white pb-lg-2 pt-lg-2 px-lg-2 px-0 pt-0 align-items-lg-start align-items-center">
                        <div className="menuBox">
                            <div className={clsx("container-customize4", props.lang === "en" ? "w-en" : "")}>
                                <div className="navbar navbar-expand-lg navbar-dark px-0 py-0">
                                    <LogoBlock />
                                    <MobileToggler isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
                                    <NavbarContent
                                        {...props}
                                        isMobileView={isMobileView}
                                        isMobileMenuOpen={isMobileMenuOpen}
                                        closeMobileMenu={closeMobileMenu}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="overlayer" aria-hidden="true" onClick={closeMobileMenu} />
            </div>

            <SearchData {...props} />
        </>
    );
};

export default Header;

/* =========================
 * Hooks：Header 基礎控制
 * ========================= */

const useViewportMode = (setIsMobileView: React.Dispatch<React.SetStateAction<boolean>>, closeMobileMenu: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：同步 breakpoint 狀態
        if (typeof window === "undefined") return;

        const updateViewport = () =>
        {
            const isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
            setIsMobileView(isMobile);

            if (!isMobile) closeMobileMenu();
        };

        updateViewport();
        window.addEventListener("resize", updateViewport);

        return () => window.removeEventListener("resize", updateViewport);
    }, [closeMobileMenu, setIsMobileView]);
};

const useHeaderShadow = (headerRef: React.RefObject<HTMLDivElement | null>) =>
{
    useEffect(() =>
    {
        // 執行 function：scroll 到一定高度時加上 shadow
        if (typeof window === "undefined") return;

        const onScroll = () =>
        {
            const header = headerRef.current;
            const box = header?.querySelector<HTMLElement>(".customMENU_Box");
            if (!box) return;

            box.classList.toggle("shadow", window.scrollY >= SHADOW_SCROLL_TOP);
        };

        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, [headerRef]);
};

const useBodyScrollLock = (isLocked: boolean) =>
{
    useEffect(() =>
    {
        // 執行 function：手機 menu 開啟時鎖 body 捲動
        if (typeof document === "undefined") return;

        document.body.style.overflow = isLocked ? "hidden" : "auto";

        return () =>
        {
            document.body.style.overflow = "auto";
        };
    }, [isLocked]);
};

const useCloseOnOutside = (headerRef: React.RefObject<HTMLDivElement | null>, isMobileMenuOpen: boolean, closeMobileMenu: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：點選單外部時關閉手機 menu
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
    }, [closeMobileMenu, headerRef, isMobileMenuOpen]);
};

const useCloseOnEscape = (isEnabled: boolean, close: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：按 Esc 時關閉目前展開的選單
        if (typeof document === "undefined") return;
        if (!isEnabled) return;

        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key !== "Escape") return;
            close();
        };

        document.addEventListener("keydown", onKeyDown, true);

        return () => document.removeEventListener("keydown", onKeyDown, true);
    }, [close, isEnabled]);
};

const useCloseOnRouteChange = (pathname: string, search: string, hash: string, close: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：SPA 路由變更後收合選單，避免狀態殘留
        close();
    }, [close, pathname, search, hash]);
};

const useCloseOnFocusLeave = <T extends HTMLElement>(rootRef: React.RefObject<T | null>, isEnabled: boolean, close: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：鍵盤焦點離開指定區塊後收合選單
        if (typeof document === "undefined" || typeof window === "undefined") return;
        if (!isEnabled) return;

        const root = rootRef.current;
        if (!root) return;

        const onFocusOut = () =>
        {
            window.setTimeout(() =>
            {
                const active = document.activeElement;
                if (!active || root.contains(active)) return;
                close();
            }, 0);
        };

        root.addEventListener("focusout", onFocusOut);

        return () => root.removeEventListener("focusout", onFocusOut);
    }, [close, isEnabled, rootRef]);
};

/* =========================
 * DOM blocks：對標 index.html
 * ========================= */

const LogoBlock = () =>
{
    return (
        <h1 className="logo">
            <LangLink className="navbar-brand mt-lg-3 mt-2" to="/" title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    );
};

const MobileToggler = (props: { isMobileMenuOpen: boolean; toggleMobileMenu: () => void; }) =>
{
    const handleClick = () =>
    {
        // 執行 function：切換手機版主選單
        props.toggleMobileMenu();
    };

    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) =>
    {
        // 執行 function：支援 Enter / Space 切換手機版主選單
        if (!isKeyboardActivateKey(event)) return;
        event.preventDefault();
        props.toggleMobileMenu();
    };

    return (
        <button
            type="button"
            className={`navbar-toggler${props.isMobileMenuOpen ? "" : " collapsed"}`}
            aria-controls="navbar-content"
            aria-expanded={props.isMobileMenuOpen}
            aria-label="開啟或關閉主選單"
            title="開啟或關閉主選單"
            onClick={handleClick}
            onKeyDown={handleKeyDown}
        >
            <span className="visually-hidden">主選單</span>

            <div className="hamburger-toggle" aria-hidden="true">
                <div className={`hamburger${props.isMobileMenuOpen ? " active" : ""}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </button>
    );
};

const NavbarContent = (
    props: { lang: Lang; site: INormSite; style: IFETheme; isMobileView: boolean; isMobileMenuOpen: boolean; closeMobileMenu: () => void; },
) =>
{
    // 宣告變數
    const menuRootRef = useRef<HTMLDivElement | null>(null);

    // 執行 function：navbar 高度變數
    useMenuHeightVar();

    return (
        <div id="navbar-content" className={`collapse navbar-collapse flex-wrap justify-content-end${props.isMobileMenuOpen ? " show" : ""}`} ref={menuRootRef}>
            <ul className="navbar-nav mb-2 mb-lg-0 overflow-scroll-Y ps-2">
                <li>
                    <Accesskey type="U" lang={props.lang} />
                </li>

                <MainMenu
                    lang={props.lang}
                    site={props.site}
                    style={props.style}
                    isMobileView={props.isMobileView}
                    isMobileMenuOpen={props.isMobileMenuOpen}
                    closeMobileMenu={props.closeMobileMenu}
                    menuRootRef={menuRootRef}
                />
            </ul>

            <div className="header_section ms-2">
                <header className="header_Box bg-white">
                    <div className="navsBox">
                        <div className="container-customize4 px-0">
                            <ul className="nav custom_nav justify-content-md-end justify-content-center">
                                <li>
                                    <ul className="nav custom_nav py-0 justify-content-center align-items-center">
                                        <LangSwitchBtn site={props.site} />
                                        <SizeChange />
                                        <SiteMapLink lang={props.lang} />
                                    </ul>
                                </li>
                            </ul>
                        </div>
                    </div>
                </header>
            </div>
        </div>
    );
};

/* =========================
 * behaviors
 * ========================= */

const useMenuHeightVar = () =>
{
    useEffect(() =>
    {
        // 執行 function：計算 menu 高度寫入 CSS 變數
        if (typeof window === "undefined") return;

        const setMenuHeightVar = () =>
        {
            const menuSection = document.querySelector<HTMLElement>(".navbar-nav");
            if (!menuSection) return;

            document.documentElement.style.setProperty("--menu-section-height", `${menuSection.offsetHeight}px`);
        };

        setMenuHeightVar();
        window.addEventListener("load", setMenuHeightVar);
        window.addEventListener("resize", setMenuHeightVar);

        return () =>
        {
            window.removeEventListener("load", setMenuHeightVar);
            window.removeEventListener("resize", setMenuHeightVar);
        };
    }, []);
};

/* =========================
 * Header small blocks
 * ========================= */

const SiteMapLink = (props: { lang: Lang; }) =>
{
    const text = props.lang === "en" ? "SiteMap" : "網站導覽";
    const title = props.lang === "en" ? "SiteMap" : "網站導覽";

    return (
        <li className="nav-item ms-2 me-lg-3 me-0 ps-2">
            <LangLink className="nav-link web-map" to={`/${SITEMAP_SEGMENT}`} target="_self" title={title}>
                <span className="fas fa-bars me-2 mt-1"></span>
                {text}
            </LangLink>
        </li>
    );
};

const SizeChange = () =>
{
    // 宣告變數：目前字級狀態
    const [activePercent, setActivePercent] = useState<number>(100);

    const doZoom = useCallback((percent: number) =>
    {
        // 執行 function：切換字級並保存
        if (typeof document === "undefined") return;

        const custom = document.getElementById("Customsize");

        if (custom) custom.style.fontSize = `${percent}%`;
        else document.documentElement.style.fontSize = `${percent}%`;

        setActivePercent(percent);
        localStorage.setItem("font-zoom", String(percent));

        const menuSection = document.querySelector<HTMLElement>(".menu_section");
        if (!menuSection) return;

        document.documentElement.style.setProperty("--menu-section-height", `${menuSection.offsetHeight}px`);
    }, []);

    const handleZoomClick = useCallback((event: React.MouseEvent<HTMLAnchorElement>, percent: number) =>
    {
        // 執行 function：阻止跳頁並切換字級
        event.preventDefault();
        doZoom(percent);
    }, [doZoom]);

    const handleZoomKeyDown = useCallback((event: React.KeyboardEvent<HTMLAnchorElement>, percent: number) =>
    {
        // 執行 function：支援 Enter / Space 切換字級
        if (!isKeyboardActivateKey(event)) return;
        event.preventDefault();
        doZoom(percent);
    }, [doZoom]);

    useEffect(() =>
    {
        // 執行 function：初始化讀取字級
        if (typeof window === "undefined") return;

        const saved = Number(localStorage.getItem("font-zoom") ?? "");
        if (!Number.isNaN(saved) && saved > 0) doZoom(saved);
    }, [doZoom]);

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center align-items-center">
                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a
                                className={clsx("A-LMS", activePercent === 112.5 && "active")}
                                href="#"
                                onClick={(event) => handleZoomClick(event, 112.5)}
                                onKeyDown={(event) => handleZoomKeyDown(event, 112.5)}
                                role="button"
                                title="字型-大"
                                aria-label="字型-大"
                                aria-pressed={activePercent === 112.5}
                                aria-selected={activePercent === 112.5}
                                data-size="112.5%"
                            >
                                <div className="LMS-text" style={{ fontSize: "medium" }}>A+</div>
                            </a>
                        </div>
                    </div>
                </li>

                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a
                                className={clsx("A-LMS", activePercent === 100 && "active")}
                                href="#"
                                onClick={(event) => handleZoomClick(event, 100)}
                                onKeyDown={(event) => handleZoomKeyDown(event, 100)}
                                role="button"
                                title="字型-中"
                                aria-label="字型-中"
                                aria-pressed={activePercent === 100}
                                aria-selected={activePercent === 100}
                                data-size="100%"
                            >
                                <div className="LMS-text" style={{ fontSize: "medium" }}>A</div>
                            </a>
                        </div>
                    </div>
                </li>

                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a
                                className={clsx("A-LMS", activePercent === 87.5 && "active")}
                                href="#"
                                onClick={(event) => handleZoomClick(event, 87.5)}
                                onKeyDown={(event) => handleZoomKeyDown(event, 87.5)}
                                role="button"
                                title="字型-小"
                                aria-label="字型-小"
                                aria-pressed={activePercent === 87.5}
                                aria-selected={activePercent === 87.5}
                                data-size="87.5%"
                            >
                                <div className="LMS-text" style={{ fontSize: "medium" }}>A-</div>
                            </a>
                        </div>
                    </div>
                </li>
            </ul>
        </li>
    );
};

/* =========================
 * Menu：data + render
 * ========================= */

const MainMenu = (
    props: {
        lang: Lang;
        site: INormSite;
        style: IFETheme;
        isMobileView: boolean;
        isMobileMenuOpen: boolean;
        closeMobileMenu: () => void;
        menuRootRef: React.RefObject<HTMLDivElement | null>;
    },
) =>
{
    // 宣告變數
    const [openId, setOpenId] = useState<string | null>(null);
    const [closingId, setClosingId] = useState<string | null>(null);
    const [hoverSuppressedId, setHoverSuppressedId] = useState<string | null>(null);
    const openIdRef = useRef<string | null>(null);
    const closeTimerRef = useRef<number | null>(null);
    const menuItems = useMemo(() => GetMenuData(props.lang, props.site), [props.lang, props.site]);
    const location = useLocation();

    useEffect(() =>
    {
        // 執行 function：同步目前開啟的 menu id，讓關閉流程可取得最新狀態
        openIdRef.current = openId;
    }, [openId]);

    const clearCloseTimer = useCallback((): void =>
    {
        // 執行 function：清除尚未完成的關閉動畫 timer
        if (closeTimerRef.current === null) return;

        window.clearTimeout(closeTimerRef.current);
        closeTimerRef.current = null;
    }, []);

    const closeMegaMenuImmediately = useCallback((): void =>
    {
        // 執行 function：立即關閉 menu，通常用於手機/桌機模式切換
        clearCloseTimer();
        setOpenId(null);
        setClosingId(null);
    }, [clearCloseTimer]);

    const closeMegaMenuWithAnimation = useCallback((shouldSuppressHover: boolean, fallbackId?: string): void =>
    {
        // 執行 function：保留收合動畫並關閉 menu
        const currentOpenId = openIdRef.current ?? fallbackId;
        if (!currentOpenId) return;

        clearCloseTimer();

        if (shouldSuppressHover)
        {
            setHoverSuppressedId(currentOpenId);
        }

        setClosingId(currentOpenId);
        setOpenId(null);

        closeTimerRef.current = window.setTimeout(() =>
        {
            setClosingId((prev) => prev === currentOpenId ? null : prev);
            closeTimerRef.current = null;
        }, MEGA_MENU_ANIMATION_MS);
    }, [clearCloseTimer]);

    const closeMegaMenuWithHoverSuppress = useCallback((): void =>
    {
        // 執行 function：鍵盤焦點離開或 Esc 時，關閉 menu 並抑制 hover 重新展開
        closeMegaMenuWithAnimation(true);
    }, [closeMegaMenuWithAnimation]);

    const closeMegaMenuForRouteChange = useCallback((): void =>
    {
        // 執行 function：切頁時收合 menu，避免 hover 殘留重新展開
        closeMegaMenuWithAnimation(true);
    }, [closeMegaMenuWithAnimation]);

    const releaseHoverSuppress = useCallback((): void =>
    {
        // 執行 function：滑鼠離開 menu 後恢復 hover 行為
        setHoverSuppressedId(null);
    }, []);

    const toggleOpen = useCallback((id: string) =>
    {
        // 執行 function：切換第一層 mega menu，重複點擊同一項時走收合動畫
        setHoverSuppressedId(null);

        if (openIdRef.current === id)
        {
            closeMegaMenuWithAnimation(false, id);
            return;
        }

        clearCloseTimer();
        setClosingId(null);
        setOpenId(id);
    }, [clearCloseTimer, closeMegaMenuWithAnimation]);

    const openMegaMenuByHover = useCallback((id: string): void =>
    {
        // 執行 function：桌機版滑鼠移入第一層 menu 時自動展開
        if (props.isMobileView) return;
        if (hoverSuppressedId === id) return;

        clearCloseTimer();
        setHoverSuppressedId(null);
        setClosingId(null);
        setOpenId(id);
    }, [clearCloseTimer, hoverSuppressedId, props.isMobileView]);

    const closeMegaMenuByHoverLeave = useCallback((id: string): void =>
    {
        // 執行 function：桌機版滑鼠離開整個 menu item 後播放收合動畫
        if (props.isMobileView) return;

        if (hoverSuppressedId === id)
        {
            setHoverSuppressedId(null);
            return;
        }

        if (openIdRef.current !== id) return;

        closeMegaMenuWithAnimation(false, id);
    }, [closeMegaMenuWithAnimation, hoverSuppressedId, props.isMobileView]);

    const handleLeafClick = useCallback((menuId?: string) =>
    {
        // 執行 function：滑鼠點擊或鍵盤進入子項目後，收合 mega menu
        closeMegaMenuWithAnimation(true, menuId);

        if (!props.isMobileView) return;
        props.closeMobileMenu();
    }, [closeMegaMenuWithAnimation, props.closeMobileMenu, props.isMobileView]);

    useEffect(() =>
    {
        // 執行 function：元件卸載時清除動畫 timer
        return () =>
        {
            if (closeTimerRef.current === null) return;
            window.clearTimeout(closeTimerRef.current);
        };
    }, []);

    useEffect(() =>
    {
        // 執行 function：主 menu 收合時同步清掉子 menu 狀態
        if (props.isMobileMenuOpen) return;
        closeMegaMenuImmediately();
    }, [closeMegaMenuImmediately, props.isMobileMenuOpen]);

    useEffect(() =>
    {
        // 執行 function：切換回桌機時清掉手機展開狀態
        if (props.isMobileView) return;
        closeMegaMenuImmediately();
    }, [closeMegaMenuImmediately, props.isMobileView]);

    useCloseOnRouteChange(location.pathname, location.search, location.hash, closeMegaMenuForRouteChange);
    useCloseOnFocusLeave(props.menuRootRef, openId !== null, closeMegaMenuWithHoverSuppress);
    useCloseOnEscape(openId !== null, closeMegaMenuWithHoverSuppress);

    useEffect(() =>
    {
        // 執行 function：點 menu 外部時收合第一層選單
        if (typeof document === "undefined") return;
        if (!openId) return;

        const root = props.menuRootRef.current;
        if (!root) return;

        const onPointerDown = (event: PointerEvent) =>
        {
            const target = event.target as Node | null;
            if (!target) return;
            if (root.contains(target)) return;

            closeMegaMenuWithAnimation(true);
        };

        document.addEventListener("pointerdown", onPointerDown, true);

        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [closeMegaMenuWithAnimation, openId, props.menuRootRef]);

    return (
        <>
            {menuItems.map((item) =>
            {
                const id = String(item.Id);
                const hasChildren = (item.SubItem ?? []).length > 0;

                if (!hasChildren)
                {
                    return <SingleMenuItem key={String(item.Id ?? item.SrcData)} menuItem={item} onLeafClick={handleLeafClick} />;
                }

                return (
                    <MegaMenuItem
                        key={String(item.Id ?? item.SrcData)}
                        menuItem={item}
                        isOpen={openId === id}
                        isClosing={closingId === id}
                        isHoverSuppressed={hoverSuppressedId === id && openId === null}
                        onToggle={toggleOpen}
                        onLeafClick={handleLeafClick}
                        onHoverOpen={openMegaMenuByHover}
                        onHoverClose={closeMegaMenuByHoverLeave}
                        onHoverRelease={releaseHoverSuppress}
                    />
                );
            })}
        </>
    );
};

const SingleMenuItem = (props: { menuItem: MenuItemData; onLeafClick: (menuId?: string) => void; }) =>
{
    const handleLeafClick = () =>
    {
        // 執行 function：點擊單層選單後收合手機 menu
        props.onLeafClick();
    };

    const handleLeafKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：支援 Header 單層選單連結以 Space 進入頁面
        if (!isKeyboardActivateKey(event)) return;

        event.preventDefault();
        event.currentTarget.click();
    };

    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                to={props.menuItem.Url || "#"}
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                onClick={handleLeafClick}
                onKeyDown={handleLeafKeyDown}
            >
                {/^https?:\/\//i.test(props.menuItem.Url || "") && <i className="fad fa-link me-2"></i>}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

interface IMegaMenuItemProps
{
    menuItem: MenuItemData;
    isOpen: boolean;
    isClosing: boolean;
    isHoverSuppressed: boolean;
    onToggle: (id: string) => void;
    onLeafClick: (menuId?: string) => void;
    onHoverOpen: (id: string) => void;
    onHoverClose: (id: string) => void;
    onHoverRelease: () => void;
}

const MegaMenuItem = (props: IMegaMenuItemProps) =>
{
    // 宣告變數
    const id = String(props.menuItem.Id);
    const liClass = clsx(
        "nav-item dropdown dropdown-mega position-static",
        props.isOpen && "show",
        props.isClosing && "is-closing",
        props.isHoverSuppressed && "is-hover-suppressed",
    );
    const menuClass = clsx("dropdown-menu", (props.isOpen || props.isClosing) && "show", props.isClosing && "is-closing");

    const handleToggleClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：切換 mega menu 開關
        event.preventDefault();
        props.onToggle(id);
    };

    const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：支援 Enter / Space 切換 mega menu
        if (!isKeyboardActivateKey(event)) return;

        event.preventDefault();
        props.onToggle(id);
    };

    const handleLeafClick = () =>
    {
        // 執行 function：點擊子項目後收合目前所屬 mega menu
        props.onLeafClick(id);
    };

    const handleLeafKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：支援 Header 選單連結以 Space 進入頁面
        if (!isKeyboardActivateKey(event)) return;

        event.preventDefault();
        event.currentTarget.click();
    };

    const handlePointerEnter = () =>
    {
        // 執行 function：滑鼠移入第一層 menu 時自動展開
        props.onHoverOpen(id);
    };

    const handlePointerLeave = () =>
    {
        // 執行 function：滑鼠離開整個 menu item 後收合，若為鎖定狀態則解除鎖定
        if (props.isHoverSuppressed)
        {
            props.onHoverRelease();
            return;
        }

        props.onHoverClose(id);
    };

    return (
        <li className={liClass} data-menu-id={id} onPointerEnter={handlePointerEnter} onPointerLeave={handlePointerLeave}>
            <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                aria-expanded={props.isOpen}
                aria-controls={`menu-${id}`}
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                onClick={handleToggleClick}
                onKeyDown={handleToggleKeyDown}
            >
                {props.menuItem.SrcData}
            </a>

            <div id={`menu-${id}`} className={menuClass}>
                <div className="mega-content">
                    <div className="container-customize4">
                        <div className="row">
                            {props.menuItem.SubItem.map((col, colIndex) => (
                                <div key={`${id}-${colIndex}`} className="content-mb col-12 col-sm-4 col-md-4">
                                    <div className="mega-item-tilte">{col.SrcData}</div>

                                    <div className="list-group">
                                        {(col.SubItem ?? []).map((link, linkIndex) =>
                                        {
                                            const isExternal = /^https?:\/\//i.test(link.Url || "");

                                            return (
                                                <LangNavLink
                                                    key={`${id}-${colIndex}-${linkIndex}`}
                                                    className="list-group-item"
                                                    to={link.Url || "#"}
                                                    target={link.URL_Open}
                                                    onClick={handleLeafClick}
                                                    onKeyDown={handleLeafKeyDown}
                                                    end
                                                >
                                                    {isExternal && <i className="fad fa-link me-2"></i>}
                                                    {link.SrcData}
                                                </LangNavLink>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </li>
    );
};

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    // 宣告變數：依語系取得 menu roots
    if (!site) return [];
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];

    // return：build 成 header 用 menu data
    return buildMenuItems(roots, 0);
};
