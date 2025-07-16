import type IRouteModule from "../../SysCore/Interface/IBaseRouter";
import type { RouteObject } from "react-router-dom";
import Index from "./Pages/Index"
import HomePage  from "./Layout/BizFunc/HomePage"
import SubPages from "./Layout/BizFunc/SubPages"

/**以下後臺的之後移除 */
import DashboardPage from "../Server/Pages/DashboardPage"
import { PageFormComp } from "../Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_Form_Comp"
import { PageListComp } from "../Server/Layout/BizFunc/WebManagement/PageManagement/PageManagement_List_Comp"

export class FrontendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      { path: "/", 
        element: <Index />,
        children:[
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "AllNews",
            element: <SubPages />,
          },

        ],
       },
      /** 下面是後台的，之後移除 */
      {
        path: '/Server',
        element: <DashboardPage />,
        children: [
          {
            path: "WebManagement/PageManage/AddNew",
            element: <PageFormComp />,
          },
          {
            path: "WebManagement/PageManage/List",
            element: <PageListComp />,
          },
        ]
      },
    ];
  }
}
