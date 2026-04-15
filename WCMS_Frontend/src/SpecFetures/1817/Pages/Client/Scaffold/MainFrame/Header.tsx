/*Header模塊*/
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { A11yContent } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import LogoImg from '@/SpecFetures/1817/Assets/Client/images/logo/LOGO_475x120.svg'
import { useEffect, useRef } from "react";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";

type HeaderA11yText = {
    mainNavLabel: string;
    openNewWindowSuffix: string;
    hamburger: string;
    search: string;
    logoLink: string;
    logoAlt: string;
};

const HEADER_A11Y_TEXT: Partial<Record<Lang, HeaderA11yText>> = {
    "zh-tw": {
        mainNavLabel: "主選單",
        openNewWindowSuffix: "（另開新視窗）",
        hamburger: "開啟主選單",
        search: "搜尋",
        logoLink: "回首頁",
        logoAlt: "網站標誌",
    },
    en: {
        mainNavLabel: "Main menu",
        openNewWindowSuffix: " (opens in a new window)",
        hamburger: "Open main menu",
        search: "Search",
        logoLink: "Home",
        logoAlt: "Site logo",
    },
};

const getHeaderA11y = (lang?: Lang): HeaderA11yText => {
    const key = (lang ?? DefaultLang) as Lang;
    return HEADER_A11Y_TEXT[key] ?? HEADER_A11Y_TEXT[DefaultLang] ?? {
        mainNavLabel: "Main menu",
        openNewWindowSuffix: " (opens in a new window)",
        hamburger: "Open main menu",
        search: "Search",
        logoLink: "Home",
        logoAlt: "Site logo",
    };
};

const isBlankTarget = (t?: string) => String(t ?? "").toLowerCase() === "_blank";

const withNewWindowSuffix = (a11y: HeaderA11yText, text: string, target?: string) => {
    return isBlankTarget(target) ? `${text}${a11y.openNewWindowSuffix}` : text;
};

const getRelByTarget = (target?: string) => (isBlankTarget(target) ? "noopener noreferrer" : undefined);



const Header = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const headerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 宣告變數
        const header = headerRef.current;
        if (!header) return;

        // 執行 function：判斷是否手機寬度（Bootstrap lg 以下）
        const isMobileWidth = (): boolean =>
            window.matchMedia?.("(max-width: 991.98px)")?.matches ?? (window.innerWidth < 992);

        // 執行 function：收起 navbar collapse + hamburger 狀態（避免手機預設展開）
        const resetNavbarCollapse = () => {
            const collapse = header.querySelector<HTMLElement>("#navbar-content");
            collapse?.classList.remove("show");

            const toggler = header.querySelector<HTMLElement>(".navbar-toggler");
            toggler?.classList.add("collapsed");
            toggler?.setAttribute("aria-expanded", "false");
            toggler?.querySelector<HTMLElement>(".hamburger")?.classList.remove("active");
        };

        // 執行 function：控制 header overlay 開關
        const setOpen = (open: boolean) => {
            header.classList.toggle("active", open);
            document.body.style.overflow = open ? "hidden" : "auto";
            if (!open) resetNavbarCollapse();
        };

        // 初始化：避免進站時手機板就展開
        setOpen(false);

        // 執行 function：點擊事件（hamburger / overlay）
        const onClick = (ev: MouseEvent) => {
            const el = ev.target as Element;

            // 1) 點到 .navbar-toggler → 開/關
            const toggler = el.closest(".navbar-toggler");
            if (toggler && header.contains(toggler)) return;
            // 2) 點 overlay → 關閉
            const overlay = el.closest(".overlayer");
            if (overlay && header.contains(overlay)) setOpen(false);
        };

        // 執行 function：resize 進手機寬度時，清掉 dropdown/collapse 的殘留狀態
        const onResize = () => {
            if (!isMobileWidth()) return;
            setOpen(false);
        };

        header.addEventListener("click", onClick);
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        return () => {
            header.removeEventListener("click", onClick);
            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    }, []);

    return (
        <>
            <A11yContent />
            <div id="Site-Header" className="ALL_Header_DivBar main-header" ref={headerRef}>
                <Header_Section {...props} />
                <Menu_Section {...props} />
                <div className="overlayer" aria-hidden="true" />
            </div>
            <GoTopButton />
        </>
    );
};
export default Header;

