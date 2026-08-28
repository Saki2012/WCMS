import crypto from "node:crypto";
import express, { type NextFunction, type Request, type Response } from "express";
import { crossOriginEmbedderPolicyValue } from "./COEPSetting";
import { crossOriginResourcePolicyValue } from "./CORPSetting";
import { buildProdCsp, type CspStyleMode } from "./CSPSetting";
import { setupHostValidation } from "./HostValidation";

// #region Property
export type ProxyHeaderMap = Record<string, string | string[] | undefined>;

export type ProxyResponseLike = { headers: ProxyHeaderMap; };

type SecurityHeaderConfig = Readonly<{ isProd: boolean; }>;

const noStoreHeaderValue = "no-store, no-cache, must-revalidate, proxy-revalidate";

const defaultReferrerPolicy = "strict-origin-when-cross-origin";

const defaultPermissionsPolicy = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";

const htmlPermissionsPolicy = "geolocation=(), microphone=(), camera=(), fullscreen=(self \"https://www.youtube.com\" \"https://www.youtube-nocookie.com\")";

/** JavaScript 靜態資源仍需宣告 Trusted Types Enforcement，避免 Scanner 將各個 JS Response 視為未啟用。 */
const staticScriptCspValue = "default-src 'none'; require-trusted-types-for 'script'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";
// #endregion

// #region Public
/** 設定 HTML/API 不落地快取，避免 SSL 頁面被弱掃判定可快取。 */
export const setNoStoreHeaders = (res: Response): void =>
{
    res.setHeader("Cache-Control", noStoreHeaderValue);
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
};

/** 移除由 Node/Proxy 可控制的技術洩漏標頭。 */
export const stripDisclosureHeaders = (res: Response): void =>
{
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
};

/** 取得同一個 Response 生命週期共用的 CSP nonce。 */
export const getResponseNonce = (res: Response): string =>
{
    const current = res.locals.cspNonce;
    if (typeof current === "string" && current.trim()) return current;

    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.cspNonce = nonce;
    return nonce;
};

/** 設定 SSR HTML 專用安全標頭；正式環境才送 CSP。 */
export const setHtmlSecurityHeaders = (req: Request, res: Response, cfg: SecurityHeaderConfig, nonce: string): void =>
{
    setBaseSecurityHeaders(res, cfg, !isPdfPath(req.path));
    res.setHeader("Permissions-Policy", htmlPermissionsPolicy);
    if (!cfg.isProd) return;

    res.setHeader("Content-Security-Policy", buildProdCsp(nonce, getHtmlCspOptions()));
};

/** 先驗證 Host，再讓 HTML/靜態資源帶基礎安全標頭；API Proxy 由 setProxySecurityHeaders 重寫。 */
export const setupSecurityHeaders = (app: express.Express, cfg: SecurityHeaderConfig): void =>
{
    app.disable("x-powered-by");
    setupHostValidation(app, cfg);
    app.set("trust proxy", true);
    app.use((req: Request, res: Response, next: NextFunction) => applyBaseSecurityHeaders(req, res, next, cfg));
};

/** 清掉後端 Proxy 重複標頭，並由 Node 統一設定 API 對外安全標頭。 */
export const setProxySecurityHeaders = (proxyRes: ProxyResponseLike, cfg: SecurityHeaderConfig): void =>
{
    const isPdf = isPdfProxyResponse(proxyRes.headers);
    stripProxyOwnedHeaders(proxyRes.headers);
    setProxyCacheHeaders(proxyRes.headers);
    setProxyBaseHeaders(proxyRes.headers, !isPdf);
    if (cfg.isProd) proxyRes.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
};
// #endregion

// #region Private
/** 判斷目前路徑是否為 Service API。 */
const isServicePath = (pathname: string): boolean =>
{
    const path = String(pathname || "").toLowerCase();
    return path === "/service" || path.startsWith("/service/");
};

/** 判斷靜態資源路徑是否為 PDF，避免 CORP 影響瀏覽器原生 PDF Viewer。 */
const isPdfPath = (pathname: string): boolean =>
{
    const path = String(pathname || "").trim().toLowerCase();
    return path.endsWith(".pdf");
};

/** 判斷路徑是否為需要補 CSP 的 JavaScript 靜態資源。 */
const isJavaScriptPath = (pathname: string): boolean =>
{
    const path = String(pathname || "").trim().toLowerCase();
    return path.endsWith(".js") || path.endsWith(".mjs");
};

