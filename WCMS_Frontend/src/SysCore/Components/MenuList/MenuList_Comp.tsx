import type { MenuItemData } from './MenuList_Data'
import type { IMenu_Style } from "./MenuList_Clsx"

const RecursiveMenuItem = (item: MenuItemData, key: string, Style: IMenu_Style, lv: number = 1, expandedKeys?: Set<string>, onToggleKey?: (key: string) => void, isFirst: boolean = false ) => {
  const hasSub = item.SubItem.length > 0;
  const isExpanded = !!expandedKeys?.has(key);

  return (
    <li className={Style.li(isFirst, hasSub, isExpanded)} key={key}>
      <div className={'w-100'} onClick={() => { if (hasSub && onToggleKey) onToggleKey(key); }} style={{ cursor: hasSub ? 'pointer' : 'default' }}>
        {item.DOMContent}
      </div>
      {hasSub && (
        <ul className={Style.ul(lv + 1)}>
          {item.SubItem.map((sub, idx) =>
            RecursiveMenuItem(sub, `${key}-${idx}`, Style, lv + 1, expandedKeys, onToggleKey)
          )}
        </ul>
      )}
    </li>
  );
};

const MenuListComp = ({items, Style, expandedKeys, onToggleKey}: { items: MenuItemData[]; Style: IMenu_Style; expandedKeys?: Set<string>; onToggleKey?: (key: string) => void;}) => {
  return (
    <ul className={Style.ul(1)}>
      {items.map((item, idx) =>
        RecursiveMenuItem(item, item.Id ?? `menu-${idx}`, Style, 1, expandedKeys, onToggleKey, idx === 0)
      )}
    </ul>
  );
};

export default MenuListComp;