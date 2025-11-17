import "./Client/Content/bootstrap-5.3.3/js/bootstrap.bundle.min.js";
import "./Client/Content/css_import/assets/swiper-11.1.14/swiper-bundle.min.js";
const loadJQueryPlugins = async () =>
{
    await import("./Client/Content/jquery-3.7.1/jquery-3.7.1.min.js");
    (window as any).$ = (window as any).jQuery;
    await Promise.all([
        import("./Client/Content/css_import/assets/owlcarousel_2/owl.carousel_v2.3.4.js"),
        import("./Client/Content/css_import/assets/ekko-lightbox/ekko-lightbox.js"),
    ]);
};
void loadJQueryPlugins();
