import { NavLink } from 'react-router-dom';

import logImg from 'SpecFeature/Assets/Server/menu_logo_PC.svg';
import {
    ServerModuleRoutes,
    type IModuleMeta,
} from '@/Features/Pages/Server/BizFunc/ServerModuleRoutes';
import { useEffect } from 'react';

const buildActionPath = (moduleCode: string, progId: string, actionCode: string) => `/Server/${moduleCode}/${progId}/${actionCode}`;

const SidebarMenu = (prop: { moduleCode: IModuleMeta['ModuleCode'] }) => {
    const module = ServerModuleRoutes.find((p) => p.ModuleCode === prop.moduleCode);
    if (!module) return null;
    useEffect(() => {
        if (!module) return;
        if (typeof window === 'undefined') return;
        // 只在後台 SideMenu 範圍內處理
        const sidebar = document.querySelector('.pc-sidebar .navbar-content');
        if (!sidebar) return;
        const items = Array.from(sidebar.querySelectorAll<HTMLLIElement>('.pc-item.pc-hasmenu'),);
        // 先把舊的顯示狀態清掉（避免殘留）
        items.forEach((li) => {
            li.classList.remove('pc-trigger');
            const sub = li.querySelector<HTMLElement>(':scope > .pc-submenu');
            if (sub) sub.style.display = 'none';
        });
        type HandlerInfo = { link: HTMLAnchorElement; handler: (e: Event) => void };
        const handlers: HandlerInfo[] = [];
        items.forEach((li) => {
            const link = li.querySelector<HTMLAnchorElement>(':scope > .pc-link');
            const submenu = li.querySelector<HTMLElement>(':scope > .pc-submenu');
            if (!link || !submenu) return;
            const handler = (e: Event) => {
                e.preventDefault();
                const isOpen = li.classList.contains('pc-trigger');
                // 關閉其他項目（跟 prototype 一樣同層只開一個）
                items.forEach((otherLi) => {
                    if (otherLi === li) return;
                    otherLi.classList.remove('pc-trigger');
                    const otherSub = otherLi.querySelector<HTMLElement>(':scope > .pc-submenu');
                    if (otherSub) {
                        otherSub.style.display = 'none';
                    }
                });
                if (isOpen) {
                    // 已經開啟 → 收合
                    li.classList.remove('pc-trigger');
                    submenu.style.display = 'none';
                } else {
                    // 從關閉 → 展開
                    li.classList.add('pc-trigger');
                    submenu.style.display = 'block';
                }
            };
            link.addEventListener('click', handler);
            handlers.push({ link, handler });
        });
        // 清除事件監聽，避免重複綁定
        return () => {
            handlers.forEach(({ link, handler }) =>
                link.removeEventListener('click', handler),
            );
        };
    }, [module]);
    return (
        <nav className="pc-sidebar">
            <div className="navbar-wrapper">
                <div className="m-header">
                    <h1>
                        {/* 用後台預設路徑當「首頁」入口，也可以改成固定 /Server */}
                        <NavLink to={'/Server'} title="首頁" target="_self" className="b-brand">
                            <img src={logImg} className="img-fluid logo-lg" alt="logo" />
                        </NavLink>
                    </h1>
                </div>
                <div className="navbar-content">
                    <ul className="pc-navbar">
                        <li className="pc-item pc-caption Left_line">
                            <label>{module.Title}</label>
                            <span className="pc-micon">
                                <i className="fas fa-ellipsis-h" />
                            </span>
                        </li>

                        {module.Progs.map((prog) => (
                            <li key={prog.ProgId} className="pc-item pc-hasmenu">
                                <a className="pc-link" onClick={(e) => { e.preventDefault(); }} role='button'>
                                    <span className="pc-micon">
                                        <i className={prog.IconClassName}></i>
                                    </span>
                                    <span className="pc-mtext">{prog.Title}</span>
                                    <span className="pc-arrow">
                                        <i className="fas fa-chevron-right"></i>
                                    </span>
                                </a>

                                <ul className="pc-submenu">
                                    {prog.Actions.map((act) => (
                                        <li key={act.ActionCode} className="pc-item">
                                            <NavLink className="pc-link" to={buildActionPath(prog.ModuleCode, prog.ProgId, act.ActionCode)}>
                                                {act.Title}
                                            </NavLink>
                                        </li>
                                    ))}
                                </ul>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </nav>
    );
};

export default SidebarMenu;
