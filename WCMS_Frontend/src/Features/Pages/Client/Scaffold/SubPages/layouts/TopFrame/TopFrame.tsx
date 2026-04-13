/**
 * Banner
 * BreadCrumb + Toolbar
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Banner_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/Banner/Banner_Comp";
import { BreadCrumb_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ISubPageLoaderData } from "../../SubPage_Loader";
import { Toolbar_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/Toolbar/Toolbar_Comp"

interface ITopFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
    initialBanner: ISubPageLoaderData["bannerInitial"];
}

const TopFrame = (props: ITopFrameProps) =>
{
    return (
        <>
            {/* Banner 區塊 */}
            <Banner_Comp lang={props.lang} node={props.node} initialBanner={props.initialBanner} />

            <div className="container-customize2 + Layout_Padding_0_top Layout_Padding_4_bottom">
                {/* BreadCrumb / Toolbar 區塊 */}
                <div className="row">
                    <BreadCrumb_Comp
                        lang={props.lang}
                        site={props.site}
                        node={props.node}
                        backHref={props.backHref}
                    />
                    {/* <Toolbar_Comp lang={props.lang} /> */}
                </div>
            </div>
        </>
    );
};

export default TopFrame;