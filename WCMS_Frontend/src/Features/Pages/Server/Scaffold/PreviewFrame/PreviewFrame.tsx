// src/preview/PreviewFrame.tsx
import React, { useEffect, useMemo, useRef } from "react";

export interface PreviewFrameProps {
    /** 是否顯示 */
    open: boolean;
    /** 站台索引：會導向 `/${siteIndex}/Template` */
    siteIndex: string;
    /** 對話框標題（AA） */
    title?: string;
    /** 關閉事件 */
    onClose: () => void;
    /**
     * 要送進 Template 的預覽指令（建議遵守 { type:'wcms:preview', module, payload } 格式）
     * 例如：
     * { type:'wcms:preview', module:'announcement', payload:{ kind:'dto', lang, dto } }
     * { type:'wcms:preview', module:'announcement', payload:{ kind:'internalId', lang, mode:'db'|'public', internalId } }
     */
    payload?: unknown;
    /**
     * postMessage 的目標網域，預設同源（window.location.origin）
     * 若你的前台與後台不同網域，請改成白名單網域
     */
    targetOrigin?: string;
    /** 標題列右側自訂區（切語系、刷新等） */
    headerRight?: React.ReactNode;
    /** 視窗底部自訂區塊（可選） */
    footer?: React.ReactNode;
    /** 允許的 iFrame 能力；需要時再傳（e.g. "fullscreen; clipboard-read"） */
    allow?: string;
    /** iFrame sandbox；若有 CSP/白名單再開（e.g. "allow-same-origin allow-scripts"） */
    sandbox?: string;
    /** 視窗寬度（Tailwind 類似的樣式字串）預設 min(1280px,95vw) */
    widthClassName?: string;
}

export const PreviewFrame: React.FC<PreviewFrameProps> = (props) => {
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
        widthClassName = "w-[min(1280px,95vw)]",
    } = props;

    // 單一路由：/{siteIndex}/Template
    const src = useMemo(() => siteIndex === '' ? `/Template` : `/${siteIndex}/Template`, [siteIndex]);

    const iframeRef = useRef<HTMLIFrameElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const lastActiveEl = useRef<HTMLElement | null>(null);

    // 開啟時：鎖捲動、監聽 ESC、聚焦到對話框；關閉時還原
    useEffect(() => {
        if (!open) return;
        lastActiveEl.current = (document.activeElement as HTMLElement) ?? null;

        const handleKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        document.addEventListener("keydown", handleKey);

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";

        // 對話框取得焦點（AA）
        dialogRef.current?.focus?.();

        return () => {
            document.removeEventListener("keydown", handleKey);
            document.body.style.overflow = prevOverflow;
            lastActiveEl.current?.focus?.();
        };
    }, [open, onClose]);

    // iFrame 載入完成 → 若有 payload，送進去（postMessage）
    useEffect(() => {
        if (!open || !iframeRef.current) return;

        const frame = iframeRef.current;
        const handleLoad = () => {
            if (payload != null) {
                try {
                    frame.contentWindow?.postMessage(payload, targetOrigin);
                } catch {
                    // 靜默失敗（跨網域或 iFrame 尚未可用）
                }
            }
        };

        frame.addEventListener("load", handleLoad);
        return () => frame.removeEventListener("load", handleLoad);
    }, [open, payload, targetOrigin]);

    // 未開啟就不渲染（避免背景可點）
    if (!open) return null;

    return (
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="preview-title"
            className="fixed inset-0 z-[1000] flex"
        >
            {/* 背景遮罩（點擊關閉） */}
            <div className="flex-1 bg-black/40" aria-hidden onClick={onClose} />

            {/* 視窗主體 */}
            <div
                ref={dialogRef}
                tabIndex={-1}
                className={`${widthClassName} h-full bg-white shadow-2xl outline-none flex flex-col`}
            >
                {/* 標題列 */}
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <h2 id="preview-title" className="text-base font-semibold">{title}</h2>
                    <div className="flex items-center gap-2">
                        {headerRight}
                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="關閉預覽"
                            className="px-2 py-1"
                        >
                            ✕
                        </button>
                    </div>
                </div>

                {/* iFrame 主體（填滿） */}
                <iframe
                    ref={iframeRef}
                    title={title}
                    src={src}
                    className="w-full flex-1"
                    allow={allow}
                    sandbox={sandbox}
                />

                {/* 底部（選用） */}
                {footer ? <div className="border-t px-3 py-2">{footer}</div> : null}
            </div>
        </div>
    );
};
