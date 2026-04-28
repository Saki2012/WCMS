// src/api/APIBase.ts
import { LANG_COOKIE_KEY } from "@/SysCore/Utils/Library/SysParam";
import type { components } from "@/types/api";
import axios, { AxiosHeaders, type AxiosInstance } from "axios";

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
    ssr?: {
        origin?: string; // 例如 https://xxx
        cookie?: string; // 由 req.headers.cookie 傳入，可選
        acceptLanguage?: string;
    };
    /** 只在 CSR 使用；不傳則用 import.meta.env.VITE_API_BASE_URL 或 /Service */
    csr?: {
        baseURL?: string; // 例如 /Service
    };
    timeoutMs?: number;
}

/** 建立一個『可同時跑 CSR/SSR』的 Axios 實例 */
export const createUniversalApi = (opts?: UniversalApiOptions): AxiosInstance =>
{
    const isBrowser = typeof window !== "undefined";
    const timeout = opts?.timeoutMs ?? 30000;

    if (isBrowser)
    {
        // --------- CSR：相對路徑 + XSRF + 403 補票 ----------
        const baseURL = opts?.csr?.baseURL ?? ((typeof import.meta !== "undefined" && (import.meta as any).env?.VITE_API_BASE_URL) || "/Service");

        const api = axios.create({ baseURL, withCredentials: true, timeout });

        // #region cookie相關
        const getCookieValue = (cookieStr: string, name: string): string | undefined =>
        {
            if (!cookieStr) return undefined;
            const parts = cookieStr.split(";");
            for (const part of parts)
            {
                const p = part.trim();
                if (p.startsWith(name + "="))
                {
                    const value = p.substring(name.length + 1);
                    return decodeURIComponent(value);
                }
            }
            return undefined;
        };
        const toAcceptLanguage = (raw?: string): string =>
        {
            const s = (raw ?? "").trim().toLowerCase().replace(/_/g, "-");
            if (s === "zh-tw" || s === "zh-hant-tw" || s.startsWith("zh-hant")) return "zh-TW";
            if (s === "en" || s.startsWith("en-")) return "en";
            return "zh-TW"; // fallback：站台預設
        };
        api.interceptors.request.use((config) =>
        {
            const cookieLang = getCookieValue(document.cookie, LANG_COOKIE_KEY);
            const acceptLang = toAcceptLanguage(cookieLang);
            config.headers = AxiosHeaders.from(config.headers);
            // 允許呼叫端覆寫：如果已經有就不動
            if (!config.headers.has("Accept-Language")) config.headers.set("Accept-Language", acceptLang);
            return config;
        });
        // #endregion

        // 與後端名稱一致
        (api.defaults as any).xsrfCookieName = "XSRF-TOKEN";
        (api.defaults as any).xsrfHeaderName = "X-XSRF-TOKEN";

        // 只在 CSR 取票
        let _xsrfOnce: Promise<void> | null = null;
        const ensureXsrf = async () =>
        {
            if (_xsrfOnce) return _xsrfOnce;
            _xsrfOnce = (async () =>
            {
                try
                {
                    await api.get("SystemAPI/GetXsrfToken");
                } finally
                {
                    // 204 No Content
                    _xsrfOnce = null;
                }
            })();
            return _xsrfOnce;
        };

        // 暴露初始化（CSR 入口可呼叫一次；SSR 呼叫也沒差，只是不會執行）
        (api as any).__initXsrfOnce = async () =>
        {
            await ensureXsrf();
        };

        // 403 多半是 XSRF 失效 → 自動補票並重試一次
        api.interceptors.response.use(r => r, async (err) =>
        {
            const cfg = err?.config, s = err?.response?.status;
            if (s === 403 && cfg && !cfg.__xsrfRetried)
            {
                cfg.__xsrfRetried = true;
                await ensureXsrf();
                return api(cfg);
            }
            return Promise.reject(err);
        });

        return api;
    }

    // --------- SSR：絕對路徑 + 可選 Cookie 轉發（不做 XSRF/攔截器） ----------
    const origin = opts?.ssr?.origin ?? process.env.SSR_API_ORIGIN; // e.g. https://xxx
    if (!origin)
    {
        throw new Error("[APIBase] SSR 模式需要提供 ssr.origin 或設定環境變數 SSR_API_ORIGIN。");
    }

    const normalized = origin.replace(/\/$/, "");
    return axios.create({
        baseURL: `${normalized}/Service`,
        withCredentials: false, // Node 端不走瀏覽器 Cookie
        timeout,
        headers: {
            ...(opts?.ssr?.cookie ? { Cookie: opts.ssr.cookie } : {}),
            ...(opts?.ssr?.acceptLanguage ? { "Accept-Language": opts.ssr.acceptLanguage } : {}),
        },
    });
};

/** 預設輸出一個『通用實例』：CSR/SSR 都可以直接 import 使用 */
const api = createUniversalApi();
export default api;

/** 型別助手：CSR 狀態下可呼叫 __initXsrfOnce；SSR 下不存在（不影響使用） */
export type BrowserApiWithInit = AxiosInstance & { __initXsrfOnce?: () => Promise<void>; };

/** 後端提供訊息包 */
export const MessageStatus = { Green: 0, Info: 1, Warning: 2, Error: 3 } as const;
export type MessageStatusCode = typeof MessageStatus[keyof typeof MessageStatus];
export type SysMessageModel = components["schemas"]["SysMessageModel"];
/** API回傳資訊包 */
export interface ApiResponse<T>
{
    IsSuccess: boolean;
    SysMessage: SysMessageModel[];
    Data: T | null;
}

/** SSR Api */

const _cache = new WeakMap<Request, AxiosInstance>();

const getHeader = (req: Request, name: string): string =>
{
    // 宣告變數
    const v = req.headers.get(name);
    // return
    return v ? String(v) : "";
};

/** SSR：同一個 request 只建立一次 AxiosInstance（給多個 loader 共用） */
export const getSsrApi = (req: Request): AxiosInstance =>
{
    // 宣告變數
    const cached = _cache.get(req);
    // 執行 function
    if (cached) return cached;
    const cookie = getHeader(req, "cookie");
    const acceptLang = getHeader(req, "accept-language");
    const api = createUniversalApi({ ssr: { cookie, acceptLanguage: acceptLang } });
    // SSR 也要跟 CSR 一致：把語系帶給後端
    if (acceptLang) (api.defaults.headers as any).common["Accept-Language"] = acceptLang;
    _cache.set(req, api);
    // return
    return api;
};
