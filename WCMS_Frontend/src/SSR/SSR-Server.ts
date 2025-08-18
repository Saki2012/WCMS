// src/SSR/SSR-Server.ts
// 角色：通用 SSR 伺服器（開發/正式皆可用）
// 重點：1) Vite middlewares 一定先掛；2) 在 SSR catch-all 前「放行」資源；3) /Service 代理；4) 注入 SSR HTML

import compression from "compression";
import express, { type NextFunction, type Request, type Response } from "express";
import type { ClientRequest, IncomingMessage } from "http";
import { createProxyMiddleware } from "http-proxy-middleware";
import fs from "node:fs/promises";
import path from "node:path";
import serveStatic from "serve-static";

// 你專案內部：讓 SSR 期間 axios 能把本次請求 Cookie 帶出去
import { __setSsrCookie } from "../SysCore/Utils/APIClient";

const API_ORIGIN = process.env.VITE_API_BASE_URL || "https://localhost:7030";
const PORT = Number(process.env.PORT || 5174);
const isProd = process.env.NODE_ENV === "production";
const root = process.cwd();
const r = (...p: string[]) => path.resolve(root, ...p);

async function createApp()
{
    const app = express();

    // 建議壓縮在最前面
    app.use(compression());

    // -------- 靜態資源（與 legacy）--------
    // 這些路由不影響 /src 與 /@vite 的處理（因為等下會先掛 Vite middlewares）
    app.use("/favicon.ico", serveStatic(r("public/favicon.ico"), { fallthrough: true }));
    app.use("/legacy", serveStatic(r("public/legacy"), { index: false, fallthrough: true }));

    // -------- 代理 /Service 到後端 --------
    app.use(
        "/Service",
        createProxyMiddleware({
            target: API_ORIGIN,
            changeOrigin: true,
            secure: false,
            xfwd: true,
            ws: false,
            cookieDomainRewrite: "", // 保留原網域
            on: {
                proxyReq: (proxyReq: ClientRequest, req: IncomingMessage) =>
                {
                    // 轉送 Accept-Language 與 Cookie
                    const lang = (req.headers["accept-language"] as string) || "";
                    if (lang) proxyReq.setHeader("Accept-Language", lang);
                    const cookie = req.headers["cookie"];
                    if (cookie) proxyReq.setHeader("Cookie", cookie);
                },
                proxyRes: (_proxyRes: IncomingMessage) =>
                {
                    // 可選：在此過濾 /Service 回來的 Set-Cookie 等
                },
            },
        }),
    );

    // -------- Vite 中介（dev only）--------
    let transformIndexHtml: ((url: string, html: string) => Promise<string>) | null = null;
    let devRender: ((url: string, acceptLang?: string) => Promise<{ appHtml: string; headTags?: string; }>) | null =
        null;
    if (!isProd)
    {
        const { createServer: createViteServer } = await import("vite");
        const vite = await createViteServer({
            root,
            server: { middlewareMode: true },
            appType: "custom",
        });
        // ★ 一定要先掛 Vite middlewares
        app.use(vite.middlewares);

        transformIndexHtml = (url, html) => vite.transformIndexHtml(url, html);
        // 讓 dev SSR 可直接載入 TSX 模組
        devRender = async (url: string, acceptLang?: string) =>
        {
            const mod = await vite.ssrLoadModule("/src/SSR/Entry-Server.tsx");
            // 你的 Entry-Server.export function render(url, acceptLang?)
            const { render } = mod as {
                render: (url: string, acceptLang?: string) => Promise<{ appHtml: string; headTags?: string; }>;
            };
            return render(url, acceptLang);
        };
    } else
    {
        // prod 靜態：/dist/client
        app.use(
            "/assets",
            serveStatic(r("dist/client/assets"), {
                maxAge: "1y",
                immutable: true,
                fallthrough: true,
            }),
        );
    }

    // -------- SSR catch-all（最後掛）--------
    app.use(async (req: Request, res: Response, next: NextFunction) =>
    {
        const url = req.originalUrl || req.url || "/";

        // ★ 放行資源給 Vite/靜態，不做 SSR
        if (
            url.startsWith("/src/")
            || url.startsWith("/@vite")
            || url.startsWith("/node_modules/")
            || /\.(tsx?|jsx?|css|map|json|svg|png|jpe?g|gif|webp|ico|woff2?)$/i.test(url)
        )
        {
            return next();
        }

        try
        {
            const acceptLang = (req.headers["accept-language"] as string) || undefined;
            const cookie = req.headers["cookie"];
            // 讓 SSR 階段的 axios 帶上本次 Cookie
            __setSsrCookie(cookie || "");

            // 讀模板（dev 用 index.html；prod 用 dist/client/index.html）
            const templatePath = isProd ? r("dist/client/index.html") : r("index.html");
            let template = await fs.readFile(templatePath, "utf-8");

            // dev：交給 Vite 注入 HMR 等
            if (transformIndexHtml)
            {
                template = await transformIndexHtml(url, template);
            }

            // 呼叫 SSR render
            let appHtml = "";
            let headTags = "";
            if (!isProd && devRender)
            {
                const { appHtml: html, headTags: head } = await devRender(url, acceptLang);
                appHtml = html;
                headTags = head || "";
            } else
            {
                // prod：動態載入 dist/server/entry-server.js
                // 你的 build 應該把 Entry-Server 打到 dist/server/entry-server.js
                const serverEntry = await import(r("dist/server/entry-server.js"));
                const { appHtml: html, headTags: head } = await serverEntry.render(url, acceptLang);
                appHtml = html;
                headTags = head || "";
            }

            // 注入到模板
            const html = template
                .replace("<!--app-head-->", headTags)
                .replace("<!--app-html-->", appHtml);

            res.status(200).setHeader("Content-Type", "text/html").end(html);
        } catch (err)
        {
            // dev 友善 stack
            if (!isProd)
            {
                const { createServer: createViteServer } = await import("vite");
                // NOTE: 如果要用 ssrFixStacktrace 需要現場 vite 實例；簡化處理直接印錯
                // 你也可以把上面的 vite 實例提升作用域來呼叫 ssrFixStacktrace(err as Error)
            }
            console.error(err);
            next(err);
        }
    });

    // 錯誤處理
    app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) =>
    {
        console.error("[SSR] Error:", err);
        res.status(500).send("SSR Render Error");
    });

    return app;
}

createApp().then((app) =>
{
    app.listen(PORT, () =>
    {
        console.log(`[SSR] server started at http://127.0.0.1:${PORT}  (API: ${API_ORIGIN})`);
    });
});
