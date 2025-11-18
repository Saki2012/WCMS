import { buildMenuItems } from "@/Features/Pages/Client/BizFunc/MainPage/SubPages";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

export const ThirdMenu_Comp = (props: { lang: Lang; site: INormSite; node: INormNode; backHref?: string; }) => {
    const SIDE_MAX_DEPTH = 3;
    const anchor = getAncestorAtLevel(props.lang, props.site, props.node, SIDE_MAX_DEPTH);
    const topMenuData: MenuItemData[] = buildMenuItems(anchor?.children ?? [], props.node.id);
    const tar = props.node.windowTarget === 0 ? "_self" : "_blank"

    const menuContainerRef = useRef<HTMLDivElement | null>(null);
    useEffect(() => {
        const container = menuContainerRef.current;
        if (!container) return;
        // 只抓第三層這個區塊裡的 list-group-item
        const links = Array.from(
            container.querySelectorAll<HTMLAnchorElement>(".Rightlist-group .list-group-item")
        );
        const handleClick = (ev: MouseEvent) => {
            ev.preventDefault();
            // 移除全部 active
            links.forEach(link => link.classList.remove("active"));
            // 對當前點擊的加上 active
            const current = ev.currentTarget as HTMLAnchorElement | null;
            if (current) {
                current.classList.add("active");
            }
        };
        // 綁定事件
        links.forEach(link => link.addEventListener("click", handleClick));
        // 卸載時移除事件監聽
        return () => {
            links.forEach(link => link.removeEventListener("click", handleClick));
        };
    }, []);
    if (!topMenuData || topMenuData.length === 0) return (<></>)
    return (
        <>
            <div id="ContentPlaceContent_ContentThirdMenu" className="col-sm-12 col-12 + px-0 + SubPage-RightMenu" ref={menuContainerRef}>
                <ul className="Rightlist-group">
                    {topMenuData && topMenuData.map((i) => {
                        return (
                            <li><NavLink className="list-group-item" to={i.Url} title={i.SrcData} target={tar}>{i.SrcData}</NavLink></li>
                        )
                    })}
                </ul>
            </div>
            <hr className="hr-my-5" />
        </>
    )
}


const getAncestorAtLevel = (lang: Lang, site: INormSite, node: INormNode, level: number): INormNode | undefined => {
    const roots = site.treeByLang?.[lang] ?? [];
    const root = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
    if (!root) return undefined;
    // 第一層從 root.children 開始算
    let depth = 1;
    let curNode: INormNode | undefined = root;
    let curChildren: INormNode[] = root.children ?? [];
    // absIds 依序是從上到下的節點 id（包含目前節點）
    for (const id of (node.absIds ?? []).slice(1)) {
        const next = curChildren.find(c => c.id === id);
        if (!next) break;
        if (depth === level) return next;      // 抵達指定層
        curNode = next;
        curChildren = next.children ?? [];
        depth++;
    }
    // 若實際深度不夠，回傳最接近的（最後找到的）節點
    return undefined;
};