import { useId } from 'react';
import type { ILibPictureProp } from './LibPicture_Data';
import { useState } from "react";

interface LibPictureWithParentClassProp extends ILibPictureProp {
  parentClass?: string; // 新增
}

const LibPicture = ({ children, ...prop }: LibPictureWithParentClassProp) => {
  const inputId = useId();
  return (
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
  );
}

interface UploadResult { internalId: string | null; previewUrl: string; uploading: boolean; error: string | null; }

export const useUploadPicture = (uploadUrl: string = "/Service/FileManagement/UploadTemp") => {
  const [result, setResult] = useState<UploadResult>({
    internalId: null,
    previewUrl: "",
    uploading: false,
    error: null,
  });

  const handleFileChange = async (
    files: File[],
    onUploaded?: (internalId: string) => void
  ) => {
    if (!files || files.length === 0) {
      setResult({ internalId: null, previewUrl: "", uploading: false, error: null });
      return;
    }

    const file = files[0];
    const localPreview = URL.createObjectURL(file);
    setResult(prev => ({ ...prev, previewUrl: localPreview, uploading: true }));

    try {
      const formDataUpload = new FormData();
      formDataUpload.append("file", file);

      const response = await fetch(uploadUrl, { method: "POST", body: formDataUpload });
      if (!response.ok) throw new Error("Upload failed");

      const resultJson = await response.json();
      const internalId = resultJson?.Data?.[0];

      setResult({
        internalId,
        previewUrl: `/Service/FileManagement/Preview/${internalId}`,
        uploading: false,
        error: null,
      });

      if (internalId && onUploaded) onUploaded(internalId);
    } catch (err: any) {
      setResult(prev => ({ ...prev, uploading: false, error: err.message }));
    }
  };

  return { result, handleFileChange };
}

export default LibPicture;


