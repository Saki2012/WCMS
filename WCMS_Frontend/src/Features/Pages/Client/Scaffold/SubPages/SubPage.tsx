/**
 * Accesskey
 * TopFrame
 * ContentContainer = LeftFrame + RightFrame
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LeftFrame } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/LeftFrame/LeftFrame";
import { RightFrame } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/RightFrame";
import { TopFrame } from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/TopFrame/TopFrame";
import { BreadcrumbContext, type BreadcrumbItem } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ISubPageLoaderData } from "./SubPage_Loader";
// import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import "./subpage-content.css";

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

// #region Private
export const SubPage = (props: ISubPageProps) =>
{
    // 讀取 SSR loader 初始資料
    const data = useLoaderData() as ISubPageLoaderData | undefined;

    // 給 BreadCrumb 與子頁共用的動態 breadcrumb 狀態
    const [items, setItems] = useState<BreadcrumbItem[]>([]);

    return (
        <>
            <BreadcrumbContext.Provider value={{ items, setItems }}>
                {
                    /* <div className="container-content">
                    <Accesskey type="C" lang={props.lang}/>
                </div> */
                }
                <ContentContainer
                    style={props.style}
                    lang={props.lang}
                    site={props.site}
                    node={props.node}
                    backHref={props.backHref}
                    bannerInitial={data?.bannerInitial ?? null}
                />
            </BreadcrumbContext.Provider>
        </>
    );
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
