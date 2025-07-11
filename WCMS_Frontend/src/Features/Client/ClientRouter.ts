import { IRouteModule } from "../../SysCore/Interface/IBaseRouter";
import MainContent from "@/Features/Client/MainPageComp/MainContent";
import SubContent from "@/Features/Client/SubPageComp/SubPage";
import { RouteObject } from "react-router-dom";

export class BaseRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    return [
      { path: "/", element: <MainContent /> },
      { path: "/Allnews", element: <SubContent /> },
    ];
  }
}