// src/components/ActionOverlay_Comp.tsx
import * as React from "react";

// #region Property
export interface ActionOverlayProps
{
    show: boolean;
    label?: string;
}
// #endregion

// #region Public
export const ActionOverlay_Comp: React.FC<ActionOverlayProps> = ({ show, label }) =>
{
    if (!show) return null;
    return (
        <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            style={{
                position: "fixed",
                inset: 0,
                zIndex: 4000,
                background: "rgba(33, 37, 41, 0.35)", // 灰底
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                backdropFilter: "blur(1px)",
                pointerEvents: "auto", // 擋住底層點擊
            }}
        >
            <div
                style={{
                    background: "white",
                    color: "#111",
                    minWidth: 320,
                    maxWidth: 420,
                    padding: "16px 20px",
                    borderRadius: 12,
                    boxShadow: "0 10px 30px rgba(0,0,0,0.25)",
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                }}
            >
                {/* 小 spinner */}
                <div
                    aria-hidden="true"
                    style={{
                        width: 22,
                        height: 22,
                        borderRadius: "50%",
                        border: "3px solid #d0d5dd",
                        borderTopColor: "#0d6efd",
                        animation: "spin 1s linear infinite",
                    }}
                />
                <div style={{ fontWeight: 600 }}>{label ?? "處理中…"}</div>
            </div>

            {/* 簡單 spinner keyframes（放在 inline style 也行） */}
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
    );
};
// #endregion
