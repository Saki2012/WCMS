// dev-server.ts
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import https from 'https';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { createServer as createViteServer } from 'vite';
import { setMaxListeners } from 'node:events';

setMaxListeners(30); // 開發噪音警示放寬

async function createServer() {
  const app = express();


  app.use(/^\/\.well-known(\/.*)?$/, (_req, res) => {
    res.sendStatus(404);
  });

  // --- 0) 基本參數 ---
  // 用 localhost 對齊憑證主機名；keepAlive 提升穩定度
  const BACKEND_ORIGIN = process.env.BACKEND_ORIGIN || 'https://localhost:7030';
  const agent = new https.Agent({ keepAlive: true, rejectUnauthorized: false }); // 本機自簽開發用

  // --- 1) 靜態資產（避免被 SSR 吃掉）---
  app.use('/Legacy', express.static(path.resolve('public/Legacy'), { fallthrough: false, etag: false, maxAge: 0 }));
  app.use('/Public', express.static(path.resolve('public/Legacy'), { etag: false, maxAge: 0 }));

  // --- 2) 後端代理：/Service -> BACKEND_ORIGIN/Service ---
  app.use(
  '/Service',
  createProxyMiddleware({
    target: BACKEND_ORIGIN,         // -> https://localhost:7030
    changeOrigin: true,
    secure: false,                  // 忽略自簽憑證
    agent,                          // 同上
    pathRewrite: (path) => path,    // 不動 /Service/...
    logLevel: 'warn',
    onProxyReq(proxyReq, req) {
      // 3) 重要：把使用者 Cookie 往後端帶（JWT 在 Cookie 裡）
      if (req.headers.cookie) proxyReq.setHeader('cookie', req.headers.cookie);
      proxyReq.setHeader('x-forwarded-host', req.headers.host || '');
      proxyReq.setHeader('x-forwarded-proto', 'http'); // 前端是 http://5174
    },
    onError(_err, _req, res) {
      res.writeHead(502);
      res.end('Bad gateway');
    },
  })
);

  // --- 3) Vite 以中介層掛上（開發模式）---
  const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'custom' });
  app.use(vite.middlewares);

  // --- 4) SSR catch‑all：排除 /Service /Legacy /assets /@vite ---
  app.get(/^(?!(\/Service|\/Legacy|\/assets|\/@vite)).*/, async (req, res, next) => {
    try {
      const url = req.originalUrl;
      const tpl = fs.readFileSync(path.resolve('index.html'), 'utf-8');
      const template = await vite.transformIndexHtml(url, tpl);

      const { render } = await vite.ssrLoadModule('/src/SSR/Entry-Server.tsx');
      const appHtml = await render(url);

      const html = template.replace('<!--app-html-->', appHtml ?? '');
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });

  // --- 6) 啟動 ---
  const port = Number(process.env.PORT || 5174);
  app.listen(port, () => {
    console.log(`[SSR] http://localhost:${port} (proxy -> ${BACKEND_ORIGIN})`);
  });
}

createServer();
