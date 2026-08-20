import { clsx } from "clsx";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { LibModalProp } from "./LibModal_Data";

// #region Property
type Extended = LibModalProp & {
    onConfirm?: () => void | Promise<void>;
    onCancel?: () => void;
    confirmDisabled?: boolean;
    confirmBusy?: boolean;
    confirmAutoClose?: boolean;
    openButtonClassName?: string;
};
// #endregion

// #region Public
/** 共用 Bootstrap Modal，可選擇 Portal 到 body 避免父層 stacking context 影響。 */
export const LibModal = ({ children, ...prop }: Extended) =>
{
    const uid = useId();
    const modalRef = useRef<HTMLDivElement>(null);
    const [innerBusy, setInnerBusy] = useState(false);
    const [portalReady, setPortalReady] = useState(false);

    useEffect(() =>
    {
        if (prop.PortalToBody) setPortalReady(true);
    }, [prop.PortalToBody]);

    /** 取得目前頁面的 Bootstrap Modal 實例，並保留舊版相容後援。 */
    const getModal = () =>
    {
        const el = modalRef.current;
        if (!el || typeof window === "undefined") return null;
        const w = window as any;
        const bs = w.bootstrap;
        const Modal = bs?.Modal;
        if (typeof Modal?.getOrCreateInstance === "function") return Modal.getOrCreateInstance(el, { backdrop: "static", keyboard: false });
        if (typeof Modal?.getInstance === "function") return Modal.getInstance(el) || new Modal(el, { backdrop: "static", keyboard: false });
        const $ = w.jQuery || w.$;
        if ($?.fn?.modal)
        {
            return { show: () => $(el).modal({ backdrop: "static", keyboard: false }).modal("show"), hide: () => $(el).modal("hide") } as {
                show: () => void;
                hide: () => void;
            };
        }
        if (typeof Modal === "function") return new Modal(el, { backdrop: "static", keyboard: false });
        return null;
    };

    /** 開啟 Modal。 */
    const openModal = () =>
    {
        const modal = getModal();
        modal?.show();
    };

    /** 關閉 Modal。 */
    const closeModal = () =>
    {
        const modal = getModal();
        modal?.hide();
    };

    /** 執行取消事件後關閉 Modal。 */
    const handleCancel = () =>
    {
        prop.onCancel?.();
        closeModal();
    };

    /** 執行確認動作並依設定決定是否自動關閉 Modal。 */
    const handleConfirm = async () =>
    {
        if (!prop.onConfirm)
        {
            closeModal();
            return;
        }
        try
        {
            if (prop.confirmBusy === undefined) setInnerBusy(true);
            await prop.onConfirm();
            if (prop.confirmAutoClose !== false) closeModal();
        }
        finally
        {
            if (prop.confirmBusy === undefined) setInnerBusy(false);
        }
    };

    const disabled = Boolean(prop.confirmDisabled || prop.confirmBusy || innerBusy);
    const busy = Boolean(prop.confirmBusy || innerBusy);
    const modalId = `modal-${uid}`;
    const titleId = `title-${uid}`;
    const modalContent = (
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
                    <div className="modal-body">{children}</div>
                    <div className="modal-footer">
                        <button type="button" className="btn btn-secondary btn-sm m-2" onClick={handleCancel}>{prop.BtnName1 ?? "關閉"}</button>
                        <button type="button" className="btn btn-primary btn-sm m-2" onClick={handleConfirm} disabled={disabled} aria-busy={busy}>
                            {busy ? "處理中…" : (prop.BtnName2 ?? "儲存")}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div id={`modal-wrap-${uid}`}>
            <button className={clsx("btn btn-custom btn-sm m-2", prop.openButtonClassName)} onClick={openModal} type="button">
                {prop.OpenButtonText ?? prop.ModalName}
            </button>
            {prop.PortalToBody && portalReady ? createPortal(modalContent, document.body) : modalContent}
        </div>
    );
};
// #endregion
