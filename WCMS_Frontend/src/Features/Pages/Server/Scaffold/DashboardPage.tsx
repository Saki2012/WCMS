import { GoTop } from "@/Features/Pages/Client/Scaffold/MainFrame/GoTop/GoTop";
import { FooterComp } from "@/Features/Pages/Server/Scaffold/Footer/Footer_Comp";
import { BreadCrumb } from "@/Features/Pages/Server/Scaffold/Menu/BreadCrumb/BreadCrumb_Comp";
import { NavibarMenu } from "@/Features/Pages/Server/Scaffold/Menu/NaviBar/NaviBar_Comp";
import { SidebarMenu } from "@/Features/Pages/Server/Scaffold/Menu/SideMenu/SideMenu_Comp";
import { type RouteHandleMeta } from "@/Features/Pages/Server/Scaffold/Routes/ServerRouter";
import { ToastViewport_Comp } from "@/Features/Pages/Server/Scaffold/Toast/ToastViewport_Comp";
import type { IBETheme } from "@/Features/Pages/Server/Theme/ITheme";
import { useEffect, useState } from "react";
import { Outlet, useLocation, useMatches } from "react-router-dom";
import { useSiteFooterRuntime } from "../../Client/Route/ClientRouter_Loader";

// #region Public
export const DashboardPage = ({ theme }: { theme: IBETheme; }) =>
{
    const matches = useMatches();
    const location = useLocation();
    const lastHandle = [...matches].reverse().find(m => (m.handle as RouteHandleMeta | undefined))?.handle as RouteHandleMeta;
    const pageTitle = lastHandle?.title;
    const lastModule = [...matches].reverse().find(m => (m.handle as RouteHandleMeta | undefined)?.moduleCode);
    const moduleCode = (lastModule?.handle as RouteHandleMeta | undefined)?.moduleCode ?? "WebManagement"; // 你的預設
    const footerVm = useSiteFooterRuntime("");

    /** 控制桌機 Sidebar 是否收合，沿用既有 pc-sidebar-hide 樣式契約。 */
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

    /** 控制行動版 Sidebar 是否顯示，沿用既有 mob-sidebar-active 樣式契約。 */
    const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

    /** 切換桌機 Sidebar 收合狀態。 */
    const handleSidebarToggle = () =>
    {
        setIsSidebarCollapsed(value => !value);
    };

    /** 切換行動版 Sidebar 顯示狀態。 */
    const handleMobileSidebarToggle = () =>
    {
        setIsMobileSidebarOpen(value => !value);
    };

    /** 關閉行動版 Sidebar，供遮罩與導頁完成後統一收合。 */
    const handleMobileSidebarClose = () =>
    {
        setIsMobileSidebarOpen(false);
    };

    useEffect(() =>
    {
        /** 後台路由完成切換後收合手機 Sidebar，避免新頁面仍被側欄覆蓋。 */
        setIsMobileSidebarOpen(false);
    }, [location.pathname]);

    return (
        <>
            <SidebarMenu
                moduleCode={moduleCode}
                isCollapsed={isSidebarCollapsed}
                isMobileOpen={isMobileSidebarOpen}
                onMobileClose={handleMobileSidebarClose}
            />
            <NavibarMenu
                onSidebarToggle={handleSidebarToggle}
                onMobileSidebarToggle={handleMobileSidebarToggle}
            />
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
                <FooterComp {...footerVm.runtimeInfo} />
                <ToastViewport_Comp />
                <GoTop />
            </div>
        </>
    );
};
// #endregion
