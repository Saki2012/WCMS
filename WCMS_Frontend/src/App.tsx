
import { BackendRouteModule } from "./Features/Server/ServerRouter"; // 可切換為 DefaultRouteModule
import { useRoutes } from "react-router-dom";
import type IRouteModule from "./SysCore/Interface/IBaseRouter";

import { TestApiCall } from './Test';


export default function App() {

  const routes:IRouteModule = new BackendRouteModule(); // 注入點
  const element = useRoutes(routes.getRoutes());

  return (
    <>
      {element}
    </>
  );
}