// bundle-deploy.mjs
// 目標：dist/ 本身就是可部署的 SSR runtime 目錄（給 IIS/NSSM 用）
//
// dist/
//   CSR/ , SSR/
//   SSR-Server.mjs  (ESM compiled output)
//   package.json / package-lock.json
//   start.bat
//   web.config.bak / .env.production / .env (可選)

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ===== 你想要的精簡開關（預設：最精簡） =====
const DEPLOY_COPY_ROOT_MANIFEST = false;     // false: 不在 dist 根目錄放 manifest.json
const DEPLOY_WRITE_CJS_BOOTSTRAP = false;   // false: 不產出 SSR-Server.cjs（只跑 SSR-Server.mjs）

const getServerEntryFileName = () =>
{
  // 宣告變數
  const fileName = DEPLOY_WRITE_CJS_BOOTSTRAP ? "SSR-Server.cjs" : "SSR-Server.mjs";

  // return
  return fileName;
};

const pathExists = async (absPath) =>
{
  // 檢查路徑是否存在
  try { await fs.access(absPath); return true; } catch { return false; }
};

const ensureDirForFile = async (absFilePath) =>
{
  // 確保檔案的父資料夾存在
  await fs.mkdir(path.dirname(absFilePath), { recursive: true });
};

const copyFileIfExists = async (src, dest) =>
{
  // 存在才複製
  if (!(await pathExists(src))) return;
  await ensureDirForFile(dest);
  await fs.copyFile(src, dest);
};

const removeIfExists = async (absPath) =>
{
  // 存在才刪除
  if (!(await pathExists(absPath))) return;
  await fs.rm(absPath, { recursive: true, force: true });
};

const buildSsrServerEsm = (root, distDir) =>
{
  // 用 node 執行 esbuild 的 JS 入口（避免 Windows 直接跑 .cmd 造成 EINVAL）
  const esbuildJs = path.resolve(root, "node_modules", "esbuild", "bin", "esbuild");
  const entryFile = path.resolve(root, "src/SSR/SSR-Server.ts");
  const outFile = path.resolve(distDir, "SSR-Server.mjs");

  execFileSync(
    process.execPath,
    [
      esbuildJs,
      entryFile,
      "--platform=node",
      "--target=node20",
      "--format=esm",
      `--outfile=${outFile}`,
      "--legal-comments=none",
    ],
    { stdio: "inherit" },
  );

  return outFile;
};

const writeSsrServerCjsBootstrap = async (distDir) =>
{
  // 產生 CJS 入口：動態 import ESM compiled 檔（可選）
  const outFile = path.resolve(distDir, "SSR-Server.cjs");
  const content = [
    "// SSR bootstrap (CJS)\n",
    "(async () => {\n",
    "  await import('./SSR-Server.mjs');\n",
    "})().catch((e) => {\n",
    "  console.error(e);\n",
    "  process.exit(1);\n",
    "});\n",
  ].join("");

  await fs.writeFile(outFile, content, "utf-8");
  return outFile;
};

const readTextIfExists = async (absPath) =>
{
  // 讀檔（不存在回空字串）
  try { return await fs.readFile(absPath, "utf-8"); } catch { return ""; }
};

const pickPkgName = (specifier) =>
{
  // 將 "@scope/name/xxx" -> "@scope/name"；"react/jsx" -> "react"
  if (specifier.startsWith("@"))
  {
    const [a, b] = specifier.split("/");
    return b ? `${a}/${b}` : specifier;
  }
  return specifier.split("/")[0];
};

