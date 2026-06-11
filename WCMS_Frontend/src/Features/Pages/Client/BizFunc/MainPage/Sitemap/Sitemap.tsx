import type { INormNode, INormSite } from "@/Features/Pages/Client/Route/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import { LangLink, LangNavLink } from "@/SysCore/i18n/LangLink";
import React, { useMemo } from "react";
import "./Sitemap.css";

// #region Property
/** Sitemap 這頁自己的虛擬路由節點 - 以下 */
// 手動建立，路由節點定義、metadata、給 breadcrumb / routing / menu 用的資料，
// 這部分也可以獨立出去一隻檔案，命名為SitemapNode.ts
export const SITEMAP_NODE_ID = -9999 as const;

/** 網站導覽 */
export const SITEMAP_SEGMENT = "Sitemap" as const;

export const SitemapNode = (lang: Lang): INormNode =>
{
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
// #endregion

// #region Public
export const Sitemap = (props: { lang: Lang; site: INormSite; includeHidden?: boolean; }) =>
{
    // 宣告變數：roots
    const roots = useMemo<INormNode[]>(() =>
    {
        const fromSite = props.site.treeByLang?.[props.lang] ?? [];
        return normalizeNodes(fromSite, !!props.includeHidden);
    }, [props.site, props.lang, props.includeHidden]);

    // return：不包 ContentPlaceContent_ContentConentA（由外層 SubPage/容器負責）
    return (
        <>
            <KeyboardGuide lang={props.lang} />
            {roots.map((root) => <SiteMapSection key={String(root.id)} siteIndex={props.site.siteIndex} node={root} />)}
        </>
    );
};
// #endregion

// #region Section
// 主要DOM結構 - 上方info
const KeyboardGuide = (props: { lang: Lang; }) =>
{
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
            <div className="d-flex flex-wrap">
                <div className="guide-box right-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Home</span>
                            {isEn ? "  /  " : " 或 "}
                            <span className="key-badge">End</span>
                        </div>
                        <div className="mt-3">{isEn ? "Jump to the first or last item." : "可直接跳至資料第一筆或最後一筆。"}</div>
                    </div>
                </div>

                <div className="guide-box right-border top-border">
                    <div className="guide-item me-5">
                        <div className="mb-2">
                            <span className="key-badge">Tab</span>
                        </div>
                        <div className="mt-3">{isEn ? "Move to the next link." : "依序移動到下一個連結項目。"}</div>
                    </div>

                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Shift</span> + <span className="key-badge">Tab</span>
                        </div>
                        <div className="mt-3">{isEn ? "Move to the previous link." : "移動到上一個連結項目。"}</div>
                    </div>
                </div>

                <div className="guide-box right-border top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Ctrl</span> + <span className="key-badge">P</span>
                        </div>
                        <div className="mt-3">{isEn ? "Print this page." : "列印本頁資訊。"}</div>
                    </div>
                </div>
                <div className="guide-box top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Alt</span> + <span className="key-badge">S</span>
                        </div>
                        <div className="mt-3">{isEn ? "Website Search" : "網站搜尋"}</div>
                    </div>
                </div>
            </div>

            {/* 說明文字 */}
            <div className="row mt-4 mb-2">
                <div className="col-lg-6 col-12">
                    <p>
                        {isEn
                            ? (
                                <>
                                    This website is designed according to accessibility principles, and its main content is divided into four sections.
                                    <br />
                                    The accesskey settings for this website are as follows:
                                </>
                            )
                            : (
                                <>
                                    本網站依無障礙網頁設計原則建置，網站的主要內容分為四大區塊
                                    <br />
                                    本網站的快速鍵（Accesskey）設定如下：
                                </>
                            )}
                    </p>
                </div>
                <div className="col-lg-6 col-12">
                    <p>
                        {isEn
                            ? "(For Firefox browsers, you need to press Shift, e.g., Shift+Alt+U: top menu links area)"
                            : "(Firefox瀏覽器需加按Shift,如:Shift+Alt+U:上方選單連結區)"}
                    </p>
                </div>
            </div>

            {/* 快捷鍵區塊 */}
            <div className="d-flex flex-wrap">
                <div className="guide-box right-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Alt</span> + <span className="key-badge">U</span>
                        </div>
                        <div className="d-flex">
                            <div className="mt-3 me-2">❶</div>
                            <div>
                                <div className="mt-3">{isEn ? "Top Navigation Bar" : "上方導覽連結區"}</div>
                                <div className="mt-2">{isEn ? "This section lists the main links to this website." : "此區塊列有本網站主要連結。"}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="guide-box right-border top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Alt</span> + <span className="key-badge">C</span>
                        </div>
                        <div className="d-flex">
                            <div className="mt-3 me-2">❷</div>
                            <div>
                                <div className="mt-3">{isEn ? "Main Content Block" : "中央內容區塊"}</div>
                                <div className="mt-2">{isEn ? "This is the main content area of ​​this page." : "為本頁主要內容區。"}</div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="guide-box right-border top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Alt</span> + <span className="key-badge">L</span>
                        </div>
                        <div className="d-flex">
                            <div className="mt-3 me-2">❸</div>
                            <div className="mt-3">{isEn ? "Left Navigation Bar" : "左方導覽區塊"}</div>
                        </div>
                    </div>
                </div>
                <div className="guide-box top-border">
                    <div className="guide-item">
                        <div className="mb-2">
                            <span className="key-badge">Alt</span> + <span className="key-badge">Z</span>
                        </div>
                        <div className="d-flex">
                            <div className="mt-3 me-2">❹</div>
                            <div className="mt-3">{isEn ? "Website Footer" : "頁尾網站資訊"}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
// 主要DOM結構 - 下方menu
const SiteMapSection = (props: { siteIndex: string; node: INormNode; }) =>
{
    // 宣告變數
    const groups = props.node.children ?? [];
    return (
        <div className="sitemap-section">
            <p className="sitemap-title">
                <span style={{ color: "inherit" }}>{renderNodeLink(props.siteIndex, props.node)}</span>
            </p>
            <div className="sitemap-divider"></div>
            <div className="row">
                {groups.map((g) =>
                {
                    const leaves = collectLeafNodes(g.children ?? []);
                    const hasLeaf = leaves.length > 0;
                    return (
                        <div key={String(g.id)} className="col-lg-4 col-md-6 pe-2 mt-sm-3 mt-2">
                            <div className="group-title">
                                <span style={{ color: "inherit" }}>{renderNodeLink(props.siteIndex, g)}</span>
                            </div>
                            <ul className="sitemap-list">
                                {hasLeaf
                                    ? leaves.map((leaf) => <li key={String(leaf.id)}>{renderNodeLink(props.siteIndex, leaf)}</li>)
                                    : <li>{renderNodeLink(props.siteIndex, g)}</li>}
                            </ul>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};
// #endregion

// #region Protected
const renderNodeLink = (siteIndex: string, node: INormNode): React.ReactNode =>
{
    // 依 node 型別輸出 Link（外連用 <a>，內連用 LangNavLink）
    const text = node.title ?? "";
    const target = node.windowTarget === 1 ? "_blank" : "_self";
    const href = getExternalHref(node);
    if (href)
    {
        return <LangLink to={href} target={target} title={text} style={{ color: "inherit" }}>{text}</LangLink>;
    }
    const to = getInternalTo(siteIndex, node.absSegments);
    return <LangNavLink to={to} target={target} title={text} style={{ color: "inherit" }}>{text}</LangNavLink>;
};
// #endregion

// #region Private
/** 將Sitemap包成一個Page Component / Page Module，將Sitemap.tsx與Sitemap.css放在同個資料夾 */

/**
 * Sitemap.tsx
 * - DOM 結構對標 prototype：sitemap.html（從 ContentPlaceContent_ContentConentA 內部開始，但不包含該 div）
 * - 項目資料使用 site info（props.site.treeByLang）渲染
 */

/** 若之後要擴充成多樣式 - 以下為共用的func */
const getInternalTo = (siteIndex: string, absSegments?: string[] | null): string =>
{
    // 組內部連結：/{siteIndex}/{...segments}
    const segs = (absSegments ?? []).filter(Boolean);
    return `${siteIndex === "" ? "" : `/${siteIndex}`}${segs.length > 0 ? `/${segs.join("/")}` : ""}`;
};
const normalizeNodes = (nodes: INormNode[], includeHidden: boolean): INormNode[] =>
{
    // 過濾節點（預設只顯示 isShowOnMenu=true）
    const filtered = includeHidden ? nodes : nodes.filter((n) => n.isShowOnMenu);
    return filtered.map((n) => ({ ...n, children: normalizeNodes(n.children ?? [], includeHidden) }));
};
const getExternalHref = (node: INormNode): string | null =>
{
    // 取外連網址（避免 any）
    if (node.type !== "redirect-external") return null;
    const candidate = (node as INormNode & { redirectTo?: unknown; }).redirectTo;
    if (typeof candidate === "string" && candidate) return candidate;
    return null;
};
const collectLeafNodes = (nodes: INormNode[]): INormNode[] =>
{
    // 將任意深度 children 收斂成 leaf list（對標 prototype 的「最終連結列表」）
    const result: INormNode[] = [];
    const walk = (n: INormNode) =>
    {
        const kids = n.children ?? [];
        if (kids.length === 0)
        {
            result.push(n);
            return;
        }
        kids.forEach(walk);
    };
    nodes.forEach(walk);
    return result;
};
// #endregion
