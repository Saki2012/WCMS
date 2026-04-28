import type { RouteObject } from "react-router-dom";

export interface IRouteModule
{
    getRoutes(): RouteObject[] | Promise<RouteObject[]>;
}
