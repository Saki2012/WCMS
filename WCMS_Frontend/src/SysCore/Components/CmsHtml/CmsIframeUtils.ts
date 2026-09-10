// #region Property
const YOUTUBE_HOST_NAMES = new Set([
    "youtube.com",
    "www.youtube.com",
    "m.youtube.com",
    "youtube-nocookie.com",
    "www.youtube-nocookie.com",
    "youtu.be",
    "www.youtu.be",
]);

const YOUTUBE_IFRAME_ALLOW_FEATURES = [
    "accelerometer",
    "autoplay",
    "clipboard-write",
    "encrypted-media",
    "gyroscope",
    "picture-in-picture",
    "web-share",
    "fullscreen",
];

const GOOGLE_MAPS_HOST_PATTERN = /(^|\.)google\.[a-z.]+$/i;
const GOOGLE_MAPS_SHORT_HOST_NAMES = new Set(["maps.app.goo.gl", "goo.gl", "www.goo.gl"]);
// #endregion

// #region Public
/** 判斷 iframe URL 是否屬於支援的 YouTube 網域。 */
export const isYoutubeIframeUrl = (value?: string | null): boolean =>
{
    const url = parseHttpUrl(value);
    return url ? YOUTUBE_HOST_NAMES.has(normalizeHostName(url.hostname)) : false;
};

/** 將 YouTube 分享、觀看及 Shorts URL 正規化為可嵌入網址。 */
export const normalizeYoutubeEmbedUrl = (value?: string | null): string =>
{
    const raw = `${value ?? ""}`.trim();
    const url = parseHttpUrl(raw);
    if (!url || !YOUTUBE_HOST_NAMES.has(normalizeHostName(url.hostname))) return raw;

    const hostName = normalizeHostName(url.hostname);
    const pathParts = url.pathname.split("/").map(part => part.trim()).filter(Boolean);
    const isEmbedUrl = pathParts[0]?.toLowerCase() === "embed";
    const videoId = isEmbedUrl ? pathParts[1] : resolveYoutubeVideoId(url, hostName, pathParts);
    if (!videoId) return raw;

    const embedOrigin = hostName.includes("youtube-nocookie.com") ? "https://www.youtube-nocookie.com" : "https://www.youtube.com";
    const embedUrl = new URL(`/embed/${encodeURIComponent(videoId)}`, embedOrigin);
    copyYoutubeSearchParams(url, embedUrl);
    return embedUrl.toString();
};

/** 保留既有 iframe 權限，補齊 YouTube 播放器需要的 feature。 */
export const mergeYoutubeIframeAllow = (value?: string | null): string =>
{
    const entries = `${value ?? ""}`.split(";").map(item => item.trim()).filter(Boolean);
    const featureNames = new Set(entries.map(entry => entry.split(/\s+/, 1)[0]?.toLowerCase()).filter((name): name is string => Boolean(name)));

    YOUTUBE_IFRAME_ALLOW_FEATURES.forEach(feature =>
    {
        if (!featureNames.has(feature)) entries.push(feature);
    });

    return entries.join("; ");
};

/** 判斷 URL 是否為 Google Maps 網頁或 iframe 來源。 */
export const isGoogleMapsUrl = (value?: string | null): boolean =>
{
    const url = parseHttpUrl(value);
    if (!url || !GOOGLE_MAPS_HOST_PATTERN.test(normalizeHostName(url.hostname))) return false;

    const hostName = normalizeHostName(url.hostname);
    const pathName = url.pathname.toLowerCase();
    return hostName.startsWith("maps.") || pathName === "/maps" || pathName.startsWith("/maps/");
};

/** 判斷是否已經是瀏覽器可直接 iframe 的 Google Maps embed URL。 */
export const isGoogleMapsEmbedUrl = (value?: string | null): boolean =>
{
    const url = parseHttpUrl(value);
    if (!url || !isGoogleMapsUrl(url.toString())) return false;

    const pathName = url.pathname.toLowerCase();
    const output = `${url.searchParams.get("output") ?? ""}`.toLowerCase();
    return pathName.startsWith("/maps/embed")
        || pathName.startsWith("/maps/d/embed")
        || (pathName.startsWith("/maps") && output === "embed");
};

/** 判斷是否為無法在前端離線解析目的地的 Google Maps 短網址。 */
export const isGoogleMapsShortUrl = (value?: string | null): boolean =>
{
    const url = parseHttpUrl(value);
    if (!url) return false;
    const hostName = normalizeHostName(url.hostname);
    if (hostName === "maps.app.goo.gl") return true;
    return (hostName === "goo.gl" || hostName === "www.goo.gl") && url.pathname.toLowerCase().startsWith("/maps");
};

