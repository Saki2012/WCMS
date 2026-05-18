import { AppRouteModule, getSiteHeaderMeta } from "@/Features/Pages/AppRoute";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp.tsx";
import { ensureWcmsDefaultTrustedTypesPolicy } from "@/SysCore/Utils/Security/TrustedTypesPolicy";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp.tsx";
import { SUPPORTED_LANGS } from "@/SysCore/i18n/lang.ts";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter.ts";
import api, { type BrowserApiWithInit } from "@/SysCore/Utils/API/APIBase.ts";
import { importSpecAssets } from "@/SysCore/Utils/Library/SlotResolver";
import { createClientRouter } from "@/SysCore/Utils/Route/Routes.tsx";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import { RouterProvider } from "react-router-dom";

if (typeof window !== "undefined")
{
    ensureWcmsDefaultTrustedTypesPolicy();

    // CSR：初始化一次 XSRF
    (api as BrowserApiWithInit).__initXsrfOnce?.();

    // ✅ 不要阻塞 hydration：CSS/JS 改成背景載入
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
            await import("@/Features/Assets/LoadFeaturesCss_Client.ts"); //cara
            await import("@/Features/Assets/LoadFeaturesJs_Client.ts"); //cara
            await importSpecAssets("Assets/LoadSpecCss.ts");
            await importSpecAssets("Assets/LoadSpecJs.ts");
        }

        console.log("[WCMS][CSR] assets loaded", path);
    })();
}

declare global
{
    interface Window
    {
        __INITIAL_STATE__?: { lang?: string; [k: string]: unknown; };
    }
}
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];

/** ---- 小工具（以 const 寫法） ----------------------------------------- */

/** ---- Bootstrap 元件（不直接在入口檔做邏輯，便於維護與測試） ---------- */
const ClientBootstrap: React.FC<{ router: any; }> = ({ router }) =>
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

// ---- 啟動（SSR hydration 或純 CSR） ----------------------------------
const log = (...args: any[]) => console.log("[WCMS][CSR]", ...args);

log("entry start", { path: window.location.pathname, t: performance.now().toFixed(1) });

const container = document.getElementById("root") as HTMLElement;
const hasSSRMarkup = Boolean(container && container.hasChildNodes());

log("root status", { hasSSRMarkup, childNodes: container?.childNodes?.length ?? 0, firstChild: container?.firstChild?.nodeName ?? null });

const bootLang = (typeof window !== "undefined" && (window as any).__INITIAL_STATE__?.lang) || "zh-tw";

const siteHeaderMeta = getSiteHeaderMeta();
const module: IRouteModule = new AppRouteModule();

log("before createClientRouter", { bootLang, t: performance.now().toFixed(1) });

const router = await createClientRouter({ lang: bootLang, module });

log("after createClientRouter", { t: performance.now().toFixed(1) });

// ✅ 監看 router 狀態：確認切頁/loader 有沒有真的跑
router.subscribe((state: any) =>
{
    log("router subscribe", { location: state?.location?.pathname, navigation: state?.navigation?.state, revalidation: state?.revalidation });
});

const rootNode = <ClientBootstrap router={router} />;

const renderApp = () =>
{
    // 宣告變數
    if (!container) return;

    // ✅ 有 SSR markup -> hydrate
    if (hasSSRMarkup)
    {
        log("hydrateRoot()", { t: performance.now().toFixed(1) });
        hydrateRoot(container, rootNode);
        (window as any).__WCMS_RENDER_MODE__ = "hydrate";
        return;
    }

    // ✅ 沒 SSR markup -> csr
    log("createRoot()", { t: performance.now().toFixed(1) });
    createRoot(container).render(rootNode);
    (window as any).__WCMS_RENDER_MODE__ = "csr";
};

// 執行 render
renderApp();

log("render done", { mode: (window as any).__WCMS_RENDER_MODE__, t: performance.now().toFixed(1) });
