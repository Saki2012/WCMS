import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter"
import { type RouteObject } from "react-router-dom";
import DashboardPage from "@/Features/Pages/Server/Scaffold/DashboardPage"
import { Classic_BETheme } from "@/Features/Pages/Server/Theme/ClassicTheme_Clsx";
import LoginPage from "@/Features/Pages/Server/BizFunc/Auth/LoginPage";
import RequireAuth from "@/SysCore/Components/Auth/RequireAuth";
import LogoutPage from "@/Features/Pages/Server/BizFunc/Auth/LogoutPage";
import RegisterPage from "@/Features/Pages/Server/BizFunc/Auth/RegisterPage";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { ServerModuleRoutes, type IActionMeta, type IModuleMeta, type IProgMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { buildServerChildrenFromData } from "./ServerMenuIndex";

export interface RouteHandleMeta {
  moduleCode?: IModuleMeta["ModuleCode"];
  progId?: IProgMeta["ProgId"];
  actionCode?: IActionMeta["ActionCode"];
  title?: string;
}

export class BackendRouteModule implements IRouteModule {
  getRoutes(): RouteObject[] {
    const routes: RouteObject[] = [
      { path: '/Server/Login', element: <LoginPage /> },
      { path: '/Server/Logout', element: <LogoutPage /> },
      { path: '/Server/Register', element: <RegisterPage /> },
      {
        path: '/Server',
        handle: { title: "主控台" } as RouteHandleMeta,
        element: <RequireAuth> <DashboardPage theme={Classic_BETheme} /> </RequireAuth>,
        children: [
          ...buildServerChildrenFromData(ServerModuleRoutes, {
            theme: Classic_BETheme,
            lang: DefaultLang,
          }),
        ],
      },
    ];
    return routes;
  }
}
