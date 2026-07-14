using HtmlAgilityPack;
using System.Globalization;
using System.Text.RegularExpressions;
using WCMS.Features._Resx;
using WCMS.SysCore.Auditing.ErrorHandling;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;

namespace WCMS.SysCore.Library;

public static class LibAAData
{
    #region Property
    /// <summary>
    /// HTML Fragment解析時使用的暫時根節點屬性
    /// </summary>
    private const string RootAttr = "data-aa-root";
    /// <summary>
    /// AA錯誤提示中節點片段的最大長度
    /// </summary>
    private const int MaxNodeSnippetLength = 300;
    /// <summary>
    /// 圖片alt允許的最大英文折算長度，75個中文約等於150個英文字元
    /// </summary>
    private const int MaxImageAltWeightedLength = 150;
    /// <summary>
    /// AA檢測碼
    /// </summary>
    private static class AACode
    {
        /// <summary>
        /// 圖片缺少alt屬性的AA檢測碼。
        /// 可自動修正情境：圖片位於已有可辨識名稱的連結內時，可補alt=""。
        /// 需人工處理情境：一般內容圖片缺alt、圖片src為空、alt與檔名相同。
        /// </summary>
        [LibDesc(DisplayName.AACheck_ImgAlt)]
        public const string ImgAlt = "HM1110100C";
        /// <summary>
        /// alt空白圖片不應保留title的AA檢測碼。
        /// 可自動修正情境：img alt=""且存在title時，直接移除title。
        /// 檢查訊息原則：AutoFormat後不提示，除非後續仍偵測到殘留問題。
        /// </summary>
        [LibDesc(DisplayName.AACheck_ImgEmptyAltTitle)]
        public const string ImgEmptyAltTitle = "HM1110106C";
        /// <summary>
        /// 連結缺少可辨識名稱的AA檢測碼。
        /// 可自動修正情境：純圖片連結可使用img alt/title搬到a title/aria-label。
        /// 需人工處理情境：a沒有文字、title、aria-label，且內層圖片也沒有有效alt/title。
        /// </summary>
        [LibDesc(DisplayName.AACheck_AnchorName)]
        public const string AnchorName = "HM1240401C";
        /// <summary>
        /// 連結與內層圖片替代文字重複或衝突的AA檢測碼。
        /// 可自動修正情境：a已有文字、title或aria-label時，內層img改為alt=""並移除title。
        /// 檢查訊息原則：AutoFormat後不提示，除非後續仍偵測到殘留問題。
        /// </summary>
        [LibDesc(DisplayName.AACheck_AnchorImgConflict)]
        public const string AnchorImgConflict = "HM1240400C";
        /// <summary>
        /// iframe缺少title屬性的AA檢測碼。
        /// 可自動修正情境：依iframe src補上預設title，例如SoundCloud、YouTube、Google地圖或嵌入內容。
        /// 檢查訊息原則：AutoFormat後不提示，除非後續決定未知來源iframe必須人工命名。
        /// </summary>
        [LibDesc(DisplayName.AACheck_IframeTitle)]
        public const string IframeTitle = "HM1410201C";
        /// <summary>
        /// CSS font-size使用px/pt固定單位的AA檢測碼。
        /// 可自動修正情境：inline style或style區塊中的font-size:px/pt轉為rem。
        /// 檢查訊息原則：AutoFormat後不提示，除非仍有無法轉換的px/pt font-size。
        /// </summary>
        [LibDesc(DisplayName.AACheck_FontSizePx)]
        public const string FontSizePx = "CS2140401C";
        /// <summary>
        /// 電子郵件連結缺少足夠脈絡title的AA檢測碼。
        /// 可自動修正情境：不自動修正，因後端無法穩定判斷職員姓名。
        /// 需人工處理情境：mailto連結沒有title、title只有email、title與連結文字相同，或title未包含電子郵件用途與信箱資訊。
        /// </summary>
        [LibDesc(DisplayName.AACheck_MailtoTitle)]
        public const string MailtoTitle = "HM1240404E";
    }
    /// <summary>
    /// 尋找CSS font-size使用px/pt固定單位的正規表示式
    /// </summary>
    private static readonly Regex FontSizeFixedUnitRegex = new(@"font-size\s*:\s*(?<value>\d+(?:\.\d+)?)(?<unit>px|pt)\b", RegexOptions.IgnoreCase | RegexOptions.Compiled);
    /// <summary>
    /// 將連續空白正規化為單一空白的正規表示式
    /// </summary>
    private static readonly Regex SpaceRegex = new(@"\s+", RegexOptions.Compiled);
    /// <summary>
    /// 過度籠統的圖片替代文字，不足以說明資訊型圖片內容
    /// </summary>
    private static readonly HashSet<string> GenericImageAltTexts = new(StringComparer.OrdinalIgnoreCase)
    {
        "圖片", "照片", "相片", "圖示", "示意圖", "插圖", "image", "photo", "picture", "pic", "banner"
    };
    #endregion

