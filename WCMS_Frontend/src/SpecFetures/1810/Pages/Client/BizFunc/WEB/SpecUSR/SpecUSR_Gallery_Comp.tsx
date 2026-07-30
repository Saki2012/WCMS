// src/SpecFeatures/1810/Pages/Client/SpecUSR/SpecUSR_Gallery_Comp.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Lightbox & plugins（與 GalleryForm.tsx 相同）
import Lightbox from "yet-another-react-lightbox";
import Captions from "yet-another-react-lightbox/plugins/captions";
import Counter from "yet-another-react-lightbox/plugins/counter";
import Download from "yet-another-react-lightbox/plugins/download";
import Fullscreen from "yet-another-react-lightbox/plugins/fullscreen";
import Share from "yet-another-react-lightbox/plugins/share";
import Thumbnails from "yet-another-react-lightbox/plugins/thumbnails";
import Zoom from "yet-another-react-lightbox/plugins/zoom";
import "yet-another-react-lightbox/styles.css";
import "yet-another-react-lightbox/plugins/captions.css";
import "yet-another-react-lightbox/plugins/counter.css";
import "yet-another-react-lightbox/plugins/thumbnails.css";

// #region Property
/** 單張相片資料 */
export interface ISpecUSRPhoto
{
    id: string;
    thumbUrl?: string;
    fullUrl?: string;
    alt?: string;
    width?: number;
    height?: number;
}


/** 元件參數 */
export interface ISpecUSR_Gallery_Props
{
    open: boolean;
    title?: string;
    photos: ISpecUSRPhoto[];
    onClose: () => void;
    onPick?: (photo: ISpecUSRPhoto, index: number) => void;
}


const OVERLAY_Z = 4000;
// #endregion

