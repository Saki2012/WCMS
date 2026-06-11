import { useSiteViewCount } from "@/Features/Hooks/BizFunc/WEB/SiteViewCount_Hooks";
import { useSiteFooterRuntime } from "@/Features/Pages/Client/Route/ClientRouter_Loader";
import type { INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Footer } from "@/Features/Pages/Client/Scaffold/MainFrame/Footer/Footer";
import { Header as CoreHeader } from "@/Features/Pages/Client/Scaffold/MainFrame/Header";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import { Outlet, useLocation } from "react-router-dom";
import { getClientSlotPath } from "../../Scaffold/Slot/Client_SlotPath";

// #region Property
type IndexProps = { lang: Lang; site: INormSite; style: IFETheme; };
// #endregion

// #region Initialization
/** 解析目前 Spec 的 Header，找不到時回 Feature Core Header。 */
const ResolvedHeader = resolveSpecComponent<typeof CoreHeader>(getClientSlotPath("Header"), CoreHeader, ["Header", "default"]);
// #endregion

// #region Public
export const Index = (props: IndexProps) =>
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
                <ResolvedHeader lang={props.lang} site={props.site} style={props.style} />
                <Outlet />
                <Footer lang={props.lang} site={props.site} runtimeInfo={footerVm.runtimeInfo} />
            </div>
        </>
    );
};
// #endregion
