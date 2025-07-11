// SpecFeatures/1810/Router.ts
import { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import { FrontendRouteModule } from "@/Features/Client/Router";
import { BackendRouteModule } from "@/Features/Server/Router";
import CustomNews from "@/SpecFeatures/1810/Client/NewsDetail";
import { RouteObject } from "react-router-dom";

export class SpecRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    const frontendRoutes = new FrontendRouteModule().getRoutes();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [
      { path: "/news/:id", element: <CustomNews /> }
    ];

    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}