import type { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import type { RouteObject } from "react-router-dom";
import Index from "./Layout/BizFunc/MainPage/Index"
import HomePage from "./Layout/BizFunc/MainPage/HomePage"
import SubPages from "./Layout/BizFunc/MainPage/SubPages"
import { Classic_FETheme } from "../../Features/Client/Layout/Theme/ClassicTheme_Clsx"
import { AnnouncementList } from "./Layout/BizFunc/Announcement/AnnouncementList";
import { PageContentComp } from "./Layout/BizFunc/Announcement/AnnouncementForm";
import { Navigate } from "react-router-dom";
export class FrontendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      {
        path: "/",
        element: <Index />,
        children: [
          { index: true, element: <HomePage /> },
          {
            path: "AllNews",
            element: <SubPages style={Classic_FETheme} />,
            children: [
              { index: true, element: <Navigate to="List" replace /> },
              {
                path: "List",
                element: <AnnouncementList theme={Classic_FETheme}></AnnouncementList>
              },
              {
                path: ":internalId",
                element: <PageContentComp theme={Classic_FETheme} />
              },
            ]
          },
        ],
      },
      { path: "*", element: <Navigate to="/" replace /> },
    ];
  }
}
