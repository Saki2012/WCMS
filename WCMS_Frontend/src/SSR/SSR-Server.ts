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
import { buildProdCsp } from "./CSPSetting";

type SsrConfig = Readonly<{
    port: number;
    isProd: boolean;
    apiTarget: string; // 後端 origin，例如 https://localhost:7030
}>;

type ProdPaths = Readonly<{ clientRoot: string; serverEntry: string; indexPath: string; }>;
type HeaderValue = string | number | readonly string[];
type HeadersMap = Record<string, HeaderValue>;
type ProxyHeaderMap = Record<string, string | string[] | undefined>;
type ProxyResponseLike = { headers: ProxyHeaderMap; };

const noStoreHeaderValue = "no-store, no-cache, must-revalidate, proxy-revalidate";

/** 設定 HTML/API 不落地快取，避免 SSL 頁面被弱掃判定可快取。 */
const setNoStoreHeaders = (res: Response): void =>
{
    res.setHeader("Cache-Control", noStoreHeaderValue);
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
};

/** 移除由 Node/Proxy 可控制的技術洩漏標頭。 */
const stripDisclosureHeaders = (res: Response): void =>
{
    res.removeHeader("X-Powered-By");
    res.removeHeader("Server");
};

/** 取得同一個 response 生命週期共用的 CSP nonce。 */
const getResponseNonce = (res: Response): string =>
{
    const current = res.locals.cspNonce;
    if (typeof current === "string" && current.trim()) return current;

    const nonce = crypto.randomUUID();
    res.locals.cspNonce = nonce;
    return nonce;
};

/** 設定 SSR 與靜態資源共用的安全標頭。 */
const setCommonSecurityHeaders = (res: Response, cfg: SsrConfig, nonce: string): void =>
{
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "SAMEORIGIN");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=(), fullscreen=(self)");
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");

    if (cfg.isProd)
    {
        const enforceTrustedTypes = String(process.env.SSR_ENFORCE_TRUSTED_TYPES || "").toLowerCase() === "true";
        res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
        res.setHeader("Content-Security-Policy", buildProdCsp(nonce, { enforceTrustedTypes }));
    }

    stripDisclosureHeaders(res);
};

/** 讓所有 SSR/靜態/API proxy 回應先帶基礎安全標頭。 */
const setupSecurityHeaders = (app: express.Express, cfg: SsrConfig): void =>
{
    app.disable("x-powered-by");
    app.set("trust proxy", true);

    app.use((_req: Request, res: Response, next: NextFunction) =>
    {
        const nonce = getResponseNonce(res);
        setCommonSecurityHeaders(res, cfg, nonce);
        next();
    });
};

/** 清掉後端 Proxy 轉回來的技術洩漏標頭，並讓 API 不快取。 */
const setProxySecurityHeaders = (proxyRes: ProxyResponseLike): void =>
{
    delete proxyRes.headers["x-powered-by"];
    delete proxyRes.headers["X-Powered-By"];
    delete proxyRes.headers["server"];
    delete proxyRes.headers["Server"];

    proxyRes.headers["cache-control"] = noStoreHeaderValue;
    proxyRes.headers["pragma"] = "no-cache";
    proxyRes.headers["expires"] = "0";
    proxyRes.headers["content-security-policy"] = "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";
};

