// src/Features/Client/routing/site-routing.tsx
import { Index } from "@/Features/Pages/Client/BizFunc/MainPage/Index";
import {
    SITEMAP_NODE_ID,
    SITEMAP_SEGMENT,
    SitemapNode,
} from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import { HomePage, HomePageLoader } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import TemplateHub from "@/Features/Pages/Server/Scaffold/PreviewFrame/TemplateHub.tsx";
import { DefaultLang, isSupportedLang, type Lang } from "@/SysCore/i18n/lang";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import type { components } from "@/types/api";
import * as React from "react";
import { type LoaderFunctionArgs, Outlet, type RouteObject, useLocation } from "react-router-dom";
import { type ISubPageLoaderData, SubPageLoader } from "../Scaffold/SubPages/SubPage_Loader";
import { Classic_FETheme } from "../Theme/ClassicTheme_Clsx";

type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"];
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];
type WindowTarget = components["schemas"]["WindowTarget"];

// import { PageManagementComp } from "@/Features/Client/BizFunc/PageManagement/PageManagementComp"; // 第2步再接

/* ---------- 2) 正規化後的樹 ---------- */
type NodeType = "redirect-external" | "redirect-internal" | "module";
export interface INormNode
{
    id: number;
    title: string;
    path: string; // 只放當層片段（來自 ItemSiteUrl）
    type: NodeType;
    redirectTo?: string; // redirect-* 用
    module?: { progId: string; options?: unknown; }; // module 用
    bannerId?: string;
    children: INormNode[];
    windowTarget: WindowTarget;
    isShowOnMenu: boolean;
    parentId?: number | null;
    rootId?: number;
    level?: number;
    absSegments?: string[]; // 片段字串：用來快速組 URL
    absIds?: number[]; // 沿途節點 id：做比對/權限
}
interface INormSiteIndexInfo
{
    title: string;
    description: string;
    footerContent: string;
}
export interface INormSite
{
    siteIndex: string;
    indexInfoByLang: Record<string, INormSiteIndexInfo>;
    treeByLang: Record<Lang, INormNode[]>;
}

