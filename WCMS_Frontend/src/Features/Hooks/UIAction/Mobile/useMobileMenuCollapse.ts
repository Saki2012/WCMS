import { type RefObject, useCallback, useEffect, useRef } from "react";

/** Bootstrap Collapse instance 型別（避免 any） */
interface BootstrapCollapseInstance
{
    show: () => void;
    hide: () => void;
}
interface BootstrapCollapseCtor
{
    getOrCreateInstance: (el: Element, options: { toggle: boolean; }) => BootstrapCollapseInstance;
}
interface BootstrapGlobal
{
    Collapse?: BootstrapCollapseCtor;
}

export interface UseMobileMenuCollapseOptions
{
    headerRef: RefObject<HTMLElement>;
    collapseSelector?: string;
    togglerSelector?: string;
    overlaySelector?: string;
    hamburgerSelector?: string;
    headerActiveClass?: string;
    lockBodyScroll?: boolean;
    disableBootstrapAutoToggle?: boolean;

    /** 是否啟用 dropdown/submenu 的點擊展開（預設 true） */
    enableDropdownToggle?: boolean;
    /** 是否攔截 hover/focus 的 bubble（避免滑過就互斥收合）（預設 true） */
    stopHoverAutoClose?: boolean;

    /** 判斷 mobile 寬度用的 media query（預設 navbar-expand-xl） */
    mobileMediaQuery?: string;
}

export interface UseMobileMenuCollapseResult
{
    /** 目前是否展開（ref，不觸發 rerender） */
    isOpenRef: RefObject<boolean>;
    /** 手動開啟 */
    openMenu: () => void;
    /** 手動關閉 */
    closeMenu: () => void;
    /** 手動切換 */
    toggleMenu: () => void;
}

