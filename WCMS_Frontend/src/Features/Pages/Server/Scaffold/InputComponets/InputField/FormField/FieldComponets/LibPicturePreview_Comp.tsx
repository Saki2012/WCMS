import { useId } from "react";
import type { ILibPicturePreviewProp } from "./LibPicturePreview_Data";

// #region Property
interface PicturePreviewRemoveButtonProp
{
    title: string;
    disabled?: boolean;
    onRemove: () => void;
}
// #endregion

// #region Private
export const LibPicturePreview = (prop: ILibPicturePreviewProp) =>
{
    const inputId = useId();

    return (
        <>
            <div className="row align-items-center">
                <div className="col-md-4 col-12 float-md-left float-sm-none py-1">
                    <div className="position-relative mb-max-width-250px">
                        <picture className="imgALL_box">
                            <img src={prop.PicSrc} className="d-block w-100 h-100 object-fit-contain card_image" alt={prop.PicDescription} />
                        </picture>
                        {prop.onRemove && (
                            <PicturePreviewRemoveButton
                                title={prop.PicDescription || prop.ColumnDisplayName}
                                disabled={prop.removeDisabled}
                                onRemove={prop.onRemove}
                            />
                        )}
                    </div>
                </div>
                <label htmlFor={inputId} className="col-md-8 col-12 float-md-left float-sm-none col-form-label py-md-1 pb-4">{prop.ColumnDisplayName}</label>
            </div>
        </>
    );
};
// #endregion

// #region Section
/** 預覽圖片右上角刪除按鈕。 */
const PicturePreviewRemoveButton = (prop: PicturePreviewRemoveButtonProp) =>
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