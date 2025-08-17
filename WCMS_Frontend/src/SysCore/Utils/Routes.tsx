import { createBrowserRouter, Navigate, type RouteObject } from "react-router-dom";
import type { IRouteModule } from "../Interface/IBaseRouter";
import { LangGuard } from "./LangGuardRoute";

interface Boot
{
    cookieLang?: string;
    module: IRouteModule;
}
export const makeBrowserRouter = (boot: Boot) =>
{
    const baseRoutes: RouteObject[] = [
        {
            path: ":lang",
            element: <LangGuard cookieLang={boot.cookieLang} />,
            children: [...boot.module.getRoutes(), { path: "*", element: <Navigate to="/" replace /> }],
        },
        {
            path: "/",
            element: <LangGuard cookieLang={boot.cookieLang} />,
            children: [...boot.module.getRoutes(), { path: "*", element: <Navigate to="/" replace /> }],
        },
    ];
    return createBrowserRouter(baseRoutes);
};
