import { useToast } from "@/Features/Hooks/Common/useToastCenter";
import { IDataProvider, MessageStatus } from "@/SysCore/Interface/IApiProvider";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export interface UseActionsResult
{
    isExecuting: boolean;
    onSave: () => Promise<void>;
    onDelete: (internalId: string) => Promise<void>;
    onInvalid: (reason?: unknown) => void;
    onCancelBack: () => void;
    onAddNew: () => void;
    onEdit: (internalId: string) => void;
    onPreview: () => void;
}

export const useActions = <T>(
    addNewUrl?: string,
    apiProvider?: IDataProvider<T>,
    formData?: T,
    internalId?: string,
    onSuccess?: () => Promise<void>,
): UseActionsResult =>
{
    const navigate = useNavigate();
    const location = useLocation();
    const [isExecuting, setIsExcuting] = useState(false);
    const { publish } = useToast();
    const formRef = useRef<T>(formData as T);
    const createPath = addNewUrl ?? "/";
    useEffect(() =>
    {
        formRef.current = formData as T;
    }, [formData]);
    const handleAddNew = useCallback(() =>
    {
        navigate(createPath);
    }, [navigate, createPath]);
    const handleEdit = useCallback((internalId: string) =>
    {
        navigate(`${createPath}/${internalId}`);
    }, [navigate, createPath]);
    const handleSave = useCallback(async () =>
    {
        if (!apiProvider) return;
        try
        {
            setIsExcuting(true);
            const res = await (internalId
                ? apiProvider.updateData(internalId, formRef.current)
                : apiProvider.createData(formRef.current));
            if (res.IsSuccess)
            {
                (res.SysMessage ?? []).forEach(item =>
                {
                    publish({ level: item.Status, code: item.MessageCode, title: item.Message });
                });
                handleCancelBack();
            } else
            {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: "保存失敗", text: item.Message })
                );
            }
        } catch (err: any)
        {
            publish({ level: MessageStatus.Error, title: "保存失敗", text: err.message });
        } finally
        {
            setIsExcuting(false);
        }
    }, [apiProvider, internalId, publish]);
    const handleCancelBack = useCallback(() =>
    {
        navigate(location.pathname.replace(/\/Form(\/[^\/]*)?$/, "/List"));
    }, [navigate, createPath]);
    const handleDelete = useCallback(async (internalId: string) =>
    {
        if (!apiProvider || !internalId) return;
        const confirmDelete = window.confirm("確定要刪除嗎？");
        if (!confirmDelete) return;
        setIsExcuting(true);
        try
        {
            const res = await apiProvider.deleteData(internalId);
            if (res.IsSuccess)
            {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: item.Message })
                );
                await onSuccess?.();
            } else
            {
                (res.SysMessage ?? []).forEach(item =>
                    publish({ level: item.Status, code: item.MessageCode, title: "刪除失敗", text: item.Message })
                );
            }
        } catch (err: any)
        {
            publish({ level: MessageStatus.Error, title: "刪除失敗", text: err.response?.data });
        } finally
        {
            setIsExcuting(false);
        }
    }, [apiProvider, onSuccess, publish]);
    const handlePreview = () =>
    {
    };
    const handleInvalid = async () =>
    {
        if (!apiProvider || !internalId) return;
        try
        {
            setIsExcuting(true);
            await apiProvider.invalidData(internalId, true);
            setIsExcuting(false);
        } catch (err: any)
        {
            publish({ level: MessageStatus.Error, title: "作廢失敗", text: err.response?.data });
        } finally
        {
            setIsExcuting(false);
        }
    };
    return useMemo(
        () => ({
            isExecuting,
            onSave: handleSave,
            onDelete: handleDelete,
            onInvalid: handleInvalid,
            onCancelBack: handleCancelBack,
            onAddNew: handleAddNew,
            onEdit: handleEdit,
            onPreview: handlePreview,
        }),
        [
            isExecuting,
            handleSave,
            handleDelete,
            handleInvalid,
            handleCancelBack,
            handleAddNew,
            handleEdit,
            handlePreview,
        ],
    );
};
