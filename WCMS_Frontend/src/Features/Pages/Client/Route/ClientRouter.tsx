import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { type RouteObject } from "react-router-dom";
import type { components } from "@/types/api";
import SiteMenuProvider from "@/Features/Hooks/BizFunc/Dashboard/SiteMenu/SiteInfo_Api";
import * as SchemaFields from "@/types/SchemaFields";
import { configureModuleRegistry, createRoutesFromSite, normalizeSite, type INormNode, type INormSite, type ModuleEntry } from "./Site-Routing";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { Lang } from "@/SysCore/i18n/lang";
import { SubPage, PageManagementForm, AnnouncementList, AnnouncementForm, FileArchiveList, GalleryListComp, GalleryForm, WebResourceListComp } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { type IPageManagementOptions, type IAnnouncementListOptions, type IFileArchiveOptions, type IGalleryListOptions, type IWebResourceListOptions } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { specClientEntries } from "@/SpecFetures/1810/SpecRouter";



type QueryListParam = components["schemas"]["QueryListParam"];
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]

const fetchSite = async (): Promise<INormSite[]> => {
  const condition: QueryListParam = { Fields: [SchemaFields.SiteMenu_IndexFields.InternalId], Condition: "", PageSize: 0, PageNumber: 0 };
  const provider = SiteMenuProvider();
  const sites = await provider.fetchList(condition);
  if (!sites.IsSuccess || !Array.isArray(sites.Data)) return [];
  const rows = sites.Data as SiteMenuSet[];
  const tasks = rows.map(async (item) => {
    const id = item?.SiteMenu_Index?.InternalId as string
    if (!id) return null;
    const res = await provider.fetchData(id);
    if (!res.IsSuccess || !res.Data) return null;
    const payload = Array.isArray(res.Data) ? res.Data[0] : res.Data;
    return normalizeSite(payload as SiteMenuSet);
  });
  const result = await Promise.all(tasks);
  return result.filter((x): x is INormSite => !!x);
}
export const loadClientChildren = async (): Promise<RouteObject[]> => {
  ensureClientRegistryInstalled();           // ★ 必須在這裡呼叫一次，安裝/覆寫 registry
  const site = await fetchSite();
  const module = new FrontendRouteModule(site);
  return module.getRoutes();
};
export class FrontendRouteModule implements IRouteModule {
  sites: INormSite[];
  constructor(sites: INormSite[]) { this.sites = sites }
  getRoutes(): RouteObject[] {
    return this.sites.flatMap(site => createRoutesFromSite(site));
  }
}
export const clientEntries: Record<string, ModuleEntry> = {
  PageManagement: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <PageManagementForm lang={lang} options={opts as IPageManagementOptions} node={node} /> },
    ],
  },
  Announcement: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <AnnouncementList theme={Classic_FETheme} lang={lang} options={opts as IAnnouncementListOptions} node={node} /> },
      { path: ":internalId", element: <AnnouncementForm node={node} theme={Classic_FETheme} lang={lang} /> },
    ],
  },
  FileArchive: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <FileArchiveList theme={Classic_FETheme} lang={lang} options={opts as IFileArchiveOptions} node={node} /> },
    ],
  },
  Gallery: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <GalleryListComp node={node} theme={Classic_FETheme} lang={lang} options={opts as IGalleryListOptions} title={node.title} /> },
      { path: ":internalId", element: <GalleryForm node={node} theme={Classic_FETheme} lang={lang} /> },
    ],
  },
  WebResource: {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (
      <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />
    ),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <WebResourceListComp node={node} theme={Classic_FETheme} lang={lang} options={opts as IWebResourceListOptions} title={node.title} /> },
    ],
  },
};
// 2) 安裝擴充（只做一次，避免 HMR 重覆）
let registryInstalled = false;
export const ensureClientRegistryInstalled = () => {
  if (registryInstalled) return;
  configureModuleRegistry(base => ({
    ...base,          // 先帶入核心
    ...clientEntries, // 追加/覆寫（同 key 會覆蓋核心）
    ...specClientEntries //暫時寫上，之後看如何用繼承處理
  }));
  registryInstalled = true;
};

