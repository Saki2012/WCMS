namespace WCMS.Features.WEB.WebResource
{
    /// <summary>
    /// YouTube 連結解析工具
    /// 將各種 YouTube URL 正規化成 https://youtu.be/{videoId}
    /// </summary>
    public static class YouTubeUrlHelper
    {
        /// <summary>
        /// 嘗試將網址轉成短網址格式，如果不是 YouTube 或解析失敗就回傳 false。
        /// </summary>
        /// <param name="url">原始網址</param>
        /// <param name="normalizedUrl">成功時輸出 https://youtu.be/{id}</param>
        public static bool TryNormalizeToShortUrl(string? url, out string? normalizedUrl)
        {
            normalizedUrl = null;

            if (string.IsNullOrWhiteSpace(url))
            {
                return false;
            }

            var trimmed = url.Trim();

            // 先嘗試直接 Parse
            if (!Uri.TryCreate(trimmed, UriKind.Absolute, out var uri))
            {
                // 有些可能沒寫 http(s)，幫他補一個
                if (!Uri.TryCreate("https://" + trimmed, UriKind.Absolute, out uri))
                {
                    return false;
                }
            }

            var host = uri.Host.ToLowerInvariant();

            // 判斷是不是 YouTube 網域
            var isYouTube =
                host == "youtu.be" ||
                host == "youtube.com" ||
                host.EndsWith(".youtube.com", StringComparison.OrdinalIgnoreCase);

            if (!isYouTube)
            {
                return false;
            }

            var videoId = ExtractVideoId(uri);
            if (string.IsNullOrEmpty(videoId))
            {
                return false;
            }

            normalizedUrl = $"https://youtu.be/{videoId}";
            return true;
        }

        /// <summary>
        /// 方便用的版本：能轉就轉，轉不了就回原字串（避免中斷流程）。
        /// </summary>
        public static string NormalizeToShortUrlOrOriginal(string? url)
        {
            return TryNormalizeToShortUrl(url, out var normalized)
                ? normalized!
                : (url ?? string.Empty);
        }

        /// <summary>
        /// 真正負責從 Uri 抓出 videoId 的地方。
        /// </summary>
        private static string? ExtractVideoId(Uri uri)
        {
            var host = uri.Host.ToLowerInvariant();
            var path = uri.AbsolutePath.Trim('/'); // e.g. "watch", "embed/ID", "shorts/ID", "ID"

            // 1) youtu.be/VIDEOID
            if (host == "youtu.be")
            {
                var segments = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
                return segments.Length > 0 ? segments[0] : null;
            }

            var parts = path.Split('/', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0)
            {
                return null;
            }

            // 2) www.youtube.com/watch?v=VIDEOID
            if (parts[0].Equals("watch", StringComparison.OrdinalIgnoreCase))
            {
                var query = uri.Query; // 例如 "?v=QlPH0FnwFkI&si=xxxx"
                if (!string.IsNullOrEmpty(query))
                {
                    var queryString = query.TrimStart('?');
                    var pairs = queryString.Split('&', StringSplitOptions.RemoveEmptyEntries);

                    foreach (var pair in pairs)
                    {
                        var kv = pair.Split('=', 2);
                        if (kv.Length == 2 &&
                            kv[0].Equals("v", StringComparison.OrdinalIgnoreCase) &&
                            !string.IsNullOrWhiteSpace(kv[1]))
                        {
                            return Uri.UnescapeDataString(kv[1]);
                        }
                    }
                }
            }

            // 3) /embed/VIDEOID
            if (parts[0].Equals("embed", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                return parts[1];
            }

            // 4) /v/VIDEOID
            if (parts[0].Equals("v", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                return parts[1];
            }

            // 5) /shorts/VIDEOID
            if (parts[0].Equals("shorts", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                return parts[1];
            }

            // 6) /live/VIDEOID
            if (parts[0].Equals("live", StringComparison.OrdinalIgnoreCase) && parts.Length >= 2)
            {
                return parts[1];
            }

            return null;
        }
    }
}
