import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { MenuItemData } from "@/SysCore/Components/MenuList/MenuList_Data";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import type { ReactNode } from "react";

/**這支應該放在Feature Client，後去待處理 */

// #region Property
type MenuTarget = "_self" | "_blank";
// #endregion

// #region Public
/** 建立多層選單項目資料，並統一透過 LangLink 輸出連結。 */
export const buildMenuItems = (nodes: INormNode[] = [], activeId?: number, currentDepth: number = 1, maxDepth: number = Infinity): MenuItemData[] =>
{
    return nodes.filter(n => n.isShowOnMenu !== false).map(n => buildMenuItem(n, activeId, currentDepth, maxDepth));
};
/** 取得目前節點所在 root 底下的選單資料。 */
export const GetMenuData = (lang: Lang, site: INormSite, node: INormNode, maxDepth: number = Infinity): MenuItemData[] =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    const rootNode = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
    if (!rootNode) return [];
    return buildMenuItems(rootNode.children ?? [], node.id, 1, maxDepth);
};
/** 取得指定層級的上層節點，level=1 表示 root 的第一層子節點。 */
export const getAncestorAtLevel = (lang: Lang, site: INormSite, node: INormNode, level: number): INormNode | undefined =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    const root = roots.find(n => n.id === (node.rootId ?? roots[0]?.id));
    if (!root) return undefined;

    let depth = 1;
    let curChildren: INormNode[] = root.children ?? [];

    for (const id of (node.absIds ?? []).slice(1))
    {
        const next = curChildren.find(c => c.id === id);
        if (!next) break;
        if (depth === level) return next;
        curChildren = next.children ?? [];
        depth++;
    }

    return undefined;
};
// #endregion

// #region Protected
/** 建立單筆選單資料。 */
const buildMenuItem = (n: INormNode, activeId: number | undefined, currentDepth: number, maxDepth: number): MenuItemData =>
{
    const hasChildren = hasMenuChildren(n);
    const finalUrl = resolveFinalUrl(n);
    const target = resolveMenuTarget(n, finalUrl);
    const domContent = buildMenuContent(n, hasChildren, currentDepth, maxDepth);
    const subItems = hasChildren && currentDepth < maxDepth ? buildMenuItems(n.children ?? [], activeId, currentDepth + 1, maxDepth) : [];

    return {
        Id: String(n.id),
        SrcData: n.title,
        Type: finalUrl && finalUrl !== "#" ? "url" : "module",
        Url: finalUrl,
        URL_Open: target,
        DOMContent: buildLangMenuLink(n, finalUrl, target, n.id === activeId, domContent),
        SubItem: subItems,
    };
};
/** 建立 LangLink 選單連結。 */
const buildLangMenuLink = (n: INormNode, finalUrl: string, target: MenuTarget, isActiveId: boolean, children: ReactNode): ReactNode =>
{
    return <LangLink to={finalUrl} title={n.title} target={target} aria-current={isActiveId ? "page" : undefined}>{children}</LangLink>;
};
/** 建立選單顯示內容。 */
const buildMenuContent = (n: INormNode, hasChildren: boolean, currentDepth: number, maxDepth: number): ReactNode =>
{
    if (!hasChildren || currentDepth >= maxDepth) return <>{n.title}</>;

    return (
        <>
            {n.title}
            <i className="fa fa-angle-right arrow" aria-hidden="true" />
        </>
    );
};
/** 建立 module 節點的 route path。 */
const buildRoutePath = (n: INormNode): string =>
{
    const segments = (n.absSegments ?? []).filter(Boolean);
    return segments.length > 0 ? "/" + segments.map(s => encodeURIComponent(s)).join("/") : "#";
};
// #endregion

// #region Private
/** 判斷節點是否有子選單。 */
const hasMenuChildren = (n: INormNode): boolean =>
{
    return !!(n.children && n.children.length > 0);
};
/** 解析節點實際連結網址。 */
const resolveFinalUrl = (n: INormNode): string =>
{
    const redirect = n.redirectTo ?? "";
    const isInternalLink = n.type === "redirect-internal" && redirect.startsWith("/");
    if (isInternalLink && redirect) return redirect;
    if (n.type !== "module" && redirect) return redirect;

    return buildRoutePath(n);
};
/** 解析選單開啟方式，外部 http 連結預設另開。 */
const resolveMenuTarget = (n: INormNode, finalUrl: string): MenuTarget =>
{
    if (n.windowTarget === 1) return "_blank";
    return isExternalHttpUrl(finalUrl) ? "_blank" : "_self";
};
/** 判斷是否為 http / https / protocol-relative 外部網址。 */
const isExternalHttpUrl = (url: string): boolean =>
{
    return /^(https?:)?\/\//i.test(url);
};
// #endregion
