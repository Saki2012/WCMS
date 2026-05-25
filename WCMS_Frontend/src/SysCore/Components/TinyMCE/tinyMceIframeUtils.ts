const IFRAME_DIMENSION_RE = /^\d+(?:\.\d+)?(?:px|%|vh|vw|rem|em)?$/i;
const GOOGLE_MAPS_HOST_PATTERN = /(^|\.)google\.[^/]+$/i;

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

    return url.pathname.startsWith("/maps/embed") || url.pathname.startsWith("/maps/embed/v1");
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
