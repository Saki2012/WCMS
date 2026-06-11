import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useState } from "react";
import type { ILibPictureProp } from "./LibPicture_Data";

// #region Property
interface LibPictureWithParentClassProp extends ILibPictureProp
{
    parentClass?: string; // 新增
}


interface UploadResult
{
    internalId: string | null;
    previewUrl: string;
    uploading: boolean;
    error: string | null;
}
// #endregion

// #region Public
export const useUploadPicture = () =>
{
    const uploadUrl: string = FileManagementAPI.Server_UploadTemp;
    const [result, setResult] = useState<UploadResult>({ internalId: null, previewUrl: "", uploading: false, error: null });
    const { publish } = useToast(); // ✅ 單一來源
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
// #endregion

// #region Private
export const LibPicture = ({ children, ...prop }: LibPictureWithParentClassProp) =>
{
    return (
        <div className="col-xxl-4 col-xl-6 col-lg-6 col-md-6 col-sm-12 col-12">
            <div className="panel align-items-center">
                <div className="panel-body w-100">
                    <div className="col-12 float-md-left float-sm-none py-1 d-flex justify-content-center">
                        <picture className="imgALL_box">
                            <img src={prop.PicSrc} className="d-block w-100 h-100 object-fit-contain card_image" alt={prop.PicDescription} />
                        </picture>
                    </div>
                    {children}
                </div>
            </div>
        </div>
    );
};
// #endregion
