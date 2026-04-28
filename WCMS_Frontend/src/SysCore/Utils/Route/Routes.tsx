// src/SysCore/Utils/Routes.tsx
import { Error404Page } from "@/Features/Pages/Client/Scaffold/MainFrame/ErrorPage";
import { type Lang } from "@/SysCore/i18n/lang";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { langGuardLoader } from "@/SysCore/Utils/Route/langGuardLoader";
import { LangGuard } from "@/SysCore/Utils/Route/LangGuardRoute";
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { createStaticHandler, createStaticRouter, type StaticHandlerContext } from "react-router-dom/server";

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

interface Boot
{
    lang?: Lang;
    cookieLang?: Lang;
    module: IRouteModule;
}

export const buildRoutes = async (boot: Boot): Promise<RouteObject[]> =>
{
    const routes = await boot.module.getRoutes(); // 等待 Promise
    const children = normalizeChildren(routes);

    return [
        // /:lang 家族（只做語系正規化）
        {
            path: "/:lang",
            loader: langGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />, // 元件內只用 useLoaderData 取 resolvedLang；不再 useNavigate 導頁
            children: [{ path: "404", element: <Error404Page /> }, ...children, { path: "*", element: <Error404Page /> }],
        },
        // 根 "/" 家族（不 redirect，只注入語系）
        {
            path: "/",
            loader: langGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />,
            children: [{ path: "404", element: <Error404Page /> }, ...children, { path: "*", element: <Error404Page /> }],
        },
    ];
};

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

export const createClientRouter = async (boot: Boot) =>
{
    const routes = await buildRoutes(boot);
    assertNoIndexWithChildren(routes);

    const hydrationData = typeof window !== "undefined" ? (window as any).__INITIAL_STATE__?.hydrationData : undefined;

    return hydrationData ? createBrowserRouter(routes, { hydrationData }) : createBrowserRouter(routes);
};

export type ServerRouterBuildResult = { kind: "router"; router: ReturnType<typeof createStaticRouter>; context: StaticHandlerContext; } | {
    kind: "response";
    response: Response;
};

export const createServerRouter = async (boot: Boot, request: Request): Promise<ServerRouterBuildResult> =>
{
    // 宣告變數
    const routes = await buildRoutes(boot);

    // 執行 function
    assertNoIndexWithChildren(routes);

    const handler = createStaticHandler(routes);
    const queryResult = await handler.query(request);

    // ✅ loader redirect / errors 會回 Response，SSR 端必須先處理掉
    if (queryResult instanceof Response)
    {
        return { kind: "response", response: queryResult };
    }

    const router = createStaticRouter(handler.dataRoutes, queryResult);

    // return
    return { kind: "router", router, context: queryResult };
};
