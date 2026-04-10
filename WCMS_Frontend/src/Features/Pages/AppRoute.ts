import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import type { ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import { BackendRouteModule } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { RouteObject } from "react-router-dom";
export class AppRouteModule implements IRouteModule
{
    async getRoutes(): Promise<RouteObject[]>
    {
        const frontendRoutes = await loadClientChildren();
        const backendRoutes = new BackendRouteModule().getRoutes();
        const customRoutes = await getCustomRoutes();
        return [...frontendRoutes, ...backendRoutes, ...customRoutes];
    }
}
const emptyClientEntries = (): Record<string, ModuleEntry> => ({});
const emptyCustomRoutes = async (): Promise<RouteObject[]> => [];
export const getSpecClientEntries = (): Record<string, ModuleEntry> =>
{
    return resolveSpecFunc<Record<string, ModuleEntry>>(
        "SpecRouter.tsx",
        emptyClientEntries(),
        ["specClientEntries", "default"],
    );
};
export const getCustomRoutes = async (): Promise<RouteObject[]> =>
{
    const resolver = resolveSpecFunc<() => Promise<RouteObject[]>>(
        "Pages/Route/CustomRoutes.ts",
        emptyCustomRoutes,
        ["getCustomRoutes", "default"],
    );

    return await resolver();
};

const defaultSiteHeaderMeta: IHeaderMetaProps = { title: "網站標題", description: "網站標題描述" };
export const getSiteHeaderMeta = (): IHeaderMetaProps =>
{
    return resolveSpecFunc<IHeaderMetaProps>(
        "SpecRouter.tsx",
        defaultSiteHeaderMeta,
        ["siteHeaderMeta", "default"],
    );
};
