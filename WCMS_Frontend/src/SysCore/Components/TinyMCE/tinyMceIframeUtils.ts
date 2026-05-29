const IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?(?:px|%|vh|vw|rem|em)?$/i;
const GOOGLE_MAPS_HOST_PATTERN = /(^|\.)google\.[^/]+$/i;
const NUMERIC_IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?$/;
const PX_IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?px$/i;

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

const normalizeIframeDimension = (raw: string | undefined, fallback: string): string =>
{
    const value = `${raw ?? ""}`.trim();
    if (!value) return fallback;
    if (!IFRAME_DIMENSION_RE.test(value)) return fallback;
    return value.toLowerCase();
};

const tryParseUrl = (value: string): URL | null =>
{
    try
    {
        return new URL(value);
    } catch
    {
        return null;
    }
};

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

export const isGoogleMapsUrl = (value: string): boolean =>
{
    const url = tryParseUrl(value);
    if (!url) return false;
    if (!GOOGLE_MAPS_HOST_PATTERN.test(url.hostname)) return false;

    return url.hostname.startsWith("maps.") || url.pathname.startsWith("/maps");
};

export const isGoogleMapsEmbedUrl = (value: string): boolean =>
{
    const url = tryParseUrl(value);
    if (!url) return false;
    if (!GOOGLE_MAPS_HOST_PATTERN.test(url.hostname)) return false;

    return url.pathname.startsWith("/maps/embed")
        || url.pathname.startsWith("/maps/embed/v1")
        || (url.pathname.startsWith("/maps") && url.searchParams.get("output") === "embed");
};

export const validateIframeSrc = (raw?: string): { url: string; warning?: string; } =>
{
    const url = `${raw ?? ""}`.trim();
    if (!url) return { url: "" };
    if (isGoogleMapsUrl(url) && !isGoogleMapsEmbedUrl(url))
    {
        return { url, warning: "Google Maps requires an iframe embed src; share URLs are not supported." };
    }
    return { url };
};

export const getIframeReferrerPolicy = (value: string): string =>
{
    return isGoogleMapsEmbedUrl(value) ? "no-referrer-when-downgrade" : "strict-origin-when-cross-origin";
};
