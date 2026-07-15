import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useState } from "react";
import type { ILibPictureProp } from "./LibPicture_Data";

// #region Property
interface LibPictureWithParentClassProp extends ILibPictureProp
{
    parentClass?: string;
}

interface UploadResult
{
    internalId: string | null;
    previewUrl: string;
    uploading: boolean;
    error: string | null;
}

interface PictureRemoveButtonProp
{
    title: string;
    disabled?: boolean;
    onRemove: () => void;
}
// #endregion

// #region Public
export const useUploadPicture = () =>
{
    const uploadUrl: string = FileManagementAPI.Server_UploadTemp;
    const [result, setResult] = useState<UploadResult>({ internalId: null, previewUrl: "", uploading: false, error: null });
    const { publish } = useToast();

    /** 上傳圖片並回寫暫存 internalId。 */
    const handleFileChange = async (files: File[], onUploaded?: (internalId: string) => void) =>
    {
        if (!files || files.length === 0)
        {
            setResult({ internalId: null, previewUrl: "", uploading: false, error: null });
            return;
        }
        const file = files[0];
        const localPreview = URL.createObjectURL(file);
        setResult(prev => ({ ...prev, previewUrl: localPreview, uploading: true }));
        try
        {
            const formDataUpload = new FormData();
            formDataUpload.append("file", file);
            const response = await fetch(uploadUrl, { method: "POST", body: formDataUpload });
            if (!response.ok) throw new Error("Upload failed");
            const resultJson = await response.json();
            if (!resultJson.IsSuccess)
            {
                resultJson.SysMessage.map((item: { Status: any; MessageCode: any; Message: any; }) =>
                    publish({ level: item.Status, code: item.MessageCode, title: "保存失敗", text: item.Message })
                );
            }
            const internalId = resultJson?.Data?.[0];
            setResult({ internalId, previewUrl: FileManagementAPI.get_Server_Preview_Url(internalId), uploading: false, error: null });
            if (internalId && onUploaded) onUploaded(internalId);
        } catch (err: any)
        {
            setResult(prev => ({ ...prev, uploading: false, error: err.message }));
        }
    };

    return { result, handleFileChange };
};

export const LibPicture = ({ children, ...prop }: LibPictureWithParentClassProp) =>
{
    return (
        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
            <div className="panel align-items-center">
                <div className="panel-body w-100">
                    <div className="col-12 float-md-left float-sm-none py-1 d-flex justify-content-center">
                        <div className="position-relative w-100">
                            <picture className="imgALL_box">
                                <img src={prop.PicSrc} className="d-block w-100 h-100 object-fit-contain card_image" alt={prop.PicDescription ?? ""} />
                            </picture>
                            {prop.onRemove && <PictureRemoveButton title={prop.PicDescription ?? "圖片"} disabled={prop.removeDisabled} onRemove={prop.onRemove} />}
                        </div>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};
// #endregion

// #region Section
/** 圖片右上角刪除按鈕。 */
const PictureRemoveButton = (prop: PictureRemoveButtonProp) =>
{
    return (
        <button
            type="button"
            className="btn btn-sm btn-danger position-absolute top-0 end-0 m-1 rounded-circle"
            title={`刪除${prop.title}`}
            aria-label={`刪除${prop.title}`}
            disabled={prop.disabled}
            onClick={prop.onRemove}
            style={{width: "30px", height: "30px"}}
        >
            <i className="fas fa-times" aria-hidden="true"></i>
        </button>
    );
};
// #endregion