import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { Banner_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/Banner/Banner_Comp";
import { BreadCrumb_Comp as BreadCrumbBase, type BreadCrumbCompProps } from "@/Features/Pages/Client/Scaffold/SubPages/Module/BreadCrumb/BreadCrumb_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";
import type { ReactNode } from "react";
import type { ISubPageLoaderData } from "../../SubPage_Loader";

// #region Property
interface ITopFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
    initialBanner: ISubPageLoaderData["bannerInitial"];
    /** Breadcrumb 右側工具列插槽，供 Preview 或特殊頁面追加功能。 */
    toolbarRightSlot?: ReactNode;
}
// #endregion

// #region Initialization
let breadCrumbCompCache: typeof BreadCrumbBase | null = null;
// #endregion

// #region Public
/** 子頁上方區塊，負責顯示 Banner 與可被 Spec 覆寫的 Breadcrumb。 */
export const TopFrame = (props: ITopFrameProps) =>
{
    const BreadCrumbComp = getBreadCrumbComp();
    const breadCrumbProps: BreadCrumbCompProps = {
        lang: props.lang,
        site: props.site,
        node: props.node,
        backHref: props.backHref,
        toolbarRightSlot: props.toolbarRightSlot,
    };

    return (
        <>
            <Banner_Comp lang={props.lang} node={props.node} initialBanner={props.initialBanner} />
            <div className="container-content Layout_Padding_0_top Layout_Padding_4_bottom">
                <div className="row">
                    <BreadCrumbComp {...breadCrumbProps} />
                </div>
            </div>
        </>
    );
};
// #endregion

// #region Private
/** 延後解析 Breadcrumb slot，避免 SSR 初始化階段產生循環載入。 */
const getBreadCrumbComp = () =>
{
    breadCrumbCompCache ??= resolveSpecComponent<typeof BreadCrumbBase>(getClientSlotPath("BreadCrumb"), BreadCrumbBase, ["BreadCrumb_Comp", "BreadCrumbComp", "default"]);

    return breadCrumbCompCache;
};
// #endregion
