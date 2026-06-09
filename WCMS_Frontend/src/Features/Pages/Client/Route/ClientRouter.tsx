import {
    AnnouncementForm,
    AnnouncementList,
    FileArchiveList,
    GalleryListComp,
    PageManagementForm,
    SubPage,
    WebResourceListComp,
} from "@/Features/Pages/Client/Route/ClientComponentResolver";
import {
    type IAnnouncementListOptions,
    type IFileArchiveOptions,
    type IGalleryListOptions,
    type IPageManagementOptions,
    type IWebResourceListOptions,
} from "@/Features/Pages/Client/Route/ClientComponentResolver";
import { Classic_FETheme } from "@/Features/Pages/Client/Theme/ClassicTheme_Clsx";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { PGID } from "@/types/SchemaFields";
import { type LoaderFunction, type LoaderFunctionArgs, type RouteObject } from "react-router-dom";
import { getSpecClientEntries } from "../../AppRoute";
import { Sitemap, SITEMAP_SEGMENT } from "../BizFunc/MainPage/Sitemap/Sitemap";
import { Client_Material_Form_Comp } from "../BizFunc/MAT/Material/Client_Material_Form_Comp";
import { Client_Material_Form_Loader } from "../BizFunc/MAT/Material/Client_Material_Form_Loader";
import { Client_Material_List_Comp } from "../BizFunc/MAT/Material/Client_Material_List_Comp";
import { Client_Material_List_Loader, type IMaterialListOptions } from "../BizFunc/MAT/Material/Client_Material_List_Loader";
import { AnnouncementFormLoader } from "../BizFunc/WEB/Announcement/Client_Announcement_Form_Loader";
import { AnnouncementListLoader } from "../BizFunc/WEB/Announcement/Client_Announcement_List_Loader";
import { Client_FileArchiveList_Loader } from "../BizFunc/WEB/FileArchive/Client_FileArchive_List_Loader";
import { Client_Gallery_Form } from "../BizFunc/WEB/Gallery/Client_Gallery_Form_Comp";
import { Client_Gallery_Form_Loader } from "../BizFunc/WEB/Gallery/Client_Gallery_Form_Loader";
import { GalleryList_Loader } from "../BizFunc/WEB/Gallery/Client_Gallery_List_Loader";
import { Client_PageManagement_Form_Loader } from "../BizFunc/WEB/PageManagement/Client_PageManagement_Form_Loader";
import { Client_Survey_Form_Comp } from "../BizFunc/WEB/Survey/Client_Survey_Form_Comp";
import { Client_Survey_Form_Loader, type ISurveyOptions } from "../BizFunc/WEB/Survey/Client_Survey_Form_Loader";
import { Client_Timeline_Form } from "../BizFunc/WEB/Timeline/Client_Timeline_Form_Comp";
import { Client_TimelineForm_Loader, type ITimelineOptions } from "../BizFunc/WEB/Timeline/Client_Timeline_Form_Loader";
import { Client_WebResourceList_Loader } from "../BizFunc/WEB/WebResource/Client_WebResource_List_Loader";
import { loadSitesForRouting, type SiteRoutingInitialState } from "./ClientRouter_Loader";
import { configureModuleRegistry, createRoutesFromSite, type INormNode, type INormSite, type ModuleEntry } from "./Site-Routing";

