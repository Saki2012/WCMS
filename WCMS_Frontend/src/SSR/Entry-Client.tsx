import { AppRouteModule, getSiteHeaderMeta } from "@/Features/Pages/AppRoute";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp.tsx";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp.tsx";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang.ts";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter.ts";
import { api, type BrowserApiWithInit } from "@/SysCore/Utils/API/APIBase.ts";
import { LibJson, LibType } from "@/SysCore/Utils/Library/LibData";
import { importSpecAssets } from "@/SysCore/Utils/Library/SlotResolver";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { createClientRouter } from "@/SysCore/Utils/Route/Routes.tsx";
import { ensureWcmsDefaultTrustedTypesPolicy } from "@/SysCore/Utils/Security/TrustedTypesPolicy";
import type { FC, ReactElement } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

// #region Property
interface WcmsInitialState
{
    lang?: Lang;
    hydrationData?: unknown;
    [k: string]: unknown;
}

interface RenderAppOptions
{
    /** Root DOM 容器 */
    container: HTMLElement | null;

    /** 是否已有 SSR 可 hydrate 標記 */
    hasSSRMarkup: boolean;

    /** SSR 注入的初始狀態 */
    initialState?: WcmsInitialState;

    /** React Root 節點 */
    rootNode: ReactElement;

    /** 是否可使用 hydration */
    shouldHydrate: boolean;
}

declare global
{
    interface Window
    {
        __INITIAL_STATE__?: WcmsInitialState;
        __WCMS_RENDER_MODE__?: "hydrate" | "csr";
    }
}

type ClientRouter = Awaited<ReturnType<typeof createClientRouter>>;

/** Root DOM ID */
const ROOT_ELEMENT_ID = "root";

/** SSR initial state template ID */
const INITIAL_STATE_ELEMENT_ID = "wcms-initial-state";

/** 後台路由前綴 */
const SERVER_PATH_PREFIX = "/server";
// #endregion

// #region Public
/** 啟動前端 Entry，依 SSR markup 狀態決定 hydrate 或 CSR render。 */
const startClientEntry = async (): Promise<void> =>
{
    initClientRuntime();
    const container = document.getElementById(ROOT_ELEMENT_ID);
    const hasSSRMarkup = hasHydratableSsrMarkup(container);
    const templateInitialState = readInitialStateFromTemplate();
    const initialState = templateInitialState ?? window.__INITIAL_STATE__;
    const bootLang = getBootLang(initialState?.lang);
    const routeModule: IRouteModule = new AppRouteModule();
    const router = await createClientRouter({ lang: bootLang, module: routeModule });
    const rootNode = <ClientBootstrap router={router} />;
    const shouldHydrate = canUseHydration(hasSSRMarkup, initialState);
    if (initialState) window.__INITIAL_STATE__ = initialState;
    logEntryStatus(container, hasSSRMarkup, initialState, bootLang);
    subscribeRouterLog(router);
    renderApp({ container, hasSSRMarkup, initialState, rootNode, shouldHydrate });
    log("render done", { mode: window.__WCMS_RENDER_MODE__, t: performance.now().toFixed(1) });
};
// #endregion

// #region Protected
/** 初始化前端執行環境與必要資源。 */
const initClientRuntime = (): void =>
{
    if (typeof window === "undefined") return;
    ensureWcmsDefaultTrustedTypesPolicy();
    void (api as BrowserApiWithInit).__initXsrfOnce?.();
    void loadClientRuntimeAssets();
};

/** 依目前路由載入前後台資源。 */
const loadClientRuntimeAssets = async (): Promise<void> =>
{
    const path = window.location.pathname.toLowerCase();
    log("start load assets", path);
    await importClientRuntimeAssets(path);
    log("assets loaded", path);
};

/** 依 SSR 狀態執行 hydrate 或 CSR render。 */
const renderApp = (options: RenderAppOptions): void =>
{
    if (!options.container) return;
    if (options.shouldHydrate)
    {
        hydrateApp(options.container, options.rootNode);
        return;
    }
    renderCsrApp(options);
};

/** 訂閱 Router 狀態並輸出除錯紀錄。 */
const subscribeRouterLog = (router: ClientRouter): void =>
{
    router.subscribe((state) =>
    {
        log("router subscribe", { location: state.location.pathname, navigation: state.navigation.state, revalidation: state.revalidation });
    });
};
// #endregion

// #region EntityComp
/** Bootstrap 元件集中包裝 Provider，避免入口檔混入畫面邏輯。 */
const ClientBootstrap: FC<{ router: ClientRouter; }> = ({ router }) =>
{
    const siteHeaderMeta = getSiteHeaderMeta();

    return (
        <MessageProvider>
            <HelmetProvider>
                <HeaderMetaComp title={siteHeaderMeta.title} description={siteHeaderMeta.description} />
                <RouterProvider router={router} />
            </HelmetProvider>
        </MessageProvider>
    );
};
// #endregion

