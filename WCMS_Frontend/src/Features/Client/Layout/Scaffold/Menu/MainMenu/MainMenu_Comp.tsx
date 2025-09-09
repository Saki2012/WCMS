import { useEffect, useRef } from 'react';
import NaviBarComp from '../../../../../../SysCore/Components/NaviBar/NaviBar_Comp'
import type { NaviData } from '../../../../../../SysCore/Components/NaviBar/NaviBar_Data'
import { Link } from 'react-router-dom';
import type { IFETheme } from '../../../Theme/ITheme';
import { Classic_FETheme } from '../../../Theme/ClassicTheme_Clsx';
import MenuListComp from '../../../../../../SysCore/Components/MenuList/MenuList_Comp';
import type { INormSite } from '../../../../Site-Routing';
import { buildMenuItems } from '../../../BizFunc/MainPage/SubPages';
import type { MenuItemData } from '../../../../../../SysCore/Components/MenuList/MenuList_Data';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}

const GetMenuData = (lang: string, site: INormSite): MenuItemData[] => {
  const roots = site.treeByLang?.[lang] ?? [];
  if (!roots) return [];
  return buildMenuItems(roots, 0);
};


export const MainMenu = ({ lang, site }: { lang: string; site: INormSite }) => {
  const translateRef = useRef<HTMLDivElement>(null);
  //   const menuItems = mock_MenuListData()
  const menuItems = GetMenuData(lang, site)
  const Mock_naviData: NaviData[] = [
    {
      Id: "", SrcData: "", Url: "",
      DOMContent: <Link className="nav-link" to="/" target="_self" title="首頁">首頁</Link>
    },
    {
      Id: "", SrcData: "", Url: "",
      DOMContent: <Link className="nav-link" to="https://www.ntua.edu.tw/" target="_self" title="臺藝校首頁">臺藝校首頁</Link>
    },
    {
      Id: "", SrcData: "", Url: "",
      DOMContent: <Link className="nav-link" to="Sitemap" target="_self" title="網站導覽">網站導覽</Link>
    },
    {
      Id: "", SrcData: "", Url: "",
      DOMContent: <Link className="nav-link" to="/en" target="_self" title="English">English</Link>
    },
  ]

  const fakeStyle: IFETheme = Classic_FETheme



  // useEffect(() => {
  //   if (typeof window === 'undefined') return;

  //   const scriptId = 'google-translate-script';
  //   const exist = document.getElementById(scriptId);
  //   if (exist) return;

  //   const script = document.createElement('script');
  //   script.id = scriptId;
  //   script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
  //   script.async = true;
  //   document.body.appendChild(script);

  //   window.googleTranslateElementInit = () => {
  //     if (translateRef.current) {
  //       new window.google.translate.TranslateElement({
  //         pageLanguage: 'zh-TW',
  //       }, translateRef.current);
  //     }
  //   };
  // }, []);

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
          <div className="navsBox">
            <NaviBarComp items={Mock_naviData} style={fakeStyle.NaviBarMenu} ></NaviBarComp>
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
            <MenuListComp items={menuItems} Style={fakeStyle.MainMenu}></MenuListComp>
          </ul>
          {/* <script type="text/javascript">
                $(function () {
                    $('#menu').metisMenu();

                    $('#menu li a').on('click', function (event) {
                        if ($(event.target).parent().find('i.fa-angle-right').length > 0) {
                            $(event.delegateTarget).find('i').addClass('fa-angle-down');
                            $(event.delegateTarget).find('i').removeClass('fa-angle-right');
                        }
                        else {
                            $(event.delegateTarget).find('i').addClass('fa-angle-right');
                            $(event.delegateTarget).find('i').removeClass('fa-angle-down');
                        }

                        $('#menu li').not('li.active').find('i').removeClass('fa-angle-down');
                        $('#menu li').not('li.active').find('i').addClass('fa-angle-right');
                        $('#menu li.m-number').not('li.m-number.active').find('li.active').find('ul.in').removeClass('in');
                        $('#menu li.m-number').not('li.m-number.active').find('li.active').removeClass('active');
                    });
                });
            </script> */}
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

    const closeMenu = () => {
      // 找到最近的 header_Box
      const headerBox = document.querySelector(".header_Box");
      if (headerBox) {
        document.body.style.overflow = "auto";
        headerBox.classList.remove("active");
      }
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
    return () => root.removeEventListener("click", onClick);
  }, [menuRef]);
}