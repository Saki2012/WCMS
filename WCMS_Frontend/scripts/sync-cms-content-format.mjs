import { copyFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// #region Property
const currentDir = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(currentDir, "..");
const sourcePath = resolve(projectRoot, "src/Features/Assets/Global/Content/cms_content_format.css");
const targetPath = resolve(projectRoot, "public/tinymce/cms_content_format.css");
// #endregion

// #region Public
/** 將 CMS 共用內容格式同步至 TinyMCE 公開資源目錄。 */
const syncCmsContentFormat = async () =>
{
    await mkdir(dirname(targetPath), { recursive: true });
    await copyFile(sourcePath, targetPath);
};

await syncCmsContentFormat();
// #endregion
