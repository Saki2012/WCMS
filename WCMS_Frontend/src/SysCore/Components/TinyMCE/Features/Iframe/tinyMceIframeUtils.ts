import {
    isGoogleMapsEmbedUrl,
    isGoogleMapsShortUrl,
    isGoogleMapsUrl,
    normalizeGoogleMapsEmbedUrl,
} from "@/SysCore/Components/CmsHtml/CmsIframeUtils";

// #region Property
const IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?(?:px|%|vh|vw|rem|em)?$/i;
const NUMERIC_IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?$/;
const PX_IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?px$/i;
// #endregion

// #region Public
// TinyMCE 7 defaults to sandboxing all iframe previews in-editor.
// Keep that protection, but let Google Maps embeds render normally in the editor preview.
export const WCMS_TINYMCE_IFRAME_SANDBOX_EXCLUSIONS = [
    "youtube.com",
    "youtu.be",
    "vimeo.com",
    "player.vimeo.com",
    "dailymotion.com",
    "embed.music.apple.com",
    "open.spotify.com",
    "giphy.com",
    "dai.ly",
    "codepen.io",
    "google.com",
    "maps.google.com",
] as const;

export const normalizeIframeWidth = (raw?: string): string => normalizeIframeDimension(raw, "100%");

export const normalizeIframeHeight = (raw?: string): string => normalizeIframeDimension(raw, "360");

export const toIframeCssDimension = (value: string): string =>
{
    return NUMERIC_IFRAME_DIMENSION_RE.test(value) ? `${value}px` : value;
};

export const toIframeDimensionAttribute = (value: string): string | null =>
{
    if (!value) return null;
    if (NUMERIC_IFRAME_DIMENSION_RE.test(value)) return value;
    if (PX_IFRAME_DIMENSION_RE.test(value)) return value.replace(/px$/i, "");
    return null;
};

export { isGoogleMapsEmbedUrl, isGoogleMapsUrl };

/**
 * 驗證並正規化 iframe URL。
 * Google Maps 一般 place/search/座標網址可直接轉為 embed；短網址或無法解析目的地的網址要求使用官方嵌入 src。
 */
export const validateIframeSrc = (raw?: string): { url: string; warning?: string; } =>
{
    const url = `${raw ?? ""}`.trim();
    if (!url) return { url: "" };
    if (isGoogleMapsShortUrl(url))
    {
        return { url, warning: "Google Maps 短網址無法直接轉成 iframe，請由「分享 → 嵌入地圖」複製 iframe src。" };
    }
    if (!isGoogleMapsUrl(url)) return { url };

    const normalizedUrl = normalizeGoogleMapsEmbedUrl(url);
    if (isGoogleMapsEmbedUrl(normalizedUrl)) return { url: normalizedUrl };
    return { url, warning: "Google Maps 請使用「分享 → 嵌入地圖」提供的 iframe src；目前網址無法安全轉成可嵌入格式。" };
};

export const getIframeReferrerPolicy = (value: string): string =>
{
    return isGoogleMapsEmbedUrl(value) ? "no-referrer-when-downgrade" : "strict-origin-when-cross-origin";
};
// #endregion

// #region Private
const normalizeIframeDimension = (raw: string | undefined, fallback: string): string =>
{
    const value = `${raw ?? ""}`.trim();
    if (!value) return fallback;
    if (!IFRAME_DIMENSION_RE.test(value)) return fallback;
    return value.toLowerCase();
};
// #endregion
