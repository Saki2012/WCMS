
// import { BackendRouteModule } from "./Features/Server/ServerRouter"; // 可切換為 DefaultRouteModule
// import { FrontendRouteModule } from "./Features/Client/ClientRouter"; // 可切換為 DefaultRouteModule
import { SpecRouteModule } from "./SpecFetures/1810/SpecRouter"; // 可切換為 DefaultRouteModule
import { useRoutes } from "react-router-dom";
import type {IRouteModule} from "./SysCore/Interface/IBaseRouter";
import { MessageProvider } from './SysCore/Components/Message/Dialog/Dialog_Comp';
// import { useEffect,useState } from "react";


export default function App() {
  const routes:IRouteModule = new SpecRouteModule(); // 注入點
  const element = useRoutes(routes.getRoutes());

  return (
      <MessageProvider>
        {element}
      </MessageProvider>
  );
}


// export default function App() {

//   useEffect(() => {
//     fetch('/api/RouteConfig')
//       .then(res => res.json())
//       .then(data => {
//         const transformed = convertToRoutes(data);
//         setRoutes(transformed);
//       });
//   }, []);

//   if (!routes) return <div>Loading...</div>;

//   const element = useRoutes(routes);
//   return <>{element}</>;
// }