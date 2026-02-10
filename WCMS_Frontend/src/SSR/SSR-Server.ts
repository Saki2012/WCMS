// src/SSR/SSR-Server.ts
// SSR Server for Vite (dev middleware) + Express (prod static) + API proxy
import "dotenv/config";
import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import crypto from "node:crypto";
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import serveStatic from "serve-static";

type SsrConfig = Readonly<{
    port: number;
    isProd: boolean;
    apiTarget: string; // 後端 origin，例如 https://localhost:7030
}>;

// 讀 env 並整理成 config
const getConfig = (): SsrConfig =>
{
    const nodeEnv = String(process.env.NODE_ENV || "development");
    const isProd = nodeEnv === "production";
    const port = Number(process.env.SSR_PORT || process.env.PORT || 5174);
    const apiTarget = String(process.env.SSR_API_TARGET || "https://localhost:7030").replace(/\/+$/, "");
    // dev 自簽憑證避免 axios/https 失敗（僅 dev）
    if (!isProd) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    return { port, isProd, apiTarget };
};

// 判斷是否要進 SSR（避免靜態資源/代理被 SSR 吃掉）
const shouldSSR = (req: Request): boolean =>
{
    // 宣告變數
    const accept = String(req.headers.accept || "");

    // 執行 function
    if (req.method !== "GET") return false;
    if (!accept.includes("text/html")) return false;
    if (req.path.startsWith("/Service")) return false;
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

const injectCssLinksToHead = (html: string, hrefs: string[]): string =>
{
    // 宣告變數
    const links = hrefs
        .map(h => `<link rel="stylesheet" href="${h}">`)
        .join("");

    // 執行 function
    if (!links) return html;
    const out = html.replace("</head>", `${links}</head>`);

    // return
    return out;
};

// 讓 SSR_Render 回傳的東西統一成 payload
const toPayload = (result: any) =>
{
    // 宣告變數
    const empty = { appHtml: "", headTags: "", initialState: undefined as any };

    // 執行 function
    if (!result) return empty;
    if (result.kind === "html") return result;
    return {
        appHtml: result.appHtml ?? "",
        headTags: result.headTags ?? "",
        initialState: result.initialState,
    };
};

// 把 initial state 注入到模板
const injectInitialState = (html: string, initialState: unknown, nonce: string): string =>
{
    // 宣告變數
    const stateScript = initialState
        ? `<script nonce="${nonce}">window.__INITIAL_STATE__=${
            JSON.stringify(initialState).replace(/</g, "\\u003c")
        };</script>`
        : "";

    // 執行 function
    const out = html.replace("<!--initial-state-->", stateScript);

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

// 組 SSR HTML（dev/prod 共用）
const buildHtml = (
    template: string,
    payload: { appHtml: string; headTags?: string; initialState?: unknown; },
    nonce: string,
    isProd: boolean,
): string =>
{
    // 宣告變數
    let html = template;

    // 執行 function
    html = html.replace("<!--app-head-->", payload.headTags ?? "");
    html = html.replace("<!--app-html-->", payload.appHtml ?? "");
    html = injectInitialState(html, payload.initialState, nonce);

    // prod 才需要 nonce + CSP（dev 先不要擋 vite scripts）
    if (isProd)
    {
        html = addNonceToAllScripts(html, nonce);
    }

    // return
    return html;
};

// SSR Render（dev/prod 共用呼叫 Entry-Server）
const renderByEntry = async (
    SSR_Render: (url: string, headers?: Record<string, string>) => Promise<any>,
    req: Request,
) =>
{
    // 宣告變數
    const url = req.originalUrl || req.url || "/";
    const headers: Record<string, string> = {
        "accept-language": String(req.headers["accept-language"] || ""),
        cookie: String(req.headers.cookie || ""),
    };

    // 執行 function
    const result = await SSR_Render(url, headers);

    // return
    return result;
};

// Dev SSR：Vite middleware + transformIndexHtml + ssrLoadModule
const setupDevSSR = async (app: express.Express, cfg: SsrConfig) =>
{
    // 宣告變數
    const vite = await (await import("vite")).createServer({
        server: { middlewareMode: true },
        appType: "custom",
    });

    // 執行 function
    app.use(vite.middlewares);

    // public 靜態（確保 tinymce 等不被 SSR 攔到）
    app.use(
        serveStatic(path.resolve(process.cwd(), "public"), {
            index: false,
            maxAge: 0,
            fallthrough: true,
        }),
    );

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
            const spec = String(process.env.VITE_SPEC_CODE || "1819");
            const isServer = String(req.path || "").toLowerCase().startsWith("/server");

            // 執行 function
            if (isServer)
            {
                // 後台：Features + Spec(Server)
                const featuresCssTs = path.resolve(process.cwd(), "src/Features/Assets/LoadFeaturesCss.ts");
                const specServerCssTs = path.resolve(
                    process.cwd(),
                    `src/SpecFetures/${spec}/Assets/LoadSpecCss_Server.ts`,
                );

                const fHrefs = await readCssImportHrefs(featuresCssTs, "/src/Features/Assets");
                const sHrefs = await readCssImportHrefs(specServerCssTs, `/src/SpecFetures/${spec}/Assets`);

                template = injectCssLinksToHead(template, [...fHrefs, ...sHrefs]);
            } else
            {
                // 前台：Spec(Client)
                const specCssTs = path.resolve(process.cwd(), `src/SpecFetures/${spec}/Assets/LoadSpecCss.ts`);
                const hrefs = await readCssImportHrefs(specCssTs, `/src/SpecFetures/${spec}/Assets`);

                template = injectCssLinksToHead(template, hrefs);
            }
            const mod = await vite.ssrLoadModule("/src/SSR/Entry-Server.tsx");
            const SSR_Render = (mod as any).SSR_Render as ((u: string, h?: Record<string, string>) => Promise<any>);

            const result = await renderByEntry(SSR_Render, req);

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
    // 宣告變數
    const __dirname = path.dirname(fileURLToPath(import.meta.url));
    const clientRoot = path.resolve(__dirname, "../../dist/client");
    const serverEntryPath = "../../dist/server/entry-server.js";
    const indexPath = path.resolve(clientRoot, "index.html");

    // 執行 function
    app.use(
        serveStatic(clientRoot, {
            index: false,
            maxAge: "1y",
            immutable: true,
            fallthrough: true,
        }),
    );

    app.use(async (req: Request, res: Response, next: NextFunction) =>
    {
        // 宣告變數
        const nonce = crypto.randomUUID();

        // 執行 function
        if (!shouldSSR(req)) return next();

        try
        {
            process.env.SSR_API_ORIGIN = cfg.apiTarget;

            const entry = await import(serverEntryPath);
            const SSR_Render = (entry as any).SSR_Render ?? (entry as any).render;

            if (!SSR_Render)
            {
                res.status(500).send("SSR bundle has no SSR_Render/render export");
                return;
            }

            const result = await renderByEntry(SSR_Render, req);
            const payload = toPayload(result);

            const template = await fs.readFile(indexPath, "utf-8");
            const html = buildHtml(template, payload, nonce, true);

            // CSP（prod 才啟用）
            res.status(200)
                .set("Content-Type", "text/html")
                .set("Content-Security-Policy", `script-src 'self' 'nonce-${nonce}'`)
                .end(html);
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
    const options = {
        target: cfg.apiTarget,
        changeOrigin: true,
        secure: false, // dev 自簽（prod 可改 true）
        agent: new https.Agent({ rejectUnauthorized: false }),
        logLevel: "warn",
        // ✅ 因為 app.use("/Service", ...) 會把 /Service 剝掉，所以要加回去
        pathRewrite: (path: string) => `/Service${path}`,
        onProxyReq: (_proxyReq: any, req: Request) =>
        {
            // 簡短 log：確認實際送出去的 path（方便你驗證）
            console.log(`[SSR][proxy-hit] ${req.method} ${req.originalUrl}`);
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
