import { GetMenuData } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode } from "@/Features/Pages/Client/Route/Site-Routing";
import { Accesskey } from "@/Features/Pages/Client/Scaffold/MainFrame/Accesskey/Accesskey";
import type { SubMenuCompProps } from "@/Features/Pages/Client/Scaffold/SubPages/Module/SubMenu/SubMenu_Comp";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { isSupportedLang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import { type CSSProperties, type MouseEvent, type ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

// #region Property
type UrlMatchType = "exact" | "ancestor" | null;

interface SideMenuProps
{
    title: string;
    items: MenuItemData[];
    pathname: string;
    activeNodeId: string;
    lang: SubMenuCompProps["lang"];
}
// #endregion

// #region Public
/** 1810 子頁左側選單，透過 Spec slot 覆寫 Feature 共用版。 */
export const SubMenu_Comp = (props: SubMenuCompProps) =>
{
    // 宣告變數
    const maxDepth = props.maxDepth ?? 3;
    const location = useLocation();
    const menuItems = useMemo(() => GetMenuData(props.lang, props.site, props.node, maxDepth), [props.lang, props.site, props.node, maxDepth]);
    const title = useMemo(() => getCurrentNodeTitle(props), [props]);

    // return
    if (!menuItems.length) return null;

    return <SideMenuComp title={title} items={menuItems} pathname={location.pathname} activeNodeId={String(props.node.id)} lang={props.lang} />;
};
// #endregion

// #region Section
/** 1810 左側選單外框。 */
const SideMenuComp = (props: SideMenuProps) =>
{
    // 宣告變數
    const { activeIds, expandedIdsByPath } = useMemo(() => calcActiveAndExpanded(props.items, props.pathname, props.activeNodeId), [props.items, props.pathname, props.activeNodeId]);
    const { expandedIds, toggleExpand } = useExpandedMenuState(props.items, props.pathname, expandedIdsByPath);

    // return
    if (!props.items.length) return null;

    return (
        <div className="col-lg-2 col-md-12 col-sm-12 col-12">
            <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 page-leftmenu">
                <Accesskey type="L" lang={props.lang} />
                <h2>{props.title}</h2>
                <p></p>
                <nav className="Left-Second-navBox" aria-label={props.title}>
                    <ul id="Left-SecondMenu">
                        <MenuItems items={props.items} activeIds={activeIds} expandedIds={expandedIds} toggleExpand={toggleExpand} />
                    </ul>
                </nav>
            </div>
        </div>
    );
};

/** 1810 選單項目。 */
const MenuItems = (props: { items: MenuItemData[]; activeIds: Set<string>; expandedIds: Set<string>; toggleExpand: (itemId: string) => void; depth?: number; }) =>
{
    // 宣告變數
    const depth = props.depth ?? 1;

    // return
    return (
        <>
            {props.items.map((item, idx) => (
                <MenuItemComp
                    key={`${item.Id}-${idx}`}
                    item={item}
                    index={idx}
                    depth={depth}
                    activeIds={props.activeIds}
                    expandedIds={props.expandedIds}
                    toggleExpand={props.toggleExpand}
                />
            ))}
        </>
    );
};

/** 1810 單一選單項目。 */
const MenuItemComp = (props: { item: MenuItemData; index: number; depth: number; activeIds: Set<string>; expandedIds: Set<string>; toggleExpand: (itemId: string) => void; }) =>
{
    // 宣告變數
    const hasSub = hasSubItems(props.item);
    const expanded = hasSub && props.expandedIds.has(props.item.Id);
    const active = props.activeIds.has(props.item.Id);
    const liClass = getSideMenuLiClass(active || expanded);

    const handleToggle = (e: MouseEvent<HTMLAnchorElement>) =>
    {
        // 執行 function
        e.preventDefault();
        props.toggleExpand(props.item.Id);
        blurToggleLinkOnMouse(e);
    };

    // return
    return (
        <li className={liClass}>
            {hasSub
                ? <ParentMenuLink item={props.item} expanded={expanded} active={active} onClick={handleToggle} />
                : <LeafMenuLink item={props.item} active={active} />}
            {hasSub && (
                <AnimatedCollapseList expanded={expanded} className={getSideMenuChildUlClass(props.depth + 1)}>
                    <MenuItems items={props.item.SubItem} activeIds={props.activeIds} expandedIds={props.expandedIds} toggleExpand={props.toggleExpand} depth={props.depth + 1} />
                </AnimatedCollapseList>
            )}
        </li>
    );
};

/** 1810 父層選單連結。 */
const ParentMenuLink = (props: { item: MenuItemData; expanded: boolean; active: boolean; onClick: (e: MouseEvent<HTMLAnchorElement>) => void; }) =>
{
    // return
    return (
        <a href="#" className={clsx("a-focus", props.active && "active")} onMouseDown={preventMenuMouseFocus} onClick={props.onClick} aria-expanded={props.expanded} aria-current={props.active ? "page" : undefined}>
            {props.item.SrcData}
            <i className={clsx("fa", props.expanded ? "fa-angle-down" : "fa-angle-right", "arrow")} aria-hidden="true"></i>
        </a>
    );
};

/** 1810 葉節點選單連結。 */
const LeafMenuLink = (props: { item: MenuItemData; active: boolean; }) =>
{
    // 宣告變數
    const target = props.item.URL_Open;

    // return
    if (props.item.Url === "#")
    {
        return (
            <a href="#" title={props.item.SrcData} className={clsx(props.active && "active", "flex-nowrap")} aria-current={props.active ? "page" : undefined} onMouseDown={preventMenuMouseFocus} onClick={preventSafeMenuLinkClick}>
                {props.item.SrcData}
            </a>
        );
    }

    if (isExternalUrl(props.item.Url))
    {
        return (
            <a href={props.item.Url} title={props.item.SrcData} target={target} rel={target === "_blank" ? "noopener noreferrer" : undefined} className={clsx(props.active && "active", "flex-nowrap")} aria-current={props.active ? "page" : undefined} onMouseDown={preventMenuMouseFocus} onClick={blurToggleLinkOnMouse}>
                {renderLinkIcon(props.item.Url)}
                {props.item.SrcData}
            </a>
        );
    }

    return (
        <LangNavLink to={props.item.Url} title={props.item.SrcData} target={target} className={({ isActive }) => clsx((isActive || props.active) && "active")} aria-current={props.active ? "page" : undefined} onMouseDown={preventMenuMouseFocus} onClick={blurToggleLinkOnMouse}>
            {props.item.SrcData}
        </LangNavLink>
    );
};

/** 1810 子選單展開容器，改用 max-height 避免 BS5 collapse display:none 破壞動畫。 */
const AnimatedCollapseList = (props: { expanded: boolean; className: string; children: ReactNode; }) =>
{
    // 宣告變數
    const listRef = useRef<HTMLUListElement>(null);
    const [contentHeight, setContentHeight] = useState<number>(0);
    const collapseStyle = getSmoothCollapseStyle(props.expanded, contentHeight);

    // 執行 function
    useEffect(() => updateSmoothCollapseHeight(listRef.current, setContentHeight), [props.children, props.expanded]);
    useEffect(() => watchSmoothCollapseHeight(listRef.current, setContentHeight), [props.children]);
    useEffect(() => syncCollapseFocusable(listRef.current, props.expanded), [props.expanded, props.children]);

    // return
    return (
        <ul
            ref={listRef}
            className={clsx(props.className, "wcms-1810-sidemenu-collapse", props.expanded && "in show")}
            style={collapseStyle}
            aria-hidden={!props.expanded}
        >
            {props.children}
        </ul>
    );
};

// #endregion

// #region Private


/** 阻止 Preview fake node 連結導頁。 */
const preventSafeMenuLinkClick = (e: MouseEvent<HTMLAnchorElement>): void =>
{
    // 執行 function
    e.preventDefault();
    blurToggleLinkOnMouse(e);
};

/** 取得平滑收合樣式。 */
const getSmoothCollapseStyle = (expanded: boolean, contentHeight: number): CSSProperties =>
{
    // return
    return {
        maxHeight: expanded ? `${contentHeight}px` : "0px",
        overflow: "hidden",
        transition: "max-height .35s ease",
    };
};

/** 更新目前子選單高度。 */
const updateSmoothCollapseHeight = (element: HTMLUListElement | null, setContentHeight: (height: number) => void): void =>
{
    // 執行 function
    if (!element) return;
    setContentHeight(element.scrollHeight);
};

/** 監聽子選單內容高度變化。 */
const watchSmoothCollapseHeight = (element: HTMLUListElement | null, setContentHeight: (height: number) => void) =>
{
    // 宣告變數
    if (!element || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => setContentHeight(element.scrollHeight));

    // 執行 function
    observer.observe(element);

    // return
    return () => observer.disconnect();
};

/** 收合時移除子選單焦點能力，避免鍵盤進入不可視連結。 */
const syncCollapseFocusable = (element: HTMLUListElement | null, expanded: boolean): void =>
{
    // 宣告變數
    const focusableList = element?.querySelectorAll<HTMLElement>("a, button, input, select, textarea, [tabindex]") ?? [];

    // 執行 function
    focusableList.forEach(node => setFocusableState(node, expanded));
};

/** 設定單一元素焦點狀態。 */
const setFocusableState = (element: HTMLElement, expanded: boolean): void =>
{
    // 執行 function
    if (expanded) element.removeAttribute("tabindex");
    else element.setAttribute("tabindex", "-1");
};

/** 阻止滑鼠點擊讓左側選單連結取得 focus，避免 SPA 殘留 click 色。 */
const preventMenuMouseFocus = (e: MouseEvent<HTMLAnchorElement>): void =>
{
    // 執行 function
    if (e.detail > 0) e.preventDefault();
};

/** 滑鼠點擊展開選單後移除 focus，避免視覺上被誤判為 active。 */
const blurToggleLinkOnMouse = (e: MouseEvent<HTMLAnchorElement>): void =>
{
    // 執行 function
    if (e.detail > 0) e.currentTarget.blur();
};

/** 取得目前節點標題。 */
const getCurrentNodeTitle = (props: SubMenuCompProps): string =>
{
    // 宣告變數
    const roots = props.site.treeByLang?.[props.lang];
    const localizedNode = findNodeById(roots, props.node.id);

    // return
    return localizedNode?.title ?? props.node.title;
};

/** 遞迴尋找指定 node。 */
const findNodeById = (nodes: INormNode[] | undefined, id: number): INormNode | undefined =>
{
    // 執行 function
    for (const n of nodes ?? [])
    {
        if (n.id === id) return n;
        const hit = findNodeById(n.children, id);
        if (hit) return hit;
    }

    // return
    return undefined;
};

/** 1810 子選單 ul class。 */
const getSideMenuChildUlClass = (depth: number): string =>
{
    // return
    return depth === 2 ? "leftmenuBox" : "";
};

/** 1810 選單 li class。 */
const getSideMenuLiClass = (isActive: boolean): string =>
{
    // return
    return clsx("m-link", isActive && "active");
};

/** 外部連結顯示圖示。 */
const renderLinkIcon = (url?: string | null): ReactNode =>
{
    // return
    return isExternalUrl(url) ? <i className="fa fa-link me-2"></i> : null;
};

/** 判斷是否有子選單。 */
const hasSubItems = (item: MenuItemData): boolean =>
{
    // return
    return !!item.SubItem?.length;
};

/** 判斷是否為外部網址。 */
const isExternalUrl = (url?: string | null): boolean =>
{
    // return
    return !!url && (/^https?:\/\//i.test(url) || url.startsWith("//"));
};

/** 建立 menu tree key。 */
const buildMenuTreeKey = (items: MenuItemData[]): string =>
{
    // return
    return items.map(item => `${item.Id}[${buildMenuTreeKey(item.SubItem ?? [])}]`).join("|");
};

/** 標準化路徑。 */
const normalizePath = (path: string): string =>
{
    // 宣告變數
    const clean = (path ?? "/").split("?")[0].split("#")[0];

    // return
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 移除語系路徑前綴。 */
const stripLangPrefixFromPath = (path: string): string =>
{
    // 宣告變數
    const p = normalizePath(path);
    const segs = p.split("/").filter(Boolean);
    const first = segs[0]?.toLowerCase();

    // return
    if (!first) return "/";
    if (!isSupportedLang(first)) return p;

    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};

/** 判斷目前網址與 menu URL 的關係。 */
const getUrlMatchType = (currentPath: string, itemUrl?: string): UrlMatchType =>
{
    // 宣告變數
    if (!itemUrl || itemUrl === "#" || isExternalUrl(itemUrl)) return null;

    const cur = stripLangPrefixFromPath(currentPath);
    const url = stripLangPrefixFromPath(itemUrl);

    // return
    if (cur === url) return "exact";
    if (url !== "/" && cur.startsWith(`${url}/`)) return "ancestor";
    return null;
};

/** 計算 active 節點與展開項目。 */
const calcActiveAndExpanded = (items: MenuItemData[], pathname: string, activeNodeId: string) =>
{
    // 宣告變數
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();

    const dfs = (item: MenuItemData): boolean =>
    {
        const matchType = getUrlMatchType(pathname, item.Url);
        const selfActive = item.Id === activeNodeId || matchType === "exact";
        let hasActiveInSubtree = selfActive || !!matchType;

        item.SubItem?.forEach(child =>
        {
            if (dfs(child)) hasActiveInSubtree = true;
        });

        if (selfActive) activeIds.add(item.Id);
        if (hasSubItems(item) && hasActiveInSubtree) expandedIdsByPath.add(item.Id);

        return hasActiveInSubtree;
    };

    // 執行 function
    items.forEach(dfs);

    // return
    return { activeIds, expandedIdsByPath };
};

/** 從展開清單移除指定分支。 */
const removeExpandedIdsInNode = (item: MenuItemData, next: Set<string>): void =>
{
    // 執行 function
    if (!hasSubItems(item)) return;

    next.delete(item.Id);
    item.SubItem.forEach(child => removeExpandedIdsInNode(child, next));
};

/** 移除指定分支的展開項目。 */
const removeExpandedBranch = (items: MenuItemData[], branchId: string, next: Set<string>): boolean =>
{
    // 執行 function
    for (const item of items)
    {
        if (item.Id === branchId)
        {
            removeExpandedIdsInNode(item, next);
            return true;
        }

        if (hasSubItems(item) && removeExpandedBranch(item.SubItem, branchId, next)) return true;
    }

    // return
    return false;
};

/** 關閉同層其他分支。 */
const closeSiblingBranches = (items: MenuItemData[], targetId: string, next: Set<string>): boolean =>
{
    // 執行 function
    for (const item of items)
    {
        if (item.Id === targetId)
        {
            items.forEach(sibling =>
            {
                if (sibling.Id === targetId) return;
                removeExpandedBranch(items, sibling.Id, next);
            });
            return true;
        }

        if (hasSubItems(item) && closeSiblingBranches(item.SubItem, targetId, next)) return true;
    }

    // return
    return false;
};

/** 合併目前展開與路徑展開項目。 */
const mergeExpandedIds = (prev: Set<string>, expandedIdsByPath: Set<string>): Set<string> =>
{
    // 宣告變數
    const next = new Set(prev);

    // 執行 function
    expandedIdsByPath.forEach(id => next.add(id));

    // return
    return next;
};

/** 關閉其他第一層分支。 */
const closeOtherTopLevelBranches = (menuItems: MenuItemData[], expandedIdsByPath: Set<string>, next: Set<string>): void =>
{
    // 執行 function
    menuItems.forEach(item =>
    {
        if (!hasSubItems(item)) return;
        if (expandedIdsByPath.has(item.Id)) return;
        removeExpandedBranch(menuItems, item.Id, next);
    });
};

/** 管理 1810 左側選單展開狀態。 */
const useExpandedMenuState = (menuItems: MenuItemData[], pathname: string, expandedIdsByPath: Set<string>) =>
{
    // 宣告變數
    const menuTreeKey = useMemo(() => buildMenuTreeKey(menuItems), [menuItems]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(expandedIdsByPath));

    // 執行 function
    useEffect(() =>
    {
        setExpandedIds(new Set(expandedIdsByPath));
    }, [menuTreeKey, expandedIdsByPath]);

    useEffect(() =>
    {
        setExpandedIds(prev =>
        {
            const next = mergeExpandedIds(prev, expandedIdsByPath);
            closeOtherTopLevelBranches(menuItems, expandedIdsByPath, next);
            return next;
        });
    }, [pathname, menuItems, expandedIdsByPath]);

    const toggleExpand = (itemId: string): void =>
    {
        setExpandedIds(prev =>
        {
            const next = new Set(prev);
            const isOpen = next.has(itemId);

            if (isOpen)
            {
                removeExpandedBranch(menuItems, itemId, next);
                return next;
            }

            closeSiblingBranches(menuItems, itemId, next);
            next.add(itemId);
            return next;
        });
    };

    // return
    return { expandedIds, toggleExpand };
};
// #endregion
