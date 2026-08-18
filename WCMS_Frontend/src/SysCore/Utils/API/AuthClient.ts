import {
    publishAuthSessionLogout,
    startAuthSessionCoordinator,
    type AuthSessionLogoutReason,
    type IAuthSessionCoordinatorHandle,
} from "@/SysCore/Components/Auth/AuthSessionCoordinator";
import type { AxiosRequestConfig } from "axios";

// #region Property
type AnyConfig = import("axios").InternalAxiosRequestConfig & { _retry?: boolean; };

export interface IAuthIdleOptions
{
    /** 閒置多久登出（預設 30 分鐘） */
    idleMs?: number;
    /** 有動作時，refresh 節流間隔（預設 5 分鐘最多一次） */
    refreshThrottleMs?: number;
    /** Browser Session 登出後通知 UI（例如導去 /login） */
    onSessionLogout?: (reason: AuthSessionLogoutReason) => void;
}

export interface ICreateUserDto
{
    UserId: string;
    UserName: string;
    Email: string;
    Password: string;
}

export interface ICreateUserResult
{
    ok?: boolean;
}

export interface ICurrentUserDto
{
    UserId: string;
    UserName: string;
    InternalId: string;
    AccountStatus: number;
}

export interface ICurrentUserContextDto
{
    User: ICurrentUserDto;
    IsAdmin: boolean;
    Permissions: Record<string, number>;
}

/** Development 診斷 API 的安全輸出，不含 Token 原文。 */
export interface IAuthSessionDiagnosticsDto
{
    ServerTimeUtc: string;
    AccessExpiresAtUtc: string | null;
    AccessRemainingSeconds: number | null;
    AccessTokenMinutes: number;
    RefreshTokenDays: number;
    AccessCookiePresent: boolean;
    RefreshCookiePresent: boolean;
    RefreshCacheHit: boolean;
    RefreshOwnerMatchesCurrentUser: boolean;
    XsrfCookiePresent: boolean;
    AccessBlacklisted: boolean;
    AccessJtiFingerprint: string;
    RefreshFingerprint: string;
    AuthenticationType: string;
    EnvironmentName: string;
}

/** 前端 Idle Guard 執行狀態，供 Development 診斷畫面觀察。 */
export interface IAuthRuntimeSnapshot
{
    IdleTimeoutMs: number;
    RefreshThrottleMs: number;
    LastActivityAt: number | null;
    IdleDeadlineAt: number | null;
    LastRefreshAttemptAt: number | null;
    LastRefreshSuccessAt: number | null;
    LastRefreshErrorAt: number | null;
    RefreshSuccessCount: number;
}

interface IAuthIdleRuntime
{
    LastRefreshAt: number;
    RefreshThrottleMs: number;
}

const authRuntimeSnapshot: IAuthRuntimeSnapshot = {
    IdleTimeoutMs: 30 * 60 * 1000,
    RefreshThrottleMs: 5 * 60 * 1000,
    LastActivityAt: null,
    IdleDeadlineAt: null,
    LastRefreshAttemptAt: null,
    LastRefreshSuccessAt: null,
    LastRefreshErrorAt: null,
    RefreshSuccessCount: 0,
};

let isRefreshing = false;
let waitQueue: Array<() => void> = [];
// #endregion

// #region Public
export const AuthAPI = {
    me: () => api.get<ICurrentUserContextDto>("/Auth/Me"),
    login: (p: { account: string; password: string; }) => api.post<ICurrentUserContextDto>("/Auth/Login", p),
    logout: () => postWithXsrf("/Auth/Logout"),
    refresh: () => postWithXsrf("/Auth/Refresh"),
    sessionDiagnostics: () => api.get<IAuthSessionDiagnosticsDto>("/Auth/SessionDiagnostics"),
} as const;

/** 取得目前 Idle Guard Runtime 快照，僅供診斷 UI 顯示。 */
export const getAuthRuntimeSnapshot = (): IAuthRuntimeSnapshot =>
{
    return { ...authRuntimeSnapshot };
};

/** 啟用 Browser Shared 閒置登出與目前 Tab 活動續期機制。 */
export const startAuthIdleGuard = (opt?: IAuthIdleOptions) =>
{
    const idleMs = opt?.idleMs ?? 30 * 60 * 1000;
    const refreshThrottleMs = opt?.refreshThrottleMs ?? 5 * 60 * 1000;
    if (typeof window === "undefined") return { stop: () => void 0 };

    const runtime: IAuthIdleRuntime = { LastRefreshAt: 0, RefreshThrottleMs: refreshThrottleMs };
    authRuntimeSnapshot.IdleTimeoutMs = idleMs;
    authRuntimeSnapshot.RefreshThrottleMs = refreshThrottleMs;
    const coordinator = startAuthSessionCoordinator({
        idleMs,
        onLocalActivity: () => void tryKeepAlive(runtime),
        onActivityChanged: syncAuthActivityRuntime,
        onIdle: handleIdleLogout,
        onSessionLogout: (reason) => opt?.onSessionLogout?.(reason),
    });
    return { stop: () => stopAuthIdleGuard(coordinator) };
};