    #region Public
    /// <summary>
    /// 執行AA自動修正與檢測，主要給TinyMCE自定義內容使用
    /// </summary>
    public static bool CheckAAContent(string content, IErrorHelper Message, I18nCache i18n, out string result, string? contentTitle = null)
    {
        result = content ?? string.Empty;
        if (!SpecSettings.AACheck) return true;
        result = DoAutoFormatAAContent(result);
        return DoCheckAAContent(result, Message, i18n, contentTitle);
    }
    #endregion

    #region Internal
    /// <summary>
    /// 自動修正可安全處理的AA Content問題
    /// </summary>
    internal static string DoAutoFormatAAContent(string content)
    {
        var document = BuildHtmlDocument(content);
        FixFontSizeFixedUnitToRem(document);
        FixAnchorInvalidAltAttribute(document);
        FixNestedImageAltInAnchor(document);
        FixEmptyAltImageTitle(document);
        FixIframeTitleBySrc(document);
        return GetRootNode(document).InnerHtml;
    }
    /// <summary>
    /// 檢查HTML Content是否仍有無法自動修正的AA問題
    /// </summary>
    internal static bool DoCheckAAContent(string content, IErrorHelper Message, I18nCache i18n, string? contentTitle = null)
    {
        var document = BuildHtmlDocument(content);
        var isValid = true;
        isValid &= CheckImageAlt(document, Message, i18n, contentTitle);
        isValid &= CheckAnchorAccessibleName(document, Message, i18n);
        isValid &= CheckAnchorNestedImageConflict(document, Message, i18n);
        isValid &= CheckIframeTitle(document, Message, i18n);
        isValid &= CheckFontSizeUnit(document, Message, i18n);
        isValid &= CheckMailtoLinkTitle(document, Message, i18n);
        return isValid;
    }
    #endregion

    #region Private

