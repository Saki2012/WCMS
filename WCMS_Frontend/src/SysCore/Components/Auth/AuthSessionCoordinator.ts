// #region Property
export type AuthSessionLogoutReason = "idle" | "manual";
export type AuthSessionInitialState = "active" | "missing" | "expired";

export interface IAuthSessionCoordinatorOptions
{
    /** Browser Session 閒置多久後視為登出。 */
    idleMs: number;
    /** 目前 Tab 發生實際使用者操作時通知呼叫端。 */
    onLocalActivity?: () => void;
    /** Browser Shared Activity 改變時同步 Runtime 狀態。 */
    onActivityChanged?: (activityAt: number | null, idleDeadlineAt: number | null) => void;
    /** Browser Session 確認 Idle 後執行真正登出。 */
    onIdle?: () => Promise<void> | void;
    /** Browser Session 已登出時通知目前 Tab 更新 UI。 */
    onSessionLogout?: (reason: AuthSessionLogoutReason) => void;
}

export interface IAuthSessionCoordinatorHandle
{
    stop: () => void;
    initialState: AuthSessionInitialState;
}

interface IAuthSessionLogoutEvent
{
    Reason: AuthSessionLogoutReason;
    At: number;
    EventId: string;
}

interface IAuthSessionCoordinatorRuntime
{
    Options: IAuthSessionCoordinatorOptions;
    IdleTimer: number | null;
    ActivityFlushTimer: number | null;
    PendingActivityAt: number | null;
    LatestActivityAt: number | null;
    LastSharedWriteAt: number;
    IdleRunning: boolean;
    IsLoggedOut: boolean;
    OnLocalActivity: EventListener;
    OnStorage: (event: StorageEvent) => void;
    OnLocalLogout: EventListener;
}

const LAST_ACTIVITY_KEY = "wcms:auth:session:last-activity-at";
const LOGOUT_EVENT_KEY = "wcms:auth:session:logout-event";
const LOCAL_LOGOUT_EVENT_NAME = "wcms:auth:session:logout-local";
const ACTIVITY_WRITE_THROTTLE_MS = 1_000;
const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = ["keydown", "scroll", "click", "touchstart"];
let memoryLastActivityAt: number | null = null;
// #endregion

// #region Public
/** 登入成功後建立新的 Browser Auth Session Activity 起點。 */
export const initializeAuthSessionActivity = (): void =>
{
    if (typeof window === "undefined") return;
    writeSharedActivityAt(Date.now());
};

/** 啟用同 Browser／Origin 的 Auth Session Activity、Idle 與 Logout 協調。 */
export const startAuthSessionCoordinator = (options: IAuthSessionCoordinatorOptions): IAuthSessionCoordinatorHandle =>
{
    if (typeof window === "undefined") return { stop: () => void 0, initialState: "missing" };

    const activityAt = readSharedActivityAt();
    const initialState = resolveInitialState(activityAt, options.idleMs);
    const runtime = createCoordinatorRuntime(options, activityAt);
    if (initialState === "active" && activityAt !== null)
    {
        applyActivity(runtime, activityAt);
        bindCoordinatorEvents(runtime);
    }
    else
    {
        runtime.IsLoggedOut = true;
        options.onActivityChanged?.(null, null);
    }

    return { stop: () => stopCoordinator(runtime), initialState };
};

/** 發布 Browser Session Logout，讓同 Origin 其他 Tab 同步清除登入狀態。 */
export const publishAuthSessionLogout = (reason: AuthSessionLogoutReason): void =>
{
    if (typeof window === "undefined") return;

    const logoutEvent: IAuthSessionLogoutEvent = {
        Reason: reason,
        At: Date.now(),
        EventId: createEventId(),
    };
    removeSharedActivity();
    writeLogoutEvent(logoutEvent);
    window.dispatchEvent(new CustomEvent<IAuthSessionLogoutEvent>(LOCAL_LOGOUT_EVENT_NAME, { detail: logoutEvent }));
};
// #endregion

// #region Private
/** 建立目前 Tab 使用的 Auth Session Coordinator Runtime。 */
const createCoordinatorRuntime = (options: IAuthSessionCoordinatorOptions, activityAt: number | null): IAuthSessionCoordinatorRuntime =>
{
    const runtime: IAuthSessionCoordinatorRuntime = {
        Options: options,
        IdleTimer: null,
        ActivityFlushTimer: null,
        PendingActivityAt: null,
        LatestActivityAt: activityAt,
        LastSharedWriteAt: activityAt ?? 0,
        IdleRunning: false,
        IsLoggedOut: false,
        OnLocalActivity: (() => void 0) as EventListener,
        OnStorage: (_event: StorageEvent) => void 0,
        OnLocalLogout: (() => void 0) as EventListener,
    };
    runtime.OnLocalActivity = (event) => handleLocalActivity(runtime, event);
    runtime.OnStorage = (event) => handleStorage(runtime, event);
    runtime.OnLocalLogout = (event) => handleLocalLogout(runtime, event);
    return runtime;
};

