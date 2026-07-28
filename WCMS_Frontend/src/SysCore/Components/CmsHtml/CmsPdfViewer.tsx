import PdfWorkerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";
import { type KeyboardEvent, type MutableRefObject, type ReactElement, type RefObject, useCallback, useEffect, useRef, useState } from "react";

// #region Property
export interface CmsPdfViewerProps
{
    fileUrl: string;
    title: string;
    text: CmsPdfViewerText;
}

export interface CmsPdfViewerText
{
    toolbarLabel: string;
    openOriginal: string;
    fallbackHint: string;
    loading: string;
    loadFailed: string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
    download: string;
    fullscreen: string;
    exitFullscreen: string;
    pageInputLabel: string;
    pageInputPrefix: string;
    pageInputSuffix: (pageCount: number) => string;
    pageStatus: (pageNumber: number, pageCount: number) => string;
}

type PdfDocumentProxy = import("pdfjs-dist").PDFDocumentProxy;

type PdfRenderTask = { promise: Promise<unknown>; cancel: () => void; };

const PDF_RENDER_SCALE = 1;
// #endregion

// #region Public
/** 使用 pdfjs-dist 將 PDF 單頁渲染為 canvas，避免手機 iframe PDF 顯示空白。 */
export const CmsPdfViewer = (props: CmsPdfViewerProps): ReactElement =>
{
    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const containerRef = useRef<HTMLSpanElement | null>(null);
    const renderTaskRef = useRef<PdfRenderTask | null>(null);
    const [pdf, setPdf] = useState<PdfDocumentProxy | null>(null);
    const [pageNumber, setPageNumber] = useState(1);
    const [pageCount, setPageCount] = useState(0);
    const [pageInputValue, setPageInputValue] = useState("1");
    const [containerWidth, setContainerWidth] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [errorText, setErrorText] = useState("");
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [fullscreenSupported, setFullscreenSupported] = useState(false);

    usePdfContainerObserver(containerRef, setContainerWidth);
    usePdfFullscreenState(containerRef, setIsFullscreen, setFullscreenSupported);
    usePdfPageInputSync(pageNumber, setPageInputValue);
    usePdfDocumentLoader(props.fileUrl, props.text.loadFailed, setPdf, setPageCount, setPageNumber, setIsLoading, setErrorText);
    usePdfPageRenderer(pdf, pageNumber, containerWidth, props.text.loadFailed, canvasRef, renderTaskRef, setErrorText);

    const canGoPrevious = pageNumber > 1;
    const canGoNext = pageCount > 0 && pageNumber < pageCount;

    return (
        <span className={resolveViewerClass(isFullscreen)} ref={containerRef}>
            <PdfToolbar
                pageNumber={pageNumber}
                pageCount={pageCount}
                pageInputValue={pageInputValue}
                text={props.text}
                fileUrl={props.fileUrl}
                title={props.title}
                canGoPrevious={canGoPrevious}
                canGoNext={canGoNext}
                isFullscreen={isFullscreen}
                fullscreenSupported={fullscreenSupported}
                onFirst={() => setPageNumber(1)}
                onPrevious={() => setPageNumber(value => Math.max(1, value - 1))}
                onNext={() => setPageNumber(value => Math.min(pageCount, value + 1))}
                onLast={() => setPageNumber(pageCount)}
                onPageInputChange={setPageInputValue}
                onPageInputCommit={() => commitPdfPageInput(pageInputValue, pageNumber, pageCount, setPageNumber, setPageInputValue)}
                onToggleFullscreen={() => void togglePdfFullscreen(containerRef.current)}
            />
            <span className="cms-pdf-viewer-canvas-wrap">
                {isLoading && <span className="cms-pdf-viewer-message">{props.text.loading}</span>}
                {errorText && <span className="cms-pdf-viewer-message" role="alert">{errorText}</span>}
                <canvas ref={canvasRef} title={props.title} aria-label={props.title} className="cms-pdf-viewer-canvas" />
            </span>
        </span>
    );
};
// #endregion

