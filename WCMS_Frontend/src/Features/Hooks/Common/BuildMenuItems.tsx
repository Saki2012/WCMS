import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ReactNode } from "react";

export const buildMenuItems = (nodes: INormNode[] = [], activeId?: number, currentDepth: number = 1, maxDepth: number = Infinity,): MenuItemData[] => {
    return nodes.filter(n => n.isShowOnMenu !== false).map(n => {
        const hasChildren = !!(n.children && n.children.length);
        const isActiveId = n.id === activeId;
        // 原本就有的 route path（對 module 用）
        const segments = (n.absSegments ?? []).filter(Boolean);
        const routePath = segments.length > 0 ? "/" + segments.map(s => encodeURIComponent(s)).join("/") : "#";
        const redirect = n.redirectTo ?? "";
        const isRedirectInternal = !!redirect && redirect.startsWith("/");
        const isModule = n.type === "module";
        const isInternalLink = n.type === "redirect-internal" && isRedirectInternal;
        const isInternal = isModule || isInternalLink;
        // ★ 真正要給 <Link>/<a> 用的網址（不再經過「導頁 route」）★
        const finalUrl = (() => {
            if (isInternalLink && redirect) {
                // 內站轉址：用後台填的 /xxxx 當 route
                return redirect;
            }
            if (!isInternal && redirect) {
                // 外站轉址：直接指向外部網址（https://...）
                return redirect;
            }
            // module 或沒有 redirectTo → 走自己的 route path
            return routePath;
        })();
        const target = (() => {
            switch (n.windowTarget) {
                case 1:
                    return "_blank";
                default:
                    return "_self";
            }
        })();
        const domContent = hasChildren && currentDepth < maxDepth ? (
            <>
                {n.title}
                <i className="fa fa-angle-right arrow" aria-hidden="true" />
            </>
        ) : <>{n.title}</>;
        // 內站（module + / 開頭的 redirect-internal）→ 用 Link，走 React Router
        // 外站（redirect-external 或非 / 開頭 redirect）→ 用 <a href=外部網址>
        const content: ReactNode = isInternal ? (
            <LangLink to={finalUrl} title={n.title} aria-current={isActiveId ? "page" : undefined}>
                {domContent}
            </LangLink>
        ) : (
            <a href={finalUrl} title={n.title} rel="noopener" target={target} aria-current={isActiveId ? "page" : undefined}>
                {domContent}
            </a>
        );
        const subItems = hasChildren && currentDepth < maxDepth ? buildMenuItems(n.children!, activeId, currentDepth + 1, maxDepth) : [];
        const item: MenuItemData = {
            Id: String(n.id),
            SrcData: n.title,
            Type: finalUrl && finalUrl !== "#" ? "url" : "module",
            Url: finalUrl,
            URL_Open: target,
            DOMContent: content,
            SubItem: subItems,
        };
        return item;
    });
};


export const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] => {
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};

// 取得「第 level 層」的節點（level=1 表示 root 的第一層子節點層級）
export const getAncestorAtLevel = (lang: Lang, site: INormSite, node: INormNode, level: number): INormNode | undefined => {
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