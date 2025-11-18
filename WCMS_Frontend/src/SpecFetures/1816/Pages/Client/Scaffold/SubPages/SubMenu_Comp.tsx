import { buildMenuItems } from "@/Features/Pages/Client/BizFunc/MainPage/SubPages";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";




const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] => {
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};

export const SubMenu_Comp = (props: { lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) => {

    const SIDE_MAX_DEPTH = 3;
    const sideMenuData: MenuItemData[] = GetMenuData(props.lang, props.site, props.node, SIDE_MAX_DEPTH);

    const sidebarRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        if (typeof window === "undefined") return;
        const root = sidebarRef.current;
        if (!root) return;
        const bs = (window as any).bootstrap;
        const Collapse = bs?.Collapse;
        // 如果沒載入 bootstrap JS，就不要綁
        if (!Collapse) return;
        const items = Array.from(root.querySelectorAll<HTMLElement>(".sidebar .list-group-item"));
        const onItemClick = (e: Event) => {
            const element = e.currentTarget as HTMLElement;
            const nextEl = element.nextElementSibling as HTMLElement | null;
            // 移除其它 active
            if (!element.classList.contains("active")) { root.querySelectorAll<HTMLElement>(".sidebar .list-group-item.active").forEach(el => el.classList.remove("active")); }
            element.classList.toggle("active");
            // 處理 submenu 展開/收合
            if (nextEl && nextEl.classList.contains("submenu")) {
                e.preventDefault();
                const isShown = nextEl.classList.contains("show");
                const collapse = new Collapse(nextEl, { toggle: false });
                if (isShown) { collapse.hide(); }
                else {
                    collapse.show();
                    // 關閉同層其它已展開的 submenu
                    const parent = element.closest("ul");
                    if (parent) {
                        parent.querySelectorAll<HTMLElement>(".submenu.show").forEach(openSub => {
                            if (openSub === nextEl) return;
                            new Collapse(openSub, { toggle: false }).hide();
                            const openTrigger = openSub.previousElementSibling as HTMLElement | null;
                            if (openTrigger && openTrigger.classList.contains("list-group-item")) { openTrigger.classList.remove("active"); }
                        });
                    }
                }
            }
        };
        // 綁定事件
        items.forEach(el => el.addEventListener("click", onItemClick));
        // 清掉事件
        return () => { items.forEach(el => el.removeEventListener("click", onItemClick)); };
    }, []);

    return (
        <div className="col-xl-2 col-lg-3 col-md-12 col-sm-12 col-12">
            <div id="ContentPlaceContent_ContentSubMenu" className="col-sm-12 col-12 + px-0 + SubPage-leftMenu ">
                <p className="lead"></p>
                <h2>{props.node.title}</h2>
                <div id="SubPage-SidebarMenu" ref={sidebarRef}>
                    <nav className="sidebar mb-5">
                        <ul className="nav list-group" id="nav_accordion">
                            {renderSubMenuItems(sideMenuData)}
                        </ul>
                    </nav>
                </div>
            </div>
        </div>
    )
}

const renderSubMenuItems = (items: MenuItemData[]): React.ReactNode =>
    items.map((item, idx) => {
        const hasChildren = !!(item.SubItem && item.SubItem.length > 0);
        const key = `${item.Id}-${idx}`;
        return (
            <li key={key} className={clsx("nav-item", `${hasChildren ? "has-submenu" : ""}`)}>
                {hasChildren ? <div className="list-group-item">{item.SrcData}</div> : <NavLink className="list-group-item" to={item.Url ?? ""}>{item.SrcData}</NavLink>}
                {hasChildren && (<ul className="submenu collapse">{renderSubMenuItems(item.SubItem!)}</ul>)}
            </li>
        );
    });
