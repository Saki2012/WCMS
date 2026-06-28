import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { getClientSlotPath } from "@/Features/Pages/Client/Scaffold/Slot/Client_SlotPath";
import { SubMenu_Comp as SubMenuBase } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { resolveSpecComponent } from "@/SysCore/Utils/Library/SlotResolver";

// #region Property
interface ILeftFrameProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
}
// #endregion

// #region Initialization
let subMenuCompCache: typeof SubMenuBase | null = null;
// #endregion

// #region Public
/** 子頁左側選單區塊，負責載入 Feature 或 Spec 專用 SubMenu。 */
export const LeftFrame = (props: ILeftFrameProps) =>
{
    const SubMenuComp = getSubMenuComp();

    return <SubMenuComp lang={props.lang} site={props.site} node={props.node} />;
};
// #endregion

// #region Private
/** 延後解析 SubMenu slot，避免 SSR 初始化階段產生循環載入。 */
const getSubMenuComp = () =>
{
    subMenuCompCache ??= resolveSpecComponent<typeof SubMenuBase>(getClientSlotPath("SubMenu"), SubMenuBase, ["SubMenu_Comp", "SubMenuComp", "default"]);

    return subMenuCompCache;
};
// #endregion
