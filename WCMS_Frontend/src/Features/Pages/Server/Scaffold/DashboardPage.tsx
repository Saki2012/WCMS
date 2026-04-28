import FooterComp from "@/Features/Pages/Server/Scaffold/Footer/Footer_Comp";
import BreadCrumb from "@/Features/Pages/Server/Scaffold/Menu/BreadCrumb/BreadCrumb_Comp";
import NavibarMenu from "@/Features/Pages/Server/Scaffold/Menu/NaviBar/NaviBar_Comp";
import SidebarMenu from "@/Features/Pages/Server/Scaffold/Menu/SideMenu/SideMenu_Comp";
import { type RouteHandleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import { ToastViewport_Comp } from "@/Features/Pages/Server/Scaffold/Toast/ToastViewport_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { Outlet, useMatches } from "react-router-dom";
import { GoTopButton } from "../../Client/Scaffold/MainFrame/GoTopButton";

export const DashboardPage = ({ theme }: { theme: IBETheme; }) =>
{
    const matches = useMatches();
    const lastHandle = [...matches].reverse().find(m => (m.handle as RouteHandleMeta | undefined))?.handle as RouteHandleMeta;
    const pageTitle = lastHandle?.title;
    const lastModule = [...matches].reverse().find(m => (m.handle as RouteHandleMeta | undefined)?.moduleCode);
    const moduleCode = (lastModule?.handle as RouteHandleMeta | undefined)?.moduleCode ?? "WebManagement"; // 你的預設

    return (
        <>
            <SidebarMenu moduleCode={moduleCode} />
            <NavibarMenu />
            <div className="pc-container">
                <div className="pc-content">
                    <div className="page-header">
                        <div className="page-block">
                            <div className="row align-items-center">
                                <div className="col-md-12">
                                    <div className="page-header-title">
                                        <h3 className="tit mb-0" aria-live="polite">{pageTitle || "　"}</h3>
                                    </div>
                                </div>
                                <div className="col-md-12">
                                    <BreadCrumb theme={theme} />
                                </div>
                            </div>
                        </div>
                    </div>
                    <Outlet /> {/* 中間會注入功能頁內容 */}
                </div>
                <FooterComp />
                <ToastViewport_Comp />
                <GoTopButton threshold={1} />
            </div>
        </>
    );
};
export default DashboardPage;
