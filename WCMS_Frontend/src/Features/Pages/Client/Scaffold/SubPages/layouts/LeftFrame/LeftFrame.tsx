/**
 * SubMenu
 */

import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { SubMenu_Comp } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp";
import type { Lang } from "@/SysCore/i18n/lang";

interface ILeftFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
}

const LeftFrame = (props: ILeftFrameProps) =>
{
    return (
        <>
            {/* 左側子選單 */}
            <SubMenu_Comp lang={props.lang} site={props.site} node={props.node} />
        </>
    );
};

export default LeftFrame;
