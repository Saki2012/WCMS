import { useSiteViewCount } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Hooks";
import { Header } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { useSiteFooterRuntime } from "@/Features/Pages/Client/Route/ClientRouter_Loader";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Footer } from "@/Features/Pages/Client/Scaffold/MainFrame/Footer/Footer";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useMemo } from "react";
import { Outlet, useLocation } from "react-router-dom";

// #region Property
type IndexProps = { lang: Lang; site: INormSite; style: IFETheme; };
// #endregion

// #region Public
export const Index = (props: IndexProps) =>
{
    const location = useLocation();
    const currentPath = location.pathname;
    const outletKey = useClientOutletKey(location.pathname, location.search);
    const isSubPage = currentPath !== "/";
    const containerClass = isSubPage ? "subpage_body_bg" : "body_bg";
    const footerVm = useSiteFooterRuntime(props.site.siteIndex);
    useSiteViewCount({ enabled: true, siteIndex: props.site.siteIndex });
    return (
        <>
            <div id="Customsize" className={containerClass}>
                <Header lang={props.lang} site={props.site} style={props.style} />
                <Outlet key={outletKey} />
                <Footer lang={props.lang} site={props.site} runtimeInfo={footerVm.runtimeInfo} />
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 建立前台 Outlet 重掛載 key。 */
const useClientOutletKey = (pathname: string, search: string): string =>
{
    const key = useMemo(() => `${pathname}${search}`, [pathname, search]);
    return key;
};
// #endregion