const isRecord = (v: unknown): v is Record<string, unknown> =>
{
    // 宣告變數
    const ok = typeof v === "object" && v !== null && !Array.isArray(v);

    // return
    return ok;
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
    if (!isRecord(raw)) return out;

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
    if (!isRecord(result)) return false;
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

const applyProdTlsGuard = (isProd: boolean, apiTarget: string, allowInsecureTls: boolean): void =>
{
    // 宣告變數
    if (!isProd)
    {
        // return：dev 不動（避免影響你本機開發）
        return;
    }

    const u = tryParseUrl(apiTarget);
    const host = u?.hostname ?? "";
    const protocol = u?.protocol ?? "";
    const isHttps = protocol === "https:";
    const isLocalhost = host === "localhost" || host === "127.0.0.1" || host === "::1";

    // 執行 function
    // ✅ 只有「prod + allow + https + localhost」才允許關驗證
    if (allowInsecureTls && isHttps && isLocalhost)
    {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
        console.warn(`[SSR] Insecure TLS allowed ONLY for localhost: ${apiTarget}`);
        return;
    }

    // ✅ 其他全部強制驗證（避免外溢到任何外部 HTTPS）
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "1";

    if (allowInsecureTls && (!isLocalhost || !isHttps))
    {
        console.warn(`[SSR] SSR_ALLOW_INSECURE_TLS ignored (not https localhost). apiTarget=${apiTarget}`);
    }

    // return
    return;
};
// 讀 env 並整理成 config
const getConfig = (): SsrConfig =>
{
    // 宣告變數：判斷是否在 dist runtime（同層有 CSR/SSR）
    const cwd = process.cwd();
    const isDistRuntime = existsSync(path.resolve(cwd, "CSR")) && existsSync(path.resolve(cwd, "SSR"));

    // 執行 function：只在 dist runtime 下，若沒有 .env 但有 .env.production，就補讀它
    if (isDistRuntime)
    {
        const hasDotEnv = existsSync(path.resolve(cwd, ".env"));
        const prodEnvPath = path.resolve(cwd, ".env.production");

        if (!hasDotEnv && existsSync(prodEnvPath))
        {
            dotenvConfig({ path: prodEnvPath });
        }
    }

    // 宣告變數：isProd 除了 NODE_ENV=production，也允許 dist runtime 自動視為 prod
    const nodeEnv = String(process.env.NODE_ENV || "development");
    const isProd = nodeEnv === "production" || isDistRuntime;

    const port = Number(process.env.SSR_PORT || process.env.PORT || 5174);
    const apiTarget = String(process.env.SSR_API_TARGET || "https://localhost:7030").replace(/\/+$/, "");

    // 是否允許在 prod 放行自簽（建議只給 localhost 用）
    const allowInsecureTls = String(process.env.SSR_ALLOW_INSECURE_TLS || "").toLowerCase() === "true";
    applyProdTlsGuard(isProd, apiTarget, allowInsecureTls);

    // 執行 function：解析 hostname，避免不小心放行到外部
    const apiHost = (() =>
    {
        try
        {
            return new URL(apiTarget).hostname;
        } catch
        {
            return "";
        }
    })();

    const isLocalhost = apiHost === "localhost" || apiHost === "127.0.0.1" || apiHost === "::1";
    if (!isProd || (allowInsecureTls && isLocalhost)) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

    // return
    return { port, isProd, apiTarget };
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
    const text = await fs.readFile(absTsFilePath, "utf-8");
    const re = /^\s*import\s+["'](.+?)["'];\s*$/gm;
    const hrefs: string[] = [];

    // 執行 function
    for (const m of text.matchAll(re))
    {
        const p = String(m[1] || "");
        if (!p.endsWith(".css")) continue;
        const rel = p.replace(/^\.\//, ""); // "./Client/xx.css" -> "Client/xx.css"
        hrefs.push(`${devPublicBase}/${rel}`.replace(/\/{2,}/g, "/"));
    }

    // return
    return hrefs;
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

type ViteManifestEntry = Readonly<{ file: string; css?: string[]; imports?: string[]; isEntry?: boolean; }>;
type ViteManifest = Record<string, ViteManifestEntry>;

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

    // 3) ✅ Spec Css：用「精準 key」避免把整個 spec 資產都掃進來
    if (isServer)
    {
        addIfExists([`src/SpecFetures/${spec}/Assets/LoadSpecCss_Server.ts`, `src/SpecFeatures/${spec}/Assets/LoadSpecCss_Server.ts`]);
    } else
    {
        // addIfExists([`src/SpecFetures/${spec}/Assets/LoadSpecCss.ts`, `src/SpecFeatures/${spec}/Assets/LoadSpecCss.ts`]);
        addIfExists([
            `src/Features/Assets/LoadFeaturesCss_Client.ts`,
            `src/SpecFetures/${spec}/Assets/LoadSpecCss.ts`,
            `src/SpecFeatures/${spec}/Assets/LoadSpecCss.ts`,
        ]);
        // cara
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

const extractStaticRouterHydrationScripts = (appHtml: string): { cleanHtml: string; scriptsHtml: string; } =>
{
    // 宣告變數
    const re = /<script\b[^>]*>[\s\S]*?__staticRouterHydrationData[\s\S]*?<\/script>/gi;
    const scripts = (appHtml.match(re) ?? []).join("");

    // 執行 function
    const clean = appHtml.replace(re, "");

    // return
    return { cleanHtml: clean, scriptsHtml: scripts };
};

// 把 initial state 注入到模板
const injectInitialState = (html: string, initialState: unknown, nonce: string, extraScriptsHtml: string): string =>
{
    // 宣告變數
    const stateScript = initialState
        ? `<script nonce="${nonce}">window.__INITIAL_STATE__=${JSON.stringify(initialState).replace(/</g, "\\u003c")};</script>`
        : "";

    // 執行 function
    const out = html.replace("<!--initial-state-->", `${stateScript}${extraScriptsHtml}`);

    // return
    return out;
};

// Prod：把模板裡所有 <script ...> 都補上 nonce（避免 CSP 擋住）
const addNonceToAllScripts = (html: string, nonce: string): string =>
{
    // 宣告變數
    const re = /<script\b(?![^>]*\bnonce=)([^>]*)>/gi;

    // 執行 function
    const out = html.replace(re, `<script nonce="${nonce}"$1>`);

    // return
    return out;
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

/** 提供 Vite runtime 動態載入資源時可讀取的 CSP nonce。 */
const injectCspNonceMeta = (html: string, nonce: string): string =>
{
    const meta = `<meta property="csp-nonce" nonce="${nonce}">`;
    if (/<meta\b[^>]*property=["']csp-nonce["'][^>]*>/i.test(html)) return html.replace(/<meta\b[^>]*property=["']csp-nonce["'][^>]*>/i, meta);
    return html.replace(/<\/head>/i, `${meta}</head>`);
};

// 組 SSR HTML（dev/prod 共用）
const buildHtml = (template: string, payload: { appHtml: string; headTags?: string; initialState?: unknown; }, nonce: string, isProd: boolean): string =>
{
    // 宣告變數
    let html = template;

    // 執行 function
    const { cleanHtml, scriptsHtml } = extractStaticRouterHydrationScripts(payload.appHtml ?? "");
    html = html.replace("<!--app-head-->", payload.headTags ?? "");
    html = injectAppHtmlToRoot(html, cleanHtml);
    html = injectInitialState(html, payload.initialState, nonce, scriptsHtml);

    // prod 才需要 nonce + CSP（dev 先不要擋 vite scripts）
    if (isProd)
    {
        html = injectCspNonceMeta(html, nonce);
        html = addNonceToAllScripts(html, nonce);
    }

    // return
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
        const nonce = crypto.randomUUID();

        // 執行 function
        if (!shouldSSR(req)) return next();

        try
        {
            // ✅ SSR 打 API 用後端 origin（避免打到自己 5174）
            process.env.SSR_API_ORIGIN = cfg.apiTarget;

            const url = req.originalUrl || req.url || "/";
            let template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
            template = await vite.transformIndexHtml(url, template);

            // 宣告變數
            const spec = String(process.env.VITE_SPEC_CODE);
            const isServer = String(req.path || "").toLowerCase().startsWith("/server");

            // 執行 function
            if (isServer)
            {
                // 後台：Features + Spec(Server)
                const featuresCssTs = path.resolve(process.cwd(), "src/Features/Assets/LoadFeaturesCss.ts");
                const specServerCssTs = path.resolve(process.cwd(), `src/SpecFetures/${spec}/Assets/LoadSpecCss_Server.ts`);

                const fHrefs = await readCssImportHrefs(featuresCssTs, "/src/Features/Assets");
                const sHrefs = await readCssImportHrefs(specServerCssTs, `/src/SpecFetures/${spec}/Assets`);

                template = injectCssLinksToHead(template, [...fHrefs, ...sHrefs]);
            } else
            {
                // 前台：Spec(Client)
                const featuresClientCssTs = path.resolve(process.cwd(), "src/Features/Assets/LoadFeaturesCss_Client.ts");
                const specCssTs = path.resolve(process.cwd(), `src/SpecFetures/${spec}/Assets/LoadSpecCss.ts`);
                const Fhrefs = await readCssImportHrefs(featuresClientCssTs, "/src/Features/Assets");
                const Shrefs = await readCssImportHrefs(specCssTs, `/src/SpecFetures/${spec}/Assets`);

                template = injectCssLinksToHead(template, [...Fhrefs, ...Shrefs]);
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
            const spec = String(process.env.VITE_SPEC_CODE || "_default");
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
            setCommonSecurityHeaders(res, cfg, nonce);
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
    // 宣告變數
    const isHttpsTarget = cfg.apiTarget.startsWith("https://");

    const options = {
        target: cfg.apiTarget,
        changeOrigin: true,

        // ✅ 只有 https target 才需要 secure/agent；http target 不要塞 https.Agent
        ...(isHttpsTarget
            ? {
                secure: false, // 自簽憑證時才需要；正式有效憑證可改 true
                agent: new https.Agent({ rejectUnauthorized: false }),
            }
            : {}),

        logLevel: "warn",

        // ✅ 因為 app.use("/Service", ...) 會把 /Service 剝掉，所以要加回去
        pathRewrite: (p: string) => `/Service${p}`,

        onProxyReq: (_proxyReq: any, req: Request) =>
        {
            // 簡短 log：確認實際送出去的 path（方便你驗證）
            console.log(`[SSR][proxy-hit] ${req.method} ${req.originalUrl} -> ${cfg.apiTarget}`);
        },

        onProxyRes: (proxyRes: ProxyResponseLike) =>
        {
            setProxySecurityHeaders(proxyRes);
        },
    } as const;

    // 執行 function
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
        console.log(`[SSR] server started at http://127.0.0.1:${cfg.port}`);
        console.log(`[SSR] SSR_API_TARGET: ${cfg.apiTarget}`);
    });
};

start();
