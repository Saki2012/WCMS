// src/components/ToastViewport_Comp.tsx
import { useToast, useToastState } from "@/Features/Hooks/Common/useToastCenter";
import { MessageStatus, type MessageStatusCode } from "@/SysCore/Utils/API/APIBase";
import * as React from "react";

const DEFAULT_AUTO_CLOSE_MS = Number(import.meta.env.VITE_TOAST_AUTO_CLOSE_MS ?? 5000);
const EXIT_ANIM_MS = 300;
const ENTER_ANIM_MS = 250;

const iconMap: Record<MessageStatusCode, string> = {
    [MessageStatus.Error]: "✖",
    [MessageStatus.Warning]: "⚠",
    [MessageStatus.Info]: "ℹ",
    [MessageStatus.Green]: "✔",
};

const levelStyle: Record<MessageStatusCode, React.CSSProperties> = {
    [MessageStatus.Error]: { borderLeft: "4px solid #d32f2f", background: "#fdecea" },
    [MessageStatus.Warning]: { borderLeft: "4px solid #ed6c02", background: "#fff4e5" },
    [MessageStatus.Info]: { borderLeft: "4px solid #0288d1", background: "#e8f4fd" },
    [MessageStatus.Green]: { borderLeft: "4px solid #2e7d32", background: "#edf7ed" },
};

// 進度條顏色（可視需要微調深淺）
const progressColor: Record<MessageStatusCode, string> = {
    [MessageStatus.Error]: "#d32f2f",
    [MessageStatus.Warning]: "#ed6c02",
    [MessageStatus.Info]: "#0288d1",
    [MessageStatus.Green]: "#2e7d32",
};

type TimerState = {
    timeoutId: number | null;
    remaining: number; // 剩餘毫秒（暫停時不變）
    startAt: number; // 最近一次開始時間
    total: number; // 總毫秒，供進度條計算
};

