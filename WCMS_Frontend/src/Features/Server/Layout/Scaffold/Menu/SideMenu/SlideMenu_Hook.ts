import { useState, useEffect } from 'react';
import type {MenuItemData} from '../../../../../../SysCore/Components/MenuList/MenuList_Data'
import SideMenuProvider from '../../../../../../Features/Server/Layout/Scaffold/Menu/SideMenu/SideMenu_Api'
import { useLocation } from 'react-router-dom';


/** 獲取左邊Menu的欄位資料 */
export const useGetSideMenuItem = () => {
  const [items, setItems] = useState<MenuItemData[]>([]);
  useEffect(() => {
    SideMenuProvider().fetchList().then(setItems);
  }, []);
  return items;
};

/** 設置左邊Menu欄位顯示動作與行為*/
export const useSidebarMenuBehavior = (menus: MenuItemData[]) => {
  const location = useLocation();
  const [hoveredMenuId, setHoveredMenuId] = useState<string | null>(null);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set());
  const [activePath, setActivePath] = useState<string>("");

  // 🔸 自動根據 URL 設定 active 與展開
  useEffect(() => {
    const currentPath = location.pathname;
    setActivePath(currentPath);

    // 自動展開包含當前 path 的 menu
    const matched = menus.find(menu =>
      menu.SubItem?.some(sub => currentPath.includes(sub.Url))
    );
    if (matched) {
      setExpandedMenus(prev => new Set(prev).add(matched.Id));
    }
  }, [location.pathname, menus]);

  const onHoverMenu = (id: string) => setHoveredMenuId(id);
  const onLeaveMenu = () => setHoveredMenuId(null);
  const toggleMenu = (id: string) => {
    setExpandedMenus(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  const isHovered = (id: string) => hoveredMenuId === id;
  const isExpanded = (id: string) => expandedMenus.has(id);
  const isActive = (path: string) => activePath.includes(path);

  return { onHoverMenu, onLeaveMenu, toggleMenu, isHovered, isExpanded, isActive };
};
