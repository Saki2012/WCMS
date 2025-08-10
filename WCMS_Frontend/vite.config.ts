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
          port: isSSR? 5174 : 5173
        },
        plugins: isSSR ? [react(), ssr(), basicSsl()] : [react(), basicSsl()],
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