import { useId, useRef } from "react";
import type {LibModalProp} from "./LibModal_Data"
import { clsx } from "clsx";

const LibModal = ({prop,children}:{prop:LibModalProp;children:React.ReactNode})=>{
    const uid = useId();
    const modalRef = useRef<HTMLDivElement>(null);

    const openModal = () => {
        if (modalRef.current) {
            const modal = new window.bootstrap.Modal(modalRef.current);
            modal.show();
        }
    };
    return(
        <div id={uid}>
            <button className="btn btn-custom btn-sm m-2" onClick={openModal}>
                {`${prop.ModalName}`}
            </button>

            <div className="modal fade" ref={modalRef} tabIndex={-1} id="staticBackdrop" data-bs-backdrop="static" data-bs-keyboard="false" aria-labelledby="staticBackdropLabel" aria-hidden="true">
                <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
                    <div className="modal-content">
                        <div className="modal-header">
                        <h5 className="modal-title">{`${prop.ModalName}`}</h5>
                        <button type="button" className="btn-close" data-bs-dismiss="modal"></button>
                        </div>
                        <div className="modal-body">
                            {children}
                        </div>
                        <div className="modal-footer">
                        <button type="button" className="btn btn-custom btn-sm m-2" data-bs-dismiss="modal">{`${prop.BtnName1}`}</button>
                        <button type="button" className="btn btn-custom btn-sm m-2">{`${prop.BtnName2}`}</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
    );
}

export default LibModal;
