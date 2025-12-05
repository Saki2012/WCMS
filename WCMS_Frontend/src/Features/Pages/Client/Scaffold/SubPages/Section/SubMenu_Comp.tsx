import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import React, { useMemo, useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";

type SubMenuProps = { lang: Lang; site: INormSite; node: INormNode; maxDepth?: number; };

const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity,): MenuItemData[] => {
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find((n) => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};
/** 判斷是不是外部連結（http / https 開頭） */
const isExternalUrl = (url?: string | null): boolean => {
    if (!url) return false;
    return /^https?:\/\//i.test(url) || url.startsWith("//");
};
/** 把路徑尾巴的斜線修掉，方便做判斷 */
const normalizePath = (path: string): string => {
    if (!path) return "/";
    try {
        const clean = path.split("?")[0].split("#")[0];
        if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
        return clean || "/";
    }
    catch {
        return path;
    }
};
/** 只判斷「完全相等」的路徑，用在 leaf active */
const isUrlExactlyMatch = (currentPath: string, itemUrl: string | undefined): boolean => {
    if (!itemUrl) return false;
    if (isExternalUrl(itemUrl)) return false;

    const cur = normalizePath(currentPath);
    const url = normalizePath(itemUrl);
    return cur === url;
};
/** 計算：
 *  - activeIds：只有「實際匹配路由」的節點才 active（通常是 leaf）
 *  - expandedIdsByPath：在目前路徑上的父節點，用來自動展開
 */
const calcActiveAndExpanded = (items: MenuItemData[], pathname: string) => {
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();
    const dfs = (item: MenuItemData): boolean => {
        const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
        const selfActive = isUrlExactlyMatch(pathname, item.Url);
        let hasActiveInSubtree = selfActive;
        if (hasChildren) {
            for (const child of item.SubItem) {
                if (dfs(child)) {
                    hasActiveInSubtree = true;
                }
            }
        }
        if (selfActive) activeIds.add(item.Id);
        if (hasChildren && hasActiveInSubtree) expandedIdsByPath.add(item.Id);
        return hasActiveInSubtree;
    };
    items.forEach(dfs);
    return { activeIds, expandedIdsByPath };
};
export const SubMenu_Comp: React.FC<SubMenuProps> = (props) => {
    const { lang, site, node, maxDepth = 3 } = props;//暫時默認最多3層，之後看code如何改
    const location = useLocation();
    // 依照 lang / site / node 取得當前節點底下的 menu
    const menuItems = useMemo(() => GetMenuData(lang, site, node, maxDepth), [lang, site, node, maxDepth],);
    // 根據目前路由計算 active 與「應該展開」的父節點
    const { activeIds, expandedIdsByPath } = useMemo(() => calcActiveAndExpanded(menuItems, location.pathname), [menuItems, location.pathname],);
    // 實際展開狀態：預設會包含路徑上要展開的節點，點父層可額外展開/收合
    const [expandedIds, setExpandedIds] = useState<Set<string>>(expandedIdsByPath);
    // 當路徑或 menu 改變時，同步一份預設展開狀態
    useEffect(() => { setExpandedIds(new Set(expandedIdsByPath)); }, [expandedIdsByPath]);
    const isItemActive = (item: MenuItemData) => activeIds.has(item.Id);
    const isItemExpanded = (item: MenuItemData, hasChildren: boolean) => hasChildren && expandedIds.has(item.Id);
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            }
            else {
                next.add(id);
            }
            return next;
        });
    };
    const renderSubMenuItems = (items: MenuItemData[]): React.ReactNode =>
        items.map((item, idx) => {
            const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
            const key = `${item.Id}-${idx}`;
            const target = item.URL_Open;
            const active = isItemActive(item);
            const expanded = isItemExpanded(item, hasChildren);
            let content: React.ReactNode;
            if (hasChildren) {
                // 有子層的父節點：只用來展開/收合，不做導頁（即使有 Url）
                content = (
                    <button type="button" className={clsx("list-group-item",)} onClick={() => toggleExpand(item.Id)} aria-expanded={expanded}>
                        {item.SrcData}
                    </button>
                );
            }
            else {
                // 沒子層 → 真的可以導頁的 leaf
                if (!item.Url) {
                    // 理論上不太會出現，但保險處理
                    content = (
                        <span className={clsx("list-group-item", active && "active")}>
                            {item.SrcData}
                        </span>
                    );
                }
                else if (isExternalUrl(item.Url)) {
                    // 外部連結
                    content = (
                        <a href={item.Url} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={clsx("list-group-item", active && "active")}>
                            {item.SrcData}
                        </a>
                    );
                }
                else {
                    // 內部路由
                    content = (
                        <NavLink to={item.Url} target={target} className={clsx("list-group-item", active && "active")} end>
                            {item.SrcData}
                        </NavLink>
                    );
                }
            }

            return (
                <li key={key} className={clsx("nav-item", hasChildren && "has-submenu",)}>
                    {content}
                    {hasChildren && (
                        <ul className={clsx("submenu", "collapse", expanded && "show",)}>
                            {renderSubMenuItems(item.SubItem!)}
                        </ul>
                    )}
                </li>
            );
        });
    if (!menuItems.length) return null;
    // 外層欄位寬度：SubPage.tsx 已預留右側 col-xl-10，這裡就用 col-xl-2 對齊
    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12">
            <nav className="sidebar">
                <ul className="list-group">
                    {renderSubMenuItems(menuItems)}
                </ul>
            </nav>
        </div>
    );
};
