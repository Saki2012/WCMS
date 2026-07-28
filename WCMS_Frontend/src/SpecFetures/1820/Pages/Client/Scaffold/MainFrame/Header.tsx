/*Header模塊*/
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { A11yContent } from "@/Features/Pages/Client/Scaffold/MainFrame/Header";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LogoImg from "@/SpecFetures/1820/Assets/Client/images/logo/LOGO_400x95.png";

import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import React from "react";
import { useLocation } from "react-router-dom";

// #region Property
interface IMenuToggleA11yText
{
    label: string;
    open: string;
    close: string;
    logoAlt: string;
}
interface INavBarText
{
    Home: string;
    NCHU: string;
    SiteMap: string;
}
const MENU_TOGGLE_A11Y_TEXT_MAP: Partial<Record<Lang, IMenuToggleA11yText>> = {
    "zh-tw": { label: "主選單", open: "開啟主選單", close: "關閉主選單", logoAlt: "國立中興大學新化林場 LOGO" },
    "zh-cn": { label: "主菜单", open: "开启主菜单", close: "关闭主菜单", logoAlt: "国立中兴大学新化林场 LOGO" },
    en: { label: "Main menu", open: "Open main menu", close: "Close main menu", logoAlt: "NCHU Xinhua Forest Station LOGO" },
};
const NAV_BAR_TEXT_MAP: Partial<Record<Lang, INavBarText>> = {
    "zh-tw": { Home: "回首頁", NCHU: "中興大學", SiteMap: "網站導覽" },
    "zh-cn": { Home: "回首页", NCHU: "中兴大学", SiteMap: "网站导览" },
    en: { Home: "Home", NCHU: "NCHU", SiteMap: "SiteMap" },
};
// #endregion

// #region Section
const Header_Section = (props: { lang: Lang; site: INormSite; }) =>
{
    return (
        <section className="header_section">
            <header className="header_Box bg-custom-rgba">
                <div className="navsBox">
                    <div className="container-customize0 d-flex justify-content-lg-between justify-content-center flex-wrap">
                        <p className="small pt-2 mt-lg-2 mt-1 mb-lg-2 mb-1 mr-md-3 mr-1" style={{ color: "#bd1f1f" }}>本網站為試營運階段，如有住宿、訂餐等本場服務，請致電服務專線：06-5900022</p>
                        <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                            <NavBar lang={props.lang} />
                            {/* <LangSwitchBtn site={props.site} /> */}
                        </ul>
                    </div>
                </div>
            </header>
        </section>
    );
};

const Menu_Section = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() =>
    {
        // 原本邏輯保留
    }, []);

    return (
        <section className="menu_section">
            <div className="customMENU_Box bg-custom-rgba">
                <div className="menuBox">
                    <div className="container-customize0">
                        <div className="navbar navbar-expand-lg px-0 py-0" ref={menuRef}>
                            <LogoComp lang={props.lang} />
                            <MobileBtn lang={props.lang} />
                            <MainMenu {...props} />
                            <PCBtn />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

const LogoComp = (props: { lang: Lang; }) =>
{
    const text = getMenuToggleA11yText(props.lang);

    return (
        <h1 className="logo">
            <LangLink className="navbar-brand my-0" to="/" title={text.logoAlt} aria-label={text.logoAlt}>
                <img src={LogoImg} alt={text.logoAlt} />
            </LangLink>
        </h1>
    );
};
// #endregion

// #region Protected
/**
 * 遞迴渲染多層選單
 * parentDepth = 0 代表「第二層」，對應原本的 className 設計：
 * - 第二層 parent 的子層 <ul> 用 "dropdown-menu"
 * - 再往下（第四層以後）用 "dropdown-menu dropdown-submenu"
 */
const renderDropdownItems = (items: MenuItemData[], parentDepth: number): JSX.Element[] =>
{
    return items.map((item, index) =>
    {
        const hasChildren = (item.SubItem ?? []).length > 0;
        const key = `${parentDepth}-${index}`;
        const isExternal = /^https?:\/\//i.test(item.Url || "");

        if (!hasChildren)
        {
            // 純連結項目
            return (
                <li key={key}>
                    <LangNavLink className="dropdown-item" to={item.Url || "#"} role="button" target={item.URL_Open}>
                        {isExternal && <i className="fad fa-link me-2"></i>}
                        {item.SrcData}
                    </LangNavLink>
                </li>
            );
        }
        // 有子項目 -> dropend submenu 結構
        const submenuClassName = parentDepth === 0 ? "dropdown-menu" : "dropdown-menu dropdown-submenu";
        return (
            <li key={key} className="dropend submenu">
                <LangLink
                    to={item.Url || "#"}
                    role="button"
                    className="dropdown-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    target={item.URL_Open}
                    title={item.SrcData}
                    aria-label={item.SrcData}
                    aria-expanded="false"
                >
                    {item.SrcData}
                </LangLink>

                <ul className={submenuClassName}>{renderDropdownItems(item.SubItem ?? [], parentDepth + 1)}</ul>
            </li>
        );
    });
};
// #endregion

// #region Private
/** 取得手機選單按鈕與 Logo 的無障礙文字。 */
const getMenuToggleA11yText = (lang: Lang): IMenuToggleA11yText =>
{
    return MENU_TOGGLE_A11Y_TEXT_MAP[lang] ?? MENU_TOGGLE_A11Y_TEXT_MAP["zh-tw"]!;
};

/** 判斷是否為首頁（支援多語系首頁） */
const isHomePage = (pathname: string, lang: Lang) =>
{
    const cleanPath = pathname.replace(/\/+$/, "") || "/";

    const homePaths = ["/", `/${lang}`];

    return homePaths.includes(cleanPath);
};

export const Header = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();

    const isHome = isHomePage(location.pathname, props.lang);
    const menuToggleText = getMenuToggleA11yText(props.lang);

    useMobileMenuCollapse({
        headerRef,
        collapseSelector: "#navbar-content",
        togglerSelector: ".navbar-toggler",
        overlaySelector: ".overlayer",
        hamburgerSelector: ".hamburger",
        headerActiveClass: "active",
        lockBodyScroll: true,
        disableBootstrapAutoToggle: true,
        togglerOpenLabel: menuToggleText.open,
        togglerCloseLabel: menuToggleText.close,
    });

    useEffect(() =>
    {
        const el = headerRef.current;
        if (!el) return;

        /** 同步 Header 下滑後的陰影與濾鏡狀態 */
        const syncHeaderStyle = () =>
        {
            const isScrolled = window.scrollY >= 180;

            el.classList.toggle("shadow", isScrolled);
            el.classList.toggle("filter-custom", isScrolled);
        };

        syncHeaderStyle();
        window.addEventListener("scroll", syncHeaderStyle, { passive: true });

        return () =>
        {
            window.removeEventListener("scroll", syncHeaderStyle);
        };
    }, [location.pathname]);

    return (
        <>
            <A11yContent />
            <div id="Site-Header" ref={headerRef} className={clsx("ALL_Header_DivBar", "main-header", isHome && "position-fixed")}>
                <Header_Section lang={props.lang} site={props.site} />
                <Menu_Section {...props} />
                <div className="overlayer" aria-hidden="true" />
            </div>
        </>
    );
};
const NavBar = (props: { lang: Lang; }) =>
{
    const title = NAV_BAR_TEXT_MAP[props.lang] ?? NAV_BAR_TEXT_MAP["zh-tw"]!;

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
                    <LangLink className="nav-link" to="https://www.nchu.edu.tw/index1.php" title={title.NCHU}>{title.NCHU}</LangLink>
                </li>
                <li className="nav-item">
                    <LangNavLink to={`/${SITEMAP_SEGMENT}`} className="nav-link" target="_self" title={title.SiteMap}>{title.SiteMap}</LangNavLink>
                </li>
            </ul>
        </li>
    );
};

