import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthAPI, type ICurrentUserContextDto, startAuthIdleGuard } from "../../Utils/API/AuthClient";
import {
    AuthContextProvider,
    clearAuthContextSnapshot,
    getAuthContextSnapshot,
    setAuthContextSnapshot,
} from "./AuthContext";

// #region Property
/** 同來源路由切換時，五分鐘內不重複確認登入狀態。 */
const THROTTLE_MS = 300_000;
/** Development 使用兩分鐘 Idle 方便驗證；其他環境維持三十分鐘。 */
const AUTH_IDLE_TIMEOUT_MS = import.meta.env.DEV ? 2 * 60 * 1000 : 30 * 60 * 1000;
/** Development 使用一分鐘 Refresh 節流方便驗證；其他環境維持五分鐘。 */
const AUTH_REFRESH_THROTTLE_MS = import.meta.env.DEV ? 1 * 60 * 1000 : 5 * 60 * 1000;
let lastCheckAt = 0;
let lastOK = false;

type Status = "checking" | "ok" | "unauth";
type Props = { children: ReactNode; };
type CheckAuthOptions = { force?: boolean; soft?: boolean; };
// #endregion

// #region Public
/** 重設登入驗證與權限 Context。 */
export const resetAuthProbe = (): void =>
{
    lastOK = false;
    lastCheckAt = 0;
    clearAuthContextSnapshot();
};

/** 驗證登入狀態並提供目前使用者與權限 Context。 */
export const RequireAuth = ({ children }: Props) =>
{
    const loc = useLocation();
    const initialContext = useMemo(() => getAuthContextSnapshot(), []);
    const [current, setCurrent] = useState<ICurrentUserContextDto | null>(initialContext);
    const [status, setStatus] = useState<Status>(initialContext ? "ok" : "checking");
    const inFlight = useRef<Promise<void> | null>(null);
    const lastVisibleAtRef = useRef(0);
    const skipInitialCheckRef = useRef(Boolean(initialContext));

    /** 向後端重新取得登入者與完整權限內容。 */
    const checkAuth = useCallback(async (options: CheckAuthOptions = {}): Promise<void> =>
    {
        const force = options.force ?? false;
        const soft = options.soft ?? false;
        const cached = getAuthContextSnapshot();
        const canUseCache = !force && lastOK && cached && Date.now() - lastCheckAt < THROTTLE_MS;

        if (canUseCache)
        {
            setCurrent(cached);
            setStatus("ok");
            return;
        }

        if (!soft) setStatus("checking");
        if (inFlight.current)
        {
            await inFlight.current;
            return;
        }

        const run = loadCurrentAuthContext(setCurrent, setStatus);
        inFlight.current = run;
        await run;
        inFlight.current = null;
    }, []);

    /** 供功能頁面手動刷新目前權限。 */
    const refreshContext = useCallback(async (): Promise<void> =>
    {
        await checkAuth({ force: true, soft: true });
    }, [checkAuth]);

    useEffect(() =>
    {
        const idle = startAuthIdleGuard({
            idleMs: AUTH_IDLE_TIMEOUT_MS,
            refreshThrottleMs: AUTH_REFRESH_THROTTLE_MS,
            onSessionLogout: () =>
            {
                resetAuthProbe();
                setCurrent(null);
                setStatus("unauth");
            },
        });

        if (!skipInitialCheckRef.current) void checkAuth({ force: true });
        skipInitialCheckRef.current = false;

        const onVisible = () =>
        {
            if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
            lastVisibleAtRef.current = Date.now();
            void checkAuth({ force: true, soft: true });
        };
        const onFocus = () =>
        {
            if (Date.now() - lastVisibleAtRef.current < 400) return;
            void checkAuth({ force: true, soft: true });
        };

        document.addEventListener("visibilitychange", onVisible);
        window.addEventListener("focus", onFocus);
        return () =>
        {
            idle.stop();
            document.removeEventListener("visibilitychange", onVisible);
            window.removeEventListener("focus", onFocus);
        };
    }, [checkAuth]);

    const contextValue = useMemo(() =>
    {
        return current ? { current, refresh: refreshContext } : null;
    }, [current, refreshContext]);

    if (status === "checking") return <div role="status" aria-live="polite" style={{ padding: 16 }}>驗證中…</div>;
    if (status === "unauth" || !contextValue) return <Navigate to="/Server/Login" replace state={{ from: loc }} />;

    return <AuthContextProvider value={contextValue}>{children}</AuthContextProvider>;
};
// #endregion

// #region Private
/** 載入目前登入者與權限，並同步更新 Context 快照。 */
const loadCurrentAuthContext = async (
    setCurrent: (value: ICurrentUserContextDto | null) => void,
    setStatus: (value: Status) => void,
): Promise<void> =>
{
    try
    {
        const response = await AuthAPI.me();
        const next = response.data;
        if (!next?.User?.UserId) throw new Error("登入者資料不完整");

        lastOK = true;
        lastCheckAt = Date.now();
        setAuthContextSnapshot(next);
        setCurrent(next);
        setStatus("ok");
    } catch
    {
        lastOK = false;
        lastCheckAt = Date.now();
        clearAuthContextSnapshot();
        setCurrent(null);
        setStatus("unauth");
    }
};
// #endregion