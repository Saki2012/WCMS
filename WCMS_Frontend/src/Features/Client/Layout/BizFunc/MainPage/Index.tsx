import { Header } from "../../Scaffold/Header/Header_Comp"
import Footer from "../../Scaffold/Footer/Footer_Comp"
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import type { INormSite } from "../../../Site-Routing";

export const Index = ({ lang, site }: { lang: string; site: INormSite }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isSubPage = currentPath !== '/';
  const containerClass = isSubPage ? '' : 'body_bg';

  return (
    <>
      <div id="Customsize" className={containerClass}>
        <Header lang={lang} site={site} />
        <Outlet />
        <Footer />
      </div>
    </>
  );
}

