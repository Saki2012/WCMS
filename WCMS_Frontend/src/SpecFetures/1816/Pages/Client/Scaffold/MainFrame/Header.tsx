import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { A11yContent, type HeaderProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import LogoImg from '@/SpecFetures/1816/Assets/Client/images/logo/LOGO_525x60.svg'
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap";

const Header = (props: HeaderProps) => {
    const headerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const header = headerRef.current;
        if (!header) return;

        const BREAKPOINT = 992; // lg 斷點

        const setOpen = (open: boolean) => {
            header.classList.toggle("active", open);
            document.body.style.overflow = open ? "hidden" : "auto";
        };

        const onClick = (ev: MouseEvent) => {
            const el = ev.target as Element;

            // 1) 點到 .navbar-toggler → 只有在「小於 lg」才切換 active
            const toggler = el.closest(".navbar-toggler");
            if (toggler && header.contains(toggler)) {
                if (window.innerWidth >= BREAKPOINT) {
                    // 桌機寬度交給 Bootstrap 自己處理，不再用 active 控制
                    return;
                }
                const open = !header.classList.contains("active");
                setOpen(open);
                return;
            }

            // 2) 點遮罩 → 關閉（這個只會在 mobile 寬度時有用）
            const overlay = el.closest(".overlayer");
            if (overlay && header.contains(overlay)) {
                setOpen(false);
                return;
            }

            // 3) 在 mobile 版，點到「真的導頁的 nav-link」時，把 header.active 關掉
            if (window.innerWidth < BREAKPOINT) {
                const navLink = el.closest("#navbar-content .nav-link") as HTMLElement | null;
                if (navLink && header.contains(navLink)) {
                    // 避免點到 dropdown-toggle（只是展開 dropdown，不是要換頁）
                    const isDropdownToggle = navLink.getAttribute("data-bs-toggle") === "dropdown";
                    if (!isDropdownToggle) {
                        setOpen(false);
                    }
                }
            }
        };

        // ✅ 視窗放大到桌機寬時，強制清除 mobile 狀態
        const handleResize = () => {
            if (window.innerWidth >= BREAKPOINT) {
                setOpen(false); // 清掉 header.active + 還原 body scroll
            }
        };

        header.addEventListener("click", onClick);
        window.addEventListener("resize", handleResize);
        handleResize(); // 初始化跑一次

        return () => {
            header.removeEventListener("click", onClick);
            window.removeEventListener("resize", handleResize);
            document.body.style.overflow = "auto";
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
}
export default Header

const Header_Section = (props: HeaderProps) => {
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
        <header className="header_Box bg-white">
            <div className="navsBox">
                <div className="container-customize2">
                    <ul className="nav custom_nav justify-content-xl-end justify-content-center">
                        <NavBar lang={props.lang} />
                        <li>
                            <ul className="nav custom_nav py-0 justify-content-center my-1" ref={sizeGroupRef}>
                                <LangSwitchBtn site={props.site} />
                                <SizeChange />
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
            Home: "圖書館首頁",
            TNUA: "臺北藝術大學",
            SiteMap: "網站導覽"
        } :
            props.lang === 'en' ? {
                Home: "Home",
                TNUA: "TNUA",
                SiteMap: "SiteMap"
            } : {}

    return (
        <li>
            <ul className="nav custom_nav py-0 justify-content-center my-1">
                <a accessKey="U" href="#U" className="accesskey_header U" title="上方導覽區(U)" tabIndex={0}>:::</a>
                <li className="nav-item">
                    <LangLink className="nav-link" to="/" tabIndex={0} target="_self" title={title.Home}>{title.Home}</LangLink>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="https://w3.tnua.edu.tw/" tabIndex={0} target="_blank" title={title.TNUA}>{title.TNUA}</a>
                </li>
                <li className="nav-item">
                    <LangLink className="nav-link" to={`/${SITEMAP_SEGMENT}`} tabIndex={0} target="_self" title={title.SiteMap}>{title.SiteMap}</LangLink>
                </li>
            </ul>
        </li>
    )
}

const SizeChange = () => {
    const doZoom = useCallback((px: number) => { document.documentElement.style.fontSize = `${px}px`; localStorage.setItem('font-zoom', String(px)); }, []);
    useEffect(() => { const saved = +localStorage.getItem('font-zoom')!; if (saved) doZoom(saved); }, [doZoom]);
    return (<>
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
                    <a className="A-LMS" onClick={() => { doZoom(20) }} type="button" role="button" title="字型-大" tabIndex={0} data-size="20">
                        <div className="LMS-text">大</div>
                    </a>
                </div>
            </div>
        </li>
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-1">
                    <a className="A-LMS" onClick={() => { doZoom(18) }} type="button" role="button" title="字型-中" tabIndex={0} data-size="18">
                        <div className="LMS-text">中</div>
                    </a>
                </div>
            </div>
        </li>
        <li>
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-2 mx-0">
                    <a className="A-LMS active" onClick={() => { doZoom(16) }} type="button" role="button" title="字型-小" tabIndex={0} data-size="16">
                        <div className="LMS-text">小</div>
                    </a>
                </div>
            </div>
        </li>
    </>)
}
const Menu_Section = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {

    const menuRef = useRef<HTMLDivElement | null>(null);
    // 關閉 bootstrap collapse（若 bootstrap 不存在就手動拔 class）
    const hideNavbarCollapse = useCallback((root: HTMLElement) => {
        const el = document.getElementById("navbar-content");
        if (!el) return;
        const bs = (window as any).bootstrap;
        if (bs?.Collapse) {
            bs.Collapse.getOrCreateInstance(el, { toggle: false }).hide();
            return;
        }
        el.classList.remove("show");
    }, []);
    // 重設漢堡按鈕狀態（aria + hamburger active）
    const resetHamburger = useCallback((root: HTMLElement) => {
        const toggler = root.querySelector<HTMLElement>(".navbar-toggler");
        toggler?.classList.add("collapsed");
        toggler?.setAttribute("aria-expanded", "false");
        toggler?.querySelector<HTMLElement>(".hamburger")?.classList.remove("active");
    }, []);
    // 關閉 Site-Header 的 overlay 狀態（避免 body 被鎖住）
    const closeHeaderOverlay = useCallback((root: HTMLElement) => {
        const header = root.closest("#Site-Header") as HTMLElement | null;
        header?.classList.remove("active");
        document.body.style.overflow = "auto";
    }, []);
    // 子項點擊後：全部收合
    const collapseAll = useCallback(() => {
        if (typeof window === "undefined") return;
        const root = menuRef.current;
        if (!root) return;

        hideNavbarCollapse(root);
        resetHamburger(root);
        closeHeaderOverlay(root);
    }, [hideNavbarCollapse, resetHamburger, closeHeaderOverlay]);


    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = menuRef.current;
        if (!root) return;
        // ---------- 1) submenu 超出右緣 → 切換 show-left ----------
        const updateDir = (hostEl: HTMLElement) => {
            const submenu = hostEl.querySelector<HTMLElement>(".dropdown-menu");
            if (!submenu) return;
            const rect = submenu.getBoundingClientRect();
            const winW = window.innerWidth || document.documentElement.clientWidth;
            hostEl.classList.toggle("show-left", rect.right > winW);
        };
        const submenuEls = Array.from(root.querySelectorAll<HTMLElement>(".submenu"));
        const onMouseEnter = (e: Event) => updateDir(e.currentTarget as HTMLElement);
        const onKeyEnter = (e: KeyboardEvent) => {
            if (e.key === "Enter") updateDir(e.currentTarget as HTMLElement);
        };
        submenuEls.forEach(el => {
            el.addEventListener("mouseenter", onMouseEnter);
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
        // ---------- 3) Hamburger 動畫（點 .navbar-toggler） ----------
        const navbarToggler = root.querySelector<HTMLElement>(".navbar-toggler");
        const onBurgerClick = (e: Event) => {
            const btn = e.currentTarget as HTMLElement;
            // 找到裡面的 .hamburger，切換 active（比原本 e.target.children[0] 安全）
            btn.querySelector<HTMLElement>(".hamburger")?.classList.toggle("active");
        };
        navbarToggler?.addEventListener("click", onBurgerClick);


        // ---------- cleanup ----------
        return () => { };
    }, []);
    return (
        <section className="menu_section">
            <div className="customMENU_Box bg-white">
                <div className="menuBox">
                    <div className="container-customize2">
                        <div className="navbar navbar-expand-lg navbar-dark px-0 py-0" ref={menuRef}>
                            <LogoComp />
                            <MobileBtn />
                            <MainMenu {...props} onCollapseAll={collapseAll} menuRootRef={menuRef} />
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
            <LangLink className="navbar-brand" to="/" tabIndex={0} title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    )
}
const MobileBtn = () => {
    return (<>
        <div className="mobile-box">
            <div className="icons">
                <div className="All_icon_box mx-xl-2 mx-lg-2 mx-md-2 mx-sm-1 mx-0 d-inline-block">
                    <a className="search-button" type="button" role="button" title="搜尋" id="mobile-sss" data-bs-toggle="dropdown" aria-expanded="false" tabIndex={0}>
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="mobile-sss">
                        <input type="search" id="mobile-search-box" placeholder="search here..." tabIndex={0} />
                        <button className="far fa-search" type="button" tabIndex={0}></button>
                    </div>
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
const MainMenu = (props: { lang: Lang; site: INormSite; style: IFETheme; onCollapseAll?: () => void; menuRootRef?: React.RefObject<HTMLElement>; }) => {
    const [openId, setOpenId] = useState<string | null>(null);
    const menuItems = useMemo(() => { return GetMenuData(props.lang, props.site); }, [props.lang, props.site]);
    const toggleOpen = useCallback((id: string) => { setOpenId(prev => (prev === id ? null : id)); }, []);
    const onLeafClick = useCallback(() => { setOpenId(null); props.onCollapseAll?.(); }, [props]);
    // 點外面自動收合第一層（桌機/手機都適用）
    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = props.menuRootRef?.current;
        if (!root) return;

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node;

            // 1) 點 navbar 外：收合全部（含手機漢堡）
            if (!root.contains(target)) {
                setOpenId(null);
                props.onCollapseAll?.();
                return;
            }

            // 2) 點 navbar 內，但不在「目前展開的那個 dropdown 區塊」：只收合 dropdown
            if (!openId) return;

            const openLi = root.querySelector<HTMLElement>(`li[data-menu-id="${openId}"]`);
            if (!openLi) {
                setOpenId(null);
                return;
            }

            if (!openLi.contains(target)) {
                setOpenId(null);
            }
        };

        // capture=true：避免被其他 click handler 擋掉
        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [openId, props]);
    return (
        <div id="navbar-content" className="collapse navbar-collapse overflow-scroll-Y">
            <ul className="navbar-nav ms-auto mb-2 mb-lg-0">
                {menuItems.map(item => {
                    const hasChildren = (item.SubItem ?? []).length > 0;

                    if (!hasChildren) {
                        return <SingleMenuItem key={item.Id} menuItem={item} />;
                    }

                    return (
                        <MegaMenuItem
                            key={item.Id}
                            menuItem={item}
                            isOpen={openId === String(item.Id)}
                            onToggle={toggleOpen}
                            onLeafClick={onLeafClick}
                        />
                    );
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
                    <a className="search-button" type="button" role="button" title="搜尋" id="pc-sss" data-bs-toggle="dropdown" aria-expanded="false" tabIndex={0}>
                        <i className="far fa-search" aria-hidden="true"></i>
                        <span className="sr-only">搜尋</span>
                    </a>
                    <div className="searchdropdown dropdown-menu search-input-dropdown" aria-labelledby="pc-sss">
                        <input type="search" id="pc-search-box" placeholder="search here..." tabIndex={0} />
                        <button className="far fa-search" type="button" tabIndex={0}></button>
                    </div>
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
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};
/** 2. 多層下拉 */
const DropdownMenuItem = (props: { menuItem: MenuItemData; }) => {
    return (
        <li className="nav-item dropdown">
            <LangNavLink className="nav-link dropdown-toggle" to={props.menuItem.Url} role="button" tabIndex={0} data-bs-toggle="dropdown" data-bs-auto-close="outside">
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
interface IMegaMenuItemProps {
    menuItem: MenuItemData;
    isOpen: boolean;
    onToggle: (id: string) => void;
    onLeafClick: () => void;
}
const MegaMenuItem = (props: IMegaMenuItemProps) => {
    const id = String(props.menuItem.Id);
    const menuDomId = `mega-${id}`;
    const liClass = props.isOpen
        ? "nav-item dropdown dropdown-mega position-static show"
        : "nav-item dropdown dropdown-mega position-static";
    const menuClass = props.isOpen ? "dropdown-menu show" : "dropdown-menu";

    return (
        <li className={liClass} data-menu-id={id}>
            <button
                type="button"
                className="nav-link dropdown-toggle"
                aria-expanded={props.isOpen}
                aria-controls={menuDomId}
                onClick={() => props.onToggle(id)}
            >
                {props.menuItem.SrcData}
            </button>

            <div id={menuDomId} className={menuClass}>
                <div className="mega-content">
                    <div className="container-customize2">
                        <div className="row">
                            {props.menuItem.SubItem.map((col, colIndex) => (
                                <div key={colIndex} className="col-12 col-sm-4 col-md-3">
                                    <div className="mega-item-tilte">{col.SrcData}</div>

                                    <div className="list-group">
                                        {(col.SubItem ?? []).map((link, linkIndex) => {
                                            const subTar = link.URL_Open;
                                            return (
                                                <LangNavLink key={linkIndex} className="list-group-item" to={link.Url || "#"}
                                                    tabIndex={0} target={subTar} onClick={props.onLeafClick} // ✅ 點子項後自動收合
                                                >
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

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] => {
    if (!site) return [];
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

        if (!hasChildren) {
            // 純連結項目
            return (
                <li key={key}>
                    <LangNavLink className="dropdown-item" to={item.Url || "#"} role="button" tabIndex={0}>
                        {item.SrcData}
                    </LangNavLink>
                </li>
            );
        }
        // 有子項目 -> dropend submenu 結構
        const submenuClassName = parentDepth === 0 ? "dropdown-menu" : "dropdown-menu dropdown-submenu";
        return (
            <li key={key} className="dropend submenu">
                <LangNavLink to={item.Url || "#"} role="button" tabIndex={0} className="dropdown-item dropdown-toggle" data-bs-toggle="dropdown" data-bs-auto-close="outside">
                    {item.SrcData}
                </LangNavLink>

                <ul className={submenuClassName}>
                    {renderDropdownItems(item.SubItem ?? [], parentDepth + 1)}
                </ul>
            </li>
        );
    });
};