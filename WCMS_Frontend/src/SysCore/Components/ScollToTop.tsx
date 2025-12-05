import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// 每次路徑改變就捲到最上方
export const ScrollToTop = () => {
    const { key } = useLocation();
    useEffect(() => {
        window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth", // 不要動畫（可改 smooth）
        });
    }, [key]);
    return null;
};