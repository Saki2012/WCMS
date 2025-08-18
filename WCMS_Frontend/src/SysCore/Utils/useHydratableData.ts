// hooks/useHydratableData.ts
import { useEffect, useRef, useState } from "react";

type Key = string;
type Fetcher<T, P> = (params: P, init?: RequestInit) => Promise<T>;

declare global
{
    interface Window
    {
        __INITIAL_DATA__?: Record<Key, unknown>;
    }
}

export const useHydratableData = <T, P>(
    key: Key, // 用來對應 SSR 注入的資料
    params: P, // 你的查詢參數
    fetcher: Fetcher<T, P>, // 共用的純函式
    options?: { revalidate?: boolean; }, // 是否啟動後再重抓
) =>
{
    const initial = (typeof window !== "undefined")
        ? (window.__INITIAL_DATA__?.[key] as T | undefined)
        : undefined;

    const [data, setData] = useState<T | undefined>(initial);
    const [loading, setLoading] = useState(!initial);
    const [error, setError] = useState<unknown>(null);
    const mounted = useRef(false);
    useEffect(() =>
    {
        mounted.current = true;
        const needFetch = !initial || options?.revalidate;
        if (needFetch)
        {
            setLoading(true);
            fetcher(params)
                .then((res) => mounted.current && setData(res))
                .catch((e) => mounted.current && setError(e))
                .finally(() => mounted.current && setLoading(false));
        }
        return () =>
        {
            mounted.current = false;
        };
    }, [key, JSON.stringify(params)]);

    return { data, loading, error };
};
