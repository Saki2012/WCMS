export type CspStyleMode = "balanced" | "legacy" | "strict";

export type BuildProdCspOptions = Readonly<{ enforceTrustedTypes?: boolean; allowScriptSelfFallback?: boolean; styleMode?: CspStyleMode; }>;

const uniqueSources = (sources: readonly string[]): string[] =>
{
    return [...new Set(sources.map(s => String(s || "").trim()).filter(Boolean))];
};

const joinSources = (sources: readonly string[]): string =>
{
    return uniqueSources(sources).join(" ");
};

const buildScriptSources = (nonceSource: string, allowSelfFallback: boolean): string[] =>
{
    if (!nonceSource) return ["'self'"];
    return allowSelfFallback ? [nonceSource, "'strict-dynamic'", "'self'"] : [nonceSource, "'strict-dynamic'"];
};

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

const buildStyleAttrSources = (styleMode: CspStyleMode): string[] =>
{
    if (styleMode === "strict") return ["'none'"];
    return ["'unsafe-inline'"];
};

/**
 * 建立正式環境 CSP。
 * 預設採 nonce + strict-dynamic，並將 CSP 僅用於 HTML response，降低靜態資源被弱掃重複列點的機率。
 */
export const buildProdCsp = (nonce: string, options: BuildProdCspOptions = {}): string =>
{
    const cleanNonce = String(nonce || "").trim();
    const nonceSource = cleanNonce ? `'nonce-${cleanNonce}'` : "";
    const styleMode = options.styleMode ?? "balanced";

    const scriptSrc = joinSources(buildScriptSources(nonceSource, options.allowScriptSelfFallback === true));
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
    ]);

    const csp = [
        "default-src 'none'",
        `script-src ${scriptSrc}`,
        `script-src-elem ${scriptSrc}`,
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
