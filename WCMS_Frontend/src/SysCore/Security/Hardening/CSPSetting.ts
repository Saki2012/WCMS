// #region Property
export type CspStyleMode = "balanced" | "legacy" | "strict";

export type BuildProdCspOptions = Readonly<{ styleMode?: CspStyleMode; }>;

/** Google Translate 前台翻譯服務來源。 */
const googleTranslateSources = ["https://translate.google.com", "https://translate.googleapis.com", "https://translate-pa.googleapis.com"] as const;

/** Google 共用服務來源。 */
const googleCommonSources = ["https://www.google.com", "https://www.gstatic.com", "https://apis.google.com"] as const;

/** Google 帳號與行事曆服務來源。 */
const googleWorkspaceSources = ["https://calendar.google.com", "https://accounts.google.com"] as const;

/** Google Maps 服務來源。 */
const googleMapsSources = ["https://maps.googleapis.com", "https://mapsresources-pa.googleapis.com", "https://maps.gstatic.com", "https://maps.google.com"] as const;

/** Google Analytics 與 Tag Manager 服務來源。 */
const googleAnalyticsSources = ["https://www.googletagmanager.com", "https://www.google-analytics.com", "https://region1.google-analytics.com"] as const;

/** YouTube 影音與縮圖來源。 */
const youtubeFrameSources = ["https://www.youtube.com", "https://www.youtube-nocookie.com"] as const;
const youtubeImageSources = ["https://i.ytimg.com", "https://img.youtube.com"] as const;

/** 其他常用嵌入式媒體來源。 */
const externalFrameSources = ["https://w.soundcloud.com", "https://720yun.com", "https://www.720yun.com"] as const;

/** Google 文件與報表嵌入來源。 */
const googleDocumentFrameSources = ["https://docs.google.com", "https://drive.google.com", "https://lookerstudio.google.com", "https://datastudio.google.com"] as const;

/** Cloudflare Turnstile 前台驗證碼來源；iframe 仍由 frame-src 控制。 */
const turnstileSource = "https://challenges.cloudflare.com";
// #endregion

// #region Public
/**
 * 建立正式環境 CSP。
 * Script 採每次 Response nonce + strict-dynamic 並強制 Trusted Types；Balanced 保留 Style Attribute 相容性，但不開放 inline Style Element。
 */
export const buildProdCsp = (nonce: string, options: BuildProdCspOptions = {}): string =>
{
    const styleMode = options.styleMode ?? "balanced";

    const scriptSrc = joinSources(buildScriptSources(nonce));
    const styleSrc = joinSources(buildStyleSources(styleMode));
    const styleAttrSrc = joinSources(buildStyleAttrSources(styleMode));
    const imgSrc = joinSources(buildImageSources());
    const fontSrc = joinSources(buildFontSources());
    const connectSrc = joinSources(buildConnectSources());
    const frameSrc = joinSources(buildFrameSources());

    const csp = [
        "default-src 'none'",
        `script-src ${scriptSrc}`,
        "script-src-attr 'none'",
        "require-trusted-types-for 'script'",
        `style-src ${styleSrc}`,
        `style-src-elem ${styleSrc}`,
        `style-src-attr ${styleAttrSrc}`,
        `img-src ${imgSrc}`,
        `font-src ${fontSrc}`,
        `connect-src ${connectSrc}`,
        "frame-ancestors 'self'",
        `frame-src ${frameSrc}`,
        "media-src 'self' data: blob:",
        "worker-src 'self' blob:",
        "manifest-src 'self'",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "upgrade-insecure-requests",
    ];

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

/** 建立可載入樣式來源；Balanced 不開放 inline Style Element。 */
const buildStyleSources = (styleMode: CspStyleMode): string[] =>
{
    const sources = ["'self'", "https://fonts.googleapis.com", "https://www.gstatic.com", ...googleWorkspaceSources, "https://maps.gstatic.com"];
    return styleMode === "legacy" ? [...sources, "'unsafe-inline'"] : sources;
};

/** 建立 Style Attribute CSP；Balanced 保留 CMS 與第三方套件常見的 Style Attribute。 */
const buildStyleAttrSources = (styleMode: CspStyleMode): string[] =>
{
    if (styleMode === "strict") return ["'none'"];
    return ["'unsafe-inline'"];
};

/** 建立圖片來源白名單。 */
const buildImageSources = (): string[] =>
{
    return ["'self'", "data:", "blob:", ...googleCommonSources, ...youtubeImageSources, ...googleWorkspaceSources, ...googleMapsSources, ...googleAnalyticsSources];
};

/** 建立字型來源白名單。 */
const buildFontSources = (): string[] =>
{
    return ["'self'", "data:", "https://fonts.gstatic.com", "https://calendar.google.com"];
};

/** 建立前端連線來源白名單。 */
const buildConnectSources = (): string[] =>
{
    return ["'self'", ...googleTranslateSources, ...googleWorkspaceSources, ...googleCommonSources, ...googleMapsSources, ...googleAnalyticsSources];
};

/** 建立 iframe 與外部嵌入來源白名單。 */
const buildFrameSources = (): string[] =>
{
    return ["'self'", "https://translate.google.com", ...youtubeFrameSources, ...externalFrameSources, ...googleWorkspaceSources, "https://www.google.com", "https://maps.google.com", ...googleDocumentFrameSources, "https://www.googletagmanager.com", turnstileSource];
};
// #endregion
