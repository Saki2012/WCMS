import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
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
export const siteHeaderMeta: IHeaderMetaProps = { title: "國立中興大學全球事務研究跨洲碩士學位學程", description: "國立中興大學全球事務研究跨洲碩士學位學程" };