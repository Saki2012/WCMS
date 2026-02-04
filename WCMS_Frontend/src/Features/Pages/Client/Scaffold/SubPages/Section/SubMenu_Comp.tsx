import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import { isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import clsx from "clsx";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

type SubMenuProps = { lang: Lang; site: INormSite; node: INormNode; maxDepth?: number };

type BootstrapCollapseCtor = new (el: Element, opt: { toggle: boolean }) => { show(): void; hide(): void };
type BootstrapObj = { Collapse?: BootstrapCollapseCtor };
type WindowWithBootstrap = Window & { bootstrap?: BootstrapObj };

/** 依照 lang / site / node 取得當前節點底下的 menu */
const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] => {
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
    const clean = (path ?? "/").split("?")[0].split("#")[0];
    if (clean.length > 1 && clean.endsWith("/")) return clean.slice(0, -1);
    return clean || "/";
};

/** 去掉網址最前面的 /:lang（例如 /en/news... → /news...），讓比對與語系無關 */
const stripLangPrefixFromPath = (path: string): string => {
    const p = normalizePath(path);
    const segs = p.split("/").filter(Boolean);
    if (segs.length === 0) return "/";

    const first = segs[0]?.toLowerCase();
    if (!isSupportedLang(first)) return p;

    const rest = segs.slice(1).join("/");
    return rest ? `/${rest}` : "/";
};

/** 判斷目前路徑是否落在 itemUrl（支援 /a 與 /a/...，且忽略 /:lang 前綴） */
const isUrlMatch = (currentPath: string, itemUrl: string | undefined): boolean => {
    if (!itemUrl) return false;
    if (isExternalUrl(itemUrl)) return false;

    const cur = stripLangPrefixFromPath(currentPath);
    const url = stripLangPrefixFromPath(itemUrl);

    if (cur === url) return true;
    if (url !== "/" && cur.startsWith(`${url}/`)) return true;
    return false;
};

/** 計算：activeIds（leaf）/ expandedIdsByPath（父節點展開） */
const calcActiveAndExpanded = (items: MenuItemData[], pathname: string) => {
    const activeIds = new Set<string>();
    const expandedIdsByPath = new Set<string>();

    const dfs = (item: MenuItemData): boolean => {
        const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
        const selfActive = !hasChildren && isUrlMatch(pathname, item.Url);

        let hasActiveInSubtree = selfActive;

        if (hasChildren) {
            for (const child of item.SubItem) {
                if (dfs(child)) hasActiveInSubtree = true;
            }
        }

        if (selfActive) activeIds.add(item.Id);
        if (hasChildren && hasActiveInSubtree) expandedIdsByPath.add(item.Id);

        return hasActiveInSubtree;
    };

    items.forEach(dfs);
    return { activeIds, expandedIdsByPath };
};

/** 取得 SpecCode */
const getSpecCode = (): string => String(import.meta.env.VITE_SPEC_CODE ?? "");

/** 取得 bootstrap.Collapse（有載入 bootstrap js 才會有） */
const getBootstrapCollapse = (): BootstrapCollapseCtor | null => {
    const w = window as WindowWithBootstrap;
    const ctor = w.bootstrap?.Collapse;
    return ctor ?? null;
};

/** 用 bootstrap collapse show/hide（沒有 bootstrap 時退化成 class 切換） */
const toggleSubmenu = (submenu: Element, open: boolean) => {
    const Collapse = getBootstrapCollapse();
    if (Collapse) {
        const c = new Collapse(submenu, { toggle: false });
        if (open) c.show();
        else c.hide();
        return;
    }
    submenu.classList.toggle("show", open);
};

/** 遞迴關閉：自己與底下所有 submenu */
const closeRecursively = (submenu: Element) => {
    toggleSubmenu(submenu, false);
    submenu.querySelectorAll(".submenu.show").forEach((s) => toggleSubmenu(s, false));
    submenu.querySelectorAll(".list-group-item.open").forEach((a) => a.classList.remove("open"));
};

/** 關閉其他第一層（prototype 行為：第一層互斥） */
const closeOtherFirstLevels = (rootList: Element, currentSubmenu: Element) => {
    rootList.querySelectorAll(".submenu.show").forEach((openSub) => {
        if (openSub !== currentSubmenu) closeRecursively(openSub);
    });
};

