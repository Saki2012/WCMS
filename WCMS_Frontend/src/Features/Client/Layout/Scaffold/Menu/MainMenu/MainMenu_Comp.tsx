import { useEffect, useRef } from 'react';
import NaviBarComp from '../../../../../../SysCore/Components/NaviBar/NaviBar_Comp'
import type { NaviData } from '../../../../../../SysCore/Components/NaviBar/NaviBar_Data'
import { Link } from 'react-router-dom';
import type { IFETheme } from '../../../Theme/ITheme';
import { Classic_FETheme } from '../../../Theme/ClassicTheme_Clsx';

declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}
const MainMenu = () => {
  const translateRef = useRef<HTMLDivElement>(null);
//   const menuItems = mock_MenuListData()

  const Mock_naviData:NaviData[]=[
      {
        Id:"",SrcData: "",Url: "",
        DOMContent:<Link className="nav-link" to="/" target="_self" title="首頁">首頁</Link>
      },
      {
        Id:"",SrcData: "",Url: "",
        DOMContent:<Link className="nav-link" to="/" target="_self" title="台藝校首頁">台藝校首頁</Link>
      },
      {
        Id:"",SrcData: "",Url: "",
        DOMContent:<Link className="nav-link" to="/" target="_self" title="網站導覽">網站導覽</Link>
      },
      {
        Id:"",SrcData: "",Url: "",
        DOMContent:<Link className="nav-link" to="/" target="_self" title="English">English</Link>
      },
    ]
  
  const fakeStyle:IFETheme=Classic_FETheme



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
        pageLanguage: 'zh-TW',
      }, translateRef.current);
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
                <NaviBarComp items={Mock_naviData} style={fakeStyle.NaviBarMenu} ></NaviBarComp>
            </div>
        </div>
        {/* // topBox上方選單 end // */}
        <div className="SearchBar">
            <div className="search_DivBox">
                <input className="search_input" type="text" placeholder="Search" id="search-box" onKeyUp={() =>{"Search(event)"}} tabIndex={1} title="Search" />
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

export default MainMenu;








