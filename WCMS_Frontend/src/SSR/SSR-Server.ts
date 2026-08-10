// src/SSR/SSR-Server.ts
// SSR Server for Vite (dev middleware) + Express (prod static) + API proxy
import "dotenv/config";
import compression from "compression";
import { config as dotenvConfig } from "dotenv";
import express, { type NextFunction, type Request, type Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import crypto from "node:crypto";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import serveStatic from "serve-static";
import { LibType } from "../SysCore/Utils/Library/LibData";
import { buildProdCsp, type CspStyleMode } from "./CSPSetting";

// #region Property
type SsrConfig = Readonly<{
    port: number;
    isProd: boolean;
    apiTarget: string; // 後端 origin，例如 https://localhost:7030
    allowInsecureBackendTls: boolean;
}>;

type ProdPaths = Readonly<{ clientRoot: string; serverEntry: string; indexPath: string; }>;

type SpecAssetLoaderFile = Readonly<{ filePath: string; publicBase: string; }>;

type HeaderValue = string | number | readonly string[];

type HeadersMap = Record<string, HeaderValue>;

type ProxyHeaderMap = Record<string, string | string[] | undefined>;

type ProxyResponseLike = { headers: ProxyHeaderMap; };

const noStoreHeaderValue = "no-store, no-cache, must-revalidate, proxy-revalidate";

const defaultReferrerPolicy = "strict-origin-when-cross-origin";

const defaultPermissionsPolicy = "geolocation=(), microphone=(), camera=(), fullscreen=(self)";

const htmlPermissionsPolicy = "geolocation=(), microphone=(), camera=(), fullscreen=(self \"https://www.youtube.com\" \"https://www.youtube-nocookie.com\")";

type ViteManifestEntry = Readonly<{ file: string; css?: string[]; imports?: string[]; isEntry?: boolean; }>;

type ViteManifest = Record<string, ViteManifestEntry>;

const INITIAL_STATE_MARKER = "<!--initial-state-->";

const INITIAL_STATE_TEMPLATE_RE = /<template\b[^>]*\bid=["']wcms-initial-state["'][^>]*>[\s\S]*?<\/template>/gi;

// #endregion

// #region Private
/** 設定 HTML/API 不落地快取，避免 SSL 頁面被弱掃判定可快取。 */
const setNoStoreHeaders = (res: Response): void =>
{
    res.setHeader("Cache-Control", noStoreHeaderValue);
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
};

/** 讀取布林環境參數，讓弱掃與相容性可逐案微調。 */
const readBoolEnv = (key: string, defaultValue = false): boolean =>
{
    const raw = String(process.env[key] ?? "").trim().toLowerCase();
    if (!raw) return defaultValue;
    return raw === "1" || raw === "true" || raw === "yes" || raw === "y";
};

/** 讀取 CSP style 模式，預設 balanced：保留 inline style attribute，但不開放 inline style element。 */
const readStyleModeEnv = (): CspStyleMode =>
{
    const raw = String(process.env.SSR_CSP_STYLE_MODE || "balanced").trim().toLowerCase();
    if (raw === "legacy" || raw === "strict") return raw;
    return "balanced";
};

/** 取得 Referrer-Policy；預設兼顧安全與 Google/外部服務相容性。 */
const getReferrerPolicy = (): string =>
{
    const raw = String(process.env.SSR_REFERRER_POLICY || "").trim();
    return raw || defaultReferrerPolicy;
};

/** 移除由 Node/Proxy 可控制的技術洩漏標頭。 */
const stripDisclosureHeaders = (res: Response): void =>
{
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
};

/** 從 proxy header map 移除指定標頭，避免後端/IIS/Node 重複輸出。 */
const deleteProxyHeader = (headers: ProxyHeaderMap, name: string): void =>
{
    const lower = name.toLowerCase();
    for (const key of Object.keys(headers))
    {
        if (key.toLowerCase() === lower) delete headers[key];
    }
};

/** 移除後端 proxy 回來、但應由 Node 對外統一管理的安全標頭。 */
const stripProxyOwnedHeaders = (headers: ProxyHeaderMap): void =>
{
    const names = [
        "content-security-policy",
        "content-security-policy-report-only",
        "cross-origin-opener-policy",
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

/** 取得同一個 response 生命週期共用的 CSP nonce。 */
const getResponseNonce = (res: Response): string =>
{
    const current = res.locals.cspNonce;
    if (typeof current === "string" && current.trim()) return current;

    const nonce = crypto.randomBytes(16).toString("base64");
    res.locals.cspNonce = nonce;
    return nonce;
};

/** 建立正式環境 HTML CSP 的調整參數。 */
const getHtmlCspOptions = (req: Request) =>
{
    const pathname = String(req.path || "");
    const isServerPage = /^\/server(?:\/|$)/i.test(pathname);

    return {
        enforceTrustedTypes: isServerPage ? false : readBoolEnv("SSR_ENFORCE_TRUSTED_TYPES", false),
        styleMode: isServerPage ? "legacy" as CspStyleMode : readStyleModeEnv(),
    };
};

/** 設定 HTML、靜態資源共用的基礎安全標頭，不在這裡塞 CSP。 */
const setBaseSecurityHeaders = (res: Response, cfg: SsrConfig): void =>
{
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", getReferrerPolicy());
    res.setHeader("Permissions-Policy", defaultPermissionsPolicy);
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("X-Permitted-Cross-Domain-Policies", "none");

    if (cfg.isProd) res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");

    stripDisclosureHeaders(res);
};

/** 設定 SSR HTML 專用安全標頭；CSP 只放在 HTML response。 */
const setHtmlSecurityHeaders = (req: Request, res: Response, cfg: SsrConfig, nonce: string): void =>
{
    setBaseSecurityHeaders(res, cfg);
    res.setHeader("Permissions-Policy", htmlPermissionsPolicy);
    if (!cfg.isProd) return;

    res.setHeader("Content-Security-Policy", buildProdCsp(nonce, getHtmlCspOptions(req)));
};

/** 讓 HTML/靜態資源先帶基礎安全標頭；API proxy 由 onProxyRes 統一重寫。 */
const setupSecurityHeaders = (app: express.Express, cfg: SsrConfig): void =>
{
    app.disable("x-powered-by");
    app.set("trust proxy", true);

    app.use((req: Request, res: Response, next: NextFunction) =>
    {
        if (isPathSegmentPrefix(req.path, "/Service"))
        {
            stripDisclosureHeaders(res);
            next();
            return;
        }

        setBaseSecurityHeaders(res, cfg);
        next();
    });
};

/** 清掉後端 Proxy 轉回來的重複標頭，並讓 API 採用 Node 統一安全標頭。 */
const setProxySecurityHeaders = (proxyRes: ProxyResponseLike, cfg: SsrConfig): void =>
{
    stripProxyOwnedHeaders(proxyRes.headers);

    proxyRes.headers["cache-control"] = noStoreHeaderValue;
    proxyRes.headers["pragma"] = "no-cache";
    proxyRes.headers["expires"] = "0";
    proxyRes.headers["x-content-type-options"] = "nosniff";
    proxyRes.headers["x-frame-options"] = "SAMEORIGIN";
    proxyRes.headers["referrer-policy"] = getReferrerPolicy();
    proxyRes.headers["permissions-policy"] = defaultPermissionsPolicy;
    proxyRes.headers["cross-origin-opener-policy"] = "same-origin";
    proxyRes.headers["x-permitted-cross-domain-policies"] = "none";
    proxyRes.headers["content-security-policy"] = "default-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'self'; form-action 'none'";

    if (cfg.isProd) proxyRes.headers["strict-transport-security"] = "max-age=31536000; includeSubDomains";
};

const coerceHeaderValue = (v: unknown): HeaderValue | null =>
{
    // 宣告變數
    const t = typeof v;

    // 執行 function
    if (v == null) return null;
    if (t === "string" || t === "number") return v as HeaderValue;

    if (Array.isArray(v))
    {
        const items = v.filter((x) => typeof x === "string") as string[];
        return items.length ? items : null;
    }

    // fallback：確保 res.setHeader 永遠吃到合法型別
    return String(v);
};

const coerceHeadersMap = (raw: unknown): HeadersMap =>
{
    // 宣告變數
    const out: HeadersMap = {};

    // 執行 function
    if (!LibType.isRecord(raw)) return out;

    for (const [k, v] of Object.entries(raw))
    {
        const hv = coerceHeaderValue(v);
        if (hv != null) out[k] = hv;
    }

    // return
    return out;
};

const trySendResponseResult = (res: Response, result: unknown): boolean =>
{
    // 宣告變數
    if (!LibType.isRecord(result)) return false;
    if (result.kind !== "response") return false;

    const status = Number(result.status ?? 302);
    const headers = coerceHeadersMap(result.headers ?? {});

    // 執行 function
    for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
    stripDisclosureHeaders(res);
    res.status(status).end();

    // return
    return true;
};

const resolveFirstExistingDir = (root: string, candidates: string[]): string =>
{
    // 宣告變數
    const base = path.resolve(root);

    // 執行 function
    for (const name of candidates)
    {
        const abs = path.resolve(base, name);
        if (existsSync(abs)) return abs;
    }

    // return（都沒有就回第一個預設值）
    return path.resolve(base, candidates[0]);
};

const tryBuildProdPaths = (root: string): ProdPaths | null =>
{
    // 宣告變數
    const clientRoot = resolveFirstExistingDir(root, ["CSR", "client"]);
    const serverRoot = resolveFirstExistingDir(root, ["SSR", "server"]);
    const indexPath = path.resolve(clientRoot, "index.html");
    const serverEntryAbs = path.resolve(serverRoot, "entry-server.js");

    // 執行 function
    if (!existsSync(indexPath)) return null;
    if (!existsSync(serverEntryAbs)) return null;

    // return
    return { clientRoot, indexPath, serverEntry: pathToFileURL(serverEntryAbs).href };
};

const getProdPaths = (): ProdPaths =>
{
    // 宣告變數
    const appRoot = process.env.SSR_APP_ROOT?.trim();

    // 執行 function
    if (appRoot)
    {
        const p = tryBuildProdPaths(appRoot);
        if (p) return p;
    }

    // 情境1：直接在 dist/ 內啟動（cwd 就是 dist）
    const p1 = tryBuildProdPaths(process.cwd());
    if (p1) return p1;

    // 情境2：在專案根目錄啟動（讀 root/dist）
    const p2 = tryBuildProdPaths(path.resolve(process.cwd(), "dist"));
    if (p2) return p2;

    // fallback：維持舊行為（相對 SSR-Server.ts 的位置）
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const p3 = tryBuildProdPaths(path.resolve(__dirname, "../../dist"));
    if (p3) return p3;

    throw new Error("Cannot resolve prod paths: missing CSR/client or SSR/server build output.");
};

const tryParseUrl = (s: string): URL | null =>
{
    // 宣告變數
    const raw = String(s || "").trim();

    // 執行 function
    if (!raw) return null;

    try
    {
        return new URL(raw);
    } catch
    {
        return null;
    }
};

const isLocalhostHost = (host: string): boolean =>
{
    const h = String(host || "").toLowerCase();
    return h === "localhost" || h === "127.0.0.1" || h === "::1";
};

const shouldAllowInsecureBackendTls = (isProd: boolean, apiTarget: string, allowInsecureTls: boolean): boolean =>
{
    const u = tryParseUrl(apiTarget);
    const isHttps = u?.protocol === "https:";
    const isLocalhost = isLocalhostHost(u?.hostname ?? "");

    if (!isHttps) return false;
    if (!isProd) return true;
    return allowInsecureTls && isLocalhost;
};

const applyProdTlsGuard = (isProd: boolean, apiTarget: string, allowInsecureTls: boolean): boolean =>
{
    const allowBackendTls = shouldAllowInsecureBackendTls(isProd, apiTarget, allowInsecureTls);
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = allowBackendTls ? "0" : "1";

    if (allowBackendTls && isProd)
    {
        console.warn(`[SSR] Insecure TLS allowed ONLY for localhost backend: ${apiTarget}`);
    }

    if (isProd && allowInsecureTls && !allowBackendTls)
    {
        console.warn(`[SSR] SSR_ALLOW_INSECURE_TLS ignored. Only https localhost backend may use it. apiTarget=${apiTarget}`);
    }

    return allowBackendTls;
};

/** 依目前模式載入 SSR Server 所需環境檔，讓 Spec 與 Feature 使用相同判斷。 */
const loadRuntimeEnvFiles = (cwd: string, isDistRuntime: boolean): void =>
{
    if (isDistRuntime)
    {
        const hasDotEnv = existsSync(path.resolve(cwd, ".env"));
        const prodEnvPath = path.resolve(cwd, ".env.production");
        if (!hasDotEnv && existsSync(prodEnvPath)) dotenvConfig({ path: prodEnvPath });
        return;
    }

    const mode = String(process.env.NODE_ENV || "development") === "production" ? "production" : "development";
    const candidates = [`.env.${mode}.local`, `.env.${mode}`];

    for (const fileName of candidates)
    {
        const envPath = path.resolve(cwd, fileName);
        if (existsSync(envPath)) dotenvConfig({ path: envPath });
    }
};

// 讀 env 並整理成 config
const getConfig = (): SsrConfig =>
{
    const cwd = process.cwd();
    const isDistRuntime = existsSync(path.resolve(cwd, "CSR")) && existsSync(path.resolve(cwd, "SSR"));
    loadRuntimeEnvFiles(cwd, isDistRuntime);

    const nodeEnv = String(process.env.NODE_ENV || "development");
    const isProd = nodeEnv === "production" || isDistRuntime;
    const port = Number(process.env.SSR_PORT || process.env.PORT || 5174);
    const apiTarget = String(process.env.SSR_API_TARGET || "https://localhost:7030").replace(/\/+$/, "");
    const allowInsecureTls = readBoolEnv("SSR_ALLOW_INSECURE_TLS", false);
    const allowInsecureBackendTls = applyProdTlsGuard(isProd, apiTarget, allowInsecureTls);

    return { port, isProd, apiTarget, allowInsecureBackendTls };
};

const isPathSegmentPrefix = (pathname: string, segment: string): boolean =>
{
    const p = String(pathname || "").toLowerCase();
    const s = String(segment || "").toLowerCase();
    const ok = p === s || p.startsWith(`${s}/`);
    return ok;
};

// 判斷是否要進 SSR（避免靜態資源/代理被 SSR 吃掉）
const shouldSSR = (req: Request): boolean =>
{
    // 宣告變數
    const accept = String(req.headers.accept || "");

    // 執行 function
    if (req.method !== "GET") return false;
    if (!accept.includes("text/html")) return false;
    if (isPathSegmentPrefix(req.path, "/Service")) return false;
    if (req.path.startsWith("/@vite")) return false;
    if (req.path.startsWith("/vite")) return false;
    if (req.path.startsWith("/tinymce")) return false;
    if (req.path.startsWith("/tinymce-i18n")) return false;
    if (req.path.startsWith("/.well-known/")) return false;
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return false; // 有副檔名 => 靜態資源

    // return
    return true;
};

// 讀取 TS 檔內的 css import，轉成 href 清單（dev 用）
const readCssImportHrefs = async (absTsFilePath: string, devPublicBase: string): Promise<string[]> =>
{
    // 宣告變數
    if (!existsSync(absTsFilePath)) return [];

    const text = await fs.readFile(absTsFilePath, "utf-8");
    const re = /^\s*import\s+["'](.+?)["'];\s*$/gm;
    const hrefs: string[] = [];

    // 執行 function
    for (const m of text.matchAll(re))
    {
        const p = String(m[1] || "");
        if (!p.endsWith(".css")) continue;
        const rel = p.replace(/^\.\//, "");
        hrefs.push(`${devPublicBase}/${rel}`.replace(/\/{2,}/g, "/"));
    }

    // return
    return hrefs;
};

/** 取得目前啟用的 SpecCode；空值代表純 Feature 模式。 */
const getActiveSpecCode = (): string =>
{
    return String(process.env.VITE_SPEC_CODE ?? "").trim();
};

/** 尋找 Spec 的 CSS loader，並相容既有兩種資料夾拼字。 */
const resolveSpecAssetLoaderFile = (specCode: string, fileName: string): SpecAssetLoaderFile | null =>
{
    if (!specCode) return null;

    const folders = ["SpecFetures", "SpecFeatures"];
    for (const folder of folders)
    {
        const filePath = path.resolve(process.cwd(), "src", folder, specCode, "Assets", fileName);
        if (existsSync(filePath)) return { filePath, publicBase: `/src/${folder}/${specCode}/Assets` };
    }

    return null;
};

const normalizeCssHref = (href: string): string =>
{
    // 宣告變數
    const h = String(href || "").trim();

    // 執行 function：只做最基本的正規化（同站資源為主）
    if (!h) return "";
    if (h.startsWith("http://") || h.startsWith("https://"))
    {
        try
        {
            return new URL(h).pathname + (new URL(h).search || "");
        } catch
        {
            return h;
        }
    }

    // return
    return h;
};

const getExistingCssHrefsInHead = (html: string): Set<string> =>
{
    // 宣告變數
    const out = new Set<string>();
    const headMatch = html.match(/<head\b[^>]*>([\s\S]*?)<\/head>/i);
    const scope = headMatch ? headMatch[1] : html;
    const linkRe = /<link\b[^>]*>/gi;

    // 執行 function
    for (const m of scope.matchAll(linkRe))
    {
        const tag = String(m[0] || "");
        const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
        const href = hrefMatch ? normalizeCssHref(hrefMatch[1]) : "";

        if (!href) continue;
        if (!href.toLowerCase().includes(".css")) continue;

        out.add(href);
    }

    // return
    return out;
};

const injectCssLinksToHead = (html: string, hrefs: string[]): string =>
{
    // 宣告變數
    const existing = getExistingCssHrefsInHead(html);
    const uniq = [...new Set(hrefs.map(normalizeCssHref))].filter((h) => h && !existing.has(h));
    const links = uniq.map((h) => `<link rel="stylesheet" href="${h}">`).join("");

    // 執行 function
    if (!links) return html;

    // return（用 i 避免 </head> 大小寫問題）
    return html.replace(/<\/head>/i, `${links}</head>`);
};

const tryReadViteManifest = async (clientRoot: string): Promise<ViteManifest | null> =>
{
    // 宣告變數
    const p = path.resolve(clientRoot, ".vite/manifest.json");

    // 執行 function
    if (!existsSync(p)) return null;
    const text = await fs.readFile(p, "utf-8");
    const json = JSON.parse(text) as ViteManifest;

    // return
    return json;
};

const addCssByManifestKey = (m: ViteManifest, key: string, seen: Set<string>, out: Set<string>) =>
{
    // 宣告變數
    if (seen.has(key)) return;
    seen.add(key);

    const entry = m[key];
    if (!entry) return;

    const file = entry.file;
    const fileStr = typeof file === "string" ? file : "";
    const isCssFile = fileStr.toLowerCase().endsWith(".css");

    // 執行 function
    // ✅ Vite 對「CSS-only chunk」會把 css 檔放在 entry.file（不是 entry.css）
    if (isCssFile)
    {
        out.add(`/${fileStr.replace(/^\/+/, "")}`);
    }

    for (const c of (entry.css ?? []))
    {
        out.add(`/${String(c).replace(/^\/+/, "")}`);
    }

    for (const k of (entry.imports ?? []))
    {
        addCssByManifestKey(m, k, seen, out);
    }
};

const findManifestEntryKeys = (m: ViteManifest): string[] =>
{
    const keys = Object.keys(m);
    const entries = keys.filter(k => (m[k] as ViteManifestEntry)?.isEntry);
    return entries;
};

const getProdCssHrefsFromManifest = (m: ViteManifest, spec: string, isServer: boolean): string[] =>
{
    // 宣告變數
    const keySet = new Set<string>();

    const addMany = (keys: string[]) =>
    {
        // 宣告變數
        for (const k of keys) keySet.add(k);

        // return
        return;
    };

    const addIfExists = (keys: string[]) =>
    {
        // 宣告變數
        for (const k of keys)
        {
            if (m[k]) keySet.add(k);
        }

        // return
        return;
    };

    // 執行 function
    // 1) 入口（index.html）一定要
    addMany(findManifestEntryKeys(m));

    // 2) ✅ 後台才需要 LoadFeaturesCss（前台不要吃這包，不然會跑版）
    if (isServer)
    {
        addIfExists(["src/Features/Assets/LoadFeaturesCss.ts"]);
    }

    // 3) Spec Css：Feature 模式略過；Spec 模式只抓目前 Case
    if (isServer && spec)
    {
        addIfExists([`src/SpecFetures/${spec}/Assets/LoadSpecCss_Server.ts`, `src/SpecFeatures/${spec}/Assets/LoadSpecCss_Server.ts`]);
    } else
    {
        addIfExists(["src/Features/Assets/LoadFeaturesCss_Client.ts"]);
        if (spec)
        {
            addIfExists([
                `src/SpecFetures/${spec}/Assets/LoadSpecCss.ts`,
                `src/SpecFeatures/${spec}/Assets/LoadSpecCss.ts`,
            ]);
        }
    }

    // 4) fallback：真的抓不到時才全掃（把 css-only chunk 也納入）
    if (keySet.size === 0)
    {
        const allCssKeys = Object.keys(m).filter((k) =>
        {
            const file = String(m[k]?.file ?? "").toLowerCase();
            const hasCssList = (m[k]?.css?.length ?? 0) > 0;
            const isCssOnly = file.endsWith(".css");
            return hasCssList || isCssOnly;
        });

        addMany(allCssKeys);
    }

    // 5) 遞迴展開 css/imports
    const out = new Set<string>();
    const seen = new Set<string>();
    for (const k of keySet) addCssByManifestKey(m, k, seen, out);

    // return
    return [...out];
};

// 讓 SSR_Render 回傳的東西統一成 payload
const toPayload = (result: any) =>
{
    const empty = { appHtml: "", headTags: "", initialState: undefined as any };
    if (!result) return empty;
    if (result.kind === "html") return result;
    if (result.kind === "response") return empty;
    return { appHtml: result.appHtml ?? "", headTags: result.headTags ?? "", initialState: result.initialState };
};

const removeStaticRouterHydrationScripts = (appHtml: string): string =>
{
    const re = /<script\b[^>]*>[\s\S]*?__staticRouterHydrationData[\s\S]*?<\/script>/gi;
    return appHtml.replace(re, "");
};

const escapeJsonForTemplate = (value: unknown): string =>
{
    return JSON.stringify(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\u2028/g, "\\u2028").replace(/\u2029/g, "\\u2029");
};

/** 建立 SSR 初始狀態 template，避免正式 CSP 需要 inline script。 */
const buildInitialStateTemplate = (initialState: unknown): string =>
{
    // 宣告變數
    if (!initialState) return "";

    // return
    return `<template id="wcms-initial-state">${escapeJsonForTemplate(initialState)}</template>`;
};

/** 移除 HTML 內既有 initial-state template，避免空 template 殘留。 */
const removeInitialStateTemplate = (html: string): string =>
{
    // return
    return html.replace(INITIAL_STATE_TEMPLATE_RE, "");
};

/** 把 initial-state template 注入 head，確保 Client entry 讀取前已存在。 */
const injectInitialStateToHead = (html: string, stateTemplate: string): string =>
{
    // 執行 function
    if (!stateTemplate) return html;

    if (html.includes(INITIAL_STATE_MARKER))
    {
        return html.replace(INITIAL_STATE_MARKER, stateTemplate);
    }

    if (/<\/head>/i.test(html))
    {
        return html.replace(/<\/head>/i, `${stateTemplate}</head>`);
    }

    // return
    return html.replace(/<\/body>/i, `${stateTemplate}</body>`);
};

/** 把 SSR 初始資料放進 template，避免正式 CSP 需要 inline script。 */
const injectInitialState = (html: string, initialState: unknown): string =>
{
    // 宣告變數
    const stateTemplate = buildInitialStateTemplate(initialState);
    const cleanHtml = removeInitialStateTemplate(html);

    // 執行 function
    return injectInitialStateToHead(cleanHtml, stateTemplate);
};

// 優先用 <!--app-html-->，沒有就塞進 <div id="root"></div>
const injectAppHtmlToRoot = (html: string, appHtml: string): string =>
{
    // 宣告變數
    const marker = "<!--app-html-->";
    const rootEmptyRe = /<div\s+id=["']root["']\s*>\s*<\/div>/i;

    // 執行 function
    if (html.includes(marker))
    {
        return html.replace(marker, appHtml);
    }

    if (rootEmptyRe.test(html))
    {
        return html.replace(rootEmptyRe, `<div id="root">${appHtml}</div>`);
    }

    // return（真的找不到就不動）
    return html;
};

/** 將 CSP nonce 僅加入靜態 Template 既有 script，避免授權 SSR / CMS 後續注入內容。 */
const injectCspNonceToTemplateScripts = (html: string, nonce: string): string =>
{
    const normalizedNonce = String(nonce || "").trim();
    if (!normalizedNonce) throw new Error("[WCMS] SSR CSP nonce 不可為空。");

    return html.replace(/<script\b(?![^>]*\bnonce=)([^>]*)>/gi, `<script nonce="${normalizedNonce}"$1>`);
};

// 組 SSR HTML（dev/prod 共用）
const buildHtml = (template: string, payload: { appHtml: string; headTags?: string; initialState?: unknown; }, nonce: string, isProd: boolean): string =>
{
    let html = isProd ? injectCspNonceToTemplateScripts(template, nonce) : template;
    const cleanHtml = removeStaticRouterHydrationScripts(payload.appHtml ?? "");
    html = html.replace("<!--app-head-->", payload.headTags ?? "");
    html = injectAppHtmlToRoot(html, cleanHtml);
    html = injectInitialState(html, payload.initialState);
    return html;
};

// SSR Render（dev/prod 共用呼叫 Entry-Server）
const renderByEntry = async (SSR_Render: (url: string, headers?: Record<string, string>) => Promise<any>, req: Request) =>
{
    // 宣告變數
    const url = req.originalUrl || req.url || "/";
    const headers: Record<string, string> = { "accept-language": String(req.headers["accept-language"] || ""), cookie: String(req.headers.cookie || "") };

    // 執行 function
    const result = await SSR_Render(url, headers);

    // return
    return result;
};

// Dev SSR：Vite middleware + transformIndexHtml + ssrLoadModule
const setupDevSSR = async (app: express.Express, cfg: SsrConfig) =>
{
    // 宣告變數
    const vite = await (await import("vite")).createServer({ server: { middlewareMode: true }, appType: "custom" });

    // 執行 function
    app.use(vite.middlewares);

    // public 靜態（確保 tinymce 等不被 SSR 攔到）
    app.use(serveStatic(path.resolve(process.cwd(), "public"), { index: false, maxAge: 0, fallthrough: true }));

    // SSR middleware
    app.use(async (req: Request, res: Response, next: NextFunction) =>
    {
        // 宣告變數
        const nonce = getResponseNonce(res);

        // 執行 function
        if (!shouldSSR(req)) return next();
        setHtmlSecurityHeaders(req, res, cfg, nonce);

        try
        {
            // ✅ SSR 打 API 用後端 origin（避免打到自己 5174）
            process.env.SSR_API_ORIGIN = cfg.apiTarget;

            const url = req.originalUrl || req.url || "/";
            let template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
            template = await vite.transformIndexHtml(url, template);

            // 宣告變數
            const specCode = getActiveSpecCode();
            const isServer = String(req.path || "").toLowerCase().startsWith("/server");

            // 執行 function
            if (isServer)
            {
                const featuresCssTs = path.resolve(process.cwd(), "src/Features/Assets/LoadFeaturesCss.ts");
                const specCssFile = resolveSpecAssetLoaderFile(specCode, "LoadSpecCss_Server.ts");
                const featureHrefs = await readCssImportHrefs(featuresCssTs, "/src/Features/Assets");
                const specHrefs = specCssFile
                    ? await readCssImportHrefs(specCssFile.filePath, specCssFile.publicBase)
                    : [];

                template = injectCssLinksToHead(template, [...featureHrefs, ...specHrefs]);
            } else
            {
                const featuresCssTs = path.resolve(process.cwd(), "src/Features/Assets/LoadFeaturesCss_Client.ts");
                const specCssFile = resolveSpecAssetLoaderFile(specCode, "LoadSpecCss.ts");
                const featureHrefs = await readCssImportHrefs(featuresCssTs, "/src/Features/Assets");
                const specHrefs = specCssFile
                    ? await readCssImportHrefs(specCssFile.filePath, specCssFile.publicBase)
                    : [];

                template = injectCssLinksToHead(template, [...featureHrefs, ...specHrefs]);
            }

            const mod = await vite.ssrLoadModule("/src/SSR/Entry-Server.tsx");
            const SSR_Render = (mod as any).SSR_Render as ((u: string, h?: Record<string, string>) => Promise<any>);

            const result = await renderByEntry(SSR_Render, req);
            if (trySendResponseResult(res, result)) return;

            const payload = toPayload(result);
            const html = buildHtml(template, payload, nonce, false);

            // ✅ dev 先不要送 CSP（不然 /@vite/client 沒 nonce 會被擋）
            res.status(200).set("Content-Type", "text/html").end(html);
        } catch (e)
        {
            vite.ssrFixStacktrace?.(e as Error);
            next(e);
        }
    });
};

// Prod SSR：dist/client 靜態 + dist/server/entry-server.js
const setupProdSSR = async (app: express.Express, cfg: SsrConfig) =>
{
    const { clientRoot, serverEntry, indexPath } = getProdPaths();
    const manifestPromise = tryReadViteManifest(clientRoot);
    app.use(serveStatic(clientRoot, { index: false, maxAge: "1y", immutable: true, fallthrough: true }));
    app.use(async (req: Request, res: Response, next: NextFunction) =>
    {
        const nonce = getResponseNonce(res);
        if (!shouldSSR(req)) return next();
        try
        {
            process.env.SSR_API_ORIGIN = cfg.apiTarget;
            const entry = await import(serverEntry);
            const SSR_Render = (entry as any).SSR_Render ?? (entry as any).render;
            if (!SSR_Render)
            {
                res.status(500).send("SSR bundle has no SSR_Render/render export");
                return;
            }
            const result = await renderByEntry(SSR_Render, req);
            if (trySendResponseResult(res, result)) return;
            const payload = toPayload(result);
            let template = await fs.readFile(indexPath, "utf-8");
            const spec = getActiveSpecCode();
            const isServer = String(req.path || "").toLowerCase().startsWith("/server");
            const manifest = await manifestPromise;
            if (manifest)
            {
                const hrefs = getProdCssHrefsFromManifest(manifest, spec, isServer);
                template = injectCssLinksToHead(template, hrefs);
            } else
            {
                console.warn("[SSR][prod] manifest.json not found. (vite build 需要開 manifest:true)");
            }
            const html = buildHtml(template, payload, nonce, true);
            setNoStoreHeaders(res);
            setHtmlSecurityHeaders(req, res, cfg, nonce);
            res.status(200).set("Content-Type", "text/html").end(html);
        } catch (e)
        {
            next(e);
        }
    });
};

// API Proxy：/Service -> cfg.apiTarget（後端）
const setupApiProxy = (app: express.Express, cfg: SsrConfig) =>
{
    const isHttpsTarget = cfg.apiTarget.startsWith("https://");
    const options = {
        target: cfg.apiTarget,
        changeOrigin: true,
        ...(isHttpsTarget ? { secure: !cfg.allowInsecureBackendTls, agent: new https.Agent({ rejectUnauthorized: !cfg.allowInsecureBackendTls }) } : {}),
        logLevel: "warn",
        pathRewrite: (p: string) => `/Service${p}`,
        onProxyRes: (proxyRes: ProxyResponseLike) =>
        {
            setProxySecurityHeaders(proxyRes, cfg);
        },
    } as const;
    app.use("/Service", createProxyMiddleware(options));
};

// 啟動
const start = async () =>
{
    // 宣告變數
    const cfg = getConfig();
    const app = express();

    // 執行 function
    setupSecurityHeaders(app, cfg);
    app.use(compression());
    setupApiProxy(app, cfg);

    if (cfg.isProd)
    {
        await setupProdSSR(app, cfg);
    } else
    {
        await setupDevSSR(app, cfg);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) =>
    {
        console.error("[SSR] Error:", err);
        res.status(500).send("SSR Render Error");
    });

    app.listen(cfg.port, () =>
    {
        if (!cfg.isProd)
        {
            console.log(`[SSR] server started at http://127.0.0.1:${cfg.port}`);
            console.log(`[SSR] SSR_API_TARGET: ${cfg.apiTarget}`);
        }
    });
};

start();
// #endregion