/* ---------- 3) 純函式：把資料表 → 樹 ---------- */
export const normalizeSite = (siteMenu: SiteMenuSet): INormSite =>
{
    // 1) 語系：站台資訊
    const indexInfoByLang: INormSite["indexInfoByLang"] = {};
    for (const info of siteMenu.SiteMenu_IndexInfo ?? [])
    {
        const lang = (info.Lang ?? "").toLowerCase();
        if (!lang) continue;
        indexInfoByLang[lang] = {
            title: info.Title ?? "",
            description: info.Description ?? "",
            footerContent: info.SiteFooter ?? "",
        };
    }
    if (Object.keys(indexInfoByLang).length === 0)
    {
        indexInfoByLang[DefaultLang] = { title: "", description: "", footerContent: "" };
    }

    // 2) 關聯表：以 ItemRowId 當 key
    const urlMap = new Map<number, SiteMenu_Item_Url>();
    for (const u of siteMenu.SiteMenu_Item_Url ?? [])
    {
        urlMap.set(u.ItemRowId ?? 0, u);
    }
    const moduleMap = new Map<number, SiteMenu_Item_Module>();
    for (const m of siteMenu.SiteMenu_Item_Module ?? [])
    {
        moduleMap.set(m.ItemRowId ?? 0, m);
    }

    // 3) 依語系分組：用 SiteMenu_Item（不是 Item_Title）
    const byLang = new Map<Lang, (SiteMenu_Item & SiteMenu_Item_Title)[]>();
    siteMenu.SiteMenu_Item_Title?.forEach(t =>
    {
        // 宣告變數
        const lang = normalizeLangKey(t.Lang);
        const arr = byLang.get(lang) ?? [];
        const item = siteMenu.SiteMenu_Item?.find(i => i.RowId === t.ItemRowId);
        // 執行function
        if (item) arr.push({ ...item, ...t }); // 合併 Item + Title
        // return xxx
        byLang.set(lang, arr);
    });

    // 4) 為每個語系建立樹（正確使用 ItemRowId / ParentRowId）
    const treeByLang: INormSite["treeByLang"] = { "zh-tw": [], "zh-cn": [], en: [] };

    for (const [lang, items] of byLang)
    {
        // 排序（層級→顯示序→主鍵）
        items.sort((a, b) =>
            (a.Level ?? 0) - (b.Level ?? 0) || (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0)
            || (a.ItemRowId ?? 0) - (b.ItemRowId ?? 0)
        );
        const nodeMap = new Map<number, INormNode>();

        for (const it of items)
        {
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
            if (itemType === 1)
            {
                // 轉址：從 Item_Url
                const u = urlMap.get(id);
                if ((u?.RedirectType ?? 0) === 1)
                {
                    node.type = "redirect-external";
                    node.redirectTo = u?.RedirectUrl ?? "";
                } else
                {
                    node.type = "redirect-internal";
                    node.redirectTo = normalizeInternal(u?.RedirectUrl ?? "/");
                }
            } else
            {
                // 模組：從 Item_Module
                const mm = moduleMap.get(id);
                if (mm?.ModuleProgId)
                {
                    let opts: unknown = mm.ModuleOptions ?? undefined;
                    if (typeof opts === "string")
                    {
                        try
                        {
                            opts = JSON.parse(opts);
                        } catch
                        {
                            /* 忽略 JSON 解析錯誤 */
                        }
                    }
                    node.module = { progId: mm.ModuleProgId, options: opts };
                    node.bannerId = mm.BannerId ?? "";
                }
            }
            nodeMap.set(id, node);
        }

        // 串父子
        const roots: INormNode[] = [];
        for (const it of items)
        {
            const id = it.ItemRowId ?? 0;
            const parent = it.ParentRowId;
            const n = nodeMap.get(id)!;
            n.parentId = parent;
            if (parent == null) roots.push(n);
            else nodeMap.get(parent)?.children.push(n);
        }
        ensureVirtualRoot(roots, lang);
        const fillMeta = (
            node: INormNode,
            parent: INormNode | null,
            rootId: number,
            parentSegs: string[],
            parentIds: number[],
        ) =>
        {
            node.level = (parent?.level ?? -1) + 1;
            node.rootId = rootId;
            node.absSegments = node.path ? [...parentSegs, node.path] : [...parentSegs];
            node.absIds = [...parentIds, node.id];
            for (const c of node.children)
            {
                fillMeta(c, node, rootId, node.absSegments, node.absIds);
            }
        };
        for (const r of roots)
        {
            r.parentId = null;
            r.level = 0;
            r.rootId = r.id;
            r.absSegments = r.path ? [r.path] : [];
            r.absIds = [r.id];
            for (const c of r.children)
            {
                fillMeta(c, r, r.id, r.absSegments, r.absIds);
            }
        }
        treeByLang[lang] = roots;
    }
    return { siteIndex: siteMenu.SiteMenu_Index?.SiteIndex ?? "", indexInfoByLang, treeByLang };
};

const trimSlash = (s: string) => s.replace(/^\/+|\/+$/g, "");
const normalizeInternal = (s: string) =>
{
    // 保證站內 redirect 以 `/` 開頭、沒有重複斜線
    if (!s) return "/";
    const cleaned = "/" + s.replace(/^\/+/, "");
    return cleaned.replace(/\/{2,}/g, "/");
};

const ensureVirtualRoot = (roots: INormNode[], lang: Lang): void =>
{
    // 若已存在，就不重覆塞
    const exists = roots.some((r) => r.id === SITEMAP_NODE_ID || (r.path ?? "") === SITEMAP_SEGMENT);
    if (!exists) roots.push(SitemapNode(lang));
};

export type ModuleFactory = (lang: Lang, site: INormSite, node: INormNode) => React.ReactElement;
export type ModuleRoutesFactory = (opts: unknown, lang: Lang, site: INormSite, node: INormNode) => RouteObject[];
export type ModuleEntry =
    | { kind: "element"; render: ModuleFactory; }
    | {
        kind: "routes";
        element: ModuleFactory;
        children: ModuleRoutesFactory;
        loader?: (
            args: LoaderFunctionArgs,
            ctx: { lang: Lang; site: INormSite; node: INormNode; },
        ) => Promise<ISubPageLoaderData>;
    };
export type ModuleRegistry = Record<string, ModuleEntry>;
export const coreModuleRegistry: ModuleRegistry = {};
type RegistryResolver = () => ModuleRegistry;
let resolveRegistry: RegistryResolver = () => coreModuleRegistry;
export const configureModuleRegistry = (extender: (base: ModuleRegistry) => ModuleRegistry) =>
{
    resolveRegistry = () => extender(coreModuleRegistry);
};
export const getModuleRegistry = (): ModuleRegistry => resolveRegistry();