export const UserAPI = { create: (dto: ICreateUserDto) => api.post<ICreateUserResult>("/User/Create", dto).then(r => r.data) } as const;
// #endregion

// #region Private
import { LibCookie } from "../Library/LibData";
import { api } from "./APIBase";

/** 同步 Browser Shared Activity 至 Development Runtime Snapshot。 */
const syncAuthActivityRuntime = (activityAt: number | null, idleDeadlineAt: number | null): void =>
{
    authRuntimeSnapshot.LastActivityAt = activityAt;
    authRuntimeSnapshot.IdleDeadlineAt = idleDeadlineAt;
};

/** Browser Session 確認 Idle 後登出後端，並同步通知所有 Tab。 */
const handleIdleLogout = async (): Promise<void> =>
{
    try
    {
        await AuthAPI.logout();
    }
    finally
    {
        publishAuthSessionLogout("idle");
    }
};

/** 停止目前 Tab 的 Auth Idle Guard 並清除診斷 Deadline。 */
const stopAuthIdleGuard = (coordinator: IAuthSessionCoordinatorHandle): void =>
{
    coordinator.stop();
    authRuntimeSnapshot.IdleDeadlineAt = null;
};

/** 使用節流規則執行目前 Tab 的 Activity Refresh，並保存診斷結果。 */
const tryKeepAlive = async (runtime: IAuthIdleRuntime): Promise<void> =>
{
    const now = Date.now();
    if (now - runtime.LastRefreshAt < runtime.RefreshThrottleMs || isRefreshing) return;
    runtime.LastRefreshAt = now;
    authRuntimeSnapshot.LastRefreshAttemptAt = now;
    try
    {
        await AuthAPI.refresh();
        authRuntimeSnapshot.LastRefreshSuccessAt = Date.now();
        authRuntimeSnapshot.RefreshSuccessCount += 1;
    }
    catch
    {
        authRuntimeSnapshot.LastRefreshErrorAt = Date.now();
    }
};

/** 判斷是否明確啟用 Bearer 模式。 */
const isBearerMode = (): boolean =>
{
    return import.meta.env.VITE_AUTH_MODE === "bearer";
};

/** 取得 localStorage Bearer Token。 */
const getLocalAccessToken = (): string | null =>
{
    if (typeof window === "undefined") return null;
    return localStorage.getItem("access_token");
};

/** 取得目前 XSRF Cookie。 */
const getXsrf = (): string | null =>
{
    return LibCookie.readClientCookieValue("XSRF-TOKEN");
};

/** 統一以 XSRF Header 呼叫 Refresh 與 Logout。 */
const postWithXsrf = async (url: string, data?: unknown) =>
{
    const xsrf = getXsrf();
    return api.post(url, data ?? null, { headers: xsrf ? { "X-XSRF-Token": xsrf } : undefined });
};

api.interceptors.request.use((cfg) =>
{
    if (!isBearerMode()) return cfg;
    const token = getLocalAccessToken();
    if (token) cfg.headers.Authorization = `Bearer ${token}`;
    return cfg;
});

/** 重新送出原 Axios Request，並標示已經重試。 */
const replay = (cfg: AnyConfig) =>
{
    return api({ ...(cfg as AxiosRequestConfig), _retry: true } as AxiosRequestConfig);
};

api.interceptors.response.use((res) => res, async (err) =>
{
    const status = err?.response?.status;
    const cfg: AnyConfig = err?.config ?? {};
    if (status !== 401 || cfg._retry) throw err;

    const url = (cfg.url || "").toLowerCase();
    if (url.endsWith("/refresh") || url.endsWith("/login") || url.endsWith("/logout")) throw err;

    if (!isRefreshing)
    {
        isRefreshing = true;
        authRuntimeSnapshot.LastRefreshAttemptAt = Date.now();
        try
        {
            await postWithXsrf("/Auth/Refresh");
            authRuntimeSnapshot.LastRefreshSuccessAt = Date.now();
            authRuntimeSnapshot.RefreshSuccessCount += 1;
            waitQueue.forEach(fn => fn());
            waitQueue = [];
            return replay(cfg);
        }
        catch (refreshError)
        {
            authRuntimeSnapshot.LastRefreshErrorAt = Date.now();
            throw refreshError;
        }
        finally
        {
            isRefreshing = false;
        }
    }

    return new Promise((resolve, reject) =>
    {
        waitQueue.push(() =>
        {
            replay(cfg).then(resolve).catch(reject);
        });
    });
});
// #endregion