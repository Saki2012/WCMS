import type IRouteModule from "../../SysCore/Interface/IBaseRouter"
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage"

import {PageListComp, PageFormComp} from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_Comp"
export class BackendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
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
      }
    ];
  }
}


