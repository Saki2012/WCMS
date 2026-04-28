import { useEffect, useRef } from "react";

/** 當搜尋條件有異動時，reset當前頁面回第一頁(或第n頁) */
export const useResetPageWhenKeyChanged = (conditionKey: string, onPageChange: (page: number) => void, resetPage?: number) =>
{
    // 宣告變數
    const prevKeyRef = useRef(conditionKey);
    const _resetPage = resetPage ?? 1;
    useEffect(() =>
    {
        if (prevKeyRef.current === conditionKey) return;
        prevKeyRef.current = conditionKey;
        onPageChange(_resetPage);
    }, [conditionKey, onPageChange, _resetPage]);
};
