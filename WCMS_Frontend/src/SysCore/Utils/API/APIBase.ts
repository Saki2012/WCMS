// src/SysCore/Utils/API/APIBase.ts
import { LibCookie } from "@/SysCore/Utils/Library/LibData";
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import type { components } from "@/types/api";
import axios, { AxiosHeaders, type AxiosInstance } from "axios";

// #region Property
declare module "axios"
{
    export interface AxiosRequestConfig
    {
        __xsrfRetried?: boolean;
    }
}

export interface UniversalApiOptions
{
    /** 只在 SSR 使用；不傳則用 process.env.SSR_API_ORIGIN，且不轉發 Cookie */
    ssr?: { origin?: string; cookie?: string; acceptLanguage?: string; };
    /** 只在 CSR 使用；不傳則用 import.meta.env.VITE_API_BASE_URL 或 /Service */
    csr?: { baseURL?: string; };
    timeoutMs?: number;
}

/** 型別助手：CSR 狀態下可呼叫 __initXsrfOnce；SSR 下不存在。 */
export type BrowserApiWithInit = AxiosInstance & { __initXsrfOnce?: () => Promise<void>; };

/** 後端提供訊息包 */
export const MessageStatus = { Green: 0, Info: 1, Warning: 2, Error: 3 } as const;

export type MessageStatusCode = typeof MessageStatus[keyof typeof MessageStatus];

export type SysMessageModel = components["schemas"]["SysMessageModel"];

/** API 回傳資訊包 */
export interface ApiResponse<T>
{
    IsSuccess: boolean;
    SysMessage: SysMessageModel[];
    Data: T | null;
}

/** SSR Request 可轉發給後端的 header 資料 */
interface SsrRequestHeaders
{
    cookie: string;
    acceptLanguage: string;
}

/** XSRF 初始化處理函式 */
type EnsureXsrfHandler = () => Promise<void>;

/** Vite import.meta.env 使用的最小型別 */
type WcmsImportMeta = ImportMeta & {
    env?: {
        VITE_API_BASE_URL?: string;
    };
};

/** 預設 API timeout 毫秒數 */
const DEFAULT_API_TIMEOUT_MS = 30000;

/** CSR 預設 API base url */
const DEFAULT_CSR_BASE_URL = "/Service";

/** SSR 後端 Service 路徑 */
const SSR_SERVICE_PATH = "/Service";

/** SSR API Origin 環境變數名稱 */
const SSR_API_ORIGIN_ENV_KEY = "SSR_API_ORIGIN";

/** Accept-Language Header 名稱 */
const ACCEPT_LANGUAGE_HEADER_NAME = "Accept-Language";

/** Cookie Header 名稱 */
const COOKIE_HEADER_NAME = "cookie";

/** Request Accept-Language Header 名稱 */
const REQUEST_ACCEPT_LANGUAGE_HEADER_NAME = "accept-language";

/** 403 HTTP 狀態碼 */
const HTTP_FORBIDDEN_STATUS_CODE = 403;

/** XSRF Cookie 名稱 */
const XSRF_COOKIE_NAME = "XSRF-TOKEN";

/** XSRF Header 名稱 */
const XSRF_HEADER_NAME = "X-XSRF-TOKEN";

/** 取得 XSRF Token 的 API 路徑 */
const XSRF_TOKEN_ENDPOINT = "SystemAPI/GetXsrfToken";

/** 尾端斜線正規式 */
const TRAILING_SLASH_REGEX = /\/$/;

/** SSR：同一個 request 只建立一次 AxiosInstance。 */
const ssrApiCache = new WeakMap<Request, AxiosInstance>();
// #endregion

// #region Public
/** 建立一個可同時支援 CSR / SSR 的 Axios 實例。 */
export const createUniversalApi = (opts?: UniversalApiOptions): AxiosInstance =>
{
    const isBrowser = typeof window !== "undefined";
    const timeout = opts?.timeoutMs ?? DEFAULT_API_TIMEOUT_MS;

    if (isBrowser) return createCsrApi(opts, timeout);

    const api = createSsrApi(opts, timeout);
    return api;
};
/** 預設輸出一個通用 API 實例。 */
export const api = createUniversalApi();
/** SSR：同一個 request 只建立一次 AxiosInstance，給多個 loader 共用。 */
export const getSsrApi = (req: Request): AxiosInstance =>
{
    const cached = ssrApiCache.get(req);
    if (cached) return cached;
    const headers = readSsrRequestHeaders(req);
    const instance = createUniversalApi({ ssr: { cookie: headers.cookie, acceptLanguage: headers.acceptLanguage } });
    ssrApiCache.set(req, instance);
    return instance;
};
// #endregion

// #region Protected
/** 建立 CSR 使用的 Axios 實例。 */
const createCsrApi = (opts: UniversalApiOptions | undefined, timeout: number): BrowserApiWithInit =>
{
    const baseURL = resolveCsrBaseUrl(opts);
    const instance = axios.create({ baseURL, withCredentials: true, timeout }) as BrowserApiWithInit;

    setupCsrAcceptLanguageInterceptor(instance);
    setupCsrXsrf(instance);

    return instance;
};

/** 建立 SSR 使用的 Axios 實例。 */
const createSsrApi = (opts: UniversalApiOptions | undefined, timeout: number): AxiosInstance =>
{
    const origin = resolveSsrOrigin(opts);
    const normalizedOrigin = trimTrailingSlash(origin);
    const headers = buildSsrHeaders(opts);

    return axios.create({
        baseURL: `${normalizedOrigin}${SSR_SERVICE_PATH}`,
        withCredentials: false,
        timeout,
        headers,
    });
};

