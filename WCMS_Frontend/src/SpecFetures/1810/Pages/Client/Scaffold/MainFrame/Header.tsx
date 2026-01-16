
/*Header模塊*/
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { useEffect, useRef } from 'react'
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { GoTopButton } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTopButton";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import MenuListComp from "@/SysCore/Components/MenuList/MenuList_Comp";
import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import logImg from "@/SpecFetures/1810/Assets/Client/images/logo/logo_450x80.svg";
import subLogImg from "@/SpecFetures/1810/Assets/Client/images/logo/logo_M320_191x60.svg";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { SpecLangSwitchBtn } from "./SpecLangSwitchBtn";


export const Header = ({ lang, site, style }: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const data = { Title: "國立臺灣藝術大學_研究發展處 LOGO", SrcImg: logImg, SubSrcImg: subLogImg }
    const headerRef = useRef<HTMLElement>(null);
    useHeaderBehaviorRef(headerRef);
    return (
        <>
            <noscript>
                <div style={{ color: 'red' }}>{"您的瀏覽器不支援 JavaScript，請開啟 Javascript 功能。"}</div>
            </noscript>
            <a href="#content" id="gotocenter" title="跳到頁面主要內容區" tabIndex={1} className="sr-only sr-only-focusable">跳到頁面主要內容區</a>
            <div id="site-header" className="LL_Header_DivBar main-header w-100">
                <section className="header_section">
                    <header className="header_Box" ref={headerRef}>
                        <div className="container-fluid-customize h-100 mr-0 pr-0">
                            <div className="HeaderDivBox">
                                <div className="leftBox">
                                    <div className="logo">
                                        <h1>
                                            <LangNavLink className="P_logo" to="/" title={data.Title} tabIndex={1}>
                                                <img src={data.SrcImg} alt={data.Title} />
                                            </LangNavLink>
                                            <LangNavLink className="M320_logo" to="/" title={data.Title} tabIndex={1}>
                                                <img src={data.SubSrcImg} alt={data.Title} />
                                            </LangNavLink>
                                        </h1>
                                    </div>
                                </div>
                                <MainMenu lang={lang} site={site} style={style}></MainMenu>
                                <div className="overlayer"></div>
                                <div className="rightBox">
                                    <button className="main bg-custom-s5" type="button">
                                        <div><i className="fa customize-bars" aria-hidden="true"></i></div>
                                        <span>MENU</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </header>
                </section>
            </div>
            <GoTopButton />
        </>
    );
}

export default Header

declare global {
    interface Window {
        google: any;
        googleTranslateElementInit: () => void;
    }
}

const GetMenuData = (lang: Lang, site: INormSite): MenuItemData[] => {
    const roots = site.treeByLang?.[lang] ?? [];
    if (!roots) return [];
    return buildMenuItems(roots, 0);
};

const MainMenu = (prop: { lang: Lang; site: INormSite; style: IFETheme }) => {
    const translateRef = useRef<HTMLDivElement>(null);
    const navsRef = useRef<HTMLDivElement>(null);
    const menuItems = GetMenuData(prop.lang, prop.site)
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const scriptId = 'google-translate-script';
        const exist = document.getElementById(scriptId);
        if (exist) return;
        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        script.async = true;
        document.body.appendChild(script);
        window.googleTranslateElementInit = () => {
            if (translateRef.current) {
                new window.google.translate.TranslateElement({
                    pageLanguage: prop.lang,
                }, translateRef.current);
            }
        };
    }, [prop.lang]);

    const menuRef = useRef<HTMLUListElement>(null);
    useLegacyMenuDOM(menuRef);

    return (
        <div className="menulayer">
            <button type="button" className="closemain" tabIndex={1}>
                <div><i className="fa customize-close" aria-hidden="true"></i></div>
                <span>CLOSE</span>
            </button>
            {/* // contentmenu // */}
            <div className="contentmenu" >
                <div className="google_box" ref={translateRef}>
                    <div className="container-custom">
                        <div id="google_translate_element" tabIndex={1}></div>
                    </div>
                </div>
                {/* // topBox上方選單 // */}
                <div className="topBox">
                    <div className="navsBox" ref={navsRef}>

                        <ul className={clsx("nav", "Customize_Nav")}>
                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to="/" target="_self" title="首頁" onClick={() => closeMenu()}>首頁</LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to="https://www.ntua.edu.tw/" target="_blank" title="臺藝大校首頁" onClick={() => closeMenu()}>臺藝校首頁</LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <LangLink className="nav-link" to="Sitemap" target="_self" title="網站導覽" onClick={() => closeMenu()}>網站導覽</LangLink>
                            </li>

                            <li className={clsx("nav-item")}>
                                <SpecLangSwitchBtn site={prop.site} />
                            </li>
                        </ul>




                    </div>
                </div>
                {/* // topBox上方選單 end // */}
                <div className="SearchBar">
                    <div className="search_DivBox">
                        <input className="search_input" type="text" placeholder="Search" id="search-box" onKeyUp={() => { "Search(event)" }} tabIndex={1} title="Search" />
                    </div>
                </div>
                {/* // menuBox // */}
                <nav className="menuBox">
                    <ul id="menu" ref={menuRef}>
                        <MenuListComp items={menuItems} Style={prop.style.MainMenu} />
                    </ul>
                </nav>
                {/* // down-social // */}
                <div className="down-social">
                    <a href="#" onClick={(e) => { e.preventDefault(); }} className="Facebook" title="Facebook(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                        <i className="fa Customize-facebook" aria-hidden="true"></i><span className="sr-only">Facebook</span>
                    </a>

                    <a href="#" onClick={(e) => { e.preventDefault(); }} className="Instagram" title="Instagram(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                        <i className="fa Customize-instagram" aria-hidden="true"></i><span className="sr-only">Instagram</span>
                    </a>

                    <a href="#" onClick={(e) => { e.preventDefault(); }} className="LINE" title="LINE(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                        <i className="fa Customize-line" aria-hidden="true"></i><span className="sr-only">LINE</span>
                    </a>
                </div>
            </div>
        </div>
    );
};


