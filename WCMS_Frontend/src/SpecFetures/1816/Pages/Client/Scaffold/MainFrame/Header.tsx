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
import { SearchData } from "../../Index/Section/SearchData";

const MOBILE_BREAKPOINT = 991.98;
const SHADOW_SCROLL_TOP = 180;

const Header = (props: HeaderProps) =>
{
    // 宣告變數：Site-Header root ref
    const headerRef = useRef<HTMLDivElement | null>(null);
    const [isMobileView, setIsMobileView] = useState<boolean>(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

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

const useCloseOnEscape = (isMobileMenuOpen: boolean, closeMobileMenu: () => void) =>
{
    useEffect(() =>
    {
        // 執行 function：按 Esc 時關閉手機 menu
        if (typeof document === "undefined") return;
        if (!isMobileMenuOpen) return;

        const onKeyDown = (event: KeyboardEvent) =>
        {
            if (event.key !== "Escape") return;
            closeMobileMenu();
        };

        document.addEventListener("keydown", onKeyDown);

        return () => document.removeEventListener("keydown", onKeyDown);
    }, [closeMobileMenu, isMobileMenuOpen]);
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
        if (event.key !== "Enter" && event.key !== " ") return;
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
    // 宣告變數：group ref（只管 active 狀態）
    const sizeGroupRef = useRef<HTMLUListElement | null>(null);

    const doZoom = useCallback((percent: number) =>
    {
        // 執行 function：切換字級並保存
        const custom = document.getElementById("Customsize");

        if (custom) custom.style.fontSize = `${percent}%`;
        else document.documentElement.style.fontSize = `${percent}%`;

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

    useEffect(() =>
    {
        // 執行 function：初始化讀取字級
        const saved = Number(localStorage.getItem("font-zoom") ?? "");
        if (!Number.isNaN(saved) && saved > 0) doZoom(saved);
    }, [doZoom]);

    useEffect(() =>
    {
        // 執行 function：控制字級按鈕 active 樣式
        const root = sizeGroupRef.current;
        if (!root) return;

        const onClick = (ev: MouseEvent) =>
        {
            const target = (ev.target as Element).closest(".A-LMS") as HTMLElement | null;
            if (!target || !root.contains(target)) return;

            root.querySelectorAll<HTMLElement>(".A-LMS").forEach((btn) => btn.classList.remove("active"));
            target.classList.add("active");
        };

        root.addEventListener("click", onClick);
        return () => root.removeEventListener("click", onClick);
    }, []);

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center align-items-center" ref={sizeGroupRef}>
                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a className="A-LMS" href="#" onClick={(event) => handleZoomClick(event, 112.5)} role="button" title="字型-大" data-size="112.5%">
                                <div className="LMS-text" style={{ fontSize: "medium" }}>A+</div>
                            </a>
                        </div>
                    </div>
                </li>

                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a
                                className="A-LMS active"
                                href="#"
                                onClick={(event) => handleZoomClick(event, 100)}
                                role="button"
                                title="字型-中"
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
                            <a className="A-LMS" href="#" onClick={(event) => handleZoomClick(event, 87.5)} role="button" title="字型-小" data-size="87.5%">
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
    const menuItems = useMemo(() => GetMenuData(props.lang, props.site), [props.lang, props.site]);

    const toggleOpen = useCallback((id: string) =>
    {
        // 執行 function：切換第一層 mega menu
        setOpenId((prev) => (prev === id ? null : id));
    }, []);

    const handleLeafClick = useCallback(() =>
    {
        // 執行 function：點擊葉節點後收合全部
        setOpenId(null);
        if (!props.isMobileView) return;
        props.closeMobileMenu();
    }, [props.closeMobileMenu, props.isMobileView]);

    useEffect(() =>
    {
        // 執行 function：主 menu 收合時同步清掉子 menu 狀態
        if (props.isMobileMenuOpen) return;
        setOpenId(null);
    }, [props.isMobileMenuOpen]);

    useEffect(() =>
    {
        // 執行 function：切換回桌機時清掉手機展開狀態
        if (props.isMobileView) return;
        setOpenId(null);
    }, [props.isMobileView]);

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
            setOpenId(null);
        };

        document.addEventListener("pointerdown", onPointerDown, true);

        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [openId, props.menuRootRef]);

    return (
        <>
            {menuItems.map((item) =>
            {
                const hasChildren = (item.SubItem ?? []).length > 0;

                if (!hasChildren)
                {
                    return <SingleMenuItem key={String(item.Id ?? item.SrcData)} menuItem={item} onLeafClick={handleLeafClick} />;
                }

                return (
                    <MegaMenuItem
                        key={String(item.Id ?? item.SrcData)}
                        menuItem={item}
                        isOpen={openId === String(item.Id)}
                        onToggle={toggleOpen}
                        onLeafClick={handleLeafClick}
                    />
                );
            })}
        </>
    );
};

const SingleMenuItem = (props: { menuItem: MenuItemData; onLeafClick: () => void; }) =>
{
    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                aria-current="page"
                to={props.menuItem.Url || "#"}
                role="button"
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                onClick={props.onLeafClick}
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
    onToggle: (id: string) => void;
    onLeafClick: () => void;
}

const MegaMenuItem = (props: IMegaMenuItemProps) =>
{
    const id = String(props.menuItem.Id);
    const liClass = props.isOpen ? "nav-item dropdown dropdown-mega position-static show" : "nav-item dropdown dropdown-mega position-static";
    const menuClass = props.isOpen ? "dropdown-menu show" : "dropdown-menu";

    const handleToggleClick = (event: React.MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：切換 mega menu 開關
        event.preventDefault();
        props.onToggle(id);
    };

    const handleToggleKeyDown = (event: React.KeyboardEvent<HTMLAnchorElement>) =>
    {
        // 執行 function：支援 Enter / Space 切換 mega menu
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.onToggle(id);
    };

    return (
        <li className={liClass} data-menu-id={id}>
            <a
                className="nav-link dropdown-toggle"
                href="#"
                role="button"
                aria-expanded={props.isOpen}
                aria-controls={`menu-${id}`}
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
                                                    onClick={props.onLeafClick}
                                                    end
                                                >
                                                    {isExternal && <i className="fad fa-link me-2"></i>}
                                                    {link.SrcData}
                                                </LangNavLink>
                                            );
                                        })}
                                        {
                                            /* {(col.SubItem ?? []).map((link, linkIndex) => (
											<LangNavLink
												key={`${id}-${colIndex}-${linkIndex}`}
												className="list-group-item"
												to={link.Url || "#"}
												target={link.URL_Open}
												onClick={props.onLeafClick}
												end
											>
												<i className="fad fa-link"></i>
												{link.SrcData}
											</LangNavLink>
										))} */
                                        }
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