// #region Property
/** 前台功能模組路由註冊表，依 PGID 或固定 segment 對應實際 Component 與 Loader。 */
const clientEntries: Record<string, ModuleEntry> = {
    /** 單頁內容模組路由設定。 */
    [PGID.PageManagement]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_PageManagement_Form_Loader({ lang: lang, opts: opts as IPageManagementOptions })),
            element: <PageManagementForm lang={lang} options={opts as IPageManagementOptions} site={site} node={node} />,
        }],
    },
    /** 公告模組路由設定。 */
    [PGID.Announcement]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => AnnouncementListLoader({ lang, opts: opts as IAnnouncementListOptions })),
            element: <AnnouncementList theme={Classic_FETheme} lang={lang} options={opts as IAnnouncementListOptions} site={site} node={node} />,
        }, {
            path: ":internalId",
            loader: withRequestLang((lang) => AnnouncementFormLoader({ lang })),
            element: <AnnouncementForm site={site} node={node} theme={Classic_FETheme} lang={lang} />,
        }],
    },
    /** 檔案下載模組路由設定。 */
    [PGID.FileArchive]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_FileArchiveList_Loader({ lang: lang, opts: opts as IFileArchiveOptions })),
            element: <FileArchiveList theme={Classic_FETheme} lang={lang} options={opts as IFileArchiveOptions} site={site} node={node} />,
        }],
    },
    /** 相簿模組路由設定。 */
    [PGID.Gallery]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => GalleryList_Loader({ lang, opts: opts as IGalleryListOptions })),
            element: <GalleryListComp node={node} theme={Classic_FETheme} lang={lang} options={opts as IGalleryListOptions} site={site} title={node.title} />,
        }, {
            path: ":internalId",
            loader: withRequestLang((lang) => Client_Gallery_Form_Loader({ lang })),
            element: <Client_Gallery_Form site={site} node={node} theme={Classic_FETheme} lang={lang} />,
        }],
    },
    /** 相關連結模組路由設定。 */
    [PGID.WebResource]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_WebResourceList_Loader({ lang: lang, opts: opts as IWebResourceListOptions })),
            element: <WebResourceListComp site={site} node={node} theme={Classic_FETheme} lang={lang} options={opts as IWebResourceListOptions} title={node.title} />,
        }],
    },
    /** 大事紀模組路由設定。 */
    [PGID.Timeline]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_TimelineForm_Loader({ lang: lang, opts: opts as ITimelineOptions })),
            element: <Client_Timeline_Form lang={lang} options={opts as ITimelineOptions} site={site} node={node} />,
        }],
    },
    /** 問卷模組路由設定。 */
    [PGID.Survey]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_Survey_Form_Loader({ lang: lang, opts: opts as ISurveyOptions })),
            element: <Client_Survey_Form_Comp lang={lang} options={opts as ISurveyOptions} site={site} node={node} />,
        }],
    },
    /** 資料集模組路由設定。 */
    [PGID.Material]: {
        kind: "routes",
        element: (lang: Lang, site: INormSite, node: INormNode) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (opts, lang, site, node) => [{
            index: true,
            loader: withRequestLang((lang) => Client_Material_List_Loader({ lang, opts: opts as IMaterialListOptions })),
            element: <Client_Material_List_Comp theme={Classic_FETheme} lang={lang} options={opts as IMaterialListOptions} site={site} node={node} />,
        }, {
            path: ":internalId",
            loader: withRequestLang((lang) => Client_Material_Form_Loader({ lang })),
            element: <Client_Material_Form_Comp site={site} node={node} theme={Classic_FETheme} lang={lang} />,
        }],
    },
    /** Sitemap 固定路由設定。 */
    [SITEMAP_SEGMENT]: {
        kind: "routes",
        element: (lang, site, node) => <SubPage style={Classic_FETheme} lang={lang} site={site} node={node} />,
        children: (_opts, lang, site, _node) => [{ index: true, element: <Sitemap lang={lang} site={site} /> }],
    },
};
/** 記錄前台模組註冊表是否已安裝，避免 HMR 重複註冊。 */
let registryInstalled = false;
/** 載入前台路由 children 使用的參數。 */
interface ILoadClientChildrenOptions
{
    /** SSR request，可供 loader 解析語系與 cookie。 */
    request?: Request;
    /** SSR 已注入的站台路由初始資料。 */
    initialState?: SiteRoutingInitialState;
}
/** 建立帶入語系後的 React Router loader。 */
type CreateLoader = (lang: Lang) => LoaderFunction;
// #endregion

// #region Public
/** 載入前台站台資料並轉成 React Router children routes。 */
export const loadClientChildren = async (opt?: ILoadClientChildrenOptions): Promise<RouteObject[]> =>
{
    ensureClientRegistryInstalled();
    const sites = await loadSitesForRouting(opt);
    const module = new FrontendRouteModule(sites);
    return module.getRoutes();
};
/** 包裝前台 loader，使每個功能 loader 可依 request 自動解析目前語系。 */
export const withRequestLang = (create: CreateLoader): LoaderFunction =>
{
    const loader: LoaderFunction = (args: LoaderFunctionArgs) =>
    {
        const lang = LibRouteLang.resolveRouteLangFromRequest(args.request);
        const run = create(lang);
        return run(args);
    };
    return loader;
};
// #endregion

// #region Private
/** 前台 React Router 模組，負責將站台資料轉成實際路由設定。 */
class FrontendRouteModule implements IRouteModule
{
    // #region Property
    /** 正規化後的前台站台資料清單。 */
    sites: INormSite[];
    // #endregion

    // #region Public
    /** 建立前台路由模組並保存站台資料。 */
    constructor(sites: INormSite[])
    {
        this.sites = sites;
    }

    /** 取得所有站台展開後的前台路由。 */
    public getRoutes(): RouteObject[]
    {
        return this.sites.flatMap(site => createRoutesFromSite(site));
    }
    // #endregion
}
/** 安裝前台功能模組註冊表，已安裝時不重複處理。 */
const ensureClientRegistryInstalled = (): void =>
{
    const installed = registryInstalled;
    if (installed) return;
    configureModuleRegistry(base => ({ ...base, ...clientEntries, ...getSpecClientEntries() }));
    registryInstalled = true;
};
// #endregion