// #region Public
export const SpecUSR_Gallery_Comp: React.FC<ISpecUSR_Gallery_Props> = ({ open, title = "相簿", photos, onClose, onPick }) =>
{
    const dialogRef = useRef<HTMLDivElement>(null);
    const closeBtnRef = useRef<HTMLButtonElement>(null);

    const [viewerOpen, setViewerOpen] = useState(false);
    const [viewerIndex, setViewerIndex] = useState(0);

    useLockBodyScroll(open);
    useRestoreFocus(open, closeBtnRef);

    // Esc：優先關掉 Lightbox，否則才關相簿；同時做簡易 Tab 焦點陷阱
    useEffect(() =>
    {
        if (!open || import.meta.env.SSR) return;
        const h = (e: KeyboardEvent) =>
        {
            if (e.key === "Escape")
            {
                if (viewerOpen)
                {
                    setViewerOpen(false);
                    e.stopPropagation();
                    e.preventDefault();
                    return;
                }
                onClose();
            }
            if (e.key !== "Tab") return;
            const dlg = dialogRef.current;
            if (!dlg) return;
            const f = dlg.querySelectorAll<HTMLElement>("button,[href],input,select,textarea,[tabindex]:not([tabindex=\"-1\"])");
            if (!f.length) return;
            const first = f[0], last = f[f.length - 1];
            if (e.shiftKey && document.activeElement === first)
            {
                last.focus();
                e.preventDefault();
            } else if (!e.shiftKey && document.activeElement === last)
            {
                first.focus();
                e.preventDefault();
            }
        };
        document.addEventListener("keydown", h);
        return () => document.removeEventListener("keydown", h);
    }, [open, onClose, viewerOpen]);

    const gridStyle = useMemo<React.CSSProperties>(() => ({ display: "grid", gap: "12px", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))" }), []);

    const slides = useMemo(
        () => photos.map(p => ({ src: p.fullUrl ?? p.thumbUrl ?? `/Service/FileManagement/Public_Preview/${p.id}`, description: p.alt ?? "" })),
        [photos],
    );

    if (!open || import.meta.env.SSR) return null;

    // 只在真正點到「背景」且 viewer 沒開時關閉
    const handleOverlayMouseDown = (e: React.MouseEvent<HTMLDivElement>) =>
    {
        if (viewerOpen) return;
        if (e.target === e.currentTarget) onClose();
    };
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) =>
    {
        if (viewerOpen) return;
        if (e.target === e.currentTarget) onClose();
    };

    return createPortal(
        <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="specusr-gallery-title"
            style={{ position: "fixed", inset: 0, zIndex: OVERLAY_Z, background: "rgba(0,0,0,.6)", display: "flex" }}
            onMouseDown={handleOverlayMouseDown}
            onClick={handleOverlayClick}
        >
            <div
                ref={dialogRef}
                tabIndex={-1}
                // 在捕獲階段就阻斷指標事件，避免冒泡到遮罩而關閉
                onPointerDownCapture={(e) => e.stopPropagation()}
                onMouseDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                    margin: "auto",
                    background: "#fff",
                    borderRadius: 16,
                    boxShadow: "0 10px 40px rgba(0,0,0,.2)",
                    width: "min(1400px, 96vw)",
                    height: "min(90vh, 900px)",
                    padding: 16,
                    overflow: "auto",
                    outline: "none",
                }}
            >
                <Header title={title} onClose={onClose} closeRef={closeBtnRef} />

                <div style={gridStyle} aria-label="相簿縮圖清單">
                    {photos.map((p, idx) =>
                    {
                        const src = p.thumbUrl ?? `/Service/FileManagement/Public_Preview/${p.id}`;
                        const alt = p.alt ?? "";
                        const w = p.width ?? 300;
                        const h = p.height ?? 300;
                        return (
                            <button
                                key={`${p.id}-${idx}`}
                                type="button"
                                onClick={(e) =>
                                {
                                    e.stopPropagation();
                                    onPick?.(p, idx);
                                    setViewerIndex(idx);
                                    setViewerOpen(true);
                                }}
                                aria-label={`檢視：${alt || "相片"}`}
                                style={{
                                    position: "relative",
                                    width: "100%",
                                    aspectRatio: "1 / 1",
                                    overflow: "hidden",
                                    border: "1px solid #e5e7eb",
                                    borderRadius: 8,
                                    padding: 0,
                                    background: "#fff",
                                    cursor: "pointer",
                                }}
                            >
                                <img
                                    src={src}
                                    alt={alt}
                                    loading="lazy"
                                    width={w}
                                    height={h}
                                    style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
                                />
                            </button>
                        );
                    })}

                    {photos.length === 0 && <div style={{ gridColumn: "1/-1", color: "#6b7280" }}>目前沒有可顯示的相片。</div>}
                </div>
            </div>

            {/* Lightbox：只在 CSR 顯示 */}
            {viewerOpen && !import.meta.env.SSR && (
                <Lightbox
                    open={viewerOpen}
                    close={() => setViewerOpen(false)}
                    index={viewerIndex}
                    slides={slides}
                    plugins={[Download, Captions, Share, Counter, Fullscreen, Zoom, Thumbnails]}
                    captions={{ descriptionTextAlign: "center" }}
                />
            )}
        </div>,
        document.body,
    );
};
// #endregion

// #region Private
 // 高過任何其它 modal/backdrop

/** 開啟時鎖定 body 滾動 */
const useLockBodyScroll = (lock: boolean) =>
{
    useEffect(() =>
    {
        if (!lock || import.meta.env.SSR) return;
        const prev = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () =>
        {
            document.body.style.overflow = prev;
        };
    }, [lock]);
};


/** 開啟時將焦點移入，關閉後歸還焦點 */
const useRestoreFocus = (active: boolean, focusRef: React.RefObject<HTMLElement>) =>
{
    const prevRef = useRef<HTMLElement | null>(null);
    useEffect(() =>
    {
        if (import.meta.env.SSR) return;
        if (active)
        {
            prevRef.current = document.activeElement as HTMLElement;
            focusRef.current?.focus();
        } else prevRef.current?.focus?.();
    }, [active]);
};


/** Header（關閉鈕可聚焦） */
const Header: React.FC<{ title: string; onClose: () => void; closeRef: React.RefObject<HTMLButtonElement>; }> = ({ title, onClose, closeRef }) => (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
        <h2 id="specusr-gallery-title" style={{ fontSize: 18, margin: 0 }}>{title}</h2>
        <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="關閉相簿"
            style={{ fontSize: 20, lineHeight: 1, padding: "4px 8px", background: "transparent", border: "none", cursor: "pointer" }}
        >
            ×
        </button>
    </div>
);
// #endregion