const parseStaticImportPackages = (tsText) =>
{
  // 簡易解析 import...from / import "xxx" 的套件名稱
  const pkgs = new Set();
  const re = /^\s*import\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["'](.+?)["']\s*;?\s*$/gm;

  for (const m of tsText.matchAll(re))
  {
    const spec = String(m[1] || "").trim();
    if (!spec) continue;
    if (spec.startsWith("node:")) continue;
    if (spec.startsWith(".")) continue;
    if (spec.startsWith("/")) continue;
    pkgs.add(pickPkgName(spec));
  }

  return [...pkgs];
};

const buildDistDependencies = (rootPkg, ssrServerTsText) =>
{
  // 依 SSR-Server.ts 的「靜態 import」把 runtime 必要套件補進 dependencies
  const deps = { ...(rootPkg.dependencies ?? {}) };
  const devDeps = rootPkg.devDependencies ?? {};
  const runtimePkgs = parseStaticImportPackages(ssrServerTsText);

  for (const name of runtimePkgs)
  {
    if (deps[name]) continue;
    if (devDeps[name]) deps[name] = devDeps[name];
  }

  return deps;
};

const writeDistPackageJson = async (root, distDir, deps) =>
{
  // 產出 dist 專用 package.json（只放 runtime deps）
  const pkgPath = path.resolve(root, "package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));

  const entry = getServerEntryFileName();

  const distPkg = {
    name: pkg.name,
    private: true,
    version: pkg.version,
    type: pkg.type,
    scripts: {
      "start": `node ${entry}`,
      "start:prod": `node ${entry}`,
      "install:prod": "npm ci --omit=dev",
    },
    dependencies: deps,
  };

  await fs.writeFile(
    path.resolve(distDir, "package.json"),
    JSON.stringify(distPkg, null, 2),
    "utf-8",
  );
};

const writeDistPackageLock = (distDir) =>
{
  // 產生 dist/package-lock.json（只鎖 production dependencies）
  const isWin = process.platform === "win32";

  const cmd = isWin ? "cmd.exe" : "npm";
  const args = isWin
    ? ["/d", "/s", "/c", "npm", "install", "--package-lock-only", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts"]
    : ["install", "--package-lock-only", "--omit=dev", "--no-audit", "--no-fund", "--ignore-scripts"];

  execFileSync(cmd, args, { cwd: distDir, stdio: "inherit" });
};

const writeStartBat = async (distDir) =>
{
  // 產出 start.bat（Windows service 直接跑）
  const entry = getServerEntryFileName();
  const lines = [
  "@echo off",
  "setlocal enabledelayedexpansion",
  "cd /d %~dp0",
  "",
  `set \"ENTRY=${entry}\"`,
  "",
  "where node >nul 2>nul",
  "if errorlevel 1 (",
  "  echo [ERROR] Node.js not found. Please install Node.js first.",
  "  exit /b 1",
  ")",
  "",
  "where npm >nul 2>nul",
  "if errorlevel 1 (",
  "  echo [ERROR] npm not found. Node installation may be incomplete.",
  "  exit /b 1",
  ")",
  "",
  "if not exist \"node_modules\\\" (",
  "  echo [INFO] node_modules not found. Installing production dependencies...",
  "  npm ci --omit=dev --no-audit --no-fund",
  "  if errorlevel 1 (",
  "    echo [ERROR] npm ci failed.",
  "    exit /b 1",
  "  )",
  ")",
  "",
  "if not exist \"%ENTRY%\" (",
  "  echo [ERROR] Entry file not found: %ENTRY%",
  "  exit /b 1",
  ")",
  "",
  "echo [INFO] Starting SSR Server: %ENTRY%",
  "node \"%ENTRY%\"",
  "",
  "endlocal",
  "",
];

  await fs.writeFile(path.resolve(distDir, "start.bat"), lines.join("\r\n"), "utf-8");
};

const writeDistDotEnv = async (root, distDir) =>
{
  // 你目前策略：只備份 env（不改動你現況）
  const prodEnvPath = path.resolve(root, ".env.production");
  const prodText = await readTextIfExists(prodEnvPath);
  if (!prodText) return;
  await copyFileIfExists(prodEnvPath, path.resolve(distDir, ".env.production.bak"));
};

const handleViteManifest = async (distDir) =>
{
  // 你現在 dist 根目錄那份 manifest.json 是從 CSR/.vite/manifest.json copy 出來的
  // 精簡模式下：不需要就刪掉，避免重複與誤會
  const rootManifest = path.resolve(distDir, "manifest.json");

  if (!DEPLOY_COPY_ROOT_MANIFEST)
  {
    await removeIfExists(rootManifest);
    return;
  }

  const src = path.resolve(distDir, "CSR", ".vite", "manifest.json");
  await copyFileIfExists(src, rootManifest);
};

const deleteSourcemapsUnder = async (rootDir) =>
{
  // 遞迴刪除 *.map（縮小體積 + 避免弱掃曝露 source）
  if (!(await pathExists(rootDir))) return;

  const walk = async (dir) =>
  {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries)
    {
      const abs = path.resolve(dir, e.name);
      if (e.isDirectory()) { await walk(abs); continue; }
      if (abs.endsWith(".map")) await fs.rm(abs, { force: true });
    }
  };

  await walk(rootDir);
};

const pruneLegacyBuildDirs = async (distDir) =>
{
  // 如果同時存在 CSR/SSR，就把舊的 client/server 目錄移掉
  const csr = path.resolve(distDir, "CSR");
  const ssr = path.resolve(distDir, "SSR");
  const client = path.resolve(distDir, "client");
  const server = path.resolve(distDir, "server");

  if ((await pathExists(csr)) && (await pathExists(ssr)))
  {
    await removeIfExists(client);
    await removeIfExists(server);
  }
};

const run = async () =>
{
  // 主流程：build SSR server + 寫 dist runtime 檔案 + 清理垃圾
  const root = process.cwd();
  const distDir = path.resolve(root, "dist");
  const distCSR = path.resolve(distDir, "CSR");
  const distSSR = path.resolve(distDir, "SSR");

  if (!(await pathExists(distCSR)) || !(await pathExists(distSSR)))
  {
    throw new Error("dist/CSR 或 dist/SSR 不存在，請先執行 npm run build");
  }

  await removeIfExists(path.resolve(distDir, "SSR-Server.ts"));
  buildSsrServerEsm(root, distDir);

  if (DEPLOY_WRITE_CJS_BOOTSTRAP)
  {
    await writeSsrServerCjsBootstrap(distDir);
  }
  else
  {
    await removeIfExists(path.resolve(distDir, "SSR-Server.cjs"));
  }

  await writeDistDotEnv(root, distDir);
  await copyFileIfExists(path.resolve(root, "web.config.bak"), path.resolve(distDir, "web.config.bak"));

  const ssrServerTsText = await fs.readFile(path.resolve(root, "src/SSR/SSR-Server.ts"), "utf-8");
  const rootPkg = JSON.parse(await fs.readFile(path.resolve(root, "package.json"), "utf-8"));
  const distDeps = buildDistDependencies(rootPkg, ssrServerTsText);

  await writeDistPackageJson(root, distDir, distDeps);
  writeDistPackageLock(distDir);
  await writeStartBat(distDir);

  await handleViteManifest(distDir);

  await deleteSourcemapsUnder(distDir);
  await pruneLegacyBuildDirs(distDir);
};

run().catch((e) =>
{
  console.error(e);
  process.exit(1);
});