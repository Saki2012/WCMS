export type BuildProdCspOptions = Readonly<{ enforceTrustedTypes?: boolean; }>;

const joinSources = (sources: readonly string[]): string =>
{
    return sources.filter(Boolean).join(" ");
};

/**
 * 建立正式環境 CSP。
 * script 使用 nonce + strict-dynamic，避免 hydration 需要的 inline state 被 CSP 擋住，也移除 unsafe-inline 造成的弱掃問題。
 */
export const buildProdCsp = (nonce: string, options: BuildProdCspOptions = {}): string =>
{
    const cleanNonce = String(nonce || "").trim();
    const nonceSource = cleanNonce ? `'nonce-${cleanNonce}'` : "";

    const scriptSrc = joinSources(["'self'", nonceSource, "'strict-dynamic'"]);

    const styleSrc = joinSources([
        "'self'",
        "'unsafe-inline'",
        "https://fonts.googleapis.com",
        "https://www.gstatic.com",
        "https://calendar.google.com",
        "https://accounts.google.com",
        "https://maps.gstatic.com",
    ]);

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
        "default-src 'self'",
        `script-src ${scriptSrc}`,
        `script-src-elem ${scriptSrc}`,
        "script-src-attr 'none'",
        `style-src ${styleSrc}`,
        `style-src-elem ${styleSrc}`,
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
