import { useEffect, useMemo } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "../App.tsx";
import type { IRouteModule } from "../SysCore/Interface/IBaseRouter.ts";
import { createClientRouter } from "../SysCore/Utils/Routes.tsx";
import { SpecRouteModule } from "../SpecFetures/1810/SpecRouter.tsx";
import { RouterProvider } from "react-router-dom";
const CssList = [
  // Server
  "/Legacy/Server/ContentBack/bootstrap-5.1.1/css/bootstrap.min.css",
  "/Legacy/Server/ContentBack/bootstrap-5.1.1/css/docs.css",
  "/Legacy/Server/fonts/tabler/tabler-icons.min.css",
  "/Legacy/Server/fonts/feather/feather.css",
  "/Legacy/Server/fonts/font-awesome-pro-5/css/all.css",
  "/Legacy/Server/css/Header.css",
  "/Legacy/Server/css/Sidebar-Menu.css",
  "/Legacy/Server/css/Footer.css",
  "/Legacy/Server/css/style_Admin_All.css",
  "/Legacy/Server/css/style_class_kit.css",
  "/Legacy/Server/css/style_background_color.css",
  "/Legacy/Server/ContentBack/nestable/nestable.css",
  "/Legacy/Server/ContentBack/table_rwd/table_rwd.css",
  "/Legacy/Server/ContentBack/bootstrap-datepicker1.6.1/bootstrap-datepicker1.6.1.css",
  "/Legacy/Server/ContentBack/login/login_NewDesige.css",
  "/Legacy/Server/ContentBack/register/register_NewDesige.css",
  "/Legacy/Server/ContentBack/animate/animate.css",
  "/Legacy/Server/ContentBack/bg_dynamic/login-Particles.css",
  "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/c3.css",
  "https://fonts.googleapis.com/css2?family=Open+Sans:wght@300;400;500;600&display=swap",

  // Client

  "/Legacy/Client/Content/Front-content.css",
  "/Legacy/Client/Content/Front-index-content.css",
  "/Legacy/Client/Content/Front-subpage-content.css",
  "/Legacy/Client/Content/menu/custom-menu-subpage.css",
  "/Legacy/Client/Content/accesskey/custom_sr-only.css",
  "/Legacy/Client/Content/accesskey/custom_accesskey.css",
  "/Legacy/Client/Content/login/login.css",
  "/Legacy/Client/Content/visitor/visitor.css",
  "/Legacy/Client/Content/ContentConentA_table_rwd.css",
  "/Legacy/Client/Content/ekko-lightbox/ekko-lightbox.css",
  "/Legacy/Client/Content/venobox-master/dist/venobox.min.css",
  "/Legacy/Client/Content/print.css",
  "/Legacy/Client/Content/Sitemap/Sitemap.css",
  "/Legacy/Client/Content/owlcarousel_2/custom_owlcarousel_style.css",
  "/Legacy/Client/Content/owlcarousel_2/owl.carousel_v2.3.4.min.css",
  "/Legacy/Client/Content/swiper-11.1.14/swiper-bundle.min.css",
  "/Legacy/Client/Content/marquee/marquee-left-loop.css",
  "/Legacy/Client/Content/slide-bar/slide-bar.css",
  "/Legacy/Client/Content/wow/animate.css",
];

CssList.forEach((href) => {
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
});

const ServerjsList = [
  "/Legacy/Server/ContentBack/jquery-3.7.1/jquery-3.7.1.min.js",
  "/Legacy/Server/ContentBack/jquery-3.7.1/bootstrap.js",
  "/Legacy/Server/ContentBack/bootstrap-5.1.1/js/bootstrap.bundle.min.js",
  "/Legacy/Server/fonts/feather/feather.min.js",
  "/Legacy/Server/ContentBack/ckeditor_4.22.1_full/ckeditor/ckeditor.js",
  "/Legacy/Server/js/simplebarv6.2.5.min.js",
  "/Legacy/Server/js/Custompcoded.js",
  "/Legacy/Server/ContentBack/nestable/jquery-1.12.4.min.js",
  "/Legacy/Server/ContentBack/nestable/jquery.nestable.js",
  "/Legacy/Server/ContentBack/bootstrap-datepicker1.6.1/bootstrap-datepicker1.6.1.min.js",
  "/Legacy/Server/ContentBack/repeater/jquery-1.11.1.js",
  "/Legacy/Server/ContentBack/repeater/jquery.repeater.js",
  "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/c3.min.js",
  "/Legacy/Server/ContentBack/chart_c3_0.7.20/css/d3-5.8.2.min.js",
];

ServerjsList.forEach((src) => {
  const script = document.createElement("script");
  script.src = src;
  script.async = false; // 確保依序執行（jQuery -> Bootstrap）
  document.body.appendChild(script);
});


declare global { interface Window { __INITIAL_STATE__?: { lang?: string;[k: string]: unknown }; } }
const SUPPORTED_LANGS = ["zh-tw", "en-us"] as const;
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
  if (v.startsWith("en")) return "en-us";
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
  const cookieName = opts?.cookieName ?? "wcms.lang";
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
    <HelmetProvider>
      <RouterProvider router={router} />
    </HelmetProvider>
  );
};

/** ---- 啟動（SSR hydration 或純 CSR） ---------------------------------- */
const container = document.getElementById("root") as HTMLElement;

const bootLang =
  (typeof window !== "undefined" && (window as any).__INITIAL_STATE__?.lang) || "zh-tw";
const module: IRouteModule = new SpecRouteModule();
const router = createClientRouter({ lang: bootLang, module });
const rootNode = <ClientBootstrap router={router} />;

const render = () => {
  if (container.hasChildNodes()) {
    hydrateRoot(container, rootNode);
  } else {
    createRoot(container).render(rootNode);
  }
};

render();