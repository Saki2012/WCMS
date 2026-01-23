import logImg from 'SpecFeature/Assets/Server/menu_logo_PC.svg';
import { ServerModuleRoutes, type IModuleMeta } from '@/Features/Pages/Server/Scaffold/Routes/ServerModuleRoutesData';
import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { LangNavLink } from '@/SysCore/i18n/LangLink';

const buildActionPath = (moduleCode: string, progId: string, actionCode: string) =>
    `/Server/${moduleCode}/${progId}/${actionCode}`;

/** 讓 path 比較更穩：去掉尾端 / */
const normalizePath = (path: string): string => {
    // NOTE: 避免 /xxx/ 與 /xxx 被當作不同頁
    if (!path) return '';
    return path.length > 1 ? path.replace(/\/+$/, '') : path;
};

/** 對 submenu 做「可動畫」的展開/收合（不用額外 CSS 檔） */
const setSubmenuOpen = (li: HTMLLIElement, isOpen: boolean): void => {
    // NOTE: prototype 的主要狀態 class
    if (isOpen) li.classList.add("pc-trigger");
    else li.classList.remove("pc-trigger");

    const toggle = li.querySelector<HTMLAnchorElement>(":scope > .pc-link");
    if (toggle) toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");

    const submenu = li.querySelector<HTMLElement>(":scope > .pc-submenu");
    if (!submenu) return;

    const arrowIcon = li.querySelector<HTMLElement>(":scope > .pc-link .pc-arrow i");
    if (arrowIcon) {
        arrowIcon.style.transition = "transform 220ms ease";
        arrowIcon.style.transform = isOpen ? "rotate(90deg)" : "rotate(0deg)";
    }

    // NOTE: 不依賴外部 CSS，直接把可動畫的屬性補齊
    submenu.style.overflow = "hidden";
    submenu.style.transition = "max-height 220ms ease";
    submenu.style.willChange = "max-height";

    // NOTE: 先移除舊的 transitionend，避免重複掛載
    const oldHandler = (submenu as any).__wcmsTransitionEndHandler as
        | ((ev: TransitionEvent) => void)
        | undefined;

    if (oldHandler) {
        submenu.removeEventListener("transitionend", oldHandler);
        (submenu as any).__wcmsTransitionEndHandler = undefined;
    }

    if (isOpen) {
        // NOTE: display:none → 要先改成 block 才能量到 scrollHeight
        submenu.style.display = "block";

        // NOTE: 先設 0，再下一個 frame 設為實際高度，才能觸發動畫
        submenu.style.maxHeight = "0px";
        requestAnimationFrame(() => {
            const h = submenu.scrollHeight;
            submenu.style.maxHeight = `${h}px`;
        });

        return;
    }

    // NOTE: 收合：先做動畫到 0，再在 transitionend 時 display:none
    submenu.style.maxHeight = "0px";

    const onEnd = (ev: TransitionEvent) => {
        if (ev.propertyName !== "max-height") return;
        submenu.style.display = "none";
    };

    submenu.addEventListener("transitionend", onEnd);
    (submenu as any).__wcmsTransitionEndHandler = onEnd;
};

/** 關閉同層其他 menu（prototype 常見：同層只開一個） */
const closeSiblings = (all: HTMLLIElement[], current: HTMLLIElement): void => {
    // NOTE: 避免同層同時展開太多，和 prototype 對齊
    all.forEach((li) => {
        if (li === current) return;
        setSubmenuOpen(li, false);
    });
};

