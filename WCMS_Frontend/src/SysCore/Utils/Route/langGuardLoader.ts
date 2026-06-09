// src/SysCore/Utils/Route/langGuardLoader.ts
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import { LibRouteLang, LibRoutePath } from "@/SysCore/Utils/Route/LibRoute";
import { type LoaderFunctionArgs, redirect } from "react-router-dom";

// #region Property
/** 語系守門 Loader 回傳結果 */
interface LangGuardLoaderResult
{
    /** 實際解析後的語系 */
    resolvedLang: Lang;
    /** 目前請求 pathname */
    pathname: string;
}
/** 語系守門 Loader 解析內容 */
interface LangGuardContext
{
    /** 目前 request */
    request: Request;
    /** 目前 URL */
    url: URL;
    /** 第一層 route segment */
    leadingSegment: string;
    /** 第一層 route segment 對應語系 */
    leadingLang: Lang | null;
    /** 移除第一層 route segment 後的路徑 */
    restPath: string;
}
/** Redirect HTTP 狀態碼 */
const REDIRECT_STATUS_CODE = 302;
// #endregion

// #region Public
/** 前台路由語系守門 Loader。 */
export const langGuardLoader = ({ request }: LoaderFunctionArgs): LangGuardLoaderResult =>
{
    const context = buildLangGuardContext(request);
    const result = resolveLangGuardResult(context);
    return result;
};
// #endregion

// #region Protected
/** 依目前路由狀態解析語系守門結果。 */
const resolveLangGuardResult = (context: LangGuardContext): LangGuardLoaderResult =>
{
    const bypassResult = resolveBypassRoute(context);
    if (bypassResult) return bypassResult;
    const langSegmentResult = resolveRouteWithLangSegment(context);
    if (langSegmentResult) return langSegmentResult;
    return resolveRouteWithoutLangSegment(context);
};

/** 處理不需要語系守門的路由。 */
const resolveBypassRoute = (context: LangGuardContext): LangGuardLoaderResult | null =>
{
    if (!LibRouteLang.isRouteLangBypassPathname(context.url.pathname)) return null;
    return createLangGuardResult(DefaultLang, context.url.pathname);
};

/** 處理網址第一段已有語系的路由。 */
const resolveRouteWithLangSegment = (context: LangGuardContext): LangGuardLoaderResult | null =>
{
    if (!context.leadingLang) return null;
    if (context.leadingLang === DefaultLang)
    {
        const defaultLangPath = LibRoutePath.normalizeInternalPath(context.restPath);
        throw redirect(buildRedirectUrl(context.url, defaultLangPath), REDIRECT_STATUS_CODE);
    }
    if (context.leadingSegment !== context.leadingLang)
    {
        const canonicalLangPath = LibRouteLang.buildLangPathname(context.restPath, context.leadingLang);
        throw redirect(buildRedirectUrl(context.url, canonicalLangPath), REDIRECT_STATUS_CODE);
    }
    return createLangGuardResult(context.leadingLang, context.url.pathname);
};

/** 處理網址第一段沒有語系的前台路由。 */
const resolveRouteWithoutLangSegment = (context: LangGuardContext): LangGuardLoaderResult =>
{
    const cookieLang = LibRouteLang.readRouteLangCookieFromRequest(context.request);
    const acceptLang = LibRouteLang.readRouteLangFromRequestAcceptLanguage(context.request);
    const preferredLang = cookieLang ?? acceptLang ?? DefaultLang;
    if (preferredLang !== DefaultLang)
    {
        const preferredLangPath = LibRouteLang.buildLangPathname(context.url.pathname, preferredLang);
        throw redirect(buildRedirectUrl(context.url, preferredLangPath), REDIRECT_STATUS_CODE);
    }
    return createLangGuardResult(DefaultLang, context.url.pathname);
};
// #endregion

// #region Private
/** 建立語系守門 Loader 解析內容。 */
const buildLangGuardContext = (request: Request): LangGuardContext =>
{
    const url = new URL(request.url);
    const leadingSegment = LibRoutePath.getLeadingPathSegment(url.pathname);
    const leadingLang = LibRouteLang.tryParseRouteLangSegment(leadingSegment);
    const restPath = LibRoutePath.removeLeadingPathSegment(url.pathname);
    return { request, url, leadingSegment, leadingLang, restPath };
};

/** 建立完整 redirect url。 */
const buildRedirectUrl = (url: URL, pathname: string): string =>
{
    const redirectUrl = `${pathname}${url.search}${url.hash}`;
    return redirectUrl;
};

/** 建立語系守門 Loader 結果。 */
const createLangGuardResult = (resolvedLang: Lang, pathname: string): LangGuardLoaderResult =>
{
    return { resolvedLang, pathname };
};
// #endregion
