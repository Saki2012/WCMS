import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter"
import type { RouteObject } from "react-router-dom";
import DashboardPage from "./Pages/DashboardPage"

import { PageFormComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_Form_Comp"
import { PageListComp } from "./Layout/BizFunc/WebManagement/PageManagement/PageManagement_List_Comp"
import { Classic_BETheme } from "./Layout/Theme/ClassicTheme_Clsx";

export class BackendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      {
        path: '/Server',
        element: <DashboardPage theme={Classic_BETheme} />,
        children: [//之後再來想怎麼做到動態處理
          {
            path: "WebManagement/PageManage/Form/:internalId?",
            element: <PageFormComp theme={Classic_BETheme}/>,
          },
          {
            path: "WebManagement/PageManage/List",
            element: <PageListComp title="頁面列表" theme={Classic_BETheme}/>,
          },
        ]
      }
    ];
  }
}


