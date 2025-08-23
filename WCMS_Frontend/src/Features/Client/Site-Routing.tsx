// src/Features/Client/routing/site-routing.tsx
import * as React from "react";
import type { components } from "../../types/api";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"]
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"]
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"]
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"]

// import { PageManagementComp } from "@/Features/Client/BizFunc/PageManagement/PageManagementComp"; // 第2步再接


/* ---------- 2) 正規化後的樹 ---------- */
type NodeType = "redirect-external" | "redirect-internal" | "module";
export interface INormNode {
    id: number;
    path: string;                      // 只放當層片段（來自 ItemSiteUrl）
    type: NodeType;
    redirectTo?: string;               // redirect-* 用
    module?: { progId: string; options?: unknown }; // module 用
    children: INormNode[];
}

export interface INormSite {
    siteIndex: string;
    indexInfoByLang: Record<string, { title: string; description: string }>;
    treeByLang: Record<string, INormNode[]>; // 每個語系自己的根層節點（多層往下）
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
    const byLang = new Map<string, (SiteMenu_Item & SiteMenu_Item_Title)[]>();
    siteMenu.SiteMenu_Item_Title?.forEach(t => {
        const arr = byLang.get(t.Lang ?? "") ?? [];
        const item = siteMenu.SiteMenu_Item?.find(i => i.RowId === t.ItemRowId);
        if (item) arr.push({ ...item, ...t }); // 合併 Item + Title
        byLang.set(t.Lang ?? "", arr);
    });

    // 4) 為每個語系建立樹（正確使用 ItemRowId / ParentRowId）
    const treeByLang: INormSite["treeByLang"] = {};

    for (const [lang, items] of byLang) {
        // 排序（層級→顯示序→主鍵）
        items.sort((a, b) =>
            (a.Level ?? 0) - (b.Level ?? 0) ||
            (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0) ||
            (a.ItemRowId ?? 0) - (b.ItemRowId ?? 0)
        );

        const nodeMap = new Map<number, INormNode>();

        for (const it of items) {
            const id = it.ItemRowId ?? 0;
            const node: INormNode = {
                id,
                path: trimSlash(it.ItemSiteUrl ?? ""),
                type: "module",
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
            if (parent == null) roots.push(n);
            else nodeMap.get(parent)?.children.push(n);
        }
        treeByLang[lang] = roots;
    }
    return {
        siteIndex: siteMenu.SiteMenu_Index?.SiteIndex ?? "",
        indexInfoByLang,
        treeByLang,
    };
};

const trimSlash = (s: string) => s.replace(/^\/+|\/+$/g, "");
const normalizeInternal = (s: string) => {
    // 保證站內 redirect 以 `/` 開頭、沒有重複斜線
    if (!s) return "/";
    const cleaned = "/" + s.replace(/^\/+/, "");
    return cleaned.replace(/\/{2,}/g, "/");
};

/* ---------- 4) 模組註冊：把 ModuleProgId → 對應畫面 ---------- */
// 先放空，下一步帶你接真實元件（避免在路由建置期 import 太多）:
export interface IModuleCtx<TOpts = unknown> {
    lang: string;
    site: INormSite;
    node: INormNode;
    options?: TOpts;
}
export type ModuleFactory = (opts: unknown, lang: string) => React.ReactElement;
export type ModuleRoutesFactory = (opts: unknown, lang: string) => RouteObject[];
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
import { Outlet, type RouteObject } from "react-router-dom";
import { useLang } from "../../SysCore/i18n/LangContext";
import { AutoRedirect } from "../../SysCore/Utils/Route/AutoRedirect";
import HomePage from "./Layout/BizFunc/MainPage/HomePage";
import Index from "./Layout/BizFunc/MainPage/Index";

// 2) 模組元件：用 useLang() 把 lang 傳給對應的模組 component
const ModuleElement: React.FC<{ node: INormNode; site: INormSite }> = ({ node, site }) => {
    const { lang } = useLang();
    if (node.type !== "module" || !node.module) {
        return <div>Module not registered</div>;
    }
    const entry = getModuleRegistry()[node.module.progId];
    if (!entry) return <div>Unknown module: {node.module.progId}</div>;
    // 這個元件只需回傳「父層 element」；子路由在 toRoute 裡處理
    const el = entry.kind === "element"
        ? entry.render(node.module.options, lang)
        : entry.element(node.module.options, lang);
    return el;
};

export const createRoutesFromSite = (site: INormSite): RouteObject[] => {
    const skeletonRoots = site.treeByLang["zh-tw"] ?? Object.values(site.treeByLang)[0] ?? [];
    const defaultLang = (Object.keys(site.indexInfoByLang)[0] ?? "zh-tw").toLowerCase();
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
        const modChildren: RouteObject[] =
            entry.kind === "routes" ? entry.children(n.module.options, defaultLang) : [];

        const children = [...modChildren, ...menuChildren];

        // pathless 模組：有 children → 當包裹；沒有 → 當 index
        if (!n.path) {
            return children.length > 0 ? { element, children } : { index: true, element };
        }

        // 一般模組
        return { path: n.path, element, children };
    };

    return [
        {
            path: "/" + site.siteIndex,
            element: <Index />,
            children:
                [
                    { index: true, element: <HomePage /> },
                    ...skeletonRoots.map(toRoute),
                ]
        },
    ];
};
