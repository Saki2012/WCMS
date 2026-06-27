// src/Features/Client/routing/site-routing.tsx
import { Index } from "@/Features/Pages/Client/BizFunc/MainPage/Index";
import { SITEMAP_NODE_ID, SITEMAP_SEGMENT, SitemapNode } from "@/Features/Pages/Client/BizFunc/MainPage/Sitemap/Sitemap";
import { HomePage, HomePageLoader } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { TemplateHub } from "@/Features/Pages/Client/Scaffold/Preview/TemplateHub";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { LangLink } from "@/SysCore/i18n/LangLink";
import { LibText } from "@/SysCore/Utils/Library/LibData";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { LibRouteLang, LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import type { components } from "@/types/api";
import * as React from "react";
import { type LoaderFunctionArgs, Outlet, type RouteObject, useLocation } from "react-router-dom";
import { type ISubPageLoaderData, SubPageLoader } from "../Scaffold/SubPages/SubPage_Loader";
import { Classic_FETheme } from "../Theme/ClassicTheme_Clsx";

// #region Property
/** SiteMenu API 回傳的完整站台資料型別。 */
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"];
/** SiteMenu 節點主資料型別。 */
type SiteMenu_Item = components["schemas"]["SiteMenu_Item_DTO"];
/** SiteMenu 節點語系標題資料型別。 */
type SiteMenu_Item_Title = components["schemas"]["SiteMenu_Item_Title_DTO"];
/** SiteMenu 節點模組設定資料型別。 */
type SiteMenu_Item_Module = components["schemas"]["SiteMenu_Item_Module_DTO"];
/** SiteMenu 節點轉址設定資料型別。 */
type SiteMenu_Item_Url = components["schemas"]["SiteMenu_Item_Url_DTO"];
/** 選單連結開啟方式型別。 */
type WindowTarget = components["schemas"]["WindowTarget"];
/** 模組頁面型態型別。 */
type ModulePageType = components["schemas"]["ModulePageType"];
/** 正規化後的節點類型。 */
type NodeType = "redirect-external" | "redirect-internal" | "module";
/** SiteMenu 主資料與語系標題合併後的建樹資料型別。 */
type SiteMenuTreeItem = SiteMenu_Item & SiteMenu_Item_Title;
/** 模組元件建立函式型別。 */
type ModuleFactory = (lang: Lang, site: INormSite, node: INormNode) => React.ReactElement;
/** 模組子路由建立函式型別。 */
type ModuleRoutesFactory = (opts: unknown, lang: Lang, site: INormSite, node: INormNode) => RouteObject[];
/** 模組註冊表型別。 */
type ModuleRegistry = Record<string, ModuleEntry>;
/** 模組註冊表解析函式型別。 */
type RegistryResolver = () => ModuleRegistry;
/** 模組 loader 共用函式型別。 */
type ModuleLoaderFactory = (args: LoaderFunctionArgs, ctx: { lang: Lang; site: INormSite; node: INormNode; }) => Promise<ISubPageLoaderData>;
/** 前台核心模組註冊表。 */
const coreModuleRegistry: ModuleRegistry = {};
/** 正規化後的前台節點資料。 */
export interface INormNode
{
    /** 節點流水號。 */
    id: number;
    /** 節點顯示標題。 */
    title: string;
    /** 節點當層路徑片段。 */
    path: string;
    /** 節點類型。 */
    type: NodeType;
    /** redirect 節點的目標位置。 */
    redirectTo?: string;
    /** module 節點的模組設定。 */
    module?: { progId: string; options?: unknown; };
    /** module 節點綁定的 Banner Id。 */
    bannerId?: string;
    /** module 節點頁面型態。 */
    pageType?: ModulePageType;
    /** 子節點清單。 */
    children: INormNode[];
    /** 前台連結開啟方式。 */
    windowTarget: WindowTarget;
    /** 是否顯示於選單。 */
    isShowOnMenu: boolean;
    /** 父節點流水號。 */
    parentId?: number | null;
    /** 根節點流水號。 */
    rootId?: number;
    /** 節點層級。 */
    level?: number;
    /** 從根節點到目前節點的路徑片段。 */
    absSegments?: string[];
    /** 從根節點到目前節點的節點流水號。 */
    absIds?: number[];
}
/** 正規化後的站台首頁資訊。 */
interface INormSiteIndexInfo
{
    /** 站台標題。 */
    title: string;
    /** 站台描述。 */
    description: string;
    /** 站台頁尾內容。 */
    footerContent: string;
}
/** 正規化後的前台站台資料。 */
export interface INormSite
{
    /** 站台代碼。 */
    siteIndex: string;
    /** 依語系保存的站台首頁資訊。 */
    indexInfoByLang: Record<string, INormSiteIndexInfo>;
    /** 依語系保存的站台路由樹。 */
    treeByLang: Record<Lang, INormNode[]>;
}
/** 模組註冊項目。 */
export type ModuleEntry = { kind: "element"; render: ModuleFactory; } | {
    /** 模組註冊模式。 */
    kind: "routes";
    /** routes 模組的外層元件建立函式。 */
    element: ModuleFactory;
    /** routes 模組的子路由建立函式。 */
    children: ModuleRoutesFactory;
    /** routes 模組自訂 loader。 */
    loader?: ModuleLoaderFactory;
};
/** 建立模組渲染 scope key 的參數。 */
interface IModuleRenderScopeKeyArgs
{
    /** 目前語系。 */
    lang: Lang;
    /** 目前站台資料。 */
    site?: INormSite;
    /** 目前節點資料。 */
    node?: INormNode;
}
/** SiteMenu 關聯資料 Map。 */
interface ISiteMenuRelationMap
{
    /** 依 ItemRowId 保存的轉址設定。 */
    urlMap: Map<number, SiteMenu_Item_Url>;
    /** 依 ItemRowId 保存的模組設定。 */
    moduleMap: Map<number, SiteMenu_Item_Module>;
}
/** 建立單一節點路由的參數。 */
interface ICreateNodeRouteArgs
{
    /** 目前站台資料。 */
    site: INormSite;
    /** 目前節點資料。 */
    node: INormNode;
    /** 目前節點的子路由。 */
    menuChildren: RouteObject[];
    /** 預設模組子頁 loader。 */
    defaultModuleSubPageLoader: ModuleLoaderFactory;
}
/** 建立站台根路由的參數。 */
interface ICreateSiteRootRouteArgs
{
    /** 目前站台資料。 */
    site: INormSite;
    /** 站台根路由底下的子路由。 */
    children: RouteObject[];
}
/** 建立站台子路由的參數。 */
interface ICreateSiteRouteChildrenArgs
{
    /** 目前站台資料。 */
    site: INormSite;
    /** 建立路由使用的骨架根節點。 */
    roots: INormNode[];
    /** 預設模組子頁 loader。 */
    defaultModuleSubPageLoader: ModuleLoaderFactory;
}
// #endregion

// #region Public
/** 將 SiteMenu API 資料正規化成前台站台路由資料。 */
export const normalizeSite = (siteMenu: SiteMenuSet): INormSite =>
{
    const indexInfoByLang = buildIndexInfoByLang(siteMenu);
    const relationMap = buildSiteMenuRelationMap(siteMenu);
    const itemsByLang = groupSiteMenuItemsByLang(siteMenu);
    const treeByLang = buildTreeByLang(itemsByLang, relationMap);
    return buildNormSite(siteMenu, indexInfoByLang, treeByLang);
};
/** 設定前台模組註冊表擴充邏輯。 */
export const configureModuleRegistry = (extender: (base: ModuleRegistry) => ModuleRegistry): void =>
{
    resolveRegistry = () => extender(coreModuleRegistry);
};
/** 從 Request URL 解析目前前台路由語系。 */
export const resolveRouteLangFromRequest = (request: Request): Lang =>
{
    const url = new URL(request.url, "http://local");
    const lang = resolveRouteLangFromPathnameSegments(url.pathname);
    return lang ?? DefaultLang;
};
/** 依站台資料建立 React Router 路由。 */
export const createRoutesFromSite = (site: INormSite): RouteObject[] =>
{
    const defaultModuleSubPageLoader = createDefaultModuleSubPageLoader();
    const skeletonRoots = getSkeletonRoots(site);
    const children = createSiteRouteChildren({ site, roots: skeletonRoots, defaultModuleSubPageLoader });
    return [createSiteRootRoute({ site, children })];
};
// #endregion

// #region Protected
/** 建立站台首頁資訊語系對照資料。 */
const buildIndexInfoByLang = (siteMenu: SiteMenuSet): INormSite["indexInfoByLang"] =>
{
    const indexInfoByLang: INormSite["indexInfoByLang"] = {};
    for (const info of siteMenu.SiteMenu_IndexInfo ?? [])
    {
        const lang = LibText.safeTrim(info.Lang).toLowerCase();
        if (!lang) continue;
        indexInfoByLang[lang] = { title: info.Title ?? "", description: info.Description ?? "", footerContent: info.SiteFooter ?? "" };
    }
    return ensureDefaultIndexInfo(indexInfoByLang);
};
/** 建立 SiteMenu 轉址與模組關聯資料 Map。 */
const buildSiteMenuRelationMap = (siteMenu: SiteMenuSet): ISiteMenuRelationMap =>
{
    const urlMap = new Map<number, SiteMenu_Item_Url>();
    const moduleMap = new Map<number, SiteMenu_Item_Module>();
    for (const itemUrl of siteMenu.SiteMenu_Item_Url ?? []) urlMap.set(itemUrl.ItemRowId ?? 0, itemUrl);
    for (const itemModule of siteMenu.SiteMenu_Item_Module ?? []) moduleMap.set(itemModule.ItemRowId ?? 0, itemModule);
    return { urlMap, moduleMap };
};
/** 依語系分組 SiteMenu 建樹資料。 */
const groupSiteMenuItemsByLang = (siteMenu: SiteMenuSet): Map<Lang, SiteMenuTreeItem[]> =>
{
    const byLang = new Map<Lang, SiteMenuTreeItem[]>();
    const itemByRowId = buildItemByRowIdMap(siteMenu.SiteMenu_Item ?? []);
    for (const title of siteMenu.SiteMenu_Item_Title ?? [])
    {
        const lang = LibRouteLang.normalizeRouteLang(title.Lang);
        const item = itemByRowId.get(title.ItemRowId ?? 0);
        const treeItem = item ? { ...item, ...title } : null;
        appendSiteMenuTreeItem(byLang, lang, treeItem);
    }
    return byLang;
};

/** 依語系建立前台站台路由樹。 */
const buildTreeByLang = (itemsByLang: Map<Lang, SiteMenuTreeItem[]>, relationMap: ISiteMenuRelationMap): INormSite["treeByLang"] =>
{
    const treeByLang = createEmptyTreeByLang();
    for (const [lang, items] of itemsByLang)
    {
        const sortedItems = sortSiteMenuTreeItems(items);
        const roots = buildTreeRoots(sortedItems, lang, relationMap);
        treeByLang[lang] = roots;
    }
    return treeByLang;
};

/** 建立單一語系的根節點樹。 */
const buildTreeRoots = (items: SiteMenuTreeItem[], lang: Lang, relationMap: ISiteMenuRelationMap): INormNode[] =>
{
    const nodeMap = buildNodeMap(items, relationMap);
    const roots = bindParentChildNodes(items, nodeMap);
    ensureVirtualRoot(roots, lang);
    fillRootMeta(roots);
    return roots;
};
/** 建立模組預設子頁 loader。 */
const createDefaultModuleSubPageLoader = (): ModuleLoaderFactory =>
{
    return async (args, ctx) => SubPageLoader({ lang: ctx.lang, site: ctx.site, node: ctx.node })(args);
};
/** 取得建立路由使用的骨架根節點。 */
const getSkeletonRoots = (site: INormSite): INormNode[] =>
{
    return site.treeByLang[DefaultLang] ?? Object.values(site.treeByLang)[0] ?? [];
};
/** 建立站台根路由底下的子路由清單。 */
const createSiteRouteChildren = (args: ICreateSiteRouteChildrenArgs): RouteObject[] =>
{
    const homeRoute = createHomeRoute(args.site);
    const templateRoute = createTemplateRoute(args.site);
    const nodeRoutes = args.roots.map((node) => createNodeRouteFromTree(args.site, node, args.defaultModuleSubPageLoader));
    return [homeRoute, templateRoute, ...nodeRoutes];
};
/** 建立站台根路由。 */
const createSiteRootRoute = (args: ICreateSiteRootRouteArgs): RouteObject =>
{
    return {
        path: "/" + args.site.siteIndex,
        element: <WithCtxLang element={<Index lang={DefaultLang} site={args.site} style={Classic_FETheme} />} />,
        children: args.children,
    };
};
/** 依節點類型建立路由。 */
const createNodeRoute = (args: ICreateNodeRouteArgs): RouteObject =>
{
    if (args.node.type === "redirect-internal") return createInternalRedirectRoute(args);
    if (args.node.type === "redirect-external") return createExternalRedirectRoute(args);
    return createModuleRoute(args);
};
/** 建立站內轉址路由。 */
const createInternalRedirectRoute = (args: ICreateNodeRouteArgs): RouteObject =>
{
    const element = wrapNodeGuard(args.site, args.node, <AutoRedirect to={args.node.redirectTo!} replace />);
    if (!args.node.path) return createPathlessRedirectRoute(args, element);
    if (args.menuChildren.length === 0) return { path: args.node.path, element };
    return createRedirectShellRoute(args, element);
};
/** 建立站外轉址路由。 */
const createExternalRedirectRoute = (args: ICreateNodeRouteArgs): RouteObject =>
{
    const External = createExternalRedirectElement(args.node.redirectTo ?? "");
    const element = wrapNodeGuard(args.site, args.node, <External />);
    if (!args.node.path) return createPathlessRedirectRoute(args, element);
    if (args.menuChildren.length === 0) return { path: args.node.path, element };
    return createRedirectShellRoute(args, element);
};
/** 建立模組節點路由。 */
const createModuleRoute = (args: ICreateNodeRouteArgs): RouteObject =>
{
    if (!args.node.module) return createModuleNotRegisteredRoute(args.node);
    const entry = getModuleRegistry()[args.node.module.progId];
    if (!entry) return createUnknownModuleRoute(args.node);
    const element = wrapNodeGuard(args.site, args.node, <ModuleElement site={args.site} nodeId={args.node.id} skeletonNode={args.node} />);
    const loader = createModuleRouteLoader(args, entry);
    const children = createModuleRouteChildren(args, entry);
    return createModuleRouteObject(args.node, element, loader, children);
};
/** 依 LoaderFunctionArgs 解析目前路由語系。 */
const resolveLangFromArgs = (args: LoaderFunctionArgs): Lang =>
{
    const paramLang = LibRouteLang.tryParseRouteLangSegment(args.params?.["lang"]);
    if (paramLang) return paramLang;
    const url = new URL(args.request.url, "http://local");
    const pathLang = resolveRouteLangFromPathnameSegments(url.pathname);
    if (pathLang) return pathLang;
    return LibRouteLang.resolveRouteLangFromRequest(args.request);
};

/** 從 pathname 前兩層 route segment 解析語系。 */
const resolveRouteLangFromPathnameSegments = (pathname: string): Lang | null =>
{
    const segments = LibRoutePath.splitPathSegments(pathname);
    const lang = LibRouteLang.tryParseRouteLangSegment(segments[0]) ?? LibRouteLang.tryParseRouteLangSegment(segments[1]);

    return lang;
};
// #endregion

// #region Private
/** 建立空的語系路由樹容器。 */
const createEmptyTreeByLang = (): INormSite["treeByLang"] =>
{
    return { "zh-tw": [], "zh-cn": [], en: [] };
};
/** 建立正規化後的站台資料。 */
const buildNormSite = (siteMenu: SiteMenuSet, indexInfoByLang: INormSite["indexInfoByLang"], treeByLang: INormSite["treeByLang"]): INormSite =>
{
    return { siteIndex: LibText.safeTrim(siteMenu.SiteMenu_Index?.SiteIndex), indexInfoByLang, treeByLang };
};
/** 確保首頁資訊至少有預設語系資料。 */
const ensureDefaultIndexInfo = (indexInfoByLang: INormSite["indexInfoByLang"]): INormSite["indexInfoByLang"] =>
{
    if (Object.keys(indexInfoByLang).length > 0) return indexInfoByLang;
    return { [DefaultLang]: { title: "", description: "", footerContent: "" } };
};

/** 建立 SiteMenu Item RowId 對照 Map。 */
const buildItemByRowIdMap = (items: SiteMenu_Item[]): Map<number, SiteMenu_Item> =>
{
    return new Map(items.map((item) => [item.RowId ?? 0, item]));
};
/** 將建樹資料加入指定語系分組。 */
const appendSiteMenuTreeItem = (byLang: Map<Lang, SiteMenuTreeItem[]>, lang: Lang, item: SiteMenuTreeItem | null): void =>
{
    const items = byLang.get(lang) ?? [];
    if (item) items.push(item);
    byLang.set(lang, items);
};
/** 依層級、顯示順序與主鍵排序建樹資料。 */
const sortSiteMenuTreeItems = (items: SiteMenuTreeItem[]): SiteMenuTreeItem[] =>
{
    return [...items].sort((a, b) => (a.Level ?? 0) - (b.Level ?? 0) || (a.DisplayOrder ?? 0) - (b.DisplayOrder ?? 0) || (a.ItemRowId ?? 0) - (b.ItemRowId ?? 0));
};
/** 建立節點 Map。 */
const buildNodeMap = (items: SiteMenuTreeItem[], relationMap: ISiteMenuRelationMap): Map<number, INormNode> =>
{
    const nodeMap = new Map<number, INormNode>();
    for (const item of items)
    {
        const node = createNormNode(item, relationMap);
        nodeMap.set(node.id, node);
    }
    return nodeMap;
};

/** 建立單一正規化節點。 */
const createNormNode = (item: SiteMenuTreeItem, relationMap: ISiteMenuRelationMap): INormNode =>
{
    const id = item.ItemRowId ?? 0;
    const node = createBaseNormNode(item, id);
    applyNodeDetail(node, item, relationMap);
    return node;
};

/** 建立基本節點資料。 */
const createBaseNormNode = (item: SiteMenuTreeItem, id: number): INormNode =>
{
    return { id, title: item.Title ?? "", path: LibRoutePath.trimRouteSlash(item.ItemSiteUrl ?? ""), type: "module", windowTarget: item.WindowTarget ?? 0, isShowOnMenu: item.IsShowOnMenu ?? true, children: [] };
};

/** 套用節點轉址或模組明細。 */
const applyNodeDetail = (node: INormNode, item: SiteMenuTreeItem, relationMap: ISiteMenuRelationMap): void =>
{
    const itemType = item.ItemType ?? 0;
    if (itemType === 1)
    {
        applyRedirectNode(node, relationMap.urlMap.get(node.id));
        return;
    }

    applyModuleNode(node, relationMap.moduleMap.get(node.id));
};

/** 套用轉址節點資料。 */
const applyRedirectNode = (node: INormNode, itemUrl?: SiteMenu_Item_Url): void =>
{
    if ((itemUrl?.RedirectType ?? 0) === 1)
    {
        node.type = "redirect-external";
        node.redirectTo = itemUrl?.RedirectUrl ?? "";
        return;
    }
    node.type = "redirect-internal";
    node.redirectTo = LibRoutePath.normalizeInternalPath(itemUrl?.RedirectUrl ?? "/");
};

/** 套用模組節點資料。 */
const applyModuleNode = (node: INormNode, itemModule?: SiteMenu_Item_Module): void =>
{
    if (!itemModule?.ModuleProgId) return;

    node.module = { progId: itemModule.ModuleProgId, options: parseModuleOptions(itemModule.ModuleOptions) };
    node.bannerId = itemModule.BannerId ?? "";
    node.pageType = itemModule.PageType ?? 0;
};

/** 解析模組設定 JSON。 */
const parseModuleOptions = (value: unknown): unknown =>
{
    if (typeof value !== "string") return value ?? undefined;
    try
    {
        return JSON.parse(value);
    } catch
    {
        return value;
    }
};

/** 綁定父子節點並取出根節點。 */
const bindParentChildNodes = (items: SiteMenuTreeItem[], nodeMap: Map<number, INormNode>): INormNode[] =>
{
    const roots: INormNode[] = [];
    for (const item of items) bindSingleParentChildNode(item, nodeMap, roots);

    return roots;
};

/** 綁定單一節點的父子關係。 */
const bindSingleParentChildNode = (item: SiteMenuTreeItem, nodeMap: Map<number, INormNode>, roots: INormNode[]): void =>
{
    const id = item.ItemRowId ?? 0;
    const parent = item.ParentRowId;
    const node = nodeMap.get(id);
    if (!node) return;

    node.parentId = parent;
    if (parent == null) roots.push(node);
    else nodeMap.get(parent)?.children.push(node);
};

/** 填入所有根節點與子節點的路由 meta。 */
const fillRootMeta = (roots: INormNode[]): void =>
{
    for (const root of roots)
    {
        root.parentId = null;
        root.level = 0;
        root.rootId = root.id;
        root.absSegments = root.path ? [root.path] : [];
        root.absIds = [root.id];
        root.children.forEach((child) => fillChildMeta(child, root, root.id, root.absSegments ?? [], root.absIds ?? []));
    }
};

/** 填入子節點路由 meta。 */
const fillChildMeta = (node: INormNode, parent: INormNode, rootId: number, parentSegs: string[], parentIds: number[]): void =>
{
    node.level = (parent.level ?? -1) + 1;
    node.rootId = rootId;
    node.absSegments = node.path ? [...parentSegs, node.path] : [...parentSegs];
    node.absIds = [...parentIds, node.id];
    node.children.forEach((child) => fillChildMeta(child, node, rootId, node.absSegments ?? [], node.absIds ?? []));
};

/** 建立首頁路由。 */
const createHomeRoute = (_site: INormSite): RouteObject =>
{
    return {
        index: true,
        element: <WithCtxLang element={<HomePage lang={DefaultLang} />} />,
        loader: async (args) => HomePageLoader({ lang: resolveLangFromArgs(args) })(args),
    };
};

/** 建立樣板預覽路由。 */
const createTemplateRoute = (site: INormSite): RouteObject =>
{
    return {
        path: "Template",
        element: (
            <React.Suspense fallback={<div role="status" aria-live="polite">載入預覽頁…</div>}>
                <WithCtxLang element={<TemplateHub site={site} defaultLang={DefaultLang} />} />
            </React.Suspense>
        ),
    };
};

/** 從節點樹建立單一節點路由。 */
const createNodeRouteFromTree = (site: INormSite, node: INormNode, defaultModuleSubPageLoader: ModuleLoaderFactory): RouteObject =>
{
    const menuChildren = node.children.map((child) => createNodeRouteFromTree(site, child, defaultModuleSubPageLoader));
    return createNodeRoute({ site, node, menuChildren, defaultModuleSubPageLoader });
};

/** 建立 pathless 轉址路由。 */
const createPathlessRedirectRoute = (args: ICreateNodeRouteArgs, indexElement: React.ReactElement): RouteObject =>
{
    return { element: wrapNodeGuard(args.site, args.node, <Outlet />), children: [{ index: true, element: indexElement }, ...args.menuChildren] };
};

/** 建立含子路由的轉址外殼路由。 */
const createRedirectShellRoute = (args: ICreateNodeRouteArgs, indexElement: React.ReactElement): RouteObject =>
{
    return { path: args.node.path, element: wrapNodeGuard(args.site, args.node, <Outlet />), children: [{ index: true, element: indexElement }, ...args.menuChildren] };
};

/** 建立節點路由 guard 包裝元件。 */
const wrapNodeGuard = (site: INormSite, node: INormNode, element: React.ReactElement): React.ReactElement =>
{
    return <NodeRouteGuard site={site} nodeId={node.id}>{element}</NodeRouteGuard>;
};

/** 建立外部轉址元件。 */
const createExternalRedirectElement = (redirectTo: string): React.FC =>
{
    const External: React.FC = () =>
    {
        if (typeof window !== "undefined") window.location.assign(redirectTo);
        return <LangLink to={redirectTo}>{redirectTo}</LangLink>;
    };

    return External;
};

/** 建立未註冊模組路由。 */
const createModuleNotRegisteredRoute = (node: INormNode): RouteObject =>
{
    return { path: node.path, element: <div>Module not registered</div> };
};

/** 建立未知模組路由。 */
const createUnknownModuleRoute = (node: INormNode): RouteObject =>
{
    return { path: node.path, element: <div>Unknown module: {node.module?.progId}</div> };
};

/** 建立模組節點 loader。 */
const createModuleRouteLoader = (args: ICreateNodeRouteArgs, entry: ModuleEntry) =>
{
    return async (loaderArgs: LoaderFunctionArgs) =>
    {
        const lang = resolveLangFromArgs(loaderArgs);
        const resolvedNode = resolveNodeByLang(args.site, lang, args.node.id) ?? args.node;
        const entryLoader = entry.kind === "routes" && entry.loader ? entry.loader : args.defaultModuleSubPageLoader;
        return entryLoader(loaderArgs, { lang, site: args.site, node: resolvedNode });
    };
};

/** 建立模組節點子路由。 */
const createModuleRouteChildren = (args: ICreateNodeRouteArgs, entry: ModuleEntry): RouteObject[] =>
{
    const moduleChildrenRaw = entry.kind === "routes" ? entry.children(args.node.module?.options, DefaultLang, args.site, args.node) : [];
    const moduleChildren = wrapRoutesWithCtxLang(moduleChildrenRaw, args.site, args.node.id);

    return [...moduleChildren, ...args.menuChildren];
};

/** 建立模組節點 RouteObject。 */
const createModuleRouteObject = (node: INormNode, element: React.ReactElement, loader: (args: LoaderFunctionArgs) => Promise<ISubPageLoaderData>, children: RouteObject[]): RouteObject =>
{
    if (!node.path) return children.length > 0 ? { element, loader, children } : { index: true, element, loader };

    return { path: node.path, element, loader, children };
};

/** 取得目前模組註冊表。 */
const getModuleRegistry = (): ModuleRegistry => resolveRegistry();

/** 確保每個語系都有 Sitemap 虛擬根節點。 */
const ensureVirtualRoot = (roots: INormNode[], lang: Lang): void =>
{
    const exists = roots.some((root) => root.id === SITEMAP_NODE_ID || (root.path ?? "") === SITEMAP_SEGMENT);
    if (!exists) roots.push(SitemapNode(lang));
};

/** 目前模組註冊表解析函式。 */
let resolveRegistry: RegistryResolver = () => coreModuleRegistry;

/** 模組路由實際渲染元件。 */
const ModuleElement: React.FC<{ site: INormSite; nodeId: number; skeletonNode: INormNode; }> = (props) =>
{
    const location = useLocation();
    const lang = LibRouteLang.resolveRouteLangFromPathname(location.pathname);
    const node = resolveNodeByLang(props.site, lang, props.nodeId) ?? props.skeletonNode;
    if (node.type !== "module" || !node.module) return <div>Module not registered</div>;

    const entry = getModuleRegistry()[node.module.progId];
    if (!entry) return <div>Unknown module: {node.module.progId}</div>;

    const scopeKey = buildModuleRenderScopeKey({ lang, site: props.site, node });
    const child = entry.kind === "element" ? entry.render(lang, props.site, node) : entry.element(lang, props.site, node);

    return <React.Fragment key={scopeKey}>{child}</React.Fragment>;
};

/** 使用目前路由語系覆寫 route.element 內的語系 props。 */
const WithCtxLang: React.FC<{ element: React.ReactElement; site?: INormSite; nodeId?: number; }> = ({ element, site, nodeId }) =>
{
    const location = useLocation();
    const lang = LibRouteLang.resolveRouteLangFromPathname(location.pathname);
    const node = site && typeof nodeId === "number" ? (resolveNodeByLang(site, lang, nodeId) ?? undefined) : undefined;
    const scopeKey = buildModuleRenderScopeKey({ lang, site, node });

    return React.cloneElement(element, { key: scopeKey, lang, defaultLang: DefaultLang, ...(node ? { node } : {}) } as any);
};

/** 遞迴包裝 routes 型模組子路由的語系 context。 */
const wrapRoutesWithCtxLang = (routes: RouteObject[], site?: INormSite, nodeId?: number): RouteObject[] =>
{
    return routes.map((route) => wrapSingleRouteWithCtxLang(route, site, nodeId));
};

/** 包裝單一路由的語系 context。 */
const wrapSingleRouteWithCtxLang = (route: RouteObject, site?: INormSite, nodeId?: number): RouteObject =>
{
    const clone: RouteObject = { ...route };
    if (route.element && React.isValidElement(route.element)) clone.element = <WithCtxLang element={route.element as React.ReactElement} site={site} nodeId={nodeId} />;
    if (route.children?.length) clone.children = wrapRoutesWithCtxLang(route.children, site, nodeId);

    return clone;
};

/** 依節點流水號遞迴尋找節點。 */
const findNodeById = (roots: INormNode[], id: number): INormNode | null =>
{
    const stack: INormNode[] = [...roots];
    while (stack.length > 0)
    {
        const current = stack.pop();
        if (!current) continue;
        if (current.id === id) return current;
        if (current.children?.length) stack.push(...current.children);
    }

    return null;
};

/** 依語系與節點流水號解析實際節點。 */
const resolveNodeByLang = (site: INormSite, lang: Lang, nodeId: number): INormNode | null =>
{
    const roots = site.treeByLang?.[lang] ?? [];
    const fallbackRoots = site.treeByLang?.[DefaultLang] ?? [];
    const hit = findNodeById(roots, nodeId);
    if (hit) return hit;

    return findNodeById(fallbackRoots, nodeId);
};

/** 檢查目前語系節點是否可進入。 */
const NodeRouteGuard: React.FC<{ site: INormSite; nodeId: number; children: React.ReactElement; }> = (props) =>
{
    const location = useLocation();
    const lang = LibRouteLang.resolveRouteLangFromPathname(location.pathname);
    const roots = props.site.treeByLang[lang] ?? [];
    const current = findNodeById(roots, props.nodeId);
    const isInvalid = !current || ((current.title ?? "") === "" && (current.isShowOnMenu ?? true) === false);
    if (isInvalid) return <AutoRedirect to="/" replace />;

    return props.children;
};

/** 產生前台 module 渲染 scope key。 */
const buildModuleRenderScopeKey = (args: IModuleRenderScopeKeyArgs): string =>
{
    const siteIndex = args.site?.siteIndex ?? "";
    const nodeId = args.node?.id ?? 0;
    const progId = args.node?.module?.progId ?? "";
    const pageType = args.node?.pageType ?? 0;

    return `${siteIndex}|${args.lang}|${nodeId}|${progId}|${pageType}`;
};
// #endregion
