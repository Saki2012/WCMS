import { useId } from 'react';
import type { ILibPictureProp } from './LibPicture_Data';

interface LibPictureWithParentClassProp extends ILibPictureProp {
  parentClass?: string; // 新增
}

const LibPicture = ({ children, ...prop }: LibPictureWithParentClassProp) => {
  const inputId = useId();
  return (
    <>
      <div className="col-12">
        <div className="panel align-items-center">
          <div className="panel-body w-100">
            <div className="col-12 float-md-left float-sm-none py-1 d-flex justify-content-center">
              <picture className="imgALL_box">
                <img src={prop.PicSrc} className="d-block w-100 h-100 object-fit-contain card_image" alt={prop.PicDescription} />
              </picture>
            </div>
            {/* <label htmlFor={inputId} className="col-12 float-md-left float-sm-none col-form-label py-md-1 pb-4">{prop.ColumnDisplayName}</label> */}
            {children}
          </div>
        </div>
      </div>
    </>
  );
}

export default LibPicture;


