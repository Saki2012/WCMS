import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter"
import type { RouteObject } from "react-router-dom";
import DashboardPage from "@/Features/Pages/Server/Scaffold/DashboardPage"
import { PageFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/PageManagement/Server_PageManagement_Form_Comp"
import { PageListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/PageManagement/Server_PageManagement_List_Comp"
import { Server_AnnouncementListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Announcement/Server_Announcement_List_Comp";
import { Classic_BETheme } from "@/Features/Pages/Server/Theme/ClassicTheme_Clsx";
import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_ListForm_Comp";
import { TagListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Tags/Server_Tag_ListForm_Comp";
import { Server_AnnouncementFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Announcement/Server_Announcement_Form_Comp";
import { BannerSliderFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Banner/Server_BannerSlider_Form_Comp";
import { BannerSliderListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Banner/Server_BannerSlider_List_Comp";
import LoginPage from "@/Features/Pages/Server/BizFunc/Auth/LoginPage";
import RequireAuth from "@/SysCore/Components/Auth/RequireAuth";
import LogoutPage from "@/Features/Pages/Server/BizFunc/Auth/LogoutPage";
import RegisterPage from "@/Features/Pages/Server/BizFunc/Auth/RegisterPage";
import { Server_GalleryFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Gallery/Server_Gallery_Form_Comp";
import { Server_GalleryListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Gallery/Server_Gallery_List_Comp";
import { Server_FileArchiveListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/FileArchive/Server_FileArchive_List_Comp";
import { Server_FileArchiveFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/FileArchive/Server_FileArchive_Form_Comp";
import { WebResourceListComp } from "@/Features/Pages/Server/BizFunc/WebManagement/WebResource/Server_WebResource_List_Comp";
import { WebResourceFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/WebResource/Server_WebResource_Form_Comp";
import { Server_ResearchProjFormComp } from "@/SpecFetures/1810/Pages/Server/SpecResearch/Server_SpecResearch_Form_Comp";
import { Server_ResearchProjListComp } from "@/SpecFetures/1810/Pages/Server/SpecResearch/Server_SpecResearch_List_Comp";
import { Server_USRProjFormComp } from "@/SpecFetures/1810/Pages/Server/SpecUSR/Server_SpecUSR_Form_Comp";
import { USRProjListComp } from "@/SpecFetures/1810/Pages/Server/SpecUSR/Server_SpecUSR_List_Comp";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { UserManageList_Comp } from "@/Features/Pages/Server/BizFunc/UserDTs/UserInfo_List_Comp";
import { UserManage_Comp } from "@/Features/Pages/Server/BizFunc/UserDTs/UserManage_Comp";
import { SiteMenu_Comp } from "@/Features/Pages/Server/BizFunc/Dashboard/SiteMenu/SiteMenu_Comp";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { Server_SpecCategoryListFormComp } from "@/SpecFetures/1810/Pages/Server/SpecCategory/Server_SpecCategory_ListForm_Comp";

export class BackendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      { path: '/Server/Login', element: <LoginPage /> },
      { path: '/Server/Logout', element: <LogoutPage /> },
      { path: '/Server/Register', element: <RegisterPage /> },
      {
        path: '/Server',
        element:
          <RequireAuth>
            <DashboardPage theme={Classic_BETheme} />
          </RequireAuth>
        , children: [

          //#region 網站管理
          {
            path: 'Dashboard',
            children: [
              { index: true, element: <AutoRedirect to="SiteMenu" replace />, },
              {
                path: 'SiteMenu',
                children: [
                  { index: true, element: <SiteMenu_Comp theme={Classic_BETheme} /> },
                ],
              },
            ]
          },
          //#endregion
          //#region 賬號管理
          {
            path: 'AccountManage',
            children: [
              { index: true, element: <AutoRedirect to="UserDTs/Form" replace />, },
              {
                path: 'UserDTs',
                children: [
                  { index: true, element: <AutoRedirect to="Form" replace /> },
                  { path: 'List', element: <UserManageList_Comp theme={Classic_BETheme} /> },
                  { path: 'Form/:internalId?', element: <UserManage_Comp theme={Classic_BETheme} /> },
                ],
              },
            ]
          },
          //#endregion
          //#region 網站功能管理
          {
            path: 'WebManagement',
            children: [
              { index: true, element: <AutoRedirect to="Announcement/List" replace />, },
              //#region 廣告輪播
              {
                path: 'BannerSlider',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <BannerSliderFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <BannerSliderListComp title="廣告輪播列表" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region 公告
              {
                path: 'Announcement',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <Server_AnnouncementFormComp theme={Classic_BETheme} lang={"zh-tw"} /> },
                  { path: 'List', element: <Server_AnnouncementListComp title="公告列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <Server_CategoryListFormComp progId="Announcement" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="Announcement" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region 頁面
              {
                path: 'PageManage',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <PageFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <PageListComp title="頁面列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <Server_CategoryListFormComp progId="PageManagement" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region 相簿
              {
                path: 'Gallery',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <Server_GalleryFormComp theme={Classic_BETheme} lang={'zh-tw'} /> },
                  { path: 'List', element: <Server_GalleryListComp title="相簿列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <Server_CategoryListFormComp progId="Gallery" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="Gallery" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region 檔案室
              {
                path: 'FileArchive',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <Server_FileArchiveFormComp theme={Classic_BETheme} lang={"zh-tw"} /> },
                  { path: 'List', element: <Server_FileArchiveListComp title="檔案室列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <Server_CategoryListFormComp progId="FileArchive" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="FileArchive" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region 網路資源
              {
                path: 'WebResource',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <WebResourceFormComp theme={Classic_BETheme} lang={"zh-tw"} /> },
                  { path: 'List', element: <WebResourceListComp title="網路資源列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <Server_CategoryListFormComp progId="WebResource" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="WebResource" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region 研究計劃
              {
                path: 'ResearchProj',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <Server_ResearchProjFormComp theme={Classic_BETheme} lang={'zh-tw'} /> },
                  { path: 'List', element: <Server_ResearchProjListComp title="研究計劃列表" theme={Classic_BETheme} /> },
                  { path: 'SpecCategory/:internalId?', element: <Server_SpecCategoryListFormComp progId="SpecResearch" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="SpecResearch" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
              //#region USR
              {
                path: 'USR',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <Server_USRProjFormComp theme={Classic_BETheme} lang={"zh-tw"} /> },
                  { path: 'List', element: <USRProjListComp title="USR列表" theme={Classic_BETheme} /> },
                  { path: 'SpecCategory/:internalId?', element: <Server_SpecCategoryListFormComp progId="SpecUSR" title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="SpecUSR" title="標籤" theme={Classic_BETheme} lang={DefaultLang} /> },
                ],
              },
              //#endregion
            ],
          },
          //#endregion
        ],
      },
    ];
  }

}
