/**
 * AccessKeySection
 * TopFrame
 * ContentContainer = LeftFrame + RightFrame
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import {
    BreadcrumbContext,
    type BreadcrumbItem,
} from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import RightFrame from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/RightFrame/RightFrame";
import LeftFrame from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/LeftFrame/LeftFrame";
import TopFrame from "@/Features/Pages/Client/Scaffold/SubPages/Layouts/TopFrame/TopFrame";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";
import type { Lang } from "@/SysCore/i18n/lang";
import { useState } from "react";
import { useLoaderData } from "react-router";
import type { ISubPageLoaderData } from "./SubPage_Loader";

interface ISubPageProps
{
    style: IFETheme;
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}

const SubPage = (props: ISubPageProps) =>
{
    // 讀取 SSR loader 初始資料
    const data = useLoaderData() as ISubPageLoaderData;

    // 給 BreadCrumb 與子頁共用的動態 breadcrumb 狀態
    const [items, setItems] = useState<BreadcrumbItem[]>([]);

    return (
        <>
            <BreadcrumbContext.Provider value={{ items, setItems }}>
                <AccessKeySection />
                <TopFrame
                    lang={props.lang}
                    site={props.site}
                    node={props.node}
                    backHref={props.backHref}
                    initialBanner={data.bannerInitial}
                />
                <ContentContainer
                    style={props.style}
                    lang={props.lang}
                    site={props.site}
                    node={props.node}
                    backHref={props.backHref}
                />
            </BreadcrumbContext.Provider>
        </>
    );
};

export default SubPage;

const AccessKeySection = () =>
{
    return (
        <section className="accesskey_C_H">
            <div className="container-customize2">
                <a
                    id="content"
                    accessKey="C"
                    href="#C"
                    className="accesskey_main C"
                    title="中央主要內容區(C)"
                    tabIndex={0}
                >
                    :::
                </a>
            </div>
        </section>
    );
};

const ContentContainer = (props: ISubPageProps) =>
{
    return (
        <div className="ContentPlaceContent_Area">
            <section className="Template content area">
                <div className="container-customize2 + Layout_Padding_0_top Layout_Padding_3_bottom">
                    <div className="row">
                        <LeftFrame lang={props.lang} site={props.site} node={props.node} />
                        <RightFrame lang={props.lang} site={props.site} node={props.node} />
                    </div>
                </div>
            </section>
        </div>
    );
};