// #region Private
/** 依路由判斷並載入對應資源檔。 */
const importClientRuntimeAssets = async (path: string): Promise<void> =>
{
    if (path.startsWith(SERVER_PATH_PREFIX))
    {
        await import("@/Features/Assets/LoadFeaturesCss.ts");
        await import("@/Features/Assets/LoadFeaturesJs.ts");
        await importSpecAssets("Assets/LoadSpecCss_Server.ts");
        return;
    }

    await import("@/Features/Assets/LoadFeaturesCss_Client.ts");
    await import("@/Features/Assets/LoadFeaturesJs_Client.ts");
    await importSpecAssets("Assets/LoadSpecCss.ts");
    await importSpecAssets("Assets/LoadSpecJs.ts");
};

/** 判斷 root 是否真的有 SSR 可 hydrate 的元素，避免 comment marker 被誤判。 */
const hasHydratableSsrMarkup = (root: HTMLElement | null): boolean =>
{
    if (!root) return false;
    return Array.from(root.childNodes).some(isHydratableRootNode);
};

/** 判斷節點是否可作為 hydration 內容。 */
const isHydratableRootNode = (node: ChildNode): boolean =>
{
    if (node.nodeType === Node.ELEMENT_NODE) return isHydratableElementNode(node as Element);
    if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());
    return false;
};

/** 判斷元素節點是否屬於 hydration 內容。 */
const isHydratableElementNode = (element: Element): boolean =>
{
    return element.id !== INITIAL_STATE_ELEMENT_ID;
};

/** 從 SSR template 讀取 hydration state，避免 HTML 內使用 inline script。 */
const readInitialStateFromTemplate = (): WcmsInitialState | undefined =>
{
    const raw = document.getElementById(INITIAL_STATE_ELEMENT_ID)?.textContent?.trim() ?? "";
    if (!raw) return undefined;
    const value = LibJson.parseJson<unknown>(raw, undefined, {
        onError: (error) => console.error("[WCMS][CSR] initial state parse failed", error),
    });
    return LibType.isRecord(value) ? value as WcmsInitialState : undefined;
};

/** 取得啟動語系，避免 initialState 空值時造成 router 建立失敗。 */
const getBootLang = (value: unknown): Lang =>
{
    if (typeof value !== "string") return DefaultLang;
    const lang = LibRouteLang.tryNormalizeRouteLang(value);
    return lang ?? DefaultLang;
};

/** 判斷是否可以安全 hydrate，避免沒有 hydrationData 時硬接管造成雙 DOM。 */
const canUseHydration = (hasSSRMarkup: boolean, initialState: WcmsInitialState | undefined): boolean =>
{
    return hasSSRMarkup && LibType.isRecord(initialState?.hydrationData);
};

/** 執行 hydrateRoot 並記錄模式。 */
const hydrateApp = (container: HTMLElement, rootNode: ReactElement): void =>
{
    log("hydrateRoot()", { t: performance.now().toFixed(1) });
    hydrateRoot(container, rootNode, {
        onRecoverableError: (error, info) =>
        {
            console.error("[WCMS][Hydration RecoverableError]", error);
            console.error("[WCMS][Hydration ComponentStack]", info.componentStack);
        },
    });
    window.__WCMS_RENDER_MODE__ = "hydrate";
};

/** 清理不完整 SSR DOM 後改用 CSR render。 */
const renderCsrApp = (options: RenderAppOptions): void =>
{
    if (options.hasSSRMarkup)
    {
        console.error("[WCMS][CSR] SSR markup exists but hydrationData is missing. Clear SSR DOM and fallback to CSR render.");
        options.container?.replaceChildren();
    }

    if (!options.container) return;

    log("createRoot()", { t: performance.now().toFixed(1) });
    createRoot(options.container).render(options.rootNode);
    window.__WCMS_RENDER_MODE__ = "csr";
};

/** 輸出 Entry 啟動狀態。 */
const logEntryStatus = (container: HTMLElement | null, hasSSRMarkup: boolean, initialState: WcmsInitialState | undefined, bootLang: Lang): void =>
{
    log("entry start", { path: window.location.pathname, t: performance.now().toFixed(1) });
    log("root status", buildRootStatusLog(container, hasSSRMarkup, initialState));
    log("before createClientRouter", { bootLang, t: performance.now().toFixed(1) });
    log("after createClientRouter", { t: performance.now().toFixed(1) });
};

/** 建立 Root 狀態除錯資料。 */
const buildRootStatusLog = (container: HTMLElement | null, hasSSRMarkup: boolean, initialState: WcmsInitialState | undefined): Record<string, unknown> =>
{
    return {
        hasSSRMarkup,
        childNodes: container?.childNodes?.length ?? 0,
        firstChild: container?.firstChild?.nodeName ?? null,
        hasInitialState: Boolean(initialState),
        hasHydrationData: LibType.isRecord(initialState?.hydrationData),
    };
};

/** 簡易除錯紀錄。 */
const log = (...args: unknown[]): void => console.log("[WCMS][CSR]", ...args);
// #endregion

await startClientEntry();
