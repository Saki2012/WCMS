import { Header } from "@/Features/Pages/Client/Scaffold/Header/Header_Comp"
import Footer from "@/Features/Pages/Client/Scaffold/Footer/Footer_Comp"
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import type { INormSite } from "@/Features/Pages/Client/Site-Routing";
import type { Lang } from "@/SysCore/i18n/lang";
import type { IFETheme } from "@/Features/Pages/Client/Theme/ITheme";

export const Index = ({ lang, site, style }: { lang: Lang; site: INormSite; style: IFETheme }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isSubPage = currentPath !== '/';
  const containerClass = isSubPage ? 'subpage_body_bg' : 'body_bg';

  return (
    <>
      <div id="Customsize" className={containerClass}>
        <Header lang={lang} site={site} style={style} />
        <Outlet />
        <Footer />
      </div>
    </>
  );
}