const normalizeLangKey = (raw?: string | null): Lang =>
{
    // 宣告變數
    const s = (raw ?? "").trim().toLowerCase();

    // 執行function：別名/大小寫/底線統一
    if (!s) return DefaultLang;

    // 常見 zh-hant 系列 → zh-tw
    if (s === "zh-hant" || s === "zh-hant-tw" || s === "zh_hant_tw" || s === "zh_tw" || s === "zh-tw")
    {
        return "zh-tw";
    }

    // 常見 en-us → en（你目前 SUPPORTED_LANGS 只有 en）
    if (s === "en-us" || s === "en_us")
    {
        return "en";
    }

    // 若已是系統支援語系就直接用
    if (isSupportedLang(s)) return s;

    // 其他不支援的語系 → fallback
    return DefaultLang;
};
/* ---------- 5) 純函式：把樹 → RouteObject[] ---------- */

// 2) 模組元件：用 useLang() 把 lang 傳給對應的模組 component
const ModuleElement: React.FC<{ site: INormSite; nodeId: number; skeletonNode: INormNode; }> = (props) =>
{
    const location = useLocation();
    const lang = resolveRouteLangFromPathname(location.pathname);
    const node = resolveNodeByLang(props.site, lang, props.nodeId) ?? props.skeletonNode;

    if (node.type !== "module" || !node.module) return <div>Module not registered</div>;
    const entry = getModuleRegistry()[node.module.progId];
    if (!entry) return <div>Unknown module: {node.module.progId}</div>;

    return entry.kind === "element"
        ? entry.render(lang, props.site, node)
        : entry.element(lang, props.site, node);
};
/** render 時用 LangContext 覆寫 route.element 裡的 lang / defaultLang（避免 route tree 只能用 DefaultLang 產生） */
const WithCtxLang: React.FC<{ element: React.ReactElement; site?: INormSite; nodeId?: number; }> = (
    { element, site, nodeId },
) =>
{
    const location = useLocation();
    const lang = resolveRouteLangFromPathname(location.pathname);
    const node = site && typeof nodeId === "number" ? (resolveNodeByLang(site, lang, nodeId) ?? undefined) : undefined;

    return React.cloneElement(
        element,
        {
            lang,
            defaultLang: DefaultLang,
            ...(node ? { node } : {}),
        } as any,
    );
};
const wrapRoutesWithCtxLang = (routes: RouteObject[], site?: INormSite, nodeId?: number): RouteObject[] =>
    routes.map((r) =>
    {
        const clone: RouteObject = { ...r };
        if (r.element && React.isValidElement(r.element))
        {
            clone.element = <WithCtxLang element={r.element as React.ReactElement} site={site} nodeId={nodeId} />;
        }
        if (r.children?.length) clone.children = wrapRoutesWithCtxLang(r.children, site, nodeId);
        return clone;
    });
// ✅ 遞迴找 node（用 id 對應各語系）
const findNodeById = (roots: INormNode[], id: number): INormNode | null =>
{
    const stack: INormNode[] = [...roots];
    while (stack.length > 0)
    {
        const cur = stack.pop()!;
        if (cur.id === id) return cur;
        if (cur.children?.length) stack.push(...cur.children);
    }
    return null;
};

const resolveNodeByLang = (site: INormSite, lang: Lang, nodeId: number): INormNode | null =>
{
    // 宣告變數
    const roots = site.treeByLang?.[lang] ?? [];
    const fallbackRoots = site.treeByLang?.[DefaultLang] ?? [];

    // 執行 function
    const hit = findNodeById(roots, nodeId);
    if (hit) return hit;

    // return
    return findNodeById(fallbackRoots, nodeId);
};

/** ✅ node route guard：若該語系 node 不存在，或 title==="" && isShowOnMenu=false → 回該語系首頁 */
const NodeRouteGuard: React.FC<{ site: INormSite; nodeId: number; children: React.ReactElement; }> = (props) =>
{
    const location = useLocation();
    const lang = resolveRouteLangFromPathname(location.pathname);

    const roots = props.site.treeByLang[lang] ?? [];
    const cur = findNodeById(roots, props.nodeId);

    const isInvalid = !cur || ((cur.title ?? "") === "" && (cur.isShowOnMenu ?? true) === false);
    if (isInvalid) return <AutoRedirect to="/" replace />;

    return props.children;
};

