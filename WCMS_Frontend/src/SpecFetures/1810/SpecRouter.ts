// SpecFeatures/1810/Router.ts
import type{ IRouteModule }  from "../../SysCore/Interface/IBaseRouter";
import { FrontendRouteModule } from "../../Features/Client/ClientRouter";
import { BackendRouteModule } from "../../Features/Server/ServerRouter";
import type{ RouteObject } from "react-router-dom";

export class SpecRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    const frontendRoutes = new FrontendRouteModule().getRoutes();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [
      // { path: "/news/:id", element: <CustomNews /> }
    ];

    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}