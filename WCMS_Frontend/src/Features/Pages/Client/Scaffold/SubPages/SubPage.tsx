import type { Lang } from "@/SysCore/i18n/lang";
import { BreadCrumb_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { Toolbar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/Toolbar_Comp";
import { SubMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/SubMenu_Comp";
import { ThirdMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/ThirdMenu_Comp";
import { Outlet } from "react-router";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";

const SubPage = (props: { style: IFETheme; lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) => {
    return (<>
        {/* <Banner_Comp /> */}
        <AccessKeySection />
        <ContentContainer style={props.style} lang={props.lang} site={props.site} node={props.node} />
    </>)
}

export default SubPage

const AccessKeySection = () => {
    return (<section className="accesskey_C_H">
        <div className="container-customize2">
            <a id="content" accessKey="C" href="#C" className="accesskey_main C" title="中央主要內容區(C)" tabIndex={0}>:::</a>
        </div>
    </section>)
}

const ContentContainer = (props: { style: IFETheme; lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) => {
    return (
        <div className="ContentPlaceContent_Area">
            <section className="Template content area">
                <div className="container-customize2 + Layout_Padding_0_top Layout_Padding_3_bottom">
                    <div className="row">
                        <BreadCrumb_Comp lang={props.lang} site={props.site} node={props.node} />
                        <Toolbar_Comp lang={props.lang} />
                    </div>
                    <div className="row">
                        <SubMenu_Comp lang={props.lang} site={props.site} node={props.node} />
                        <div className="col-xl-10 col-lg-9 col-md-12 col-sm-12 col-12">
                            <ThirdMenu_Comp lang={props.lang} site={props.site} node={props.node} />
                            <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + my-5">
                                <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    )
}