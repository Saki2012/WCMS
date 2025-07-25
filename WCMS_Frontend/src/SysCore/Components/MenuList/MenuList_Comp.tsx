import type { MenuItemData } from './MenuList_Data'
import type { IMenu_Style } from "./MenuList_Clsx"
import { useSidebarMenuBehavior } from '../../../Features/Server/Layout/Scaffold/Menu/SideMenu/SlideMenu_Hook';
/** 遞迴渲染Item
 * @param item 
 * @param Style 
 * @param lv 
 * @returns 
 */
const RecursiveMenuItem = (item: MenuItemData, itemIdx:number, Style: IMenu_Style,lv: number = 1) => {
  const hasSub = item.SubItem.length > 0;
  const isFirst = itemIdx===0 && lv===1;
  return (
    <li className={Style.li(isFirst, hasSub)} key={itemIdx}>
      {item.DOMContent}
      {hasSub &&
      <ul className={Style.ul(lv+1)} style={Style.ulStyle}>
        {item.SubItem.map((sub, idx) => RecursiveMenuItem(sub, idx, Style, lv + 1) )}
      </ul>
      }
    </li>
  );
};

/** Menu元件
 * @param param0 
 * @returns 
 */
const MenuListComp = ({ items, Style }: {  items: MenuItemData[]; Style: IMenu_Style;}) => {
  return (
      <ul className={Style.ul(1)}>
        {items.map((item, idx) => RecursiveMenuItem(item, idx, Style))}
      </ul>
  );
};

export default MenuListComp