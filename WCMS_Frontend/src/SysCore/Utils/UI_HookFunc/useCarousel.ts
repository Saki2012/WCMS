import { useCallback, useEffect, useRef, useState } from "react";

// #region Property
type UseCarouselOpts = {
    length: number; // 幻燈片數
    interval?: number; // 例如 5000 ms
    autoPlay?: boolean; // 是否自動播放
};
// #endregion

// #region Public
export function useCarousel({ length, interval = 5000, autoPlay = true }: UseCarouselOpts)
{
    const [index, setIndex] = useState(0);
    const [playing, setPlaying] = useState(autoPlay);
    const timerRef = useRef<number | null>(null);
    const touchStartX = useRef(0);

    const goTo = useCallback((i: number) =>
    {
        setIndex((prev) => ((i % length) + length) % length);
    }, [length]);

    const next = useCallback(() => goTo(index + 1), [goTo, index]);
    const prev = useCallback(() => goTo(index - 1), [goTo, index]);

    const play = useCallback(() => setPlaying(true), []);
    const pause = useCallback(() => setPlaying(false), []);

    // 自動播放（CSR 才會啟動）
    useEffect(() =>
    {
        if (typeof window === "undefined") return;
        if (!playing || length <= 1) return;

        timerRef.current = window.setInterval(next, interval);
        return () =>
        {
            if (timerRef.current) window.clearInterval(timerRef.current);
        };
    }, [playing, interval, next, length]);

    // 觸控滑動
    const onTouchStart = (e: React.TouchEvent) =>
    {
        touchStartX.current = e.touches[0].clientX;
    };
    const onTouchEnd = (e: React.TouchEvent) =>
    {
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (Math.abs(dx) > 30) dx < 0 ? next() : prev();
    };

    // 滑入/聚焦暫停，滑出/失焦繼續
    const bind = { onMouseEnter: pause, onMouseLeave: play, onFocus: pause, onBlur: play, onTouchStart, onTouchEnd } as const;

    return { index, goTo, next, prev, play, pause, playing, bind };
}
// #endregion
