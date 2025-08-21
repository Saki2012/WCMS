import { useCallback, useEffect, useState } from "react";
import { SystemAPI } from "./APIClient";

export interface EnumOption
{
    Key: number;
    DisplayName: string;
}

export const useFetchEnumOptions = (enumName: string) =>
{
    const [data, setData] = useState<EnumOption[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const fetchData = useCallback(async () =>
    {
        if (!enumName) return;
        setIsLoading(true);
        setError(null);
        try
        {
            const result = await SystemAPI.getEnumOptions(enumName);
            setData(result.data ?? []);
        } catch (err: any)
        {
            setError(err.message ?? "查詢失敗");
        } finally
        {
            setIsLoading(false);
        }
    }, [enumName]);

    useEffect(() =>
    {
        fetchData();
    }, [fetchData]);

    return { data, isLoading, error };
};
