import { useEffect, useRef } from 'react';
import NaviBarComp from '../../../SysCore/Components/NaviBar/NaviBar_Comp'
import mock_HeaderData from '../../../SysCore/Components/NaviBar/NaviBar_Data'
import MenuListComp from '../../../SysCore/Components/MenuList/MenuList_Comp'
// import mock_MenuListData from '../../../SysCore/Components/MenuList/MenuList_Data'

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}
const MenuComp = () => {
  const translateRef = useRef<HTMLDivElement>(null);
  const navItems = mock_HeaderData();
//   const menuItems = mock_MenuListData()

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const script = document.createElement('script');
    script.src = 'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    script.async = true;
    document.body.appendChild(script);

    // 初始化方法
    window.googleTranslateElementInit = () => {
      if (translateRef.current) {
        new window.google.translate.TranslateElement(
          {
            pageLanguage: 'zh-TW',
          },
          translateRef.current
        );
      }
    };
  }, []);

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
                <NaviBarComp items={navItems}></NaviBarComp>
            </div>
        </div>
        {/* // topBox上方選單 end // */}
        <div className="SearchBar">
            <div className="search_DivBox">
                <input className="search_input" type="text" placeholder="Search" id="search-box" onKeyUp={(e) =>{"Search(event)"}} tabIndex={1} title="Search" />
            </div>
        </div>
        {/* // menuBox // */}
        <nav className="menuBox">
            <ul id="menu">
                {/* <MenuListComp items={menuItems} lv={1}></MenuListComp> */}
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

export default MenuComp;