/** 這邊雖然是模擬js，但應該可以再看如何轉換成原本吃js的動作，來移除該功能 */
export const useLegacyMenuDOM = (menuRef: React.RefObject<HTMLUListElement>) => {

    useEffect(() => {
        if (typeof window === "undefined") return; // SSR guard
        const root = menuRef.current;
        if (!root) return;

        const getIcon = (li: HTMLElement) => li.querySelector(":scope > a i");
        const setArrow = (li: HTMLElement, open: boolean) => {
            const icon = getIcon(li);
            if (!icon) return;
            icon.classList.toggle("fa-angle-right", !open);
            icon.classList.toggle("fa-angle-down", open);
        };

        const closeBranch = (li: HTMLElement) => {
            const childUl = li.querySelector(":scope > ul") as HTMLElement | null;

            if (childUl) childUl.classList.remove("in");
            li.classList.remove("active");
            setArrow(li, false);
            // 也把後代全部收掉（避免留下展開殘影）
            childUl?.querySelectorAll("li").forEach(n => {
                const h = n as HTMLElement;
                h.classList.remove("active");
                const sub = h.querySelector(":scope > ul") as HTMLElement | null;
                if (sub) sub.classList.remove("in");
                setArrow(h, false);
            });
        };

        const closeAllMenu = (root: HTMLElement) => {
            root.querySelectorAll(":scope li").forEach(node => {
                closeBranch(node as HTMLElement);
            });
        };

        const onClick = (e: Event) => {
            const target = e.target as Element;
            const link = target.closest("a");

            if (!link || !root.contains(link)) return;

            const li = link.closest("li") as HTMLElement | null;
            if (!li) return;

            const childUl = li.querySelector(":scope > ul") as HTMLElement | null;


            // 沒子層 = 正常導頁並關閉menu；若要只設 active 可在這裡加 li.classList.add("active")
            if (!childUl) return closeMenu();


            // 有子層：阻止導頁，改為展開/收合
            e.preventDefault();

            const isOpen = childUl.classList.contains("in");

            // 只關閉「同層」兄弟的直屬子層與箭頭
            const parentUl = li.parentElement as HTMLElement | null; // li 的父層 ul
            const siblings = parentUl ? Array.from(parentUl.children) : [];
            siblings.forEach(node => {
                const sib = node as HTMLElement;
                if (sib !== li) closeBranch(sib);
            });

            if (isOpen) {
                // ✅ 目前已展開 → 縮回
                closeBranch(li);
            } else {
                // ✅ 目前收合 → 展開
                childUl.classList.add("in");
                li.classList.add("active");
                setArrow(li, true);
            }
        };
        root.addEventListener("click", onClick);

        // 監聽 header_Box 的 active class
        const headerBox = document.querySelector(".header_Box");
        let observer: MutationObserver | null = null;
        if (headerBox) {
            observer = new MutationObserver(() => {
                if (headerBox.classList.contains("active")) {
                    closeAllMenu(root); // header_Box 再次 active → 收掉全部展開的 menu
                }
            });
            observer.observe(headerBox, { attributes: true, attributeFilter: ["class"] });
        }

        return () => {
            root.removeEventListener("click", onClick);
            if (observer) observer.disconnect();
        }
    }, [menuRef]);
}

const closeMenu = () => {
    const headerBox = document.querySelector(".header_Box");
    if (headerBox) {
        document.body.style.overflow = "auto";
        headerBox.classList.remove("active");
    }
};

function useHeaderBehaviorRef(headerRef: React.RefObject<HTMLElement | null>) {
    useEffect(() => {
        if (typeof window === 'undefined') return;
        const headerEl = headerRef.current;
        if (!headerEl) return;

        const toggleActive = () => {
            if (!headerEl.classList.contains('active')) {
                headerEl.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                headerEl.classList.remove('active');
                document.body.style.overflow = 'auto';
            }
        };

        const btnMain = headerEl.querySelector('button.main');
        const btnClose = headerEl.querySelector('button.closemain');
        const overlay = headerEl.querySelector('div.overlayer');

        btnMain?.addEventListener('click', toggleActive);
        btnClose?.addEventListener('click', toggleActive);
        overlay?.addEventListener('click', toggleActive);

        const handleScroll = () => {
            const scroll = window.scrollY;
            const logos = document.querySelectorAll('.logo');
            const mains = document.querySelectorAll('.main');

            logos.forEach((el) => el.classList.toggle('hide', scroll >= 100));
            mains.forEach((el) => el.classList.toggle('bg-custom-s5', scroll >= 100));
        };

        window.addEventListener('scroll', handleScroll);

        return () => {
            btnMain?.removeEventListener('click', toggleActive);
            btnClose?.removeEventListener('click', toggleActive);
            overlay?.removeEventListener('click', toggleActive);
            window.removeEventListener('scroll', handleScroll);
            // ✅ 保險：避免路由切換/卸載時殘留鎖 scroll
            document.body.style.overflow = "auto";
            headerEl.classList.remove("active");
        };
    }, [headerRef]);
}

