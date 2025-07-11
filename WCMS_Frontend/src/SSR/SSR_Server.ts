import express from 'express';
import { createServer as createViteServer } from 'vite'
import { fileURLToPath } from 'url';
import { dirname } from 'path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function createServer() {
  const app = express()
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'custom'
  });
  app.use(vite.middlewares)
  app.use('/{*any}', async (req, res) => {
    try {
      const { render } = await vite.ssrLoadModule('/src/SSR/SSR_Render.tsx');
      const html = await render()
      res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
    } catch (e) {
      vite.ssrFixStacktrace(e as Error)
      console.error(e)
      res.status(500).end((e as Error).message)
    }
  })

  app.listen(5174, () => {
    console.log('SSR server running at http://localhost:5174')
  })
}

createServer()