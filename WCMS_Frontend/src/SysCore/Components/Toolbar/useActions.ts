import { useToast } from "@/Features/Pages/Server/Scaffold/Toast/useToastCenter";
import { IDataProvider } from "@/SysCore/Interface/IApiProvider";
import axios from "axios";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type action = {
    Id: string;
    OnClick: () => void;
};

export const useActions = <T>(
    apiProvider: IDataProvider<T>,
    formData: T,
    internalId: string,
) =>
{
    const navigate = useNavigate();
    const [isExcuting, setIsExcuting] = useState(false);
    const [errors, setError] = useState<string | null>(null);
    const { publish } = useToast(); // ✅ 單一來源
    const handleSave = async () =>
    {
        try
        {
            // BeforeUpdate(); // Virtual Function 前端檢查是否可新增修改的timing
            setIsExcuting(true);
            const res =
                await (internalId ? apiProvider.updateData(internalId, formData) : apiProvider.createData(formData));
            if (res.IsSuccess)
            {
                res.SysMessage.map((item) =>
                    publish({ level: item.Status, code: item.MessageCode, title: "保存成功", text: item.Message })
                );
            } else
            {
                res.SysMessage.map((item) =>
                    publish({ level: item.Status, code: item.MessageCode, title: "保存失敗", text: item.Message })
                );
            }
            handleCancelBack();
        } catch (err: any)
        {
            if (axios.isAxiosError(err))
            {
                console.error("伺服器錯誤訊息:", err.response?.data);
                setError(JSON.stringify(err.response?.data));
            } else
            {
                setError(err.message);
            }
        } finally
        {
            setIsExcuting(false);
        }
    };

    const handleCancelBack = async () =>
    {
        navigate(-1); // 回上一頁
    };
    const handleDelete = async () =>
    {
        try
        {
            // BeforeDelete(); // 前端檢查是否可刪除的timing
            setIsExcuting(true);
            await apiProvider.deleteData(internalId);
        } catch (err: any)
        {
            setError(err.message ?? "資料載入失敗");
        } finally
        {
            setIsExcuting(false);
        }
    };
    const handlePreview = () =>
    {
        // 傳入當前資料和模型Comp呈現(待做)
    };
    const handleInvalid = async () =>
    {
        try
        {
            setIsExcuting(true);
            await apiProvider.invalidData(internalId, true);
            setIsExcuting(false);
        } catch (err: any)
        {
            setError(err.message);
        } finally
        {
            setIsExcuting(false);
        }
    };
    const action: action[] = [
        { Id: "Save", OnClick: handleSave },
        { Id: "Cancel", OnClick: handleCancelBack },
        { Id: "Delete", OnClick: handleDelete },
        { Id: "Invalid", OnClick: handleInvalid },
        { Id: "Preview", OnClick: handlePreview },
    ];
    return { isExcuting, errors, action };
};
