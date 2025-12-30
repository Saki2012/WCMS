import React from "react";
import type { Lang } from "@/SysCore/i18n/lang";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangNavLink } from "@/SysCore/i18n/LangLink";

type HeadingTag = "h3" | "h4" | "h5" | "h6";

const getHeadingTag = (level: number): HeadingTag => {
    // 控制層級對應標題 tag（符合可讀性也利於 AA）
    if (level <= 0) return "h3";
    if (level === 1) return "h4";
    if (level === 2) return "h5";
    return "h6";
};

const getInternalTo = (siteIndex: string, absSegments?: string[] | null): string => {
    // 組內部連結：/{siteIndex}/{...segments}
    const segs = (absSegments ?? []).filter(Boolean);
    return `${siteIndex === "" ? "" : `/${siteIndex}`}${segs.length > 0 ? `/${segs.join("/")}` : ""}`;
};

const normalizeNodes = (nodes: INormNode[], includeHidden: boolean): INormNode[] => {
    // 過濾節點（預設只顯示 isShowOnMenu=true）
    const filtered = includeHidden ? nodes : nodes.filter((n) => n.isShowOnMenu);
    return filtered.map((n) => ({ ...n, children: normalizeNodes(n.children ?? [], includeHidden), }));
};

const renderLink = (siteIndex: string, n: INormNode, text: string): React.ReactNode => {
    // 依 node 型別輸出 Link（外連用 <a>，內連用 LangNavLink）
    const target = n.windowTarget === 1 ? "_blank" : "_self";
    const rel = n.windowTarget === 1 ? "noopener noreferrer" : undefined;
    if (n.type === "redirect-external") {
        const href = (n as any).redirectTo ?? "#";
        return (
            <a href={href} target={target} rel={rel} title={text}>
                {text}
            </a>
        );
    }
    const to = getInternalTo(siteIndex, n.absSegments);
    return (
        <LangNavLink to={to} target={target} rel={rel} title={text}>
            {text}
        </LangNavLink>
    );
};

const renderNodes = (siteIndex: string, nodes: INormNode[], level: number): React.ReactNode => {
    // 遞迴渲染 sitemap 樹
    const Heading = getHeadingTag(level);
    const ulClass = `sitemap-list level-${Math.min(level + 1, 6)}`;
    return (
        <ul className={ulClass}>
            {nodes.map((n) => {
                const title = n.title ?? "";
                const kids = n.children ?? [];
                const hasKids = kids.length > 0;
                return (
                    <li key={String(n.id)}>
                        <Heading className="mt-0 mb-0">
                            {renderLink(siteIndex, n, title)}
                        </Heading>
                        {hasKids ? renderNodes(siteIndex, kids, level + 1) : null}
                    </li>
                );
            })}
        </ul>
    );
};

export const Sitemap = (props: { lang: Lang; site: INormSite; includeHidden?: boolean; }) => {
    // 取 roots：優先用 site.treeByLang，其次 fallback mock
    const roots = React.useMemo<INormNode[]>(() => {
        const fromSite = props.site.treeByLang?.[props.lang] ?? [];
        return normalizeNodes(fromSite, !!props.includeHidden);
    }, [props.site, props.lang, props.includeHidden]);

    const pageLabel = props.lang === "en" ? "Sitemap" : "網站導覽";

    return (
        <div className="container">
            {/* 導覽說明（保留 prototype 的資訊，但避免重複 H1；H1 交給 SubPage） */}
            <section className="sitemap-info">
                <h2 className="mt-0 mb-3">{pageLabel}</h2>

                <p className="mb-0">
                    {props.lang === "en"
                        ? "This guide helps you use keyboard shortcuts and navigate the site quickly."
                        : "本頁提供本網站的導覽架構，並說明常用鍵盤操作方式。"}
                </p>
                <ul className="mt-3 mb-0">
                    <li>{props.lang === "en" ? "Home/End: jump to start/end." : "Home 或 End：可直接跳至資料第一筆或最後一筆。"}</li>
                    <li>{props.lang === "en" ? "Tab: move to next link." : "Tab：依序移動到下一個連結項目。"}</li>
                    <li>{props.lang === "en" ? "Shift + Tab: move to previous link." : "Shift + Tab：移動到上一個連結項目。"}</li>
                    <li>{props.lang === "en" ? "Ctrl + P: print page." : "Ctrl + P：列印本頁資訊。"}</li>
                </ul>
            </section>
            <section className="sitemap-content mt-4">
                <nav aria-label={pageLabel}>
                    {renderNodes(props.site.siteIndex, roots, 0)}
                </nav>
            </section>
        </div>
    );
};




//////
export const SITEMAP_NODE_ID = -9999 as const;
export const SITEMAP_SEGMENT = "Sitemap" as const;
export const SitemapNode = (lang: Lang): INormNode => {
    return {
        id: SITEMAP_NODE_ID,
        title: lang === "en" ? "Sitemap" : "網站導覽",
        module: { progId: SITEMAP_SEGMENT },
        path: SITEMAP_SEGMENT, type: "module",
        windowTarget: 0, isShowOnMenu: false,
        children: [], parentId: null, rootId: SITEMAP_NODE_ID,
        level: 0, absSegments: [SITEMAP_SEGMENT], absIds: [SITEMAP_NODE_ID],
    };
};