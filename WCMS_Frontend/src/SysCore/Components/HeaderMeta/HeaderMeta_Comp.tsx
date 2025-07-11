
const LegacyCss = () =>{
  return(
    <>
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/bootstrap-5.1.1/css/bootstrap.min.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/Front-content.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/Front-index-content.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/Front-subpage-content.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/menu/custom-menu-subpage.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/accesskey/custom_sr-only.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/accesskey/custom_accesskey.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/login/login.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/visitor/visitor.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/ContentConentA_table_rwd.css" />
      <link type="text/css"  rel="stylesheet"       href="/Legacy/Style/Content/ekko-lightbox/ekko-lightbox.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/venobox-master/dist/venobox.min.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/Sitemap/Sitemap.css" />
      <link rel="icon"       type="image/x-icon"    href="/Legacy/Style/favicon.ico" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/css/style_class_kit.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/css/style_background_color.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/css/font-awesome-4.7.0/font-awesome-4.7.0.min.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/owlcarousel_2/custom_owlcarousel_style.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/owlcarousel_2/owl.carousel_v2.3.4.min.css" />
      <link rel="stylesheet"                        href="/Legacy/Style/Content/swiper-11.1.14/swiper-bundle.min.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/animate/animate.css"/>
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/marquee/marquee-left-loop.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/slide-bar/slide-bar.css"/>
      <link rel="stylesheet"                        href="/Legacy/Style/Content/Sitemap/Sitemap.css" />
      <link rel="stylesheet" type="text/css"        href="/Legacy/Style/Content/wow/animate.css" />
    </>
  )
}

const LegacyJS = () =>{
  return(
    <>
      <script type="text/javascript" src="/Legacy/Style/Content/jquery-3.4.1/jquery-3.7.1.min.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/jquery-3.4.1/bootstrap.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/bootstrap-4.6.0/popper/popper-1.14.6.min.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/bootstrap-5.1.1/js/bootstrap.bundle.min.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/menu/vertical-menu/metismenu.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/ekko-lightbox/ekko-lightbox.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/owlcarousel_2/owl.carousel_v2.3.4.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/swiper-11.1.14/swiper-bundle.min.js"></script>
      <script type="text/javascript" src="/Legacy/Style/Content/wow/wow.min.js"></script>
      {/* <script type="text/javascript">
          var wow = new WOW(
              {
                  boxClass: 'wow',      // 要套用WOW.js縮需要的動畫class(預設是wow)
                  animateClass: 'animated', // 要"動起來"的動畫(預設是animated, 因此如果你有其他動畫library要使用也可以在這裡調整)
                  offset: 0,          // 距離顯示多遠開始顯示動畫 (預設是0, 因此捲動到顯示時才出現動畫)
                  mobile: true,       // 手機上是否要套用動畫 (預設是true)
                  live: true,       // 非同步產生的內容是否也要套用 (預設是true, 非常適合搭配SPA)
                  callback: function (box) {
                      // 當每個要開始時, 呼叫這裡面的內容, 參數是要開始進行動畫特效的element DOM
                  },
                  scrollContainer: null // 可以設定成只套用在某個container中捲動才呈現, 不設定就是整個視窗
              }
          );

          Util = (function () {
              function Util() { }

              Util.prototype.extend = function (custom, defaults) {
                  var key, value;
                  for (key in custom) {
                      value = custom[key];
                      if (value != null) {
                          defaults[key] = value;
                      }
                  }
                  return defaults;
              };

              Util.prototype.isMobile = function (agent) {
                  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(agent);
              };

              return Util;

          })();

          wow.init();
      </script>
      <script type="text/javascript">
          function getid(xixi) {
              return document.getElementById(xixi);
          }
          //轉換字元
          function doZoom(size) {
              if (size == 16) {
                  getid("Customsize").style.fontSize = size + "px";
                  getid("fs16").style.display = "";
                  getid("fs18").style.display = "none";
                  getid("fs20").style.display = "none";
              }
              if (size == 18) {
                  getid("Customsize").style.fontSize = size + "px";
                  getid("fs16").style.display = "none";
                  getid("fs18").style.display = "";
                  getid("fs20").style.display = "none";
              }
              if (size == 20) {
                  getid("Customsize").style.fontSize = size + "px";
                  getid("fs16").style.display = "none";
                  getid("fs18").style.display = "none";
                  getid("fs20").style.display = "";
              }
          }
          $(document).ready(function () {
              if ($('a[href*="--"]').length > 0 || $('a[href*="begin_highlight_tag"]').length > 0 || $('a[href*="begin_highlight_tag"]').length > 0
                  || $('a[href*="end_highlight_tag"]').length > 0 || $('a[href*="nmouseover"]').length > 0 || $('a[href*="alert"]').length > 0) {
                  window.location = "/404.aspx";
              }
          });
      </script> */}
    </>
  )
}

const HeaderMetaComp = () => {
  return (
    <>
      <title>{"國立臺灣藝術大學_研究發展處"}</title>
      <meta charSet="UTF-8"/>
      <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no"/>
      <meta name="description" content=""/>
      <meta name="mobile-web-app-capable" content="yes"/>
      <meta name="keywords" content="國立臺灣藝術大學_研究發展處" />
      <meta name="Copyright" content="本網頁著作 國立臺灣藝術大學_研究發展處 所有"/>
      <meta name="apple-mobile-web-app-capable" content="yes"/>
      <meta property="og:title" content="國立臺灣藝術大學_研究發展處"/>
      <meta property="og:url" content="index.html"/>
      <meta property="og:type" content="website"/>
      <meta property="og:description" name="description" content="國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處"/>
      <meta httpEquiv="Content-Type" content="text/html; charset=UTF-8"/>
      <meta httpEquiv="pragma" content="no-cache"/>
      <meta httpEquiv="expires" content="0"/>
      <meta httpEquiv="cache-control" content="no-cache"/>
      <meta httpEquiv="X-UA-Compatible" content="IE=edge"/>

      {/* <LegacyCss></LegacyCss>
      <LegacyJS></LegacyJS> */}
    </>
  )
}

export default HeaderMetaComp;
