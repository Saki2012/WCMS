/*Header模塊*/
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { A11yContent } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import { useCallback, useEffect, useRef } from "react";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import LogoImg from '@/SpecFetures/1818/Assets/Client/images/logo/LOGO_300x100.svg'
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import React from "react";
import { useMobileMenuCollapse } from "@/Features/Hooks/UIAction/Mobile/useMobileMenuCollapse";

const Header = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const headerRef = useRef<HTMLDivElement | null>(null);
    useMobileMenuCollapse({
        headerRef, collapseSelector: "#navbar-content", togglerSelector: ".navbar-toggler",
        overlaySelector: ".overlayer", hamburgerSelector: ".hamburger", headerActiveClass: "active", lockBodyScroll: true, disableBootstrapAutoToggle: true,
    });

    return (
        <>
            <A11yContent />
            <div id="Site-Header" className="ALL_Header_DivBar main-header" ref={headerRef}>
                <Header_Section lang={props.lang} site={props.site} />
                <Menu_Section {...props} />
                <div className="overlayer" aria-hidden="true" />
            </div>
        </>
    );
}
export default Header


const Header_Section = (props: { lang: Lang; site: INormSite }) => {
    const sizeGroupRef = useRef<HTMLUListElement | null>(null);
    useEffect(() => {
        const root = sizeGroupRef.current;
        if (!root) return;
        const onClick = (ev: MouseEvent) => {
            const target = (ev.target as Element).closest(".A-LMS") as HTMLElement | null;
            if (!target || !root.contains(target)) return;      // 只處理這一組
            if (target.tagName === "A") ev.preventDefault();    // 你現在是 <a>，避免跳轉
            // 先清掉同組 active / aria-pressed
            root.querySelectorAll<HTMLElement>(".A-LMS").forEach(btn => {
                btn.classList.remove("active");
                btn.setAttribute("aria-pressed", "false");
            });
            // 再把被點到的那顆設為 active
            target.classList.add("active");
            target.setAttribute("aria-pressed", "true");
        };
        root.addEventListener("click", onClick);
        return () => root.removeEventListener("click", onClick);
    }, []);
    return (<section className="header_section">
        <header className="header_Box bg-customize-op09">
            <div className="navsBox">
                <div className="container-customize4">
                    <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                        <NavBar lang={props.lang} />
                        <li>
                            <ul className="nav custom_nav py-0 justify-content-center my-1" ref={sizeGroupRef}>
                                <LangSwitchBtn site={props.site} />
                                {/* <SearchBar /> */}
                            </ul>
                        </li>
                    </ul>
                </div>
            </div>
        </header>
    </section>)
}
const NavBar = (props: { lang: Lang; }) => {
    const title =
        props.lang === 'zh-tw' ? {
            Home: "回首頁",
            NCHU: "中興大學",
            SiteMap: "網站導覽"
        } :
            props.lang === 'en' ? {
                Home: "Home",
                NCHU: "NCHU",
                SiteMap: "SiteMap"
            } : {}


    return (<li>
        <ul className="nav custom_nav py-0 justify-content-center my-1">
            <a accessKey="U" href="#U" className="accesskey_header U" title="上方導覽區(U)" tabIndex={0}>:::</a>
            <li className="nav-item">
                <LangLink className="nav-link" to="/" tabIndex={0} target="_self" title={title.Home}>{title.Home}</LangLink>
            </li>
            <li className="nav-item">
                <a className="nav-link" href="https://www.nchu.edu.tw/index1.php" tabIndex={0} target="_blank" rel="noopener noreferrer" title={title.NCHU}>{title.NCHU}</a>
            </li>
            <li className="nav-item">
                <LangNavLink to={`/${SITEMAP_SEGMENT}`} className="nav-link" tabIndex={0} target="_self" title={title.SiteMap}>{title.SiteMap}</LangNavLink>
            </li>
        </ul>
    </li>
    )
}
const SearchBar = () => {
    const doZoom = useCallback((px: number) => { document.documentElement.style.fontSize = `${px}px`; localStorage.setItem('font-zoom', String(px)); }, []);
    useEffect(() => { const saved = +localStorage.getItem('font-zoom')!; if (saved) doZoom(saved); }, [doZoom]);
    return (
        <li>
            <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-sm-inline-block d-none">
                <a className="search-button" id="top-sss" data-bs-toggle="dropdown" >
                    <i className="far fa-search"></i>
                    <span className="sr-only">Search</span>
                </a>
            </div>
            <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="top-sss">
                <input type="search" id="search-box" placeholder="Search..." />
                <button className="far fa-search" type="button"></button>
            </div>
        </li>
    )
}
const Menu_Section = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const menuRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = menuRef.current;
        if (!root) return;

        // ---------- 1) submenu 超出右緣 → 切換 show-left ----------
        const updateDir = (hostEl: HTMLElement) => {
            const submenu = hostEl.querySelector<HTMLElement>(".dropdown-menu");
            if (!submenu) return;
            // 先清掉再判斷（避免殘留）
            hostEl.classList.remove("show-left");
            const rect = submenu.getBoundingClientRect();
            const winW = window.innerWidth || document.documentElement.clientWidth;
            if (rect.right > winW) {
                hostEl.classList.add("show-left");
            }
        };

        const submenuEls = Array.from(root.querySelectorAll<HTMLElement>(".submenu"));
        const onMouseEnter = (e: Event) => {
            const el = e.currentTarget as HTMLElement;
            if (!el.contains(e.target as Node)) return; // 避免內層觸發
            requestAnimationFrame(() => updateDir(el));
        };
        const onKeyEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter") updateDir(e.currentTarget as HTMLElement);
        };
        submenuEls.forEach(el => {
            // el.addEventListener("mouseenter", onMouseEnter);
            el.addEventListener("mouseover", onMouseEnter);
            el.addEventListener("keydown", onKeyEnter);
        });

        // ---------- 2) Enter 可切換 Bootstrap Dropdown ----------
        const toggleKeyHandler = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const bs = (window as any).bootstrap;
            if (bs?.Dropdown) new bs.Dropdown(e.currentTarget).toggle();
        };
        const toggleEls = Array.from(root.querySelectorAll<HTMLElement>(".dropdown-toggle"));
        toggleEls.forEach(el => el.addEventListener("keydown", toggleKeyHandler));



        // ---------- 4) Header menu：互斥顯示（hover/點擊），點外面或點子項就收合 ----------
        // NOTE：這裡是修 1818「點了教師後一直卡住」的核心。
        // 原因：Bootstrap click 會留下 .show，但 hover(多半是 CSS) 不會互斥，導致多個 menu 疊在一起。

        // 只管「第一層」(navbar-nav > li.dropdown) 的互斥；子層 submenu 仍交給 Bootstrap。
        const getTopDropdownHosts = (): HTMLElement[] =>
            Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown"));

        const closeHost = (host: HTMLElement) => {
            // 關閉 host + 它底下所有 .show（包含子層 submenu）
            host.classList.remove("show");
            host.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
            host.querySelectorAll<HTMLElement>(".dropdown-toggle").forEach(t => t.setAttribute("aria-expanded", "false"));
        };

        const isHostOpen = (host: HTMLElement): boolean => {
            // 註解：Bootstrap 可能只開 menu / aria-expanded，不一定開到 host.show
            if (host.classList.contains("show")) return true;
            if (host.querySelector(".dropdown-menu.show")) return true;
            if (host.querySelector('[aria-expanded="true"]')) return true;
            return false;
        };

        const closeAllExcept = (keep?: HTMLElement) => {
            const hosts = getTopDropdownHosts();

            // 1) 關閉除了 keep 以外所有已開啟的 host
            hosts.forEach(h => {
                if (keep && h === keep) return;
                if (isHostOpen(h)) closeHost(h);
            });

            // 2) 保險：如果有「殘留的 dropdown-menu.show」不在任何 host.show 上，也一併清掉
            root.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => {
                if (keep && keep.contains(m)) return;
                m.classList.remove("show");
            });
        };

        let lastHoverHost: HTMLElement | null = null;
        const onPointerOver = (e: Event) => {
            // hover 到別的第一層 menu 時，收合目前被 click 打開的 .show
            const host = (e.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
            if (!host || !root.contains(host)) return;
            if (lastHoverHost === host) return;
            lastHoverHost = host;
            closeAllExcept(host);
        };

        const onFocusIn = (e: Event) => {
            // 鍵盤 tab 切換到別的第一層 menu 時，也要互斥收合（AA 友善）
            const host = (e.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
            if (!host || !root.contains(host)) return;
            closeAllExcept(host);
        };

        const onRootClick = (e: MouseEvent) => {
            const el = e.target as Element | null;
            if (!el) return;

            // A) 點第一層 toggle：先把其它已開啟的關掉（讓 Bootstrap 只留一個）
            const topToggle = el.closest(".navbar-nav > .nav-item.dropdown > .dropdown-toggle") as HTMLElement | null;
            if (topToggle && root.contains(topToggle)) {
                const host = topToggle.closest(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
                if (host) closeAllExcept(host);
                return;
            }

            // B) 點 dropdown-menu 裡的「葉子連結」：導頁後收合全部
            const insideMenu = el.closest(".dropdown-menu") as HTMLElement | null;
            const isToggle = !!el.closest(".dropdown-toggle");
            const isAnchor = !!el.closest("a");
            if (insideMenu && isAnchor && !isToggle) closeAllExcept();
        };

        const onDocPointerDown = (e: Event) => {
            // 點畫面其它地方：收合全部 menu
            if (!root.contains(e.target as Node)) closeAllExcept();
        };

        const onDocKeyDown = (e: KeyboardEvent) => {
            // Esc：收合全部 menu
            if (e.key === "Escape") closeAllExcept();
        };

        root.addEventListener("click", onRootClick);
        document.addEventListener("pointerdown", onDocPointerDown);
        document.addEventListener("keydown", onDocKeyDown);

        // ---------- cleanup ----------
        return () => {
            submenuEls.forEach(el => {
                el.removeEventListener("mouseenter", onMouseEnter);
                el.removeEventListener("keydown", onKeyEnter);
            });
            toggleEls.forEach(el => el.removeEventListener("keydown", toggleKeyHandler));

            root.removeEventListener("click", onRootClick);
            document.removeEventListener("pointerdown", onDocPointerDown);
            document.removeEventListener("keydown", onDocKeyDown);
        };
    }, []);
    return (
        <section className="menu_section">
            <div className="customMENU_Box bg-customize-op09">
                <div className="menuBox">
                    <div className="container-customize4">
                        <div className="navbar navbar-expand-xl navbar-dark px-0 py-0" ref={menuRef}>
                            <LogoComp />
                            <MobileBtn />
                            <MainMenu {...props} />
                            <PCBtn />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    )
}
const LogoComp = () => {
    return (
        <h1 className="logo">
            <LangLink className="navbar-brand my-0" to="/" tabIndex={0} title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    )
}
const MobileBtn = () => {
    return (<>
        <div className="mobile-box ml-auto me-2">
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block d-sm-none">
                    {/* <a href="javascript:void(0);" className="search-button" type="button" role="button" title="搜尋" id="mobile-sss" data-bs-toggle="dropdown" aria-expanded="false" tabIndex={0}>
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="mobile-sss">
                        <input type="search" id="mobile-search-box" placeholder="search here..." tabIndex={0} />
                        <button className="far fa-search" type="button" tabIndex={0}></button>
                    </div> */}
                </div>
            </div>
        </div>

        <a className="navbar-toggler collapsed" type="button" role="button" data-bs-toggle="collapse" data-bs-target="#navbar-content" tabIndex={0} aria-expanded="false">
            <div className="hamburger-toggle">
                <div className="hamburger">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        </a>
    </>);
}
const MainMenu = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {

    const menuItems = GetMenuData(props.lang, props.site)

    return (
        <div id="navbar-content" className="collapse navbar-collapse overflow-scroll-Y mt-xl-5 mt-0">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {menuItems.map((item, idx) => {
                    return (
                        <React.Fragment key={idx}>
                            {
                                item.SubItem?.length === 0 ?
                                    <SingleMenuItem menuItem={item} /> :
                                    <DropdownMenuItem menuItem={item} />
                            }
                            {/* <MegaMenuItem menuItem={item} /> */}
                        </React.Fragment>)
                })}
            </ul>
        </div>
    )
}
const PCBtn = () => {
    return (
        <div className="pc-box">
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1 d-inline-block">
                    {/* <a href="javascript:void(0);" className="search-button" type="button" role="button" title="搜尋" id="pc-sss" data-bs-toggle="dropdown" aria-expanded="false" tabIndex={0}>
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="pc-sss">
                        <input type="search" id="pc-search-box" placeholder="search here..." tabIndex={0} />
                        <button className="far fa-search" type="button" tabIndex={0}></button>
                    </div> */}
                </div>
            </div>
        </div>
    )
}



