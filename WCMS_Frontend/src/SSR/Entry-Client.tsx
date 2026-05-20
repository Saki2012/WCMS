import { AppRouteModule, getSiteHeaderMeta } from "@/Features/Pages/AppRoute";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp.tsx";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp.tsx";
import { type Lang, SUPPORTED_LANGS } from "@/SysCore/i18n/lang.ts";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter.ts";
import api, { type BrowserApiWithInit } from "@/SysCore/Utils/API/APIBase.ts";
import { importSpecAssets } from "@/SysCore/Utils/Library/SlotResolver";
import { createClientRouter } from "@/SysCore/Utils/Route/Routes.tsx";
import { ensureWcmsDefaultTrustedTypesPolicy } from "@/SysCore/Utils/Security/TrustedTypesPolicy";
import type { FC } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

if (typeof window !== "undefined")
{
    ensureWcmsDefaultTrustedTypesPolicy();

    // CSR：初始化一次 XSRF。
    (api as BrowserApiWithInit).__initXsrfOnce?.();

    // 資源載入不阻塞 hydration，避免影響首屏接管。
    void (async () =>
    {
        const path = window.location.pathname.toLowerCase();
        console.log("[WCMS][CSR] start load assets", path);

        if (path.startsWith("/server"))
        {
            await import("@/Features/Assets/LoadFeaturesCss.ts");
            await import("@/Features/Assets/LoadFeaturesJs.ts");
            await importSpecAssets("Assets/LoadSpecCss_Server.ts");
        } else
        {
            await import("@/Features/Assets/LoadFeaturesCss_Client.ts");
            await import("@/Features/Assets/LoadFeaturesJs_Client.ts");
            await importSpecAssets("Assets/LoadSpecCss.ts");
            await importSpecAssets("Assets/LoadSpecJs.ts");
        }

        console.log("[WCMS][CSR] assets loaded", path);
    })();
}

interface WcmsInitialState
{
    lang?: Lang;
    hydrationData?: unknown;
    [k: string]: unknown;
}

declare global
{
    interface Window
    {
        __INITIAL_STATE__?: WcmsInitialState;
        __WCMS_RENDER_MODE__?: "hydrate" | "csr";
    }
}

export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
type ClientRouter = Awaited<ReturnType<typeof createClientRouter>>;

/** 判斷是否為可用的物件資料。 */
const isRecord = (value: unknown): value is Record<string, unknown> =>
{
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/** 判斷 root 是否真的有 SSR 可 hydrate 的元素，避免 comment marker 被誤判。 */
const hasHydratableSsrMarkup = (root: HTMLElement | null): boolean =>
{
    if (!root) return false;

    return Array.from(root.childNodes).some((node) =>
    {
        if (node.nodeType === Node.ELEMENT_NODE)
        {
            const element = node as Element;
            return element.id !== "wcms-initial-state";
        }

        if (node.nodeType === Node.TEXT_NODE) return Boolean(node.textContent?.trim());

        return false;
    });
};

/** 從 SSR template 讀取 hydration state，避免 HTML 內使用 inline script。 */
const readInitialStateFromTemplate = (): WcmsInitialState | undefined =>
{
    const raw = document.getElementById("wcms-initial-state")?.textContent?.trim() ?? "";
    if (!raw) return undefined;

    try
    {
        const value = JSON.parse(raw) as unknown;
        return isRecord(value) ? value as WcmsInitialState : undefined;
    } catch (error)
    {
        console.error("[WCMS][CSR] initial state parse failed", error);
        return undefined;
    }
};

/** 取得啟動語系，避免 initialState 空值時造成 router 建立失敗。 */
const getBootLang = (value: unknown): Lang =>
{
    return SUPPORTED_LANGS.includes(value as SupportedLang) ? value as Lang : "zh-tw";
};

/** 判斷是否可以安全 hydrate，避免沒有 hydrationData 時硬接管造成雙 DOM。 */
const canUseHydration = (hasSSRMarkup: boolean, initialState: WcmsInitialState | undefined): boolean =>
{
    return hasSSRMarkup && isRecord(initialState?.hydrationData);
};

/** Bootstrap 元件集中包裝 Provider，避免入口檔混入畫面邏輯。 */
const ClientBootstrap: FC<{ router: ClientRouter; }> = ({ router }) =>
{
    return (
        <MessageProvider>
            <HelmetProvider>
                <HeaderMetaComp title={siteHeaderMeta.title} description={siteHeaderMeta.description} />
                <RouterProvider router={router} />
            </HelmetProvider>
        </MessageProvider>
    );
};

/** 簡易除錯紀錄。 */
const log = (...args: unknown[]) => console.log("[WCMS][CSR]", ...args);

log("entry start", { path: window.location.pathname, t: performance.now().toFixed(1) });

const container = document.getElementById("root");
const hasSSRMarkup = hasHydratableSsrMarkup(container);
const templateInitialState = readInitialStateFromTemplate();
const initialState = templateInitialState ?? window.__INITIAL_STATE__;

if (initialState) window.__INITIAL_STATE__ = initialState;

log("root status", {
    hasSSRMarkup,
    childNodes: container?.childNodes?.length ?? 0,
    firstChild: container?.firstChild?.nodeName ?? null,
    hasInitialState: Boolean(initialState),
    hasHydrationData: isRecord(initialState?.hydrationData),
});

const bootLang = getBootLang(initialState?.lang);
const siteHeaderMeta = getSiteHeaderMeta();
const routeModule: IRouteModule = new AppRouteModule();

log("before createClientRouter", { bootLang, t: performance.now().toFixed(1) });

const router = await createClientRouter({ lang: bootLang, module: routeModule });

log("after createClientRouter", { t: performance.now().toFixed(1) });

router.subscribe((state) =>
{
    log("router subscribe", { location: state.location.pathname, navigation: state.navigation.state, revalidation: state.revalidation });
});

const rootNode = <ClientBootstrap router={router} />;
const shouldHydrate = canUseHydration(hasSSRMarkup, initialState);

/** 執行 hydrate 或 CSR render。 */
const renderApp = () =>
{
    if (!container) return;

    if (shouldHydrate)
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
        return;
    }

    if (hasSSRMarkup)
    {
        console.error("[WCMS][CSR] SSR markup exists but hydrationData is missing. Clear SSR DOM and fallback to CSR render.");
        container.replaceChildren();
    }

    log("createRoot()", { t: performance.now().toFixed(1) });
    createRoot(container).render(rootNode);
    window.__WCMS_RENDER_MODE__ = "csr";
};

renderApp();

log("render done", { mode: window.__WCMS_RENDER_MODE__, t: performance.now().toFixed(1) });
