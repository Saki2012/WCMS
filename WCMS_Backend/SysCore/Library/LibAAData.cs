using HtmlAgilityPack;

namespace WCMS.SysCore.Library
{
    public static class LibAAData
    {
        /// <summary>
        /// 修正 HTML 中包在 <a alt="xxx"> 裡面的內部 alt 值（如 img、span...）需清空
        /// </summary>
        /// <param name="html">原始 HTML</param>
        /// <returns>修正後 HTML</returns>
        public static string FixNestedAltInAnchor(this string html)
        {
            var doc = new HtmlDocument();
            doc.LoadHtml(html);

            // 選出所有有 alt 屬性的 <a> 標籤
            var anchorNodes = doc.DocumentNode.SelectNodes("//a[@alt]");
            if (anchorNodes == null) return html;
            foreach (var anchor in anchorNodes)
            {
                // 取得該 <a> 節點下的所有有 alt 的子節點（不含自身）
                var nestedAltNodes = anchor.SelectNodes(".//*[@alt]");
                if (nestedAltNodes == null) continue;
                foreach (var node in nestedAltNodes)
                {
                    // 清空 alt 值
                    node.SetAttributeValue("alt", "");
                }
            }
            return doc.DocumentNode.OuterHtml;
        }
    }
}
