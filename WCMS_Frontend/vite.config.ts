import { defineConfig,loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import ssr from 'vite-plugin-ssr/plugin';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig(() => {
      const env = loadEnv("", process.cwd())
      const isSSR = env.VITE_RENDER_MODE === 'ssr'
      return ({
        server: {
          https: true,
          port: isSSR? 5174 : 5173,
          proxy: {
            '/Service': {
              target: 'https://localhost:7030',
              changeOrigin: true,
              secure: false // 本地自簽憑證要加這行
            }}

          // proxy: {
          // // 讓前端呼叫 /Service/*，實際代理到後端 http://localhost:5623/*
          // '/Service': {
          //   // target: 'http://localhost:5623',
          //   changeOrigin: true,
          //   secure: false,
          //   // 和 IIS 一樣：把 /Service 前綴移除再轉給後端
          //   rewrite: (path) => path.replace(/^\/Service/, ''),
          //   // 可選：補上轉發標頭，後端若有 UseForwardedHeaders 可正確判斷
          //   configure: (proxy) => {
          //     proxy.on('proxyReq', (proxyReq, req) => {
          //       proxyReq.setHeader('X-Forwarded-Proto', 'http')
          //       proxyReq.setHeader('X-Forwarded-Host', 'localhost:5173')
          //     })
          //   },
          //   // 若你用 cookie，需要帶 cookie 並把網域改回 localhost
          //   cookieDomainRewrite: 'localhost',
          // },},
        },
        plugins: isSSR ? [react(), ssr(), basicSsl()] : [react(), basicSsl()],
        // plugins: isSSR ? [react(), ssr()] : [react()],
        build: {
          ssr: isSSR ? 'src/SSR/SSR_Server.ts' : false,
          outDir: isSSR ? 'dist-ssr' : 'dist-csr',
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, './src'),
          }
        },
        ssr: {
          noExternal: ['swiper'],
          external: [],          
        },
        assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2'], // TinyMCE 字型檔支援
        base:'/',
      }
    )
  }
)