    #region Check
    /// <summary>
    /// 檢查img是否仍有需要人工處理的alt問題
    /// </summary>
    private static bool CheckImageAlt(HtmlDocument document, IErrorHelper Message, I18nCache i18n, string? contentTitle = null)
    {
        var isValid = true;
        foreach (var img in GetNodes(GetRootNode(document), ".//img"))
        {
            var alt = GetAttr(img, "alt");
            if (!HasAttr(img, "alt")) { AddAAError(Message, i18n, AACode.ImgAlt, img); isValid = false; continue; }
            if (!HasImageSource(img)) { AddAAError(Message, i18n, AACode.ImgAlt, img); isValid = false; }
            if (string.IsNullOrWhiteSpace(alt) && !CanImageUseEmptyAlt(img)) { AddAAError(Message, i18n, AACode.ImgAlt, img, BuildEmptyImageAltReason()); isValid = false; }
            if (IsSameAsFileName(alt, GetAttr(img, "src"))) { AddAAError(Message, i18n, AACode.ImgAlt, img); isValid = false; }
            if (IsImageAltTooLong(alt)) { AddAAError(Message, i18n, AACode.ImgAlt, img, BuildImageAltTooLongReason(alt)); isValid = false; }
            if (IsWeakInformativeImageAlt(img, contentTitle)) { AddAAError(Message, i18n, AACode.ImgAlt, img, BuildWeakImageAltReason()); isValid = false; }
            if (string.IsNullOrWhiteSpace(alt) && HasAttrText(img, "title")) { AddAAError(Message, i18n, AACode.ImgEmptyAltTitle, img); isValid = false; }
        }
        return isValid;
    }
    /// <summary>
    /// 檢查a是否仍缺少可辨識的連結名稱
    /// </summary>
    private static bool CheckAnchorAccessibleName(HtmlDocument document, IErrorHelper Message, I18nCache i18n)
    {
        var isValid = true;
        foreach (var anchor in GetNodes(GetRootNode(document), ".//a[@href]"))
        {
            if (HasAnchorAccessibleName(anchor)) continue;
            AddAAError(Message, i18n, AACode.AnchorName, anchor);
            isValid = false;
        }
        return isValid;
    }
    /// <summary>
    /// 檢查AutoFormat後是否仍有a與內層圖片語意衝突
    /// </summary>
    private static bool CheckAnchorNestedImageConflict(HtmlDocument document, IErrorHelper Message, I18nCache i18n)
    {
        var isValid = true;
        foreach (var anchor in GetNodes(GetRootNode(document), ".//a[.//img]"))
        {
            if (string.IsNullOrWhiteSpace(GetAnchorOwnAccessibleName(anchor))) continue;

            foreach (var img in GetNodes(anchor, ".//img").Where(p => HasAttrText(p, "alt") || HasAttrText(p, "title")))
            {
                AddAAError(Message, i18n, AACode.AnchorImgConflict, img);
                isValid = false;
            }
        }
        return isValid;
    }
    /// <summary>
    /// 檢查iframe是否仍缺少title
    /// </summary>
    private static bool CheckIframeTitle(HtmlDocument document, IErrorHelper Message, I18nCache i18n)
    {
        var isValid = true;
        foreach (var iframe in GetNodes(GetRootNode(document), ".//iframe"))
        {
            if (HasAttrText(iframe, "title")) continue;
            AddAAError(Message, i18n, AACode.IframeTitle, iframe);
            isValid = false;
        }
        return isValid;
    }
    /// <summary>
    /// 檢查font-size是否仍使用px/pt固定單位
    /// </summary>
    private static bool CheckFontSizeUnit(HtmlDocument document, IErrorHelper Message, I18nCache i18n)
    {
        var isValid = true;
        foreach (var node in GetNodes(GetRootNode(document), ".//*[@style]").Where(p => HasFixedUnitFontSize(GetAttr(p, "style"))))
        {
            AddAAError(Message, i18n, AACode.FontSizePx, node);
            isValid = false;
        }
        foreach (var node in GetNodes(GetRootNode(document), ".//style").Where(p => HasFixedUnitFontSize(p.InnerHtml)))
        {
            AddAAError(Message, i18n, AACode.FontSizePx, node);
            isValid = false;
        }
        return isValid;
    }
    /// <summary>
    /// 檢查mailto連結是否提供足夠脈絡的title
    /// </summary>
    private static bool CheckMailtoLinkTitle(HtmlDocument document, IErrorHelper Message, I18nCache i18n)
    {
        var isValid = true;
        foreach (var anchor in GetNodes(GetRootNode(document), ".//a[@href]").Where(IsMailtoAnchor))
        {
            if (HasValidMailtoTitle(anchor)) continue;
            AddAAError(Message, i18n, AACode.MailtoTitle, anchor, BuildMailtoTitleReason(anchor));
            isValid = false;
        }
        return isValid;
    }

    /// <summary>
    /// 建立mailto連結title不足的錯誤原因
    /// </summary>
    private static string BuildMailtoTitleReason(HtmlNode anchor)
    {
        var mailAddress = GetMailtoAddress(anchor);
        var sample = string.IsNullOrWhiteSpace(mailAddress)
            ? "王小明電子郵件 example@example.com"
            : $"王小明電子郵件 {mailAddress}";
        return $"電子郵件連結title不足，請使用姓名加電子郵件作為title，例如：{sample}。";
    }