/** 初始展開：把 active 的 leaf 往上展開到最外層（符合你現在頁面需求） */
const openPathToActive = (root: HTMLElement) => {
    // 宣告變數
    const activeLeaf = root.querySelector<HTMLElement>(".list-group-item.active");
    if (!activeLeaf) return;

    let cur: Element | null = activeLeaf;

    // 執行 function：一路往上找父層 submenu，逐層打開
    while (cur) {
        const li = cur.closest("li");
        if (!li) break;

        const parentUl = li.parentElement as HTMLElement | null;
        if (!parentUl) break;

        if (parentUl.classList.contains("submenu")) {
            toggleSubmenu(parentUl, true);

            const hostLi = parentUl.closest("li");
            const trigger = hostLi?.querySelector<HTMLElement>(":scope > .list-group-item") ?? null;
            if (trigger) trigger.classList.add("open");
        }

        // 執行 function：往上推進下一層（上一個 ul 的 li）
        const next = parentUl.closest("li")?.closest("ul") ?? null;
        cur = next;
    }
};

/** =========================
 *  Spec 1816 專用 Component
 *  - Prototype: event delegation + bootstrap collapse
 *  ========================= */
const SubMenu_1816_Comp: React.FC<{
    menuItems: MenuItemData[];
    activeIds: Set<string>;
}> = (props) => {
    // 宣告變數
    const { menuItems, activeIds } = props;
    const navRef = useRef<HTMLElement | null>(null);

    const isItemActive = (item: MenuItemData) => activeIds.has(item.Id);

    /** render：leaf（內/外連結） */
    const renderLeaf = (item: MenuItemData, active: boolean): React.ReactNode => {
        const target = item.URL_Open;
        if (!item.Url) {
            return <span className={clsx("list-group-item", active && "active")}>{item.SrcData}</span>;
        }
        if (isExternalUrl(item.Url)) {
            return (
                <a
                    href={item.Url}
                    target={target}
                    rel={target === "_blank" ? "noopener noreferrer" : undefined}
                    className={clsx("list-group-item", active && "active")}
                >
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
                {item.SrcData}
            </LangNavLink>
        );
    };

    /** render：父節點（prototype：用 <a>，並靠 open class / collapse 動畫） */
    const renderParent = (item: MenuItemData): React.ReactNode => {
        return (
            <a href="javascript:void(0);" role="button" className="list-group-item collapsed">
                {item.SrcData}
            </a>
        );
    };

    /** render：items（submenu 一律只給 "submenu collapse"，show 交給 bootstrap） */
    const renderItems = (items: MenuItemData[]): React.ReactNode =>
        items.map((item, idx) => {
            // 宣告變數
            const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
            const key = `${item.Id}-${idx}`;
            const active = isItemActive(item);

            // return：DOM（注意：有子層的父節點 nextElementSibling 必須是 submenu）
            return (
                <li key={key} className={clsx("nav-item", hasChildren && "has-submenu")}>
                    {hasChildren ? renderParent(item) : renderLeaf(item, active)}
                    {hasChildren && <ul className="submenu collapse">{renderItems(item.SubItem!)}</ul>}
                </li>
            );
        });

    /** 綁定 prototype 行為：active/open/互斥/遞迴收合/動畫 */
    useEffect(() => {
        // 宣告變數
        const nav = navRef.current;
        if (!nav) return;

        const rootList = nav.querySelector("ul#nav_accordion");
        if (!rootList) return;

        const onClick = (e: MouseEvent) => {
            // 宣告變數
            const target = e.target as Element | null;
            if (!target) return;

            const item = target.closest(".list-group-item");
            if (!item) return;

            // 執行 function：active 標記（prototype：永遠只留最後點的那個）
            rootList.querySelectorAll(".list-group-item.active").forEach((a) => a.classList.remove("active"));
            item.classList.add("active");

            // 執行 function：找 submenu（必須是 nextElementSibling）
            const submenu = item.nextElementSibling;
            if (!submenu || !submenu.classList.contains("submenu")) return;

            // return：阻止導頁
            e.preventDefault();

            const isOpen = submenu.classList.contains("show");
            if (isOpen) {
                // close：遞迴關閉 + 移除 open
                closeRecursively(submenu);
                item.classList.remove("open");
                item.classList.add("collapsed");
                return;
            }

            // open：第一層互斥
            const parentUl = item.closest("ul");
            if (parentUl?.classList.contains("list-group")) closeOtherFirstLevels(rootList, submenu);

            toggleSubmenu(submenu, true);
            item.classList.add("open");
            item.classList.remove("collapsed");
        };

        // 執行 function：事件委派綁定
        nav.addEventListener("click", onClick);

        // 執行 function：初始展開 active path（讓你現在頁面「進來就對齊」）
        openPathToActive(nav);

        // return：cleanup
        return () => {
            nav.removeEventListener("click", onClick);
        };
    }, [menuItems]);

    // return：1816 prototype DOM
    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12">
            <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 px-0 SubPage-leftMenu">
                <div id="SubPage-SidebarMenu">
                    <nav ref={navRef} className="sidebar mb-5">
                        <ul className="nav list-group" id="nav_accordion">
                            {renderItems(menuItems)}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    );
};

