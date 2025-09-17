import { useCallback, useEffect, useState } from "react";
import type { ModelDisplaySchema } from "../../../types/IApiSchema";
import type { IDataProvider } from "../../Interface/IApiProvider";

export interface UseFetchFormDataResult<T>
{
    data: T | null;
    displayName: ModelDisplaySchema | null;
    setFormData: React.Dispatch<React.SetStateAction<T | null>>;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}

/**
 * 通用取得表單資料 Hook，可用於新增或編輯模式
 * @param provider API provider，需實作 fetchData
 * @param internalId 資料的 key，若為 undefined/null 則為新增模式
 * @param emptyData 當 internalId 為 null 時回傳的預設資料
 */
export const useFetchFormData = <T>(
    provider: IDataProvider<T>,
    internalId?: string | null,
    emptyData?: T,
): UseFetchFormDataResult<T> =>
{
    const [data, setFormData] = useState<T | null>(null);
    const [displayName, setDisplayName] = useState<ModelDisplaySchema | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = useCallback(async () =>
    {
        setIsLoading(true);
        setError(null);
        try
        {
            const display = await provider.getModelDisplayName();
            setDisplayName(display);
            if (!internalId)
            {
                if (emptyData) setFormData(emptyData);
                return;
            }
            const res = await provider.fetchData(internalId);
            if (!res.IsSuccess)
            {
                const msg = res.SysMessage?.map(m => `${m.MessageCode}:${m.Message}`).join("；") ?? "查詢失敗";
                throw new Error(msg);
            }
            setFormData((res.Data as T[])?.[0] ?? null);
        } catch (err: any)
        {
            setError(err.message ?? "資料讀取失敗");
        } finally
        {
            setIsLoading(false);
        }
    }, [internalId, provider, emptyData]);
    useEffect(() =>
    {
        fetchData();
    }, [internalId]);
    return { displayName, data, setFormData, isLoading, error, refetch: fetchData };
};
