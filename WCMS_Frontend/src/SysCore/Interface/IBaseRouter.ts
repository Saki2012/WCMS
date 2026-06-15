import type { RouteObject } from "react-router-dom";

// #region Property
export interface IRouteBuildContext
{
    /** SSR 建立 route 時使用的 request。 */
    request?: Request;
}

export interface IRouteModule
{
    /** 取得目前模組的路由設定。 */
    getRoutes(ctx?: IRouteBuildContext): RouteObject[] | Promise<RouteObject[]>;
}
// #endregion
