import { LibModal } from "@/Features/Pages/Server/Scaffold/InputComponets/InputField/FormField/LibFormField";
import { AuthAPI, getAuthRuntimeSnapshot, type IAuthRuntimeSnapshot, type IAuthSessionDiagnosticsDto } from "@/SysCore/Utils/API/AuthClient";
import { formatDateTime } from "@/SysCore/Utils/Library/LibData/LibDate";
import { useCallback, useEffect, useMemo, useState } from "react";

// #region Property
const DIAGNOSTICS_POLL_MS = 10_000;
const CLOCK_TICK_MS = 1_000;
const isDiagnosticsEnabled = import.meta.env.DEV;

interface DiagnosticsRowProps
{
    label: string;
    value: string;
}
// #endregion

// #region Public
/** Development 後台登入狀態監控，提供 Idle 倒數與 Session Diagnostics Modal。 */
export const AuthSessionDiagnosticsComp = () =>
{
    const [now, setNow] = useState(Date.now());
    const [diagnostics, setDiagnostics] = useState<IAuthSessionDiagnosticsDto | null>(null);
    const [runtime, setRuntime] = useState<IAuthRuntimeSnapshot>(() => getAuthRuntimeSnapshot());
    const [error, setError] = useState<string>("");
    const [loading, setLoading] = useState(false);

    /** 重新讀取後端與前端目前登入診斷狀態。 */
    const refreshDiagnostics = useCallback(async () =>
    {
        if (!isDiagnosticsEnabled) return;
        setLoading(true);
        try
        {
            const response = await AuthAPI.sessionDiagnostics();
            setDiagnostics(response.data);
            setRuntime(getAuthRuntimeSnapshot());
            setError("");
        }
        catch
        {
            setError("無法取得登入診斷資訊，請確認後端目前為 Development 環境。");
        }
        finally
        {
            setLoading(false);
        }
    }, []);

    useEffect(() =>
    {
        if (!isDiagnosticsEnabled) return;
        void refreshDiagnostics();
        const clockTimer = window.setInterval(() =>
        {
            setNow(Date.now());
            setRuntime(getAuthRuntimeSnapshot());
        }, CLOCK_TICK_MS);
        const diagnosticsTimer = window.setInterval(() => void refreshDiagnostics(), DIAGNOSTICS_POLL_MS);
        return () =>
        {
            window.clearInterval(clockTimer);
            window.clearInterval(diagnosticsTimer);
        };
    }, [refreshDiagnostics]);

    const idleRemainingSeconds = useMemo(() => getRemainingSeconds(runtime.IdleDeadlineAt, now), [now, runtime.IdleDeadlineAt]);
    if (!isDiagnosticsEnabled) return null;

    return (
        <LibModal
            ModalName="登入狀態診斷"
            OpenButtonText={<>距離登出時間：<strong>{formatDuration(idleRemainingSeconds)}</strong></>}
            PortalToBody={true}
            BtnName1="關閉"
            BtnName2="重新讀取"
            onConfirm={refreshDiagnostics}
            confirmAutoClose={false}
            confirmBusy={loading}
            openButtonClassName="btn-link border-0 bg-transparent text-dark text-decoration-none shadow-none m-0"
        >
            <div className="alert alert-warning py-2" role="status">
                本視窗僅在 Development 顯示；不回傳 Access Token、Refresh Token、RTID 或 XSRF Token 原文。
            </div>
            {error && <div className="alert alert-danger py-2">{error}</div>}
            <div className="table-responsive">
                <table className="table table-sm table-bordered align-middle mb-0">
                    <tbody>
                        <DiagnosticsRow label="Idle 剩餘時間" value={formatDuration(idleRemainingSeconds)} />
                        <DiagnosticsRow label="Idle Timeout" value={formatDurationMs(runtime.IdleTimeoutMs)} />
                        <DiagnosticsRow label="最後使用者活動" value={formatClientTime(runtime.LastActivityAt)} />
                        <DiagnosticsRow label="最後 Refresh 嘗試" value={formatClientTime(runtime.LastRefreshAttemptAt)} />
                        <DiagnosticsRow label="最後 Refresh 成功" value={formatClientTime(runtime.LastRefreshSuccessAt)} />
                        <DiagnosticsRow label="最後 Refresh 失敗" value={formatClientTime(runtime.LastRefreshErrorAt)} />
                        <DiagnosticsRow label="Refresh 成功次數" value={String(runtime.RefreshSuccessCount)} />
                        <DiagnosticsRow label="Refresh 節流時間" value={formatDurationMs(runtime.RefreshThrottleMs)} />
                        <DiagnosticsRow label="Access 剩餘時間" value={formatDuration(diagnostics?.AccessRemainingSeconds ?? null)} />
                        <DiagnosticsRow label="Access 到期時間" value={formatServerTime(diagnostics?.AccessExpiresAtUtc)} />
                        <DiagnosticsRow label="Access 設定期限" value={diagnostics ? `${diagnostics.AccessTokenMinutes} 分鐘` : "-"} />
                        <DiagnosticsRow label="Refresh 設定期限" value={diagnostics ? `${diagnostics.RefreshTokenDays} 天` : "-"} />
                        <DiagnosticsRow label="Access Cookie" value={formatBoolean(diagnostics?.AccessCookiePresent)} />
                        <DiagnosticsRow label="Refresh Cookie" value={formatBoolean(diagnostics?.RefreshCookiePresent)} />
                        <DiagnosticsRow label="Refresh Cache" value={formatBoolean(diagnostics?.RefreshCacheHit, "HIT", "MISS")} />
                        <DiagnosticsRow label="Refresh Owner" value={formatBoolean(diagnostics?.RefreshOwnerMatchesCurrentUser, "MATCH", "MISMATCH")} />
                        <DiagnosticsRow label="XSRF Cookie" value={formatBoolean(diagnostics?.XsrfCookiePresent)} />
                        <DiagnosticsRow label="Access Blacklist" value={formatBoolean(diagnostics?.AccessBlacklisted, "YES", "NO")} />
                        <DiagnosticsRow label="Access JTI 指紋" value={diagnostics?.AccessJtiFingerprint || "-"} />
                        <DiagnosticsRow label="Refresh 指紋" value={diagnostics?.RefreshFingerprint || "-"} />
                        <DiagnosticsRow label="Authentication Type" value={diagnostics?.AuthenticationType || "-"} />
                        <DiagnosticsRow label="Backend Environment" value={diagnostics?.EnvironmentName || "-"} />
                        <DiagnosticsRow label="Server Time" value={formatServerTime(diagnostics?.ServerTimeUtc)} />
                    </tbody>
                </table>
            </div>
        </LibModal>
    );
};
// #endregion