// #region Section
/** PDF Viewer 工具列。 */
const PdfToolbar = (props: PdfToolbarProps): ReactElement =>
{
    const fullscreenLabel = props.isFullscreen ? props.text.exitFullscreen : props.text.fullscreen;
    return (
        <span className="cms-pdf-viewer-toolbar" role="toolbar" aria-label={props.text.toolbarLabel}>
            <PdfToolbarButton label={props.text.firstPage} iconClassName="fas fa-arrow-to-left" onClick={props.onFirst} disabled={!props.canGoPrevious} />
            <PdfToolbarButton label={props.text.previousPage} iconClassName="fas fa-long-arrow-left" onClick={props.onPrevious} disabled={!props.canGoPrevious} />
            <PageJumpControl
                pageNumber={props.pageNumber}
                pageCount={props.pageCount}
                pageInputValue={props.pageInputValue}
                text={props.text}
                onPageInputChange={props.onPageInputChange}
                onPageInputCommit={props.onPageInputCommit}
            />
            <PdfToolbarButton label={props.text.nextPage} iconClassName="fas fa-long-arrow-right" onClick={props.onNext} disabled={!props.canGoNext} />
            <PdfToolbarButton label={props.text.lastPage} iconClassName="fas fa-arrow-to-right" onClick={props.onLast} disabled={!props.canGoNext} />
            {props.fullscreenSupported && <PdfToolbarButton label={fullscreenLabel} iconClassName="fas fa-expand-wide" className="cms-pdf-viewer-fullscreen-action cms-pdf-viewer-divider" onClick={props.onToggleFullscreen} />}
            <PdfDownloadLink fileUrl={props.fileUrl} fileName={resolveDownloadFileName(props.title)} label={props.text.download} />
        </span>
    );
};

/** PDF Viewer 頁碼輸入控制項，離開欄位或按 Enter 時直接切換頁面。 */
const PageJumpControl = (props: PageJumpControlProps): ReactElement =>
{
    const pageCount = props.pageCount || 1;
    return (
        <span className="cms-pdf-viewer-page-jump" aria-label={props.text.pageStatus(props.pageNumber, pageCount)} aria-live="polite">
            <span aria-hidden="true">{props.text.pageInputPrefix}</span>
            <input
                type="number"
                min={1}
                max={pageCount}
                value={props.pageInputValue}
                title={props.text.pageInputLabel}
                aria-label={props.text.pageInputLabel}
                className="cms-pdf-viewer-page-input"
                disabled={props.pageCount <= 0}
                onChange={event => props.onPageInputChange(event.target.value)}
                onBlur={props.onPageInputCommit}
                onKeyDown={event => handlePageInputKeyDown(event, props)}
            />
            <span aria-hidden="true">{props.text.pageInputSuffix(pageCount)}</span>
        </span>
    );
};
// #endregion

// #region EntityComp
/** 建立具備 title 與 aria-label 的 PDF 工具列圖示按鈕。 */
const PdfToolbarButton = (props: PdfToolbarButtonProps): ReactElement =>
{
    const className = ["cms-pdf-viewer-toolbar-action", props.className].filter(Boolean).join(" ");
    return (
        <button type="button" title={props.label} aria-label={props.label} className={className} onClick={props.onClick} disabled={props.disabled}>
            <i className={props.iconClassName} aria-hidden="true" />
        </button>
    );
};

/** 建立具備 title 與 aria-label 的 PDF 下載圖示連結。 */
const PdfDownloadLink = (props: PdfDownloadLinkProps): ReactElement =>
{
    return (
        <a href={props.fileUrl} download={props.fileName} target="_blank" rel="noopener noreferrer" title={props.label} aria-label={props.label} className="cms-pdf-viewer-toolbar-link cms-pdf-viewer-divider">
            <i className="fas fa-download" aria-hidden="true" />
        </a>
    );
};
// #endregion

// #region Private
interface PdfToolbarProps
{
    pageNumber: number;
    pageCount: number;
    pageInputValue: string;
    text: CmsPdfViewerText;
    fileUrl: string;
    title: string;
    canGoPrevious: boolean;
    canGoNext: boolean;
    isFullscreen: boolean;
    fullscreenSupported: boolean;
    onFirst: () => void;
    onPrevious: () => void;
    onNext: () => void;
    onLast: () => void;
    onPageInputChange: (value: string) => void;
    onPageInputCommit: () => void;
    onToggleFullscreen: () => void;
}

interface PageJumpControlProps
{
    pageNumber: number;
    pageCount: number;
    pageInputValue: string;
    text: CmsPdfViewerText;
    onPageInputChange: (value: string) => void;
    onPageInputCommit: () => void;
}

interface PdfToolbarButtonProps
{
    label: string;
    iconClassName: string;
    className?: string;
    disabled?: boolean;
    onClick: () => void;
}

interface PdfDownloadLinkProps
{
    fileUrl: string;
    fileName: string;
    label: string;
}

