import SideMenuProvider from "@/Features/Pages/Server/Scaffold/Menu/SideMenu/SideMenu_Api";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { useEffect, useState } from "react";

/** 獲取左邊Menu的欄位資料 */
export const useGetSideMenuItem = () =>
{
    const [items, setItems] = useState<MenuItemData[]>([]);
    useEffect(() =>
    {
        let cancelled = false;
        (async () =>
        {
            const resp = await SideMenuProvider().fetchList();
            const list = resp.Data ?? [];
            if (!cancelled) setItems(list);
        })().catch(console.error);
        return () =>
        {
            cancelled = true;
        };
    }, []);
    return items;
};

/** 設置左邊Menu欄位顯示動作與行為*/
export const useSideMenuToggle = () =>
{
    const [isOpen, setIsOpen] = useState(() =>
    {
        return localStorage.getItem("sideMenu-open") !== "false"; // 預設為展開
    });

    useEffect(() =>
    {
        localStorage.setItem("sideMenu-open", String(isOpen));
    }, [isOpen]);

    const toggleSideMenu = () => setIsOpen(prev => !prev);

    return { isOpen, toggleSideMenu };
};
