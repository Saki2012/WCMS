import { useEffect, useState } from 'react'
import type {MenuItemData} from '../../../../../../SysCore/Components/MenuList/MenuList_Data'
import MenuListComp from '../../../../../../SysCore/Components/MenuList/MenuList_Comp'
import {Classic_BETheme} from "../../../../../../Features/Server/Layout/Theme/ITheme"
import SideMenuProvider from '../../../../../../Features/Server/Layout/Scaffold/Menu/SideMenu/SideMenu_Api'
import { Link } from 'react-router-dom';

const SidebarMenu=()=>{
    const [items, setItems] = useState<MenuItemData[]>([])

    useEffect(() => {
        SideMenuProvider().fetchList().then(setItems)
    }, [])

    return (
    <>
        <nav className="pc-sidebar open-trigger">
            <div className="navbar-wrapper" style={{display: "block"}}>
                <div className="m-header">
                    <h1>
                        <Link to="00_index.html" title="首頁" target="_self" className="b-brand">
                            <img src="/Legacy/Server/images/logo/logo_PC_210x63.svg" className="img-fluid logo-lg" alt="logo"/>
                        </Link>
                    </h1>    
                </div>
                <div className="navbar-content open-trigger active">
                <MenuListComp items={items} theme={Classic_BETheme.SidebarMenu}></MenuListComp>
                </div>
            </div>
        </nav>
    </>
    )
}
export default SidebarMenu