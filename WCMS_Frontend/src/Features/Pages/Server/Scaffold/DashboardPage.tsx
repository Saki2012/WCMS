import { Outlet } from 'react-router-dom'
import SidebarMenu from "@/Features/Pages/Server/Scaffold/Menu/SideMenu/SideMenu_Comp"
import NavibarMenu from "@/Features/Pages/Server/Scaffold/Menu/NaviBar/NaviBar_Comp"
import BreadCrumb from "@/Features/Pages/Server/Scaffold/Menu/BreadCrumb/BreadCrumb_Comp"
import FooterComp from "./Footer/Footer_Comp"
import type { IBETheme } from '../Theme/ITheme'

export const DashboardPage = ({ theme }: { theme: IBETheme }) => {
  return (
    <>
      <SidebarMenu theme={theme} />
      <NavibarMenu theme={theme} />
      <div className="pc-container">
        <div className="pc-content">
          <div className="page-header">
            <div className="page-block">
              <div className="row align-items-center">
                <div className="col-md-12">
                  <div className="page-header-title">
                    <h3 className="tit mb-0">關鍵字設定</h3>{/**title 在動態塞入 */}
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
        <FooterComp></FooterComp>
      </div>
    </>
  );
}
export default DashboardPage