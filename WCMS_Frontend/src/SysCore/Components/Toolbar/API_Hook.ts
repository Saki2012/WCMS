// 後續再來處理這支
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

// #region Property
// ✅ 統一錯誤結構（可對應你後端 ProblemDetails / ValidationProblemDetails）
export interface ApiProblem
{
    title?: string;
    detail?: string;
    status?: number;
    instance?: string;
    errors?: Record<string, string[]>;
    traceId?: string;
    raw?: unknown; // 原始錯誤保留，方便除錯
}


export interface UseExecuteApiOptions<TData>
{
    onSuccess?: (data: TData) => void;
    onError?: (problem: ApiProblem) => void;
    captureResult?: boolean; // 預設 true：把結果放進 data
    autoResetOnRun?: boolean; // 預設 true：每次執行前清空 error/data
}


export interface UseExecuteApiResult<TData>
{
    run: <R>(action: () => Promise<R>) => Promise<R>; // 可執行任何 async 動作
    isLoading: boolean;
    error: ApiProblem | null;
    data: TData | null;
    reset: () => void;
}
// #endregion

// #region Public
export const normalizeError = (err: unknown): ApiProblem =>
{
    const anyErr = err as any;
    const data = anyErr?.response?.data ?? anyErr?.data ?? anyErr;
    const status = anyErr?.response?.status ?? data?.status ?? 0;

    return {
        title: data?.title || anyErr?.message || "Request failed",
        detail: data?.detail || data?.message || "",
        status,
        instance: data?.instance,
        errors: data?.errors,
        traceId: data?.traceId ?? data?.extensions?.traceId,
        raw: err,
    };
};


/** ✅ 通用 API 執行器：把任意 Promise 包成「有 loading/error/data」的流程 */
export const useExecuteApi = <TData = unknown>(opt?: UseExecuteApiOptions<TData>): UseExecuteApiResult<TData> =>
{
    const options = useMemo<Required<UseExecuteApiOptions<TData>>>(() => ({
        onSuccess: opt?.onSuccess ?? (() =>
        {}),
        onError: opt?.onError ?? (() =>
        {}),
        captureResult: opt?.captureResult ?? true,
        autoResetOnRun: opt?.autoResetOnRun ?? true,
    }), [opt]);

    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<ApiProblem | null>(null);
    const [data, setData] = useState<TData | null>(null);
    // 防止元件已卸載還 setState
    const mountedRef = useRef(true);
    useEffect(() =>
    {
        mountedRef.current = true;
        return () =>
        {
            mountedRef.current = false;
        };
    }, []);

    const reset = useCallback(() =>
    {
        if (!mountedRef.current) return;
        setError(null);
        setData(null);
    }, []);

    const run = useCallback(async <R>(action: () => Promise<R>): Promise<R> =>
    {
        if (options.autoResetOnRun) reset();
        setIsLoading(true);
        try
        {
            const result = await action();
            if (mountedRef.current)
            {
                if (options.captureResult) setData(result as unknown as TData);
                options.onSuccess?.(result as unknown as TData);
            }
            return result;
        } catch (err)
        {
            const problem = normalizeError(err);
            if (mountedRef.current)
            {
                setError(problem);
                options.onError?.(problem);
            }
            throw err; // 讓呼叫端可選擇額外行為（例如還原 UI）
        } finally
        {
            if (mountedRef.current) setIsLoading(false);
        }
    }, [options, reset]);

    return { run, isLoading, error, data, reset };
};
// #endregion
