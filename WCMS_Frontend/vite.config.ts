import { defineConfig } from 'vite'
import path from 'path';

export default defineConfig(({ mode }) => {
   const isSSR = mode === 'ssr';

  return {
        base:'/',
        server: {
          // https: true,
          host: 'localhost',
          port: 5174,
          proxy: {
            '/Service': {
              target: 'https://localhost:7030',
              changeOrigin: true,
              secure: false
            }}
        },
        // plugins: [react(), ssr(), basicSsl()],
        build: isSSR
      ? {
          ssr: 'src/SSR/Entry-Server.tsx',
          outDir: 'dist-ssr',
          assetsInlineLimit: 0,
        }
      : {
          outDir: 'dist',
          assetsInlineLimit: 0,
        },
        resolve: { alias: { '/src': path.resolve(__dirname, './src'),}},
        ssr: {
          noExternal: ['swiper'],
          external: [],          
        },
        assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2'], // TinyMCE 字型檔支援
      }
    }
  )