/** =========================
 *  Default Component（不影響其他 case）
 *  - 仍維持 React state 控制 show
 *  ========================= */
const SubMenu_Default_Comp: React.FC<{
    menuItems: MenuItemData[];
    activeIds: Set<string>;
    expandedIdsByPath: Set<string>;
}> = (props) => {
    // 宣告變數
    const { menuItems, activeIds, expandedIdsByPath } = props;
    const [expandedIds, setExpandedIds] = useState<Set<string>>(expandedIdsByPath);

    useEffect(() => {
        setExpandedIds(new Set(expandedIdsByPath));
    }, [expandedIdsByPath]);

    const isItemActive = (item: MenuItemData) => activeIds.has(item.Id);

    /** 切換展開/收合 */
    const toggleExpand = (id: string) => {
        setExpandedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    /** render：leaf（內/外連結） */
    const renderLeaf = (item: MenuItemData, active: boolean): React.ReactNode => {
        const target = item.URL_Open;
        if (!item.Url) {
            return <span className={clsx("list-group-item", active && "active")}>{item.SrcData}</span>;
        }
        if (isExternalUrl(item.Url)) {
            return (
                <a
                    href={item.Url}
                    target={target}
                    rel={target === "_blank" ? "noopener noreferrer" : undefined}
                    className={clsx("list-group-item", active && "active")}
                >
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
                {item.SrcData}
            </LangNavLink>
        );
    };

    /** render：items（default：用 show class 控制） */
    const renderItems = (items: MenuItemData[]): React.ReactNode =>
        items.map((item, idx) => {
            // 宣告變數
            const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
            const key = `${item.Id}-${idx}`;
            const active = isItemActive(item);
            const expanded = hasChildren && expandedIds.has(item.Id);

            // return：DOM
            return (
                <li key={key} className={clsx("nav-item", hasChildren && "has-submenu")}>
                    {hasChildren ? (
                        <button
                            type="button"
                            className="list-group-item"
                            onClick={() => toggleExpand(item.Id)}
                            aria-expanded={expanded}
                        >
                            {item.SrcData}
                        </button>
                    ) : (
                        renderLeaf(item, active)
                    )}

                    {hasChildren && (
                        <ul className={clsx("submenu", "collapse", expanded && "show")}>{renderItems(item.SubItem!)}</ul>
                    )}
                </li>
            );
        });

    if (!menuItems.length) return null;

    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12">
            <nav className="sidebar">
                <ul className="list-group">{renderItems(menuItems)}</ul>
            </nav>
        </div>
    );
};

export const SubMenu_Comp: React.FC<SubMenuProps> = (props) => {
    // 宣告變數
    const { lang, site, node, maxDepth = 3 } = props;
    const location = useLocation();
    const specCode = getSpecCode();
    const isSpec1816 = specCode === "1816";

    // 執行 function：依照 lang / site / node 取得 menu
    const menuItems = useMemo(() => GetMenuData(lang, site, node, maxDepth), [lang, site, node, maxDepth]);

    // 執行 function：根據目前路由計算 active 與「應該展開」的父節點
    const { activeIds, expandedIdsByPath } = useMemo(
        () => calcActiveAndExpanded(menuItems, location.pathname),
        [menuItems, location.pathname],
    );

    if (!menuItems.length) return null;

    // return：只影響 1816
    if (isSpec1816) {
        return <SubMenu_1816_Comp menuItems={menuItems} activeIds={activeIds} />;
    }

    // return：其他 case 不變
    return <SubMenu_Default_Comp menuItems={menuItems} activeIds={activeIds} expandedIdsByPath={expandedIdsByPath} />;
};
