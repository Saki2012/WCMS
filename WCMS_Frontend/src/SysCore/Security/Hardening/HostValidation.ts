import express, { type NextFunction, type Request, type Response } from "express";

// #region Property
type HostValidationConfig = Readonly<{ isProd: boolean; }>;

const allowedHostsEnvName = "SSR_ALLOWED_HOSTS";

const developmentAllowedHosts = "localhost,127.0.0.1";
// #endregion

// #region Public
/** 在 SSR、靜態資源與 API Proxy 前驗證 Browser Host，阻擋 Host Header Injection / Blind SSRF。 */
export const setupHostValidation = (app: express.Express, cfg: HostValidationConfig): void =>
{
    const allowedHosts = getAllowedHosts(cfg.isProd);
    if (cfg.isProd && allowedHosts.size === 0) throw new Error(`${allowedHostsEnvName} is required in production.`);

    app.use((req: Request, res: Response, next: NextFunction) => validateRequestHost(req, res, next, allowedHosts));
};
// #endregion

// #region Private
/** 讀取 Host 白名單；DEV 未設定時僅允許本機 Host。 */
const getAllowedHosts = (isProd: boolean): ReadonlySet<string> =>
{
    const configured = String(process.env[allowedHostsEnvName] ?? "").trim();
    const raw = configured || (!isProd ? developmentAllowedHosts : "");
    const hosts = raw.split(",").map(normalizeHost).filter(Boolean);
    return new Set(hosts);
};

/** 驗證原始 Host 與 IIS 傳入的 X-Forwarded-Host 是否都在白名單。 */
const validateRequestHost = (req: Request, res: Response, next: NextFunction, allowedHosts: ReadonlySet<string>): void =>
{
    const host = normalizeHost(getHeaderText(req.headers.host));
    const forwardedRaw = getHeaderText(req.headers["x-forwarded-host"]);
    const forwardedHost = forwardedRaw ? normalizeHost(forwardedRaw) : "";
    const isAllowed = allowedHosts.has(host) && (!forwardedRaw || allowedHosts.has(forwardedHost));
    if (!isAllowed)
    {
        res.status(403).end();
        return;
    }
    next();
};

/** 將 Host 正規化成不含 Port 的 hostname；拒絕不合法 authority 字元。 */
const normalizeHost = (value: string): string =>
{
    const host = value.trim().toLowerCase();
    if (!host || /[,/@\\?#{}]/.test(host)) return "";
    try
    {
        return new URL(`http://${host}`).hostname.replace(/^\[|\]$/g, "").toLowerCase();
    } catch
    {
        return "";
    }
};

/** 將 Node Header 值收斂成文字；多值 Header 保留分隔符並交由 Host 格式驗證拒絕。 */
const getHeaderText = (value: string | string[] | undefined): string =>
{
    if (Array.isArray(value)) return value.map(x => String(x ?? "")).join(",");
    return String(value ?? "");
};
// #endregion