const readCookieValue = (cookieHeader: string, key: string): string | null =>
{
    // 宣告變數
    const parts = cookieHeader.split(";").map(s => s.trim());

    // 執行function
    for (const p of parts)
    {
        const eq = p.indexOf("=");
        if (eq <= 0) continue;
        const k = decodeURIComponent(p.slice(0, eq).trim());
        if (k !== key) continue;
        const v = decodeURIComponent(p.slice(eq + 1).trim());
        return v || null;
    }

    // return
    return null;
};
// ✅ 只接受「明確長得像語系」的 segment，避免 siteIndex 被誤判
const tryParseLangSegment = (seg: string): Lang | null =>
{
    // 宣告變數
    const raw = (seg ?? "").trim().toLowerCase();
    if (!raw) return null;
    // 執行 function：只接受明確語系字串，避免把 siteIndex/module 名當語系
    const allow = raw === "en" || raw === "en-us" || raw === "en_us"
        || raw === "zh-tw" || raw === "zh_tw"
        || raw === "zh-hant" || raw === "zh-hant-tw" || raw === "zh_hant_tw"
        || raw === "zh-cn" || raw === "zh_cn";

    // return
    return allow ? normalizeLangKey(raw) : null;
};

export const resolveRouteLangFromRequest = (request: Request): Lang =>
{
    // 宣告變數
    const url = new URL(request.url, "http://local");
    const segs = url.pathname.split("/").filter(Boolean);

    // 執行 function：支援兩種可能：/en/... 或 /{siteIndex}/en/...
    const hit = tryParseLangSegment(segs[0] ?? "") ?? tryParseLangSegment(segs[1] ?? "");

    // return：沒前綴就固定用 DefaultLang（避免 cookie 殘留導致錯語系）
    return hit ?? DefaultLang;
};

const resolveLangFromUrl = (url: string): Lang | null =>
{
    // 宣告變數
    const u = new URL(url, "http://local");
    const seg0 = u.pathname.split("/").filter(Boolean)[0] ?? "";

    // return
    return tryParseLangSegment(seg0);
};

const resolveRouteLangFromPathname = (pathname: string): Lang =>
{
    const segs = pathname.split("/").filter(Boolean);
    const hit = tryParseLangSegment(segs[0] ?? "") ?? tryParseLangSegment(segs[1] ?? "");
    return hit ?? DefaultLang;
};

export const resolveLangFromRequest = (request: Request): Lang =>
{
    // 1) URL 優先（CSR/SSR 都準：/en/...）
    const urlLang = resolveLangFromUrl(request.url);
    if (urlLang) return urlLang;

    // 2) cookie：SSR 讀 header；CSR 改讀 document.cookie
    const headerCookie = request.headers.get("cookie") ?? "";
    const clientCookie = typeof document !== "undefined" ? document.cookie : "";
    const cookie = headerCookie || clientCookie;
    const cookieLang = readCookieValue(cookie, "wcms.lang");

    // 3) accept-language（SSR 才比較常拿得到）
    const acceptLang = request.headers.get("accept-language") ?? "";
    const firstAccept = acceptLang.split(",")[0]?.trim() ?? "";

    // return
    return normalizeLangKey((cookieLang ?? firstAccept ?? "").toLowerCase());
};

