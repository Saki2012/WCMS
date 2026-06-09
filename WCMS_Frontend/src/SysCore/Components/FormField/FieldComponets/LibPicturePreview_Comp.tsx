import { useId } from "react";
import type { ILibPicturePreviewProp } from "./LibPicturePreview_Data";

// #region Private
const LibPicturePreview = (prop: ILibPicturePreviewProp) =>
{
    const inputId = useId();
    return (
        <>
            <div className="row align-items-center">
                <div className="col-md-4 col-12 float-md-left float-sm-none py-1">
                    <picture className="imgALL_box">
                        <img src={prop.PicSrc} className="d-block w-100 h-100 object-fit-contain card_image" alt={prop.PicDescription} />
                    </picture>
                </div>
                <label htmlFor={inputId} className="col-md-8 col-12 float-md-left float-sm-none col-form-label py-md-1 pb-4">{prop.ColumnDisplayName}</label>
            </div>
        </>
    );
};


export default LibPicturePreview;
// #endregion
