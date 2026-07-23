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
// #endregion