/** 監聽 PDF Viewer 容器寬度，供 canvas RWD 縮放使用。 */
const usePdfContainerObserver = (ref: RefObject<HTMLElement | null>, setWidth: (width: number) => void): void =>
{
    useEffect(() =>
    {
        const el = ref.current;
        if (!el) return;
        const updateWidth = () => setWidth(Math.floor(el.clientWidth));
        updateWidth();
        const observer = new ResizeObserver(updateWidth);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, setWidth]);
};

/** 監聽 PDF Viewer 全螢幕狀態。 */
const usePdfFullscreenState = (
    ref: RefObject<HTMLElement | null>,
    setIsFullscreen: (value: boolean) => void,
    setSupported: (value: boolean) => void,
): void =>
{
    useEffect(() =>
    {
        const updateState = () => setIsFullscreen(document.fullscreenElement === ref.current);
        setSupported(Boolean(document.fullscreenEnabled && ref.current?.requestFullscreen));
        updateState();
        document.addEventListener("fullscreenchange", updateState);
        return () => document.removeEventListener("fullscreenchange", updateState);
    }, [ref, setIsFullscreen, setSupported]);
};

/** 同步目前頁碼到頁碼輸入欄位。 */
const usePdfPageInputSync = (pageNumber: number, setPageInputValue: (value: string) => void): void =>
{
    useEffect(() =>
    {
        setPageInputValue(`${pageNumber}`);
    }, [pageNumber, setPageInputValue]);
};

/** 載入 PDF 文件並記錄總頁數。 */
const usePdfDocumentLoader = (
    fileUrl: string,
    loadFailedText: string,
    setPdf: (pdf: PdfDocumentProxy | null) => void,
    setPageCount: (count: number) => void,
    setPageNumber: (page: number) => void,
    setIsLoading: (value: boolean) => void,
    setErrorText: (value: string) => void,
): void =>
{
    useEffect(() =>
    {
        let disposed = false;
        setIsLoading(true);
        setErrorText("");
        loadPdfDocument(fileUrl).then(pdf => handlePdfLoaded(disposed, pdf, setPdf, setPageCount, setPageNumber)).catch(() => handlePdfLoadFailed(disposed, loadFailedText, setErrorText)).finally(() =>
        {
            if (!disposed) setIsLoading(false);
        });
        return () =>
        {
            disposed = true;
            setPdf(null);
        };
    }, [fileUrl, loadFailedText, setPdf, setPageCount, setPageNumber, setIsLoading, setErrorText]);
};

/** 渲染目前頁面的 PDF canvas。 */
const usePdfPageRenderer = (
    pdf: PdfDocumentProxy | null,
    pageNumber: number,
    containerWidth: number,
    loadFailedText: string,
    canvasRef: RefObject<HTMLCanvasElement | null>,
    renderTaskRef: MutableRefObject<PdfRenderTask | null>,
    setErrorText: (value: string) => void,
): void =>
{
    const renderPage = useCallback(() =>
    {
        if (!pdf || containerWidth <= 0) return Promise.resolve();
        return renderPdfPage(pdf, pageNumber, containerWidth, canvasRef, renderTaskRef);
    }, [pdf, pageNumber, containerWidth, canvasRef, renderTaskRef]);

    useEffect(() =>
    {
        let disposed = false;
        renderPage().then(() =>
        {
            if (!disposed && pdf) setErrorText("");
        }).catch(error =>
        {
            if (!disposed && !isPdfRenderCancelled(error)) setErrorText(loadFailedText);
        });
        return () =>
        {
            disposed = true;
            cancelPdfRenderTask(renderTaskRef);
        };
    }, [renderPage, pdf, loadFailedText, renderTaskRef, setErrorText]);
};

/** 送出頁碼輸入並切換到合法頁面。 */
const commitPdfPageInput = (
    value: string,
    pageNumber: number,
    pageCount: number,
    setPageNumber: (page: number) => void,
    setPageInputValue: (value: string) => void,
): void =>
{
    const nextPage = resolveValidPageNumber(value, pageNumber, pageCount);
    setPageNumber(nextPage);
    setPageInputValue(`${nextPage}`);
};

/** 處理頁碼輸入快捷鍵。 */
const handlePageInputKeyDown = (event: KeyboardEvent<HTMLInputElement>, props: PageJumpControlProps): void =>
{
    if (event.key === "Enter")
    {
        event.preventDefault();
        props.onPageInputCommit();
    }
    if (event.key === "Escape") props.onPageInputChange(`${props.pageNumber}`);
};

