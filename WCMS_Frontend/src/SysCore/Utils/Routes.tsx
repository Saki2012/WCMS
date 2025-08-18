import { createBrowserRouter, createMemoryRouter, Navigate, type RouteObject } from "react-router-dom";
import type { IRouteModule } from "../Interface/IBaseRouter";
import { LangGuard } from "./LangGuardRoute";
import { createStaticRouter } from "react-router-dom/server";

// 將任何「絕對子路由」轉成相對 / index（遞迴處理）
const normalizeChildren = (routes: RouteObject[]): RouteObject[] =>
    routes.map((r) => {
        const clone: RouteObject = { ...r };

        // 先遞迴 children
        if (clone.children?.length) {
            clone.children = normalizeChildren(clone.children);
        }

        // A) "/" 情況：有 children -> 用空字串；無 children -> 用 index
        if (clone.path === "/") {
            if (clone.children?.length) {
                clone.path = "";           // pathless，相對父層，可帶 children
            } else {
                delete clone.path;
                (clone as any).index = true;
            }
        }

        // B) "/xxx" -> "xxx"
        if (typeof clone.path === "string" && clone.path.startsWith("/") && clone.path !== "/") {
            clone.path = clone.path.slice(1);
        }

        // C) 若誤成 index 且還有 children -> 改回可帶 children 的空字串路由
        if ((clone as any).index && clone.children?.length) {
            delete (clone as any).index;
            clone.path = "";
        }

        return clone;
    });


interface Boot {
    lang?: string;
    module: IRouteModule;
}
const buildRoutes = (boot: Boot) => {
    const children = normalizeChildren(boot.module.getRoutes()); // ★ 在此防呆

    return [
        {
            path: "/:lang",
            element: <LangGuard cookieLang={boot.lang} />,
            children: [...children, { path: "*", element: <Navigate to="." replace /> }],
        },
        {
            path: "/",
            element: <LangGuard cookieLang={boot.lang} />,
            children: [...children, { path: "*", element: <Navigate to="." replace /> }],
        },
    ];
};

export const createClientRouter = (boot: Boot) => {
    return createBrowserRouter(buildRoutes(boot));
}

export const createServerRouter = (boot: Boot, url: string) => {
    return createMemoryRouter(buildRoutes(boot), { initialEntries: [url] });
    // return createStaticRouter(buildRoutes(boot), { location: url });

}