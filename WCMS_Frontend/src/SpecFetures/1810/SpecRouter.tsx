// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "../../Features/Client/ClientRouter";
import { BackendRouteModule } from "../../Features/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";

export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}