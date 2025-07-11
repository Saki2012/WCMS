import type { RouteObject } from "react-router-dom";

export default interface IRouteModule {
  getRoutes(): RouteObject[];
}