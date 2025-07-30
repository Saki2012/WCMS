import { useId } from 'react';
import type{ ILibPicturePreviewProp } from './LibPicturePreview_Data';

const LibPicturePreview=(prop:ILibPicturePreviewProp)=>{
    const inputId = useId();
    return(
        <>
            <label htmlFor={inputId} className="col-md-2 col-sm-12 float-md-left float-sm-none col-form-label">{prop.ColumnDisplayName}</label>
            <div className="col-md-4 col-sm-12 float-md-left float-sm-none">
                <picture className="imgALL_box">
                    <img src={prop.PicSrc} className="d-block w-100 card_image" alt={prop.PicDescription}/>
                </picture>
            </div>
        </>
    );
}

export default LibPicturePreview;


    