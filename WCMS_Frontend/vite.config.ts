// vite.config.ts
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode, isSsrBuild }) => {
  const env = loadEnv(mode, process.cwd());
  const spec = env.VITE_SPEC_CODE || "_default";

  return {
    base: "/",
    plugins: [react()],
    optimizeDeps: { include: ["react-helmet-async"] },

    build: {
      copyPublicDir: !isSsrBuild,
      assetsInlineLimit: 0,
      outDir: isSsrBuild ? "dist/SSR" : "dist/CSR",
      target: isSsrBuild ? undefined : "es2022",
      manifest: !isSsrBuild,
      ...(isSsrBuild ? { ssr: "src/SSR/Entry-Server.tsx", rollupOptions: { output: { entryFileNames: "entry-server.js" },}, } : {}),
    },

    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
        SpecFeature: path.resolve(__dirname, `./src/SpecFetures/${spec}`),
        SpecDefault: path.resolve(__dirname, "./src/SpecFetures/_default"),
      },
    },

    ssr: {
      noExternal: ["swiper", "react-helmet-async"],
      external: [],
    },

    assetsInclude: ["**/*.ttf", "**/*.woff", "**/*.woff2"],
  };
});