const SidebarMenu = (prop: { moduleCode: IModuleMeta['ModuleCode'] }) => {
    const module = useMemo(
        () => ServerModuleRoutes.find((p) => p.ModuleCode === prop.moduleCode),
        [prop.moduleCode],
    );

    const navRef = useRef<HTMLElement | null>(null);
    const location = useLocation();

    useEffect(() => {
        if (!module) return;
        if (typeof window === 'undefined') return;

        // NOTE: 只在這個 SideMenu 範圍內操作 DOM，避免影響其他區塊
        const root = navRef.current;
        if (!root) return;

        const hasMenus = Array.from(
            root.querySelectorAll<HTMLLIElement>('.pc-item.pc-hasmenu'),
        );

        // NOTE: 初始化 submenu 都收起來（用 max-height）
        hasMenus.forEach((li) => setSubmenuOpen(li, false));

        // NOTE: 綁定 click：展開/收合（含關閉同層其他）
        type HandlerInfo = { el: HTMLAnchorElement; fn: (e: Event) => void };
        const handlers: HandlerInfo[] = [];

        hasMenus.forEach((li) => {
            const toggle = li.querySelector<HTMLAnchorElement>(':scope > .pc-link');
            if (!toggle) return;

            const fn = (e: Event) => {
                // NOTE: top menu 只是 toggle，不導頁
                e.preventDefault();

                const isOpen = li.classList.contains('pc-trigger');
                if (isOpen) {
                    setSubmenuOpen(li, false);
                    return;
                }

                closeSiblings(hasMenus, li);
                setSubmenuOpen(li, true);
            };

            toggle.addEventListener('click', fn);
            handlers.push({ el: toggle, fn });
        });

        return () => {
            // NOTE: 清掉事件避免重複綁定
            handlers.forEach(({ el, fn }) => el.removeEventListener('click', fn));
        };
    }, [module]);

    useEffect(() => {
        if (!module) return;
        if (typeof window === 'undefined') return;

        const root = navRef.current;
        if (!root) return;

        const currentPath = normalizePath(location.pathname);

        // NOTE: 先清除舊的 active 狀態（包含 aria-current）
        const activeLinks = Array.from(root.querySelectorAll<HTMLElement>('.pc-link.active'));
        activeLinks.forEach((el) => el.classList.remove('active'));

        const activeItems = Array.from(root.querySelectorAll<HTMLLIElement>('.pc-item.active'));
        activeItems.forEach((el) => el.classList.remove('active'));

        const currentLinks = Array.from(root.querySelectorAll<HTMLAnchorElement>(".pc-link[aria-current='page']"));
        currentLinks.forEach((el) => el.removeAttribute('aria-current'));

        // NOTE: 找到目前對應的 submenu link（真正導頁的是 LangNavLink 渲染出來的 <a>）
        const submenuLinks = Array.from(
            root.querySelectorAll<HTMLAnchorElement>('.pc-submenu .pc-link'),
        );

        const hit = submenuLinks.find((a) => {
            const hrefPath = normalizePath(new URL(a.href, window.location.origin).pathname);
            return hrefPath === currentPath;
        });

        if (!hit) return;

        // NOTE: 打亮目前 link（子層）
        hit.classList.add('active');
        hit.setAttribute('aria-current', 'page');

        // NOTE: 打亮目前 li（子層 li）
        const hitLi = hit.closest<HTMLLIElement>('.pc-item');
        if (hitLi) hitLi.classList.add('active');

        // NOTE: 父層也要 active（綠色條通常吃父層 pc-link 或 pc-item）
        const parentHasMenu = hit.closest<HTMLLIElement>('.pc-item.pc-hasmenu');
        if (!parentHasMenu) return;

        parentHasMenu.classList.add('active');

        const parentToggle = parentHasMenu.querySelector<HTMLAnchorElement>(':scope > .pc-link');
        if (parentToggle) parentToggle.classList.add('active');

        // NOTE: 自動展開父層，並收合同層其他
        const hasMenus = Array.from(
            root.querySelectorAll<HTMLLIElement>('.pc-item.pc-hasmenu'),
        );
        closeSiblings(hasMenus, parentHasMenu);
        setSubmenuOpen(parentHasMenu, true);
    }, [location.pathname, module]);

    if (!module) return null;

    return (
        <nav className="pc-sidebar" ref={navRef}>
            <div className="navbar-wrapper">
                <div className="m-header">
                    <h1>
                        <LangNavLink to={'/'} title="首頁" target="_self" className="b-brand">
                            <img src={logImg} className="img-fluid logo-lg" alt="logo" />
                        </LangNavLink>
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
                                {/* NOTE: 這個是 toggle 用，不導頁；導頁一律在 submenu 用 LangNavLink */}
                                <a className="pc-link" href="#" role="button" aria-expanded="false">
                                    <span className="pc-micon">
                                        <i className={prog.IconClassName} />
                                    </span>
                                    <span className="pc-mtext">{prog.Title}</span>
                                    <span className="pc-arrow">
                                        <i className="fas fa-chevron-right" />
                                    </span>
                                </a>

                                <ul className="pc-submenu">
                                    {prog.Actions.map((act) => (
                                        <li key={act.ActionCode} className="pc-item">
                                            <LangNavLink
                                                className="pc-link"
                                                to={buildActionPath(prop.moduleCode, prog.ProgId, act.ActionCode)}
                                            >
                                                {act.Title}
                                            </LangNavLink>
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
