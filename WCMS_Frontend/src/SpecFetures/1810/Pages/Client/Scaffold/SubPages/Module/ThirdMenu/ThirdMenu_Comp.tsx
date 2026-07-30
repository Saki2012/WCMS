import { buildMenuItems, getAncestorAtLevel } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { type MouseEvent, useMemo } from "react";
import { useLocation } from "react-router-dom";

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
    const location = useLocation();
    const menuItems = useMemo(() => getThirdMenuItems(props), [props.lang, props.site, props.node]);

    // return
    if (!menuItems.length) return null;

    return <ThirdMenuContent items={menuItems} pathname={location.pathname} />;
};
// #endregion

// #region Section
/** 1810 第三層選單 DOM。 */
const ThirdMenuContent = (props: { items: MenuItemData[]; pathname: string; }) =>
{
    // return
    return (
        <div id="ContentPlaceContent_ContentThirdMenu" className="col-sm-12 col-12 px-0 page-righttopmenu">
            <div className="row">
                <ul className="third-list-group">
                    {props.items.map((item) => (
                        <li key={item.Id}>
                            <LangLink className={clsx("list-group-item", isThirdMenuActive(props.pathname, item.Url) && "active")} to={item.Url} title={item.SrcData} target={item.URL_Open} onMouseDown={preventThirdMenuMouseFocus} onClick={blurThirdMenuLinkOnMouse}>{item.SrcData}</LangLink>
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


/** 阻止滑鼠點擊讓第三層選單連結取得 focus，避免 SPA 殘留 click 色。 */
const preventThirdMenuMouseFocus = (e: MouseEvent<HTMLAnchorElement>): void =>
{
    if (e.detail > 0) e.preventDefault();
};

/** 滑鼠點擊後移除 focus，避免 SPA 換頁後殘留 focus 色。 */
const blurThirdMenuLinkOnMouse = (e: MouseEvent<HTMLAnchorElement>): void =>
{
    if (e.detail > 0) e.currentTarget.blur();
};

/** 判斷第三層選單是否為目前路徑。 */
const isThirdMenuActive = (pathname: string, itemUrl?: string): boolean =>
{
    if (!itemUrl || isThirdMenuExternalUrl(itemUrl)) return false;
    return normalizeThirdMenuPath(pathname) === normalizeThirdMenuPath(itemUrl);
};

/** 標準化第三層選單路徑。 */
const normalizeThirdMenuPath = (path: string): string =>
{
    const clean = (path ?? "/").split("?")[0].split("#")[0];
    return clean.length > 1 && clean.endsWith("/") ? clean.slice(0, -1) : clean || "/";
};

/** 判斷第三層選單是否外部連結。 */
const isThirdMenuExternalUrl = (url?: string | null): boolean =>
{
    return !!url && (/^https?:\/\//i.test(url) || url.startsWith("//"));
};