/** 判斷既有 Shared LastActivity 是否仍在 Idle 有效期限內。 */
const resolveInitialState = (activityAt: number | null, idleMs: number): AuthSessionInitialState =>
{
    if (activityAt === null) return "missing";
    return Date.now() - activityAt >= idleMs ? "expired" : "active";
};

/** 綁定目前 Tab 的使用者操作與跨 Tab Session 事件。 */
const bindCoordinatorEvents = (runtime: IAuthSessionCoordinatorRuntime): void =>
{
    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, runtime.OnLocalActivity, { passive: true }));
    window.addEventListener("storage", runtime.OnStorage);
    window.addEventListener(LOCAL_LOGOUT_EVENT_NAME, runtime.OnLocalLogout);
};

/** 停止目前 Tab 的 Auth Session Coordinator。 */
const stopCoordinator = (runtime: IAuthSessionCoordinatorRuntime): void =>
{
    clearIdleTimer(runtime);
    clearActivityFlushTimer(runtime);
    ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, runtime.OnLocalActivity));
    window.removeEventListener("storage", runtime.OnStorage);
    window.removeEventListener(LOCAL_LOGOUT_EVENT_NAME, runtime.OnLocalLogout);
};

/** 套用最新 Browser Activity 並依 Deadline 重排 Idle Timer。 */
const applyActivity = (runtime: IAuthSessionCoordinatorRuntime, activityAt: number): void =>
{
    if (runtime.IsLoggedOut || (runtime.LatestActivityAt !== null && activityAt < runtime.LatestActivityAt)) return;
    runtime.LatestActivityAt = activityAt;
    const idleDeadlineAt = activityAt + runtime.Options.idleMs;
    runtime.Options.onActivityChanged?.(activityAt, idleDeadlineAt);
    clearIdleTimer(runtime);
    const delay = Math.max(0, idleDeadlineAt - Date.now());
    runtime.IdleTimer = window.setTimeout(() => void handleIdleTimer(runtime), delay);
};

/** 記錄目前 Tab 的可信任使用者操作，並通知 Browser Shared Session。 */
const handleLocalActivity = (runtime: IAuthSessionCoordinatorRuntime, event: Event): void =>
{
    if (runtime.IsLoggedOut || !event.isTrusted) return;
    const activityAt = Date.now();
    applyActivity(runtime, activityAt);
    queueSharedActivity(runtime, activityAt);
    runtime.Options.onLocalActivity?.();
};

/** 以節流方式同步 Browser Shared Activity，避免高頻操作大量寫入 localStorage。 */
const queueSharedActivity = (runtime: IAuthSessionCoordinatorRuntime, activityAt: number): void =>
{
    runtime.PendingActivityAt = activityAt;
    const elapsed = activityAt - runtime.LastSharedWriteAt;
    if (elapsed >= ACTIVITY_WRITE_THROTTLE_MS)
    {
        flushPendingActivity(runtime);
        return;
    }
    clearActivityFlushTimer(runtime);
    const delay = ACTIVITY_WRITE_THROTTLE_MS - elapsed;
    runtime.ActivityFlushTimer = window.setTimeout(() => flushPendingActivity(runtime), delay);
};

/** 寫入目前待同步的 Browser Shared Activity。 */
const flushPendingActivity = (runtime: IAuthSessionCoordinatorRuntime): void =>
{
    clearActivityFlushTimer(runtime);
    if (runtime.PendingActivityAt === null || runtime.IsLoggedOut) return;
    writeSharedActivityAt(runtime.PendingActivityAt);
    runtime.LastSharedWriteAt = runtime.PendingActivityAt;
    runtime.PendingActivityAt = null;
};

/** 確認 Browser Session 是否真的 Idle；其他 Tab 有活動時只重排 Timer。 */
const handleIdleTimer = async (runtime: IAuthSessionCoordinatorRuntime): Promise<void> =>
{
    if (runtime.IsLoggedOut || runtime.IdleRunning) return;
    const sharedActivityAt = readSharedActivityAt();
    const effectiveActivityAt = Math.max(runtime.LatestActivityAt ?? 0, sharedActivityAt ?? 0);
    if (effectiveActivityAt > 0 && Date.now() - effectiveActivityAt < runtime.Options.idleMs)
    {
        applyActivity(runtime, effectiveActivityAt);
        return;
    }
    runtime.IdleRunning = true;
    try
    {
        await runtime.Options.onIdle?.();
    }
    finally
    {
        runtime.IdleRunning = false;
    }
};

