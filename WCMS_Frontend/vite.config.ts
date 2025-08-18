import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import ssr from 'vite-plugin-ssr/plugin';
import basicSsl from '@vitejs/plugin-basic-ssl';
import path from 'path';

export default defineConfig({
        server: {
          https: true,
          host: 'localhost',
          port: 5174,
          proxy: {
            '/Service': {
              target: 'https://localhost:7030',
              changeOrigin: true,
              secure: false
            }}
        },
        plugins: [react(), ssr(), basicSsl()],
        build: {
          ssr: 'src/SSR/Entry-Server.tsx',
          outDir: 'dist-ssr',
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