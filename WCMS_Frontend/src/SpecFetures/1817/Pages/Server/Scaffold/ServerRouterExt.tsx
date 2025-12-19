import type { RouteObject } from "react-router-dom";
import { AutoRedirect } from "@/SysCore/Utils/Route/AutoRedirect";
import { Classic_BETheme } from "@/Features/Pages/Server/Theme/ClassicTheme_Clsx";
import { DefaultLang } from "@/SysCore/i18n/lang";
import { SpecPGID } from "@/SpecFetures/1817/Hooks/Common/SpecProgId";
import { Server_SpecMusical_List_Comp } from "@/SpecFetures/1817/Pages/Server/BizFunc/SpecModule/SpecMusical/Server_SpecMusical_List_Comp";
import { Server_SpecMusical_Form_Comp } from "@/SpecFetures/1817/Pages/Server/BizFunc/SpecModule/SpecMusical/Server_SpecMusical_Form_Comp";
import { Server_CategoryListFormComp } from "@/Features/Pages/Server/BizFunc/WebManagement/Category/Category_ListForm_Comp";
import { buildProgHandle } from "@/Features/Pages/Server/Scaffold/Routes/ServerMenuIndex";

const ServerRouterExt = (routes: RouteObject[]): RouteObject[] => {
    const server = routes.find(r => r.path === "/Server");
    const web = server?.children?.find(r => r.path === "WebManagement");
    if (!web) return routes;
    web.children ??= [];
    web.children.push({
        path: SpecPGID.SpecMusical,
        handle: buildProgHandle("WebManagement", SpecPGID.SpecMusical),
        children: [
            { index: true, element: <AutoRedirect to="List" replace /> },
            { path: "Form/:internalId?", element: <Server_SpecMusical_Form_Comp theme={Classic_BETheme} lang={DefaultLang} /> },
            { path: "List", element: <Server_SpecMusical_List_Comp title="琵琶介紹列表" theme={Classic_BETheme} lang={DefaultLang} /> },
            { path: "Category/:internalId?", element: <Server_CategoryListFormComp progId={SpecPGID.SpecMusical} title="類別" theme={Classic_BETheme} lang={DefaultLang} /> },
        ],
    });
    return routes;
}

export default ServerRouterExt;
