// 此為舊的gotop 沒有使用，改成新的gotop，放在GoTop資料夾

import gototopImg from "@/Features/Assets/Client/gototop_40x40.svg";
import { useCallback, useEffect, useState } from "react";

interface GoTopButtonProps
{
    /** 超過多少捲動距離才顯示（px） */
    threshold?: number;
    /** 捲回頂端動畫時間（僅做為 fallback；支援 smooth scroll 時會忽略） */
    durationMs?: number;
    /** 圖示路徑 */
    iconSrc?: string;
    /** 自訂 style */
    style?: React.CSSProperties;
    /** 無障礙名稱（螢幕報讀） */
    ariaLabel?: string;
    /** title 屬性（滑鼠懸停提示） */
    title?: string;
}

/** 回到頂端按鈕（React 版；支援 SSR/AA） */
export const GoTopButton: React.FC<GoTopButtonProps> = (props) =>
{
    const { threshold = 300, durationMs = 800, iconSrc = gototopImg, style, ariaLabel = "回到頂端", title = "置頂" } = props;
    const [visible, setVisible] = useState(false);
    // SSR guard：僅在瀏覽器端綁定捲動事件
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        const onScroll = () =>
        {
            const y = window.scrollY || document.documentElement.scrollTop || 0;
            setVisible(y > threshold);
        };
        // 初始判斷 + 事件綁定（passive 提升效能）
        onScroll();
        window.addEventListener("scroll", onScroll, { passive: true });
        return () => window.removeEventListener("scroll", onScroll);
    }, [threshold]);
    const handleClick = useCallback(() =>
    {
        if (typeof window === "undefined") return;
        // 依使用者偏好減少動效
        const prefersReduced = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        // 支援原生 smooth scroll
        if (!prefersReduced && "scrollBehavior" in document.documentElement.style)
        {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        // 簡易 fallback 動畫（避免 jQuery）
        const start = window.scrollY || document.documentElement.scrollTop || 0;
        const startTime = performance.now();
        const duration = Math.max(0, durationMs);
        const step = (now: number) =>
        {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
            const next = Math.floor(start * (1 - eased));
            window.scrollTo(0, next);
            if (t < 1) requestAnimationFrame(step);
        };
        if (duration === 0) window.scrollTo(0, 0);
        else requestAnimationFrame(step);
    }, [durationMs]);

    // 新增 - focus時點擊enter可gototop
    const handleKeyDown = (e: React.KeyboardEvent) =>
    {
        if (e.key === "Enter" || e.key === " ")
        {
            e.preventDefault();
            handleClick();
        }
    };

    if (!visible) return null;
    return (
        <a
            role="button"
            type="button"
            aria-label={ariaLabel}
            tabIndex={0}
            title={title}
            onClick={handleClick}
            onKeyDown={handleKeyDown}
            id={"gotop_btn"}
            className={"show"}
            style={style}
        >
            {/* 圖示為裝飾用途：由按鈕的 aria-label 提供無障礙名稱 */}
            <img src={iconSrc} alt="" role="presentation" />
        </a>
    );
};
