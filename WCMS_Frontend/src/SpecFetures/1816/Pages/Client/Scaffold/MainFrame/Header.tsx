import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { A11yContent, type HeaderProps } from "@/SpecFetures/_default/Pages/Client/Scaffold/MainFrame/Header";
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
// import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";
import { SITEMAP_SEGMENT } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap";
import LogoImg from "@/SpecFetures/1816/Assets/Client/images/logo/LOGO_266x41.svg";
import { SearchData } from "../../Index/Section/SearchData";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LangSwitchBtn } from "@/Features/Pages/Client/Scaffold/MainFrame/LangSwitchBtn";
import clsx from "clsx";
import { useAnchorPreventDefaultClick } from "@/SysCore/Utils/UI_HookFunc/useAnchorPreventDefaultClick";
const Header = (props: HeaderProps) => {
    // 宣告變數：Site-Header root ref
    const headerRef = useRef<HTMLDivElement | null>(null);

    // 執行 function：掛載 prototype 行為（漢堡 active、遮罩、resize）
    useHeaderPrototypeBehavior(headerRef);

    return (
        <>
            <A11yContent />
            <div id="Site-Header" className="ALL_Header_DivBar main-header" ref={headerRef}>
                <section className="menu_section p-lg-0 p-2">
                    <div className="customMENU_Box bg-white pb-lg-2 pt-lg-2 px-lg-2 px-0 pt-0 align-items-lg-start align-items-center">
                        <div className="menuBox">
                            <div className={clsx("container-customize4", props.lang === 'en' ? "w-en" : "")}>
                                <div className="navbar navbar-expand-lg navbar-dark px-0 py-0">
                                    <LogoBlock />
                                    <MobileToggler />
                                    <NavbarContent {...props} />
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <div className="overlayer" aria-hidden="true" />
            </div>
            <SearchData {...props} />
            {/* <GoTopButton /> */}
        </>
    );
};

export default Header;

/* =========================
 * Hooks：prototype 行為
 * ========================= */

const useHeaderPrototypeBehavior = (headerRef: React.RefObject<HTMLDivElement>) => {
    useEffect(() => {
        // 宣告變數
        if (typeof window === "undefined") return;
        const header = headerRef.current;
        if (!header) return;

        const BREAKPOINT = 992; // lg 斷點

        // 執行 function：切換 active + body scroll lock
        const setOpen = (open: boolean) => {
            header.classList.toggle("active", open);
            document.body.style.overflow = open ? "hidden" : "auto";
        };

        // 執行 function：click delegate（toggler / overlay / nav-link）
        const onClick = (ev: MouseEvent) => {
            const el = ev.target as Element;

            // 1) 點到 .navbar-toggler → 只有在 mobile 才切換 active
            const toggler = el.closest(".navbar-toggler");
            if (toggler && header.contains(toggler)) {
                if (window.innerWidth >= BREAKPOINT) return;
                const open = !header.classList.contains("active");
                setOpen(open);
                return;
            }

            // 2) 點遮罩 → 關閉
            const overlay = el.closest(".overlayer");
            if (overlay && header.contains(overlay)) {
                setOpen(false);
                return;
            }

            // 3) mobile：點到「真的導頁的 nav-link」時關閉（避免 dropdown-toggle）
            if (window.innerWidth < BREAKPOINT) {
                const navLink = el.closest("#navbar-content .nav-link") as HTMLElement | null;
                if (navLink && header.contains(navLink)) {
                    const isDropdownToggle = navLink.getAttribute("data-bs-toggle") === "dropdown";
                    if (!isDropdownToggle) setOpen(false);
                }
            }
        };

        // 執行 function：視窗放大到桌機寬時，清掉 mobile 狀態
        const handleResize = () => {
            if (window.innerWidth >= BREAKPOINT) {
                setOpen(false);
            }
        };

        header.addEventListener("click", onClick);
        window.addEventListener("resize", handleResize);
        handleResize();

        return () => {
            header.removeEventListener("click", onClick);
            window.removeEventListener("resize", handleResize);
            document.body.style.overflow = "auto";
        };
    }, [headerRef]);
};

/* =========================
 * DOM blocks：對標 index.html
 * ========================= */

const LogoBlock = () => {
    return (
        <h1 className="logo">
            <LangLink className="navbar-brand mt-lg-3 mt-2" to="/" title="">
                <img src={LogoImg} alt=" LOGO" />
            </LangLink>
        </h1>
    );
};

