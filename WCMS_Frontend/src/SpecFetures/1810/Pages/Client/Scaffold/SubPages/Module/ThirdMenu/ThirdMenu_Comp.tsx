import { buildMenuItems, getAncestorAtLevel } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { useMemo } from "react";

// #region Property
interface ThirdMenuCompProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    backHref?: string;
}
// #endregion

// #region Public
/** 1810 第三層右上選單，透過 Spec slot 覆寫 Feature 共用版。 */
export const ThirdMenu_Comp = (props: ThirdMenuCompProps) =>
{
    // 宣告變數
    const menuItems = useMemo(() => getThirdMenuItems(props), [props.lang, props.site, props.node]);

    // return
    if (!menuItems.length) return null;

    return <ThirdMenuContent items={menuItems} />;
};
// #endregion

// #region Section
/** 1810 第三層選單 DOM。 */
const ThirdMenuContent = (props: { items: MenuItemData[]; }) =>
{
    // return
    return (
        <div id="ContentPlaceContent_ContentThirdMenu" className="col-sm-12 col-12 px-0 page-righttopmenu">
            <div className="row">
                <ul className="third-list-group">
                    {props.items.map((item) => (
                        <li key={item.Id}>
                            <LangLink className="list-group-item" to={item.Url} title={item.SrcData} target={item.URL_Open}>{item.SrcData}</LangLink>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};
// #endregion

// #region Private
/** 依照目前 node 取得 1810 第三層選單資料。 */
const getThirdMenuItems = (props: ThirdMenuCompProps): MenuItemData[] =>
{
    // 宣告變數
    const sideMaxDepth = 3;
    const anchor = getAncestorAtLevel(props.lang, props.site, props.node, sideMaxDepth);

    // return
    return buildMenuItems(anchor?.children ?? [], props.node.id);
};
// #endregion
