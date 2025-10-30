import { useEffect, useMemo, useRef, useState } from "react";

export interface UseNowOptions
{
    tickMs?: number; // 更新頻率；只做條件判斷可拉大或設很久，例如 60_000
    startPaused?: boolean; // true 時不自動跑秒（僅初次計一次）
}

export interface NowState
{
    now: Date | null;
    nowMs: number | null;
    isoUtc: string | null;
    isoLocal: string | null;
    hydrated: boolean; // 是否已進入瀏覽器（可避免 SSR Hydration mismatch）
}

const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const formatLocalIso = (d: Date): string =>
{
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const h = pad(d.getHours());
    const mi = pad(d.getMinutes());
    const s = pad(d.getSeconds());
    const ms = `${d.getMilliseconds()}`.padStart(3, "0");
    return `${y}-${m}-${day}T${h}:${mi}:${s}.${ms}`;
};

export const useNow = (opts?: UseNowOptions): NowState =>
{
    const tickMs = opts?.tickMs ?? 1000;

    const [hydrated, setHydrated] = useState(false);
    const [ms, setMs] = useState<number | null>(null);

    const baseMsRef = useRef(0);
    const perfStartRef = useRef(0);

    useEffect(() =>
    {
        setHydrated(true);
        // 只在瀏覽器端初始化（SSR 不會跑到這裡）
        baseMsRef.current = Date.now();
        perfStartRef.current = performance.now();

        // 只要條件判斷、不用「走秒」的話，可以 startPaused=true，省 re-render
        if (opts?.startPaused)
        {
            const elapsed = performance.now() - perfStartRef.current;
            setMs(baseMsRef.current + elapsed);
            return;
        }

        const id = setInterval(() =>
        {
            const elapsed = performance.now() - perfStartRef.current;
            setMs(baseMsRef.current + elapsed);
        }, tickMs);

        // 先立即計一次
        const elapsed = performance.now() - perfStartRef.current;
        setMs(baseMsRef.current + elapsed);

        return () => clearInterval(id);
    }, []);

    const now = useMemo(() => (ms == null ? null : new Date(ms)), [ms]);
    const isoUtc = useMemo(() => (now ? now.toISOString() : null), [now]);
    const isoLocal = useMemo(() => (now ? formatLocalIso(now) : null), [now]);

    return { now, nowMs: ms, isoUtc, isoLocal, hydrated };
};
