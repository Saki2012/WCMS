import Header from "../../Scaffold/Header/Header_Comp"
import Footer from "../../Scaffold/Footer/Footer_Comp"
import { Outlet } from 'react-router-dom'
import { useLocation } from 'react-router-dom';

const Index = () => {
  const location = useLocation();
  const currentPath = location.pathname;
  const isSubPage = currentPath !== '/';
  const containerClass = isSubPage ? 'subpage_body_bg' : 'body_bg';

    return (
        <>
          <div id="Customsize" className={containerClass}>
            <Header/>
            <Outlet /> 
            <Footer/>
          </div>
        </>
  );
}

export default Index