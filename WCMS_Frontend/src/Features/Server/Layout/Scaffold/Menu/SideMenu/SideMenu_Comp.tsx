import MenuListComp from '../../../../../../SysCore/Components/MenuList/MenuList_Comp'
import type { IBETheme } from '../../../Theme/ITheme'
import { Link } from 'react-router-dom';
import { useGetSideMenuItem,useSidebarMenuBehavior } from './SlideMenu_Hook'
import { useState } from 'react';

const SidebarMenu=({theme}:{theme:IBETheme})=>{
    const items = useGetSideMenuItem();
    useSidebarMenuBehavior(items);
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
                    <div className="simplebar-wrapper" style={{margin: "-10px 0px -50px;"}}>
                        <div className="simplebar-height-auto-observer-wrapper">
                            <div className="simplebar-height-auto-observer"></div>
                        </div>
                        <div className="simplebar-mask">
                            <div className="simplebar-offset" style={{right: "0px;", bottom: "0px;"}}>
                                <div className="simplebar-content-wrapper" tabIndex={0} role="region" aria-label="scrollable content" style={{height: "auto;", overflow: "hidden;"}}>
                                    <div className="simplebar-content" style={{padding: "10px 0px 50px;"}}>
                                        <MenuListComp items={items} Style={theme.SidebarMenu}/>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    </>
    )
}
export default SidebarMenu