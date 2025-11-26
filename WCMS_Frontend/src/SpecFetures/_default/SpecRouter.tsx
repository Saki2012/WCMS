// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";

export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}

export const specClientEntries: Record<string, ModuleEntry> = {

};
