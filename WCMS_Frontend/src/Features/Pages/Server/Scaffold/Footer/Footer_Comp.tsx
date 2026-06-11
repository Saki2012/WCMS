import { LangLink } from "@/SysCore/i18n/LangLink";
import { SysCurrentDate } from "../../../../../SysCore/Utils/SystemInfo/GetServerInfo";

// #region Section
export const FooterComp = () =>
{
    const date = SysCurrentDate();
    return (
        <footer className="pc-footer">
            <div className="footer-wrapper container-fluid">
                <div className="row">
                    <div className="col my-3">
                        <p className="m-0">Copyright © {date?.getFullYear()}. 國際暢行科技有限公司 All rights reserved.</p>
                    </div>
                    <div className="col-auto my-3">
                        <ul className="list-inline footer-link mb-0">
                            <li className="list-inline-item">
                                <LangLink to="https://www.it-easygo.com/">Design by it-easygo.</LangLink>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
};
// #endregion