export const createRoutesFromSite = (site: INormSite): RouteObject[] =>
{
    const defaultModuleSubPageLoader = async (
        args: LoaderFunctionArgs,
        ctx: { lang: Lang; site: INormSite; node: INormNode; },
    ) =>
    {
        return SubPageLoader({ lang: ctx.lang, site: ctx.site, node: ctx.node })(args);
    };
    const skeletonRoots = site.treeByLang[DefaultLang] ?? Object.values(site.treeByLang)[0] ?? [];
    const toRoute = (n: INormNode): RouteObject =>
    {
        const menuChildren = n.children.map(toRoute);
        const wrapGuard = (el: React.ReactElement) => (
            <NodeRouteGuard site={site} nodeId={n.id}>
                {el}
            </NodeRouteGuard>
        );
        // A) 站內 redirect：父層要當「殼」，redirect 放在 index，children 一定要掛回去
        if (n.type === "redirect-internal")
        {
            if (n.path)
            {
                return menuChildren.length > 0
                    ? {
                        path: n.path,
                        element: wrapGuard(<Outlet />),
                        children: [
                            { index: true, element: wrapGuard(<AutoRedirect to={n.redirectTo!} replace />) },
                            ...menuChildren,
                        ],
                    }
                    : { path: n.path, element: wrapGuard(<AutoRedirect to={n.redirectTo!} replace />) };
            }
            // pathless redirect（少見）
            return {
                element: wrapGuard(<Outlet />),
                children: [
                    { index: true, element: wrapGuard(<AutoRedirect to={n.redirectTo!} replace />) },
                    ...menuChildren,
                ],
            };
        }
        // B) 站外 redirect：同理（通常沒有子項；若有也要用殼 + index）
        if (n.type === "redirect-external")
        {
            const External: React.FC = () =>
            {
                if (typeof window !== "undefined") window.location.assign(n.redirectTo!);
                return (
                    <a href={n.redirectTo!} rel="noopener noreferrer">
                        {n.redirectTo}
                    </a>
                );
            };
            if (n.path)
            {
                return menuChildren.length > 0
                    ? {
                        path: n.path,
                        element: wrapGuard(<Outlet />),
                        children: [{ index: true, element: wrapGuard(<External />) }, ...menuChildren],
                    }
                    : { path: n.path, element: wrapGuard(<External />) };
            }
            return {
                element: wrapGuard(<Outlet />),
                children: [{ index: true, element: wrapGuard(<External />) }, ...menuChildren],
            };
        }
        // C) 模組節點：一律用 ModuleElement（它內部依 kind 呼叫 render/element；routes 型 element 內需含 <Outlet/>）
        if (!n.module) return { path: n.path, element: <div>Module not registered</div> };
        const entry = getModuleRegistry()[n.module.progId];
        if (!entry) return { path: n.path, element: <div>Unknown module: {n.module.progId}</div> };
        const element = wrapGuard(<ModuleElement site={site} nodeId={n.id} skeletonNode={n} />);
        const loader = async (args: LoaderFunctionArgs) =>
        {
            const lang = resolveLangFromArgs(args);
            const resolvedNode = resolveNodeByLang(site, lang, n.id) ?? n;
            const entryLoader = entry.kind === "routes" && entry.loader ? entry.loader : defaultModuleSubPageLoader;
            return entryLoader(args, { lang, site, node: resolvedNode });
        };
        // routes 型模組的自帶 children；element 型為空
        const modChildrenRaw: RouteObject[] = entry.kind === "routes"
            ? entry.children(n.module.options, DefaultLang, site, n)
            : [];
        const modChildren = wrapRoutesWithCtxLang(modChildrenRaw, site, n.id);
        const children = [...modChildren, ...menuChildren];
        // pathless 模組：有 children → 當包裹；沒有 → 當 index
        if (!n.path) return children.length > 0 ? { element, loader, children } : { index: true, element, loader };
        // 一般模組
        return { path: n.path, element, loader, children };
    };
    const resolveLangFromArgs = (args: LoaderFunctionArgs): Lang =>
    {
        const p = args.params?.["lang"];
        if (p) return normalizeLangKey(p);

        // 若你的路由不是 :lang 參數，而是用 path segment，也可用這段補強
        const seg0 = new URL(args.request.url).pathname.split("/").filter(Boolean)[0] ?? "";
        const fromSeg = normalizeLangKey(seg0);
        if (isSupportedLang(fromSeg)) return fromSeg;

        return resolveLangFromRequest(args.request);
    };
    return [
        {
            path: "/" + site.siteIndex,
            element: <WithCtxLang element={<Index lang={DefaultLang} site={site} style={Classic_FETheme} />} />,
            children: [
                {
                    index: true,
                    element: <WithCtxLang element={<HomePage lang={DefaultLang} />} />,
                    loader: async (args) => HomePageLoader({ lang: resolveLangFromArgs(args) })(args),
                },
                {
                    path: "Template",
                    element: (
                        <React.Suspense fallback={<div role="status" aria-live="polite">載入預覽頁…</div>}>
                            <WithCtxLang element={<TemplateHub site={site} defaultLang={DefaultLang} />} />
                        </React.Suspense>
                    ),
                },
                ...skeletonRoots.map(toRoute),
            ],
        },
    ];
};
