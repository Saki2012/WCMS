import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useUploadFile } from "@/SysCore/Utils/UI_Hooks/useUploadFile";
import type { ILibPictureProp } from "./LibPicture_Data";

// #region Property
interface LibPictureWithParentClassProp extends ILibPictureProp
{
    parentClass?: string;
}

interface PictureRemoveButtonProp
{
    title: string;
    disabled?: boolean;
    onRemove: () => void;
}
// #endregion

// #region Public
/** 圖片上傳沿用共用檔案上傳流程，避免另建 raw fetch 與 XSRF 平行實作。 */
export const useUploadPicture = () =>
{
    const uploadFile = useUploadFile({
        enablePreview: true,
        keepOriginalName: false,
        previewUrlFactory: internalId => FileManagementAPI.get_Server_Preview_Url(internalId),
    });

    return {
        result: {
            internalId: uploadFile.result.internalId,
            previewUrl: uploadFile.result.previewUrl ?? "",
            uploading: uploadFile.result.uploading,
            error: uploadFile.result.error,
        },
        handleFileChange: uploadFile.handleFileChange,
    };
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