import React, { useCallback, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import type { ServerPreviewMessage } from "./PreviewFrame_Hook";

// #region Property
const previewReadyMessageType = "wcms:preview-ready";
export type PreviewFrameLayoutMode = "dialog" | "panel";

export interface PreviewFrameProps<TPayload = unknown>
{
    /** 是否顯示 */
    open: boolean;
    /** 站台索引：會導向 `/${siteIndex}/Template` */
    siteIndex: string;
    /** 對話框標題（AA） */
    title?: string;
    /** 關閉事件 */
    onClose: () => void;
    /** 要送進 Template 的預覽指令 */
    payload?: ServerPreviewMessage<TPayload>;
    /** postMessage 的目標網域 */
    targetOrigin?: string;
    /** 標題列右側自訂區 */
    headerRight?: React.ReactNode;
    /** 視窗底部自訂區塊 */
    footer?: React.ReactNode;
    /** 允許的 iFrame 能力 */
    allow?: string;
    /** iFrame sandbox */
    sandbox?: string;
    /** 預覽呈現方式，dialog 為近滿版對話窗，panel 為右側抽屜 */
    layoutMode?: PreviewFrameLayoutMode;
}
// #endregion

// #region Public
/** 後台預覽 iframe 視窗，負責將預覽訊息送入前台 TemplateHub。 */
export const PreviewFrame = <TPayload,>(props: PreviewFrameProps<TPayload>) =>
{
    const {
        open,
        siteIndex,
        title = "預覽",
        onClose,
        payload,
        targetOrigin = typeof window !== "undefined" ? window.location.origin : "*",
        headerRight,
        footer,
        allow,
        sandbox,
        layoutMode = "dialog",
    } = props;
    const src = useMemo(() => siteIndex === "" ? `/Template` : `/${siteIndex}/Template`, [siteIndex]);
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const lastActiveEl = useRef<HTMLElement | null>(null);
    /** 將目前預覽 payload 送進 iframe。 */
    const sendPreviewMessage = useCallback(() =>
    {
        if (!open || payload == null) return;
        const frameWindow = iframeRef.current?.contentWindow;
        if (!frameWindow) return;
        try
        {
            frameWindow.postMessage(payload, targetOrigin);
        } catch
        {
            // iframe 尚未可用或目標網域不允許時，維持靜默失敗。
        }
    }, [open, payload, targetOrigin]);
    // 開啟時：鎖捲動、監聽 ESC、聚焦到對話框；關閉時還原。
    useEffect(() =>
    {
        if (!open) return;
        lastActiveEl.current = (document.activeElement as HTMLElement) ?? null;
        const handleKey = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleKey);
        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        dialogRef.current?.focus?.();
        return () =>
        {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = prevOverflow;
            lastActiveEl.current?.focus?.();
        };
    }, [open, onClose]);
    // TemplateHub 通知 ready 後，立即送入目前預覽資料。
    useEffect(() =>
    {
        if (!open) return;
        const handler = (ev: MessageEvent) =>
        {
            if (ev.origin !== window.location.origin) return;
            const message = ev.data as { type?: string; };
            if (message?.type !== previewReadyMessageType) return;
            sendPreviewMessage();
        };
        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [open, sendPreviewMessage]);
    // open 或 payload 更新時補送預覽資料，避免 iframe load 事件太早觸發而漏送。
    useEffect(() =>
    {
        if (!open || payload == null) return;
        const timers = [0, 100, 300].map(delay => window.setTimeout(sendPreviewMessage, delay));
        return () => timers.forEach(timer => window.clearTimeout(timer));
    }, [open, payload, sendPreviewMessage]);
    if (!open || typeof document === "undefined") return null;
    return createPortal(
        <div role="dialog" aria-modal="true" aria-labelledby="preview-title" style={overlayStyle}>
            <div style={backdropStyle} aria-hidden onClick={onClose}></div>
            <div ref={dialogRef} tabIndex={-1} style={resolveDialogStyle(layoutMode)}>
                <PreviewHeader title={title} headerRight={headerRight} onClose={onClose} />
                <iframe ref={iframeRef} title={title} src={src} style={iframeStyle} allow={allow} sandbox={sandbox} onLoad={sendPreviewMessage} />
                {footer ? <div style={footerStyle}>{footer}</div> : null}
            </div>
        </div>,
        document.body,
    );
};
// #endregion

// #region Section
/** 預覽視窗標題列。 */
const PreviewHeader = (props: { title: string; headerRight?: React.ReactNode; onClose: () => void; }) =>
{
    return (
        <div style={headerStyle}>
            <h2 id="preview-title" style={titleStyle}>{props.title}</h2>
            <div style={headerRightStyle}>
                {props.headerRight}
                <button type="button" onClick={props.onClose} aria-label="關閉預覽" style={closeButtonStyle}>✕</button>
            </div>
        </div>
    );
};
// #endregion

// #region Private CSS
const overlayStyle: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    zIndex: 2000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
};

const backdropStyle: React.CSSProperties = {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
};

const dialogBaseStyle: React.CSSProperties = {
    position: "relative",
    backgroundColor: "#fff",
    boxShadow: "0 12px 40px rgba(0, 0, 0, 0.35)",
    outline: "none",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
};

const dialogStyle: React.CSSProperties = {
    ...dialogBaseStyle,
    width: "calc(100vw - 48px)",
    height: "calc(100vh - 48px)",
    borderRadius: "12px",
};

const panelStyle: React.CSSProperties = {
    ...dialogBaseStyle,
    width: "min(1280px, 95vw)",
    height: "100vh",
    marginLeft: "auto",
    borderRadius: 0,
};

const headerStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #dee2e6",
    padding: "0.75rem 1rem",
    flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
    fontSize: "1rem",
    fontWeight: 600,
    margin: 0,
};

const headerRightStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
};

const closeButtonStyle: React.CSSProperties = {
    border: "1px solid #dee2e6",
    backgroundColor: "#fff",
    borderRadius: "0.375rem",
    padding: "0.25rem 0.5rem",
};

const iframeStyle: React.CSSProperties = {
    width: "100%",
    flex: 1,
    border: 0,
};

const footerStyle: React.CSSProperties = {
    borderTop: "1px solid #dee2e6",
    padding: "0.75rem 1rem",
    flexShrink: 0,
};

/** 依照預覽模式取得視窗樣式。 */
const resolveDialogStyle = (mode?: PreviewFrameLayoutMode): React.CSSProperties =>
{
    return mode === "panel" ? panelStyle : dialogStyle;
};
// #endregion
