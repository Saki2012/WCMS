import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "@/Features/Pages/Client/Route/ClientRouter";
import { BackendRouteModule } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { type INormNode, type INormSite, type ModuleEntry } from "@/Features/Pages/Client/Route/Site-Routing";

import type { IHeaderMetaProps } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import type { Lang } from "@/SysCore/i18n/lang";
import { SubPage } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import SpecMusicalList, { type ISpecMusicalOptions } from "./Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalList";
import SpecMusicalForm from "@/SpecFetures/1817/Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalForm";
import { SpecMusicalList_Loader } from "./Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalList_Loader";
import { SpecMusicalForm_Loader } from "./Pages/Client/BizFunc/SpecModule/SpecMusical/SpecMusicalForm_Loader";


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
    children: (opts, lang, site: INormSite,node: INormNode) => {
      const musicalOpts = (opts as ISpecMusicalOptions) ?? {};
      return [
        { 
          index: true, 
          loader: SpecMusicalList_Loader({categoryIds: musicalOpts.Category ?? "", pageSize: 9,}),
          element: <SpecMusicalList options={musicalOpts} site={site} node={node} />,
        },
        {
          path: ":internalId",
          loader: SpecMusicalForm_Loader(),
          element: <SpecMusicalForm site={site} node={node} />,
        },
      ];
    },
  },
};


export const siteHeaderMeta: IHeaderMetaProps = { title: "國立臺北藝術大學_傳統音樂學系", description: "國立臺北藝術大學_傳統音樂學系" };