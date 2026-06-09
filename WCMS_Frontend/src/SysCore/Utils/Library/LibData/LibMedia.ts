// #region Property
const YT_SHORT_REGEX = /^https?:\/\/(?:www\.)?youtu\.be\/([^?&#/]+)/i;
// #endregion
/** 解析YT網址 */
// TODO:應該放到Library?
export const resolveYoutubeEmbedUrl = (rawUrl?: string | null) =>
{
    if (!rawUrl) return { isYoutube: false, url: rawUrl ?? "" };
    const match = rawUrl.match(YT_SHORT_REGEX);
    if (!match) return { isYoutube: false, url: rawUrl };
    const videoId = match[1];
    const embedUrl = `https://www.youtube.com/embed/${videoId}`;
    return { isYoutube: true, url: embedUrl };
};
