// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";

export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}

export const specClientEntries: Record<string, ModuleEntry> = {};

//暫時先這樣做，之後將會把這些資訊改從後端設定回傳回來處理
export const siteHeaderMeta: IHeaderMetaProps = { title: "網站標題", description: "網站標題描述" };