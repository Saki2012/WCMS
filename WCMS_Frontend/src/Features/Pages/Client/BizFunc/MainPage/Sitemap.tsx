import React, { useMemo } from "react";
import type { Lang } from "@/SysCore/i18n/lang";
import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import { LangNavLink } from "@/SysCore/i18n/LangLink";

/**
 * Sitemap.tsx
 * - DOM 結構對標 prototype：sitemap.html（從 ContentPlaceContent_ContentConentA 內部開始，但不包含該 div）
 * - 項目資料使用 site info（props.site.treeByLang）渲染
 */

const getInternalTo = (siteIndex: string, absSegments?: string[] | null): string => {
    // 組內部連結：/{siteIndex}/{...segments}
    const segs = (absSegments ?? []).filter(Boolean);
    return `${siteIndex === "" ? "" : `/${siteIndex}`}${segs.length > 0 ? `/${segs.join("/")}` : ""}`;
};

const normalizeNodes = (nodes: INormNode[], includeHidden: boolean): INormNode[] => {
    // 過濾節點（預設只顯示 isShowOnMenu=true）
    const filtered = includeHidden ? nodes : nodes.filter((n) => n.isShowOnMenu);
    return filtered.map((n) => ({
        ...n,
        children: normalizeNodes(n.children ?? [], includeHidden),
    }));
};

const getExternalHref = (node: INormNode): string | null => {
    // 取外連網址（避免 any）
    if (node.type !== "redirect-external") return null;
    const candidate = (node as INormNode & { redirectTo?: unknown }).redirectTo;
    if (typeof candidate === "string" && candidate) return candidate;
    return null;
};

const renderNodeLink = (siteIndex: string, node: INormNode): React.ReactNode => {
    // 依 node 型別輸出 Link（外連用 <a>，內連用 LangNavLink）
    const text = node.title ?? "";
    const target = node.windowTarget === 1 ? "_blank" : "_self";
    const rel = node.windowTarget === 1 ? "noopener noreferrer" : undefined;

    const href = getExternalHref(node);
    if (href) {
        return (
            <a href={href} target={target} rel={rel} title={text} style={{ color: "inherit", textDecoration: "none" }}>
                {text}
            </a>
        );
    }

    const to = getInternalTo(siteIndex, node.absSegments);
    return (
        <LangNavLink to={to} target={target} rel={rel} title={text} style={{ color: "inherit", textDecoration: "none" }}>
            {text}
        </LangNavLink>
    );
};

const collectLeafNodes = (nodes: INormNode[]): INormNode[] => {
    // 將任意深度 children 收斂成 leaf list（對標 prototype 的「最終連結列表」）
    const result: INormNode[] = [];

    const walk = (n: INormNode) => {
        const kids = n.children ?? [];
        if (kids.length === 0) {
            result.push(n);
            return;
        }
        kids.forEach(walk);
    };

    nodes.forEach(walk);
    return result;
};

const KeyboardGuide = (props: { lang: Lang }) => {
    const isEn = props.lang === "en";

    return (
        <div className="keyboard-guide p-xl-5 p-4 mb-5">
            {/* 說明文字 */}
            <p className="mb-4">
                {isEn
                    ? "This page provides the site navigation structure and common keyboard shortcuts."
                    : "本頁提供本網站的導覽架構，並說明常用鍵盤操作方式。"}
            </p>

            {/* 快捷鍵區塊 */}
            <div className="row g-0">
                <div className="col-xl-4 col-12 guide-box">
                    <div className="guide-item right-border">
                        <div className="mb-2">
                            <span className="key-badge">Home</span>
                            {isEn ? " / " : "或"}
                            <span className="key-badge">End</span>
                        </div>
                        <div className="mt-3">
                            {isEn ? "Jump to the first or last item." : "可直接跳至資料第一筆或最後一筆。"}
                        </div>
                    </div>
                </div>

                <div className="col-xl-6 col-12 guide-box top-border">
                    <div className="guide-item me-5">
                        <div className="mb-2">
                            <span className="key-badge">Tab</span>
                        </div>
                        <div className="mt-3">{isEn ? "Move to the next link." : "依序移動到下一個連結項目。"}</div>
                    </div>

                    <div className="guide-item right-border">
                        <div className="mb-2">
                            <span className="key-badge">Shift</span> + <span className="key-badge">Tab</span>
                        </div>
                        <div className="mt-3">{isEn ? "Move to the previous link." : "移動到上一個連結項目。"}</div>
                    </div>
                </div>

                <div className="col-xl-2 col-12 guide-box top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Ctrl</span> + <span className="key-badge">P</span>
                        </div>
                        <div className="mt-3">{isEn ? "Print this page." : "列印本頁資訊。"}</div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const SiteMapSection = (props: { siteIndex: string; node: INormNode }) => {
    // 宣告變數
    const groups = props.node.children ?? [];

    return (
        <div className="sitemap-section">
            <p className="sitemap-title">
                <span style={{ color: "inherit" }}>
                    {renderNodeLink(props.siteIndex, props.node)}
                </span>
            </p>
            <div className="sitemap-divider"></div>

            <div className="row">
                {groups.map((g) => {
                    const leaves = collectLeafNodes(g.children ?? []);
                    const hasLeaf = leaves.length > 0;

                    return (
                        <div key={String(g.id)} className="col-lg-4 col-md-6 pe-2 mt-sm-3 mt-2">
                            <div className="group-title">
                                <span style={{ color: "inherit" }}>
                                    {renderNodeLink(props.siteIndex, g)}
                                </span>
                            </div>

                            <ul className="sitemap-list">
                                {hasLeaf
                                    ? leaves.map((leaf) => (
                                        <li key={String(leaf.id)}>{renderNodeLink(props.siteIndex, leaf)}</li>
                                    ))
                                    : <li>{renderNodeLink(props.siteIndex, g)}</li>}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export const Sitemap = (props: { lang: Lang; site: INormSite; includeHidden?: boolean }) => {
    // 宣告變數：roots
    const roots = useMemo<INormNode[]>(() => {
        const fromSite = props.site.treeByLang?.[props.lang] ?? [];
        return normalizeNodes(fromSite, !!props.includeHidden);
    }, [props.site, props.lang, props.includeHidden]);

    // return：不包 ContentPlaceContent_ContentConentA（由外層 SubPage/容器負責）
    return (
        <>
            <KeyboardGuide lang={props.lang} />

            {roots.map((root) => (
                <SiteMapSection key={String(root.id)} siteIndex={props.site.siteIndex} node={root} />
            ))}
        </>
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
        path: SITEMAP_SEGMENT,
        type: "module",
        windowTarget: 0,
        isShowOnMenu: false,
        children: [],
        parentId: null,
        rootId: SITEMAP_NODE_ID,
        level: 0,
        absSegments: [SITEMAP_SEGMENT],
        absIds: [SITEMAP_NODE_ID],
    };
};
