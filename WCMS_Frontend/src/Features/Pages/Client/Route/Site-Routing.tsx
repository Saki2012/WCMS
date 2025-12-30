// src/Features/Client/routing/site-routing.tsx
import * as React from "react";
import type { components } from "@/types/api";
import { Outlet, type RouteObject } from "react-router-dom";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import HomePage from "SpecFeature/Pages/Client/Index/HomePage"
import { Index } from "@/Features/Pages/Client/BizFunc/MainPage/Index";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { Classic_FETheme } from "../Theme/ClassicTheme_Clsx";
import TemplateHub from "@/Features/Pages/Server/Scaffold/PreviewFrame/TemplateHub.tsx";
import { useLang } from "@/SysCore/i18n/LangContext";
import { SITEMAP_NODE_ID, SITEMAP_SEGMENT, SitemapNode } from "../BizFunc/MainPage/Sitemap";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"]
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"]
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"]
type WindowTarget = components["schemas"]["WindowTarget"];

// import { PageManagementComp } from "@/Features/Client/BizFunc/PageManagement/PageManagementComp"; // 第2步再接


/* ---------- 2) 正規化後的樹 ---------- */
type NodeType = "redirect-external" | "redirect-internal" | "module";
export interface INormNode {
    id: number;
    title: string;
    path: string;                      // 只放當層片段（來自 ItemSiteUrl）
    type: NodeType;
    redirectTo?: string;               // redirect-* 用
    module?: { progId: string; options?: unknown }; // module 用
    bannerId?: string;
    children: INormNode[];
    windowTarget: WindowTarget;
    isShowOnMenu: boolean;
    parentId?: number | null;
    rootId?: number;
    level?: number;
    absSegments?: string[];   // 片段字串：用來快速組 URL
    absIds?: number[];        // 沿途節點 id：做比對/權限
}

export interface INormSite {
    siteIndex: string;
    indexInfoByLang: Record<string, { title: string; description: string }>;
    treeByLang: Record<Lang, INormNode[]>; // 每個語系自己的根層節點（多層往下）
}

/* ---------- 3) 純函式：把資料表 → 樹 ---------- */
export const normalizeSite = (siteMenu: SiteMenuSet): INormSite => {
    // 1) 語系：站台資訊
    const indexInfoByLang: INormSite["indexInfoByLang"] = {};
    for (const info of siteMenu.SiteMenu_IndexInfo ?? []) {
        const lang = (info.Lang ?? "").toLowerCase();
        if (!lang) continue;
        indexInfoByLang[lang] = {
            title: info.Title ?? "",
            description: info.Description ?? "",
        };
    }
    if (Object.keys(indexInfoByLang).length === 0) {
        indexInfoByLang["zh-tw"] = { title: "", description: "" };
    }

    // 2) 關聯表：以 ItemRowId 當 key
    const urlMap = new Map<number, SiteMenu_Item_Url>();
    for (const u of siteMenu.SiteMenu_Item_Url ?? []) {
        urlMap.set(u.ItemRowId ?? 0, u);
    }
    const moduleMap = new Map<number, SiteMenu_Item_Module>();
    for (const m of siteMenu.SiteMenu_Item_Module ?? []) {
        moduleMap.set(m.ItemRowId ?? 0, m);
    }

    // 3) 依語系分組：用 SiteMenu_Item（不是 Item_Title）
    const byLang = new Map<Lang, (SiteMenu_Item & SiteMenu_Item_Title)[]>();
    siteMenu.SiteMenu_Item_Title?.forEach(t => {
        const arr = byLang.get(t.Lang as Lang ?? DefaultLang) ?? [];
        const item = siteMenu.SiteMenu_Item?.find(i => i.RowId === t.ItemRowId);
        if (item) arr.push({ ...item, ...t }); // 合併 Item + Title
        byLang.set(t.Lang as Lang ?? DefaultLang, arr);
    });

    // 4) 為每個語系建立樹（正確使用 ItemRowId / ParentRowId）
    const treeByLang: INormSite["treeByLang"] = { "zh-tw": [], "zh-cn": [], en: [], };

    for (const [lang, items] of byLang) {
        // 排序（層級→顯示序→主鍵）
        items.sort((a, b) => (a.Level ?? 0) - (b.Level ?? 0) || (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0) || (a.ItemRowId ?? 0) - (b.ItemRowId ?? 0));
        const nodeMap = new Map<number, INormNode>();

        for (const it of items) {
            const id = it.ItemRowId ?? 0;
            const node: INormNode = {
                id,
                title: it.Title ?? "",
                path: trimSlash(it.ItemSiteUrl ?? ""),
                type: "module",
                windowTarget: it.WindowTarget ?? 0,
                isShowOnMenu: it.IsShowOnMenu ?? true,
                children: [],
            };

            const itemType = it.ItemType ?? 0;
            if (itemType === 1) {
                // 轉址：從 Item_Url
                const u = urlMap.get(id);
                if ((u?.RedirectType ?? 0) === 1) {
                    node.type = "redirect-external";
                    node.redirectTo = u?.RedirectUrl ?? "";
                } else {
                    node.type = "redirect-internal";
                    node.redirectTo = normalizeInternal(u?.RedirectUrl ?? "/");
                }
            } else {
                // 模組：從 Item_Module
                const mm = moduleMap.get(id);
                if (mm?.ModuleProgId) {
                    let opts: unknown = mm.ModuleOptions ?? undefined;
                    if (typeof opts === "string") {
                        try { opts = JSON.parse(opts); } catch { /* 忽略 JSON 解析錯誤 */ }
                    }
                    node.module = { progId: mm.ModuleProgId, options: opts };
                    node.bannerId = mm.BannerId ?? "";
                }
            }
            nodeMap.set(id, node);
        }

        // 串父子
        const roots: INormNode[] = [];
        for (const it of items) {
            const id = it.ItemRowId ?? 0;
            const parent = it.ParentRowId;
            const n = nodeMap.get(id)!;
            n.parentId = parent;
            if (parent == null) roots.push(n);
            else nodeMap.get(parent)?.children.push(n);
        }
        ensureVirtualRoot(roots, lang);
        const fillMeta = (node: INormNode, parent: INormNode | null, rootId: number, parentSegs: string[], parentIds: number[]) => {
            node.level = (parent?.level ?? -1) + 1;
            node.rootId = rootId;
            node.absSegments = node.path ? [...parentSegs, node.path] : [...parentSegs];
            node.absIds = [...parentIds, node.id];
            for (const c of node.children) {
                fillMeta(c, node, rootId, node.absSegments, node.absIds);
            }
        };
        for (const r of roots) {
            r.parentId = null;
            r.level = 0;
            r.rootId = r.id;
            r.absSegments = r.path ? [r.path] : [];
            r.absIds = [r.id];
            for (const c of r.children) {
                fillMeta(c, r, r.id, r.absSegments, r.absIds);
            }
        }
        treeByLang[lang] = roots;
    }
    return { siteIndex: siteMenu.SiteMenu_Index?.SiteIndex ?? "", indexInfoByLang, treeByLang, };
};

