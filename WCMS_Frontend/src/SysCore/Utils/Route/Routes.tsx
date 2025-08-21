// src/SysCore/Utils/Routes.tsx
import { createBrowserRouter, type RouteObject } from "react-router-dom";
import { createStaticHandler, createStaticRouter, type StaticHandlerContext } from "react-router-dom/server";
import type { IRouteModule } from "../../Interface/IBaseRouter";
import { LangGuard } from "./LangGuardRoute";
import { langGuardLoader } from "./langGuardLoader";
import type { Lang } from "../../i18n/lang";
import { AutoRedirect } from "./AutoRedirect";

// 把模組的絕對子路徑轉相對；"/" 改成 index:true
const normalizeChildren = (routes: RouteObject[]): RouteObject[] =>
    routes.map((r) => {
        const hasChildren = !!r.children?.length;
        const clone: RouteObject = { ...r };

        // 先遞迴處理子層
        if (hasChildren) {
            clone.children = normalizeChildren(clone.children!);
        }

        // A) "/"：有 children → 變成路由群組(path:"")；沒有 children → 變成 index
        if (clone.path === "/") {
            if (hasChildren) {
                clone.path = "";                  // 巢狀群組，允許 children
            } else {
                delete clone.path;
                (clone as any).index = true;      // 單純首頁
            }
        }

        // B) "/xxx" → "xxx"（轉成相對路徑）
        if (typeof clone.path === "string" && clone.path.startsWith("/") && clone.path !== "/") {
            clone.path = clone.path.replace(/^\/+/, "");
        }

        // C) 若有人把 index 與 children 併用，強制改回群組（拿掉 index）
        if ((clone as any).index && hasChildren) {
            delete (clone as any).index;
            if (!clone.path) clone.path = "";   // 明確作為群組
        }

        return clone;
    });

interface Boot {
    lang?: Lang;
    cookieLang?: Lang;
    module: IRouteModule;
}

export const buildRoutes = async (boot: Boot): Promise<RouteObject[]> => {
    const routes = await boot.module.getRoutes();   // 等待 Promise
    const children = normalizeChildren(routes);


    return [
        // /:lang 家族（只做語系正規化）
        {
            path: "/:lang",
            loader: langGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />,      // 元件內只用 useLoaderData 取 resolvedLang；不再 useNavigate 導頁
            children: [
                ...children,
                { path: "*", element: <AutoRedirect to="." replace /> },
            ],
        },
        // 根 "/" 家族（不 redirect，只注入語系）
        {
            path: "/",
            loader: langGuardLoader,
            element: <LangGuard ssrAcceptLang={boot.lang} cookieLang={boot.cookieLang} />,
            children: [
                ...children,
                { path: "*", element: <AutoRedirect to="." replace /> },
            ],
        },
    ];
};

const assertNoIndexWithChildren = (routes: RouteObject[], parent = "") => {
    for (const r of routes) {
        const here = parent + "/" + (r.path ?? "(index)");
        if ((r as any).index && r.children?.length) {
            console.error("[Route Error] index route cannot have children:", { here, route: r });
            throw new Error(`Index route has children at "${here}"`);
        }
        if (r.children?.length) assertNoIndexWithChildren(r.children, here);
    }
};

export const createClientRouter = async (boot: Boot) => {
    const routes = await buildRoutes(boot);
    assertNoIndexWithChildren(routes);
    return createBrowserRouter(routes);
}

export const createServerRouter = async (boot: Boot, request: Request) => {
    // 1) 先產生 routes
    const routes = await buildRoutes(boot);
    assertNoIndexWithChildren(routes);
    // 2) 用 routes 建 handler，並跑一次 query 拿到 context
    const handler = createStaticHandler(routes);
    const context = await handler.query(request) as StaticHandlerContext;

    // 3) ★ 用 handler.dataRoutes 建 router（不是原始 routes）
    const router = createStaticRouter(handler.dataRoutes, context);

    return { router, context }; // 讓呼叫端渲染 <StaticRouterProvider />
};
