// src/SysCore/Utils/Routes.tsx
import { createBrowserRouter, type RouteObject, Navigate } from "react-router-dom";
import { createStaticRouter, type StaticHandlerContext } from "react-router-dom/server";
import type { IRouteModule } from "../Interface/IBaseRouter";
import { LangGuard } from "./LangGuardRoute";
import { langGuardLoader } from "./langGuardLoader";
import type { Lang } from "../i18n/lang";

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

export const buildRoutes = (boot: Boot): RouteObject[] => {
    const children = normalizeChildren(boot.module.getRoutes());
    const resolvedLang = (boot.lang ?? boot.cookieLang ?? "zh-tw") as Lang;

    return [
        // /:lang 家族（只做語系正規化）
        {
            path: "/:lang",
            loader: langGuardLoader,
            element: <LangGuard resolvedLang={resolvedLang} />,      // 元件內只用 useLoaderData 取 resolvedLang；不再 useNavigate 導頁
            children: [
                ...children,
                { path: "*", element: <Navigate to="." replace /> },
            ],
        },
        // 根 "/" 家族（不 redirect，只注入語系）
        {
            path: "/",
            loader: langGuardLoader,
            element: <LangGuard resolvedLang={resolvedLang} />,
            children: [
                ...children,
                { path: "*", element: <Navigate to="." replace /> },
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

export const createClientRouter = (boot: Boot) => {
    const routes = buildRoutes(boot);
    assertNoIndexWithChildren(routes);
    return createBrowserRouter(buildRoutes(boot));
}

export const createServerRouter = (boot: Boot, context: StaticHandlerContext) => {
    const routes = buildRoutes(boot);
    assertNoIndexWithChildren(routes);
    return createStaticRouter(buildRoutes(boot), context);
}
