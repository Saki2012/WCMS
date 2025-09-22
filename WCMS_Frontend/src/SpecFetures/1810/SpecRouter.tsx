// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Site-Routing";
import SubContent from "@/Features/Pages/Client/BizFunc/MainPage/SubPages";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { SpecUSRListComp, type ISpecUSRListOptions } from "./Pages/Client/SpecUSR/SpecUSR_List";
import { SpecResearchListComp, type ISpecResearchListOptions } from "./Pages/Client/SpecResearch/SpecResearch_List";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { SpecUSRFormComp } from "@/SpecFetures/1810/Pages/Client/SpecUSR/SpecUSR_Form";


export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}

export const specClientEntries: Record<string, ModuleEntry> = {
  SpecUSR: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <SpecUSRListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecUSRListOptions} /> },
      { path: ":internalId", element: <SpecUSRFormComp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
  SpecResearch: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <SpecResearchListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecResearchListOptions} /> },
    ],
  },
};
