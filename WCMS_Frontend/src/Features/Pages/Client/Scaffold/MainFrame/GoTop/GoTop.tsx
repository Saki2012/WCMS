import { DefaultLang } from "@/SysCore/i18n/lang";
import type { Lang } from "@/SysCore/i18n/lang";
import { useCallback, useEffect, useRef, useState } from "react";
import "./GoTop.css";

// #region Property
/* =========================
 * i18n types
 * ========================= */

type GoTopA11yText = { label: string; };


/* =========================
 * i18n map
 * ========================= */

const GOTOP_A11Y_MAP: Partial<Record<Lang, GoTopA11yText>> = { "zh-tw": { label: "回到頂端" }, "zh-cn": { label: "回到顶端" }, en: { label: "Back to top" } };


/* =========================
 * Props
 * ========================= */

interface GoTopProps
{
    lang?: Lang;
    threshold?: number;
    durationMs?: number;
}
// #endregion

// #region Public
/* =========================
 * Component
 * ========================= */

export const GoTop: React.FC<GoTopProps> = ({
    lang,
    threshold = 100, // 顯示按鈕的滾動距離門檻；往下捲超過 100px，GoTop 才會出現
    durationMs = 700, // 回到頂部動畫時間（毫秒）
}) =>
{
    const a11y = getGoTopA11y(lang);

    const pathRef = useRef<SVGPathElement | null>(null);
    const [visible, setVisible] = useState(false);

    /* =========================
   * Scroll + Progress logic
   * ========================= */

    useEffect(() =>
    {
        if (typeof window === "undefined") return;

        const path = pathRef.current;
        if (!path) return;

        const pathLength = path.getTotalLength();

        // init svg progress
        path.style.strokeDasharray = `${pathLength} ${pathLength}`;
        path.style.strokeDashoffset = `${pathLength}`;

        let ticking = false;

        const update = () =>
        {
            const scroll = window.scrollY || 0;
            const height = document.documentElement.scrollHeight - window.innerHeight;

            // show / hide
            setVisible(scroll > threshold);

            // progress calculation
            const progress = height > 0 ? pathLength - (scroll * pathLength) / height : pathLength;

            path.style.strokeDashoffset = `${progress}`;

            ticking = false;
        };

        const onScroll = () =>
        {
            if (!ticking)
            {
                requestAnimationFrame(update);
                ticking = true;
            }
        };

        update();
        window.addEventListener("scroll", onScroll, { passive: true });

        return () => window.removeEventListener("scroll", onScroll);
    }, [threshold]);

    /* =========================
   * Scroll to top (a11y + fallback + easing)
   * ========================= */

    const scrollToTop = useCallback(() =>
    {
        if (typeof window === "undefined") return;

        const prefersReduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

        // reduced motion
        if (prefersReduced)
        {
            window.scrollTo(0, 0);
            return;
        }

        // native smooth scroll
        if ("scrollBehavior" in document.documentElement.style)
        {
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }

        // fallback easing scroll (your original advantage)
        const start = window.scrollY || 0;
        const startTime = performance.now();
        const duration = Math.max(0, durationMs);

        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

        const step = (now: number) =>
        {
            const t = Math.min(1, (now - startTime) / duration);
            const eased = easeOutCubic(t);

            window.scrollTo(0, Math.floor(start * (1 - eased)));

            if (t < 1) requestAnimationFrame(step);
        };

        if (duration === 0)
        {
            window.scrollTo(0, 0);
        } else
        {
            requestAnimationFrame(step);
        }
    }, [durationMs]);

    /* =========================
   * Keyboard support (a11y)
   * ========================= */

    const handleKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>) =>
    {
        if (e.key === "Enter" || e.key === " ")
        {
            e.preventDefault();
            scrollToTop();
        }
    };

    /* =========================
   * Render
   * ========================= */

    return (
        <button
            type="button"
            className={`progress-wrap ${visible ? "active-progress" : ""}`}
            aria-label={a11y.label}
            title={a11y.label}
            onClick={scrollToTop}
            onKeyDown={handleKeyDown}
        >
            {/* progress circle */}
            <svg className="progress-circle svg-content" width="100%" height="100%" viewBox="-1 -1 102 102">
                <path ref={pathRef} d="M50,1 a49,49 0 0,1 0,98 a49,49 0 0,1 0,-98" />
            </svg>

            {/* icon */}
            <i className="fas fa-long-arrow-up progress-icon fa fa-arrow-up" aria-hidden="true"></i>
        </button>
    );
};
// #endregion

// #region Private
/* =========================
 * i18n getter (same style as paginator)
 * ========================= */

const getGoTopA11y = (lang?: Lang): GoTopA11yText =>
{
    const key = (lang ?? DefaultLang) as Lang;

    const byLang = GOTOP_A11Y_MAP[key];
    const byDefault = GOTOP_A11Y_MAP[DefaultLang];

    return byLang ?? byDefault ?? { label: "回到頂端" };
};
// #endregion
