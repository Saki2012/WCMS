import type { RouteObject } from "react-router-dom";

// #region Property
export interface IRouteModule
{
    getRoutes(): RouteObject[] | Promise<RouteObject[]>;
}
// #endregion
