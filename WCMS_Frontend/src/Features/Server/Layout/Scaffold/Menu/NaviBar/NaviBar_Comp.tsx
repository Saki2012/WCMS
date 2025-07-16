import { useEffect, useState } from 'react'
import type {NaviData} from '../../../../../../SysCore/Components/NaviBar/NaviBar_Data'
import NaviBarComp from '../../../../../../SysCore/Components/NaviBar/NaviBar_Comp'
import {Classic_BETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import NaviProvider from '../../../../../../Features/Server/Layout/Scaffold/Menu/NaviBar/NaviBar_Api'

const NavibarMenu=()=>{
    const [items, setItems] = useState<NaviData[]>([])
    useEffect(() => {
        NaviProvider().getNaviBarList().then(setItems)
    }, [])

    return (
        <header className="pc-header">
            <div className="header-wrapper">
                <div className="mobile-logo me-auto">
                    <ul className="list-unstyled">
                        <li className="pc-h-item pc-sidebar-collapse">
                            <a href="#" onClick={(e) => { e.preventDefault(); }} className="pc-head-link ms-0" id="sidebar-hide">
                                <i className="fas fa-bars"></i>
                            </a>
                        </li>
                        <li className="pc-h-item pc-sidebar-popup">
                            <a href="#" onClick={(e) => { e.preventDefault(); }} className="pc-head-link ms-0" id="mobile-collapse">
                                <i className="fas fa-bars"></i>
                            </a>
                            <a className="mblogo" href="javascript:void(0);">
                                <img src="/Legacy/Server/images/logo/logo_PC_210x63.svg" className="pcm-logo img-fluid logo-lg" alt="logo"/>
                            </a>    
                        </li>
                    </ul>                
                </div>            
                
                <div className="ml-auto">                
                    <nav className="navbar navbar-expand-lg navbar-light">                    
                        <a className="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbar_right" aria-controls="navbar_right" aria-expanded="false" aria-label="Toggle navigation">
                            <i className="fas fa-grip-horizontal"></i>
                        </a>
                        <div className="Customize_collapse + collapse navbar-collapse" id="navbar_right">
                        <NaviBarComp items={items} style={Classic_BETheme.NavBarMenu}></NaviBarComp>
                        </div>                      
                    </nav>
                </div>
            </div>
        </header>
    )
}

export default NavibarMenu