using HtmlAgilityPack;
using System.Text;
using System.Text.RegularExpressions;

namespace WCMS.SysCore.Library;

/// <summary>
/// 提供 HTML Content、檔案參照與 URL 資料處理方法。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 壓縮 HTML／XML 中的換行、Tab 與多餘空白。
    /// </summary>
    public static string MinifyXml(string htmlOrXml)
    {
        try
        {
            var doc = new HtmlDocument { OptionWriteEmptyNodes = true, OptionAutoCloseOnEnd = true, OptionFixNestedTags = true };
            doc.LoadHtml(htmlOrXml);
            using var ms = new MemoryStream();
            using var writer = new StreamWriter(ms, new UTF8Encoding(encoderShouldEmitUTF8Identifier: false));
            doc.Save(writer);
            writer.Flush();
            ms.Position = 0;
            using var reader = new StreamReader(ms, Encoding.UTF8);
            string result = reader.ReadToEnd().Replace("\r", "").Replace("\n", "").Replace("\t", "").Trim();
            result = Regex.Replace(result, @"<br\s*>", "<br />", RegexOptions.IgnoreCase);
            return result;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"HTML/XML 處理錯誤: {ex.Message}");
            return htmlOrXml;
        }
    }
    /// <summary>
    /// 將舊站 HTML 本機檔案路徑轉換為 WCMS InternalId。
    /// </summary>
    public static class HtmlInternalIdByFullPath
    {
        #region Property
        /// <summary>
        /// 可轉換檔案參照的 HTML 標籤名稱。
        /// </summary>
        private static readonly string[] Tags = { "img", "a", "video", "audio", "source", "embed", "iframe" };
        /// <summary>
        /// 可轉換檔案參照的 HTML 屬性名稱。
        /// </summary>
        private static readonly string[] Attrs = { "src", "href" };
        #endregion

        #region Public
        /// <summary>
        /// 將 HTML 中可對應的本機 src／href 改為 data-internalId。
        /// </summary>
        public static string TransformHtml_ReplaceSrcWithDataInternalId(string html, Dictionary<string, string> fullPathToInternalId, out List<string> usedInternalIds)
        {
            var normalizedDict = fullPathToInternalId.ToDictionary(pair => NormalizePath(pair.Key), pair => pair.Value);
            var doc = new HtmlDocument { OptionFixNestedTags = true, OptionAutoCloseOnEnd = true };
            doc.LoadHtml(html);
            usedInternalIds = [];
            foreach (var tag in Tags)
            {
                var nodes = doc.DocumentNode.SelectNodes($"//{tag}");
                if (nodes == null) continue;
                foreach (var node in nodes)
                {
                    foreach (var attr in Attrs)
                    {
                        if (!node.Attributes.Contains(attr)) continue;
                        string rawPath = node.GetAttributeValue(attr, "").Trim();
                        if (!IsLocalFile(rawPath)) continue;
                        string decoded = Uri.UnescapeDataString(rawPath);
                        string normalized = NormalizePath(decoded);
                        if (normalizedDict.TryGetValue(normalized, out var internalId))
                        {
                            usedInternalIds.Add(internalId);
                            node.SetAttributeValue("data-internalId", internalId);
                            node.Attributes.Remove(attr);
                        }
                    }
                }
            }
            using var sw = new StringWriter();
            doc.Save(sw);
            return MinifyXml(sw.ToString());
        }
        #endregion

        #region Private
        /// <summary>
        /// 判斷路徑是否為可轉換的本機檔案參照。
        /// </summary>
        private static bool IsLocalFile(string path)
        {
            if (string.IsNullOrWhiteSpace(path)) return false;
            path = path.ToLowerInvariant();
            return !(path.StartsWith("http://") || path.StartsWith("https://") ||
                     path.StartsWith("mailto:") || path.StartsWith("tel:") ||
                     path.StartsWith("javascript:"));
        }
        /// <summary>
        /// 將檔案路徑標準化為小寫正斜線格式。
        /// </summary>
        private static string NormalizePath(string path)
        {
            return path.TrimStart('/').Replace("\\", "/").ToLowerInvariant();
        }
        #endregion
    }
    /// <summary>
    /// 提供絕對 HTTP URL 與安全相對路徑檢查。
    /// </summary>
    public static class UrlChecks
    {
        #region Public
        /// <summary>
        /// 判斷內容是否為 http 或 https 絕對 URL。
        /// </summary>
        public static bool IsAbsoluteHttpUrl(string? input)
        {
            return Uri.TryCreate(input, UriKind.Absolute, out var uri)
                && (uri.Scheme == Uri.UriSchemeHttp || uri.Scheme == Uri.UriSchemeHttps);
        }
        /// <summary>
        /// 判斷內容是否為不含危險 Scheme 的相對路徑。
        /// </summary>
        public static bool IsSafeRelativeUrl(string? input)
        {
            if (string.IsNullOrWhiteSpace(input)) return false;
            var s = input.Trim();
            if (s.StartsWith("//")) return false;
            if (s.StartsWith("javascript:", StringComparison.OrdinalIgnoreCase)) return false;
            if (s.StartsWith("data:", StringComparison.OrdinalIgnoreCase)) return false;
            return Uri.TryCreate(s, UriKind.Relative, out _);
        }
        /// <summary>
        /// 判斷內容是否為 HTTP 絕對 URL 或安全相對路徑。
        /// </summary>
        public static bool IsHttpOrRelativeUrl(string? input)
        {
            return IsAbsoluteHttpUrl(input) || IsSafeRelativeUrl(input);
        }
        #endregion
    }
    #endregion
}