/** 設定 CSR Request Accept-Language Header。 */
const setupCsrAcceptLanguageInterceptor = (instance: AxiosInstance): void =>
{
    instance.interceptors.request.use((config) =>
    {
        const cookieLang = LibCookie.readClientCookieValue(LANG_COOKIE_KEY);
        const acceptLang = toAcceptLanguage(cookieLang ?? undefined);

        config.headers = AxiosHeaders.from(config.headers);
        if (!config.headers.has(ACCEPT_LANGUAGE_HEADER_NAME)) config.headers.set(ACCEPT_LANGUAGE_HEADER_NAME, acceptLang);

        return config;
    });
};

/** 設定 CSR XSRF Cookie / Header 與初始化方法。 */
const setupCsrXsrf = (instance: BrowserApiWithInit): void =>
{
    setXsrfDefaults(instance);

    const ensureXsrf = createXsrfEnsurer(instance);

    instance.__initXsrfOnce = async () =>
    {
        await ensureXsrf();
    };

    setupCsrXsrfRetryInterceptor(instance, ensureXsrf);
};

/** 設定 XSRF 失效後自動補票並重試一次。 */
const setupCsrXsrfRetryInterceptor = (instance: AxiosInstance, ensureXsrf: EnsureXsrfHandler): void =>
{
    instance.interceptors.response.use(response => response, async (err) =>
    {
        const config = err?.config;
        const status = err?.response?.status;

        if (status !== HTTP_FORBIDDEN_STATUS_CODE || !config || config.__xsrfRetried) return Promise.reject(err);

        config.__xsrfRetried = true;
        await ensureXsrf();

        return instance(config);
    });
};
// #endregion

// #region Private
/** 解析 CSR API base url。 */
const resolveCsrBaseUrl = (opts?: UniversalApiOptions): string =>
{
    const env = import.meta as WcmsImportMeta;
    const baseURL = opts?.csr?.baseURL ?? env.env?.VITE_API_BASE_URL ?? DEFAULT_CSR_BASE_URL;

    return baseURL;
};

/** 解析 SSR API origin，未設定時丟出明確錯誤。 */
const resolveSsrOrigin = (opts?: UniversalApiOptions): string =>
{
    const origin = opts?.ssr?.origin ?? process.env[SSR_API_ORIGIN_ENV_KEY];

    if (!origin) throw new Error("[APIBase] SSR 模式需要提供 ssr.origin 或設定環境變數 SSR_API_ORIGIN。");

    return origin;
};

/** 建立 SSR 轉發給後端的 Headers。 */
const buildSsrHeaders = (opts?: UniversalApiOptions): Record<string, string> =>
{
    const headers: Record<string, string> = {};

    if (opts?.ssr?.cookie) headers.Cookie = opts.ssr.cookie;
    if (opts?.ssr?.acceptLanguage) headers[ACCEPT_LANGUAGE_HEADER_NAME] = opts.ssr.acceptLanguage;

    return headers;
};

/** 從 SSR Request 讀取可轉發 Header。 */
const readSsrRequestHeaders = (req: Request): SsrRequestHeaders =>
{
    const cookie = getHeader(req, COOKIE_HEADER_NAME);
    const acceptLanguage = getHeader(req, REQUEST_ACCEPT_LANGUAGE_HEADER_NAME);

    return { cookie, acceptLanguage };
};

/** 讀取 Request Header，沒有值時回傳空字串。 */
const getHeader = (req: Request, name: string): string =>
{
    const value = req.headers.get(name);
    return value ? String(value) : "";
};

/** 移除 origin 尾端斜線。 */
const trimTrailingSlash = (value: string): string =>
{
    const trimmed = value.replace(TRAILING_SLASH_REGEX, "");
    return trimmed;
};

/** 設定 Axios XSRF 預設值。 */
const setXsrfDefaults = (instance: AxiosInstance): void =>
{
    const defaults = instance.defaults as AxiosInstance["defaults"] & {
        xsrfCookieName: string;
        xsrfHeaderName: string;
    };

    defaults.xsrfCookieName = XSRF_COOKIE_NAME;
    defaults.xsrfHeaderName = XSRF_HEADER_NAME;
};

/** 建立 XSRF 初始化處理，避免同時間重複取票。 */
const createXsrfEnsurer = (instance: AxiosInstance): EnsureXsrfHandler =>
{
    let xsrfOnce: Promise<void> | null = null;

    const ensureXsrf = async (): Promise<void> =>
    {
        if (xsrfOnce) return xsrfOnce;

        xsrfOnce = requestXsrfToken(instance).finally(() =>
        {
            xsrfOnce = null;
        });

        return xsrfOnce;
    };

    return ensureXsrf;
};

/** 呼叫後端取得 XSRF Token。 */
const requestXsrfToken = async (instance: AxiosInstance): Promise<void> =>
{
    await instance.get(XSRF_TOKEN_ENDPOINT);
};

/** 將站台語系 Cookie 值轉成 Accept-Language Header 值。 */
const toAcceptLanguage = (raw?: string): string =>
{
    const text = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");

    if (text === "zh-tw" || text === "zh-hant-tw" || text.startsWith("zh-hant")) return "zh-TW";
    if (text === "en" || text.startsWith("en-")) return "en";

    return "zh-TW";
};
// #endregion
