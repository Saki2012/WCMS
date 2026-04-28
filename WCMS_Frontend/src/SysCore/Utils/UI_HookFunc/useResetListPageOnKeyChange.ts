import { useEffect, useRef } from "react";

/** 當 resetKey 改變時，將清單頁碼重設為第 1 頁 */
export const useResetListPageOnKeyChange = (resetKey: string, onPageChange: (page: number) => void): void =>
{
    const prevResetKeyRef = useRef<string>(resetKey);
    useEffect(() =>
    {
        if (prevResetKeyRef.current === resetKey) return;
        prevResetKeyRef.current = resetKey;
        onPageChange(1);
    }, [resetKey, onPageChange]);
};
