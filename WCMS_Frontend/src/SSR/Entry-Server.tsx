import { AppRouteModule, getSiteHeaderMeta } from "@/Features/Pages/AppRoute";
import { buildSiteRoutingInitialState } from "@/Features/Pages/Client/Route/ClientRouter_Loader";
import { HeaderMetaComp } from "@/SysCore/Components/HeaderMeta/HeaderMeta_Comp";
import { MessageProvider } from "@/SysCore/Components/Message/Dialog/Dialog_Comp";
import type { IRouteModule } from "@/SysCore/Interface/IBaseRouter";
import { importSpecAssets } from "@/SysCore/Utils/Library/SlotResolver";
import { LibRouteLang } from "@/SysCore/Utils/Route/LibRoute";
import { createServerRouter } from "@/SysCore/Utils/Route/Routes";
import { renderToString } from "react-dom/server";
import * as HelmetAsync from "react-helmet-async";
import { StaticRouterProvider } from "react-router-dom/server";

// #region Property
/** SSR Request 建立時使用的本機 Origin。 */
const SSR_REQUEST_ORIGIN = "http://localhost";
/** 後台路由前綴，用於判斷載入後台或前台 assets。 */
const SERVER_ROUTE_PREFIX = "/server";
/** 後台 Spec CSS 載入路徑。 */
const SERVER_SPEC_ASSETS_PATH = "Assets/LoadSpecCss_Server.ts";
/** 前台 Spec CSS 載入路徑。 */
const CLIENT_SPEC_ASSETS_PATH = "Assets/LoadSpecCss.ts";
/** React Helmet Provider，避免 SSR 端套件取不到 Provider 時直接中斷。 */
const HelmetProvider = (HelmetAsync as any).HelmetProvider ?? (HelmetAsync as any).default?.HelmetProvider ?? (({ children }: any) => <>{children}</>);
/** SSR HTML 回傳結果。 */
interface HtmlRenderResult
{
    /** 回傳型別。 */
    kind: "html";
    /** React SSR HTML 字串。 */
    appHtml: string;
    /** React Helmet 產出的 head 標籤。 */
    headTags: string;
    /** 注入到 Client 端的初始化資料。 */
    initialState: any;
}
/** SSR Response 回傳結果，通常為 loader redirect 或錯誤 response。 */
interface ResponseRenderResult
{
    /** 回傳型別。 */
    kind: "response";
    /** HTTP 狀態碼。 */
    status: number;
    /** Response headers。 */
    headers: Record<string, string>;
}
/** SSR Render 對外回傳型別。 */
type RenderResult = HtmlRenderResult | ResponseRenderResult;
/** createServerRouter 成功建立 Router 的結果型別。 */
type ServerRouterResult = Awaited<ReturnType<typeof createServerRouter>>;
/** StaticRouterProvider 渲染所需的 Router Context 型別。 */
type ServerRouterContext = Extract<ServerRouterResult, { kind: "router"; }>;
/** React Helmet SSR context 最小型別。 */
interface HelmetContext
{
    /** Helmet 收集到的標籤內容。 */
    helmet?: {
        /** title 標籤輸出。 */
        title?: { toString: () => string; };
        /** meta 標籤輸出。 */
        meta?: { toString: () => string; };
    };
}
// #endregion

// #region Public
/** SSR 入口，依 URL 建立 Server Router 並回傳 HTML 或 Response。 */
export const SSR_Render = async (url: string, headers: Record<string, string> = {}): Promise<RenderResult> =>
{
    await loadSsrAssetsByUrl(url);
    const siteHeaderMeta = getSiteHeaderMeta();
    const request = createSsrRequest(url, headers);
    const boot = { module: new AppRouteModule() as IRouteModule };
    const built = await createServerRouter(boot, request);
    if (built.kind === "response") return createResponseRenderResult(built.response);
    return createHtmlRenderResult({ built, request, siteHeaderMeta });
};
/** 保留舊 render 命名給 SSR server 入口調用。 */
export const render = SSR_Render;
// #endregion

// #region Protected
/** 依 URL 判斷並載入前台或後台 SSR assets。 */
const loadSsrAssetsByUrl = async (url: string): Promise<void> =>
{
    if (isServerRouteUrl(url))
    {
        await import("@/Features/Assets/LoadFeaturesCss.ts");
        await importSpecAssets(SERVER_SPEC_ASSETS_PATH);
        return;
    }
    await import("@/Features/Assets/LoadFeaturesCss_Client.ts");
    await importSpecAssets(CLIENT_SPEC_ASSETS_PATH);
};
/** 建立 SSR HTML 結果。 */
const createHtmlRenderResult = (opt: { built: ServerRouterContext; request: Request; siteHeaderMeta: ReturnType<typeof getSiteHeaderMeta>; }): HtmlRenderResult =>
{
    const helmetContext: HelmetContext = {};
    const resolvedLang = LibRouteLang.resolveRouteLangFromRequest(opt.request);
    const initialState = buildInitialState(opt.built, resolvedLang);
    const appHtml = renderAppHtml({ built: opt.built, helmetContext, siteHeaderMeta: opt.siteHeaderMeta });
    const headTags = buildHeadTags(helmetContext);
    return { kind: "html", appHtml, headTags, initialState };
};
// #endregion

// #region Private
/** 判斷目前 URL 是否為後台路由。 */
const isServerRouteUrl = (url: string): boolean =>
{
    const lowerUrl = url.toLowerCase();
    const isServerRoute = lowerUrl.startsWith(SERVER_ROUTE_PREFIX);
    return isServerRoute;
};

/** 建立 SSR Request 供 React Router loader 使用。 */
const createSsrRequest = (url: string, headers: Record<string, string>): Request =>
{
    const request = new Request(`${SSR_REQUEST_ORIGIN}${url}`, { method: "GET", headers });
    return request;
};

/** 建立 SSR Response 結果。 */
const createResponseRenderResult = (response: Response): ResponseRenderResult =>
{
    const headers = Object.fromEntries(response.headers.entries());
    return { kind: "response", status: response.status, headers };
};

/** 建立要注入 Client 的初始化資料。 */
const buildInitialState = (built: ServerRouterContext, resolvedLang: ReturnType<typeof LibRouteLang.resolveRouteLangFromRequest>): any =>
{
    const siteRoutingState = buildSiteRoutingInitialState(resolvedLang);
    const hydrationData = { loaderData: built.context.loaderData, actionData: built.context.actionData, errors: built.context.errors };
    return { ...siteRoutingState, lang: resolvedLang, hydrationData };
};

/** 渲染 React SSR HTML。 */
const renderAppHtml = (opt: { built: ServerRouterContext; helmetContext: HelmetContext; siteHeaderMeta: ReturnType<typeof getSiteHeaderMeta>; }): string =>
{
    const appHtml = renderToString(
        <MessageProvider>
            <HelmetProvider context={opt.helmetContext}>
                <HeaderMetaComp {...opt.siteHeaderMeta} />
                <StaticRouterProvider router={opt.built.router} context={opt.built.context} hydrate={false} />
            </HelmetProvider>
        </MessageProvider>,
    );

    return appHtml;
};

/** 建立 SSR head 標籤字串。 */
const buildHeadTags = (helmetContext: HelmetContext): string =>
{
    const title = helmetContext.helmet?.title?.toString() ?? "";
    const meta = helmetContext.helmet?.meta?.toString() ?? "";
    const headTags = [title, meta].join("");
    return headTags;
};
// #endregion
