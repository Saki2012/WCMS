import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

// #region Public
// 每次路徑改變就捲到最上方（但首次 Hydration 不要動，避免把使用者已滑動的位置拉回頂端）
export const ScrollToTop = () =>
{
    const { key, hash } = useLocation();
    const navType = useNavigationType(); // POP / PUSH / REPLACE
    const isFirstRun = useRef(true);
    useEffect(() =>
    {
        // 宣告：SSR 環境不處理
        if (typeof window === "undefined") return;
        // 宣告：首次掛載（Hydration）不重置 scroll
        if (isFirstRun.current)
        {
            isFirstRun.current = false;
            return;
        }
        // 宣告：有 hash 時不強制回頂（避免錨點被破壞）
        if (hash) return;
        // 宣告：上一頁/下一頁（POP）保留原生/瀏覽器還原行為
        if (navType === "POP") return;
        // 執行：一般導頁才回到頂端
        window.scrollTo({ top: 0, left: 0, behavior: "smooth" });
    }, [key, hash, navType]);
    return null;
};
// #endregion
