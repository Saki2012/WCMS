import MenuListComp from '../../../../../../SysCore/Components/MenuList/MenuList_Comp'
import type { IBETheme } from '../../../Theme/ITheme'
import { Link } from 'react-router-dom';
import { useGetSideMenuItem } from './SlideMenu_Hook'

const SidebarMenu=({theme}:{theme:IBETheme})=>{
    const items = useGetSideMenuItem();
    return (
    <>
        <nav className="pc-sidebar open-trigger">
            <div className="navbar-wrapper" style={{display: "block"}}>
                <div className="m-header">
                    <h1>
                        <Link to="" title="首頁" target="_self" className="b-brand">
                            <img src="/Legacy/Server/images/logo/logo_PC_210x63.svg" className="img-fluid logo-lg" alt="logo"/>
                        </Link>
                    </h1>    
                </div>
                <div className="navbar-content open-trigger active">
                    <MenuListComp items={items} Style={theme.SidebarMenu}/>
                </div>
            </div>
        </nav>
    </>
    )
}
export default SidebarMenu