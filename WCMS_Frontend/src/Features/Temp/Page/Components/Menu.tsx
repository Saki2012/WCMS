import 'swiper/swiper-bundle.css';
import { useEffect, useRef } from 'react';
declare global {
  interface Window {
    google: any;
    googleTranslateElementInit: () => void;
  }
}
const MenuComp = () => {
  const translateRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
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
                <ul className="nav Customize_Nav">
                    <li className="nav-item">
                        <a className="nav-link" href="/" tabIndex={1} target="_self" title="首頁">首頁</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="https://www.ntua.edu.tw/" tabIndex={1} target="_blank" rel="noopener noreferrer" title="台藝校首頁">臺藝校首頁</a>
                    </li>
                    <li className="nav-item">
                        <a className="nav-link" href="/Sitemap.aspx" tabIndex={1} target="_self" title="網站導覽">網站導覽</a>
                    </li>
                    {/* <asp:Literal ID="Li_Lang" runat="server" /> 以下假資料 */}

                    {/* 以上假資料 */}
                </ul>
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
                {/* <asp:Literal ID="Menu1" runat="server" />  以下為假資料*/}
                <li className="m-number">
                    <a href="/Front/Allnews/All-announcement/News.aspx?id=i3kqobGUgUc=" tabIndex={1} title="最新消息">
                        <h2>
                            最新消息
                        </h2>
                        <i className="fa arrow fa-angle-right" aria-hidden="true">
                        </i>
                    </a>
                    <ul className="collapse" style={{height: '0px'}}>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=115" tabIndex={1} title="最新公告">
                                最新公告
                            </a>
                        </li>
                        <li>
                            <a href="/Front/Allnews/Project-solicitation/National-Science-Accounting/News.aspx?id=phLQr%2F7AFj8=" tabIndex={1} title="計畫徵件">
                                計畫徵件
                                <i className="fa fa-angle-right arrow" aria-hidden="true">
                                </i>
                            </a>
                            <ul className="collapse">
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=121" tabIndex={1} title="國科會計畫">
                                        國科會計畫
                                    </a>
                                </li>
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=120" tabIndex={1} title="校內計畫">
                                        校內計畫
                                    </a>
                                </li>
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=122" tabIndex={1} title="校外計畫">
                                        校外計畫
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=123" tabIndex={1} title="法規公告">
                                法規公告
                            </a>
                        </li>
                        <li>
                            <a href="/Front/Allnews/Intramural-activities/In-school-activities/News.aspx?id=eDkgsr5WXo4="
                            tabIndex={1} title="活動公告">
                                活動公告
                                <i className="fa fa-angle-right arrow" aria-hidden="true">
                                </i>
                            </a>
                            <ul className="collapse">
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=126" tabIndex={1} title="校內活動">
                                        校內活動
                                    </a>
                                </li>
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=125" tabIndex={1} title="校外活動">
                                        校外活動
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=113" tabIndex={1} title="獲獎公告">
                                獲獎公告
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=114" tabIndex={1} title="專題與媒體報導">
                                專題與媒體報導
                            </a>
                        </li>
                    </ul>
                </li>

                <li className="m-number">
                    <a href="/Front/About/About-Intro/Page.aspx?id=nczTcFIYBNg=" tabIndex={1}
                    title="關於本處">
                        <h2>
                            關於本處
                        </h2>
                        <i className="fa fa-angle-right arrow" aria-hidden="true">
                        </i>
                    </a>
                    <ul className="collapse">
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=2" tabIndex={1} title="本處簡介">
                                本處簡介
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=3" tabIndex={1} title="研發長室">
                                研發長室
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=4" tabIndex={1} title="組織架構">
                                組織架構
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=6" tabIndex={1} title="人員介紹">
                                人員介紹
                            </a>
                        </li>
                    </ul>
                </li>

                <li className="m-number">
                    <a href="/Front/Development/Development-Goal/Page.aspx?id=uiHdRYIUPjE=" tabIndex={1} title="校務發展">
                        <h2>
                            校務發展
                        </h2>
                        <i className="fa fa-angle-right arrow" aria-hidden="true">
                        </i>
                    </a>
                    <ul className="collapse">
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=8" tabIndex={1} title="校務發展目標">
                                校務發展目標
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=9" tabIndex={1} title="校務發展核心策略">
                                校務發展核心策略
                            </a>
                        </li>
                        <li>
                            <a href="/FrontPointOfEntry.aspx?Sn=11" tabIndex={1} title="近中長程計劃總表">
                                近中長程計劃總表
                            </a>
                        </li>
                        <li>
                            <a href="/Front/Development/Development-Committee/Member-introduction/Page.aspx?id=F7HlxvavKxI=" tabIndex={1} title="研究發展委員會">
                                研究發展委員會
                                <i className="fa fa-angle-right arrow" aria-hidden="true"></i>
                            </a>
                            <ul className="collapse">
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=284" tabIndex={1} title="委員介紹">
                                        委員介紹
                                    </a>
                                </li>
                                <li>
                                    <a href="/FrontPointOfEntry.aspx?Sn=285" tabIndex={1} title="研發委員會議紀錄">
                                        研發委員會議紀錄
                                    </a>
                                </li>
                            </ul>
                        </li>
                        <li>
                            <a href="" tabIndex={1} title="校務評鑑">
                                校務評鑑
                                <i className="fa fa-angle-right arrow" aria-hidden="true">
                                </i>
                            </a>
                            <ul className="collapse">
                                <li>
                                    <a href="https://www.heeact.edu.tw/1151/1194/2785/1721/" rel="noopener noreferrer"
                                    target="_blank" tabIndex={1} title="106年度第二週期校務評鑑">
                                        106年度第二週期校務評鑑
                                    </a>
                                </li>
                                <li>
                                    <a href="https://www.heeact.edu.tw/1151/1194/2785/1721/" rel="noopener noreferrer"
                                    target="_blank" tabIndex={1} title="112年度第三週期校務評鑑">
                                        112年度第三週期校務評鑑
                                    </a>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </li>
                {/* 以上為假資料 */}
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
            <a href="javascript:void(0);" className="Facebook" title="Facebook(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                <i className="fa Customize-facebook" aria-hidden="true"></i><span className="sr-only">Facebook</span>
            </a>

            <a href="javascript:void(0);" className="Instagram" title="Instagram(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                <i className="fa Customize-instagram" aria-hidden="true"></i><span className="sr-only">Instagram</span>
            </a>

            <a href="javascript:void(0);" className="LINE" title="LINE(另開新視窗)" rel="noopener noreferrer" target="_blank" tabIndex={1}>
                <i className="fa Customize-line" aria-hidden="true"></i><span className="sr-only">LINE</span>
            </a>
        </div>
    </div>
</div>
  );
};

export default MenuComp;








