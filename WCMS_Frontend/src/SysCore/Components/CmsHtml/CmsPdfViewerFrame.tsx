import { withNativePdfPreviewContext } from "@/SysCore/Security/Contracts/PdfPreviewSecurityContract";
import type { Lang } from "@/SysCore/i18n/lang";
import type { ReactElement } from "react";
import { CmsPdfViewer, type CmsPdfViewerText } from "./CmsPdfViewer";
import "./CmsPdfViewer_Style.css";

// #region Property
export interface CmsPdfViewerFrameProps
{
    fileUrl: string;
    title?: string;
    lang: Lang;
}
// #endregion

// #region Public
/** CMS PDF 外框，PDF.js 維持一般 Preview URL；只有 Browser 原生 fallback 帶 Native Preview Context。 */
export const CmsPdfViewerFrame = (props: CmsPdfViewerFrameProps): ReactElement =>
{
    const title = resolvePdfTitle(props.title);
    const text = resolvePdfViewerText(props.lang);
    const nativePreviewUrl = withNativePdfPreviewContext(props.fileUrl);

    return (
        <span className="cms-pdf-viewer-frame" role="group" aria-label={title}>
            <CmsPdfViewer fileUrl={props.fileUrl} title={title} text={text} />
            <span className="cms-pdf-viewer-fallback">
                <span className="cms-pdf-viewer-fallback-text">
                    {text.fallbackHint}
                    <a href={nativePreviewUrl} target="_blank" rel="noopener noreferrer" className="cms-pdf-viewer-open-link" title={text.openOriginal}><i className="fas fa-external-link"></i></a>
                    。
                </span>
            </span>
        </span>
    );
};
// #endregion

// #region Private
/** 解析 PDF Viewer 標題。 */
const resolvePdfTitle = (title?: string): string =>
{
    const text = `${title ?? ""}`.trim();
    return text || "PDF 文件預覽";
};

/** 依語系取得 PDF Viewer 文字。 */
const resolvePdfViewerText = (lang: Lang): CmsPdfViewerText =>
{
    if (lang === "en") return buildEnglishPdfViewerText();
    return buildChinesePdfViewerText();
};

/** 建立中文 PDF Viewer 文字。 */
const buildChinesePdfViewerText = (): CmsPdfViewerText =>
{
    return {
        toolbarLabel: "PDF Viewer 工具列",
        openOriginal: "開啟原始 PDF",
        fallbackHint: "若 PDF Viewer 無法正常顯示，可開啟原始 PDF",
        loading: "PDF 載入中...",
        loadFailed: "PDF 載入失敗，請開啟原始 PDF。",
        firstPage: "第一頁",
        previousPage: "上一頁",
        nextPage: "下一頁",
        lastPage: "最後一頁",
        download: "下載 PDF",
        fullscreen: "全螢幕",
        exitFullscreen: "離開全螢幕",
        pageInputLabel: "輸入 PDF 頁碼 (按下 Enter 前往)",
        pageInputPrefix: "", //第
        pageInputSuffix: pageCount => `/ ${pageCount}`, // `頁 / 共 ${pageCount} 頁`
        pageStatus: (pageNumber, pageCount) => `第 ${pageNumber} 頁 / 共 ${pageCount} 頁`,
    };
};

/** 建立英文 PDF Viewer 文字。 */
const buildEnglishPdfViewerText = (): CmsPdfViewerText =>
{
    return {
        toolbarLabel: "PDF viewer toolbar",
        openOriginal: "Open original PDF",
        fallbackHint: "Open the original PDF if the viewer cannot display it correctly.",
        loading: "Loading PDF...",
        loadFailed: "Unable to load the PDF. Please open the original PDF.",
        firstPage: "First page",
        previousPage: "Previous page",
        nextPage: "Next page",
        lastPage: "Last page",
        download: "Download PDF",
        fullscreen: "Fullscreen",
        exitFullscreen: "Exit fullscreen",
        pageInputLabel: "Enter PDF page number",
        pageInputPrefix: "Page",
        pageInputSuffix: pageCount => `of ${pageCount}`,
        pageStatus: (pageNumber, pageCount) => `Page ${pageNumber} of ${pageCount}`,
    };
};
// #endregion
