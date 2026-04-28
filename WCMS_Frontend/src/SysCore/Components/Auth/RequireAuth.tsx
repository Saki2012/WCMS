import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthAPI, startAuthIdleGuard } from "../../Utils/API/AuthClient";
/**
 * 輕量節流策略：
 * - 預設 300s 內同來源的路由切換不重打 /Me（除非是第一次或上次結果是 unauth）
 * - 視窗重新獲得焦點、頁籤從隱藏回可見時，會再檢查一次（忽略節流）
 * - 交給 axios 攔截器負責 401 -> /Refresh -> 重送
 */
const THROTTLE_MS = 300_000;

// 模組級快取：在 SPA 生命週期內可共享（避免每個頁面都重新打）
let lastCheckAt = 0;
let lastOK = false;

type Status = "checking" | "ok" | "unauth";
type Props = { children: ReactNode; };

export function resetAuthProbe()
{
    lastOK = false;
    lastCheckAt = 0;
}

export default function RequireAuth({ children }: Props)
{
    const loc = useLocation();
    const [status, setStatus] = useState<Status>("checking");
    const inFlight = useRef<Promise<void> | null>(null); // 同步去重，避免多次同時打 /Me
    const lastVisibleAtRef = useRef<number>(0); // Alt+Tab 去重用

    // 靜默檢查 soft=true：不切到「驗證中…」，僅在失敗時導回登入
    const checkAuth = async (opts: { force?: boolean; soft?: boolean; } = {}) =>
    {
        const { force = false, soft = false } = opts;
        const now = Date.now();

        // 節流：同來源 300s 內且上次 OK 就不重打（除非 force）
        if (!force && lastOK && now - lastCheckAt < THROTTLE_MS)
        {
            setStatus("ok");
            return;
        }

        // 非靜默才顯示「驗證中…」
        if (!soft && status !== "checking") setStatus("checking");

        // 去重：避免同時多次呼叫
        if (inFlight.current)
        {
            await inFlight.current;
            return;
        }

        const run = (async () =>
        {
            try
            {
                await AuthAPI.me(); // 401 會由攔截器自動 refresh，再重送 /Me
                lastOK = true;
                lastCheckAt = Date.now();
                setStatus("ok");
            } catch
            {
                lastOK = false;
                lastCheckAt = Date.now();
                setStatus("unauth");
            }
        })();

        inFlight.current = run;
        await run;
        inFlight.current = null;
    };

    useEffect(() =>
    {
        // ✅ 啟用：30 分鐘閒置登出；有動作會節流 refresh
        const idle = startAuthIdleGuard({
            idleMs: 30 * 60 * 1000, // 30 分鐘
            refreshThrottleMs: 5 * 60 * 1000, // 5 分鐘最多 refresh 一次
            onIdleLogout: () =>
            {
                resetAuthProbe(); // 清掉 RequireAuth 快取
                setStatus("unauth"); // 觸發 Navigate → /Server/Login
            },
        });
        // 初次進入：一般檢查
        checkAuth({ force: true }).catch(() =>
        {});

        const onVisible = () =>
        {
            if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
            lastVisibleAtRef.current = Date.now();
            checkAuth({ force: true, soft: true }); // 靜默檢查
        };
        const onFocus = () =>
        {
            // Alt+Tab 常見順序：先 visibilitychange → 再 focus；400ms 內視為同一次
            if (Date.now() - lastVisibleAtRef.current < 400) return;
            checkAuth({ force: true, soft: true }); // 靜默檢查
        };

        if (typeof window !== "undefined" && typeof document !== "undefined")
        {
            document.addEventListener("visibilitychange", onVisible);
            window.addEventListener("focus", onFocus);
        }
        return () =>
        {
            idle.stop(); // ✅ 關閉 idle 監聽
            if (typeof window !== "undefined" && typeof document !== "undefined")
            {
                document.removeEventListener("visibilitychange", onVisible);
                window.removeEventListener("focus", onFocus);
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (status === "checking")
    {
        // AA：提供可讀取的狀態提示；不要渲染 Dashboard layout 以免閃爍
        return <div role="status" aria-live="polite" style={{ padding: 16 }}>驗證中…</div>;
    }

    if (status === "unauth")
    {
        // 帶回原網址，登入後可導回
        return <Navigate to="/Server/Login" replace state={{ from: loc }} />;
    }

    return <>{children}</>;
}
