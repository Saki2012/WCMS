// src/SysCore/Utils/Routes.tsx
import { Error404Page } from "@/Features/Pages/Client/Scaffold/MainFrame/ErrorPage";
import { type Lang } from "@/SysCore/i18n/lang";
import type { IRouteBuildContext, IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { langGuardLoader } from "@/SysCore/Utils/Route/langGuardLoader";
import { LangGuard } from "@/SysCore/Utils/Route/LangGuardRoute";
import { createBrowserRouter, type LoaderFunctionArgs, redirect, type RouteObject } from "react-router-dom";
import { createStaticHandler, createStaticRouter, type StaticHandlerContext } from "react-router-dom/server";
import { LibRouteLang } from "./LibRoute";

// #region Property
type BrowserRouterOptions = NonNullable<Parameters<typeof createBrowserRouter>[1]>;

type WcmsInitialState = Readonly<{ hydrationData?: BrowserRouterOptions["hydrationData"]; }>;

interface Boot
{
    lang?: Lang;
    cookieLang?: Lang;
    module: IRouteModule;
}

export type ServerRouterBuildResult = { kind: "router"; router: ReturnType<typeof createStaticRouter>; context: StaticHandlerContext; } | {
    kind: "response";
    response: Response;
};
// #endregion

// #region Public
export const buildRoutes = async (boot: Boot, ctx?: IRouteBuildContext): Promise<RouteObject[]> =>
{
    const routes = await boot.module.getRoutes(ctx);
    const children = normalizeChildren(routes);

    return [
        // /:lang 家族（只做語系正規化）
        {
            path: "/:lang",
            loader: langRootGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />,
            children: [{ path: "404", element: <Error404Page /> }, ...children, { path: "*", loader: notFoundRedirectLoader }],
        },
        // 根 "/" 家族（不 redirect，只注入語系）
        {
            path: "/",
            loader: langGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />,
            children: [{ path: "404", element: <Error404Page /> }, ...children, { path: "*", loader: notFoundRedirectLoader }],
        },
    ];
};

export const createClientRouter = async (boot: Boot) =>
{
    const routes = await buildRoutes(boot);
    assertNoIndexWithChildren(routes);

    const hydrationData = typeof window !== "undefined" ? getWindowInitialState()?.hydrationData : undefined;

    return hydrationData ? createBrowserRouter(routes, { hydrationData }) : createBrowserRouter(routes);
};

export const createServerRouter = async (boot: Boot, request: Request): Promise<ServerRouterBuildResult> =>
{
    const routes = await buildRoutes(boot, { request });
    assertNoIndexWithChildren(routes);
    const handler = createStaticHandler(routes);
    const queryResult = await handler.query(request);
    // ✅ loader redirect / errors 會回 Response，SSR 端必須先處理掉
    if (queryResult instanceof Response)
    {
        return { kind: "response", response: queryResult };
    }
    const router = createStaticRouter(handler.dataRoutes, queryResult);
    return { kind: "router", router, context: queryResult };
};
// #endregion

// #region Private
const getWindowInitialState = (): WcmsInitialState | undefined =>
{
    const win = window as Window & { __INITIAL_STATE__?: WcmsInitialState; };
    return win.__INITIAL_STATE__;
};

// 把模組的絕對子路徑轉相對；"/" 改成 index:true
const normalizeChildren = (routes: RouteObject[]): RouteObject[] =>
    routes.map((r) =>
    {
        const hasChildren = !!r.children?.length;
        const clone: RouteObject = { ...r };
        // 先遞迴處理子層
        if (hasChildren) clone.children = normalizeChildren(clone.children!);
        // A) "/"：有 children → 變成路由群組(path:"")；沒有 children → 變成 index
        if (clone.path === "/")
        {
            if (hasChildren)
            {
                clone.path = ""; // 巢狀群組，允許 children
            } else
            {
                delete clone.path;
                (clone as any).index = true; // 單純首頁
            }
        }
        // B) "/xxx" → "xxx"（轉成相對路徑）
        if (typeof clone.path === "string" && clone.path.startsWith("/") && clone.path !== "/")
        {
            clone.path = clone.path.replace(/^\/+/, "");
        }
        // C) 若有人把 index 與 children 併用，強制改回群組（拿掉 index）
        if ((clone as any).index && hasChildren)
        {
            delete (clone as any).index;
            if (!clone.path) clone.path = ""; // 明確作為群組
        }
        return clone;
    });

const assertNoIndexWithChildren = (routes: RouteObject[], parent = "") =>
{
    for (const r of routes)
    {
        const here = parent + "/" + (r.path ?? "(index)");
        if ((r as any).index && r.children?.length)
        {
            console.error("[Route Error] index route cannot have children:", { here, route: r });
            throw new Error(`Index route has children at "${here}"`);
        }
        if (r.children?.length) assertNoIndexWithChildren(r.children, here);
    }
};
/** 語系根路由守門：/:lang 只允許合法語系，其他單段錯誤網址導到 404 */
const langRootGuardLoader = (args: LoaderFunctionArgs) =>
{
    const url = new URL(args.request.url);

    if (LibRouteLang.isRouteLangBypassPathname(url.pathname))
    {
        return langGuardLoader(args);
    }

    const routeLang = LibRouteLang.tryParseRouteLangSegment(args.params.lang);

    if (!routeLang)
    {
        return notFoundRedirectLoader(args);
    }

    return langGuardLoader(args);
};
const notFoundRedirectLoader = ({ request }: LoaderFunctionArgs): never =>
{
    const url = new URL(request.url);
    if (LibRouteLang.isRouteLangBypassPathname(url.pathname))
    {
        throw redirect("/Server/Login", 302);
    }
    const lang = LibRouteLang.resolveRouteLangFromRequest(request);
    const notFoundPath = LibRouteLang.buildLangPathname("/404", lang);
    const from = encodeURIComponent(`${url.pathname}${url.search}`);
    throw redirect(`${notFoundPath}?from=${from}`, 302);
};
// #endregion
