/* Feature 前台 Header 範例。 */
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
import { useMenuNavigationAction } from "@/Features/Hooks/UIAction/Navigation/useMenuNavigationAction";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { useRef } from "react";
import { SkipToContent } from "./Accesskey/SkipToContent";

// #region Property
export interface HeaderProps
{
    lang: Lang;
    site: INormSite;
    style: IFETheme;
}

interface HeaderText
{
    home: string;
    sitemap: string;
    mainMenu: string;
    openMenu: string;
    closeMenu: string;
    emptyMenu: string;
}

interface HeaderMenuProps
{
    lang: Lang;
    site: INormSite;
    text: HeaderText;
}

interface MenuItemProps
{
    item: MenuItemData;
    depth: number;
}
// #endregion

// #region Public
/** 建立略過導覽並直接前往主要內容的連結。 */
export const A11yContent = ({ lang }: { lang?: Lang; }) =>
{
    return <SkipToContent lang={lang} />;
};

/** 建立 Feature 共用前台 Header。 */
export const Header = (props: HeaderProps) =>
{
    const headerRef = useRef<HTMLDivElement | null>(null);
    const text = getHeaderText(props.lang);

    useMobileMenuCollapse({
        headerRef,
        collapseSelector: "#feature-navbar-content",
        togglerSelector: ".navbar-toggler",
        overlaySelector: ".feature-menu-overlay",
        hamburgerSelector: ".hamburger",
        togglerOpenLabel: text.openMenu,
        togglerCloseLabel: text.closeMenu,
    });

    return (
        <>
            <A11yContent lang={props.lang} />
            <div id="Site-Header" className="feature-site-header main-header" ref={headerRef}>
                <UtilityBar lang={props.lang} site={props.site} text={text} />
                <MainNavigation lang={props.lang} site={props.site} text={text} />
                <div className="feature-menu-overlay" aria-hidden="true" />
            </div>
        </>
    );
};
// #endregion

// #region Protected
/** 建立 Header 上方快速連結列。 */
const UtilityBar = (props: HeaderMenuProps) =>
{
    return (
        <div className="feature-utility-bar">
            <div className="container feature-utility-inner">
                <ul className="feature-utility-list">
                    <li><Accesskey type="U" lang={props.lang} /></li>
                    <li><LangLink to="/">{props.text.home}</LangLink></li>
                    <li><LangNavLink to={`/${SITEMAP_SEGMENT}`}>{props.text.sitemap}</LangNavLink></li>
                    <LangSwitchBtn site={props.site} />
                </ul>
            </div>
        </div>
    );
};

/** 建立品牌區、手機按鈕與主要選單。 */
const MainNavigation = (props: HeaderMenuProps) =>
{
    const siteTitle = getSiteTitle(props.site, props.lang);

    return (
        <nav className="feature-main-nav navbar navbar-expand-xl" aria-label={props.text.mainMenu}>
            <div className="container feature-main-nav-inner">
                <BrandLink siteTitle={siteTitle} />
                <MenuToggle text={props.text} />
                <FeatureMainMenu lang={props.lang} site={props.site} text={props.text} />
            </div>
        </nav>
    );
};

/** 建立公版文字 Logo，避免依賴特定 Spec 圖檔。 */
const BrandLink = ({ siteTitle }: { siteTitle: string; }) =>
{
    return (
        <h1 className="feature-brand-title">
            <LangLink className="feature-brand-link navbar-brand" to="/">
                <span className="feature-brand-mark" aria-hidden="true">W</span>
                <span className="feature-brand-text">{siteTitle}</span>
            </LangLink>
        </h1>
    );
};

/** 建立手機版主選單開關。 */
const MenuToggle = ({ text }: { text: HeaderText; }) =>
{
    return (
        <button
            className="navbar-toggler collapsed"
            type="button"
            aria-controls="feature-navbar-content"
            aria-expanded="false"
            aria-label={text.openMenu}
        >
            <span className="hamburger" aria-hidden="true">
                <span />
                <span />
                <span />
            </span>
        </button>
    );
};

/** 建立 SiteMenu 對應的第一層主選單。 */
const FeatureMainMenu = (props: HeaderMenuProps) =>
{
    const roots = props.site.treeByLang?.[props.lang] ?? [];
    const menuItems = buildMenuItems(roots, 0);

    return (
        <div id="feature-navbar-content" className="collapse navbar-collapse">
            {menuItems.length > 0
                ? <ul className="navbar-nav ms-auto">{menuItems.map(item => <TopMenuItem key={item.Id} item={item} depth={0} />)}</ul>
                : <p className="feature-empty-menu">{props.text.emptyMenu}</p>}
        </div>
    );
};

