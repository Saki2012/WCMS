// #region Property
export type CspStyleMode = "balanced" | "legacy" | "strict";

export type BuildProdCspOptions = Readonly<{ enforceTrustedTypes?: boolean; styleMode?: CspStyleMode; }>;

/** Cloudflare Turnstile 前台驗證碼來源；iframe 仍由 frame-src 控制。 */
const turnstileSource = "https://challenges.cloudflare.com";
// #endregion

// #region Public
/**
 * 建立正式環境 CSP。
 * Script 改採每次 Response nonce + strict-dynamic，避免以 URL Allowlist 作為可執行腳本信任來源。
 */
export const buildProdCsp = (nonce: string, options: BuildProdCspOptions = {}): string =>
{
    const styleMode = options.styleMode ?? "balanced";

    const scriptSrc = joinSources(buildScriptSources(nonce));
    const styleSrc = joinSources(buildStyleSources(styleMode));
    const styleAttrSrc = joinSources(buildStyleAttrSources(styleMode));

    const imgSrc = joinSources([
        "'self'",
        "data:",
        "blob:",
        "https://www.gstatic.com",
        "https://www.google.com",
        "https://i.ytimg.com",
        "https://img.youtube.com",
        "https://calendar.google.com",
        "https://accounts.google.com",
        "https://maps.googleapis.com",
        "https://mapsresources-pa.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
    ]);

    const fontSrc = joinSources(["'self'", "data:", "https://fonts.gstatic.com", "https://calendar.google.com"]);

    const connectSrc = joinSources([
        "'self'",
        "https://translate.google.com",
        "https://translate.googleapis.com",
        "https://translate-pa.googleapis.com",
        "https://calendar.google.com",
        "https://accounts.google.com",
        "https://apis.google.com",
        "https://www.google.com",
        "https://maps.googleapis.com",
        "https://mapsresources-pa.googleapis.com",
        "https://maps.gstatic.com",
        "https://www.googletagmanager.com",
        "https://www.google-analytics.com",
        "https://region1.google-analytics.com",
    ]);

    const frameSrc = joinSources([
        "'self'",
        "https://translate.google.com",
        "https://www.youtube.com",
        "https://www.youtube-nocookie.com",
        "https://w.soundcloud.com",
        "https://calendar.google.com",
        "https://accounts.google.com",
        "https://www.google.com",
        "https://maps.google.com",
        "https://docs.google.com",
        "https://drive.google.com",
        "https://lookerstudio.google.com",
        "https://datastudio.google.com",
        "https://www.googletagmanager.com",
        "https://720yun.com",
        "https://www.720yun.com",
        turnstileSource,
    ]);

    const csp = [
        "default-src 'none'",
        `script-src ${scriptSrc}`,
        "script-src-attr 'none'",
        `style-src ${styleSrc}`,
        `style-src-elem ${styleSrc}`,
        `style-src-attr ${styleAttrSrc}`,
        `img-src ${imgSrc}`,
        `font-src ${fontSrc}`,
        `connect-src ${connectSrc}`,
        "frame-ancestors 'self'",
        `frame-src ${frameSrc}`,
        "media-src 'self' data: blob: https:",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
    ];

    if (options.enforceTrustedTypes)
    {
        csp.push("require-trusted-types-for 'script'");
        csp.push("trusted-types default react dompurify tinyMCE wcms");
    }

    return csp.join("; ");
};
// #endregion

// #region Private
/** 移除 CSP Source 重複值並過濾空字串。 */
const uniqueSources = (sources: readonly string[]): string[] =>
{
    return [...new Set(sources.map(source => String(source || "").trim()).filter(Boolean))];
};

/** 將 CSP Source 清單組成 Header 使用格式。 */
const joinSources = (sources: readonly string[]): string =>
{
    return uniqueSources(sources).join(" ");
};

/** 建立 Script 信任來源，僅允許目前 Response nonce 與 strict-dynamic 信任鏈。 */
const buildScriptSources = (nonce: string): string[] =>
{
    const normalizedNonce = String(nonce || "").trim();
    if (!normalizedNonce) throw new Error("[WCMS] CSP nonce 不可為空。");

    return [`'nonce-${normalizedNonce}'`, "'strict-dynamic'"];
};

/** 建立可載入樣式來源。 */
const buildStyleSources = (styleMode: CspStyleMode): string[] =>
{
    const sources = [
        "'self'",
        "https://fonts.googleapis.com",
        "https://www.gstatic.com",
        "https://calendar.google.com",
        "https://accounts.google.com",
        "https://maps.gstatic.com",
    ];

    return styleMode === "legacy" ? [...sources, "'unsafe-inline'"] : sources;
};

/** 建立 Style Attribute CSP；strict 模式完全禁止 inline style attribute。 */
const buildStyleAttrSources = (styleMode: CspStyleMode): string[] =>
{
    if (styleMode === "strict") return ["'none'"];
    return ["'unsafe-inline'"];
};
// #endregion
