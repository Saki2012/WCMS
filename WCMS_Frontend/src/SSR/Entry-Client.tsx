import { useEffect, useMemo } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter.ts";
import { createClientRouter } from "@/SysCore/Utils/Route/Routes.tsx";
import { SpecRouteModule } from "../SpecFetures/1810/SpecRouter.tsx";
import { RouterProvider } from "react-router-dom";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp.tsx";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp.tsx";
import api, { type BrowserApiWithInit } from "@/SysCore/Utils/API/APIBase.ts"
import { siteHeaderMeta } from "SpecFeature/SpecRouter"
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam.ts";
import { SUPPORTED_LANGS } from "@/SysCore/i18n/lang.ts";


if (typeof window !== "undefined") {
  // CSR：初始化一次 XSRF
  (api as BrowserApiWithInit).__initXsrfOnce?.();
  const path = window.location.pathname.toLowerCase();
  if (path.startsWith("/server")) {
    // ✅ 後台：/Server/... → 載入 Features（後台）CSS / JS
    await import("@/Features/Assets/LoadFeaturesCss.ts");
    await import("@/Features/Assets/LoadFeaturesJs.ts");
    await import("SpecFeature/Assets/LoadSpecCss_Server.ts");
  } else {
    // ✅ 前台：其他路徑 → 載入 Spec（前台）CSS / JS
    await import("SpecFeature/Assets/LoadSpecCss.ts");
    await import("SpecFeature/Assets/LoadSpecJs.ts");
  }
}


declare global { interface Window { __INITIAL_STATE__?: { lang?: string;[k: string]: unknown }; } }
export type SupportedLang = (typeof SUPPORTED_LANGS)[number];
interface UseCookieResult {
  get: (name: string) => string | undefined;
  set: (name: string, value: string, opt?: { path?: string; samesite?: "Lax" | "Strict" | "None" }) => void;
}
interface UseLangOpts {
  cookieName?: string;
  fallback?: SupportedLang;
}
/** ---- 小工具（以 const 寫法） ----------------------------------------- */
const normalizeLang = (raw?: string): SupportedLang | undefined => {
  if (!raw) return;
  const v = raw.toLowerCase();
  if (v.startsWith("zh")) return "zh-tw";
  if (v.startsWith("en")) return "en";
  return (SUPPORTED_LANGS.find(l => l === v) as SupportedLang | undefined) ?? undefined;
};

/** ---- Hooks ------------------------------------------------------------- */
/** 讀/寫 cookie（封裝為 hook，後續可換 storage 或策略） */
const useCookie = (): UseCookieResult => {
  const get = (name: string) => {
    const m = document.cookie.match(
      new RegExp(`(?:^|; )${name.replace(/([.$?*|{}()[\]\\/+^])/g, "\\$1")}=([^;]*)`)
    );
    return m ? decodeURIComponent(m[1]) : undefined;
  };

  const set: UseCookieResult["set"] = (name, value, opt) => {
    const path = opt?.path ?? "/";
    const samesite = opt?.samesite ?? "Lax";
    document.cookie = `${name}=${encodeURIComponent(value)}; Path=${path}; SameSite=${samesite}; Secure`;
  };

  return { get, set };
};

/** 從伺服器注入的 initialState 取得語言（SSR hydration 優先） */
const useInitialStateLang = (): SupportedLang | undefined =>
  useMemo(() => normalizeLang(window.__INITIAL_STATE__?.lang), []);

/** 從 Cookie 取得語言 */
const useCookieLang = (cookieName: string): SupportedLang | undefined => {
  const cookie = useCookie();
  return useMemo(() => normalizeLang(cookie.get(cookieName)), [cookieName]);
};

/** 從瀏覽器偏好取得語言（最後的 fallback） */
const useNavigatorLang = (): SupportedLang | undefined =>
  useMemo(() => normalizeLang(navigator.language || (navigator as any).userLanguage), []);

/** 統一決策語言（單一資料源） */
const useActiveLang = (opts?: UseLangOpts): SupportedLang => {
  const cookieName = opts?.cookieName ?? LANG_COOKIE_KEY;
  const fallback = opts?.fallback ?? "zh-tw";

  const fromState = useInitialStateLang();
  const fromCookie = useCookieLang(cookieName);
  const fromNav = useNavigatorLang();

  const decided = useMemo<SupportedLang>(() => {
    return fromState ?? fromCookie ?? fromNav ?? fallback;
  }, [fromState, fromCookie, fromNav, fallback]);

  // 啟動時把決策語言同步回 Cookie，維持後續 CSR 穩定
  const cookie = useCookie();
  useEffect(() => {
    const current = normalizeLang(cookie.get(cookieName));
    if (current !== decided) cookie.set(cookieName, decided, { samesite: "Lax" });
  }, [cookieName, decided]);

  return decided;
};

/** ---- Bootstrap 元件（不直接在入口檔做邏輯，便於維護與測試） ---------- */
const ClientBootstrap: React.FC<{ router: any }> = ({ router }) => {
  return (
    <MessageProvider>
      <HelmetProvider>
        <HeaderMetaComp title={siteHeaderMeta.title} description={siteHeaderMeta.description} />
        <RouterProvider router={router} />
      </HelmetProvider>
    </MessageProvider>
  );
};

/** ---- 啟動（SSR hydration 或純 CSR） ---------------------------------- */
const bootLang = (typeof window !== "undefined" && (window as any).__INITIAL_STATE__?.lang) || "zh-tw";
const module: IRouteModule = new SpecRouteModule();
const router = await createClientRouter({ lang: bootLang, module });
const container = document.getElementById("root")! as HTMLElement;
const rootNode = <ClientBootstrap router={router} />;
container.innerHTML = "";

const CSR_Render = () => {
  if (container.hasChildNodes()) hydrateRoot(container, rootNode);
  else createRoot(container).render(rootNode);
};

CSR_Render();