import Header from "../Layout/Scaffold/Header/Header_Comp"
import Footer from "../Layout/Scaffold/Footer/Footer_Comp"
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
            {/* 塞Content 可能就由Spec那邊添加了? */}
            中間會注入功能頁內容
            <Outlet /> 
            <Footer/>
          </div>
        </>
  );
}

export default Index