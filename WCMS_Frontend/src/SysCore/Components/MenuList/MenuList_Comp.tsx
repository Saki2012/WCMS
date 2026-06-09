import clsx from "clsx";
import React from "react";
import type { IMenu_Style } from "./MenuList_Clsx";
import type { MenuItemData } from "./MenuList_Data";

// #region Section
const MenuListComp = (
    { items, Style, expandedKeys, onToggleKey }: {
        items: MenuItemData[];
        Style: IMenu_Style;
        expandedKeys?: Set<string>;
        onToggleKey?: (key: string) => void;
    },
) =>
{
    return (
        <ul className={Style.ul(1)}>
            {items.map((item, idx) => RecursiveMenuItem(item, item.Id ?? `menu-${idx}`, Style, 1, expandedKeys, onToggleKey, idx === 0))}
        </ul>
    );
};
// #endregion

// #region Private
const RecursiveMenuItem = (
    item: MenuItemData,
    key: string,
    Style: IMenu_Style,
    lv: number = 1,
    expandedKeys?: Set<string>,
    onToggleKey?: (key: string) => void,
    isFirst: boolean = false,
) =>
{
    const hasSub = item.SubItem.length > 0;
    const isExpanded = !!expandedKeys?.has(key);
    const isExternal = /^https?:\/\//i.test(item.Url || "");
    const contentWithIcon = React.isValidElement(item.DOMContent)
        ? React.cloneElement(item.DOMContent, {
            className: clsx(
                item.DOMContent.props.className,
                isExternal && "justify-content-start flex-nowrap", // ✅ 只有外部才加
            ),
            children: <>{isExternal && <i className="fa fa-link me-2"></i>} {item.DOMContent.props.children}</>,
        })
        : item.DOMContent;

    return (
        <li className={Style.li(lv, isFirst, hasSub, isExpanded)} key={key}>
            <div
                className={"w-100"}
                onClick={() =>
                {
                    if (hasSub && onToggleKey)
                    {
                        onToggleKey(key);
                    }
                }}
                style={{ cursor: hasSub ? "pointer" : "default" }}
            >
                {contentWithIcon}
            </div>
            {hasSub && (
                <ul className={Style.ul(lv + 1)}>
                    {item.SubItem.map((sub, idx) => RecursiveMenuItem(sub, `${key}-${idx}`, Style, lv + 1, expandedKeys, onToggleKey))}
                </ul>
            )}
        </li>
    );
};


export default MenuListComp;
// #endregion
