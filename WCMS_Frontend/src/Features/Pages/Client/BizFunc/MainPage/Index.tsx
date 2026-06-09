import { useSiteViewCount } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Hooks";
import { useSiteFooterRuntime } from "@/Features/Pages/Client/Route/ClientRouter_Loader";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import Footer from "@/Features/Pages/Client/Scaffold/MainFrame/Footer/Footer";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { Outlet, useLocation } from "react-router-dom";
import Header from "SpecFeature/Pages/Client/Scaffold/MainFrame/Header";

// #region Public
export const Index = (props: { lang: Lang; site: INormSite; style: IFETheme; }) =>
{
    const location = useLocation();
    const currentPath = location.pathname;
    const isSubPage = currentPath !== "/";
    const containerClass = isSubPage ? "subpage_body_bg" : "body_bg";
    const footerVm = useSiteFooterRuntime(props.site.siteIndex);
    useSiteViewCount({ enabled: true, siteIndex: props.site.siteIndex });
    return (
        <>
            <div id="Customsize" className={containerClass}>
                <Header lang={props.lang} site={props.site} style={props.style} />
                <Outlet />
                <Footer lang={props.lang} site={props.site} runtimeInfo={footerVm.runtimeInfo} />
            </div>
        </>
    );
};
// #endregion
