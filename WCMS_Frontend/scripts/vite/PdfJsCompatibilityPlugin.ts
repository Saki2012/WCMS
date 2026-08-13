import type { OutputBundle } from "rollup";
import type { Plugin } from "vite";

// #region Property
const PDFJS_PACKAGE_KEY = "pdfjs-dist";
const PDFJS_DUMMY_DOMAIN = "https://foo.bar";
const WCMS_SAFE_BASE_DOMAIN = "https://example.com";
// #endregion

// #region Public
/** 建立 PDF.js 弱掃相容處理，僅替換第三方套件內部的虛擬 Base URL。 */
export const createPdfJsCompatibilityPlugin = (): Plugin =>
{
    return {
        name: "wcms-pdfjs-compatibility",
        enforce: "pre",
        transform: transformPdfJsSource,
        generateBundle: validatePdfJsBundle,
    };
};
// #endregion

// #region Private
/** 僅修改 pdfjs-dist 原始模組中的虛擬網域。 */
const transformPdfJsSource = (code: string, id: string) =>
{
    if (!id.includes(PDFJS_PACKAGE_KEY)) return null;
    if (!code.includes(PDFJS_DUMMY_DOMAIN)) return null;

    const patchedCode = code.replaceAll(PDFJS_DUMMY_DOMAIN, WCMS_SAFE_BASE_DOMAIN);
    return { code: patchedCode, map: null };
};

/** Build 完成前確認輸出內容沒有殘留 PDF.js 虛擬網域。 */
const validatePdfJsBundle = (_options: unknown, bundle: OutputBundle): void =>
{
    const hasUnsafeDomain = Object.values(bundle).some(item =>
        item.type === "chunk" && item.code.includes(PDFJS_DUMMY_DOMAIN));

    if (hasUnsafeDomain)
        throw new Error(`[WCMS] PDF.js Compatibility 失敗，Build 內容仍包含 ${PDFJS_DUMMY_DOMAIN}`);
};
// #endregion