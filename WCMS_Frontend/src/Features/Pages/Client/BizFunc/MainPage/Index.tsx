import Header from "SpecFeature/Pages/Client/Scaffold/MainFrame/Header";
import Footer from "SpecFeature/Pages/Client/Scaffold/MainFrame/Footer";
import { Outlet, useLocation } from "react-router-dom";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { useSiteViewCount } from "@/Features/Hooks/BizFunc/SystemSetting/SiteInfo/SiteViewCount/SiteViewCount_Hooks";

export const Index = (props: { lang: Lang; site: INormSite; style: IFETheme }) =>
{
    const location = useLocation();
    const currentPath = location.pathname;
    const isSubPage = currentPath !== "/";
    const containerClass = isSubPage ? "subpage_body_bg" : "body_bg";
    const siteIndex = props.site.siteIndex ?? "";
    useSiteViewCount({enabled: true, siteIndex,});
    return (
        <>
            <div id="Customsize" className={containerClass}>
                <Header lang={props.lang} site={props.site} style={props.style} />
                <Outlet />
                <Footer lang={props.lang} />
            </div>
        </>
    );
};