import { Outlet } from "react-router-dom";
import { MessageProvider } from "./SysCore/Components/Message/Dialog/Dialog_Comp";
import { HeaderMetaComp } from "./SysCore/Components/HeaderMeta/HeaderMeta_Comp";

type AppProps = { router: any };  // 簡化 typing，避免交叉型別拉扯

export const App: React.FC<AppProps> = () => {
    return (
        <MessageProvider>
            <HeaderMetaComp
                title={"國立臺灣藝術大學_研究發展處"}
                description={"國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處 / 國立臺灣藝術大學_研究發展處"}
                keywords={"國立臺灣藝術大學_研究發展處"}
            />
            {/* <RouterProvider router={router} /> */}
            <Outlet />
        </MessageProvider>
    );
}
export default App;