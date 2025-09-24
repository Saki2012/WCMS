import { useId, useRef, useState } from "react";
import type { LibModalProp } from "./LibModal_Data";
import { clsx } from "clsx";

type Extended = LibModalProp & {
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    confirmDisabled?: boolean;   // 外部控制「儲存」是否可點
    confirmBusy?: boolean;       // 外部顯示上傳中…
    confirmAutoClose?: boolean;  // 預設 true；onConfirm 成功後自動關閉
    openButtonClassName?: string;
};

const LibModal = ({ children, ...prop }: Extended) => {
    const uid = useId();
    const modalRef = useRef<HTMLDivElement>(null);
    const [innerBusy, setInnerBusy] = useState(false);

    const hasBootstrap = typeof window !== "undefined" && (window as any).bootstrap;
    const getModal = () => {
        if (!hasBootstrap || !modalRef.current) return null;
        const Modal = (window as any).bootstrap.Modal;
        return Modal.getInstance(modalRef.current) ?? new Modal(modalRef.current);
    };

    const openModal = () => { const m = getModal(); m?.show(); };
    const closeModal = () => { const m = getModal(); m?.hide(); };

    const handleCancel = () => {
        prop.onCancel?.();
        closeModal();
    };

    const handleConfirm = async () => {
        if (!prop.onConfirm) { closeModal(); return; }
        try {
            // 允許外部用 confirmBusy 控制；若外部沒給才用內部 busy
            if (prop.confirmBusy === undefined) setInnerBusy(true);
            await prop.onConfirm();
            if (prop.confirmAutoClose !== false) closeModal();
        } finally {
            if (prop.confirmBusy === undefined) setInnerBusy(false);
        }
    };

    const disabled = Boolean(prop.confirmDisabled || prop.confirmBusy || innerBusy);
    const busy = Boolean(prop.confirmBusy || innerBusy);

    const modalId = `modal-${uid}`;
    const titleId = `title-${uid}`;

    return (
        <div id={`modal-wrap-${uid}`}>
            <button
                className={clsx("btn btn-custom btn-sm m-2", prop.openButtonClassName)}
                onClick={openModal}
                type="button"
            >
                {prop.ModalName}
            </button>

            <div
                className="modal fade"
                ref={modalRef}
                tabIndex={-1}
                id={modalId}
                data-bs-backdrop="static"
                data-bs-keyboard="false"
                aria-labelledby={titleId}
                aria-hidden="true"
                role="dialog"
            >
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                            <h5 className="modal-title" id={titleId}>{prop.ModalName}</h5>
                            <button type="button" className="btn-close" aria-label="Close" onClick={handleCancel} />
                        </div>

                        <div className="modal-body">
                            {children}
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-secondary btn-sm m-2" onClick={handleCancel}>
                                {prop.BtnName1 ?? "關閉"}
                            </button>

                            <button
                                type="button"
                                className="btn btn-primary btn-sm m-2"
                                onClick={handleConfirm}
                                disabled={disabled}
                                aria-busy={busy}
                            >
                                {busy ? "處理中…" : (prop.BtnName2 ?? "儲存")}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LibModal;