const MobileBtn = (props: { lang: Lang; }) =>
{
    const text = getMenuToggleA11yText(props.lang);

    return (
        <>
            <div className="mobile-box ml-auto me-2" aria-hidden="true">
                <div className="icons">
                    <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block d-sm-none"></div>
                </div>
            </div>

            <a
                className="navbar-toggler collapsed"
                type="button"
                role="button"
                tabIndex={0}
                data-bs-toggle="collapse"
                data-bs-target="#navbar-content"
                aria-controls="navbar-content"
                aria-expanded="false"
                aria-label={text.open}
                title={text.open}
            >
                <div className="hamburger-toggle" aria-hidden="true">
                    <div className="hamburger">
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </div>
            </a>
        </>
    );
};

const MainMenu = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const menuItems = GetMenuData(props.lang, props.site);

    return (
        <div id="navbar-content" className="collapse navbar-collapse overflow-scroll-Y" role="navigation" aria-label={getMenuToggleA11yText(props.lang).label}>
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {menuItems.map((item, idx) =>
                {
                    return (
                        <React.Fragment key={idx}>
                            {item.SubItem?.length === 0 ? <SingleMenuItem menuItem={item} /> : <DropdownMenuItem menuItem={item} />}
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
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-inline-block"></div>
            </div>
        </div>
    );
};

/** 1. 一般單選 */
const SingleMenuItem = (props: { menuItem: MenuItemData; }) =>
{
    return (
        <li className="nav-item">
            <LangLink className="nav-link" to={props.menuItem.Url} role="button" title={props.menuItem.SrcData} aria-label={props.menuItem.SrcData}>
                {/^https?:\/\//i.test(props.menuItem.Url || "") && <i className="fad fa-link me-2" aria-hidden="true"></i>}
                {props.menuItem.SrcData}
            </LangLink>
        </li>
    );
};

/** 2. 多層下拉 */
const DropdownMenuItem = (props: { menuItem: MenuItemData; }) =>
{
    return (
        <li className="nav-item dropdown">
            <LangLink
                className="nav-link dropdown-toggle"
                to={props.menuItem.Url}
                role="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                target={props.menuItem.URL_Open}
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                aria-expanded="false"
            >
                {props.menuItem.SrcData}
            </LangLink>
            {/* 第二層（原本的 <ul className="dropdown-menu">） */}
            <ul className="dropdown-menu">{renderDropdownItems(props.menuItem.SubItem, 0)}</ul>
        </li>
    );
};

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];
    return buildMenuItems(roots, 0);
};
// #endregion