/** 正式環境替 JavaScript 靜態資源補最小 CSP，並同步宣告 Trusted Types Enforcement。 */
const setStaticResourceSecurityHeaders = (req: Request, res: Response, cfg: SecurityHeaderConfig): void =>
{
    if (!cfg.isProd || !isJavaScriptPath(req.path)) return;
    res.setHeader("Content-Security-Policy", staticScriptCspValue);
};

/** 判斷 Proxy Response 是否為 PDF。 */
const isPdfProxyResponse = (headers: ProxyHeaderMap): boolean =>
{
    const contentType = getProxyHeaderText(headers, "content-type").toLowerCase();
    return contentType.startsWith("application/pdf");
};

/** 讀取 Proxy Response Header 文字值。 */
const getProxyHeaderText = (headers: ProxyHeaderMap, name: string): string =>
{
    const key = Object.keys(headers).find(x => x.toLowerCase() === name.toLowerCase());
    if (!key) return "";

    const value = headers[key];
    return Array.isArray(value) ? value.join(",") : String(value ?? "");
};

/** 套用 Node HTML/靜態資源的基礎安全標頭。 */
const applyBaseSecurityHeaders = (req: Request, res: Response, next: NextFunction, cfg: SecurityHeaderConfig): void =>
{
    if (isServicePath(req.path))
    {
        stripDisclosureHeaders(res);
        next();
        return;
    }

    setBaseSecurityHeaders(res, cfg, !isPdfPath(req.path));
    setStaticResourceSecurityHeaders(req, res, cfg);
    next();
};

/** 設定 HTML、靜態資源共用的基礎安全標頭，不在這裡塞 CSP。 */
const setBaseSecurityHeaders = (res: Response, cfg: SecurityHeaderConfig, includeCorp: boolean): void =>
{
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", defaultReferrerPolicy);
    res.setHeader("Permissions-Policy", defaultPermissionsPolicy);
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Embedder-Policy", crossOriginEmbedderPolicyValue);
    if (includeCorp) res.setHeader("Cross-Origin-Resource-Policy", crossOriginResourcePolicyValue);
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");
    if (cfg.isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
    stripDisclosureHeaders(res);
};

/** 建立正式環境 HTML CSP 的調整參數；前後台統一採 Balanced。 */
const getHtmlCspOptions = () =>
{
    return { styleMode: "balanced" as CspStyleMode };
};

/** 從 Proxy Header Map 移除指定標頭，避免後端/IIS/Node 重複輸出。 */
const deleteProxyHeader = (headers: ProxyHeaderMap, name: string): void =>
{
    const lower = name.toLowerCase();
    for (const key of Object.keys(headers))
    {
        if (key.toLowerCase() === lower) delete headers[key];
    }
};

/** 移除後端 Proxy 回來、但應由 Node 對外統一管理的安全標頭。 */
const stripProxyOwnedHeaders = (headers: ProxyHeaderMap): void =>
{
    const names = [
        "content-security-policy",
        "content-security-policy-report-only",
        "cross-origin-opener-policy",
        "cross-origin-embedder-policy",
        "cross-origin-resource-policy",
        "permissions-policy",
        "referrer-policy",
        "strict-transport-security",
        "x-content-type-options",
        "x-frame-options",
        "x-permitted-cross-domain-policies",
        "x-powered-by",
        "server",
    ];

    for (const name of names) deleteProxyHeader(headers, name);
};

/** 設定 API Proxy 回應的不可快取標頭。 */
const setProxyCacheHeaders = (headers: ProxyHeaderMap): void =>
{
    headers["cache-control"] = noStoreHeaderValue;
    headers["pragma"] = "no-cache";
    headers["expires"] = "0";
};

/** 設定 API Proxy 回應的基礎安全標頭。 */
const setProxyBaseHeaders = (headers: ProxyHeaderMap, includeCorp: boolean): void =>
{
    headers["x-content-type-options"] = "nosniff";
    headers["x-frame-options"] = "SAMEORIGIN";
    headers["referrer-policy"] = defaultReferrerPolicy;
    headers["permissions-policy"] = defaultPermissionsPolicy;
    headers["cross-origin-opener-policy"] = "same-origin";
    headers["cross-origin-embedder-policy"] = crossOriginEmbedderPolicyValue;
    if (includeCorp) headers["cross-origin-resource-policy"] = crossOriginResourcePolicyValue;
    headers["x-permitted-cross-domain-policies"] = "none";
    headers["content-security-policy"] = "default-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'; form-action 'none'";
};
// #endregion