/** 1. 一般單選 */
const SingleMenuItem = (props: { menuItem: MenuItemData }) => {
    return (
        <li className="nav-item">
            <LangNavLink className="nav-link" aria-current="page" to={props.menuItem.Url} role="button" tabIndex={0} title={props.menuItem.SrcData} aria-label={props.menuItem.SrcData}>
                {/^https?:\/\//i.test(props.menuItem.Url || "") && (
					<i className="fad fa-link me-2"></i>
				)}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

/** 2. 多層下拉 */
const DropdownMenuItem = (props: { menuItem: MenuItemData; }) => {
    return (
        <li className="nav-item dropdown">
            <LangNavLink className="nav-link dropdown-toggle" to={props.menuItem.Url} role="button" tabIndex={0} data-bs-toggle="dropdown" data-bs-auto-close="outside" target={props.menuItem.URL_Open}>
                {props.menuItem.SrcData}
            </LangNavLink>
            {/* 第二層（原本的 <ul className="dropdown-menu">） */}
            <ul className="dropdown-menu">
                {renderDropdownItems(props.menuItem.SubItem, 0)}
            </ul>
        </li>
    );
};


/** 3. Mega 選項：明細動態渲染 */
const MegaMenuItem = (props: { menuItem: MenuItemData; }) => {
    return (
        <li className="nav-item dropdown dropdown-mega position-static">
            <LangNavLink className="nav-link dropdown-toggle" to={props.menuItem.Url} tabIndex={0} data-bs-toggle="dropdown" data-bs-auto-close="outside">
                {props.menuItem.SrcData}
            </LangNavLink>

            <div className="dropdown-menu">
                <div className="mega-content">
                    <div className="container-customize4">
                        <div className="row">
                            {props.menuItem.SubItem.map((col, colIndex) => (
                                <div key={colIndex} className="col-12 col-sm-4 col-md-3">
                                    {/* 每一欄的標題 */}
                                    <div className="mega-item-tilte">{col.SrcData}</div>

                                    {/* 每一欄底下的連結列表 */}
                                    <div className="list-group">
                                        {(col.SubItem ?? []).map((link, linkIndex) => (
                                            <LangNavLink key={linkIndex} className="list-group-item" to={link.Url || "#"} tabIndex={0}>
                                                {link.SrcData}
                                            </LangNavLink>
                                        ))}
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

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] => {
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
const renderDropdownItems = (items: MenuItemData[], parentDepth: number): JSX.Element[] => {
    return items.map((item, index) => {
        const hasChildren = (item.SubItem ?? []).length > 0;
        const key = `${parentDepth}-${index}`;
        const isExternal = /^https?:\/\//i.test(item.Url || "");

        if (!hasChildren) {
            // 純連結項目
            return (
                <li key={key}>
                    <LangNavLink className="dropdown-item" to={item.Url || "#"} role="button" tabIndex={0} target={item.URL_Open}>
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
                <LangNavLink to={item.Url || "#"} role="button" tabIndex={0} className="dropdown-item dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside" target={item.URL_Open}>
                    {item.SrcData}
                </LangNavLink>

                <ul className={submenuClassName}>
                    {renderDropdownItems(item.SubItem ?? [], parentDepth + 1)}
                </ul>
            </li>
        );
    });
};