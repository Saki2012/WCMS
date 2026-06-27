import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import { LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import clsx from "clsx";
import { type CSSProperties, type ReactNode, type TransitionEvent, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./SubMenu.css";

// #region Property
export interface SubMenuCompProps
{
    lang: Lang;
    site: INormSite;
    node: INormNode;
    maxDepth?: number;
}

interface MenuRenderProps
{
    menuItems: MenuItemData[];
    activeIds: Set<string>;
    expandedIdsByPath: Set<string>;
    pathname: string;
    lang: Lang;
}

interface MenuItemsProps
{
    items: MenuItemData[];
    activeIds: Set<string>;
    expandedIds: Set<string>;
    toggleExpand: (itemId: string, depth: number) => void;
    depth?: number;
}

type UseExpandedMenuStateResult = { expandedIds: Set<string>; toggleExpand: (itemId: string, depth: number) => void; };
type CollapsePhase = "idle" | "opening" | "closing";
// #endregion

// #region Public
/** 共用子頁左側選單，僅保留 Feature 預設版型，Spec 特規由 Slot 覆寫。 */
export const SubMenu_Comp = (props: SubMenuCompProps) =>
{
    const { lang, site, node, maxDepth = 3 } = props;
    const location = useLocation();
    const menuItems = useMemo(() => getMenuData(lang, site, node, maxDepth), [lang, site, node, maxDepth]);
    const { activeIds, expandedIdsByPath } = useMemo(() => calcActiveAndExpanded(menuItems, location.pathname), [menuItems, location.pathname]);

    if (!menuItems.length) return null;

    return (
        <SubMenuDefaultComp
            menuItems={menuItems}
            activeIds={activeIds}
            expandedIdsByPath={expandedIdsByPath}
            pathname={location.pathname}
            lang={lang}
        />
    );
};
// #endregion

// #region Section
/** 共用版左側選單外框。 */
const SubMenuDefaultComp = (props: MenuRenderProps) =>
{
    const { expandedIds, toggleExpand } = useExpandedMenuState(props.menuItems, props.pathname, props.expandedIdsByPath, true);

    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12 mb-4">
            <Accesskey type="L" lang={props.lang} />
            <nav className="sidebar">
                <ul className="list-group">
                    <DefaultMenuItems items={props.menuItems} activeIds={props.activeIds} expandedIds={expandedIds} toggleExpand={toggleExpand} />
                </ul>
            </nav>
        </div>
    );
};

/** 共用版選單項目。 */
const DefaultMenuItems = (props: MenuItemsProps) =>
{
    const depth = props.depth ?? 1;

    return (
        <>
            {props.items.map((item, idx) =>
            {
                const key = `${item.Id}-${idx}`;
                const active = props.activeIds.has(item.Id);
                const expanded = hasSubItems(item) && props.expandedIds.has(item.Id);

                return (
                    <li key={key} className={clsx("nav-item", hasSubItems(item) && "has-submenu")}>
                        {hasSubItems(item)
                            ? <ParentMenuButton item={item} expanded={expanded} depth={depth} toggleExpand={props.toggleExpand} />
                            : <LeafMenuItem item={item} active={active} />}
                        {hasSubItems(item) && (
                            <CollapseSubMenuComp expanded={expanded}>
                                <DefaultMenuItems items={item.SubItem ?? []} activeIds={props.activeIds} expandedIds={props.expandedIds} toggleExpand={props.toggleExpand} depth={depth + 1} />
                            </CollapseSubMenuComp>
                        )}
                    </li>
                );
            })}
        </>
    );
};

/** 共用版父層選單按鈕。 */
const ParentMenuButton = (props: { item: MenuItemData; expanded: boolean; depth: number; toggleExpand: (itemId: string, depth: number) => void; }) =>
{
    return (
        <button type="button" className={clsx("list-group-item", props.expanded && "parent-active")} onClick={() => props.toggleExpand(props.item.Id, props.depth)} aria-expanded={props.expanded}>
            <LinkIcon url={props.item.Url} />
            {props.item.SrcData}
        </button>
    );
};

/** 選單葉節點，依內外連結輸出正確連結元件。 */
const LeafMenuItem = (props: { item: MenuItemData; active: boolean; }) =>
{
    const icon = <LinkIcon url={props.item.Url} />;

    if (!props.item.Url)
    {
        return <span className={clsx("list-group-item", props.active && "active")}>{icon} {props.item.SrcData}</span>;
    }

    if (isExternalUrl(props.item.Url))
    {
        return <LangLink to={props.item.Url} className={clsx("list-group-item", props.active && "active")} title={props.item.SrcData}>{icon} {props.item.SrcData}</LangLink>;
    }

    return (
        <LangNavLink
            to={props.item.Url}
            title={props.item.SrcData}
            className={({ isActive }) => clsx("list-group-item", (isActive || props.active) && "active")}
            aria-current={props.active ? "page" : undefined}
        >
            {icon}
            {props.item.SrcData}
        </LangNavLink>
    );
};

/** 外部連結圖示。 */
const LinkIcon = (props: { url?: string | null; }) =>
{
    return isExternalUrl(props.url) ? <i className="fad fa-link me-2"></i> : null;
};

/** 共用 submenu 收合動畫容器。 */
const CollapseSubMenuComp = (props: { expanded: boolean; children: ReactNode; }) =>
{
    const { submenuRef, submenuStyle, handleTransitionEnd } = useCollapseAnimation(props.expanded);

    return (
        <ul ref={submenuRef} className={clsx("submenu", "collapse", props.expanded && "show")} style={submenuStyle} onTransitionEnd={handleTransitionEnd} aria-hidden={!props.expanded}>
            {props.children}
        </ul>
    );
};
// #endregion

// #region Private
/** 依照 lang / site / node 取得目前節點底下的 menu。 */
const getMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find((n) => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};

/** 判斷是否為外部連結。 */
const isExternalUrl = (url?: string | null): boolean =>
{
    if (!url) return false;
    return /^https?:\/\//i.test(url) || url.startsWith("//");
};

/** 判斷 item 是否有子節點。 */
const hasSubItems = (item: MenuItemData): boolean =>
{
    return !!(item.SubItem && item.SubItem.length > 0);
};

/** 建立 menu tree key，避免單純 re-render 就重設展開狀態。 */
const buildMenuTreeKey = (items: MenuItemData[]): string =>
{
    return items.map((item) => `${item.Id}[${buildMenuTreeKey(item.SubItem ?? [])}]`).join("|");
};

/** 把路徑尾巴的斜線修掉。 */
const normalizePath = (path: string): string =>
{
    const clean = (path ?? "/").split("?")[0].split("#")[0];
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 去掉網址最前面的 /:lang。 */
const stripLangPrefixFromPath = (path: string): string =>
{
    const p = normalizePath(path);
    const segs = LibRoutePath.splitPathSegments(p);
    if (segs.length === 0) return "/";

    const first = segs[0]?.toLowerCase();
    if (!isSupportedLang(first)) return p;

    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};

/** 判斷目前路徑是否落在 itemUrl。 */
const isUrlMatch = (currentPath: string, itemUrl: string | undefined): boolean =>
{
    if (!itemUrl) return false;
    if (isExternalUrl(itemUrl)) return false;

    const cur = stripLangPrefixFromPath(currentPath);
    const url = stripLangPrefixFromPath(itemUrl);

    if (cur === url) return true;
    return url !== "/" && cur.startsWith(`${url}/`);
};

/** 計算 activeIds 與 active path 應展開的父節點。 */
const calcActiveAndExpanded = (items: MenuItemData[], pathname: string) =>
{
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();

    items.forEach((item) => calcActiveItem(item, pathname, activeIds, expandedIdsByPath));
    return { activeIds, expandedIdsByPath };
};

/** 遞迴計算單一節點是否為目前 active path。 */
const calcActiveItem = (item: MenuItemData, pathname: string, activeIds: Set<string>, expandedIdsByPath: Set<string>): boolean =>
{
    const selfActive = !hasSubItems(item) && isUrlMatch(pathname, item.Url);
    let hasActiveInSubtree = selfActive;

    if (hasSubItems(item))
    {
        item.SubItem!.forEach((child) =>
        {
            if (calcActiveItem(child, pathname, activeIds, expandedIdsByPath)) hasActiveInSubtree = true;
        });
    }

    if (selfActive) activeIds.add(item.Id);
    if (hasSubItems(item) && hasActiveInSubtree) expandedIdsByPath.add(item.Id);
    return hasActiveInSubtree;
};

/** 移除某個節點底下所有已展開的 parent id。 */
const removeExpandedIdsInNode = (item: MenuItemData, next: Set<string>): void =>
{
    if (!hasSubItems(item)) return;
    next.delete(item.Id);
    item.SubItem!.forEach((child) => removeExpandedIdsInNode(child, next));
};

/** 依照 branch id 遞迴移除該分支的展開狀態。 */
const removeExpandedBranch = (items: MenuItemData[], branchId: string, next: Set<string>): boolean =>
{
    for (const item of items)
    {
        if (item.Id === branchId)
        {
            removeExpandedIdsInNode(item, next);
            return true;
        }
        if (hasSubItems(item) && removeExpandedBranch(item.SubItem!, branchId, next)) return true;
    }

    return false;
};

/** 合併 active path 展開狀態。 */
const mergeExpandedIds = (prev: Set<string>, expandedIdsByPath: Set<string>): Set<string> =>
{
    const next = new Set(prev);
    expandedIdsByPath.forEach((id) => next.add(id));
    return next;
};

/** 路由切換時維持第一層互斥。 */
const closeOtherTopLevelBranches = (menuItems: MenuItemData[], expandedIdsByPath: Set<string>, next: Set<string>): void =>
{
    menuItems.forEach((item) =>
    {
        if (!hasSubItems(item)) return;
        if (expandedIdsByPath.has(item.Id)) return;
        removeExpandedBranch(menuItems, item.Id, next);
    });
};

/** 共用：管理 submenu 展開狀態。 */
const useExpandedMenuState = (menuItems: MenuItemData[], pathname: string, expandedIdsByPath: Set<string>, exclusiveFirstLevel: boolean): UseExpandedMenuStateResult =>
{
    const menuTreeKey = useMemo(() => buildMenuTreeKey(menuItems), [menuItems]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(expandedIdsByPath));
    const prevMenuTreeKeyRef = useRef(menuTreeKey);
    const prevPathnameRef = useRef(pathname);

    useEffect(() =>
    {
        updateExpandedState(menuItems, menuTreeKey, pathname, expandedIdsByPath, exclusiveFirstLevel, prevMenuTreeKeyRef, prevPathnameRef, setExpandedIds);
    }, [menuItems, menuTreeKey, pathname, expandedIdsByPath, exclusiveFirstLevel]);

    const toggleExpand = (itemId: string, depth: number): void =>
    {
        setExpandedIds((prev) => toggleExpandedIds(prev, menuItems, itemId, depth, exclusiveFirstLevel));
    };

    return { expandedIds, toggleExpand };
};

/** 依路由或 menu tree 變化更新展開狀態。 */
const updateExpandedState = (
    menuItems: MenuItemData[],
    menuTreeKey: string,
    pathname: string,
    expandedIdsByPath: Set<string>,
    exclusiveFirstLevel: boolean,
    prevMenuTreeKeyRef: React.MutableRefObject<string>,
    prevPathnameRef: React.MutableRefObject<string>,
    setExpandedIds: React.Dispatch<React.SetStateAction<Set<string>>>,
): void =>
{
    const menuChanged = prevMenuTreeKeyRef.current !== menuTreeKey;
    const pathnameChanged = prevPathnameRef.current !== pathname;

    if (menuChanged) setExpandedIds(new Set(expandedIdsByPath));
    else if (pathnameChanged) setExpandedIds((prev) => mergeExpandedByPath(prev, menuItems, expandedIdsByPath, exclusiveFirstLevel));

    prevMenuTreeKeyRef.current = menuTreeKey;
    prevPathnameRef.current = pathname;
};

/** 合併 active path 展開狀態並處理第一層互斥。 */
const mergeExpandedByPath = (prev: Set<string>, menuItems: MenuItemData[], expandedIdsByPath: Set<string>, exclusiveFirstLevel: boolean): Set<string> =>
{
    const next = mergeExpandedIds(prev, expandedIdsByPath);
    if (exclusiveFirstLevel) closeOtherTopLevelBranches(menuItems, expandedIdsByPath, next);
    return next;
};

/** 切換指定節點展開狀態。 */
const toggleExpandedIds = (prev: Set<string>, menuItems: MenuItemData[], itemId: string, depth: number, exclusiveFirstLevel: boolean): Set<string> =>
{
    const next = new Set(prev);
    if (next.has(itemId))
    {
        removeExpandedBranch(menuItems, itemId, next);
        return next;
    }

    if (exclusiveFirstLevel && depth === 1) closeTopLevelBranchesExcept(menuItems, itemId, next);
    next.add(itemId);
    return next;
};

/** 關閉同層其他第一層分支。 */
const closeTopLevelBranchesExcept = (menuItems: MenuItemData[], itemId: string, next: Set<string>): void =>
{
    menuItems.forEach((item) =>
    {
        if (!hasSubItems(item)) return;
        if (item.Id === itemId) return;
        removeExpandedBranch(menuItems, item.Id, next);
    });
};

/** 控制 submenu 展開/收合動畫。 */
const useCollapseAnimation = (expanded: boolean) =>
{
    const submenuRef = useRef<HTMLUListElement | null>(null);
    const phaseRef = useRef<CollapsePhase>("idle");
    const [maxHeight, setMaxHeight] = useState<string>(expanded ? "none" : "0px");
    const [keepVisible, setKeepVisible] = useState<boolean>(expanded);

    useEffect(() =>
    {
        return updateCollapseAnimation(expanded, keepVisible, submenuRef, phaseRef, setMaxHeight, setKeepVisible);
    }, [expanded, keepVisible]);

    const handleTransitionEnd = (e: TransitionEvent<HTMLUListElement>): void =>
    {
        handleCollapseTransitionEnd(e, phaseRef, setMaxHeight, setKeepVisible);
    };

    const submenuStyle = buildSubmenuStyle(expanded, keepVisible, maxHeight);
    return { submenuRef, submenuStyle, handleTransitionEnd };
};

/** 更新 submenu 展開/收合動畫狀態。 */
const updateCollapseAnimation = (
    expanded: boolean,
    keepVisible: boolean,
    submenuRef: React.MutableRefObject<HTMLUListElement | null>,
    phaseRef: React.MutableRefObject<CollapsePhase>,
    setMaxHeight: React.Dispatch<React.SetStateAction<string>>,
    setKeepVisible: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) | undefined =>
{
    const el = submenuRef.current;
    if (!el || typeof window === "undefined") return undefined;

    if (expanded) return startOpeningAnimation(el, phaseRef, setMaxHeight, setKeepVisible);
    return startClosingAnimation(el, keepVisible, phaseRef, setMaxHeight, setKeepVisible);
};

/** 啟動展開動畫。 */
const startOpeningAnimation = (
    el: HTMLUListElement,
    phaseRef: React.MutableRefObject<CollapsePhase>,
    setMaxHeight: React.Dispatch<React.SetStateAction<string>>,
    setKeepVisible: React.Dispatch<React.SetStateAction<boolean>>,
): () => void =>
{
    setKeepVisible(true);
    phaseRef.current = "opening";
    const rafId = window.requestAnimationFrame(() => setMaxHeight(`${el.scrollHeight}px`));
    return () => window.cancelAnimationFrame(rafId);
};

/** 啟動收合動畫。 */
const startClosingAnimation = (
    el: HTMLUListElement,
    keepVisible: boolean,
    phaseRef: React.MutableRefObject<CollapsePhase>,
    setMaxHeight: React.Dispatch<React.SetStateAction<string>>,
    setKeepVisible: React.Dispatch<React.SetStateAction<boolean>>,
): (() => void) | undefined =>
{
    if (!keepVisible)
    {
        setMaxHeight("0px");
        phaseRef.current = "idle";
        return undefined;
    }

    phaseRef.current = "closing";
    setMaxHeight(`${el.scrollHeight}px`);
    const rafId = window.requestAnimationFrame(() => setMaxHeight("0px"));
    return () => window.cancelAnimationFrame(rafId);
};

/** submenu 動畫結束後收尾。 */
const handleCollapseTransitionEnd = (
    e: TransitionEvent<HTMLUListElement>,
    phaseRef: React.MutableRefObject<CollapsePhase>,
    setMaxHeight: React.Dispatch<React.SetStateAction<string>>,
    setKeepVisible: React.Dispatch<React.SetStateAction<boolean>>,
): void =>
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

/** 建立 submenu 動畫樣式。 */
const buildSubmenuStyle = (expanded: boolean, keepVisible: boolean, maxHeight: string): CSSProperties =>
{
    return {
        display: keepVisible ? "block" : undefined,
        overflow: "hidden",
        maxHeight,
        opacity: expanded ? 1 : 0,
        transition: "max-height 360ms ease, opacity 260ms ease",
        willChange: "max-height, opacity",
        pointerEvents: expanded ? "auto" : "none",
    };
};
// #endregion
