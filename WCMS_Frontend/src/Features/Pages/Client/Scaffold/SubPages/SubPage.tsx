import type { Lang } from "@/SysCore/i18n/lang";
import { BreadCrumb_Comp, BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Section/BreadCrumb_Comp";
import { Toolbar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/Toolbar_Comp";
import { SubMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/SubMenu_Comp";
import { ThirdMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/ThirdMenu_Comp";
import { Outlet } from "react-router";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { useState } from "react";
import clsx from "clsx";
import { Banner_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Section/Banner_Comp";

const SubPage = (props: { style: IFETheme; lang: Lang; site: INormSite; node: INormNode; backHref?: string }) => {
    return (
        <>
            <Banner_Comp lang={props.lang} node={props.node} />
            <AccessKeySection />
            <ContentContainer style={props.style} lang={props.lang} site={props.site} node={props.node} backHref={props.backHref} />
        </>
    );
};

export default SubPage;

const AccessKeySection = () => {
    return (
        <section className="accesskey_C_H">
            <div className="container-customize2">
                <a id="content" accessKey="C" href="#C" className="accesskey_main C" title="中央主要內容區(C)" tabIndex={0}>
                    :::
                </a>
            </div>
        </section>
    );
};

const ContentContainer = (props: { style: IFETheme; lang: Lang; site: INormSite; node: INormNode; backHref?: string }) => {
    // 動態 breadcrumb items（由各頁 setItems）
    const [items, setItems] = useState<BreadcrumbItem[]>([]);
    const hasSubMenu = (props.node.level ?? 0) > 0 || (props.node.children?.length ?? 0) > 0;
    const contentCss = clsx("col-md-12", "col-sm-12", "col-12", hasSubMenu ? "col-xl-10" : "col-xl-12", hasSubMenu ? "col-lg-9" : "col-lg-12");
    return (
        <div className="ContentPlaceContent_Area">
            <section className="Template content area">
                <div className="container-customize2 + Layout_Padding_0_top Layout_Padding_3_bottom">
                    {/* ✅ Provider 只包一次，BreadCrumb + 子頁都能讀寫 */}
                    <BreadcrumbContext.Provider value={{ items, setItems }}>
                        <div className="row">
                            <BreadCrumb_Comp lang={props.lang} site={props.site} node={props.node} backHref={props.backHref} />
                            <Toolbar_Comp lang={props.lang} />
                        </div>

                        <div className="row">
                            <SubMenu_Comp lang={props.lang} site={props.site} node={props.node} />
                            <div className={contentCss}>
                                <ThirdMenu_Comp lang={props.lang} site={props.site} node={props.node} />

                                {/* ✅ 子頁只渲染一次（避免雙 Outlet） */}
                                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + my-5">
                                    <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />
                                </div>
                            </div>
                        </div>
                    </BreadcrumbContext.Provider>
                </div>
            </section>
        </div>
    );
};
