// SpecFeatures/1810/Router.ts
import type{ IRouteModule }  from "../../SysCore/Interface/IBaseRouter";
import { FrontendRouteModule } from "../../Features/Client/ClientRouter";
import { BackendRouteModule } from "../../Features/Server/ServerRouter";
import type{ RouteObject } from "react-router-dom";
import DashboardPage from "../../Features/Server/Pages/DashboardPage"
import { Classic_BETheme } from "../../Features/Server/Layout/Theme/ClassicTheme_Clsx";



export class SpecRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    const frontendRoutes = new FrontendRouteModule().getRoutes();
    const backendRoutes = new BackendRouteModule().getRoutes();
    const customRoutes: RouteObject[] = [
      // {
        // path: '/Server',
        // element: <DashboardPage theme={Classic_BETheme} />,
        // children: [
        //   {
        //     path: "ResearchProj/Form/:internalId?",
        //     element: <></>,
        //   },
        //   {
        //     path: "ResearchProj/List",
        //     element: <></>,
        //   },
        //   {
        //     path: "ResearchProj/Category",
        //     element: <></>,
        //   },
        //   {
        //     path:"ResearchProj/Tag",
        //     element: <></>,
        //   }
        // ]
      // }
    ];
    return [...frontendRoutes, ...backendRoutes, ...customRoutes];
  }
}