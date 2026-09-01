import { ServerModuleRoutes } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { AuthAPI } from "@/SysCore/Utils/API/AuthClient";
import { resolveSpecAsset } from "@/SysCore/Utils/Library/SlotResolver";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_Hooks/useOptionalSpecAssetUrl";
import clsx from "clsx";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { AuthSessionDiagnosticsComp } from "./AuthSessionDiagnostics_Comp";

// #region Initialization
const logoImg = resolveSpecAsset("Assets/Server/menu_logo_PC", "");
// #endregion

// #region Property
interface NavibarMenuProps
{
    /** 切換桌機 Sidebar 收合狀態。 */
    onSidebarToggle: () => void;

    /** 切換行動版 Sidebar 顯示狀態。 */
    onMobileSidebarToggle: () => void;
}
// #endregion

// #region Private
export const NavibarMenu = (props: NavibarMenuProps) =>
{
    const operateFileUrl = useOptionalSpecAssetUrl({ relativePath: "Assets/Server/後台操作手冊.pdf", fallbackToDefault: true }) ?? "";
    const location = useLocation();
    const [userName, setUserName] = useState<string>("");
    const [userInternalId, setuserInternalId] = useState<string>("");

    /** 控制行動版 Header 導覽選單是否展開，沿用 Bootstrap collapse 的 show 樣式契約。 */
    const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);

    useEffect(() =>
    {
        /** 載入目前登入使用者顯示名稱與內部識別碼。 */
        const loadUserName = async () =>
        {
            const res = await AuthAPI.me();
            const name = (res?.data)?.User.UserName ?? "";
            const internalId = (res?.data)?.User.InternalId ?? "";
            setUserName(name);
            setuserInternalId(internalId);
        };
        void loadUserName();
    }, []);

    useEffect(() =>
    {
        /** 後台路由完成切換後收合手機 Header 導覽，避免新頁面仍保留展開選單。 */
        setIsMobileNavOpen(false);
    }, [location.pathname]);

    /** 切換行動版 Header 導覽選單展開狀態。 */
    const handleMobileNavToggle = () =>
    {
        setIsMobileNavOpen(value => !value);
    };

    return (
        <header className="pc-header">
            <div className="header-wrapper">
                <div className="mobile-logo me-auto">
                    <ul className="list-unstyled">
                        <li className="pc-h-item pc-sidebar-collapse">
                            {/* 桌機 Sidebar 收合由 React callback 接管，不再依賴 Legacy click listener。 */}
                            <a
                                href="#"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                    props.onSidebarToggle();
                                }}
                                className="pc-head-link ms-0"
                                id="sidebar-hide-react"
                            >
                                <i className="fas fa-bars"></i>
                            </a>
                        </li>
                        <li className="pc-h-item pc-sidebar-popup">
                            {/* 行動版 Sidebar 顯示狀態由 React callback 接管。 */}
                            <a
                                href="#"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                    props.onMobileSidebarToggle();
                                }}
                                className="pc-head-link ms-0"
                                id="mobile-collapse-react"
                            >
                                <i className="fas fa-bars"></i>
                            </a>
                            <a
                                className="mblogo"
                                href="#"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                }}
                            >
                                <img src={logoImg} className="pcm-logo img-fluid logo-lg" alt="logo" />
                            </a>
                        </li>
                    </ul>
                </div>

                <div className="ml-auto">
                    <nav className="navbar navbar-expand-lg navbar-light">
                        {/* 行動版 Header 選單由 React 控制 show 狀態，導頁後可同步收合。 */}
                        <a
                            className="navbar-toggler"
                            href="#"
                            role="button"
                            aria-controls="navbar_right"
                            aria-expanded={isMobileNavOpen}
                            aria-label="Toggle navigation"
                            onClick={(e) =>
                            {
                                e.preventDefault();
                                handleMobileNavToggle();
                            }}
                        >
                            <i className="fas fa-grip-horizontal"></i>
                        </a>
                        <div
                            className={clsx(
                                "Customize_collapse",
                                "collapse",
                                "navbar-collapse",
                                isMobileNavOpen && "show",
                            )}
                            id="navbar_right"
                        >
                            <ul className={clsx("navbar-nav", "me-auto", "mb-2", "mb-lg-0")}>
                                <li className={clsx("nav-item", "d-flex", "align-items-center")}>
                                    <AuthSessionDiagnosticsComp />
                                </li>
                                <li className={clsx("nav-item")}>
                                    <div className="nav-link">
                                        <h2>
                                            <i className="far fa-user-check" />
                                            目前使用者 :{" "}
                                            <span className="ml-1">
                                                <LangNavLink to={`/Server/AccountManage/Account/Form/${userInternalId}`}>{userName}</LangNavLink>
                                            </span>
                                        </h2>
                                    </div>
                                </li>
                                {operateFileUrl && (
                                    <li className={clsx("nav-item")}>
                                        <a className="nav-link" href={operateFileUrl} target="_blank">
                                            <h2>
                                                <i className="fa fa-book" aria-hidden="true" />
                                                操作手冊
                                            </h2>
                                        </a>
                                    </li>
                                )}
                                {ServerModuleRoutes.map((item) => (
                                    <li className={clsx("nav-item")} key={item.ModuleCode}>
                                        <LangNavLink className="nav-link" to={item.DefaultPath}>
                                            <h2>
                                                <i className={item.IconClassName} aria-hidden="true" />
                                                {item.Title}
                                            </h2>
                                        </LangNavLink>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </nav>
                </div>
            </div>
        </header>
    );
};
// #endregion
