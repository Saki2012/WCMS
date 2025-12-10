// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";

import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { SubPage } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import SpecMusicalList, { type ISpecMusicalOptions } from "./Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalList";
import SpecMusicalForm from "@/SpecFetures/1817/Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalForm";


export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}

export const specClientEntries: Record<string, ModuleEntry> = {
  SpecMusical: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <SpecMusicalList options={opts as ISpecMusicalOptions} node={node} /> },
      { path: ":internalId", element: <SpecMusicalForm node={node} /> },
    ],
  },
};


export const siteHeaderMeta: IHeaderMetaProps = { title: "國立臺北藝術大學_傳統音樂學系", description: "國立臺北藝術大學_傳統音樂學系", keywords: "國立臺北藝術大學_傳統音樂學系", };