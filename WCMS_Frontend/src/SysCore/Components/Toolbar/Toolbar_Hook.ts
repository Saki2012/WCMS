import { useState } from "react"
import { IDataProvider } from "../../Interface/IApiProvider"
import type { ToolbarAction } from "./Toolbar_Data"
import axios from "axios"
import { useNavigate,useLocation } from "react-router-dom"
export const useFormToolbarActions = <T>(apiProvider: IDataProvider<T>, formData: T, internalId: string, onSuccess?: () => void) => {

    const navigate = useNavigate();
    const location = useLocation();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setError] = useState<string | null>(null);
    
    const handleSave = async () => {
        try{
            setIsLoading(true)
            if(!internalId) await apiProvider.createData(formData);
            else await apiProvider.updateData(internalId,formData);
            // onSuccess?.(); // ✅ 儲存成功後，可呼叫 refetch 等，暫時不執行，等做好可以顯示保存成功的說明才
            handleCancelBack()
        }
        catch(err: any) {
            if (axios.isAxiosError(err)) {
                console.error('伺服器錯誤訊息:', err.response?.data);
                setError(JSON.stringify(err.response?.data));
            } else {
                setError(err.message);
            }
        }
        finally{
            setIsLoading(false);
        }
    }

    const handleCancelBack = async () => {
        navigate(location.pathname.replace(/\/Form(\/[^\/]*)?$/, '/List'));
    };

    const handleDelete = async () => { 
        setIsLoading(true);
        try {
            await apiProvider.deleteData(internalId);
        } 
        catch (err: any) {
            setError(err.message ?? "資料載入失敗");
        } 
        finally {
            setIsLoading(false);
        }
    }

    const handlePreview = () => {
    }

    const handleInvalid = async () => {

        try{
            setIsLoading(true)
            await apiProvider.invalidData(internalId, true)
            setIsLoading(false)
        }
        catch(err: any) {
            setError(err.message)
        }
        finally{
            setIsLoading(false);
        }
    }

    const action: ToolbarAction[] = [
        { Id: 'Save', Title: '儲存送出', Type: 'button', OnClick: handleSave },
        { Id: 'Cancel', Title: '取消返回', Type: 'button', OnClick: handleCancelBack},
        // { Id: 'Preview', Title: '預覽畫面', Type: 'button', OnClick: handlePreview },
    ]
  return { isLoading, errors, action }
}

export const useListToolbarActions = (dirUrl?: string) => {
    const navigate = useNavigate();
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setError] = useState<string | null>(null);
    const handleAddNew = async () => {
        try {
            setIsLoading(true);
            navigate(dirUrl ?? "/");
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };
    const toolbarActions: ToolbarAction[] = [
        { Id: 'AddNew', Title: '新增資料', Type: 'button', OnClick: handleAddNew },
    ]
  return { isLoading, errors, toolbarActions }
}