/** 接收其他 Tab 的 Shared Activity 或 Logout 事件。 */
const handleStorage = (runtime: IAuthSessionCoordinatorRuntime, event: StorageEvent): void =>
{
    if (event.key === LAST_ACTIVITY_KEY)
    {
        const activityAt = parseTimestamp(event.newValue);
        if (activityAt !== null) applyActivity(runtime, activityAt);
        return;
    }
    if (event.key !== LOGOUT_EVENT_KEY || !event.newValue) return;
    const logoutEvent = parseLogoutEvent(event.newValue);
    if (logoutEvent) handleSessionLogout(runtime, logoutEvent.Reason);
};

/** 接收目前 Tab 主動發布的 Session Logout 事件。 */
const handleLocalLogout = (runtime: IAuthSessionCoordinatorRuntime, event: Event): void =>
{
    const logoutEvent = (event as CustomEvent<IAuthSessionLogoutEvent>).detail;
    if (logoutEvent) handleSessionLogout(runtime, logoutEvent.Reason);
};

/** 清除 Coordinator Runtime 並通知目前 Tab 進入已登出狀態。 */
const handleSessionLogout = (runtime: IAuthSessionCoordinatorRuntime, reason: AuthSessionLogoutReason): void =>
{
    if (runtime.IsLoggedOut) return;
    runtime.IsLoggedOut = true;
    clearIdleTimer(runtime);
    clearActivityFlushTimer(runtime);
    runtime.PendingActivityAt = null;
    runtime.LatestActivityAt = null;
    runtime.Options.onActivityChanged?.(null, null);
    runtime.Options.onSessionLogout?.(reason);
};

/** 清除目前 Idle Timer。 */
const clearIdleTimer = (runtime: IAuthSessionCoordinatorRuntime): void =>
{
    if (runtime.IdleTimer === null) return;
    window.clearTimeout(runtime.IdleTimer);
    runtime.IdleTimer = null;
};

/** 清除待寫入 Shared Activity 的 Timer。 */
const clearActivityFlushTimer = (runtime: IAuthSessionCoordinatorRuntime): void =>
{
    if (runtime.ActivityFlushTimer === null) return;
    window.clearTimeout(runtime.ActivityFlushTimer);
    runtime.ActivityFlushTimer = null;
};

/** 讀取 Browser Shared 的最後活動時間；Storage 不可用時沿用目前 Tab Memory。 */
const readSharedActivityAt = (): number | null =>
{
    try
    {
        const stored = parseTimestamp(window.localStorage.getItem(LAST_ACTIVITY_KEY));
        if (stored !== null) memoryLastActivityAt = stored;
        return stored ?? memoryLastActivityAt;
    }
    catch
    {
        return memoryLastActivityAt;
    }
};

/** 寫入 Browser Shared 的最後活動時間，只允許時間往前推進。 */
const writeSharedActivityAt = (activityAt: number): void =>
{
    memoryLastActivityAt = Math.max(memoryLastActivityAt ?? 0, activityAt);
    try
    {
        const current = parseTimestamp(window.localStorage.getItem(LAST_ACTIVITY_KEY));
        if (current !== null && current > activityAt) return;
        window.localStorage.setItem(LAST_ACTIVITY_KEY, String(activityAt));
    }
    catch
    {
        // localStorage 不可用時維持單 Tab Memory，不讓 Auth UI 因 Storage 例外中斷。
    }
};

/** 清除 Browser Shared Activity，避免新 Session 沿用舊 Deadline。 */
const removeSharedActivity = (): void =>
{
    memoryLastActivityAt = null;
    try
    {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
    }
    catch
    {
        // localStorage 不可用時不影響目前 Tab 的登出流程。
    }
};

/** 寫入帶唯一 EventId 的 Logout 訊號，確保連續登出仍會觸發 storage event。 */
const writeLogoutEvent = (logoutEvent: IAuthSessionLogoutEvent): void =>
{
    try
    {
        window.localStorage.setItem(LOGOUT_EVENT_KEY, JSON.stringify(logoutEvent));
    }
    catch
    {
        // localStorage 不可用時仍保留目前 Tab 的登出流程。
    }
};

/** 將 Storage timestamp 轉為有效 Browser 時間。 */
const parseTimestamp = (value: string | null): number | null =>
{
    if (!value) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

/** 解析跨 Tab Logout Event，無效 Payload 直接忽略。 */
const parseLogoutEvent = (value: string): IAuthSessionLogoutEvent | null =>
{
    try
    {
        const parsed = JSON.parse(value) as Partial<IAuthSessionLogoutEvent>;
        const validReason = parsed.Reason === "idle" || parsed.Reason === "manual";
        if (!validReason || typeof parsed.At !== "number" || typeof parsed.EventId !== "string") return null;
        return parsed as IAuthSessionLogoutEvent;
    }
    catch
    {
        return null;
    }
};

/** 建立非敏感 Logout Event Id，避免相同 Storage Value 無法通知其他 Tab。 */
const createEventId = (): string =>
{
    return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
};
// #endregion
