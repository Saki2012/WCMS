/*Header模塊*/
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import LogoImg from "@/SpecFetures/1820/Assets/Client/images/logo/LOGO_400x95.png";
import { A11yContent } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { useCallback, useEffect, useRef } from "react";
import React from "react";

const Header = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
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
            <div id="Site-Header" className="ALL_Header_DivBar main-header position-fixed" ref={headerRef}>
                <Header_Section lang={props.lang} site={props.site} />
                <Menu_Section {...props} />
                <div className="overlayer" aria-hidden="true" />
            </div>
        </>
    );
};
export default Header;

const Header_Section = (props: { lang: Lang; site: INormSite; }) =>
{
    return (
        <section className="header_section">
            <header className="header_Box bg-custom-rgba">
                <div className="navsBox">
                    <div className="container-customize0">
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
const NavBar = (props: { lang: Lang; }) =>
{
    const title = props.lang === "zh-tw"
        ? {
            Home: "回首頁",
            NCHU: "中興大學",
            SiteMap: "網站導覽",
        }
        : props.lang === "en"
        ? {
            Home: "Home",
            NCHU: "NCHU",
            SiteMap: "SiteMap",
        }
        : {};

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center my-1">
                <a accessKey="U" href="#U" className="accesskey_header U" title="上方導覽區(U)">:::</a>
                <li className="nav-item">
                    <LangLink className="nav-link" to="/" target="_self" title={title.Home}>
                        {title.Home}
                    </LangLink>
                </li>
                <li className="nav-item">
                    <a
                        className="nav-link"
                        href="https://www.nchu.edu.tw/index1.php"
                        target="_blank"
                        rel="noopener noreferrer"
                        title={title.NCHU}
                    >
                        {title.NCHU}
                    </a>
                </li>
                <li className="nav-item">
                    <LangNavLink
                        to={`/${SITEMAP_SEGMENT}`}
                        className="nav-link"
                        target="_self"
                        title={title.SiteMap}
                    >
                        {title.SiteMap}
                    </LangNavLink>
                </li>
            </ul>
        </li>
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
                        <div className="navbar navbar-expand-lg navbar-dark px-0 py-0" ref={menuRef}>
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
const MobileBtn = () =>
{
    return (
        <>
            <div className="mobile-box ml-auto me-2">
                <div className="icons">
                    <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block d-sm-none">
                        {
                            /* <a href="javascript:void(0);" className="search-button" type="button" role="button" title="搜尋" id="mobile-sss" data-bs-toggle="dropdown" aria-expanded="false" >
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="mobile-sss">
                        <input type="search" id="mobile-search-box" placeholder="search here..."  />
                        <button className="far fa-search" type="button" ></button>
                    </div> */
                        }
                    </div>
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
                            {item.SubItem?.length === 0
                                ? <SingleMenuItem menuItem={item} />
                                : <DropdownMenuItem menuItem={item} />}
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
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-inline-block">
                    {
                        /* <a href="javascript:void(0);" className="search-button" type="button" role="button" title="搜尋" id="pc-sss" data-bs-toggle="dropdown" aria-expanded="false" >
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="pc-sss">
                        <input type="search" id="pc-search-box" placeholder="search here..."  />
                        <button className="far fa-search" type="button" ></button>
                    </div> */
                    }
                </div>
            </div>
        </div>
    );
};

/** 1. 一般單選 */
const SingleMenuItem = (props: { menuItem: MenuItemData; }) =>
{
    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                aria-current="page"
                to={props.menuItem.Url}
                role="button"
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
            >
                {/^https?:\/\//i.test(props.menuItem.Url || "") && <i className="fad fa-link me-2"></i>}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

/** 2. 多層下拉 */
const DropdownMenuItem = (props: { menuItem: MenuItemData; }) =>
{
    return (
        <li className="nav-item dropdown">
            <LangNavLink
                className="nav-link dropdown-toggle"
                to={props.menuItem.Url}
                role="button"
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                target={props.menuItem.URL_Open}
            >
                {props.menuItem.SrcData}
            </LangNavLink>
            {/* 第二層（原本的 <ul className="dropdown-menu">） */}
            <ul className="dropdown-menu">
                {renderDropdownItems(props.menuItem.SubItem, 0)}
            </ul>
        </li>
    );
};

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];
    return buildMenuItems(roots, 0);
};

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
                    <LangNavLink
                        className="dropdown-item"
                        to={item.Url || "#"}
                        role="button"
                        target={item.URL_Open}
                    >
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
                <LangNavLink
                    to={item.Url || "#"}
                    role="button"
                    className="dropdown-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    target={item.URL_Open}
                >
                    {item.SrcData}
                </LangNavLink>

                <ul className={submenuClassName}>
                    {renderDropdownItems(item.SubItem ?? [], parentDepth + 1)}
                </ul>
            </li>
        );
    });
};
