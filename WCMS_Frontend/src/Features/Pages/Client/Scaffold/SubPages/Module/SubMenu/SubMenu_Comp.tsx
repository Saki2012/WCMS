import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./SubMenu.css";

type SubMenuProps = { lang: Lang; site: INormSite; node: INormNode; maxDepth?: number; };

type UseExpandedMenuStateResult = { expandedIds: Set<string>; toggleExpand: (itemId: string, depth: number) => void; };

type CollapsePhase = "idle" | "opening" | "closing";

/** 依照 lang / site / node 取得當前節點底下的 menu */
const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find((n) => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};

/** 判斷是不是外部連結 */
const isExternalUrl = (url?: string | null): boolean =>
{
    if (!url) return false;
    return /^https?:\/\//i.test(url) || url.startsWith("//");
};
// 若為外部連結 新增icon
const renderLinkIcon = (url?: string | null) =>
{
    return isExternalUrl(url) ? <i className="fad fa-link me-2"></i> : null;
};

/** 判斷 item 是否有子節點 */
const hasSubItems = (item: MenuItemData): boolean =>
{
    return !!(item.SubItem && item.SubItem.length > 0);
};

/** 把路徑尾巴的斜線修掉 */
const normalizePath = (path: string): string =>
{
    const clean = (path ?? "/").split("?")[0].split("#")[0];
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 去掉網址最前面的 /:lang */
const stripLangPrefixFromPath = (path: string): string =>
{
    const p = normalizePath(path);
    const segs = p.split("/").filter(Boolean);
    if (segs.length === 0) return "/";

    const first = segs[0]?.toLowerCase();
    if (!isSupportedLang(first)) return p;

    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};

/** 判斷目前路徑是否落在 itemUrl */
const isUrlMatch = (currentPath: string, itemUrl: string | undefined): boolean =>
{
    if (!itemUrl) return false;
    if (isExternalUrl(itemUrl)) return false;

    const cur = stripLangPrefixFromPath(currentPath);
    const url = stripLangPrefixFromPath(itemUrl);

    if (cur === url) return true;
    if (url !== "/" && cur.startsWith(`${url}/`)) return true;
    return false;
};

/** 計算 activeIds 與 active path 應展開的父節點 */
const calcActiveAndExpanded = (items: MenuItemData[], pathname: string) =>
{
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();

    const dfs = (item: MenuItemData): boolean =>
    {
        const selfActive = !hasSubItems(item) && isUrlMatch(pathname, item.Url);
        let hasActiveInSubtree = selfActive;

        if (hasSubItems(item))
        {
            item.SubItem!.forEach((child) =>
            {
                if (dfs(child)) hasActiveInSubtree = true;
            });
        }

        if (selfActive) activeIds.add(item.Id);
        if (hasSubItems(item) && hasActiveInSubtree) expandedIdsByPath.add(item.Id);

        return hasActiveInSubtree;
    };

    items.forEach(dfs);
    return { activeIds, expandedIdsByPath };
};

/** 取得 SpecCode */
const getSpecCode = (): string => String(import.meta.env.VITE_SPEC_CODE ?? "");

/** 建立 menu tree key，避免單純 re-render 就重設展開狀態 */
const buildMenuTreeKey = (items: MenuItemData[]): string =>
{
    return items.map((item) => `${item.Id}[${buildMenuTreeKey(item.SubItem ?? [])}]`).join("|");
};

/** 移除某個節點底下所有已展開的 parent id */
const removeExpandedIdsInNode = (item: MenuItemData, next: Set<string>): void =>
{
    if (!hasSubItems(item)) return;

    next.delete(item.Id);
    item.SubItem!.forEach((child) => removeExpandedIdsInNode(child, next));
};

/** 依照 branch id 遞迴移除該分支的展開狀態 */
const removeExpandedBranch = (items: MenuItemData[], branchId: string, next: Set<string>): boolean =>
{
    for (const item of items)
    {
        if (item.Id === branchId)
        {
            removeExpandedIdsInNode(item, next);
            return true;
        }

        if (hasSubItems(item) && removeExpandedBranch(item.SubItem!, branchId, next))
        {
            return true;
        }
    }

    return false;
};

/** 合併 active path 展開狀態 */
const mergeExpandedIds = (prev: Set<string>, expandedIdsByPath: Set<string>): Set<string> =>
{
    const next = new Set(prev);
    expandedIdsByPath.forEach((id) => next.add(id));
    return next;
};

/** 1816 專用：路由切換時維持第一層互斥 */
const closeOtherTopLevelBranches = (menuItems: MenuItemData[], expandedIdsByPath: Set<string>, next: Set<string>): void =>
{
    menuItems.forEach((item) =>
    {
        if (!hasSubItems(item)) return;
        if (expandedIdsByPath.has(item.Id)) return;

        removeExpandedBranch(menuItems, item.Id, next);
    });
};

/** 共用：管理 submenu 展開狀態 */
const useExpandedMenuState = (
    menuItems: MenuItemData[],
    pathname: string,
    expandedIdsByPath: Set<string>,
    exclusiveFirstLevel: boolean,
): UseExpandedMenuStateResult =>
{
    const menuTreeKey = useMemo(() => buildMenuTreeKey(menuItems), [menuItems]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(expandedIdsByPath));
    const prevMenuTreeKeyRef = useRef(menuTreeKey);
    const prevPathnameRef = useRef(pathname);

    useEffect(() =>
    {
        const menuChanged = prevMenuTreeKeyRef.current !== menuTreeKey;
        const pathnameChanged = prevPathnameRef.current !== pathname;

        if (menuChanged)
        {
            setExpandedIds(new Set(expandedIdsByPath));
        } else if (pathnameChanged)
        {
            setExpandedIds((prev) =>
            {
                const next = mergeExpandedIds(prev, expandedIdsByPath);

                if (exclusiveFirstLevel)
                {
                    closeOtherTopLevelBranches(menuItems, expandedIdsByPath, next);
                }

                return next;
            });
        }

        prevMenuTreeKeyRef.current = menuTreeKey;
        prevPathnameRef.current = pathname;
    }, [menuItems, menuTreeKey, pathname, expandedIdsByPath, exclusiveFirstLevel]);

    /** 切換展開/收合 */
    const toggleExpand = (itemId: string, depth: number): void =>
    {
        setExpandedIds((prev) =>
        {
            const next = new Set(prev);
            const isOpen = next.has(itemId);

            if (isOpen)
            {
                removeExpandedBranch(menuItems, itemId, next);
                return next;
            }

            if (exclusiveFirstLevel && depth === 1)
            {
                menuItems.forEach((item) =>
                {
                    if (!hasSubItems(item)) return;
                    if (item.Id === itemId) return;

                    removeExpandedBranch(menuItems, item.Id, next);
                });
            }

            next.add(itemId);
            return next;
        });
    };

    return { expandedIds, toggleExpand };
};

/** 控制 submenu 展開/收合動畫 */
const useCollapseAnimation = (expanded: boolean) =>
{
    const submenuRef = useRef<HTMLUListElement | null>(null);
    const phaseRef = useRef<CollapsePhase>("idle");
    const [maxHeight, setMaxHeight] = useState<string>(expanded ? "none" : "0px");
    const [keepVisible, setKeepVisible] = useState<boolean>(expanded);

    useEffect(() =>
    {
        const el = submenuRef.current;
        if (!el || typeof window === "undefined") return;

        let rafId = 0;

        if (expanded)
        {
            setKeepVisible(true);
            phaseRef.current = "opening";

            rafId = window.requestAnimationFrame(() =>
            {
                setMaxHeight(`${el.scrollHeight}px`);
            });

            return () => window.cancelAnimationFrame(rafId);
        }

        if (!keepVisible)
        {
            setMaxHeight("0px");
            phaseRef.current = "idle";
            return;
        }

        phaseRef.current = "closing";
        setMaxHeight(`${el.scrollHeight}px`);

        rafId = window.requestAnimationFrame(() =>
        {
            setMaxHeight("0px");
        });

        return () => window.cancelAnimationFrame(rafId);
    }, [expanded, keepVisible]);

    /** 動畫結束後收尾 */
    const handleTransitionEnd = (e: React.TransitionEvent<HTMLUListElement>): void =>
    {
        if (e.propertyName !== "max-height") return;

        if (phaseRef.current === "opening")
        {
            setMaxHeight("none");
            phaseRef.current = "idle";
            return;
        }

        if (phaseRef.current === "closing")
        {
            setKeepVisible(false);
            phaseRef.current = "idle";
        }
    };

    const submenuStyle: React.CSSProperties = {
        display: keepVisible ? "block" : undefined,
        overflow: "hidden",
        maxHeight,
        opacity: expanded ? 1 : 0,
        transition: "max-height 360ms ease, opacity 260ms ease",
        willChange: "max-height, opacity",
        pointerEvents: expanded ? "auto" : "none",
    };

    return { submenuRef, submenuStyle, handleTransitionEnd };
};

/** 共用：保留原本 ul DOM，只補動畫控制 */
const CollapseSubMenu_Comp: React.FC<{ expanded: boolean; children: React.ReactNode; }> = ({ expanded, children }) =>
{
    const { submenuRef, submenuStyle, handleTransitionEnd } = useCollapseAnimation(expanded);

    return (
        <ul
            ref={submenuRef}
            className={clsx("submenu", "collapse", expanded && "show")}
            style={submenuStyle}
            onTransitionEnd={handleTransitionEnd}
            aria-hidden={!expanded}
        >
            {children}
        </ul>
    );
};

/** 共用：leaf（內/外連結） */
const renderLeafItem = (item: MenuItemData, active: boolean): React.ReactNode =>
{
    const target = item.URL_Open;
    const icon = renderLinkIcon(item.Url);

    if (!item.Url)
    {
        return <span className={clsx("list-group-item", active && "active")}>{icon} {item.SrcData}</span>;
    }

    if (isExternalUrl(item.Url))
    {
        return (
            <a
                href={item.Url}
                target={target}
                rel={target === "_blank" ? "noopener noreferrer" : undefined}
                className={clsx("list-group-item", active && "active")}
            >
                {icon}
                {item.SrcData}
            </a>
        );
    }

    return (
        <LangNavLink
            to={item.Url}
            target={target}
            className={({ isActive }) => clsx("list-group-item", (isActive || active) && "active")}
            aria-current={active ? "page" : undefined}
        >
            {icon}
            {item.SrcData}
        </LangNavLink>
    );
};

/** =========================
 *  Spec 1816 專用 Component
 *  - 保留原本 DOM 結構
 *  - 改由 React state 控制 open/collapse
 *  ========================= */
const SubMenu_1816_Comp: React.FC<{ menuItems: MenuItemData[]; activeIds: Set<string>; expandedIdsByPath: Set<string>; pathname: string; lang: Lang; }> = (
    props,
) =>
{
    const { menuItems, activeIds, expandedIdsByPath, pathname } = props;
    const { expandedIds, toggleExpand } = useExpandedMenuState(menuItems, pathname, expandedIdsByPath, true);

    const isItemActive = (item: MenuItemData) => activeIds.has(item.Id);

    /** render：父節點（1816 保持 a 標籤結構） */
    const renderParent = (item: MenuItemData, expanded: boolean, depth: number): React.ReactNode =>
    {
        const handleClick = (e: React.MouseEvent<HTMLAnchorElement>): void =>
        {
            e.preventDefault();
            toggleExpand(item.Id, depth);
        };

        return (
            <a href="#" role="button" className={clsx("list-group-item", expanded ? "open" : "collapsed")} onClick={handleClick} aria-expanded={expanded}>
                {renderLinkIcon(item.Url)}
                {item.SrcData}
            </a>
        );
    };

    /** render：items（1816 保持 submenu / collapse DOM） */
    const renderItems = (items: MenuItemData[], depth: number = 1): React.ReactNode =>
        items.map((item, idx) =>
        {
            const key = `${item.Id}-${idx}`;
            const active = isItemActive(item);
            const expanded = hasSubItems(item) && expandedIds.has(item.Id);

            return (
                <li key={key} className={clsx("nav-item", hasSubItems(item) && "has-submenu")}>
                    {hasSubItems(item) ? renderParent(item, expanded, depth) : renderLeafItem(item, active)}
                    {hasSubItems(item) && <CollapseSubMenu_Comp expanded={expanded}>{renderItems(item.SubItem!, depth + 1)}</CollapseSubMenu_Comp>}
                </li>
            );
        });

    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12">
            <Accesskey type="L" lang={props.lang} />
            <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 SubPage-leftMenu">
                <div id="SubPage-SidebarMenu">
                    <nav className="sidebar sidebar-custom mb-5">
                        <ul className="nav list-group" id="nav_accordion">{renderItems(menuItems)}</ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

/** =========================
 *  Default Component
 *  - 保留原本 DOM 結構
 *  - 改善 expanded state 被重設的問題
 *  ========================= */
const SubMenu_Default_Comp: React.FC<{ menuItems: MenuItemData[]; activeIds: Set<string>; expandedIdsByPath: Set<string>; pathname: string; lang: Lang; }> = (
    props,
) =>
{
    const { menuItems, activeIds, expandedIdsByPath, pathname } = props;
    const { expandedIds, toggleExpand } = useExpandedMenuState(menuItems, pathname, expandedIdsByPath, true);
    // 20260414 useExpandedMenuState - 原exclusiveFirstLevel為false，改為true

    const isItemActive = (item: MenuItemData) => activeIds.has(item.Id);

    /** render：items（default 保持 button / ul 結構） */
    const renderItems = (items: MenuItemData[], depth: number = 1): React.ReactNode =>
        items.map((item, idx) =>
        {
            const key = `${item.Id}-${idx}`;
            const active = isItemActive(item);
            const expanded = hasSubItems(item) && expandedIds.has(item.Id);

            return (
                <li key={key} className={clsx("nav-item", hasSubItems(item) && "has-submenu")}>
                    {hasSubItems(item)
                        ? (
                            <button
                                type="button"
                                className={clsx("list-group-item", expanded && "parent-active")}
                                onClick={() => toggleExpand(item.Id, depth)}
                                aria-expanded={expanded}
                            >
                                {renderLinkIcon(item.Url)}
                                {item.SrcData}
                            </button>
                        )
                        : (renderLeafItem(item, active))}

                    {hasSubItems(item) && <CollapseSubMenu_Comp expanded={expanded}>{renderItems(item.SubItem!, depth + 1)}</CollapseSubMenu_Comp>}
                </li>
            );
        });

    if (!menuItems.length) return null;

    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12 mb-4">
            <Accesskey type="L" lang={props.lang} />
            <nav className="sidebar">
                <ul className="list-group">{renderItems(menuItems)}</ul>
            </nav>
        </div>
    );
};

export const SubMenu_Comp: React.FC<SubMenuProps> = (props) =>
{
    const { lang, site, node, maxDepth = 3 } = props;
    const location = useLocation();
    const specCode = getSpecCode();
    const isSpec1816 = specCode === "1816";

    const menuItems = useMemo(() => GetMenuData(lang, site, node, maxDepth), [lang, site, node, maxDepth]);

    const { activeIds, expandedIdsByPath } = useMemo(() => calcActiveAndExpanded(menuItems, location.pathname), [menuItems, location.pathname]);

    if (!menuItems.length) return null;

    if (isSpec1816)
    {
        return (
            <SubMenu_1816_Comp
                menuItems={menuItems}
                activeIds={activeIds}
                expandedIdsByPath={expandedIdsByPath}
                pathname={location.pathname}
                lang={props.lang}
            />
        );
    }

    return (
        <SubMenu_Default_Comp
            menuItems={menuItems}
            activeIds={activeIds}
            expandedIdsByPath={expandedIdsByPath}
            pathname={location.pathname}
            lang={props.lang}
        />
    );
};
