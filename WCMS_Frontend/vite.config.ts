import { defineConfig, loadEnv } from 'vite'
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd())
  const isSSR = mode === 'ssr';
  const spec = env.VITE_SPEC_CODE || '_default' // 沒設就走預設包

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
          target: 'es2022',
          assetsInlineLimit: 0,
          // sourcemap: true,   // ✅ 讓錯誤指回 .tsx 檔案與行號
          // minify: false      // ✅ 先關，堆疊更可讀；定位後再開回去
        },
        resolve: {
          alias: {
            '@': path.resolve(__dirname, 'src'),  // 這裡設定 @ = /src
            'SpecFeature': path.resolve(__dirname, `./src/SpecFetures/${spec}`),
          },
        },
        ssr: {
          noExternal: ['swiper'],
          external: [],          
        },
        assetsInclude: ['**/*.ttf', '**/*.woff', '**/*.woff2'], // TinyMCE 字型檔支援
      }
    }
  )