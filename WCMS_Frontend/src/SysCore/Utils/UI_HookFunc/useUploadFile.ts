// SysCore/Utils/Hooks/useUploadFile.ts
import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { FileManagementAPI } from "@/SysCore/Utils/API/APIClient";
import { useState } from "react";
import { type ApiResponse, MessageStatus, type SysMessageModel } from "../API/APIBase";

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
}


type UploadedCallback = (internalId: string, originalName: string) => void;
// #endregion

// #region Public
export const useUploadFile = (opts?: UseUploadFileOptions) =>
{
    const { publish } = useToast();
    const enablePreview = opts?.enablePreview ?? true;
    const keepOriginalName = opts?.keepOriginalName ?? true;

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
            const form = new FormData();
            form.append("file", file);
            // 依你的後端：/Service/FileManagement/UploadTemp
            const resp = await fetch(FileManagementAPI.Server_UploadTemp, {
                method: "POST",
                body: form,
                credentials: "include", // 有 HttpOnly Cookie/JWT 建議加
            });
            if (!resp.ok) throw new Error(`Upload failed: ${resp.status}`);

            const json = await resp.json() as ApiResponse<string>;
            if (json.IsSuccess)
            {
                const internalId: string | null = json?.Data?.[0] ?? null;
                if (!internalId) throw new Error("No internalId in response");

                const next: UploadResult = {
                    internalId,
                    fileName: keepOriginalName ? file.name : null,
                    previewUrl: localPreview ? FileManagementAPI.get_Public_Preview_Url(internalId) : null,
                    uploading: false,
                    error: null,
                };
                setResult(next);
                onUploaded?.(internalId, file.name);
            } else
            {
                (json.SysMessage as SysMessageModel[]).forEach((msg) =>
                {
                    if (msg.Status === 3)
                    {
                        publish({ level: MessageStatus.Error, title: msg.MessageCode, text: msg.Message });
                    }
                });
            }
        } catch (err: any)
        {
            setResult(prev => ({ ...prev, uploading: false, error: err?.message ?? "Upload error" }));
        }
    };

    const reset = () => setResult({ internalId: null, fileName: null, previewUrl: null, uploading: false, error: null });

    return { result, handleFileChange, reset };
};
// #endregion
