import type { AxiosRequestConfig } from "axios";
type AnyConfig = import("axios").InternalAxiosRequestConfig & { _retry?: boolean; };
import api from "./APIBase";

/** ✅ 是否啟用 Bearer（預設關閉：Cookie auth） */
const isBearerMode = (): boolean =>
{
    // NOTE: 只有你明確設 VITE_AUTH_MODE=bearer 才會塞 Authorization
    return import.meta.env.VITE_AUTH_MODE === "bearer";
};

/** ✅ 取得 localStorage Bearer token（SSR safe） */
const getLocalAccessToken = (): string | null =>
{
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
};

/** ✅ 取得 XSRF cookie（SSR safe） */
const getXsrf = (): string | null =>
{
    if (typeof document === "undefined") return null;
    const hit = document.cookie.split("; ").find(x => x.startsWith("XSRF-TOKEN="));
    return hit ? decodeURIComponent(hit.split("=")[1]) : null;
};

/** ✅ 統一：用 XSRF header 呼叫（Refresh / Logout 建議走這個） */
const postWithXsrf = async (url: string, data?: unknown) =>
{
    const xsrf = getXsrf();
    return api.post(url, data ?? null, { headers: xsrf ? { "X-XSRF-Token": xsrf } : undefined });
};

// ✅ request：Cookie auth 預設不塞 Bearer，避免舊 token 造成快速掉登
api.interceptors.request.use((cfg) =>
{
    // NOTE: bearer 模式才塞 Authorization
    if (!isBearerMode()) return cfg;

    const token = getLocalAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

// --------------------
// 401 Refresh + Replay
// --------------------

// 單例刷新鎖＋排隊
let isRefreshing = false;
let waitQueue: Array<() => void> = [];

/** ✅ 幫忙把 axios config 重送（保留原本設定） */
const replay = (cfg: AnyConfig) =>
{
    return api({ ...(cfg as AxiosRequestConfig), _retry: true } as AxiosRequestConfig);
};

// --- 🚦 重點：401 自動 refresh + 重送 ---
api.interceptors.response.use((res) => res, async (err) =>
{
    const status = err?.response?.status;
    const cfg: AnyConfig = err?.config ?? {};

    // 不是 401 或者已重送過，就直接丟出去
    if (status !== 401 || cfg._retry) throw err;

    // 自己打 refresh / login / logout 失敗不重試，避免循環
    const url = (cfg.url || "").toLowerCase();
    if (url.endsWith("/refresh") || url.endsWith("/login") || url.endsWith("/logout"))
    {
        throw err;
    }

    // 並發控制：第一個觸發 refresh，其他排隊
    if (!isRefreshing)
    {
        isRefreshing = true;
        try
        {
            await postWithXsrf("/Auth/Refresh"); // ✅ 更新 access/rtid/XSRF Cookie
            // 喚醒佇列
            waitQueue.forEach(fn => fn());
            waitQueue = [];
            return replay(cfg); // 重送原請求
        } finally
        {
            isRefreshing = false;
        }
    }

    // 其他 401 先排隊，等 refresh 完成後重送
    return new Promise((resolve, reject) =>
    {
        waitQueue.push(() =>
        {
            replay(cfg).then(resolve).catch(reject);
        });
    });
});

export const AuthAPI = {
    me: () => api.get("/Auth/Me"),
    login: (p: { account: string; password: string; }) => api.post("/Auth/Login", p),
    logout: () => postWithXsrf("/Auth/Logout"), // ✅ 建議帶 XSRF
    refresh: () => postWithXsrf("/Auth/Refresh"), // ✅ 建議帶 XSRF
} as const;

// --------------------
// Idle 30 min logout + activity keep-alive
// --------------------

export interface IAuthIdleOptions
{
    /** 閒置多久登出（預設 30 分鐘） */
    idleMs?: number;

    /** 有動作時，refresh 節流間隔（預設 5 分鐘最多一次） */
    refreshThrottleMs?: number;

    /** 閒置登出後通知 UI（例如導去 /login） */
    onIdleLogout?: () => void;
}

/** ✅ 啟用：閒置 30 分鐘登出；有動作就 refresh（節流） */
export const startAuthIdleGuard = (opt?: IAuthIdleOptions) =>
{
    const idleMs = opt?.idleMs ?? 30 * 60 * 1000;
    const refreshThrottleMs = opt?.refreshThrottleMs ?? 5 * 60 * 1000;

    if (typeof window === "undefined") return { stop: () => void 0 };

    let idleTimer: number | null = null;
    let lastRefreshAt = 0;

    const clearIdleTimer = () =>
    {
        if (idleTimer === null) return;
        window.clearTimeout(idleTimer);
        idleTimer = null;
    };

    const scheduleIdleLogout = () =>
    {
        clearIdleTimer();
        idleTimer = window.setTimeout(async () =>
        {
            try
            {
                // NOTE: 不管 token 還在不在，都視為「使用者閒置」→ 主動登出
                await AuthAPI.logout();
            } finally
            {
                opt?.onIdleLogout?.();
            }
        }, idleMs);
    };

    const tryKeepAlive = async () =>
    {
        // NOTE: 避免太頻繁 refresh
        const now = Date.now();
        if (now - lastRefreshAt < refreshThrottleMs) return;
        if (isRefreshing) return;

        lastRefreshAt = now;
        try
        {
            await AuthAPI.refresh();
        } catch
        {
            // NOTE: refresh 失敗通常表示已失效；交給 RequireAuth 或 onIdleLogout 處理即可
        }
    };

    const onActivity = () =>
    {
        // NOTE: 有動作 → 重排 idle timer + 嘗試 keep-alive（節流）
        scheduleIdleLogout();
        void tryKeepAlive();
    };

    // 初次啟用就先排一次
    scheduleIdleLogout();

    const events: Array<keyof WindowEventMap> = ["mousemove", "keydown", "scroll", "click", "touchstart"];
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));

    return {
        stop: () =>
        {
            events.forEach((e) => window.removeEventListener(e, onActivity));
            clearIdleTimer();
        },
    };
};

export interface ICreateUserDto
{
    UserId: string; // 帳號
    UserName: string; // 使用者名稱
    Email: string; // Email
    Password: string; // 密碼（後端會做 Hash/Salt）
}

export interface ICreateUserResult
{
    ok?: boolean; // 你若有回應格式可補強；先保留最小回傳
}

export const UserAPI = { create: (dto: ICreateUserDto) => api.post<ICreateUserResult>("/User/Create", dto).then(r => r.data) } as const;
