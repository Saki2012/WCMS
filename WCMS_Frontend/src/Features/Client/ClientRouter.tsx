import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import { Outlet, type RouteObject } from "react-router-dom";
import type { components } from "../../types/api";
type SiteMenuSet = components["schemas"]["SiteMenuSet_DTO"]
import SiteMenuSetProvider from "../Server/Layout/BizFunc/Dashboard/SiteInfo/SiteInfo_Api";
import * as SchemaFields from "../../types/SchemaFields";
import { configureModuleRegistry, createRoutesFromSite, normalizeSite, type INormNode, type INormSite, type ModuleEntry } from "./Site-Routing";
import type { QueryListCondition } from "../../SysCore/Interface/IApiProvider";
export const CLIENT_ROOT_ID = "client-root";

const fetchSite = async (): Promise<INormSite[]> => {
  const condition: QueryListCondition = { Fields: [SchemaFields.SiteMenu_IndexFields.InternalId], Condition: "", PageSize: 0, PageNumber: 0 };
  const provider = SiteMenuSetProvider();
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

import { PageManagementFormComp } from "./Layout/BizFunc/PageManagement/PageManagementForm";
import type { IPageManagementOptions } from "./Layout/BizFunc/PageManagement/PageManagementForm";
import SubContent from "./Layout/BizFunc/MainPage/SubPages";
import { AutoRedirect } from "../../SysCore/Utils/Route/AutoRedirect";
import { Classic_FETheme } from "./Layout/Theme/ClassicTheme_Clsx";
import { AnnouncementList, type IAnnouncementListOptions } from "./Layout/BizFunc/Announcement/AnnouncementList";
import { AnnouncementFormComp } from "./Layout/BizFunc/Announcement/AnnouncementForm";
import { FileArchiveList, type IFileArchiveOptions } from "./Layout/BizFunc/FileArchive/FileArchiveList";
import { GalleryListComp, type IGalleryListOptions } from "./Layout/BizFunc/Gallery/GalleryList";
import { GalleryFormComp } from "./Layout/BizFunc/Gallery/GalleryForm";
import { WebResourceListComp, type IWebResourceListOptions } from "./Layout/BizFunc/WebResource/WebResourceList";
import { specClientEntries } from "../../SpecFetures/1810/SpecRouter";

export const clientEntries: Record<string, ModuleEntry> = {
  PageManagement: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts, lang) => [
      { index: true, element: <PageManagementFormComp lang={lang} options={opts as IPageManagementOptions} /> },
    ],
  },
  Announcement: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts, lang) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <AnnouncementList Theme={Classic_FETheme} Lang={lang} Options={opts as IAnnouncementListOptions} /> },
      { path: ":internalId", element: <AnnouncementFormComp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
  FileArchive: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts, lang) => [
      { index: true, element: <FileArchiveList Theme={Classic_FETheme} Lang={lang} Options={opts as IFileArchiveOptions} /> },
    ],
  },
  Gallery: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts, lang) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <GalleryListComp Theme={Classic_FETheme} Lang={lang} Options={opts as IGalleryListOptions} /> },
      { path: ":internalId", element: <GalleryFormComp Theme={Classic_FETheme} Lang={lang} /> },
    ],
  },
  WebResource: {
    kind: "routes",
    element: (lang: string, site: INormSite, node: INormNode) => (
      <SubContent Style={Classic_FETheme} Lang={lang} site={site} node={node}></SubContent>
    ),
    children: (opts, lang) => [
      { index: true, element: <WebResourceListComp Theme={Classic_FETheme} Lang={lang} Options={opts as IWebResourceListOptions} /> },
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

