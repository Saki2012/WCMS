export const buildProdCsp = (nonce: string): string =>
{
    // 宣告變數：正式環境 CSP 白名單
    const csp = [
        "default-src 'self'",
        `script-src 'self' 'nonce-${nonce}' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://calendar.google.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com`,
        `script-src-elem 'self' 'nonce-${nonce}' 'unsafe-inline' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://calendar.google.com https://accounts.google.com https://apis.google.com https://www.gstatic.com https://maps.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com`,
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://calendar.google.com https://accounts.google.com https://maps.gstatic.com",
        "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com https://www.gstatic.com https://calendar.google.com https://accounts.google.com https://maps.gstatic.com",
        "img-src 'self' data: blob: https: https://www.gstatic.com https://www.google.com https://i.ytimg.com https://img.youtube.com https://calendar.google.com https://accounts.google.com https://maps.googleapis.com https://mapsresources-pa.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com",
        "font-src 'self' data: https://fonts.gstatic.com https://calendar.google.com",
        "connect-src 'self' https://translate.google.com https://translate.googleapis.com https://translate-pa.googleapis.com https://calendar.google.com https://accounts.google.com https://apis.google.com https://www.google.com https://maps.googleapis.com https://mapsresources-pa.googleapis.com https://maps.gstatic.com https://www.googletagmanager.com https://www.google-analytics.com https://region1.google-analytics.com",
        "frame-ancestors 'self'",
        "frame-src 'self' https://translate.google.com https://www.youtube.com https://www.youtube-nocookie.com https://w.soundcloud.com https://calendar.google.com https://accounts.google.com https://www.google.com https://maps.google.com https://docs.google.com https://drive.google.com https://lookerstudio.google.com https://datastudio.google.com https://www.googletagmanager.com",
        "object-src 'none'",
        "base-uri 'self'",
        "form-action 'self'",
    ].join("; ");

    // return
    return csp;
};