const Header_Section = (props: { lang: Lang; site: INormSite }) => {
    const sizeGroupRef = useRef<HTMLUListElement | null>(null);

    useEffect(() => {
        // 宣告變數
        const root = sizeGroupRef.current;
        if (!root) return;

        // 執行 function：字級按鈕互斥
        const onClick = (ev: MouseEvent) => {
            const target = (ev.target as Element).closest(".A-LMS") as HTMLElement | null;
            if (!target || !root.contains(target)) return;

            if (target.tagName === "A") ev.preventDefault();

            root.querySelectorAll<HTMLElement>(".A-LMS").forEach(btn => {
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
            <header className="header_Box + bg-custom-Customize_color">
                <div className="navsBox">
                    <div className="container-customize0">
                        <ul className="nav custom_nav justify-content-xl-end justify-content-center" ref={sizeGroupRef}>
                            <NavBar lang={props.lang} />
                            <LangSwitchBtn site={props.site} />
                        </ul>
                    </div>
                </div>
            </header>
        </section>
    );
};

const NavBar = (props: { lang: Lang }) => {
    const title =
        props.lang === "zh-tw"
            ? { Home: "首頁", TNUA: "臺北藝術大學", FB: "FB粉絲團", SiteMap: "網站導覽" }
            : props.lang === "en"
                ? { Home: "Home", TNUA: "TNUA", FB: "Facebook", SiteMap: "SiteMap" }
                : ({} as any);

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center my-1">
                <a accessKey="U" href="#U" className="accesskey_header U" title="上方導覽區(U)" tabIndex={0}>
                    :::
                </a>
                <li className="nav-item">
                    <LangLink className="nav-link" to="/" tabIndex={0} title={title.Home}>
                        {title.Home}
                    </LangLink>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="https://w3.tnua.edu.tw/" tabIndex={0} target="_blank" title={title.TNUA}>
                        {title.TNUA}
                    </a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="https://www.facebook.com/TaiwanTraditionalMusic/" tabIndex={0} target="_blank" title={title.FB}>
                        {title.FB}
                    </a>
                </li>
                <li className="nav-item">
                    <LangLink className="nav-link" to={`/${SITEMAP_SEGMENT}`} tabIndex={0} target="_self" title={title.SiteMap}>
                        {title.SiteMap}
                    </LangLink>
                </li>
            </ul>
        </li>
    );
};

const Menu_Section = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const menuRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (typeof window === "undefined") return;

        // 宣告變數
        const root = menuRef.current;
        if (!root) return;

        const isMobileWidth = (): boolean =>
            window.matchMedia?.("(max-width: 991.98px)")?.matches ?? (window.innerWidth < 992);

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
            requestAnimationFrame(() => updateDir(el));
        };
        const onKeyEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter") updateDir(e.currentTarget as HTMLElement);
        };

        submenuEls.forEach(el => {
            el.addEventListener("mouseenter", onMouseEnter);
            el.addEventListener("keydown", onKeyEnter);
        });

        // ---------- 2) Enter 可切換（桌機） ----------
        const toggleKeyHandler = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            e.preventDefault();

            // 手機板 Enter 也走「手動 toggle」
            const mobile = isMobileWidth();
            if (mobile) {
                const toggle = e.currentTarget as HTMLElement;
                const host =
                    (toggle.closest("li.dropend.submenu") as HTMLElement | null) ||
                    (toggle.closest("li.nav-item.dropdown") as HTMLElement | null);
                if (host) toggleHostManual(host);
                return;
            }

            // 桌機：維持 bootstrap 行為
            const bs = (window as any).bootstrap;
            if (bs?.Dropdown) new bs.Dropdown(e.currentTarget).toggle();
        };

        const toggleEls = Array.from(root.querySelectorAll<HTMLElement>(".dropdown-toggle"));
        toggleEls.forEach(el => el.addEventListener("keydown", toggleKeyHandler));

        // ---------- 3) Hamburger 動畫 ----------
        const navbarToggler = root.querySelector<HTMLElement>(".navbar-toggler");
        const siteHeader = root.closest<HTMLElement>("#Site-Header");
        const collapse = root.querySelector<HTMLElement>("#navbar-content");

        navbarToggler?.removeAttribute("data-bs-toggle");
        navbarToggler?.removeAttribute("data-bs-target");
        navbarToggler?.removeAttribute("data-bs-parent");

        const setHamburgerOpen = (open: boolean) => {
            // 宣告變數
            const toggler = navbarToggler;
            if (!toggler) return;

            // 執行 function：切 hamburger 樣式
            toggler.querySelector<HTMLElement>(".hamburger")?.classList.toggle("active", open);
            toggler.classList.toggle("collapsed", !open);
            toggler.setAttribute("aria-expanded", open ? "true" : "false");

            // 執行 function：切 collapse 顯示
            collapse?.classList.toggle("show", open);

            // 執行 function：切 overlay
            siteHeader?.classList.toggle("active", open);
            document.body.style.overflow = open ? "hidden" : "auto";
        };

        const onBurgerClick = (e: Event) => {
            e.preventDefault();
            e.stopPropagation();

            // 宣告變數：以目前 collapse 是否展開為準
            const isOpen = collapse?.classList.contains("show") ?? false;

            // 執行 function：toggle
            setHamburgerOpen(!isOpen);
        };

        navbarToggler?.addEventListener("click", onBurgerClick);

        // ---------- 4) 關閉/開啟工具 ----------
        const closeAllDropdownStates = () => {
            // 關閉所有 show（包含 submenu）
            root.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
            root.querySelectorAll<HTMLElement>("li.show").forEach(li => li.classList.remove("show"));
            root.querySelectorAll<HTMLElement>(".dropdown-toggle[aria-expanded='true']").forEach(t => t.setAttribute("aria-expanded", "false"));
        };

        const closeSubtree = (host: HTMLElement) => {
            host.classList.remove("show");
            const directMenu = host.querySelector<HTMLElement>(":scope > .dropdown-menu");
            directMenu?.classList.remove("show");
            host.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
            host.querySelectorAll<HTMLElement>(".dropdown-toggle").forEach(t => t.setAttribute("aria-expanded", "false"));
        };

        const closeSiblings = (host: HTMLElement) => {
            const parentMenu = host.parentElement?.closest("ul.dropdown-menu");
            if (!parentMenu) return;
            Array.from(parentMenu.children).forEach(ch => {
                const li = ch as HTMLElement;
                if (li === host) return;
                if (li.matches("li.dropend.submenu")) closeSubtree(li);
            });
        };

        const toggleHostManual = (host: HTMLElement) => {
            // 宣告變數
            const directMenu = host.querySelector<HTMLElement>(":scope > .dropdown-menu");
            const toggle = host.querySelector<HTMLElement>(":scope > .dropdown-toggle");

            const isOpen = host.classList.contains("show") || !!directMenu?.classList.contains("show");
            if (isOpen) {
                // 執行 function：點同一個可以收回
                closeSubtree(host);
                return;
            }

            // 執行 function：互斥（同層）
            if (host.matches("li.nav-item.dropdown")) {
                // 第一層互斥
                Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown")).forEach(h => {
                    if (h !== host) closeSubtree(h);
                });
            } else {
                // submenu 同層互斥
                closeSiblings(host);
            }

            // 執行 function：開啟
            host.classList.add("show");
            directMenu?.classList.add("show");
            toggle?.setAttribute("aria-expanded", "true");
        };

        const closeMobileWholeMenu = () => {
            // 關掉 dropdown
            closeAllDropdownStates();

            // 收合 collapse
            const collapse = root.querySelector<HTMLElement>("#navbar-content");
            collapse?.classList.remove("show");

            // 重置 hamburger
            const toggler = root.querySelector<HTMLElement>(".navbar-toggler");
            toggler?.classList.add("collapsed");
            toggler?.setAttribute("aria-expanded", "false");
            toggler?.querySelector<HTMLElement>(".hamburger")?.classList.remove("active");

            // 關閉 overlay
            const siteHeader = root.closest<HTMLElement>("#Site-Header");
            siteHeader?.classList.remove("active");
            document.body.style.overflow = "auto";
        };

        // ---------- 5) 桌機 hover / focus 互斥 ----------
        let lastHoverHost: HTMLElement | null = null;

        const onPointerOver = (e: Event) => {
            if (isMobileWidth()) return;

            const host = (e.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
            if (!host || !root.contains(host)) return;
            if (lastHoverHost === host) return;
            lastHoverHost = host;

            Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown")).forEach(h => {
                if (h !== host) closeSubtree(h);
            });
        };

        const onFocusIn = (e: Event) => {
            if (isMobileWidth()) return;

            const host = (e.target as Element | null)?.closest?.(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
            if (!host || !root.contains(host)) return;

            Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown")).forEach(h => {
                if (h !== host) closeSubtree(h);
            });
        };

        // ---------- 6) click：手機板手動開關 + 點 leaf 自動收合 ----------
        const onRootClick = (e: MouseEvent) => {
            const el = e.target as Element | null;
            if (!el) return;

            const mobile = isMobileWidth();

            // A) 手機板：點 toggle（含 submenu）→ 可開可關
            if (mobile) {
                const toggle = el.closest(".dropdown-toggle") as HTMLElement | null;
                if (toggle && root.contains(toggle)) {
                    e.preventDefault();
                    e.stopPropagation();

                    const host =
                        (toggle.closest("li.dropend.submenu") as HTMLElement | null) ||
                        (toggle.closest("li.nav-item.dropdown") as HTMLElement | null);

                    if (host) toggleHostManual(host);
                    return;
                }

                // B) 手機板：點 leaf item → 收起整個 menu（含 overlay/collapse）
                const leaf = el.closest("a.dropdown-item") as HTMLElement | null;
                const isLeafToggle = !!el.closest("a.dropdown-item.dropdown-toggle");
                if (leaf && !isLeafToggle) {
                    closeMobileWholeMenu();
                    return;
                }

                // 手機板：點 nav-link（第一層沒有子項）也要收
                const topNav = el.closest("a.nav-link") as HTMLElement | null;
                const isTopToggle = !!el.closest("a.nav-link.dropdown-toggle");
                if (topNav && !isTopToggle) {
                    closeMobileWholeMenu();
                    return;
                }

                return;
            }

            // 桌機：點第一層 toggle → 互斥（讓 Bootstrap 只留一個）
            const topToggle = el.closest(".navbar-nav > .nav-item.dropdown > .dropdown-toggle") as HTMLElement | null;
            if (topToggle && root.contains(topToggle)) {
                const host = topToggle.closest(".navbar-nav > .nav-item.dropdown") as HTMLElement | null;
                if (host) {
                    Array.from(root.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown")).forEach(h => {
                        if (h !== host) closeSubtree(h);
                    });
                }
                return;
            }

            // 桌機：點 dropdown-menu 裡的葉子連結 → 收合全部
            const insideMenu = el.closest(".dropdown-menu") as HTMLElement | null;
            const isToggle = !!el.closest(".dropdown-toggle");
            const isAnchor = !!el.closest("a");
            if (insideMenu && isAnchor && !isToggle) closeAllDropdownStates();
        };

        const onDocPointerDown = (e: Event) => {
            // 點外面就關 dropdown（桌機/手機皆可）
            if (!root.contains(e.target as Node)) closeAllDropdownStates();
        };

        const onDocKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") closeAllDropdownStates();
        };

        const onResize = () => {
            if (!isMobileWidth()) return;
            closeAllDropdownStates();
        };

        root.addEventListener("pointerover", onPointerOver);
        root.addEventListener("focusin", onFocusIn);
        root.addEventListener("click", onRootClick);
        document.addEventListener("pointerdown", onDocPointerDown);
        document.addEventListener("keydown", onDocKeyDown);
        window.addEventListener("resize", onResize);
        window.addEventListener("orientationchange", onResize);

        return () => {
            submenuEls.forEach(el => {
                el.removeEventListener("mouseenter", onMouseEnter);
                el.removeEventListener("keydown", onKeyEnter);
            });
            toggleEls.forEach(el => el.removeEventListener("keydown", toggleKeyHandler));
            navbarToggler?.removeEventListener("click", onBurgerClick);

            root.removeEventListener("pointerover", onPointerOver);
            root.removeEventListener("focusin", onFocusIn);
            root.removeEventListener("click", onRootClick);

            document.removeEventListener("pointerdown", onDocPointerDown);
            document.removeEventListener("keydown", onDocKeyDown);

            window.removeEventListener("resize", onResize);
            window.removeEventListener("orientationchange", onResize);
        };
    }, []);

    return (
        <section className="menu_section">
            <div className="customMENU_Box bg-custom-Customize_color">
                <div className="menuBox">
                    <div className="container-customize0">
                        <div className="navbar navbar-expand-lg navbar-dark px-0 py-0" ref={menuRef} role="navigation" aria-label={getHeaderA11y(props.lang).mainNavLabel}>
                            <LogoComp lang={props.lang} />
                            <MobileBtn lang={props.lang} />
                            <MainMenu {...props} />
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
const LogoComp = (props: { lang: Lang }) => {
    // 宣告變數
    const a11y = getHeaderA11y(props.lang);

    // return
    return (
        <h1 className="logo">
            <LangLink
                className="navbar-brand"
                to="/"
                tabIndex={0}
                title={a11y.logoLink}
                aria-label={a11y.logoLink}
            >
                <img src={LogoImg} alt={a11y.logoAlt} />
            </LangLink>
        </h1>
    );
};

const MobileBtn = (props: { lang: Lang }) => {
    // 宣告變數
    const a11y = getHeaderA11y(props.lang);

    return (
        <>
            <div className="mobile-box ml-auto me-2">
                <div className="icons">
                    <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block">
                        <a
                            href="javascript:void(0);"
                            className="search-button"
                            type="button"
                            role="button"
                            title={a11y.search}
                            aria-label={a11y.search}
                            id="mobile-sss"
                            data-bs-toggle="dropdown"
                            aria-expanded="false"
                            tabIndex={0}
                        >
                            <i className="far fa-search" aria-hidden="true"></i>
                            <span className="sr-only">{a11y.search}</span>
                        </a>
                        <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="mobile-sss">
                            <input type="search" id="mobile-search-box" placeholder="search here..." tabIndex={0} />
                            <button className="far fa-search" type="button" tabIndex={0}></button>
                        </div>
                    </div>
                </div>
            </div>

            <a
                className="navbar-toggler collapsed"
                type="button"
                role="button"
                data-bs-toggle="collapse"
                data-bs-target="#navbar-content"
                tabIndex={0}
                aria-expanded="false"
                title={a11y.hamburger}
                aria-label={a11y.hamburger}
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

const MainMenu = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const menuItems = GetMenuData(props.lang, props.site);

    return (
        <div id="navbar-content" className="collapse navbar-collapse overflow-scroll-Y">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {menuItems.map((item, idx) => (
                    <div key={idx}>
                        {item.SubItem?.length === 0
                            ? <SingleMenuItem lang={props.lang} menuItem={item} />
                            : <DropdownMenuItem lang={props.lang} menuItem={item} />
                        }
                    </div>
                ))}
            </ul>
        </div>
    );
};

/** 1. 一般單選 */
const SingleMenuItem = (props: { lang: Lang; menuItem: MenuItemData }) => {
    // 宣告變數
    const a11y = getHeaderA11y(props.lang);
    const label = withNewWindowSuffix(a11y, props.menuItem.SrcData, props.menuItem.URL_Open);

    // return
    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                to={props.menuItem.Url}
                role="button"
                tabIndex={0}
                target={props.menuItem.URL_Open}
                rel={getRelByTarget(props.menuItem.URL_Open)}
                title={label}
                aria-label={label}
            >
                {/^https?:\/\//i.test(props.menuItem.Url || "") && (
					<i className="fad fa-link me-2"></i>
				)}
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};


/** 2. 多層下拉 */
const DropdownMenuItem = (props: { lang: Lang; menuItem: MenuItemData }) => {
    // 宣告變數
    const a11y = getHeaderA11y(props.lang);
    const label = withNewWindowSuffix(a11y, props.menuItem.SrcData, props.menuItem.URL_Open);

    // return
    return (
        <li className="nav-item dropdown">
            <LangNavLink
                className="nav-link dropdown-toggle"
                to={props.menuItem.Url || "#"}
                role="button"
                tabIndex={0}
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                target={props.menuItem.URL_Open}
                rel={getRelByTarget(props.menuItem.URL_Open)}
                aria-haspopup="menu"
                aria-expanded="false"
                title={label}
                aria-label={label}
            >
                {props.menuItem.SrcData}
            </LangNavLink>

            <ul className="dropdown-menu">
                {renderDropdownItems(props.menuItem.SubItem, 0, props.lang)}
            </ul>
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
 */
const renderDropdownItems = (items: MenuItemData[], parentDepth: number, lang: Lang): JSX.Element[] => {
    // 宣告變數
    const a11y = getHeaderA11y(lang);

    // return
    return items.map((item, index) => {
        const hasChildren = (item.SubItem ?? []).length > 0;
        const key = `${parentDepth}-${index}`;
        const label = withNewWindowSuffix(a11y, item.SrcData, item.URL_Open);
        const isExternal = /^https?:\/\//i.test(item.Url || "");

        if (!hasChildren) {
            return (
                <li key={key}>
                    <LangNavLink
                        className="dropdown-item"
                        to={item.Url || "#"}
                        role="button"
                        tabIndex={0}
                        target={item.URL_Open}
                        rel={getRelByTarget(item.URL_Open)}
                        title={label}
                        aria-label={label}
                    >
                        {isExternal && <i className="fad fa-link me-2"></i>}
                        {item.SrcData}
                    </LangNavLink>
                </li>
            );
        }

        const submenuClassName = parentDepth === 0 ? "dropdown-menu" : "dropdown-menu dropdown-submenu";

        return (
            <li key={key} className="dropend submenu">
                <LangNavLink
                    to={item.Url || "#"}
                    role="button"
                    tabIndex={0}
                    className="dropdown-item dropdown-toggle"
                    data-bs-toggle="dropdown"
                    data-bs-auto-close="outside"
                    target={item.URL_Open}
                    rel={getRelByTarget(item.URL_Open)}
                    aria-haspopup="menu"
                    aria-expanded="false"
                    title={label}
                    aria-label={label}
                >
                    {item.SrcData}
                </LangNavLink>

                <ul className={submenuClassName}>
                    {renderDropdownItems(item.SubItem ?? [], parentDepth + 1, lang)}
                </ul>
            </li>
        );
    });
};
