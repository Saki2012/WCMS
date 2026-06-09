/*Header模塊*/
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LogoImg from "@/SpecFetures/1820/Assets/Client/images/logo/LOGO_400x95.png";
import { A11yContent } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { color } from "framer-motion";
import { useEffect, useRef } from "react";
import React from "react";
import { useLocation } from "react-router-dom";

// #region Section
const Header_Section = (props: { lang: Lang; site: INormSite; }) =>
{
    return (
        <section className="header_section">
            <header className="header_Box bg-custom-rgba">
                <div className="navsBox">
                    <div className="container-customize0 d-flex justify-content-lg-between justify-content-center flex-wrap">
                        <p className="small pt-2 mt-lg-2 mt-1 mb-lg-2 mb-1 mr-md-3 mr-1" style={{color:"#bd1f1f"}}>本網站為試營運階段，如有住宿、訂餐等本場服務，請致電服務專線：06-5900022</p>
                        <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                            <NavBar lang={props.lang} />
                            <LangSwitchBtn site={props.site} />
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
                            <LogoComp />
                            <MobileBtn />
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
            <LangLink className="navbar-brand my-0" to="/" title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    );
};
// #endregion

// #region EntityComp
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
/** 判斷是否為首頁（支援多語系首頁） */
const isHomePage = (pathname: string, lang: Lang) =>
{
    const cleanPath = pathname.replace(/\/+$/, "") || "/";

    const homePaths = ["/", `/${lang}`];

    return homePaths.includes(cleanPath);
};


const Header = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
    const location = useLocation();

    const isHome = isHomePage(location.pathname, props.lang);

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


export default Header;

const NavBar = (props: { lang: Lang; }) =>
{
    const title = props.lang === "zh-tw"
        ? { Home: "回首頁", NCHU: "中興大學", SiteMap: "網站導覽" }
        : props.lang === "en"
        ? { Home: "Home", NCHU: "NCHU", SiteMap: "SiteMap" }
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
                    <LangLink className="nav-link" to="https://www.nchu.edu.tw/index1.php" title={title.NCHU}>{title.NCHU}</LangLink>
                </li>
                <li className="nav-item">
                    <LangNavLink to={`/${SITEMAP_SEGMENT}`} className="nav-link" target="_self" title={title.SiteMap}>{title.SiteMap}</LangNavLink>
                </li>
            </ul>
        </li>
    );
};

const MobileBtn = () =>
{
    return (
        <>
            <div className="mobile-box ml-auto me-2">
                <div className="icons">
                    <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block d-sm-none"></div>
                </div>
            </div>

            <a
                className="navbar-toggler collapsed"
                type="button"
                role="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbar-content"
                aria-expanded="false"
            >
                <div className="hamburger-toggle">
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
        <div id="navbar-content" className="collapse navbar-collapse overflow-scroll-Y">
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
                {/^https?:\/\//i.test(props.menuItem.Url || "") && <i className="fad fa-link me-2"></i>}
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