// #region Section
/** 顯示單筆登入診斷欄位。 */
const DiagnosticsRow = (props: DiagnosticsRowProps) =>
{
    return (
        <tr>
            <th scope="row" className="w-25">{props.label}</th>
            <td>{props.value}</td>
        </tr>
    );
};
// #endregion

// #region Private
/** 計算指定 Deadline 距離目前時間的剩餘秒數。 */
const getRemainingSeconds = (deadlineAt: number | null, now: number): number | null =>
{
    if (deadlineAt === null) return null;
    return Math.max(0, Math.ceil((deadlineAt - now) / 1000));
};

/** 將秒數格式化為 HH:mm:ss 或 mm:ss。 */
const formatDuration = (seconds: number | null): string =>
{
    if (seconds === null) return "--:--";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}`;
    return `${pad2(minutes)}:${pad2(secs)}`;
};

/** 將毫秒數格式化為倒數顯示文字。 */
const formatDurationMs = (milliseconds: number): string =>
{
    return formatDuration(Math.floor(milliseconds / 1000));
};

/** 將 Browser timestamp 格式化為本地日期時間。 */
const formatClientTime = (timestamp: number | null): string =>
{
    return timestamp === null ? "-" : formatDateTime(timestamp);
};

/** 將後端 UTC ISO 時間格式化為本地日期時間。 */
const formatServerTime = (value: string | null | undefined): string =>
{
    return value ? formatDateTime(value) : "-";
};

/** 將可空 Boolean 轉為診斷顯示文字。 */
const formatBoolean = (value: boolean | undefined, trueText: string = "存在", falseText: string = "不存在"): string =>
{
    if (value === undefined) return "-";
    return value ? trueText : falseText;
};

/** 將數字補為兩位數。 */
const pad2 = (value: number): string =>
{
    return String(value).padStart(2, "0");
};
// #endregion
