import type {IRouteModule} from "../../SysCore/Interface/IBaseRouter";
import type { RouteObject } from "react-router-dom";
import Index from "./Pages/Index"
import HomePage  from "./Layout/BizFunc/HomePage"
import SubPages from "./Layout/BizFunc/SubPages"
import { Classic_FETheme } from "../../Features/Client/Layout/Theme/ClassicTheme_Clsx"
import { PageGridComp } from "./Page/PageGrid/PageGrid_Comp";

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
            element: <SubPages style={Classic_FETheme} />,
            children:[
              {
                path:"List",
                element:<PageGridComp theme={Classic_FETheme}></PageGridComp>
              },
              {
                path:":internalId?",
                element:<>rees</>
              },
            ]
          },
        ],
       },
    ];
  }
}
