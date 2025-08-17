// import { BackendRouteModule } from "./Features/Server/ServerRouter"; // 可切換為 DefaultRouteModule
// import { FrontendRouteModule } from "./Features/Client/ClientRouter"; // 可切換為 DefaultRouteModule
import { RouterProvider } from "react-router-dom";
import { SpecRouteModule } from "./SpecFetures/1810/SpecRouter"; // 可切換為 DefaultRouteModule
import { MessageProvider } from "./SysCore/Components/Message/Dialog/Dialog_Comp";
import type { IRouteModule } from "./SysCore/Interface/IBaseRouter";
// import { useEffect,useState } from "react";
import { makeBrowserRouter } from "./SysCore/Utils/Routes";

export default function App()
{
    const module: IRouteModule = new SpecRouteModule(); // 注入點
    const cookieLang = document.cookie.split("; ").find(row => row.startsWith("wcms.lang="))?.split("=")[1];
    const router = makeBrowserRouter({ cookieLang, module });

    // const element = useRoutes(routes.getRoutes());

    return (
        <MessageProvider>
            {/* {element} */}
            <RouterProvider router={router} />
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
