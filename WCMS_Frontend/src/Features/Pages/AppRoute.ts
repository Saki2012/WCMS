import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import type { ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import { BackendRouteModule } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { IRouteBuildContext, IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { resolveSpecFunc } from "@/SysCore/Utils/Library/SlotResolver";
import type { RouteObject } from "react-router-dom";

// #region Property
const defaultSiteHeaderMeta: IHeaderMetaProps = { title: "網站標題", description: "網站標題描述" };
// #endregion

// #region Public
export class AppRouteModule implements IRouteModule
{
    // #region Public
    async getRoutes(ctx?: IRouteBuildContext): Promise<RouteObject[]>
    {
        const frontendRoutes = await loadClientChildren(ctx);
        const backendRoutes = new BackendRouteModule().getRoutes();
        const customRoutes = await getCustomRoutes();

        return [...frontendRoutes, ...backendRoutes, ...customRoutes];
    }
    // #endregion
}

export const getSpecClientEntries = (): Record<string, ModuleEntry> =>
{
    return resolveSpecFunc<Record<string, ModuleEntry>>("SpecRouter.tsx", emptyClientEntries(), ["specClientEntries", "default"]);
};

export const getCustomRoutes = async (): Promise<RouteObject[]> =>
{
    const resolver = resolveSpecFunc<() => Promise<RouteObject[]>>("Pages/Route/CustomRoutes.ts", emptyCustomRoutes, ["getCustomRoutes", "default"]);

    return await resolver();
};

export const getSiteHeaderMeta = (): IHeaderMetaProps =>
{
    return resolveSpecFunc<IHeaderMetaProps>("SpecRouter.tsx", defaultSiteHeaderMeta, ["siteHeaderMeta", "default"]);
};
// #endregion

// #region Private
const emptyClientEntries = (): Record<string, ModuleEntry> => ({});

const emptyCustomRoutes = async (): Promise<RouteObject[]> => [];
// #endregion