const MobileToggler = () => {
  return (
    <button
      type="button"
      className="navbar-toggler collapsed"
      data-bs-toggle="collapse"
      data-bs-target="#navbar-content"
      aria-controls="navbar-content"
      aria-expanded="false"
      aria-label="開啟或關閉主選單"
      title="開啟或關閉主選單"
    >
      {/* AA：給讀屏用的文字（不影響畫面） */}
      <span className="visually-hidden">主選單</span>

      {/* 視覺 hamburger，不給讀屏重複念 */}
      <div className="hamburger-toggle" aria-hidden="true">
        <div className="hamburger">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </button>
  );
};

const NavbarContent = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
    // 宣告變數
    const menuRootRef = useRef<HTMLDivElement | null>(null);

    // 執行 function：navbar 固定高度變數（對標 prototype setMenuHeightVar）
    useMenuHeightVar();

    // 執行 function：捲動陰影（對標 prototype Nav-fixed-JS）
    useHeaderShadowOnScroll();

    // 執行 function：submenu 方向 + Enter toggle + hamburger 動畫
    useNavbarEnhance(menuRootRef);

    // 執行 function：關閉全部（dropdown + collapse + active）
    const collapseAll = useCollapseAll(menuRootRef);

    // return：對標 index.html 的 navbar-content 結構
    return (
        <div
            id="navbar-content"
            className="collapse navbar-collapse flex-wrap justify-content-end"
            ref={menuRootRef}
        >
            <ul className="navbar-nav mb-2 mb-lg-0 overflow-scroll-Y ps-2">
                <li><a accessKey="U" href="#U" className="accesskey_header U d-none d-lg-block" title="上方導覽區(U)" >:::</a></li>
                <MainMenu {...props} onCollapseAll={collapseAll} menuRootRef={menuRootRef} />
            </ul>

            {/* 對標 index.html：<div class="header_section ms-auto"> ... */}
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
 * behaviors（對標 prototype script）
 * ========================= */

const useMenuHeightVar = () => {
    useEffect(() => {
        // 宣告變數
        if (typeof window === "undefined") return;

        // 執行 function：計算 menu_section 高度寫入 CSS 變數
        const setMenuHeightVar = () => {
            const menuSection = document.querySelector<HTMLElement>(".navbar-nav");
            if (!menuSection) return;

            const height = menuSection.offsetHeight;
            document.documentElement.style.setProperty("--menu-section-height", `${height}px`);
        };

        window.addEventListener("load", setMenuHeightVar);
        window.addEventListener("resize", setMenuHeightVar);

        return () => {
            window.removeEventListener("load", setMenuHeightVar);
            window.removeEventListener("resize", setMenuHeightVar);
        };
    }, []);
};

const useHeaderShadowOnScroll = () => {
    useEffect(() => {
        // 宣告變數
        if (typeof window === "undefined") return;

        // 執行 function：scroll >= 180 加 shadow
        const onScroll = () => {
            const box = document.querySelector<HTMLElement>(".customMENU_Box");
            if (!box) return;

            const scrollTop = window.scrollY || document.documentElement.scrollTop || 0;
            box.classList.toggle("shadow", scrollTop >= 180);
        };

        window.addEventListener("scroll", onScroll, { passive: true });
        onScroll();

        return () => window.removeEventListener("scroll", onScroll);
    }, []);
};

const useNavbarEnhance = (menuRootRef: React.RefObject<HTMLDivElement>) => {
    useEffect(() => {
        // 宣告變數
        if (typeof window === "undefined") return;
        const root = menuRootRef.current;
        if (!root) return;

        // 1) submenu 超出右緣 → 切換 show-left
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

        submenuEls.forEach((el) => {
            el.addEventListener("mouseenter", onMouseEnter);
            el.addEventListener("keydown", onKeyEnter);
        });

        // 2) Enter 可切換 Bootstrap Dropdown
        const toggleKeyHandler = (e: KeyboardEvent) => {
            if (e.key !== "Enter") return;
            e.preventDefault();
            const bs = (window as any).bootstrap;
            if (bs?.Dropdown) new bs.Dropdown(e.currentTarget).toggle();
        };

        const toggleEls = root.querySelectorAll<HTMLElement>('.dropdown-toggle[data-bs-toggle="dropdown"]');

        toggleEls.forEach((el) => el.addEventListener("keydown", toggleKeyHandler));

        // 3) Hamburger 動畫（點 .navbar-toggler 切 .hamburger.active）
        const navbarToggler = root.closest("#Site-Header")?.querySelector<HTMLElement>(".navbar-toggler");
        const onBurgerClick = () => {
            navbarToggler?.querySelector<HTMLElement>(".hamburger")?.classList.toggle("active");
        };
        navbarToggler?.addEventListener("click", onBurgerClick);

        return () => {
            submenuEls.forEach((el) => {
                el.removeEventListener("mouseenter", onMouseEnter);
                el.removeEventListener("keydown", onKeyEnter);
            });
            toggleEls.forEach((el) => el.removeEventListener("keydown", toggleKeyHandler));
            navbarToggler?.removeEventListener("click", onBurgerClick);
        };
    }, [menuRootRef]);
};

const useCollapseAll = (menuRootRef: React.RefObject<HTMLDivElement>) => {
    // 關閉 bootstrap collapse（若 bootstrap 不存在就手動拔 class）
    const hideNavbarCollapse = useCallback(() => {
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
    const resetHamburger = useCallback(() => {
        const toggler = document.querySelector<HTMLElement>("#Site-Header .navbar-toggler");
        toggler?.classList.add("collapsed");
        toggler?.setAttribute("aria-expanded", "false");
        toggler?.querySelector<HTMLElement>(".hamburger")?.classList.remove("active");
    }, []);

    // 關閉 Site-Header 的 overlay 狀態（避免 body 被鎖住）
    const closeHeaderOverlay = useCallback(() => {
        const header = document.getElementById("Site-Header");
        header?.classList.remove("active");
        document.body.style.overflow = "auto";
    }, []);

    // 子項點擊後：全部收合
    const collapseAll = useCallback(() => {
        // 宣告變數
        if (typeof window === "undefined") return;
        const root = menuRootRef.current;
        if (!root) return;

        // 執行 function
        hideNavbarCollapse();
        resetHamburger();
        closeHeaderOverlay();
    }, [menuRootRef, hideNavbarCollapse, resetHamburger, closeHeaderOverlay]);

    return collapseAll;
};

/* =========================
 * Header small blocks：Lang / Size / Sitemap
 * ========================= */


const SiteMapLink = (props: { lang: Lang }) => {
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

const SizeChange = () => {
    // 宣告變數：group ref（只管 active 狀態）
    const sizeGroupRef = useRef<HTMLUListElement | null>(null);

    // 執行 function：套用字級（優先 #Customsize，沒有就退回 html）
    const doZoom = useCallback((px: number) => {
        const custom = document.getElementById("Customsize");
        if (custom) {
            custom.style.fontSize = `${px}%`;
        } else {
            document.documentElement.style.fontSize = `${px}%`;
        }
        localStorage.setItem("font-zoom", String(px));

        // 變更後更新 menu 高度變數（對標 prototype）
        const menuSection = document.querySelector<HTMLElement>(".menu_section");
        if (menuSection) {
            document.documentElement.style.setProperty("--menu-section-height", `${menuSection.offsetHeight}px`);
        }
    }, []);

    // 執行 function：初始化讀取
    useEffect(() => {
        const saved = Number(localStorage.getItem("font-zoom") ?? "");
        if (!Number.isNaN(saved) && saved > 0) doZoom(saved);
    }, [doZoom]);

    // 執行 function：點擊 active 切換（對標 prototype A-LMS JS）
    useEffect(() => {
        const root = sizeGroupRef.current;
        if (!root) return;

        const onClick = (ev: MouseEvent) => {
            const target = (ev.target as Element).closest(".A-LMS") as HTMLElement | null;
            if (!target || !root.contains(target)) return;
            if (target.tagName === "A") ev.preventDefault();

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
                            <a
                                className="A-LMS"
                                href="#"
                                onClick={() => doZoom(112.5)}
                                type="button"
                                role="button"
                                title="字型-大"
                                data-size="18"
                            >
                                <div className="LMS-text" style={{ fontSize: "100%" }}>
                                    A+
                                </div>
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
                                onClick={() => doZoom(100)}
                                type="button"
                                role="button"
                                title="字型-中"
                                data-size="16"
                            >
                                <div className="LMS-text" style={{ fontSize: "100%" }}>
                                    A
                                </div>
                            </a>
                        </div>
                    </div>
                </li>

                <li>
                    <div className="icons">
                        <div className="All_icon_box mx-1">
                            <a
                                className="A-LMS"
                                href="#"
                                onClick={() => doZoom(87.5)}
                                type="button"
                                role="button"
                                title="字型-小"
                                data-size="14"
                            >
                                <div className="LMS-text" style={{ fontSize: "100%" }}>
                                    A-
                                </div>
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

const MainMenu = (props: {
    lang: Lang;
    site: INormSite;
    style: IFETheme;
    onCollapseAll?: () => void;
    menuRootRef?: React.RefObject<HTMLElement>;
}) => {
    // 宣告變數
    const [openId, setOpenId] = useState<string | null>(null);
    const menuItems = useMemo(() => GetMenuData(props.lang, props.site), [props.lang, props.site]);

    // 執行 function：開合 mega
    const toggleOpen = useCallback((id: string) => {
        setOpenId((prev) => (prev === id ? null : id));
    }, []);

    // 執行 function：點 leaf 收合（含 mobile collapse）
    const onLeafClick = useCallback(() => {
        setOpenId(null);
        props.onCollapseAll?.();
    }, [props]);

    // 執行 function：點外面收合第一層（桌機/手機都適用）
    useEffect(() => {
        if (typeof window === "undefined") return;

        const root = props.menuRootRef?.current;
        if (!root) return;

        const onPointerDown = (e: PointerEvent) => {
            const target = e.target as Node;

            if (!root.contains(target)) {
                setOpenId(null);
                props.onCollapseAll?.();
                return;
            }

            if (!openId) return;

            const openLi = root.querySelector<HTMLElement>(`li[data-menu-id="${openId}"]`);
            if (!openLi) {
                setOpenId(null);
                return;
            }

            if (!openLi.contains(target)) setOpenId(null);
        };

        document.addEventListener("pointerdown", onPointerDown, true);
        return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [openId, props]);

    // return：對標 prototype 結構（mega / single）
    return (
        <>
            {menuItems.map((item) => {
                const hasChildren = (item.SubItem ?? []).length > 0;

                if (!hasChildren) {
                    return <SingleMenuItem key={item.Id} menuItem={item} onLeafClick={onLeafClick} />;
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
        </>
    );
};

const SingleMenuItem = (props: { menuItem: MenuItemData; onLeafClick: () => void }) => {
    return (
        <li className="nav-item">
            <LangNavLink
                className="nav-link"
                aria-current="page"
                to={props.menuItem.Url}
                role="button"
                
                title={props.menuItem.SrcData}
                aria-label={props.menuItem.SrcData}
                onClick={props.onLeafClick}
            >
                {props.menuItem.SrcData}
            </LangNavLink>
        </li>
    );
};

interface IMegaMenuItemProps {
    menuItem: MenuItemData;
    isOpen: boolean;
    onToggle: (id: string) => void;
    onLeafClick: () => void;
}

const MegaMenuItem = (props: IMegaMenuItemProps) => {
    const id = String(props.menuItem.Id);
    const liClass = props.isOpen
        ? "nav-item dropdown dropdown-mega position-static show"
        : "nav-item dropdown dropdown-mega position-static";
    const menuClass = props.isOpen ? "dropdown-menu show" : "dropdown-menu";

    return (
        <li className={liClass} data-menu-id={id}>
            <a
                className="nav-link dropdown-toggle"
                href="#"
                
                data-bs-toggle="dropdown"
                data-bs-auto-close="outside"
                aria-expanded={props.isOpen}
                onClick={(e) => {
                    e.preventDefault();
                    props.onToggle(id);
                }}
            >
                {props.menuItem.SrcData}
            </a>

            <div className={menuClass}>
                <div className="mega-content">
                    <div className="container-customize4">
                        <div className="row">
                            {props.menuItem.SubItem.map((col, colIndex) => (
                                <div key={colIndex} className="content-mb col-12 col-sm-4 col-md-4">
                                    <div className="mega-item-tilte">{col.SrcData}</div>

                                    <div className="list-group">
                                        {(col.SubItem ?? []).map((link, linkIndex) => {
                                            const subTar = link.URL_Open;
                                            return (
                                                <LangNavLink
                                                    key={linkIndex}
                                                    className="list-group-item"
                                                    to={link.Url || "#"}
                                                    
                                                    target={subTar}
                                                    onClick={props.onLeafClick}
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
    // 宣告變數
    if (!site) return [];
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];

    // return：build menu
    return buildMenuItems(roots, 0);
};
