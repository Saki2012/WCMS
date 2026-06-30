import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import type { ISubPageLoaderData } from "@/Features/Pages/Client/Scaffold/SubPages/SubPage_Loader";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import { BreadCrumb_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import { SubMenu_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp";
import { ThirdMenu_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Module/ThirdMenu/ThirdMenu_Comp";
import { SubBanner_Comp } from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/Section/SubBanner_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";

// #region Property
interface ISubPageProps
{
    style: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}

interface ISubPageBodyProps extends ISubPageProps
{
    hasSubMenu: boolean;
}
// #endregion

// #region Public
/** 1810 子頁外框，保留 Feature Module 主流程，但還原 1810 Banner / Menu / Content DOM。 */
export const SubPage = (props: ISubPageProps) =>
{
    // 宣告變數
    const data = useLoaderData() as ISubPageLoaderData | undefined;
    const [items, setItems] = useState<BreadcrumbItem[]>([]);
    const hasSubMenu = resolveHasSubMenu(props.node);

    // return
    return (
        <BreadcrumbContext.Provider value={{ items, setItems }}>
            <div className="ContentPlaceContent_Area">
                <section className="Template content area">
                    <SubBanner_Comp lang={props.lang} node={props.node} initialBanner={data?.bannerInitial ?? null} />
                    <BreadcrumbSection {...props} />
                    <SubPageBody {...props} hasSubMenu={hasSubMenu} />
                </section>
            </div>
        </BreadcrumbContext.Provider>
    );
};
// #endregion

// #region Section
/** 1810 麵包屑區塊。 */
const BreadcrumbSection = (props: ISubPageProps) =>
{
    // return
    return (
        <div className="container-customize1">
            <div className="row">
                <BreadCrumb_Comp lang={props.lang} site={props.site} node={props.node} backHref={props.backHref} />
            </div>
        </div>
    );
};

/** 1810 子頁主要內容容器。 */
const SubPageBody = (props: ISubPageBodyProps) =>
{
    // return
    return (
        <div className="container-customize1 Layout_Padding_3_bottom">
            <div className="row">
                {props.hasSubMenu && <SubMenu_Comp lang={props.lang} site={props.site} node={props.node} />}
                <RightContentSection {...props} />
            </div>
        </div>
    );
};

/** 1810 右側內容區塊，負責第三層選單、Accesskey 與子路由內容。 */
const RightContentSection = (props: ISubPageBodyProps) =>
{
    // 宣告變數
    const contentCss = clsx("col-md-12", "col-sm-12", "col-12", props.hasSubMenu ? "col-lg-10" : "col-lg-12");

    // return
    return (
        <div className={contentCss}>
            <ThirdMenu_Comp lang={props.lang} site={props.site} node={props.node} />
            <div className="row">
                <div id="ContentPlaceContent_ContentConentA" className="col-sm-12 col-12 + All_Standard_Content_CSS + mb-5 mt-1">
                    <Accesskey type="C" lang={props.lang} />
                    <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 判斷 1810 子頁是否需要左側選單。 */
const resolveHasSubMenu = (node: INormNode): boolean =>
{
    // return
    return node.pageType === 0 && ((node.level ?? 0) > 0 || (node.children?.length ?? 0) > 0);
};
// #endregion
