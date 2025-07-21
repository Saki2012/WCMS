import { useState } from "react"
import { IDataProvider } from "../../Interface/IApiProvider"
import type { ToolbarAction } from "./Toolbar_Data"
import axios from "axios"

export const useFormToolbarActions = <T>(apiProvider: IDataProvider<T>, initialData: T) => {
    const [formData, setFormData] = useState<T>(initialData)
    const [isSuccess, setResult] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setError] = useState<string | null>(null);
    
    const handleSave = async () => {
        try{
            setIsLoading(true)
            if(!formData.InternalId)
                await apiProvider.createData(formData);
                //重新導至Form/uid
            else
                await apiProvider.updateData(formData);
            
            setIsLoading(false)
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

    const handleDelete = async () => { 
        setIsLoading(true);
        try {
            await apiProvider.deleteData({ uid });
            setResult(true);
        } 
        catch (err: any) {
            setResult(false);
            setError(err.message ?? "資料載入失敗");
        } 
        finally {
            setIsLoading(false);
        }
    }

    const handleReset = () => {
        setFormData(initialData)
    }

    const handleInvalid = async () => {

        try{
            setIsLoading(true)
            await apiProvider.invalidData( formData.id )
            setIsLoading(false)
        }
        catch(err: any) {
            setError(err.message)
        }
        finally{
            setIsLoading(false);
        }

    }

    const toolbarActions: ToolbarAction[] = [
        { Id: 'Save', Title: '儲存送出', Type: 'button', OnClick: handleSave },
        { Id: 'Cancel', Title: '取消返回', Type: 'button', OnClick: handleDelete},
        { Id: 'Preview', Title: '預覽畫面', Type: 'button', OnClick: handleReset },
    ]

  return { formData, setFormData, isSuccess, isLoading, errors, toolbarActions }
}


export const useListToolbarActions = <T>(apiProvider: IDataProvider<T>, initialData: T) => {
    const [formData, setFormData] = useState<T>(initialData)
    const [isSuccess, setResult] = useState<boolean | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [errors, setError] = useState<string | null>(null);

    const toolbarActions: ToolbarAction[] = [
        { Id: 'AddNew', Title: '新增資料', Type: 'button', OnClick: handleSave },
    ]

  return { formData, setFormData, isSuccess, isLoading, errors, toolbarActions }
}