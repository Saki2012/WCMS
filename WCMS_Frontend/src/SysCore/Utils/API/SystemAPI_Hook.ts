import { useCallback, useEffect, useState } from "react";
import { SystemAPI } from "./APIClient";

export interface EnumOption
{
    Key: number;
    DisplayName: string;
}

export const useFetchEnumOptions = (enumName: string) =>
{
    const [data, setData] = useState<Record<string, string>>({});
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
            const dict: Record<string, string> = Object.fromEntries(
                (result.data ?? []).map((o: EnumOption) => [String(o.Key), o.DisplayName]),
            );
            setData(dict);
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
