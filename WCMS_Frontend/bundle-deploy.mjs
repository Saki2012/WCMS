// bundle-deploy.mjs
// 目標：dist/ 本身就是可部署的 SSR runtime 目錄（給 IIS/WinSW 用）
//
// dist/
//   CSR/ , SSR/
//   SSR-Server.mjs  (ESM compiled output)
//   package.json / package-lock.json
//   start.bat
//   stop.bat
//   WinSW-x64.xml
//   WinSW-x64.exe
//   web.config.bak / .env.production.bak / .env (可選)

import fs from "node:fs/promises";
import path from "node:path";
import { execFileSync } from "node:child_process";

// ===== 你想要的精簡開關（預設：最精簡） =====
const DEPLOY_COPY_ROOT_MANIFEST = false;   // false: 不在 dist 根目錄放 manifest.json
const DEPLOY_WRITE_CJS_BOOTSTRAP = false;  // false: 不產出 SSR-Server.cjs（只跑 SSR-Server.mjs）
const DEPLOY_WINSW_EXE_NAME = "WinSW-x64.exe";

const getServerEntryFileName = () =>
{
  // 取得 SSR 啟動檔名
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

const copyDirIfExists = async (src, dest) =>
{
  // 資料夾存在才遞迴複製
  if (!(await pathExists(src))) return false;

  await fs.mkdir(dest, { recursive: true });
  await fs.cp(src, dest, { recursive: true, force: true });

  return true;
};

const copyMaintainPageToDist = async (root, distDir) =>
{
  // 複製維護頁資料夾到 dist/MaintainPage
  const src = path.resolve(root, "MaintainPage");
  const dest = path.resolve(distDir, "MaintainPage");

  await removeIfExists(dest);

  if (!(await copyDirIfExists(src, dest)))
  {
    throw new Error(`[bundle-deploy] MaintainPage not found at root: ${src}`);
  }
};

const removeIfExists = async (absPath) =>
{
  // 存在才刪除
  if (!(await pathExists(absPath))) return;
  await fs.rm(absPath, { recursive: true, force: true });
};

const copyWinSwExeToDist = async (root, distDir) =>
{
  // 複製 WinSW-x64.exe 到 dist
  const src = path.resolve(root, DEPLOY_WINSW_EXE_NAME);
  const dest = path.resolve(distDir, DEPLOY_WINSW_EXE_NAME);

  if (!(await pathExists(src)))
  {
    throw new Error(`[bundle-deploy] ${DEPLOY_WINSW_EXE_NAME} not found at root: ${src}`);
  }

  await copyFileIfExists(src, dest);
};

const buildSsrServerEsm = (root, distDir) =>
{
  // 編譯 SSR-Server.ts 成 dist/SSR-Server.mjs
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
  // 產生可選的 CJS 入口
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

const parseEnvText = (envText) =>
{
  // 解析 .env 文字成 key/value map
  const result = {};

  for (const rawLine of String(envText ?? "").split(/\r?\n/))
  {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;

    const eqIndex = line.indexOf("=");
    if (eqIndex <= 0) continue;

    const key = line.slice(0, eqIndex).trim();
    let value = line.slice(eqIndex + 1).trim();

    if ((value.startsWith("\"") && value.endsWith("\"")) || (value.startsWith("'") && value.endsWith("'")))
    {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
};

const sanitizeServiceToken = (value) =>
{
  // 將字串收斂成適合放 service id 的安全 token
  const text = String(value ?? "").trim();
  if (!text) return "default";

  const normalized = text.replace(/[^a-zA-Z0-9_-]/g, "_");
  return normalized || "default";
};

const getProdEnvMap = async (root) =>
{
  // 讀取 root/.env.production 內容
  const prodEnvPath = path.resolve(root, ".env.production");
  const prodText = await readTextIfExists(prodEnvPath);
  const envMap = parseEnvText(prodText);

  return envMap;
};

const getSpecCodeFromProdEnv = async (root) =>
{
  // 從 .env.production 取得 VITE_SPEC_CODE
  const envMap = await getProdEnvMap(root);
  const specCode = sanitizeServiceToken(envMap.VITE_SPEC_CODE);

  return specCode;
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
  // 依 SSR-Server.ts 的靜態 import 收斂 runtime dependencies
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
  // 產出 dist 專用 package.json
  const pkgPath = path.resolve(root, "package.json");
  const pkg = JSON.parse(await fs.readFile(pkgPath, "utf-8"));
  const entry = getServerEntryFileName();

  const distPkg = {
    name: pkg.name,
    private: true,
    version: pkg.version,
    type: pkg.type,
    scripts: { "start": `node ${entry}`, "start:prod": `node ${entry}`, "install:prod": "npm ci --omit=dev" },
    dependencies: deps,
  };

  await fs.writeFile(path.resolve(distDir, "package.json"), JSON.stringify(distPkg, null, 2), "utf-8");
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

const writeWinSwXml = async (root, distDir) =>
{
  // 產出 WinSW-x64.xml（service name 依 spec code 區分）
  const specCode = await getSpecCodeFromProdEnv(root);
  const entry = getServerEntryFileName();
  const serviceId = `wcms_${specCode}_ssr`;
  const serviceName = `WCMS_${specCode} SSR Service`;
  const serviceDescription = `WCMS React Vite SSR service (${specCode})`;

  const lines = [
    "<service>",
    `  <id>${serviceId}</id>`,
    `  <name>${serviceName}</name>`,
    `  <description>${serviceDescription}</description>`,
    "",
    "  <executable>C:\\Program Files\\nodejs\\node.exe</executable>",
    `  <arguments>%BASE%\\${entry}</arguments>`,
    "  <workingdirectory>%BASE%</workingdirectory>",
    "",
    "  <startmode>Automatic</startmode>",
    "  <delayedAutoStart>true</delayedAutoStart>",
    "",
    "  <depend>Tcpip</depend>",
    "  <depend>EventLog</depend>",
    "",
    "  <logpath>%BASE%\\logs</logpath>",
    "  <log mode=\"roll\" />",
    "",
    "  <onfailure action=\"restart\" delay=\"10 sec\" />",
    "  <onfailure action=\"restart\" delay=\"30 sec\" />",
    "  <onfailure action=\"restart\" delay=\"60 sec\" />",
    "  <resetfailure>1 hour</resetfailure>",
    "</service>",
    "",
  ];

  await fs.writeFile(path.resolve(distDir, "WinSW-x64.xml"), lines.join("\r\n"), "utf-8");
};

const writeStartBat = async (distDir) =>
{
  // 產出 start.bat（安裝 / 更新 / 啟動當前 WinSW service）
  const lines = [
    "@echo off",
    "setlocal enabledelayedexpansion",
    "cd /d %~dp0",
    "",
    "set \"SERVICE_EXE=WinSW-x64.exe\"",
    "set \"SERVICE_XML=WinSW-x64.xml\"",
    "",
    "net session >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [ERROR] Please run this script as Administrator.",
    "  exit /b 1",
    ")",
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
    "if not exist \"%SERVICE_EXE%\" (",
    "  echo [ERROR] Service executable not found: %SERVICE_EXE%",
    "  exit /b 1",
    ")",
    "",
    "if not exist \"%SERVICE_XML%\" (",
    "  echo [ERROR] Service config not found: %SERVICE_XML%",
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
    "if not exist \"logs\\\" mkdir \"logs\"",
    "",
    "for /f \"usebackq delims=\" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -Command \"try { (Select-Xml -Path '%SERVICE_XML%' -XPath '/service/id').Node.InnerText } catch { '' }\"`) do set \"SERVICE_ID=%%i\"",
    "",
    "if \"%SERVICE_ID%\"==\"\" (",
    "  echo [ERROR] Failed to read service id from %SERVICE_XML%",
    "  exit /b 1",
    ")",
    "",
    "echo [INFO] Service ID: %SERVICE_ID%",
    "",
    "sc query \"%SERVICE_ID%\" >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [INFO] Service not installed. Installing...",
    "  \"%SERVICE_EXE%\" install",
    "  if errorlevel 1 (",
    "    echo [ERROR] Service install failed.",
    "    exit /b 1",
    "  )",
    ") else (",
    "  echo [INFO] Service already exists. Refreshing...",
    "  \"%SERVICE_EXE%\" refresh",
    "  if errorlevel 1 (",
    "    echo [WARN] Service refresh failed. Continue to state check...",
    "  )",
    ")",
    "",
    "sc query \"%SERVICE_ID%\" | find \"RUNNING\" >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [INFO] Starting service...",
    "  \"%SERVICE_EXE%\" start",
    "  if errorlevel 1 (",
    "    echo [ERROR] Service start failed.",
    "    exit /b 1",
    "  )",
    ") else (",
    "  echo [INFO] Service already running.",
    ")",
    "",
    "echo [INFO] Service status:",
    "\"%SERVICE_EXE%\" status",
    "",
    "endlocal",
    "",
  ];

  await fs.writeFile(path.resolve(distDir, "start.bat"), lines.join("\r\n"), "utf-8");
};

const writeStopBat = async (distDir) =>
{
  // 產出 stop.bat（停止當前 WinSW service）
  const lines = [
    "@echo off",
    "setlocal enabledelayedexpansion",
    "cd /d %~dp0",
    "",
    "set \"SERVICE_EXE=WinSW-x64.exe\"",
    "set \"SERVICE_XML=WinSW-x64.xml\"",
    "",
    "net session >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [ERROR] Please run this script as Administrator.",
    "  exit /b 1",
    ")",
    "",
    "if not exist \"%SERVICE_EXE%\" (",
    "  echo [ERROR] Service executable not found: %SERVICE_EXE%",
    "  exit /b 1",
    ")",
    "",
    "if not exist \"%SERVICE_XML%\" (",
    "  echo [ERROR] Service config not found: %SERVICE_XML%",
    "  exit /b 1",
    ")",
    "",
    "for /f \"usebackq delims=\" %%i in (`powershell -NoProfile -ExecutionPolicy Bypass -Command \"try { (Select-Xml -Path '%SERVICE_XML%' -XPath '/service/id').Node.InnerText } catch { '' }\"`) do set \"SERVICE_ID=%%i\"",
    "",
    "if \"%SERVICE_ID%\"==\"\" (",
    "  echo [ERROR] Failed to read service id from %SERVICE_XML%",
    "  exit /b 1",
    ")",
    "",
    "echo [INFO] Service ID: %SERVICE_ID%",
    "",
    "sc query \"%SERVICE_ID%\" >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [WARN] Service not installed: %SERVICE_ID%",
    "  exit /b 0",
    ")",
    "",
    "sc query \"%SERVICE_ID%\" | find \"RUNNING\" >nul 2>nul",
    "if errorlevel 1 (",
    "  echo [INFO] Service already stopped.",
    "  exit /b 0",
    ")",
    "",
    "echo [INFO] Stopping service...",
    "\"%SERVICE_EXE%\" stop",
    "if errorlevel 1 (",
    "  echo [ERROR] Service stop failed.",
    "  exit /b 1",
    ")",
    "",
    "echo [INFO] Service status:",
    "\"%SERVICE_EXE%\" status",
    "",
    "endlocal",
    "",
  ];

  await fs.writeFile(path.resolve(distDir, "stop.bat"), lines.join("\r\n"), "utf-8");
};

const writeDistDotEnv = async (root, distDir) =>
{
  // 只備份 .env.production，部署時可再去掉 .bak
  const prodEnvPath = path.resolve(root, ".env.production");
  const prodText = await readTextIfExists(prodEnvPath);
  if (!prodText) return;

  await copyFileIfExists(prodEnvPath, path.resolve(distDir, ".env.production.bak"));
};

const handleViteManifest = async (distDir) =>
{
  // 視設定決定是否保留 dist 根目錄 manifest
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
  // 遞迴刪除 *.map
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
  // 如果同時存在 CSR/SSR，就移除舊的 client/server 目錄
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
  await copyFileIfExists(path.resolve(root, "web.config"), path.resolve(distDir, "web.config.bak"));
  await copyMaintainPageToDist(root, distDir);
  
  const ssrServerTsText = await fs.readFile(path.resolve(root, "src/SSR/SSR-Server.ts"), "utf-8");
  const rootPkg = JSON.parse(await fs.readFile(path.resolve(root, "package.json"), "utf-8"));
  const distDeps = buildDistDependencies(rootPkg, ssrServerTsText);

  await writeDistPackageJson(root, distDir, distDeps);
  writeDistPackageLock(distDir);
  await writeWinSwXml(root, distDir);
  await copyWinSwExeToDist(root, distDir);
  await writeStartBat(distDir);
  await writeStopBat(distDir);

  await handleViteManifest(distDir);
  await deleteSourcemapsUnder(distDir);
  await pruneLegacyBuildDirs(distDir);
};

run().catch((e) =>
{
  console.error(e);
  process.exit(1);
});