export const ToastViewport_Comp: React.FC = () =>
{
    const toasts = useToastState();
    const { dismiss } = useToast();

    // 入/出場與計時管理
    const [exiting, setExiting] = React.useState<Record<string, boolean>>({});
    const [entering, setEntering] = React.useState<Record<string, boolean>>({});
    const timersRef = React.useRef<Map<string, TimerState>>(new Map());
    const seenRef = React.useRef<Set<string>>(new Set()); // 記錄「已完成入場初始化」的 id

    // ✅ 全域暫停：滑鼠移入任一訊息 → 全部暫停，移出 → 全部恢復
    const [globalPaused, setGlobalPaused] = React.useState(false);

    // 使用者偏好：減少動態（AA 友善）
    const prefersReduceMotion = typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

    const ENTER_MS = prefersReduceMotion ? 0 : ENTER_ANIM_MS;
    const EXIT_MS = prefersReduceMotion ? 0 : EXIT_ANIM_MS;

    const clearTimeoutOf = React.useCallback((id: string) =>
    {
        const st = timersRef.current.get(id);
        if (st?.timeoutId)
        {
            window.clearTimeout(st.timeoutId);
            timersRef.current.set(id, { ...st, timeoutId: null });
        }
    }, []);

    const startExit = React.useCallback((id: string) =>
    {
        setExiting(prev => ({ ...prev, [id]: true }));
        window.setTimeout(() =>
        {
            dismiss(id);
            setExiting(prev =>
            {
                const n = { ...prev };
                delete n[id];
                return n;
            });
            setEntering(prev =>
            {
                const n = { ...prev };
                delete n[id];
                return n;
            });
            timersRef.current.delete(id);
            seenRef.current.delete(id);
        }, EXIT_MS);
    }, [dismiss, EXIT_MS]);

    // 啟動/重啟倒數；若全域暫停，僅記錄剩餘時間，不設 timeout
    const startTimer = React.useCallback((id: string, ms: number) =>
    {
        clearTimeoutOf(id);
        const total = ms;
        if (globalPaused)
        {
            timersRef.current.set(id, { timeoutId: null, remaining: ms, startAt: Date.now(), total });
            return;
        }
        const startAt = Date.now();
        const timeoutId = window.setTimeout(() => startExit(id), ms);
        timersRef.current.set(id, { timeoutId, remaining: ms, startAt, total });
    }, [clearTimeoutOf, startExit, globalPaused]);

    const pauseTimer = React.useCallback((id: string) =>
    {
        const st = timersRef.current.get(id);
        if (!st) return;
        if (st.timeoutId) window.clearTimeout(st.timeoutId);
        const elapsed = Math.max(0, Date.now() - st.startAt);
        const remaining = Math.max(0, st.remaining - elapsed);
        timersRef.current.set(id, { timeoutId: null, remaining, startAt: st.startAt, total: st.total });
    }, []);

    const resumeTimer = React.useCallback((id: string) =>
    {
        const st = timersRef.current.get(id);
        if (!st) return;
        if (st.remaining <= 0)
        {
            startExit(id);
            return;
        }
        const startAt = Date.now();
        const timeoutId = window.setTimeout(() => startExit(id), st.remaining);
        timersRef.current.set(id, { timeoutId, remaining: st.remaining, startAt, total: st.total });
    }, [startExit]);

    // ✅ 全域暫停/恢復：一次處理所有卡片
    const pauseAll = React.useCallback(() =>
    {
        setGlobalPaused(true);
        timersRef.current.forEach((_st, id) => pauseTimer(id));
    }, [pauseTimer]);

    const resumeAll = React.useCallback(() =>
    {
        setGlobalPaused(false);
        timersRef.current.forEach((_st, id) => resumeTimer(id));
    }, [resumeTimer]);

    // 新 toast：入場初始化 + 自動關閉
    React.useEffect(() =>
    {
        const idsNow = new Set(toasts.map(t => t.id));

        toasts.forEach(t =>
        {
            if (!seenRef.current.has(t.id))
            {
                // 1) 標記為「尚未完成入場」：render 時畫在起始位置 (右側/透明)
                // 2) 雙 rAF 觸發滑入動畫（從右→左）
                setEntering(prev => ({ ...prev, [t.id]: true }));
                seenRef.current.add(t.id);

                const startEnter = () =>
                {
                    requestAnimationFrame(() =>
                    {
                        requestAnimationFrame(() =>
                        {
                            setEntering(prev => ({ ...prev, [t.id]: false }));
                        });
                    });
                };
                startEnter();

                // 安排自動關閉（0 或未設定且 DEFAULT<=0：不自動關）
                const duration = typeof t.durationMs === "number" ? t.durationMs : DEFAULT_AUTO_CLOSE_MS;
                if (duration && duration > 0) startTimer(t.id, duration);
            }
        });

        // 清理不存在的 timer
        [...timersRef.current.keys()].forEach(id =>
        {
            if (!idsNow.has(id))
            {
                clearTimeoutOf(id);
                timersRef.current.delete(id);
            }
        });
    }, [toasts, startTimer, clearTimeoutOf]);

    // 容器 hover：全體暫停/恢復
    const onContainerEnter = () => pauseAll();
    const onContainerLeave = () => resumeAll();

    const onClose = (id: string) =>
    {
        clearTimeoutOf(id);
        startExit(id);
    };

    // 輕量 tick（更新進度條寬度）：只有「未暫停且有計時器在跑」時才啟動
    const [, forceTick] = React.useState(0);
    React.useEffect(() =>
    {
        const anyRunning = !globalPaused && [...timersRef.current.values()].some(st => !!st.timeoutId);
        if (!anyRunning) return;
        const id = window.setInterval(() => forceTick(v => (v + 1) % 1000000), 100); // 100ms 更新
        return () => window.clearInterval(id);
    }, [toasts, globalPaused]);

    const focusTarget = React.useCallback((selector: string, toastId: string) =>
    {
        try
        {
            const el = document.querySelector(selector) as HTMLElement | null;
            if (!el) return;

            // 先嘗試讓容器取得焦點（避免某些瀏覽器阻擋）
            (el as any).focus?.({ preventScroll: true });

            // 若你的頁面有固定的 header，想要預留高度可在這裡客製捲動
            el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });

            // 真正 focus（確保在捲動後）
            setTimeout(() =>
            {
                (el as any).focus?.({ preventScroll: true });

                // 高亮閃爍（加一個臨時 class）
                el.classList.add("toast-focus-blink");
                setTimeout(() => el.classList.remove("toast-focus-blink"), 1000);
            }, 300);

            // 成功後關閉該 toast
            dismiss(toastId);
        } catch
        {
            /* 忽略錯誤 */
        }
    }, [dismiss]);

    return (
        <div
            aria-live="polite"
            onMouseEnter={onContainerEnter}
            onMouseLeave={onContainerLeave}
            style={{
                position: "fixed",
                right: 16,
                top: 16, // ✅ 右上角
                zIndex: 2000,
                display: "flex",
                flexDirection: "column",
                alignItems: "flex-end", // 讓卡片右對齊
                gap: 10,
                pointerEvents: "none",
            }}
        >
            {toasts.map((t, idx) =>
            {
                const role = t.level === MessageStatus.Error ? "alert" : "status";
                const ariaLive = t.level === MessageStatus.Error ? "assertive" : "polite";
                const isExiting = !!exiting[t.id];
                const hasEnteredInit = seenRef.current.has(t.id);
                // ✅ 首次 render：hasEnteredInit 為 false → 視為正在入場（從右→左）
                const isEntering = !hasEnteredInit || !!entering[t.id];

                // 小幅階梯延遲（多張同時進場更順眼）
                const delay = Math.min(idx * 30, 90);

                // 進度條：計算剩餘比例（未啟用自動關閉則不顯示）
                const st = timersRef.current.get(t.id);
                const showProgress = !!st && st.total > 0;
                let remainingMs = st ? (st.timeoutId ? Math.max(0, st.remaining - (Date.now() - st.startAt)) : st.remaining) : 0;
                const pct = st ? Math.max(0, Math.min(100, (remainingMs / st.total) * 100)) : 0;

                return (
                    <section
                        key={t.id}
                        role={role}
                        aria-live={ariaLive}
                        aria-atomic="true"
                        style={{
                            ...levelStyle[t.level ?? MessageStatus.Info],
                            pointerEvents: "auto",
                            minWidth: 520, // ✅ 加寬
                            maxWidth: 640,
                            color: "#111",
                            cursor: t.focusSelector ? "pointer" : "default",
                            boxShadow: "0 6px 18px rgba(0,0,0,0.18)",
                            borderRadius: 10,
                            padding: "12px 14px 16px 14px", // 底部多留一點給進度條
                            display: "grid",
                            gridTemplateColumns: "24px 1fr auto",
                            alignItems: "start",
                            columnGap: 10,
                            // 入/出場動畫：enter 從右→左；exit 往右滑並淡出（左→右）
                            transform: isExiting ? "translateX(40px)" : (isEntering ? "translateX(40px)" : "translateX(0px)"),
                            opacity: isExiting ? 0 : (isEntering ? 0 : 1),
                            transition: `transform ${isExiting ? EXIT_MS : ENTER_MS}ms ease ${isExiting ? 0 : delay}ms, opacity ${
                                isExiting ? EXIT_MS : ENTER_MS
                            }ms ease ${isExiting ? 0 : delay}ms`,
                            willChange: "transform, opacity",
                            position: "relative",
                            overflow: "hidden",
                        }}
                        onClick={() =>
                        {
                            if (t.focusSelector)
                            {
                                focusTarget(t.focusSelector, t.id);
                            }
                        }}
                        onKeyDown={(e) =>
                        {
                            if (!t.focusSelector)
                            {
                                return;
                            }
                            if (e.key === "Enter" || e.key === " ")
                            {
                                e.preventDefault();
                                focusTarget(t.focusSelector, t.id);
                            }
                        }}
                    >
                        <div aria-hidden="true" style={{ fontSize: 18, lineHeight: "24px" }}>{iconMap[t.level ?? MessageStatus.Info]}</div>

                        <div>
                            <div style={{ fontWeight: 600 }}>
                                {t.code ? `${t.code} ` : ""}
                                {t.title ?? (t.level === MessageStatus.Error
                                    ? "錯誤訊息"
                                    : t.level === MessageStatus.Warning
                                    ? "警告訊息"
                                    : t.level === MessageStatus.Green
                                    ? "成功訊息"
                                    : "提示訊息")}
                            </div>
                            {t.text && <p style={{ margin: "6px 0 0 0", lineHeight: 1.5 }}>{t.text}</p>}
                        </div>

                        <div>
                            <button
                                type="button"
                                aria-label="關閉通知"
                                onClick={(e) =>
                                {
                                    e.stopPropagation();
                                    onClose(t.id);
                                }}
                                style={{ border: 0, background: "transparent", fontSize: 18, cursor: "pointer", padding: 4, lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        {/* 進度條（靠底、由右往左縮短；暫停時不動） */}
                        {showProgress && (
                            <div
                                aria-hidden="true"
                                style={{ position: "absolute", left: 14, right: 14, bottom: 8, height: 3, background: "rgba(0,0,0,0.08)", borderRadius: 999 }}
                            >
                                <div
                                    style={{
                                        height: "100%",
                                        width: `${pct}%`,
                                        // 由右往左縮短：用 margin-left 填滿，或用 transform-origin: right
                                        transformOrigin: "right center",
                                        background: progressColor[t.level ?? MessageStatus.Info],
                                        borderRadius: 999,
                                        transition: globalPaused ? "none" : "width 100ms linear",
                                    }}
                                />
                            </div>
                        )}
                    </section>
                );
            })}
        </div>
    );
};