/** 建立第一層選單項目。 */
const TopMenuItem = ({ item, depth }: MenuItemProps) =>
{
    const hasChildren = item.SubItem.length > 0;
    if (!hasChildren) return <LeafMenuItem item={item} className="nav-link" />;

    return (
        <li className="nav-item dropdown">
            <DropdownToggle item={item} depth={depth} className="nav-link dropdown-toggle" />
            <DropdownMenu item={item} depth={depth} />
        </li>
    );
};

/** 建立第二層以下的遞迴選單項目。 */
const NestedMenuItem = ({ item, depth }: MenuItemProps) =>
{
    const hasChildren = item.SubItem.length > 0;
    if (!hasChildren) return <LeafMenuItem item={item} className="dropdown-item" />;

    return (
        <li className="dropend submenu">
            <DropdownToggle item={item} depth={depth} className="dropdown-item dropdown-toggle" />
            <DropdownMenu item={item} depth={depth} />
        </li>
    );
};

/** 建立可展開子選單的按鈕。 */
const DropdownToggle = (props: { item: MenuItemData; depth: number; className: string; }) =>
{
    const submenuId = buildSubmenuId(props.item, props.depth);

    return (
        <button className={props.className} type="button" aria-expanded="false" aria-controls={submenuId}>
            <span>{props.item.SrcData}</span>
            <i className="fas fa-angle-down feature-menu-arrow" aria-hidden="true" />
        </button>
    );
};

/** 建立單一選單的子選單清單。 */
const DropdownMenu = ({ item, depth }: MenuItemProps) =>
{
    const submenuId = buildSubmenuId(item, depth);

    return (
        <ul id={submenuId} className="dropdown-menu">
            {item.SubItem.map(child => <NestedMenuItem key={child.Id} item={child} depth={depth + 1} />)}
        </ul>
    );
};

/** 建立最終可導頁的選單連結。 */
const LeafMenuItem = (props: { item: MenuItemData; className: string; }) =>
{
    const menuNavigation = useMenuNavigationAction();
    const external = isExternalUrl(props.item.Url);
    const target = props.item.URL_Open || (external ? "_blank" : "_self");

    return (
        <li className="nav-item">
            <LangNavLink className={props.className} to={props.item.Url || "#"} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} onClick={menuNavigation.onMenuNavigate}>
                {external && <i className="fas fa-external-link-alt me-2" aria-hidden="true" />}
                {props.item.SrcData}
            </LangNavLink>
        </li>
    );
};
// #endregion

// #region Private
/** 取得目前語系使用的 Header 文字。 */
const getHeaderText = (lang: Lang): HeaderText =>
{
    const isEn = lang === "en";
    return isEn
        ? { home: "Home", sitemap: "Sitemap", mainMenu: "Main navigation", openMenu: "Open main menu", closeMenu: "Close main menu", emptyMenu: "No menu items have been configured." }
        : { home: "回首頁", sitemap: "網站導覽", mainMenu: "主要選單", openMenu: "開啟主選單", closeMenu: "關閉主選單", emptyMenu: "目前尚未設定前台選單。" };
};

/** 取得站台標題，缺少目前語系時依序回退。 */
const getSiteTitle = (site: INormSite, lang: Lang): string =>
{
    const currentTitle = site.indexInfoByLang?.[lang]?.title?.trim();
    const zhTitle = site.indexInfoByLang?.["zh-tw"]?.title?.trim();
    const enTitle = site.indexInfoByLang?.en?.title?.trim();
    return currentTitle || zhTitle || enTitle || "WCMS";
};

/** 建立穩定且可被 aria-controls 指向的子選單 Id。 */
const buildSubmenuId = (item: MenuItemData, depth: number): string =>
{
    const safeId = item.Id.replace(/[^a-zA-Z0-9_-]/g, "-");
    return `feature-submenu-${depth}-${safeId}`;
};

/** 判斷選單網址是否為外部網址。 */
const isExternalUrl = (url: string): boolean =>
{
    return /^(https?:)?\/\//i.test(url || "");
};
// #endregion