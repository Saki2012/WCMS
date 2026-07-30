// vite.config.ts
import { existsSync } from "node:fs";
import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";
import packageJson from "./package.json";

// #region Property
const SPEC_DIRECTORY_NAMES = ["SpecFetures", "SpecFeatures"];
const FEATURE_SPEC_FALLBACK_PATH = "./src/SysCore/FeatureExtensions/SpecFallback";

interface SpecAliasPaths
{
    specFeatureRoot: string;
    specDefaultRoot: string;
}
// #endregion

// #region Public
export default defineConfig(({ mode, isSsrBuild }) =>
{
    const root = process.cwd();
    const env = loadEnv(mode, root);
    const specCode = normalizeSpecCode(env.VITE_SPEC_CODE);
    const specPaths = resolveSpecAliasPaths(root, specCode);

    return {
        base: "/",
        plugins: [react()],
        optimizeDeps: { include: ["react-helmet-async"] },
        define:
        {
            "import.meta.env.VITE_APP_VERSION": JSON.stringify(packageJson.version),
        },
        build: {
            copyPublicDir: !isSsrBuild,
            assetsInlineLimit: 0,
            outDir: isSsrBuild ? "dist/SSR" : "dist/CSR",
            target: isSsrBuild ? undefined : "es2022",
            manifest: !isSsrBuild,
            ...(isSsrBuild
                ? {
                    ssr: "src/SSR/Entry-Server.tsx",
                    rollupOptions: { output: { entryFileNames: "entry-server.js" } },
                }
                : {}),
        },
        resolve: {
            alias: {
                "@": path.resolve(__dirname, "src"),
                SpecFeature: specPaths.specFeatureRoot,
                SpecDefault: specPaths.specDefaultRoot,
            },
        },
        ssr: {
            noExternal: ["swiper", "react-helmet-async"],
            external: [],
        },
        assetsInclude: ["**/*.ttf", "**/*.woff", "**/*.woff2"],
    };
});
// #endregion

// #region Private
/** 正規化 SpecCode；空值代表純 Feature 模式。 */
const normalizeSpecCode = (value: string | undefined): string =>
{
    return String(value ?? "").trim();
};

/** 解析目前 Spec 與預設 Spec 的 Vite Alias。 */
const resolveSpecAliasPaths = (root: string, specCode: string): SpecAliasPaths =>
{
    const fallbackRoot = path.resolve(root, FEATURE_SPEC_FALLBACK_PATH);
    const specFeatureRoot = specCode ? findSpecDirectory(root, specCode) : "";
    const specDefaultRoot = findSpecDirectory(root, "_default") || fallbackRoot;

    if (specCode && !specFeatureRoot)
    {
        throw new Error(`[WCMS] VITE_SPEC_CODE=${specCode}，但找不到對應的 SpecFetures/SpecFeatures 資料夾。`);
    }

    return {
        specFeatureRoot: specFeatureRoot || fallbackRoot,
        specDefaultRoot,
    };
};

/** 同時相容既有 SpecFetures 拼字與未來 SpecFeatures 拼字。 */
const findSpecDirectory = (root: string, specCode: string): string =>
{
    const candidates = SPEC_DIRECTORY_NAMES.map(directoryName => path.resolve(root, "src", directoryName, specCode));
    return candidates.find(candidate => existsSync(candidate)) ?? "";
};
// #endregion
