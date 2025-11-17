
import { Header } from "SpecFeature/Pages/Client/Scaffold/MainFrame/Header"
import { Footer } from "SpecFeature/Pages/Client/Scaffold/MainFrame/Footer"
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import type { INormSite } from "@/Features/Pages/Client/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";

export const Index = (props: { lang: Lang; site: INormSite; style: IFETheme }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isSubPage = currentPath !== '/';
  const containerClass = isSubPage ? 'subpage_body_bg' : 'body_bg';

  return (
    <>
      <div id="Customsize" className={containerClass}>
        <Header lang={props.lang} site={props.site} style={props.style} />
        <Outlet />
        <Footer />
      </div>
    </>
  );
}

