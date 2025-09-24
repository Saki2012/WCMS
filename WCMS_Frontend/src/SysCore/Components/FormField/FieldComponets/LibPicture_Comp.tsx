import { useId } from 'react';
import type { ILibPictureProp } from './LibPicture_Data';
import { useState } from "react";
import { FileManagementAPI } from '@/SysCore/Utils/API/APIClient';

interface LibPictureWithParentClassProp extends ILibPictureProp {
  parentClass?: string; // 新增
}

const LibPicture = ({ children, ...prop }: LibPictureWithParentClassProp) => {
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
}

interface UploadResult { internalId: string | null; previewUrl: string; uploading: boolean; error: string | null; }

export const useUploadPicture = () => {
  const uploadUrl: string = FileManagementAPI.UPLOAD_URL
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
        previewUrl: `${FileManagementAPI.PREVIEW_URL}/${internalId}`,
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


