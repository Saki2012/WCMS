import type { components } from "@/types/api";
import type { ModelDisplaySchema } from "@/types/IApiSchema";
import { useCallback, useEffect, useRef, useState } from "react";
// #region Property
type ApiSysMessage = components["schemas"]["SysMessageModel"];
export interface UseFetchFormDataResult<TFormModel>
{
    data: TFormModel;
    displayName: ModelDisplaySchema;
    setFormData: React.Dispatch<React.SetStateAction<TFormModel>>;
    isLoading: boolean;
    error: string | null;
    refetch: () => void;
}
// #endregion

// #region Public
/**
 * 通用取得表單資料 Hook，可用於新增或編輯模式。
 * @param provider API provider，需實作 fetchData。
 * @param internalId 資料的 key，若為 undefined/null 則為新增模式。
 * @param createEmptyModel 建立合法空 FormModel；data 從初始化起即維持強型別。
 */
export const useFetchFormData = <TFormModel>(
    provider: any,
    internalId: string | null | undefined,
    createEmptyModel: () => TFormModel,
): UseFetchFormDataResult<TFormModel> =>
{
    const createEmptyModelRef = useRef(createEmptyModel);
    createEmptyModelRef.current = createEmptyModel;

    const [data, setFormData] = useState<TFormModel>(() => createEmptyModel());
    const [displayName, setDisplayName] = useState<ModelDisplaySchema>(createEmptyModelDisplay);
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
                setFormData(createEmptyModelRef.current());
                return;
            }

            const res = await provider.fetchData(internalId);
            if (!res.IsSuccess)
            {
                const msg = res.SysMessage?.map((m: ApiSysMessage) => `${m.MessageCode}:${m.Message}`).join("；") ?? "查詢失敗";
                throw new Error(msg);
            }

            setFormData(resolveFormModelResponse(res.Data, createEmptyModelRef.current));
        } catch (err: any)
        {
            setError(err.message ?? "資料讀取失敗");
        } finally
        {
            setIsLoading(false);
        }
    }, [internalId, provider]);

    useEffect(() =>
    {
        void fetchData();
    }, [fetchData]);

    return { displayName, data, setFormData, isLoading, error, refetch: fetchData };
};
// #endregion

// #region Private
/** 建立尚未取得後端欄位資訊時使用的合法空顯示模型。 */
const createEmptyModelDisplay = (): ModelDisplaySchema =>
{
    return { ModelId: "", ModelDisplayName: "", Tables: [] };
};

/** 解析 QueryData 的 FormModel；查無資料時回傳全新的合法 EmptyModel。 */
const resolveFormModelResponse = <TFormModel>(
    data: TFormModel | TFormModel[] | null | undefined,
    createEmptyModel: () => TFormModel,
): TFormModel =>
{
    if (Array.isArray(data)) return data[0] ?? createEmptyModel();
    return data ?? createEmptyModel();
};
// #endregion
