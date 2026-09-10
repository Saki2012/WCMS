// SysCore/Utils/Hooks/useUploadFile.ts
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useState } from "react";
import { MessageStatus } from "../API/APIBase";

// #region Property
export interface UploadResult
{
    internalId: string | null;
    fileName: string | null;
    previewUrl: string | null; // 圖片可用；一般檔可忽略
    uploading: boolean;
    error: string | null;
}

export interface UseUploadFileOptions
{
    /** 是否嘗試建立本地預覽（圖片用），預設 true */
    enablePreview?: boolean;
    /** onUploaded 會不會把後端回傳的原檔名帶出去，預設 true */
    keepOriginalName?: boolean;
    /** 上傳成功後建立預覽 URL；未指定時使用 Public_Preview。 */
    previewUrlFactory?: (internalId: string) => string;
}

type UploadedCallback = (internalId: string, originalName: string) => void;
// #endregion

// #region Public
export const useUploadFile = (opts?: UseUploadFileOptions) =>
{
    const { publish } = useToast();
    const enablePreview = opts?.enablePreview ?? true;
    const keepOriginalName = opts?.keepOriginalName ?? true;
    const previewUrlFactory = opts?.previewUrlFactory ?? ((internalId: string) => FileManagementAPI.get_Public_Preview_Url(internalId));

    const [result, setResult] = useState<UploadResult>({ internalId: null, fileName: null, previewUrl: null, uploading: false, error: null });

    const handleFileChange = async (files: File[] | FileList | null | undefined, onUploaded?: UploadedCallback) =>
    {
        const list = files ? Array.from(files) : [];
        if (list.length === 0) return;
        const file = list[0];
        const localPreview = enablePreview ? URL.createObjectURL(file) : null;
        setResult(prev => ({ ...prev, previewUrl: localPreview, fileName: file.name, uploading: true, error: null }));
        try
        {
            const json = await FileManagementAPI.uploadTemp(file);
            if (!json.IsSuccess)
            {
                json.SysMessage.forEach((msg) =>
                {
                    if (msg.Status === MessageStatus.Error)
                    {
                        publish({ level: MessageStatus.Error, title: msg.MessageCode, text: msg.Message });
                    }
                });
                if (localPreview) URL.revokeObjectURL(localPreview);
                const message = json.SysMessage.find(msg => msg.Status === MessageStatus.Error)?.Message ?? "Upload failed";
                setResult(prev => ({ ...prev, previewUrl: null, uploading: false, error: message }));
                return;
            }

            const internalId = json.Data?.[0] ?? null;
            if (!internalId) throw new Error("No internalId in response");
            if (localPreview) URL.revokeObjectURL(localPreview);

            const next: UploadResult = {
                internalId,
                fileName: keepOriginalName ? file.name : null,
                previewUrl: enablePreview ? previewUrlFactory(internalId) : null,
                uploading: false,
                error: null,
            };
            setResult(next);
            onUploaded?.(internalId, file.name);
        } catch (err: unknown)
        {
            if (localPreview) URL.revokeObjectURL(localPreview);
            const message = err instanceof Error ? err.message : "Upload error";
            setResult(prev => ({ ...prev, previewUrl: null, uploading: false, error: message }));
        }
    };

    const reset = () => setResult({ internalId: null, fileName: null, previewUrl: null, uploading: false, error: null });

    return { result, handleFileChange, reset };
};
// #endregion