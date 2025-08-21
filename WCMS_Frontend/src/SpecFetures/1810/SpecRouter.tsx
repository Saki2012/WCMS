// SpecFeatures/1810/Router.ts
import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import { loadClientChildren } from "../../Features/Client/ClientRouter";
import { BackendRouteModule } from "../../Features/Server/ServerRouter";
import type { RouteObject } from "react-router-dom";
import { configureModuleRegistry, type ModuleEntry } from "../../Features/Client/Site-Routing";
import SubContent from "../../Features/Client/Layout/BizFunc/MainPage/SubPages";
import { Classic_FETheme } from "../../Features/Client/Layout/Theme/ClassicTheme_Clsx";
import { SpecUSRListComp, type ISpecUSRListOptions } from "./Client/SpecUSR/SpecUSR_List";
import { SpecResearchListComp, type ISpecResearchListOptions } from "./Client/SpecResearch/SpecResearch_List";
import { AutoRedirect } from "../../SysCore/Utils/Route/AutoRedirect";
import { SpecUSRFormComp } from "./Client/SpecUSR/SpecUSR_Form";
import { SpecResearch_Form_Comp } from "./Client/SpecResearch/SpecResearch_Form";

export class SpecRouteModule implements IRouteModule {
  async getRoutes(): Promise<RouteObject[]> {
    installSpecClientEntries();
    const frontendRoutes = await loadClientChildren();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}

const specClientEntries: Record<string, ModuleEntry> = {
  SpecUSR: {
    kind: "routes",
    element: (_opts: unknown, _lang: string) => (
      <SubContent Style={Classic_FETheme} Title={"123"} />
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <SpecUSRListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecUSRListOptions} /> },
      { path: ":internalId", element: <SpecUSRFormComp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
  SpecResearch: {
    kind: "routes",
    element: (_opts: unknown, _lang: string) => (
      <SubContent Style={Classic_FETheme} Title={"123"} />
    ),
    children: (opts: unknown, lang: string) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <SpecResearchListComp Theme={Classic_FETheme} Lang={lang} Options={opts as ISpecResearchListOptions} /> },
      { path: ":internalId", element: <SpecResearch_Form_Comp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
};

/** 僅安裝一次，避免 HMR 重複註冊 */
let installed = false;
export const installSpecClientEntries = (): void => {
  if (installed) return;
  configureModuleRegistry((base) => ({ ...base, ...specClientEntries, }));
  installed = true;
};