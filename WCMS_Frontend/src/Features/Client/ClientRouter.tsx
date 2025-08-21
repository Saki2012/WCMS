import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import { Outlet, type RouteObject } from "react-router-dom";
import type { components } from "../../types/api";
type SiteMenuSet = components["schemas"]["SiteMenuSet"]
import SiteMenuSetProvider from "../Server/Layout/BizFunc/Dashboard/SiteInfo/SiteInfo_Api";
import * as SchemaFields from "../../types/SchemaFields";
import { configureModuleRegistry, createRoutesFromSite, normalizeSite, type INormSite, type ModuleEntry, type ModuleRegistry } from "./Site-Routing";
import type { QueryListCondition } from "../../SysCore/Interface/IApiProvider";
export const CLIENT_ROOT_ID = "client-root";

const fetchSite = async (): Promise<INormSite[]> => {
  const condition: QueryListCondition = { Fields: [SchemaFields.SiteMenu_IndexModelFields.InternalId], Condition: "", PageSize: 0, PageNumber: 0 };
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

import { PageManagementComp } from "./Layout/BizFunc/PageManagement/PageManagementForm";
import type { IPageManagementOptions } from "./Layout/BizFunc/PageManagement/PageManagementForm";
import SubContent from "./Layout/BizFunc/MainPage/SubPages";
import { AutoRedirect } from "../../SysCore/Utils/Route/AutoRedirect";
import { Classic_FETheme } from "./Layout/Theme/ClassicTheme_Clsx";
import { AnnouncementList, type IAnnouncementListOptions } from "./Layout/BizFunc/Announcement/AnnouncementList";


const clientEntries: Record<string, ModuleEntry> = {
  // 單一頁：progId = "PageManagement"
  PageManagement: {
    kind: "element",
    render: (opts, lang) => (
      <>測試:PageManagement{ }</>
      // <PageManagementComp lang={lang} options={opts as IPageManagementOptions} />
    ),
  },
  // 含子路由：progId = "Announcement"
  Announcement: {
    kind: "routes",
    element: (opts, lang) => (
      <SubContent Style={Classic_FETheme} Title={"123"}></SubContent>
    ),      // 父層要含 <Outlet/>
    children: (opts, lang) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      { path: "List", element: <AnnouncementList Theme={Classic_FETheme} Lang={lang} Options={opts as IAnnouncementListOptions} /> },
      { path: ":internalId", element: <>測試:AnnId</> },
    ],
  },
  FileArchive: {
    kind: "element",
    render: (opts, lang) => (
      <>測試:PageManagement</>
      // <PageManagementComp lang={lang} options={opts as IPageManagementOptions} />
    ),
  },
  Gallery: {
    kind: "routes",
    element: (opts, lang) => (
      // <SubContent style={Classic_FETheme} />
      <>測試:SubContent
        <Outlet />
      </>
    ),      // 父層要含 <Outlet/>
    children: (opts, lang) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      // { path: "List", element: <AnnouncementListComp /> },
      { path: "List", element: <>測試:AnnList</> },
      // { path: ":internalId", element: <AnnouncementFormComp /> },
    ],
  },
  WebResource: {
    kind: "element",
    render: (opts, lang) => (
      <>測試:PageManagement</>
      // <PageManagementComp lang={lang} options={opts as IPageManagementOptions} />
    ),
  },
};

// 2) 安裝擴充（只做一次，避免 HMR 重覆）
let registryInstalled = false;
export const ensureClientRegistryInstalled = () => {
  if (registryInstalled) return;
  configureModuleRegistry(base => ({
    ...base,          // 先帶入核心
    ...clientEntries, // 追加/覆寫（同 key 會覆蓋核心）
  }));


  registryInstalled = true;
};