const trimSlash = (s: string) => s.replace(/^\/+|\/+$/g, "");
const normalizeInternal = (s: string) => {
    // 保證站內 redirect 以 `/` 開頭、沒有重複斜線
    if (!s) return "/";
    const cleaned = "/" + s.replace(/^\/+/, "");
    return cleaned.replace(/\/{2,}/g, "/");
};

const ensureVirtualRoot = (roots: INormNode[], lang: Lang): void => {
    // 若已存在，就不重覆塞
    const exists = roots.some((r) => r.id === SITEMAP_NODE_ID || (r.path ?? "") === SITEMAP_SEGMENT);
    if (!exists) roots.push(SitemapNode(lang));
};

export type ModuleFactory = (lang: Lang, site: INormSite, node: INormNode) => React.ReactElement;
export type ModuleRoutesFactory = (opts: unknown, lang: Lang, node: INormNode, site: INormSite) => RouteObject[];
export type ModuleEntry =
    | { kind: "element"; render: ModuleFactory }
    | { kind: "routes"; element: ModuleFactory; children: ModuleRoutesFactory };
export type ModuleRegistry = Record<string, ModuleEntry>;
export const coreModuleRegistry: ModuleRegistry = {};
type RegistryResolver = () => ModuleRegistry;
let resolveRegistry: RegistryResolver = () => coreModuleRegistry;
export const configureModuleRegistry = (extender: (base: ModuleRegistry) => ModuleRegistry) => { resolveRegistry = () => extender(coreModuleRegistry); };
export const getModuleRegistry = (): ModuleRegistry => resolveRegistry();


/* ---------- 5) 純函式：把樹 → RouteObject[] ---------- */


