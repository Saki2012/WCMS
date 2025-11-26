import { buildMenuItems } from "@/Features/Hooks/Common/BuildMenuItems";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
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

        let cleanup: (() => void) | null = null;

        const bindBootstrapMenu = () => {
            const bs = (window as any).bootstrap;
            const CollapseCtor = bs?.Collapse as any;
            if (!CollapseCtor) {
                // bootstrap 還沒載好 → 等一下再試
                return false;
            }

            // 只抓「有子選單」的那種 list-group-item
            const items = Array.from(
                root.querySelectorAll<HTMLElement>(".sidebar .nav-item.has-submenu > .list-group-item")
            );

            const onItemClick = (e: Event) => {
                const element = e.currentTarget as HTMLElement;
                const nextEl = element.nextElementSibling as HTMLElement | null;

                // 處理 active 樣式
                if (!element.classList.contains("active")) {
                    root
                        .querySelectorAll<HTMLElement>(".sidebar .list-group-item.active")
                        .forEach((el) => el.classList.remove("active"));
                }
                element.classList.toggle("active");

                // 有 submenu 的才用 Collapse 做「滑動」展開/收合
                if (nextEl && nextEl.classList.contains("submenu")) {
                    e.preventDefault();

                    const isShown = nextEl.classList.contains("show");
                    const collapse = new CollapseCtor(nextEl, { toggle: false });

                    if (isShown) {
                        // 已經展開 → 收起
                        collapse.hide();
                    } else {
                        // 沒展開 → 展開
                        collapse.show();

                        // 關閉同層其它已展開的 submenu
                        const parent = element.closest("ul");
                        if (parent) {
                            parent
                                .querySelectorAll<HTMLElement>(".submenu.show")
                                .forEach((openSub) => {
                                    if (openSub === nextEl) return;

                                    new CollapseCtor(openSub, { toggle: false }).hide();

                                    const openTrigger = openSub.previousElementSibling as HTMLElement | null;
                                    if (openTrigger && openTrigger.classList.contains("list-group-item")) {
                                        openTrigger.classList.remove("active");
                                    }
                                });
                        }
                    }
                }
            };

            items.forEach((el) => el.addEventListener("click", onItemClick));

            // 記錄清理函式，unmount 或重新綁時移除事件
            cleanup = () => {
                items.forEach((el) => el.removeEventListener("click", onItemClick));
            };

            return true;
        };

        // 先試一次，看看 bootstrap 是否已經載好
        if (!bindBootstrapMenu()) {
            // 還沒載好 → 每 50ms 檢查一次，等到 bootstrap 掛上來為止
            const timer = window.setInterval(() => {
                if (bindBootstrapMenu()) {
                    window.clearInterval(timer);
                }
            }, 50);

            return () => {
                window.clearInterval(timer);
                cleanup?.();
            };
        }

        return () => {
            cleanup?.();
        };
    }, [props.lang, props.node.id, props.site]);


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
        const tar = item.URL_Open
        return (
            <li key={key} className={clsx("nav-item", `${hasChildren ? "has-submenu" : ""}`)}>
                {hasChildren ? <a className="list-group-item" onClick={() => { }}>{item.SrcData}</a> : <NavLink className="list-group-item" to={item.Url ?? ""} target={tar}>{item.SrcData}</NavLink>}
                {hasChildren && (<ul className="submenu collapse">{renderSubMenuItems(item.SubItem!)}</ul>)}
            </li>
        );
    });
