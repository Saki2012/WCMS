/**
 * ThirdMenu - 之後可能會拿掉
 * 在此處使用ModuleContent時，會以outlet標籤做使用 - 有設定動態選擇其渲染的內容
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import { ThirdMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/ThirdMenu/ThirdMenu_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import { Outlet } from "react-router";

// #region Property
interface IRightFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
}
// #endregion

// #region Private
export const RightFrame = (props: IRightFrameProps) =>
{
    // 判斷是否需要預留左側選單寬度
    const hasSubMenu = props.node.pageType === 0 && ((props.node.level ?? 0) > 0 || (props.node.children?.length ?? 0) > 0);
    // 右側內容區欄寬
    const contentCss = clsx("col-md-12", "col-sm-12", "col-12", hasSubMenu ? "col-xl-10" : "col-xl-12", hasSubMenu ? "col-lg-9" : "col-lg-12");
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
