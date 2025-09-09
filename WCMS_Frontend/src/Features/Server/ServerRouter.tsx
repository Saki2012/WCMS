import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter"
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage"
import { PageFormComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_Form_Comp"
import { PageListComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_List_Comp"
import { AnnouncementListComp } from "./Layout/BizFunc/WebManagement/Announcement/Announcement_List_Comp";
import { Classic_BETheme } from "./Layout/Theme/ClassicTheme_Clsx";
import { CategoryListFormComp } from "./Layout/BizFunc/WebManagement/Category/Category_ListForm_Comp";
import { TagListFormComp } from "./Layout/BizFunc/WebManagement/Tags/Tag_ListForm_Comp";
import { AnnouncementFormComp } from "./Layout/BizFunc/WebManagement/Announcement/Announcement_Form_Comp";
import { BannerSliderFormComp } from "./Layout/BizFunc/WebManagement/BannerSlider/BannerSlider_Form_Comp";
import { BannerSliderListComp } from "./Layout/BizFunc/WebManagement/BannerSlider/BannerSlider_List_Comp";
import LoginPage from "./Layout/BizFunc/Auth/LoginPage";
import RequireAuth from "../../SysCore/Components/Auth/RequireAuth";
import LogoutPage from "./Layout/BizFunc/Auth/LogoutPage";
import RegisterPage from "./Layout/BizFunc/Auth/RegisterPage";
import { GalleryFormComp } from "./Layout/BizFunc/WebManagement/Gallery/Gallery_Form_Comp";
import { GalleryListComp } from "./Layout/BizFunc/WebManagement/Gallery/Gallery_List_Comp";
import { FileArchiveListComp } from "./Layout/BizFunc/WebManagement/FileArchive/FileArchive_List_Comp";
import { FileArchiveFormComp } from "./Layout/BizFunc/WebManagement/FileArchive/FileArchive_Form_Comp";
import { WebResourceListComp } from "./Layout/BizFunc/WebManagement/WebResource/WebResource_List_Comp";
import { WebResourceFormComp } from "./Layout/BizFunc/WebManagement/WebResource/WebResource_Form_Comp";
import { ResearchProjFormComp } from "../../SpecFetures/1810/Server/BizFunc/SpecResearch/SpecResearch_Form_Comp";
import { ResearchProjListComp } from "../../SpecFetures/1810/Server/BizFunc/SpecResearch/SpecResearch_List_Comp";
import { USRProjFormComp } from "../../SpecFetures/1810/Server/BizFunc/SpecUSR/SpecUSR_Form_Comp";
import { USRProjListComp } from "../../SpecFetures/1810/Server/BizFunc/SpecUSR/SpecUSR_List_Comp";
import { AutoRedirect } from "../../SysCore/Utils/Route/AutoRedirect";
// import { UserManage_Comp } from "./Layout/BizFunc/UserDTs/UserInfo";
import { UserManageList_Comp } from "./Layout/BizFunc/UserDTs/UserInfo_List_Comp";
import { UserManage_Comp } from "./Layout/BizFunc/UserDTs/UserManage_Comp";

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
                  { path: 'Form/:internalId?', element: <AnnouncementFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <AnnouncementListComp title="公告列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="Announcement" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="Announcement" title="標籤" theme={Classic_BETheme} /> },
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
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="PageManagement" title="類別" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region 相簿
              {
                path: 'Gallery',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <GalleryFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <GalleryListComp title="相簿列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="Gallery" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="Gallery" title="標籤" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region 檔案室
              {
                path: 'FileManage',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <FileArchiveFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <FileArchiveListComp title="檔案室列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="FileManage" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="FileManage" title="標籤" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region 網路資源
              {
                path: 'WebResource',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <WebResourceFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <WebResourceListComp title="網路資源列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="WebResource" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="WebResource" title="標籤" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region 研究計劃
              {
                path: 'ResearchProj',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <ResearchProjFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <ResearchProjListComp title="研究計劃列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="SpecResearch" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="SpecResearch" title="標籤" theme={Classic_BETheme} /> },
                ],
              },
              //#endregion
              //#region USR
              {
                path: 'USR',
                children: [
                  { index: true, element: <AutoRedirect to="List" replace /> },
                  { path: 'Form/:internalId?', element: <USRProjFormComp theme={Classic_BETheme} /> },
                  { path: 'List', element: <USRProjListComp title="USR列表" theme={Classic_BETheme} /> },
                  { path: 'Category/:internalId?', element: <CategoryListFormComp progId="SpecUSR" title="類別" theme={Classic_BETheme} /> },
                  { path: 'Tag/:internalId?', element: <TagListFormComp progId="SpecUSR" title="標籤" theme={Classic_BETheme} /> },
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
