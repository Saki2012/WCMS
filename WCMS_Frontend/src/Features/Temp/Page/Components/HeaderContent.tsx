
/*Header模塊*/
import MenuComp from './Menu'

export default function HeaderComp() {
  return (
        <div id="site-header" className="LL_Header_DivBar main-header w-100">
            <section className="header_section">
                <header className="header_Box">
                    <div className="container-fluid-customize h-100 mr-0 pr-0">
                        <div className="HeaderDivBox">
                            <div className="leftBox">
                                <div className="logo">
                                    <h1>
                                        <a className="P_logo" href="/" title="國立臺灣藝術大學_研究發展處 LOGO" tabIndex={1}>
                                            <img src="/Legacy/Images/logo/logo_450x80.svg" alt="國立臺灣藝術大學_研究發展處 LOGO" />
                                        </a>
                                        <a className="M320_logo" href="/" title="國立臺灣藝術大學_研究發展處 LOGO" tabIndex={1}>
                                            <img src="Legacy/Images/logo/logo_M320_191x60.svg" alt="國立臺灣藝術大學_研究發展處 LOGO" />
                                        </a>
                                    </h1>
                                </div>
                            </div>

                            <MenuComp></MenuComp>

                            <div className="overlayer"></div>
                            <div className="rightBox">
                                <button className="main">
                                    <div><i className="fa customize-bars" aria-hidden="true"></i></div>
                                    <span>MENU</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </header>
            </section>
        </div>
    );
}
    


// <script type="text/javascript">
//     $('header').find('button.main').click(function () {
//         if (!$(this).parents('header').hasClass('active')) {
//             $(this).parents('header').addClass('active');
//             $('body').css('overflow', 'hidden');
//         } else {
//             $(this).parents('header').removeClass('active');
//             $('body').css('overflow', 'auto');
//         }//end if hasClass

//         return false;
//     });

//     $('header').find('button.closemain').click(function () {
//         if (!$(this).parents('header').hasClass('active')) {
//             $(this).parents('header').addClass('active');
//             $('body').css('overflow', 'hidden');
//         } else {
//             $(this).parents('header').removeClass('active');
//             $('body').css('overflow', 'auto');
//         }//end if hasClass

//         return false;
//     });

//     $('header').find('div.overlayer').click(function () {
//         if (!$(this).parents('header').hasClass('active')) {
//             $(this).parents('header').addClass('active');
//             $('body').css('overflow', 'hidden');
//         } else {
//             $(this).parents('header').removeClass('active');
//             $('body').css('overflow', 'auto');
//         }//end if hasClass

//         return false;
//     });
//     function Search(event) {
//         if (event.keyCode == "13" || event.keyCode == "108") {
//             if ($('#search-box').val() != "") {
//                 window.open("https://www.google.com.tw/search?hl=zh-TW&as_sitesearch=https%3A%2F%2Ford.ntua.edu.tw%2F&q=" + $('#search-box').val());
//             }
//         }
//         return false;
//     };
// </script>
// <!--// site-header-- 加入shadow 的 JS // -->
// <script type="text/javascript">
//     $(window).on("scroll", function () {
//         var scroll = $(window).scrollTop();

//         if (scroll >= 100) {
//             //$("#site-header").addClass("shadow");
//             $(".logo").addClass("hide");
//             $(".main").addClass("bg-custom-s5");
//         } else {
//             //$("#site-header").removeClass("shadow");
//             $(".logo").removeClass("hide");
//             $(".main").removeClass("bg-custom-s5");
//         }
//     });
// </script>