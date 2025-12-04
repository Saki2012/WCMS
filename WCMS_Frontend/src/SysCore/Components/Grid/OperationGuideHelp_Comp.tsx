import React, { useId, useRef, useState, useEffect } from "react";
import './OperationGuideHelp_Comp.css'
import img from './GridListOperationGuide.gif'


export const OperationGuideHelp_Comp = () => {
    const label = "可自行調整欄位寬度"
    const imageSrc = img
    const title = "列表操作示範"
    const description = "示範如何拖曳欄位標題分隔線來調整欄位寬度。"

    const [open, setOpen] = useState(false);
    const dialogId = useId();
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const ariaLabel = description || title || label;
    useEffect(() => { if (open && closeBtnRef.current) closeBtnRef.current.focus(); }, [open]);
    const handleKeyDownBackdrop = (e: React.KeyboardEvent<HTMLDivElement>) => { if (e.key === "Escape") setOpen(false); };
    return (
        <>
            {/* 觸發按鈕 */}
            <button type="button" className="wcms-help-trigger" aria-haspopup="dialog" aria-expanded={open} aria-controls={dialogId} onClick={() => setOpen(true)}>
                <span className="wcms-help-icon" aria-hidden="true">
                    ?
                </span>
                <span className="wcms-help-label">{label}</span>
            </button>

            {/* 簡單的彈出視窗（不跳轉、不另開視窗） */}
            {open && (
                <div className="wcms-help-backdrop" role="presentation" onClick={() => setOpen(false)} onKeyDown={handleKeyDownBackdrop}>
                    <div id={dialogId} className="wcms-help-dialog" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={(e) => e.stopPropagation()}>
                        <div className="wcms-help-dialog-header">
                            {title && (<h2 className="wcms-help-dialog-title">{title}</h2>)}
                            <button type="button" className="wcms-help-close-btn" onClick={() => setOpen(false)} ref={closeBtnRef} aria-label="Close help dialog">
                                ×
                            </button>
                        </div>
                        <div className="wcms-help-dialog-body">
                            <img src={imageSrc} className="wcms-help-image" alt={ariaLabel} />
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};
