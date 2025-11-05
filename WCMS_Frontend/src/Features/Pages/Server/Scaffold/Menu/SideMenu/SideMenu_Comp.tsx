import MenuListComp from '@/SysCore/Components/MenuList/MenuList_Comp'
import type { IBETheme } from '@/Features/Pages/Server/Theme/ITheme'
import { Link } from 'react-router-dom';
import { useGetSideMenuItem, useSideMenuToggle } from './SlideMenu_Hook'
import { useState } from 'react';

import logImg from '@/Features/Assets/Server/images/logo/logo_PC_210x63.svg'

const SidebarMenu = ({ theme }: { theme: IBETheme }) => {
    const items = useGetSideMenuItem();
    const { isOpen, toggleSideMenu } = useSideMenuToggle();

    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());
    const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

    const toggleItem = (index: number) => { setExpandedIndex(prev => (prev === index ? null : index)); };
    const toggleKey = (key: string) => {
        setExpandedKeys(prev => { const newSet = new Set(prev); if (newSet.has(key)) newSet.delete(key); else newSet.add(key); return newSet; });
    };
    return (
        <>
            <nav className="pc-sidebar">
                <div className="navbar-wrapper" style={{ display: "block" }}>
                    <div className="m-header">
                        <h1>
                            <Link to="" title="首頁" target="_self" className="b-brand">
                                <img src={logImg} className="img-fluid logo-lg" alt="logo" />
                            </Link>
                        </h1>
                        <button type='button' onClick={toggleSideMenu} style={{ marginTop: "10px" }} />
                    </div>
                    <div className="navbar-content open-trigger" data-simplebar="init">
                        <div className="simplebar-wrapper" style={{ margin: "-10px 0px -50px" }}>
                            <div className="simplebar-height-auto-observer-wrapper">
                                <div className="simplebar-height-auto-observer"></div>
                            </div>
                            <div className="simplebar-mask">
                                <div className="simplebar-offset" style={{ right: "0px", bottom: "0px" }}>
                                    <div className="simplebar-content-wrapper" tabIndex={0} role="region" aria-label="scrollable content" style={{ height: "auto", overflow: "hidden" }}>
                                        <div className="simplebar-content" style={{ padding: "10px 0px 50px" }}>
                                            <MenuListComp items={items} Style={theme.SidebarMenu} expandedKeys={expandedKeys} onToggleKey={toggleKey} />
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