// 2) 模組元件：用 useLang() 把 lang 傳給對應的模組 component
const ModuleElement: React.FC<{ node: INormNode; site: INormSite }> = ({ node, site }) => {
    // const { code: lang } = useLang();
    const lang = (useLang().code ?? DefaultLang) as Lang;
    if (node.type !== "module" || !node.module) return <div>Module not registered</div>;
    const entry = getModuleRegistry()[node.module.progId];
    if (!entry) return <div>Unknown module: {node.module.progId}</div>;
    // 這個元件只需回傳「父層 element」；子路由在 toRoute 裡處理
    const el = entry.kind === "element" ? entry.render(lang, site, node) : entry.element(lang, site, node);
    return el;
};
/** render 時用 LangContext 覆寫 route.element 裡的 lang / defaultLang（避免 route tree 只能用 DefaultLang 產生） */
const WithCtxLang: React.FC<{ element: React.ReactElement }> = ({ element }) => {
    const lang = (useLang().code ?? DefaultLang) as Lang;
    return React.cloneElement(element, { lang, defaultLang: lang } as any);
};

const wrapRoutesWithCtxLang = (routes: RouteObject[]): RouteObject[] =>
    routes.map((r) => {
        const clone: RouteObject = { ...r };
        if (r.element && React.isValidElement(r.element)) clone.element = <WithCtxLang element={r.element as React.ReactElement} />;
        if (r.children?.length) clone.children = wrapRoutesWithCtxLang(r.children);
        return clone;
    });

export const createRoutesFromSite = (site: INormSite): RouteObject[] => {
    const skeletonRoots = site.treeByLang[DefaultLang] ?? Object.values(site.treeByLang)[0] ?? [];
    const toRoute = (n: INormNode): RouteObject => {
        // 先把菜單樹的 children 算好（第二層/第三層都會遞迴進來）
        const menuChildren = n.children.map(toRoute);
        // A) 站內 redirect：父層要當「殼」，redirect 放在 index，children 一定要掛回去
        if (n.type === "redirect-internal") {
            if (n.path) {
                return menuChildren.length > 0
                    ? {
                        path: n.path,
                        element: <Outlet />,
                        children: [
                            { index: true, element: <AutoRedirect to={n.redirectTo!} replace /> },
                            ...menuChildren,
                        ],
                    }
                    : { path: n.path, element: <AutoRedirect to={n.redirectTo!} replace /> };
            }
            // pathless redirect（少見）
            return {
                element: <Outlet />,
                children: [
                    { index: true, element: <AutoRedirect to={n.redirectTo!} replace /> },
                    ...menuChildren,
                ],
            };
        }

        // B) 站外 redirect：同理（通常沒有子項；若有也要用殼 + index）
        if (n.type === "redirect-external") {
            const External: React.FC = () => {
                if (typeof window !== "undefined") window.location.assign(n.redirectTo!);
                return (
                    <a href={n.redirectTo!} rel="noopener noreferrer">
                        {n.redirectTo}
                    </a>
                );
            };
            if (n.path) {
                return menuChildren.length > 0
                    ? {
                        path: n.path,
                        element: <Outlet />,
                        children: [{ index: true, element: <External /> }, ...menuChildren],
                    }
                    : { path: n.path, element: <External /> };
            }
            return {
                element: <Outlet />,
                children: [{ index: true, element: <External /> }, ...menuChildren],
            };
        }
        // C) 模組節點：一律用 ModuleElement（它內部依 kind 呼叫 render/element；routes 型 element 內需含 <Outlet/>）
        if (!n.module) return { path: n.path, element: <div>Module not registered</div> };
        const entry = getModuleRegistry()[n.module.progId];
        if (!entry) return { path: n.path, element: <div>Unknown module: {n.module.progId}</div> };
        const element = <ModuleElement node={n} site={site} />;
        // routes 型模組的自帶 children；element 型為空
        const modChildrenRaw: RouteObject[] = entry.kind === "routes" ? entry.children(n.module.options, DefaultLang, n, site) : [];
        const modChildren = wrapRoutesWithCtxLang(modChildrenRaw); const children = [...modChildren, ...menuChildren];
        // pathless 模組：有 children → 當包裹；沒有 → 當 index
        if (!n.path) return children.length > 0 ? { element, children } : { index: true, element };
        // 一般模組
        return { path: n.path, element, children };
    };

    return [
        {
            path: "/" + site.siteIndex,
            element: <WithCtxLang element={<Index lang={DefaultLang} site={site} style={Classic_FETheme} />} />,
            children:
                [
                    { index: true, element: <WithCtxLang element={<HomePage lang={DefaultLang} />} /> },
                    {
                        path: "Template",
                        element: (
                            <React.Suspense fallback={<div role="status" aria-live="polite">載入預覽頁…</div>}>
                                <WithCtxLang element={<TemplateHub site={site} defaultLang={DefaultLang} />} />
                            </React.Suspense>

                        ),
                    },
                    ...skeletonRoots.map(toRoute),
                ]
        },
        {

        }
    ];
};
