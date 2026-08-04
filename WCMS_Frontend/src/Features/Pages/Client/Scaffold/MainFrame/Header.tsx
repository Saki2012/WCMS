/* Feature 前台 Header 範例。 */
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";
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

// #region DemoStyle
/** Demo 前台樣式直接收在 TSX，避免新增正式 CSS 單元。 */
const FEATURE_DEMO_STYLE = String.raw`
.feature-site-header {
    --feature-header-bg: #123b5d;
    --feature-header-accent: #d99b24;
    --feature-header-text: #1f2933;
    --feature-focus: #ffbf47;
    position: relative;
    z-index: 1030;
    background: #fff;
    box-shadow: 0 3px 16px rgb(15 23 42 / 12%);
}

.feature-utility-bar {
    background: var(--feature-header-bg);
    color: #fff;
}

.feature-utility-inner {
    display: flex;
    justify-content: flex-end;
}

.feature-utility-list {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 0;
    margin: 0;
    padding: 0;
    list-style: none;
}

.feature-utility-list > li {
    display: flex;
    align-items: center;
}

.feature-utility-list a {
    display: inline-flex;
    align-items: center;
    min-height: 2.75rem;
    padding: .4rem .8rem;
    color: #fff;
    text-decoration: none;
}

.feature-utility-list a:hover,
.feature-utility-list a:focus-visible {
    color: #fff;
    text-decoration: underline;
    text-underline-offset: .2rem;
}

.feature-main-nav {
    min-height: 6rem;
    padding: 0;
    background: #fff;
}

.feature-main-nav-inner {
    min-height: 6rem;
}

.feature-brand-title {
    max-width: min(36rem, 65vw);
    margin: 0;
    font-size: 1rem;
}

.feature-brand-link {
    display: inline-flex;
    align-items: center;
    gap: .9rem;
    max-width: 100%;
    margin: 0;
    color: var(--feature-header-text);
    white-space: normal;
    text-decoration: none;
}

.feature-brand-mark {
    display: inline-grid;
    flex: 0 0 3.25rem;
    width: 3.25rem;
    height: 3.25rem;
    place-items: center;
    border-radius: 50%;
    background: var(--feature-header-bg);
    color: #fff;
    font-size: 1.6rem;
    font-weight: 800;
}

.feature-brand-text {
    overflow: hidden;
    font-size: clamp(1.25rem, 2vw, 1.8rem);
    font-weight: 700;
    line-height: 1.35;
    text-overflow: ellipsis;
}

.feature-main-nav .navbar-nav {
    align-items: stretch;
}

.feature-main-nav .nav-link,
.feature-main-nav .dropdown-toggle {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .55rem;
    min-height: 3.25rem;
    padding: .75rem 1rem;
    border: 0;
    background: transparent;
    color: var(--feature-header-text);
    font: inherit;
    font-weight: 600;
    text-align: left;
    text-decoration: none;
}

.feature-main-nav .nav-link:hover,
.feature-main-nav .dropdown-toggle:hover,
.feature-main-nav .nav-link.active,
.feature-main-nav .nav-link[aria-current="page"] {
    color: var(--feature-header-bg);
}

.feature-main-nav .nav-link::after,
.feature-main-nav .dropdown-toggle::after {
    display: none;
}

.feature-menu-arrow {
    font-size: .8rem;
    transition: transform .2s ease;
}

.feature-main-nav .dropdown-toggle[aria-expanded="true"] .feature-menu-arrow {
    transform: rotate(180deg);
}

.feature-main-nav .dropdown-menu {
    min-width: 14rem;
    margin: 0;
    padding: .4rem;
    border: 0;
    border-top: .2rem solid var(--feature-header-accent);
    border-radius: .25rem;
    box-shadow: 0 12px 30px rgb(15 23 42 / 18%);
}

.feature-main-nav .dropdown-menu.show {
    display: block;
}

.feature-main-nav .dropdown-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: .75rem;
    min-height: 2.75rem;
    padding: .6rem .75rem;
    border: 0;
    border-radius: .2rem;
    background: transparent;
    color: var(--feature-header-text);
    font: inherit;
    text-align: left;
    white-space: normal;
    text-decoration: none;
}

.feature-main-nav .dropdown-item:hover,
.feature-main-nav .dropdown-item:focus-visible,
.feature-main-nav .dropdown-item.active,
.feature-main-nav .dropdown-item[aria-current="page"] {
    background: #edf4f8;
    color: var(--feature-header-bg);
}

.feature-main-nav .submenu {
    position: relative;
}

.feature-main-nav .submenu > .dropdown-menu {
    top: -.4rem;
    left: 100%;
}

.feature-main-nav a:focus-visible,
.feature-main-nav button:focus-visible,
.feature-utility-list a:focus-visible,
.feature-brand-link:focus-visible {
    outline: .2rem solid var(--feature-focus);
    outline-offset: .15rem;
}

.feature-main-nav .navbar-toggler {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 3rem;
    height: 3rem;
    padding: .55rem;
    border: .1rem solid var(--feature-header-bg);
    border-radius: .3rem;
    color: var(--feature-header-bg);
}

.feature-main-nav .hamburger {
    display: grid;
    width: 1.5rem;
    gap: .3rem;
}

.feature-main-nav .hamburger > span {
    display: block;
    height: .15rem;
    border-radius: 1rem;
    background: currentColor;
    transition: transform .2s ease, opacity .2s ease;
}

.feature-main-nav .hamburger.active > span:nth-child(1) {
    transform: translateY(.45rem) rotate(45deg);
}

.feature-main-nav .hamburger.active > span:nth-child(2) {
    opacity: 0;
}

.feature-main-nav .hamburger.active > span:nth-child(3) {
    transform: translateY(-.45rem) rotate(-45deg);
}

.feature-empty-menu {
    margin: 1rem 0;
    color: #52606d;
}

.feature-menu-overlay {
    display: none;
}

.feature-home-main {
    min-height: 34vh;
    padding: clamp(2rem, 6vw, 5rem) 0;
    background: linear-gradient(135deg, #f7fafc 0%, #eef5f8 100%);
}

.feature-home-placeholder {
    max-width: 52rem;
    margin: 0 auto;
    padding: clamp(2rem, 5vw, 4rem);
    border: .1rem solid #d8e3ea;
    border-radius: .6rem;
    background: rgb(255 255 255 / 88%);
    box-shadow: 0 12px 30px rgb(15 23 42 / 8%);
    text-align: center;
}

.feature-home-placeholder h2 {
    margin-bottom: 1rem;
    color: #123b5d;
    font-size: clamp(1.6rem, 4vw, 2.5rem);
}

.feature-home-placeholder p {
    margin: 0;
    color: #52606d;
    font-size: 1.05rem;
    line-height: 1.8;
}

@media (min-width: 1200px) {
    .feature-main-nav .navbar-collapse {
        display: flex !important;
        flex-basis: auto;
    }

    .feature-main-nav .navbar-toggler {
        display: none;
    }

    .feature-main-nav .nav-item.dropdown > .dropdown-menu {
        position: absolute;
        top: 100%;
        left: 0;
    }
}

@media (max-width: 1199.98px) {
    .feature-main-nav,
    .feature-main-nav-inner {
        min-height: 5rem;
    }

    .feature-main-nav .navbar-collapse {
        position: absolute;
        z-index: 1040;
        top: 100%;
        right: 0;
        left: 0;
        max-height: calc(100vh - 5rem);
        overflow-y: auto;
        background: #fff;
        box-shadow: 0 16px 30px rgb(15 23 42 / 18%);
    }

    .feature-main-nav .navbar-nav {
        padding: .75rem 1rem 1rem;
    }

    .feature-main-nav .nav-link,
    .feature-main-nav .dropdown-toggle {
        width: 100%;
        border-bottom: .05rem solid #d8e3ea;
    }

    .feature-main-nav .dropdown-menu,
    .feature-main-nav .submenu > .dropdown-menu {
        position: static;
        width: 100%;
        margin: 0;
        padding-left: 1rem;
        border-top: 0;
        border-left: .2rem solid var(--feature-header-accent);
        box-shadow: none;
    }

    .feature-site-header.active .feature-menu-overlay {
        display: block;
        position: fixed;
        z-index: 1020;
        inset: 0;
        background: rgb(15 23 42 / 50%);
    }

    .feature-site-header.active .feature-main-nav {
        position: relative;
        z-index: 1030;
    }
}

@media (max-width: 575.98px) {
    .feature-utility-inner {
        justify-content: center;
    }

    .feature-utility-list {
        justify-content: center;
    }

    .feature-brand-title {
        max-width: calc(100% - 4rem);
    }

    .feature-brand-mark {
        display: none;
    }

    .feature-brand-text {
        font-size: 1.15rem;
    }
}

@media (prefers-reduced-motion: reduce) {
    .feature-site-header *,
    .feature-site-header *::before,
    .feature-site-header *::after {
        scroll-behavior: auto !important;
        transition-duration: .01ms !important;
    }
}

/* Feature Demo：補強主選單 hover、鍵盤焦點與 Footer 文字可讀性。 */
.feature-site-header .feature-main-nav .nav-link:hover,
.feature-site-header .feature-main-nav .dropdown-toggle:hover,
.feature-site-header .feature-main-nav .dropdown-item:hover {
    background: #edf4f8 !important;
    color: #123b5d !important;
    text-decoration: none;
}

.feature-site-header .feature-main-nav .nav-link:hover *,
.feature-site-header .feature-main-nav .dropdown-toggle:hover *,
.feature-site-header .feature-main-nav .dropdown-item:hover * {
    color: inherit !important;
}

.feature-main-nav .nav-link:focus,
.feature-main-nav .nav-link:focus-visible,
.feature-main-nav .dropdown-toggle:focus,
.feature-main-nav .dropdown-toggle:focus-visible,
.feature-main-nav .dropdown-item:focus,
.feature-main-nav .dropdown-item:focus-visible {
    background: #edf4f8;
    color: #123b5d !important;
    text-decoration: none;
}

.Footer_section .copyright_section .content,
.Footer_section .copyright_section .design_by {
    color: #111827 !important;
}

.Footer_section .copyright_section .design_by:hover,
.Footer_section .copyright_section .design_by:focus,
.Footer_section .copyright_section .design_by:focus-visible {
    color: #123b5d !important;
    text-decoration: underline;
    text-underline-offset: .2rem;
}
`;

/** 輸出 Feature Demo 使用的頁首、首頁與 Footer 基礎樣式。 */
const FeatureDemoStyle = () =>
{
    return <style data-wcms-feature-demo>{FEATURE_DEMO_STYLE}</style>;
};
// #endregion

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
            <FeatureDemoStyle />
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
    const external = isExternalUrl(props.item.Url);
    const target = props.item.URL_Open || (external ? "_blank" : "_self");

    return (
        <li className="nav-item">
            <LangNavLink className={props.className} to={props.item.Url || "#"} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined}>
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
