import { ServerModuleRoutes } from "@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData";
import { LangNavLink } from "@/SysCore/i18n/LangLink";
import { AuthAPI } from "@/SysCore/Utils/API/AuthClient";
import { resolveSpecAsset } from "@/SysCore/Utils/Library/SlotResolver";
import { useOptionalSpecAssetUrl } from "@/SysCore/Utils/UI_Hooks/useOptionalSpecAssetUrl";
import clsx from "clsx";
import { useEffect, useState } from "react";

// #region Initialization
const logoImg = resolveSpecAsset("Assets/Server/menu_logo_PC", "");
// #endregion

// #region Private
export const NavibarMenu = () =>
{
    const operateFileUrl = useOptionalSpecAssetUrl({ relativePath: "Assets/Server/後台操作手冊.pdf", fallbackToDefault: true }) ?? "";
    const [userName, setUserName] = useState<string>("");
    const [userInternalId, setuserInternalId] = useState<string>("");
    useEffect(() =>
    {
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
    return (
        <header className="pc-header">
            <div className="header-wrapper">
                <div className="mobile-logo me-auto">
                    <ul className="list-unstyled">
                        <li className="pc-h-item pc-sidebar-collapse">
                            <a
                                href="#"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                }}
                                className="pc-head-link ms-0"
                                id="sidebar-hide"
                            >
                                <i className="fas fa-bars"></i>
                            </a>
                        </li>
                        <li className="pc-h-item pc-sidebar-popup">
                            <a
                                href="#"
                                onClick={(e) =>
                                {
                                    e.preventDefault();
                                }}
                                className="pc-head-link ms-0"
                                id="mobile-collapse"
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
                        <a
                            className="navbar-toggler"
                            type="button"
                            data-bs-toggle="collapse"
                            data-bs-target="#navbar_right"
                            aria-controls="navbar_right"
                            aria-expanded="false"
                            aria-label="Toggle navigation"
                        >
                            <i className="fas fa-grip-horizontal"></i>
                        </a>
                        <div className="Customize_collapse + collapse navbar-collapse" id="navbar_right">
                            <ul className={clsx("navbar-nav", "me-auto", "mb-2", "mb-lg-0")}>
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
