/**
 * Accesskey
 * TopFrame
 * ContentContainer = LeftFrame + RightFrame
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LeftFrame } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/LeftFrame/LeftFrame";
import { RightFrame } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/RightFrame/RightFrame";
import { TopFrame } from "@/Features/Pages/Client/Scaffold/SubPages/layouts/TopFrame/TopFrame";
import { BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useState } from "react";
import { Outlet, useLoaderData } from "react-router";
import type { ISubPageLoaderData } from "./SubPage_Loader";
// import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import "./subpage-content.css";
import { ThirdMenu_Comp } from "./Module/ThirdMenu/ThirdMenu_Comp";
import { SubPageShell, type SubPageShellMode } from "./SubPageShell";

// #region Property
interface ISubPageProps
{
    style: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}

interface IContentContainerProps extends ISubPageProps
{
    bannerInitial: ISubPageLoaderData["bannerInitial"];
}
// #endregion
// #region Public
export const SubPage = (props: ISubPageProps) =>
{
    const data = useLoaderData() as ISubPageLoaderData | undefined;
    const [items, setItems] = useState<BreadcrumbItem[]>([]);
    const mode = resolveSubPageShellMode(props.node);

    return (
        <BreadcrumbContext.Provider value={{ items, setItems }}>
            <SubPageShell
                lang={props.lang}
                mode={mode}
                topSlot={<TopFrame lang={props.lang} site={props.site} node={props.node} backHref={props.backHref} initialBanner={data?.bannerInitial ?? null} />}
                leftSlot={<LeftFrame lang={props.lang} site={props.site} node={props.node} />}
                rightTopSlot={<ThirdMenu_Comp lang={props.lang} site={props.site} node={props.node} />}
            >
                <Outlet context={{ lang: props.lang, site: props.site, node: props.node }} />
            </SubPageShell>
        </BreadcrumbContext.Provider>
    );
};
// #endregion

// #region Private
const resolveSubPageShellMode = (node: INormNode): SubPageShellMode =>
{
    const hasSubMenu = node.pageType === 0 && ((node.level ?? 0) > 0 || (node.children?.length ?? 0) > 0);
    return hasSubMenu ? "withMenu" : "full";
};
const ContentContainer = (props: IContentContainerProps) =>
{
    return (
        <div className="ContentPlaceContent_Area">
            <section className="Template content area">
                {/* 子頁上方區塊 */}
                <TopFrame lang={props.lang} site={props.site} node={props.node} backHref={props.backHref} initialBanner={props.bannerInitial} />
                <div className="container-content + Layout_Padding_0_top Layout_Padding_5_bottom">
                    <div className="row">
                        {props.node.pageType === 0 && <LeftFrame lang={props.lang} site={props.site} node={props.node} />}
                        <RightFrame lang={props.lang} site={props.site} node={props.node} />
                    </div>
                </div>
            </section>
        </div>
    );
};
// #endregion
