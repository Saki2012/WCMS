// ---- SSR-Server.ts（只用 const；Dev/Prod 各自包成一個 const） ----
import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware"; // 需要就打開
import fs from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";
import serveStatic from "serve-static";

// 基本參數
const PORT = Number(import.meta.env.PORT ?? 5174);
const isProd = import.meta.env.NODE_ENV === "production";
if (!isProd) process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
// 需排除進 SSR 的固定前綴（你的 public 內資料夾）
const STATIC_PREFIXES = ["/tinymce", "/tinymce-i18n", "/.well-known/", "/@vite", "/vite"] as const;

// 判斷「這個請求是否該進 SSR」
const shouldSSR = (req: Request): boolean =>
{
    if (req.method !== "GET") return false;
    if (/\.[a-zA-Z0-9]+$/.test(req.path)) return false; // 有副檔名 => 靜態資源
    if (STATIC_PREFIXES.some((p) => req.path.startsWith(p))) return false; // 固定前綴 => 靜態/其他中介
    const accept = String(req.headers.accept || "");
    if (!accept.includes("text/html")) return false; // 只處理要 HTML 的請求
    return true;
};

// 把 SSR_Render 的結果統一成可注入模板的 payload
const toPayload = (result: any) =>
{
    if (!result) return { appHtml: "", headTags: "", initialState: undefined };
    if (result.kind === "html") return result;
    return {
        appHtml: result.appHtml ?? "",
        headTags: result.headTags ?? "",
        initialState: result.initialState,
    };
};

// Dev：Vite 中介 + public 靜態 + SSR（transformIndexHtml + ssrLoadModule）
const setupDevSSR = async (app: express.Express) =>
{
    const vite = await (await import("vite")).createServer({
        server: { middlewareMode: true },
        appType: "custom",
    });
    app.use(vite.middlewares);

    // public/ 靜態（確保 /Legacy、/tinymce… 不被 SSR 攔到）
    app.use(
        serveStatic(path.resolve(process.cwd(), "public"), {
            index: false,
            maxAge: 0,
            fallthrough: true,
        }),
    );

    // SSR catch-all（只有 shouldSSR 才進來）
    const devSSRMiddleware = async (req: Request, res: Response, next: NextFunction) =>
    {
        if (!shouldSSR(req)) return next();
        try
        {
            const url = req.originalUrl || req.url || "/";

            // 讀模板並讓 Vite 注入 HMR/資產
            let template = await fs.readFile(path.resolve(process.cwd(), "index.html"), "utf-8");
            template = await vite.transformIndexHtml(url, template);

            // 載入 server entry 並執行
            const mod = await vite.ssrLoadModule("/src/SSR/Entry-Server.tsx");
            const { SSR_Render } = mod as { SSR_Render: (u: string, h?: Record<string, string>) => Promise<any>; };

            const result = await SSR_Render(url, {
                "accept-language": String(req.headers["accept-language"] || ""),
                cookie: String(req.headers.cookie || ""),
            });

            // 處理 loader redirect / error（React Router 會回 Response）
            if (result?.kind === "response" || result instanceof Response)
            {
                const r: Response | globalThis.Response = result.response ?? result;
                const status = r.status as number;
                if (status >= 300 && status < 400)
                {
                    const loc = r.headers.get("Location") || "/";
                    return res.redirect(status, loc);
                }
                const body = await (r as any).text?.().catch(() => "")!;
                return res.status((r as any).status || 500).send(body || "SSR Error");
            }

            const { appHtml, headTags, initialState } = toPayload(result);

            const nonce = crypto.randomUUID().toString();
            const html = template
                .replace("<!--app-head-->", headTags ?? "")
                .replace("<!--app-html-->", appHtml ?? "")
                .replace(
                    "<!--initial-state-->",
                    initialState
                        ? `<script nonce="${nonce}>window.__INITIAL_STATE__=${
                            JSON.stringify(initialState).replace(/</g, "\\u003c")
                        }</script>`
                        : "",
                );

            res.status(200).set("Content-Type", "text/html").set(
                "Content-Security-Policy",
                `script-src 'self' 'nonce-${nonce}'`,
            ).end(html);
        } catch (e)
        {
            vite.ssrFixStacktrace?.(e as Error);
            next(e);
        }
    };

    app.use(devSSRMiddleware);
};

