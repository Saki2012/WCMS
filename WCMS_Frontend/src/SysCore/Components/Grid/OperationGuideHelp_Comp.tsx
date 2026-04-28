import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import "./OperationGuideHelp_Comp.css";
import { DefaultLang, type Lang } from "@/SysCore/i18n/lang";
import img from "./GridListOperationGuide.gif";

export const OperationGuideHelp_Comp = (props: { lang?: Lang; }) =>
{
    const lang = props.lang ?? DefaultLang;
    const { title, label, description } = useMemo(() =>
    {
        return getOperationGuideHelpText(lang);
    }, [lang]);
    const imageSrc = img;
    const [open, setOpen] = useState(false);
    const dialogId = useId();
    const closeBtnRef = useRef<HTMLButtonElement | null>(null);
    const ariaLabel = description || title || label;
    useEffect(() =>
    {
        if (open && closeBtnRef.current) closeBtnRef.current.focus();
    }, [open]);
    const handleKeyDownBackdrop = (e: React.KeyboardEvent<HTMLDivElement>) =>
    {
        if (e.key === "Escape") setOpen(false);
    };
    return (
        <>
            {/* 觸發按鈕 */}
            <button
                type="button"
                className="wcms-help-trigger"
                aria-haspopup="dialog"
                aria-expanded={open}
                aria-controls={dialogId}
                onClick={() => setOpen(true)}
            >
                <span className="wcms-help-icon" aria-hidden="true">?</span>
                <span className="wcms-help-label">{label}</span>
            </button>

            {/* 簡單的彈出視窗（不跳轉、不另開視窗） */}
            {open && (
                <div className="wcms-help-backdrop" role="presentation" onClick={() => setOpen(false)} onKeyDown={handleKeyDownBackdrop}>
                    <div id={dialogId} className="wcms-help-dialog" role="dialog" aria-modal="true" aria-label={ariaLabel} onClick={(e) => e.stopPropagation()}>
                        <div className="wcms-help-dialog-header">
                            {title && <h2 className="wcms-help-dialog-title">{title}</h2>}
                            <button
                                type="button"
                                className="wcms-help-close-btn"
                                onClick={() => setOpen(false)}
                                ref={closeBtnRef}
                                aria-label="Close help dialog"
                            >
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

const getOperationGuideHelpText = (lang: Lang) =>
{
    // 宣告變數
    const dict: Record<Lang, { title: string; label: string; description: string; }> = {
        "zh-tw": { title: "列表操作示範", label: "游標移至表格欄位時，可自行調整欄寬", description: "示範如何拖曳欄位標題分隔線來調整欄位寬度。" },
        en: {
            title: "List Operation Demo",
            label: "Move the cursor over the table column to adjust the column width.",
            description: "This shows how to drag the divider between column headers to resize columns.",
        },
        "zh-cn": { title: "列表操作示範", label: "游標移至表格欄位時，可自行調整欄寬", description: "示範如何拖曳欄位標題分隔線來調整欄位寬度。" },
    };

    // 執行 function
    const hit = dict[lang];
    const fallback = dict["zh-tw"];

    // return
    return hit ?? fallback;
};
