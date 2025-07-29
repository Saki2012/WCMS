import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter"
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage"

import { PageFormComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_Form_Comp"
import { PageListComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_List_Comp"

import { AnnouncementListComp } from "./Layout/BizFunc/WebManagement/Announcement/Announcement_List_Comp";

import { Classic_BETheme } from "./Layout/Theme/ClassicTheme_Clsx";
import { CategoryListComp } from "./Layout/BizFunc/WebManagement/Category/Category_List_Comp";
import { TagListComp } from "./Layout/BizFunc/WebManagement/Tags/Tag_List_Comp";
import { AnnouncementFormComp } from "./Layout/BizFunc/WebManagement/Announcement/Announcement_Form_Comp";
export class BackendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      {
        path: '/Server',
        element: <DashboardPage theme={Classic_BETheme} />,
        children: [//之後再來想怎麼做到動態處理
          //#region 廣告輪播
          {
            path: "WebManagement/BannerSlider/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/BannerSlider/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 公告
          {
            path: "WebManagement/Announcement/Form/:internalId?",
            element: <AnnouncementFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Announcement/List",
            element: <AnnouncementListComp title="公告列表" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Announcement/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Announcement/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 頁面
          {
            path: "WebManagement/PageManage/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/PageManage/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/PageManage/Category",
            element: <CategoryListComp progId="PageManagement" title="類別" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 相簿
          {
            path: "WebManagement/Gallery/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Gallery/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Gallery/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/Gallery/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 檔案室
          {
            path: "WebManagement/FileManage/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/FileManage/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/FileManage/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/FileManage/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 網路資源
          {
            path: "WebManagement/WebResource/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/WebResource/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/WebResource/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/WebResource/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region 研究計劃
          {
            path: "ResearchProj/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "ResearchProj/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "ResearchProj/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "ResearchProj/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
          //#region USR
          {
            path: "USR/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "USR/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
          {
            path: "USR/Category",
            element: <CategoryListComp progId="Announcement" title="類別" theme={Classic_BETheme}/>,
          },
          {
            path: "USR/Tag",
            element: <TagListComp progId="Announcement" title="標籤" theme={Classic_BETheme}/>,
          },
          //#endregion
        ]
      }
    ];
  }
}


