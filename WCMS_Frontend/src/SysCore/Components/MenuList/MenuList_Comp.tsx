import type { MenuItemData } from './MenuList_Data'
import type { ISidebarMenu_Style } from '../../../Features/Server/Layout/Scaffold/Menu/SideMenu/SideMenu_Clsx';

interface Props {
  items: MenuItemData[];
  theme: ISidebarMenu_Style;
}
/** 遞迴渲染Item
 * @param item 
 * @param theme 
 * @param lv 
 * @returns 
 */
const RecursiveMenuItem = (item: MenuItemData, itemIdx:number, theme: ISidebarMenu_Style,lv: number = 1) => {
  const hasSub = item.SubItem.length > 0;
  const isFirst = itemIdx===0 && lv===1;
  return (
    <li className={theme.li(isFirst, hasSub)} key={itemIdx}>
      {item.DOMContent}
      {hasSub &&
      <ul className={theme.ul(lv+1)} style={theme.ulStyle}>
        {item.SubItem.map((sub, idx) => RecursiveMenuItem(sub, idx, theme, lv + 1) )}
      </ul>
      }
    </li>
  );
};

/** Menu元件
 * @param param0 
 * @returns 
 */
const MenuListComp = ({ items, theme }: Props) => {
  return (
      <ul className={theme.ul(1)}>
        {items.map((item, idx) => RecursiveMenuItem(item, idx, theme))}
      </ul>
  );
};

export default MenuListComp