/**
 * 將可辨識的 Google Maps 分享／瀏覽網址轉成 iframe 可使用的 embed URL。
 * 已是官方 embed URL 時保持其參數；短網址或無法解析目的地的網址不猜測內容，原樣回傳。
 */
export const normalizeGoogleMapsEmbedUrl = (value?: string | null): string =>
{
    const raw = `${value ?? ""}`.trim();
    const url = parseHttpUrl(raw);
    if (!url || !isGoogleMapsUrl(url.toString())) return raw;
    if (isGoogleMapsEmbedUrl(url.toString())) return url.toString();

    const myMapsUrl = buildGoogleMyMapsEmbedUrl(url);
    if (myMapsUrl) return myMapsUrl;

    const legacyMapsUrl = buildLegacyGoogleMapsEmbedUrl(url);
    if (legacyMapsUrl) return legacyMapsUrl;

    const query = resolveGoogleMapsQuery(url);
    if (!query) return raw;

    const embedUrl = new URL("https://www.google.com/maps");
    embedUrl.searchParams.set("q", query);
    embedUrl.searchParams.set("output", "embed");
    return embedUrl.toString();
};
// #endregion

// #region Private
const parseHttpUrl = (value?: string | null): URL | null =>
{
    const raw = `${value ?? ""}`.trim();
    if (!raw) return null;

    try
    {
        const url = new URL(raw.startsWith("//") ? `https:${raw}` : raw);
        return url.protocol === "http:" || url.protocol === "https:" ? url : null;
    } catch
    {
        return null;
    }
};

const normalizeHostName = (value: string): string =>
{
    return value.trim().toLowerCase().replace(/\.$/, "");
};

const resolveYoutubeVideoId = (url: URL, hostName: string, pathParts: string[]): string =>
{
    if (hostName === "youtu.be" || hostName === "www.youtu.be") return pathParts[0] ?? "";

    const firstPart = pathParts[0]?.toLowerCase();
    if (firstPart === "watch") return `${url.searchParams.get("v") ?? ""}`.trim();
    if (firstPart === "shorts" || firstPart === "live") return pathParts[1] ?? "";
    return "";
};

const copyYoutubeSearchParams = (source: URL, target: URL): void =>
{
    source.searchParams.forEach((value, key) =>
    {
        if (key.toLowerCase() !== "v") target.searchParams.append(key, value);
    });
};

/** Google My Maps viewer 轉成官方 /maps/d/embed。 */
const buildGoogleMyMapsEmbedUrl = (url: URL): string =>
{
    if (!url.pathname.toLowerCase().startsWith("/maps/d/")) return "";
    const mid = `${url.searchParams.get("mid") ?? ""}`.trim();
    if (!mid) return "";

    const embedUrl = new URL("https://www.google.com/maps/d/embed");
    embedUrl.searchParams.set("mid", mid);
    const ll = `${url.searchParams.get("ll") ?? ""}`.trim();
    const z = `${url.searchParams.get("z") ?? ""}`.trim();
    if (ll) embedUrl.searchParams.set("ll", ll);
    if (z) embedUrl.searchParams.set("z", z);
    return embedUrl.toString();
};

/** 舊 maps.google.* /maps/ms 類型保留既有參數，只補 output=embed。 */
const buildLegacyGoogleMapsEmbedUrl = (url: URL): string =>
{
    const pathName = url.pathname.toLowerCase();
    if (!pathName.startsWith("/maps/ms")) return "";
    if (!url.searchParams.has("msid") && !url.searchParams.has("mid")) return "";

    const embedUrl = new URL(url.toString());
    embedUrl.protocol = "https:";
    embedUrl.searchParams.set("output", "embed");
    return embedUrl.toString();
};

/** 從一般 Maps URL 取得可建立 q=... embed 的目的地。 */
const resolveGoogleMapsQuery = (url: URL): string =>
{
    const directQuery = ["q", "query", "ll", "center"]
        .map(key => `${url.searchParams.get(key) ?? ""}`.trim())
        .find(Boolean);
    if (directQuery) return directQuery;

    const pathParts = url.pathname.split("/").map(part => part.trim()).filter(Boolean);
    const semanticIndex = pathParts.findIndex(part => part.toLowerCase() === "place" || part.toLowerCase() === "search");
    if (semanticIndex >= 0 && pathParts[semanticIndex + 1])
    {
        const decoded = decodeGoogleMapsPathValue(pathParts[semanticIndex + 1]);
        if (decoded) return decoded;
    }

    const coordinateMatch = url.pathname.match(/@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/);
    return coordinateMatch ? `${coordinateMatch[1]},${coordinateMatch[2]}` : "";
};

const decodeGoogleMapsPathValue = (value: string): string =>
{
    try
    {
        return decodeURIComponent(value.replace(/\+/g, " ")).trim();
    } catch
    {
        return value.replace(/\+/g, " ").trim();
    }
};
// #endregion