/** 將頁碼輸入修正為合法頁碼。 */
const resolveValidPageNumber = (value: string, fallbackPage: number, pageCount: number): number =>
{
    const maxPage = Math.max(1, pageCount || 1);
    const parsedPage = Number.parseInt(value, 10);
    if (!Number.isFinite(parsedPage)) return fallbackPage;
    return Math.min(maxPage, Math.max(1, parsedPage));
};

/** 動態載入 pdfjs-dist，避免 SSR 階段碰到瀏覽器 API。 */
const loadPdfDocument = async (fileUrl: string): Promise<PdfDocumentProxy> =>
{
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = PdfWorkerUrl;
    return await pdfjs.getDocument({ url: fileUrl }).promise;
};

/** PDF 載入完成後同步 Viewer 狀態。 */
const handlePdfLoaded = (
    disposed: boolean,
    pdf: PdfDocumentProxy,
    setPdf: (pdf: PdfDocumentProxy | null) => void,
    setPageCount: (count: number) => void,
    setPageNumber: (page: number) => void,
): void =>
{
    if (disposed) return;
    setPdf(pdf);
    setPageCount(pdf.numPages);
    setPageNumber(1);
};

/** PDF 載入失敗後顯示錯誤提示。 */
const handlePdfLoadFailed = (disposed: boolean, message: string, setErrorText: (value: string) => void): void =>
{
    if (disposed) return;
    setErrorText(message);
};

/** 將指定頁面渲染到 canvas。 */
const renderPdfPage = async (
    pdf: PdfDocumentProxy,
    pageNumber: number,
    containerWidth: number,
    canvasRef: RefObject<HTMLCanvasElement | null>,
    renderTaskRef: MutableRefObject<PdfRenderTask | null>,
): Promise<void> =>
{
    const page = await pdf.getPage(pageNumber);
    const viewport = page.getViewport({ scale: resolveCanvasScale(page, containerWidth) });
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context) return;
    cancelPdfRenderTask(renderTaskRef);
    resizeCanvas(canvas, context, viewport.width, viewport.height);
    renderTaskRef.current = page.render({ canvas, canvasContext: context, viewport });
    await renderTaskRef.current.promise;
};

/** 判斷 PDF render task 是否只是被新版渲染流程取消。 */
const isPdfRenderCancelled = (error: unknown): boolean =>
{
    const name = `${(error as { name?: string } | null)?.name ?? ""}`;
    return name === "RenderingCancelledException";
};

/** 依容器寬度計算 PDF render scale。 */
const resolveCanvasScale = (page: Awaited<ReturnType<PdfDocumentProxy["getPage"]>>, containerWidth: number): number =>
{
    const baseViewport = page.getViewport({ scale: PDF_RENDER_SCALE });
    return Math.max(0.1, (containerWidth - 24) / baseViewport.width);
};

/** 依裝置解析度調整 canvas 尺寸。 */
const resizeCanvas = (canvas: HTMLCanvasElement, context: CanvasRenderingContext2D, width: number, height: number): void =>
{
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * ratio);
    canvas.height = Math.floor(height * ratio);
    canvas.style.width = `${Math.floor(width)}px`;
    canvas.style.height = `${Math.floor(height)}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
};

/** 取消尚未完成的 PDF render task。 */
const cancelPdfRenderTask = (renderTaskRef: MutableRefObject<PdfRenderTask | null>): void =>
{
    try
    {
        renderTaskRef.current?.cancel();
    } finally
    {
        renderTaskRef.current = null;
    }
};

/** 切換 PDF Viewer 全螢幕狀態。 */
const togglePdfFullscreen = async (el: HTMLElement | null): Promise<void> =>
{
    if (!el) return;
    if (document.fullscreenElement)
    {
        await document.exitFullscreen();
        return;
    }
    await el.requestFullscreen();
};

/** 建立 PDF Viewer 容器 className。 */
const resolveViewerClass = (isFullscreen: boolean): string =>
{
    return isFullscreen ? "cms-pdf-viewer cms-pdf-viewer--fullscreen" : "cms-pdf-viewer";
};

/** 建立 PDF 下載檔名。 */
const resolveDownloadFileName = (title: string): string =>
{
    const fileName = title.trim() || "document";
    return fileName.toLowerCase().endsWith(".pdf") ? fileName : `${fileName}.pdf`;
};
// #endregion
