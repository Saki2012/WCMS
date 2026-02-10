import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { type RouteObject } from "react-router-dom";
import { configureModuleRegistry, createRoutesFromSite, type INormNode, type INormSite, type ModuleEntry } from "./Site-Routing";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { Lang } from "@/SysCore/i18n/lang";
import { SubPage, PageManagementForm, AnnouncementList, AnnouncementForm, FileArchiveList, GalleryListComp, GalleryForm, WebResourceListComp } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { type IPageManagementOptions, type IAnnouncementListOptions, type IFileArchiveOptions, type IGalleryListOptions, type IWebResourceListOptions } from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { specClientEntries } from "SpecFeature/SpecRouter";
import { Sitemap, SITEMAP_SEGMENT } from "../BizFunc/MainPage/Sitemap";
import { PGID } from "@/types/SchemaFields";
import { AnnouncementListLoader } from "../BizFunc/WebManagement/Announcement/AnnouncementList_Loader";
import { PageManagementForm_Loader } from "../BizFunc/WebManagement/PageManagement/PageManagementForm_Loader";
import { AnnouncementFormLoader } from "../BizFunc/WebManagement/Announcement/AnnouncementForm_Loader";
import { FileArchiveList_Loader } from "../BizFunc/WebManagement/FileArchive/FileArchiveList_Loader";
import { GalleryForm_Loader } from "../BizFunc/WebManagement/Gallery/GalleryForm_Loader";
import { GalleryList_Loader } from "../BizFunc/WebManagement/Gallery/GalleryList_Loader";
import { WebResourceList_Loader } from "../BizFunc/WebManagement/WebResource/WebResourceList_Loader";

import { loadSitesForRouting, type SiteRoutingInitialState } from "./ClientRouter_Loader";

export const loadClientChildren = async (opt?: { request?: Request; initialState?: SiteRoutingInitialState; }): Promise<RouteObject[]> => {
  // 宣告變數
  ensureClientRegistryInstalled();

  // 執行 function：SSR/CSR 共用（優先 initialState/window/cache，最後才打 API）
  const sites = await loadSitesForRouting(opt);
  const module = new FrontendRouteModule(sites);

  // return
  return module.getRoutes();
};

class FrontendRouteModule implements IRouteModule {
  sites: INormSite[];

  constructor(sites: INormSite[]) {
    this.sites = sites;
  }

  getRoutes(): RouteObject[] {
    // return
    return this.sites.flatMap(site => createRoutesFromSite(site));
  }
}

const clientEntries: Record<string, ModuleEntry> =
{
  [PGID.PageManagement]:
  {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (opts, lang, node: INormNode) => [
      {
        index: true,
        loader: PageManagementForm_Loader({ lang: lang, opts: opts as IPageManagementOptions }),
        element: <PageManagementForm lang={lang} options={opts as IPageManagementOptions} node={node} />
      },
    ],
  },

  [PGID.Announcement]:
  {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      {
        path: "List",
        loader: AnnouncementListLoader({ lang, opts: opts as IAnnouncementListOptions }),
        element: <AnnouncementList theme={Classic_FETheme} lang={lang} options={opts as IAnnouncementListOptions} node={node} />
      },
      {
        path: ":internalId",
        loader: AnnouncementFormLoader({ lang }),
        element: <AnnouncementForm node={node} theme={Classic_FETheme} lang={lang} />
      },
    ],
  },

  [PGID.FileArchive]:
  {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (opts, lang, node: INormNode) => [
      {
        index: true,
        loader: FileArchiveList_Loader({ lang: lang, opts: opts as IFileArchiveOptions }),
        element: <FileArchiveList theme={Classic_FETheme} lang={lang} options={opts as IFileArchiveOptions} node={node} />
      },
    ],
  },

  [PGID.Gallery]:
  {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (opts, lang, node: INormNode) => [
      { index: true, element: <AutoRedirect to="List" replace /> },
      {
        path: "List",
        loader: GalleryList_Loader({ lang, opts: opts as IGalleryListOptions }),
        element: <GalleryListComp node={node} theme={Classic_FETheme} lang={lang} options={opts as IGalleryListOptions} title={node.title} />
      },
      {
        path: ":internalId",
        loader: GalleryForm_Loader({ lang }),
        element: <GalleryForm node={node} theme={Classic_FETheme} lang={lang} />
      },
    ],
  },

  [PGID.WebResource]:
  {
    kind: "routes",
    element: (lang: Lang, site: INormSite, node: INormNode) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (opts, lang, node: INormNode) => [
      {
        index: true,
        loader: WebResourceList_Loader({ lang: lang, opts: opts as IWebResourceListOptions }),
        element: <WebResourceListComp node={node} theme={Classic_FETheme} lang={lang} options={opts as IWebResourceListOptions} title={node.title} />
      },
    ],
  },

  [SITEMAP_SEGMENT]:
  {
    kind: "routes",
    element: (lang, site, node) => (<SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />),
    children: (_opts, lang, _node, site) => [
      { index: true, element: <Sitemap lang={lang} site={site} /> },
    ],
  },
};

// 2) 安裝擴充（只做一次，避免 HMR 重覆）
let registryInstalled = false;

const ensureClientRegistryInstalled = (): void => {
  // 宣告變數
  const installed = registryInstalled;

  // 執行 function
  if (installed) return;

  configureModuleRegistry(base => ({
    ...base,
    ...clientEntries,
    ...specClientEntries, // 暫時寫上，之後看如何用繼承處理
  }));

  registryInstalled = true;

  // return
};
