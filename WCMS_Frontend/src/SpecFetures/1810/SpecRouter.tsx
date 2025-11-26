// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";
import SubPage from "@/SpecFetures/1810/Pages/Client/Scaffold/SubPages/SubPage";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { SpecUSRListComp, type ISpecUSRListOptions } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_List";
import { SpecResearchListComp, type ISpecResearchListOptions } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecResearch/SpecResearch_List";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { SpecUSRFormComp } from "@/SpecFetures/1810/Pages/Client/BizFunc/WebManagement/SpecUSR/SpecUSR_Form";
import type { Lang } from "@/SysCore/i18n/lang";


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
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <SpecUSRListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecUSRListOptions} /> },
      { path: ":internalId", element: <SpecUSRFormComp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
  SpecResearch: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <SpecResearchListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecResearchListOptions} /> },
    ],
  },
};