export const useMobileMenuCollapse = (opts: UseMobileMenuCollapseOptions): UseMobileMenuCollapseResult =>
{
    // 宣告變數：狀態與 API
    const isOpenRef = useRef<boolean>(false);
    const apiRef = useRef<{ open: () => void; close: () => void; toggle: () => void; } | null>(null);

    // function：對外 API（穩定引用）
    const openMenu = useCallback(() =>
    {
        apiRef.current?.open();
    }, []);

    const closeMenu = useCallback(() =>
    {
        apiRef.current?.close();
    }, []);

    const toggleMenu = useCallback(() =>
    {
        apiRef.current?.toggle();
    }, []);

    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        // 宣告變數：預設 selector / options
        const collapseSelector = opts.collapseSelector ?? "#navbar-content";
        const togglerSelector = opts.togglerSelector ?? ".navbar-toggler";
        const overlaySelector = opts.overlaySelector ?? ".overlayer";
        const hamburgerSelector = opts.hamburgerSelector ?? ".hamburger";
        const headerActiveClass = opts.headerActiveClass ?? "active";
        const lockBodyScroll = opts.lockBodyScroll ?? true;
        const disableBootstrapAutoToggle = opts.disableBootstrapAutoToggle ?? true;

        const enableDropdownToggle = opts.enableDropdownToggle ?? true;
        const stopHoverAutoClose = opts.stopHoverAutoClose ?? true;

        const mobileMediaQuery = opts.mobileMediaQuery ?? "(max-width: 1199.98px)"; // navbar-expand-xl

        // 宣告變數：DOM
        const header = opts.headerRef.current;
        if (!header) return;

        const collapseEl = header.querySelector<HTMLElement>(collapseSelector);
        const togglerEl = header.querySelector<HTMLElement>(togglerSelector);
        const overlayEl = header.querySelector<HTMLElement>(overlaySelector);
        const hamburgerEl = header.querySelector<HTMLElement>(hamburgerSelector);

        if (!collapseEl || !togglerEl) return;

        // function：是否 mobile
        const isMobileWidth = () => window.matchMedia(mobileMediaQuery).matches;

        // function：body scroll lock
        const setBodyScrollLock = (locked: boolean) =>
        {
            if (!lockBodyScroll) return;
            document.body.style.overflow = locked ? "hidden" : "auto";
        };

        // function：同步 header active
        const setHeaderActive = (open: boolean) =>
        {
            header.classList.toggle(headerActiveClass, open);
            setBodyScrollLock(open);
        };

        // function：同步 hamburger/toggler aria
        const setHamburgerActive = (open: boolean) =>
        {
            hamburgerEl?.classList.toggle("active", open);
            togglerEl.classList.toggle("collapsed", !open);
            togglerEl.setAttribute("aria-expanded", open ? "true" : "false");
        };

        // function：套用 open 狀態
        const applyOpenState = (open: boolean) =>
        {
            isOpenRef.current = open;
            setHeaderActive(open);
            setHamburgerActive(open);
        };

        // function：拿 Bootstrap Collapse（有就用，保留動畫）
        const getBootstrapCollapse = (): BootstrapCollapseInstance | null =>
        {
            const w = window as Window & { bootstrap?: BootstrapGlobal; };
            const ctor = w.bootstrap?.Collapse;
            if (!ctor) return null;
            return ctor.getOrCreateInstance(collapseEl, { toggle: false });
        };

        // function：避免 Bootstrap 自己接管 toggler click（避免打架）
        const disableBsToggleAttrs = () =>
        {
            if (!disableBootstrapAutoToggle) return;
            togglerEl.removeAttribute("data-bs-toggle");
            togglerEl.removeAttribute("data-bs-target");
            togglerEl.removeAttribute("data-bs-parent");
        };

        // function：重置 collapse（避免殘留 show/collapsing）
        const resetCollapseInstant = () =>
        {
            collapseEl.classList.remove("show");
            collapseEl.classList.remove("collapsing");
            collapseEl.classList.add("collapse");
            collapseEl.style.height = "";
            applyOpenState(false);
        };

        // function：fallback 關閉（不靠 bootstrap）
        const forceCloseCollapse = () =>
        {
            collapseEl.classList.remove("show");
            collapseEl.classList.remove("collapsing");
            collapseEl.classList.add("collapse");
            collapseEl.style.height = "";
        };

        // ---------- Dropdown helpers（點擊展開用） ----------
        const isDropdownHost = (el: Element | null): el is HTMLElement =>
        {
            if (!el) return false;
            if (!(el instanceof HTMLElement)) return false;
            return el.matches("li.nav-item.dropdown") || el.matches("li.dropend.submenu");
        };

        const getHostMenu = (host: HTMLElement): HTMLElement | null =>
        {
            // 註解：用 :scope 取得直接子層，避免抓錯層
            return host.querySelector<HTMLElement>(":scope > .dropdown-menu");
        };

        const getHostToggle = (host: HTMLElement): HTMLElement | null =>
        {
            // 註解：用 :scope 取得直接子層，避免抓到子孫 toggle
            return host.querySelector<HTMLElement>(":scope > .dropdown-toggle");
        };

        const setToggleExpanded = (toggle: HTMLElement | null, expanded: boolean) =>
        {
            if (!toggle) return;
            toggle.setAttribute("aria-expanded", expanded ? "true" : "false");

            // 註解：有些 prototype CSS 會看 toggle 自身的 show 狀態（+ / -）
            toggle.classList.toggle("show", expanded);
        };

        const closeSubtree = (host: HTMLElement) =>
        {
            // 註解：關閉自己 + 內層所有展開狀態
            host.classList.remove("show");
            getHostMenu(host)?.classList.remove("show");
            setToggleExpanded(getHostToggle(host), false);

            host.querySelectorAll<HTMLElement>("li.nav-item.dropdown.show, li.dropend.submenu.show").forEach((h) =>
            {
                h.classList.remove("show");
                getHostMenu(h)?.classList.remove("show");
                setToggleExpanded(getHostToggle(h), false);
            });

            host.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
            host.querySelectorAll<HTMLElement>(".dropdown-toggle.show").forEach(t => t.classList.remove("show"));
            host.querySelectorAll<HTMLElement>(".dropdown-toggle[aria-expanded=\"true\"]").forEach(t =>
                t.setAttribute("aria-expanded", "false")
            );
        };

        const isHostOpen = (host: HTMLElement): boolean =>
        {
            if (host.classList.contains("show")) return true;
            if (getHostMenu(host)?.classList.contains("show")) return true;
            if (getHostToggle(host)?.getAttribute("aria-expanded") === "true") return true;
            return false;
        };

        const openHost = (host: HTMLElement) =>
        {
            host.classList.add("show");
            getHostMenu(host)?.classList.add("show");
            setToggleExpanded(getHostToggle(host), true);
        };

        const closeAllDropdownStates = () =>
        {
            // 註解：收掉整個 navbar 內所有 dropdown/submenu
            collapseEl.querySelectorAll<HTMLElement>("li.nav-item.dropdown.show, li.dropend.submenu.show").forEach(h =>
                closeSubtree(h)
            );
            collapseEl.querySelectorAll<HTMLElement>(".dropdown-menu.show").forEach(m => m.classList.remove("show"));
            collapseEl.querySelectorAll<HTMLElement>(".dropdown-toggle.show").forEach(t => t.classList.remove("show"));
            collapseEl.querySelectorAll<HTMLElement>(".dropdown-toggle[aria-expanded=\"true\"]").forEach(t =>
                t.setAttribute("aria-expanded", "false")
            );
        };

        const closeSiblings = (host: HTMLElement) =>
        {
            const parent = host.parentElement;
            if (!parent) return;

            Array.from(parent.children).forEach((sib) =>
            {
                if (sib === host) return;
                if (!isDropdownHost(sib)) return;
                if (!isHostOpen(sib)) return;
                closeSubtree(sib);
            });
        };

        const closeOtherTopLevel = (host: HTMLElement) =>
        {
            // 註解：只針對第一層互斥
            if (!host.matches(".navbar-nav > .nav-item.dropdown")) return;

            collapseEl.querySelectorAll<HTMLElement>(".navbar-nav > .nav-item.dropdown").forEach((h) =>
            {
                if (h === host) return;
                if (!isHostOpen(h)) return;
                closeSubtree(h);
            });
        };

        const toggleHostByClick = (host: HTMLElement) =>
        {
            // 註解：已開就關
            if (isHostOpen(host))
            {
                closeSubtree(host);
                return;
            }

            // 註解：點擊互斥（同層 + 第一層）
            closeSiblings(host);
            closeOtherTopLevel(host);

            // 註解：最後再開啟自己
            openHost(host);
        };

        // ---------- Menu open/close ----------
        const open = () =>
        {
            applyOpenState(true);

            const inst = getBootstrapCollapse();
            if (inst)
            {
                inst.show();
                return;
            }

            // fallback：無動畫但可用
            collapseEl.classList.add("show");
        };

        const close = () =>
        {
            // 註解：關主選單時，也要把 dropdown 狀態清掉
            closeAllDropdownStates();
            applyOpenState(false);

            const inst = getBootstrapCollapse();
            if (inst)
            {
                inst.hide();
                return;
            }

            // fallback：無動畫但可用
            forceCloseCollapse();
        };

        const toggle = () =>
        {
            if (isOpenRef.current)
            {
                close();
                return;
            }
            open();
        };

        // ---------- events ----------
        const onTogglerClick = (ev: MouseEvent) =>
        {
            ev.preventDefault();
            ev.stopPropagation();
            toggle();
        };

        const onOverlayClick = (ev: MouseEvent) =>
        {
            ev.preventDefault();
            close();
        };

        const onShown = () => applyOpenState(true);
        const onHidden = () => applyOpenState(false);

        const onCollapseClick = (ev: MouseEvent) =>
        {
            if (!enableDropdownToggle) return;

            const el = ev.target as Element | null;
            if (!el) return;

            // 註解：點到 dropdown-toggle（含 submenu）→ 改成點擊展開/收合，不導頁
            const toggleEl = el.closest(".dropdown-toggle") as HTMLElement | null;
            if (toggleEl && collapseEl.contains(toggleEl))
            {
                ev.preventDefault();
                ev.stopPropagation();

                const host = (toggleEl.closest("li.dropend.submenu") as HTMLElement | null)
                    || (toggleEl.closest("li.nav-item.dropdown") as HTMLElement | null);

                if (host) toggleHostByClick(host);
                return;
            }

            // 註解：點 leaf link → 收掉所有 dropdown（不影響整個 menu 是否收合）
            const isLeaf = Boolean(el.closest("a.dropdown-item, a.nav-link"));
            const isToggleLink = Boolean(el.closest("a.dropdown-toggle"));
            if (isLeaf && !isToggleLink) closeAllDropdownStates();
        };

        // ✅ 新增：攔截 mouseenter（hover 互斥收回的來源）
        const hoverGuardTargets: HTMLElement[] = [];
        const onCaptureMouseEnter = (ev: Event) =>
        {
            if (!stopHoverAutoClose) return;
            if (isMobileWidth()) return;

            // 註解：用 capture + stopImmediatePropagation 擋掉 Header/Menu 裡的 mouseenter handler
            ev.stopImmediatePropagation();
            ev.stopPropagation();
        };

        // 註解：攔截 hover/focus bubble（有些版本用 pointerover/focusin）
        const onCapturePointerOver = (ev: Event) =>
        {
            if (!stopHoverAutoClose) return;
            if (isMobileWidth()) return;

            const el = ev.target as Element | null;
            if (!el) return;

            const inNav = Boolean(el.closest(".navbar-nav, .dropdown-menu, li.nav-item.dropdown, li.dropend.submenu"));
            if (inNav) ev.stopPropagation();
        };

        const onCaptureFocusIn = (ev: Event) =>
        {
            if (!stopHoverAutoClose) return;
            if (isMobileWidth()) return;

            const el = ev.target as Element | null;
            if (!el) return;

            const inNav = Boolean(el.closest(".navbar-nav, .dropdown-menu, li.nav-item.dropdown, li.dropend.submenu"));
            if (inNav) ev.stopPropagation();
        };

        const bindHoverGuards = () =>
        {
            if (!stopHoverAutoClose) return;

            // 註解：抓所有可能被綁 mouseenter 的節點（主 dropdown + submenu）
            const targets = collapseEl.querySelectorAll<HTMLElement>(
                ".navbar-nav > .nav-item.dropdown, li.dropend.submenu",
            );
            targets.forEach(t =>
            {
                hoverGuardTargets.push(t);
                t.addEventListener("mouseenter", onCaptureMouseEnter, true);
            });
        };

        const unbindHoverGuards = () =>
        {
            hoverGuardTargets.forEach(t =>
            {
                t.removeEventListener("mouseenter", onCaptureMouseEnter, true);
            });
            hoverGuardTargets.length = 0;
        };

        // 執行：初始化
        disableBsToggleAttrs();
        resetCollapseInstant();
        bindHoverGuards();

        // 執行：掛事件
        togglerEl.addEventListener("click", onTogglerClick);
        overlayEl?.addEventListener("click", onOverlayClick);

        collapseEl.addEventListener("click", onCollapseClick);
        collapseEl.addEventListener("shown.bs.collapse", onShown as EventListener);
        collapseEl.addEventListener("hidden.bs.collapse", onHidden as EventListener);

        // 註解：capture-phase 攔截 pointerover/focus
        collapseEl.addEventListener("pointerover", onCapturePointerOver, true);
        collapseEl.addEventListener("focusin", onCaptureFocusIn, true);

        // 執行：給外部呼叫
        apiRef.current = { open, close, toggle };

        return () =>
        {
            // cleanup：移除事件
            togglerEl.removeEventListener("click", onTogglerClick);
            overlayEl?.removeEventListener("click", onOverlayClick);

            collapseEl.removeEventListener("click", onCollapseClick);
            collapseEl.removeEventListener("shown.bs.collapse", onShown as EventListener);
            collapseEl.removeEventListener("hidden.bs.collapse", onHidden as EventListener);

            collapseEl.removeEventListener("pointerover", onCapturePointerOver, true);
            collapseEl.removeEventListener("focusin", onCaptureFocusIn, true);

            unbindHoverGuards();

            // cleanup：狀態復原
            apiRef.current = null;
            isOpenRef.current = false;
            document.body.style.overflow = "auto";
        };
    }, [opts]);

    return { isOpenRef, openMenu, closeMenu, toggleMenu };
};
