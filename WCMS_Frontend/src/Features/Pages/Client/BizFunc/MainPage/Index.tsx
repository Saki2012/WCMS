import { Header } from "@/Features/Pages/Client/Scaffold/Header/Header_Comp"
import Footer from "@/Features/Pages/Client/Scaffold/Footer/Footer_Comp"
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom';
import type { INormSite } from "@/Features/Pages/Client/Site-Routing";

export const Index = ({ lang, site }: { lang: string; site: INormSite }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isSubPage = currentPath !== '/';
  const containerClass = isSubPage ? 'subpage_body_bg' : 'body_bg';

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