    /// <summary>
    /// 判斷連結是否為mailto連結
    /// </summary>
    private static bool IsMailtoAnchor(HtmlNode anchor)
    {
        var href = GetAttr(anchor, "href");
        return href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 判斷mailto連結title是否包含足夠脈絡
    /// </summary>
    private static bool HasValidMailtoTitle(HtmlNode anchor)
    {
        var title = NormalizeText(GetAttr(anchor, "title"));
        var mailAddress = GetMailtoAddress(anchor);
        var linkText = NormalizeText(GetTextWithoutMedia(anchor));
        if (string.IsNullOrWhiteSpace(title)) return false;
        if (IsSameText(title, mailAddress)) return false;
        if (IsSameText(title, linkText)) return false;
        if (!HasMailtoPurposeText(title)) return false;
        if (!ContainsText(title, mailAddress)) return false;
        return true;
    }
    /// <summary>
    /// 從mailto href取得電子郵件地址
    /// </summary>
    private static string GetMailtoAddress(HtmlNode anchor)
    {
        var href = GetAttr(anchor, "href");
        if (!href.StartsWith("mailto:", StringComparison.OrdinalIgnoreCase)) return string.Empty;
        var address = href["mailto:".Length..];
        var cutIndex = address.IndexOfAny(['?', '&', '#']);
        return NormalizeText(cutIndex >= 0 ? address[..cutIndex] : address);
    }
    /// <summary>
    /// 判斷mailto title是否包含電子郵件用途文字
    /// </summary>
    private static bool HasMailtoPurposeText(string title)
    {
        if (title.Contains("電子郵件")) return true;
        if (title.Contains("電子信箱")) return true;
        if (title.Contains("email", StringComparison.OrdinalIgnoreCase)) return true;
        if (title.Contains("e-mail", StringComparison.OrdinalIgnoreCase)) return true;
        return false;
    }
    /// <summary>
    /// 判斷兩段文字正規化後是否相同
    /// </summary>
    private static bool IsSameText(string source, string target)
    {
        var sourceText = NormalizeText(source);
        var targetText = NormalizeText(target);
        return !string.IsNullOrWhiteSpace(targetText) && string.Equals(sourceText, targetText, StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 判斷來源文字是否包含目標文字
    /// </summary>
    private static bool ContainsText(string source, string target)
    {
        if (string.IsNullOrWhiteSpace(source)) return false;
        if (string.IsNullOrWhiteSpace(target)) return false;
        return source.Contains(target, StringComparison.OrdinalIgnoreCase);
    }
    #endregion

    #region Format
    /// <summary>
    /// 將font-size:px/pt轉成rem
    /// </summary>
    private static void FixFontSizeFixedUnitToRem(HtmlDocument document)
    {
        foreach (var node in GetNodes(GetRootNode(document), ".//*[@style]"))
            node.SetAttributeValue("style", FixFontSizeText(GetAttr(node, "style")));
        foreach (var node in GetNodes(GetRootNode(document), ".//style"))
            node.InnerHtml = FixFontSizeText(node.InnerHtml);
    }
    /// <summary>
    /// 將a上錯誤使用的alt搬到title/aria-label
    /// </summary>
    private static void FixAnchorInvalidAltAttribute(HtmlDocument document)
    {
        foreach (var anchor in GetNodes(GetRootNode(document), ".//a[@alt]"))
        {
            EnsureAnchorName(anchor, GetAttr(anchor, "alt"));
            RemoveAttr(anchor, "alt");
        }
    }
    /// <summary>
    /// 修正a包img時的alt/title衝突，避免圖片成為重複語意
    /// </summary>
    private static void FixNestedImageAltInAnchor(HtmlDocument document)
    {
        foreach (var anchor in GetNodes(GetRootNode(document), ".//a[.//img]"))
        {
            var images = GetNodes(anchor, ".//img");
            var ownName = GetAnchorOwnAccessibleName(anchor);
            if (!string.IsNullOrWhiteSpace(ownName)) { ClearImageNames(images); continue; }
            var imageName = BuildImageName(images);
            if (string.IsNullOrWhiteSpace(imageName)) continue;
            EnsureAnchorName(anchor, imageName);
            ClearImageNames(images);
        }
    }
    /// <summary>
    /// 移除alt空白圖片上的title
    /// </summary>
    private static void FixEmptyAltImageTitle(HtmlDocument document)
    {
        foreach (var img in GetNodes(GetRootNode(document), ".//img").Where(p => HasAttr(p, "alt") && string.IsNullOrWhiteSpace(GetAttr(p, "alt"))))
            RemoveAttr(img, "title");
    }
    /// <summary>
    /// iframe缺title時依來源補預設標題
    /// </summary>
    private static void FixIframeTitleBySrc(HtmlDocument document)
    {
        foreach (var iframe in GetNodes(GetRootNode(document), ".//iframe").Where(p => !HasAttrText(p, "title")))
            iframe.SetAttributeValue("title", GetIframeDefaultTitle(iframe));
    }
    #endregion

    #region Common
    /// <summary>
    /// 建立HTML Fragment文件，避免多個平行節點不好處理
    /// </summary>
    private static HtmlDocument BuildHtmlDocument(string content)
    {
        var document = new HtmlDocument() { OptionFixNestedTags = true, OptionAutoCloseOnEnd = true };
        document.LoadHtml($@"<div {RootAttr}=""true"">{content ?? string.Empty}</div>");
        return document;
    }
    /// <summary>
    /// 取得包住Content的根節點
    /// </summary>
    private static HtmlNode GetRootNode(HtmlDocument document)
    {
        return document.DocumentNode.SelectSingleNode($".//*[@{RootAttr}='true']") ?? document.DocumentNode;
    }
    /// <summary>
    /// 取得節點清單，避免SelectNodes回傳null
    /// </summary>
    private static List<HtmlNode> GetNodes(HtmlNode node, string xpath)
    {
        return node.SelectNodes(xpath)?.ToList() ?? [];
    }
    /// <summary>
    /// 判斷節點是否有指定屬性
    /// </summary>
    private static bool HasAttr(HtmlNode node, string name)
    {
        return node.Attributes[name] != null;
    }
    /// <summary>
    /// 取得屬性文字
    /// </summary>
    private static string GetAttr(HtmlNode node, string name)
    {
        return HtmlEntity.DeEntitize(node.GetAttributeValue(name, string.Empty)).Trim();
    }
    /// <summary>
    /// 判斷屬性是否有有效文字
    /// </summary>
    private static bool HasAttrText(HtmlNode node, string name)
    {
        return !string.IsNullOrWhiteSpace(GetAttr(node, name));
    }
    /// <summary>
    /// 移除指定屬性
    /// </summary>
    private static void RemoveAttr(HtmlNode node, string name)
    {
        var attr = node.Attributes[name];
        if (attr != null) node.Attributes.Remove(attr);
    }
    /// <summary>
    /// 新增AA錯誤訊息，僅用於AutoFormat後仍需人工處理的問題
    /// </summary>
    private static void AddAAError(IErrorHelper Message, I18nCache i18n, string aaCode, HtmlNode? node = null, string? customReason = null)
    {
        var reason = string.IsNullOrWhiteSpace(customReason) ? i18n.GetConstLabel(typeof(AACode), aaCode) : customReason;
        var nodeHint = BuildNodeHint(node);
        Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00000, aaCode, reason, nodeHint);
    }
    /// <summary>
    /// 建立AA錯誤節點提示
    /// </summary>
    private static string BuildNodeHint(HtmlNode? node)
    {
        if (node == null) return string.Empty;
        return BuildNodeStartTag(node);
    }
    /// <summary>
    /// 建立節點起始標籤，供使用者複製搜尋
    /// </summary>
    private static string BuildNodeStartTag(HtmlNode node)
    {
        if (node.NodeType != HtmlNodeType.Element) return TrimNodeSnippet(node.OuterHtml);
        var attrs = node.Attributes.Where(p => !string.Equals(p.Name, RootAttr, StringComparison.OrdinalIgnoreCase)).Select(BuildAttributeText).Where(p => !string.IsNullOrWhiteSpace(p)).ToList();
        var attrText = attrs.Count == 0 ? string.Empty : $" {string.Join(" ", attrs)}";
        return TrimNodeSnippet($"<{node.Name}{attrText}>");
    }
    /// <summary>
    /// 建立HTML屬性文字
    /// </summary>
    private static string BuildAttributeText(HtmlAttribute attr)
    {
        var name = attr.Name ?? string.Empty;
        var value = HtmlEntity.Entitize(attr.Value ?? string.Empty).Replace("\"", "&quot;");
        return string.IsNullOrWhiteSpace(value) ? name : $"{name}=\"{value}\"";
    }
    /// <summary>
    /// 限制節點提示長度，避免錯誤訊息過長
    /// </summary>
    private static string TrimNodeSnippet(string text)
    {
        var value = NormalizeText(text);
        return value.Length <= MaxNodeSnippetLength ? value : $"{value[..MaxNodeSnippetLength]}...";
    }
    #endregion

    #region Anchor / Image
    /// <summary>
    /// 判斷a是否有可辨識名稱
    /// </summary>
    private static bool HasAnchorAccessibleName(HtmlNode anchor)
    {
        if (!string.IsNullOrWhiteSpace(GetAnchorOwnAccessibleName(anchor))) return true;
        return GetNodes(anchor, ".//img").Any(p => HasAttrText(p, "alt") || HasAttrText(p, "title"));
    }
    /// <summary>
    /// 取得a自己的名稱，不把img alt算進去
    /// </summary>
    private static string GetAnchorOwnAccessibleName(HtmlNode anchor)
    {
        if (HasAttrText(anchor, "aria-label")) return GetAttr(anchor, "aria-label");
        if (HasAttrText(anchor, "title")) return GetAttr(anchor, "title");
        return GetTextWithoutMedia(anchor);
    }
    /// <summary>
    /// 確保a有title與aria-label
    /// </summary>
    private static void EnsureAnchorName(HtmlNode anchor, string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return;
        if (!HasAttrText(anchor, "title")) anchor.SetAttributeValue("title", name);
        if (!HasAttrText(anchor, "aria-label")) anchor.SetAttributeValue("aria-label", name);
    }
    /// <summary>
    /// 清除a內圖片名稱，避免與a名稱重複
    /// </summary>
    private static void ClearImageNames(List<HtmlNode> images)
    {
        foreach (var img in images)
        {
            img.SetAttributeValue("alt", string.Empty);
            RemoveAttr(img, "title");
        }
    }
    /// <summary>
    /// 由圖片alt/title組出連結名稱
    /// </summary>
    private static string BuildImageName(List<HtmlNode> images)
    {
        var names = images.Select(GetImageName).Where(p => !string.IsNullOrWhiteSpace(p)).Distinct(StringComparer.OrdinalIgnoreCase).ToList();
        return string.Join("、", names);
    }
    /// <summary>
    /// 取得圖片可使用的名稱
    /// </summary>
    private static string GetImageName(HtmlNode img)
    {
        var alt = GetAttr(img, "alt");
        var title = GetAttr(img, "title");
        if (!string.IsNullOrWhiteSpace(alt) && !IsSameAsFileName(alt, GetAttr(img, "src"))) return alt;
        if (!string.IsNullOrWhiteSpace(title)) return title;
        return string.Empty;
    }
    /// <summary>
    /// 判斷圖片是否有來源
    /// </summary>
    private static bool HasImageSource(HtmlNode img)
    {
        return HasAttrText(img, "src") || HasAttrText(img, "data-src") || HasAttrText(img, "data-original") || HasAttrText(img, "data-internalid");
    }
    /// <summary>
    /// 判斷文字是否與圖片檔名相同
    /// </summary>
    private static bool IsSameAsFileName(string text, string src)
    {
        if (string.IsNullOrWhiteSpace(text) || string.IsNullOrWhiteSpace(src)) return false;
        var fileName = Path.GetFileNameWithoutExtension(src.Split('?')[0]);
        return string.Equals(text.Trim(), fileName?.Trim(), StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 取得排除圖片與腳本後的文字
    /// </summary>
    private static string GetTextWithoutMedia(HtmlNode node)
    {
        var clone = node.CloneNode(true);
        foreach (var item in GetNodes(clone, ".//img|.//svg|.//script|.//style"))
        {
            item.Remove();
        }
        return NormalizeText(HtmlEntity.DeEntitize(clone.InnerText));
    }
    /// <summary>
    /// 判斷圖片alt是否超過AA建議長度
    /// </summary>
    private static bool IsImageAltTooLong(string alt)
    {
        return GetImageAltLengthInfo(alt).WeightedLength > MaxImageAltWeightedLength;
    }
    /// <summary>
    /// 判斷資訊型圖片是否只使用籠統或標題式alt
    /// </summary>
    private static bool IsWeakInformativeImageAlt(HtmlNode img, string? contentTitle)
    {
        var alt = NormalizeText(GetAttr(img, "alt"));
        if (string.IsNullOrWhiteSpace(alt)) return false;
        if (GenericImageAltTexts.Contains(alt)) return true;
        if (IsSameAsContentTitle(alt, contentTitle) && !HasImageDetailSupport(img)) return true;
        return false;
    }
    /// <summary>
    /// 判斷alt是否與頁面或資料標題相同
    /// </summary>
    private static bool IsSameAsContentTitle(string alt, string? contentTitle)
    {
        var title = NormalizeText(contentTitle ?? string.Empty);
        return !string.IsNullOrWhiteSpace(title) && string.Equals(alt, title, StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 判斷圖片是否有完整說明支援機制
    /// </summary>
    private static bool HasImageDetailSupport(HtmlNode img)
    {
        var hasCaption = HasNearbyImageCaption(img);
        var hasDescribedBy = HasAriaDescribedByDetail(img);
        var hasDetailLink = HasLongDescriptionLink(img);
        return hasCaption || hasDescribedBy || hasDetailLink;
    }
    /// <summary>
    /// 判斷圖片是否允許使用空alt
    /// </summary>
    private static bool CanImageUseEmptyAlt(HtmlNode img)
    {
        var isPresentation = IsPresentationImage(img);
        var isHidden = IsHiddenFromAssistiveTech(img);
        var hasAnchorName = HasParentAnchorOwnAccessibleName(img);
        var hasDetailSupport = HasImageDetailSupport(img);
        return isPresentation || isHidden || hasAnchorName || hasDetailSupport;
    }
    /// <summary>
    /// 判斷圖片是否標示為裝飾性圖片
    /// </summary>
    private static bool IsPresentationImage(HtmlNode img)
    {
        var role = GetAttr(img, "role");
        return string.Equals(role, "presentation", StringComparison.OrdinalIgnoreCase) || string.Equals(role, "none", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 判斷圖片是否已對輔助科技隱藏
    /// </summary>
    private static bool IsHiddenFromAssistiveTech(HtmlNode img)
    {
        var ariaHidden = GetAttr(img, "aria-hidden");
        return string.Equals(ariaHidden, "true", StringComparison.OrdinalIgnoreCase) || HasAttr(img, "hidden");
    }
    /// <summary>
    /// 判斷父層連結本身是否已有可辨識名稱
    /// </summary>
    private static bool HasParentAnchorOwnAccessibleName(HtmlNode img)
    {
        var anchor = img.SelectSingleNode("ancestor::a[@href][1]");
        if (anchor == null) return false;
        return !string.IsNullOrWhiteSpace(GetAnchorOwnAccessibleName(anchor));
    }
    /// <summary>
    /// 判斷圖片附近是否有語意化圖說
    /// </summary>
    private static bool HasNearbyImageCaption(HtmlNode img)
    {
        var parent = img.ParentNode ?? img;
        return GetNodes(parent, ".//figcaption|.//caption").Any(p => !string.IsNullOrWhiteSpace(GetTextWithoutMedia(p)));
    }
    /// <summary>
    /// 判斷圖片是否透過aria-describedby連到完整說明
    /// </summary>
    private static bool HasAriaDescribedByDetail(HtmlNode img)
    {
        var ids = GetAttr(img, "aria-describedby").Split(' ', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);
        var root = img.OwnerDocument?.DocumentNode;
        if (ids.Length == 0 || root == null) return false;
        return ids.Any(p => HasReferencedDescription(root, p));
    }
    /// <summary>
    /// 判斷指定id是否對應到有效說明節點
    /// </summary>
    private static bool HasReferencedDescription(HtmlNode root, string id)
    {
        var node = root.SelectSingleNode($".//*[@id={BuildXPathLiteral(id)}]");
        if (node == null) return false;
        if (!string.IsNullOrWhiteSpace(GetTextWithoutMedia(node))) return true;
        return HasAttrText(node, "aria-label") || HasAttrText(node, "title");
    }
    /// <summary>
    /// 判斷圖片附近是否有完整說明頁連結
    /// </summary>
    private static bool HasLongDescriptionLink(HtmlNode img)
    {
        var parent = img.ParentNode ?? img;
        return GetNodes(parent, ".//a[@href]").Any(IsImageDetailLink);
    }
    /// <summary>
    /// 判斷連結文字是否指向圖片完整說明
    /// </summary>
    private static bool IsImageDetailLink(HtmlNode anchor)
    {
        var linkText = NormalizeText($"{GetTextWithoutMedia(anchor)} {GetAttr(anchor, "title")} {GetAttr(anchor, "aria-label")}");
        if (string.IsNullOrWhiteSpace(linkText)) return false;
        return linkText.Contains("完整說明") || linkText.Contains("詳細說明") || linkText.Contains("full description", StringComparison.OrdinalIgnoreCase);
    }
    /// <summary>
    /// 建立XPath文字常值，避免id內含引號時XPath失效
    /// </summary>
    private static string BuildXPathLiteral(string value)
    {
        if (!value.Contains('\'')) return $"'{value}'";
        if (!value.Contains('"')) return $"\"{value}\"";

        var parts = value.Split('\'').Select(p => $"'{p}'");
        return $"concat({string.Join(", \"'\", ", parts)})";
    }
    /// <summary>
    /// 建立圖片alt過長的錯誤原因
    /// </summary>
    private static string BuildImageAltTooLongReason(string alt)
    {
        var info = GetImageAltLengthInfo(alt);
        return $"圖片alt文字過長，目前中文/全形約{info.CjkLength}字、英數半形約{info.OtherLength}字，折算{info.WeightedLength}/{MaxImageAltWeightedLength}。請將alt控制在75個中文字或150個英文字元內，完整說明請放在圖片下方或完整說明頁。";
    }
    /// <summary>
    /// 建立資訊型圖片alt不足的錯誤原因
    /// </summary>
    private static string BuildWeakImageAltReason()
    {
        return "資訊型圖片不可只用圖片標題、圖片、照片等籠統文字作為alt。請以短句描述圖片重點，若內容較多，請在圖片下方補完整說明或提供完整說明頁連結。";
    }
    /// <summary>
    /// 建立空alt未提供替代說明的錯誤原因
    /// </summary>
    private static string BuildEmptyImageAltReason()
    {
        return """資訊型圖片不可使用空alt。若圖片只是裝飾，請加上role="presentation"、role="none"或aria-hidden="true"；若圖片在連結內，請確認連結本身已有文字、title或aria-label；若圖片含重要資訊，請提供短alt並於圖片下方補完整說明。""";
    }
    /// <summary>
    /// 取得圖片alt長度資訊，中文與全形字折算2，其他字元折算1
    /// </summary>
    private static (int CjkLength, int OtherLength, int WeightedLength) GetImageAltLengthInfo(string alt)
    {
        var cjkLength = 0;
        var otherLength = 0;
        foreach (var item in NormalizeText(alt))
        {
            if (IsCjkOrFullWidthChar(item)) cjkLength++;
            else otherLength++;
        }
        return (cjkLength, otherLength, cjkLength * 2 + otherLength);
    }
    /// <summary>
    /// 判斷字元是否屬於中文、日韓文字或全形符號
    /// </summary>
    private static bool IsCjkOrFullWidthChar(char value)
    {
        if (value >= '\u3400' && value <= '\u4DBF') return true;
        if (value >= '\u4E00' && value <= '\u9FFF') return true;
        if (value >= '\uF900' && value <= '\uFAFF') return true;
        if (value >= '\u3000' && value <= '\u303F') return true;
        if (value >= '\u3040' && value <= '\u30FF') return true;
        if (value >= '\uAC00' && value <= '\uD7AF') return true;
        if (value >= '\uFF00' && value <= '\uFFEF') return true;
        return false;
    }
    #endregion

    #region Css / Iframe
    /// <summary>
    /// 判斷是否有font-size:px/pt固定單位
    /// </summary>
    private static bool HasFixedUnitFontSize(string cssText)
    {
        return !string.IsNullOrWhiteSpace(cssText) && FontSizeFixedUnitRegex.IsMatch(cssText);
    }
    /// <summary>
    /// 將CSS文字中的font-size:px/pt轉為rem
    /// </summary>
    private static string FixFontSizeText(string cssText)
    {
        return string.IsNullOrWhiteSpace(cssText) ? cssText : FontSizeFixedUnitRegex.Replace(cssText, ConvertFontSizeMatchToRem);
    }
    /// <summary>
    /// 將font-size的px/pt數值換算成rem
    /// </summary>
    private static string ConvertFontSizeMatchToRem(Match match)
    {
        var value = decimal.Parse(match.Groups["value"].Value, CultureInfo.InvariantCulture);
        var unit = match.Groups["unit"].Value.ToLowerInvariant();
        var rem = unit == "pt" ? value / 12m : value / 16m;
        return $"font-size:{FormatRemValue(rem)}rem";
    }
    /// <summary>
    /// 格式化rem數值，避免輸出多餘小數
    /// </summary>
    private static string FormatRemValue(decimal rem)
    {
        var value = Math.Round(rem, 4);
        return value.ToString("0.####", CultureInfo.InvariantCulture);
    }
    /// <summary>
    /// 依iframe src給預設title
    /// </summary>
    private static string GetIframeDefaultTitle(HtmlNode iframe)
    {
        var src = GetAttr(iframe, "src").ToLowerInvariant();
        if (src.Contains("soundcloud.com")) return "SoundCloud 音訊播放器";
        if (src.Contains("youtube.com") || src.Contains("youtu.be")) return "YouTube 影片播放器";
        if (src.Contains("calendar.google.com")) return "Google 行事曆";
        if (src.Contains("google.com/maps")) return "Google 地圖";
        return "嵌入內容";
    }
    /// <summary>
    /// 正規化文字空白
    /// </summary>
    private static string NormalizeText(string text)
    {
        return SpaceRegex.Replace(text ?? string.Empty, " ").Trim();
    }
    #endregion

    #endregion
}