// Prod：整個 dist/client 做靜態根 + SSR（讀 dist/client/index.html + 伺服端 bundle）
const setupProdSSR = async (app: express.Express) =>
{
    const __dirname = path.dirname(fileURLToPath(import.meta.url));

    // dist/client（含 public 複製過來的內容）整個當靜態根
    app.use(
        serveStatic(path.resolve(__dirname, "../../dist/client"), {
            index: false,
            maxAge: "1y",
            immutable: true,
            fallthrough: true,
        }),
    );

    // 你若已經另外掛 /assets 也無妨；這裡保留可更細緻快取
    app.use(
        "/assets",
        serveStatic(path.resolve(__dirname, "../../dist/client/assets"), {
            index: false,
            maxAge: "1y",
            immutable: true,
            fallthrough: true,
        }),
    );

    // SSR catch-all（只有 shouldSSR 才進來）
    const prodSSRMiddleware = async (req: Request, res: Response, next: NextFunction) =>
    {
        if (!shouldSSR(req)) return next();
        try
        {
            const url = req.originalUrl || req.url || "/";

            // 載入 server bundle（若你的匯出名稱不同，改這行）
            const entry = await import("../../dist/server/entry-server.js").catch(() => ({} as any));
            const SSR_Render = (entry as any).SSR_Render ?? (entry as any).render ?? null;

            if (!SSR_Render)
            {
                return res.status(500).send("SSR bundle not found or has no export SSR_Render/render");
            }

            const result = await SSR_Render(url, {
                "accept-language": String(req.headers["accept-language"] || ""),
                cookie: String(req.headers.cookie || ""),
            });

            // 處理 loader redirect / error
            if (result?.kind === "response" || result instanceof Response)
            {
                const r: Response | globalThis.Response = result.response ?? result;
                const status = r.status as number;
                if (status >= 300 && status < 400)
                {
                    const loc = r.headers.get("Location") || "/";
                    return res.redirect(status, loc);
                }
                const body = await (r as any).text?.().catch(() => "")!;
                return res.status((r as any).status || 500).send(body || "SSR Error");
            }

            // 讀 dist 的 index.html 當模板
            const templatePath = path.resolve(__dirname, "../../dist/client/index.html");
            let template = await fs.readFile(templatePath, "utf-8");

            const { appHtml, headTags, initialState } = toPayload(result);
            const nonce = crypto.randomUUID().toString();
            const html = template
                .replace("<!--app-head-->", headTags ?? "")
                .replace("<!--app-html-->", appHtml ?? "")
                .replace(
                    "<!--initial-state-->",
                    initialState
                        ? `<script  nonce="${nonce}>window.__INITIAL_STATE__=${
                            JSON.stringify(initialState).replace(/</g, "\\u003c")
                        }</script>`
                        : "",
                );

            res.status(200).set("Content-Type", "text/html").set(
                "Content-Security-Policy",
                `script-src 'self' 'nonce-${nonce}'`,
            ).end(html);
        } catch (e)
        {
            next(e);
        }
    };

    app.use(prodSSRMiddleware);
};

// ---- 啟動（可保持你原本的 API 代理、其他中介件順序） ----
const start = async () =>
{
    const app = express();
    app.use(compression());

    const serviceProxyOptions = {
        target: "https://localhost:7030",
        changeOrigin: true,
        secure: false, // 自簽憑證 (dev)
        // xfwd: true,
        agent: new https.Agent({ rejectUnauthorized: false }),
        logLevel: "debug",
        // pathRewrite: { "^/Service": "" }, // ★ 把 /Service 移除後再轉發給後端
    } as const;

    // 例：API 代理（需要就打開）
    app.use("/Service", createProxyMiddleware(serviceProxyOptions));
    if (!isProd)
    {
        await setupDevSSR(app);
    } else
    {
        await setupProdSSR(app);
    }

    app.use((err: any, _req: Request, res: Response, _next: NextFunction) =>
    {
        console.error("[SSR] Error:", err);
        res.status(500).send("SSR Render Error");
    });

    app.listen(PORT, () =>
    {
        console.log(`[SSR] server started at http://127.0.0.1:${PORT}`);
    });
};

start();
