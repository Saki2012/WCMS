using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Playwright;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Text.RegularExpressions;
using WCMS.Features.BizResx;
using WCMS.Features.SiteEdit.Tag;
using WCMS.SpecFeatures.Spec1819.Resx;
using WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournal;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SpecFeatures.Spec1819.SiteEdit.SpecJournalIndex
{
    [LibApiController(ModuleCode.WebManagement, PGID.SpecJournalIndex, SysEnum.FuncAction.MasterData)]
    public class SpecJournalIndexController : ApiDataController<SpecJournalIndexSet, SpecJournalIndexSet_DTO>
    {

#if DEBUG
        protected TagBiz TagService => HttpContext.RequestServices.GetRequiredService<IBizService<TagSet>>() as TagBiz;
        protected SpecJournalIndex_Biz IndexService => HttpContext.RequestServices.GetRequiredService<IBizService<SpecJournalIndexSet>>() as SpecJournalIndex_Biz;
        protected SpecJournal_Biz JournalService => HttpContext.RequestServices.GetRequiredService<IBizService<SpecJournalSet>>() as SpecJournal_Biz;


        #region Public
        // ✅ 純爬蟲 rawData 版本（移除 ArticleEntry / ArticleDetail / TagRaw）
        // - 清單只回傳 rawJson + pageIds
        // - 內頁只回傳 rawJson
        // - pageId 這裡用「detailUrl」當 id（最直覺）
        [HttpPost("crawer")]
        public async Task<IActionResult> crawer([FromQuery] int maxIssues = 0, [FromQuery] int maxArticlesPerIssue = 0, CancellationToken ct = default)
        {

            var tagSets = new List<TagSet>();
            var journalIndexSets = new List<SpecJournalIndexSet>();
            var journalSets = new List<SpecJournalSet>();

            await GetJoemls(tagSets, journalIndexSets, journalSets, maxIssues, maxArticlesPerIssue, ct);
            await GetToaj(tagSets, journalIndexSets, journalSets, maxIssues, maxArticlesPerIssue, ct);
            bool ownsTx = false;
            try
            {
                ownsTx = await Service.TryBeginTransactionAsync();
                await TagService.BizInitCreateSetsAsync(tagSets.ToArray());
                await IndexService.BizInitCreateSetsAsync(journalIndexSets.ToArray());
                await JournalService.BizInitCreateSetsAsync(journalSets.ToArray());
                await Service.TryCommitAsync(ownsTx);
            }
            catch
            {
                await Service.TryRollbackAsync(ownsTx);
            }
            // 3) return
            return Ok();
        }
        #endregion

        #region Private

        #region Toaj
        /// <summary>
        /// https://toaj.stpi.niar.org.tw/index/journal/4b1141f97ce46933017ce469b6330053
        /// </summary>
        /// <returns></returns>
        private static async Task GetToaj(List<TagSet> tagSets, List<SpecJournalIndexSet> journalIndexSets, List<SpecJournalSet> journalSets,
            int maxIssues = 0, [FromQuery] int maxArticlesPerIssue = 0, CancellationToken ct = default)
        {
            // 1) 宣告變數
            const string journalUrl = "https://toaj.stpi.niar.org.tw/index/journal/4b1141f97ce46933017ce469b6330053";

            using var playwright = await Playwright.CreateAsync();
            await using var browser = await CreateBrowserAsync(playwright);

            var volumeUrls = new List<string>();
            var journalRaw = "";
            var volumeRawList = new List<string>();
            var articleListRawList = new List<string>();
            var articleDetailRawList = new List<string>();

            // 2) 執行 function
            var (volUrlsAll, journalRawJson) = await GetToajVolumeUrlsRawAsync(journalUrl, browser, ct);
            journalRaw = journalRawJson;
            volumeUrls = ApplyLimit(volUrlsAll, maxIssues);

            foreach (var volUrl in volumeUrls)
            {
                ct.ThrowIfCancellationRequested();

                var (articleUrls, articleListRaw) = await GetToajArticleUrlsFromVolumeAsync(volUrl, browser, maxArticlesPerIssue, ct);
                volumeRawList.Add(articleListRaw);
                var metaDict = BuildToajVolumeMetaDict(articleListRaw);

                foreach (var aUrl in articleUrls)
                {
                    ct.ThrowIfCancellationRequested();

                    var detailRaw = await GetToajArticleDetailRawAsync(aUrl, browser, ct);
                    if (string.IsNullOrWhiteSpace(detailRaw)) continue;

                    var parsed = ToajArticleParser.ParseFromRawJson(detailRaw);

                    // ✅ 把卷期清單的 lang/type 補回 parsed
                    var articleId = GetToajArticleIdFromUrl(aUrl);
                    if (!string.IsNullOrWhiteSpace(articleId) && metaDict.TryGetValue(articleId, out var meta))
                    {
                        parsed.ArticleLangFromList = ParseToajLangText(meta.LangText);
                        parsed.TypesFromList = meta.TypeTexts ?? [];
                    }

                    // 你現在已能 debug 看到 parsed，這裡補完就會一起看到

                    FormatToaj(parsed, tagSets, journalIndexSets, journalSets);

                }
            }

            // 3) return
            // 目前你的 crawer() return Ok() 沒帶資料，這裡先不動原流程
            // 之後你要回傳 rawData 時，我們再把 journalRaw/volumeRawList/articleDetailRawList 組到 response DTO
        }
        /// <summary>
        /// ✅ TOAJ 期刊頁 raw：抓卷期連結（/index/journal/volume/）
        /// 回傳 volumeUrls + rawJson
        /// </summary>
        private static async Task<(List<string> VolumeUrls, string JournalRawJson)> GetToajVolumeUrlsRawAsync(string journalUrl, IBrowser browser, CancellationToken ct)
        {
            // 1) 宣告變數
            var page = await browser.NewPageAsync();
            var urls = new List<string>();
            var raw = "";

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(journalUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                // 期刊頁可能需要等一下 JS render
                await page.WaitForTimeoutAsync(600);

                raw = await ExtractToajJournalRawJsonAsync(page.MainFrame, ct);
                urls = ExtractUrlsFromRawJson(raw); // 直接沿用你既有的 ExtractUrlsFromRawJson（抓 url 欄位）
            }
            catch
            {
                return (new List<string>(), "");
            }
            finally
            {
                await page.CloseAsync();
            }

            // 3) return
            return (urls, raw);
        }
        /// <summary>
        /// ✅ TOAJ 卷期頁 raw：抽文章連結（/index/journal/volume/article/）
        /// </summary>
        private static async Task<(List<string> ArticleUrls, string VolumeRawJson)> GetToajArticleUrlsFromVolumeAsync(string volumeUrl, IBrowser browser, int maxArticles, CancellationToken ct)
        {
            // 1) 宣告變數
            var page = await browser.NewPageAsync();
            var urls = new List<string>();
            var raw = "";

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(volumeUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                // ✅ 等資料灌入（lstVIT 或至少文章連結出現）
                await page.WaitForFunctionAsync(
                    @"() => (Array.isArray(window.lstVIT) && window.lstVIT.length > 0)
               || document.querySelectorAll('a[href*=""/index/journal/volume/article/""]').length > 0",
                    new PageWaitForFunctionOptions { Timeout = 15000 });

                raw = await ExtractToajVolumeRawJsonAsync(page.MainFrame, ct);

                urls = ExtractDetailUrlsFromIssueListRawJson(raw);
                urls = ApplyLimit(urls, maxArticles);
            }
            catch
            {
                return (new List<string>(), "");
            }
            finally
            {
                await page.CloseAsync();
            }

            // 3) return
            return (urls, raw);
        }
        /// <summary>
        /// ✅ TOAJ 文章頁 raw：抓 .col-12.ps-3 的 innerText/outerHTML（抓不到就 null）
        /// </summary>
        private static async Task<string> GetToajArticleDetailRawAsync(string articleUrl, IBrowser browser, CancellationToken ct)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(articleUrl)) return "";
            var page = await browser.NewPageAsync();

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(articleUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                // 文章頁可能需要等一下 JS render
                await page.WaitForTimeoutAsync(600);

                return await ExtractToajArticleDetailRawJsonAsync(page.MainFrame, ct);
            }
            catch
            {
                return "";
            }
            finally
            {
                await page.CloseAsync();
            }
        }
        private static async Task<string> ExtractToajJournalRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            return await frame.EvaluateAsync<string>(
        @"() => {
  const norm = (s) => {
    const t = (s ?? '').replace(/\s+/g,' ').trim();
    return t.length ? t : null;
  };

  const anchors = Array.from(document.querySelectorAll('a[href]'));
  const out = [];

  for (const a of anchors) {
    const href = (a.getAttribute('href') || '').trim();
    if (!href) continue;
    if (!href.includes('/index/journal/volume/')) continue;
    if (href.includes('/index/journal/volume/article/')) continue;

    const url = a.href || href;
    out.push({
      url,
      text: norm(a.textContent)
    });
  }

  return JSON.stringify(out);
}");
        }
        private static async Task<string> ExtractToajVolumeRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            return await frame.EvaluateAsync<string>(
        @"() => {
  const norm = (s) => {
    const t = (s ?? '').replace(/\s+/g,' ').trim();
    return t.length ? t : null;
  };

  // ✅ 1) 優先：直接吃頁面內建的 lstVIT
  try {
    if (Array.isArray(window.lstVIT) && window.lstVIT.length > 0) {
      const out = window.lstVIT
        .map(x => {
          const id = norm(x.vitId);
          if (!id) return null;

          return {
            articleId: id,
            href: `${location.origin}/index/journal/volume/article/${id}`,
            langText: norm(x.languageName),
            typeTexts: norm(x.type) ? [norm(x.type)] : []
          };
        })
        .filter(Boolean);

      return JSON.stringify(out);
    }
  } catch (e) {
    // ignore -> fallback
  }

  // ✅ 2) fallback：用你原本的 DOM 抓法（保留，避免其它站沒 lstVIT）
  const pickIdFromUrl = (url) => {
    const u = (url || '').trim();
    if (!u) return null;
    const m = u.match(/\/article\/([^\/\?#]+)$/i);
    return m ? m[1] : null;
  };

  const findContainer = (a) => {
  // 1) 宣告變數
  if (!a) return null;

  // 2) 執行 function
  // ✅ TOAJ 一筆文章的根容器就是 .article__item（pills 跟 title 都在裡面）
  const item = a.closest('.article__item');
  if (item) return item;

  // ✅ 若站型不同，保底往上找「同時包含 pills 與該連結」的容器
  let el = a.parentElement;
  for (let i = 0; i < 12 && el; i++) {
    const hasPills = (el.querySelectorAll?.('div.font-size-13.mb-1').length ?? 0) >= 2;
    const hasLink = (el.querySelectorAll?.('a[href*=""/index/journal/volume/article/""]').length ?? 0) >= 1;

    if (hasPills && hasLink) return el;
    el = el.parentElement;
  }

  // 3) return
  return a.closest('tr') || a.closest('li') || a.closest('.row') || a.parentElement;
};

  const pickPills = (container) => {
    if (!container) return { langText: null, typeTexts: [] };

    const pillWrap =
  container.querySelector('.d-flex.justify-content-between .d-flex.gap-3')
  || container.querySelector('.d-flex.gap-3');
    if (!pillWrap) return { langText: null, typeTexts: [] };

    const pills = Array.from(pillWrap.querySelectorAll('div.font-size-13.mb-1'))
      .map(x => norm(x.textContent))
      .filter(Boolean);

    const langText = pills.find(x => x === '中文' || x === '英文' || x.toLowerCase() === 'en') || null;
    const typeTexts = pills.filter(x => x !== langText);

    return { langText, typeTexts };
  };

  const anchors = Array.from(document.querySelectorAll('a[href]'));
  const out = [];

  for (const a of anchors) {
    const href = (a.getAttribute('href') || '').trim();
    if (!href) continue;
    if (!href.includes('/index/journal/volume/article/')) continue;

    const url = a.href || href;
    const articleId = pickIdFromUrl(url);
    const container = findContainer(a);
    const pills = pickPills(container);

    out.push({
      articleId,
      href: url,
      langText: pills.langText,
      typeTexts: pills.typeTexts
    });
  }

  const map = new Map();
  for (const x of out) {
    const k = x.articleId || x.href;
    if (!map.has(k)) map.set(k, x);
  }

  return JSON.stringify(Array.from(map.values()));
}");
        }
        private static async Task<string> ExtractToajArticleDetailRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            return await frame.EvaluateAsync<string>(
        @"() => {
  const norm = (s) => {
    const t = (s ?? '').replace(/\s+/g,' ').trim();
    return t.length ? t : null;
  };

  const text = (sel) => {
    const el = document.querySelector(sel);
    return el ? norm(el.textContent) : null;
  };

  const attr = (sel, name) => {
    const el = document.querySelector(sel);
    if (!el) return null;
    const v = (el.getAttribute(name) || '').trim();
    return v.length ? v : null;
  };

  // ✅ 文章主容器（你這份 HTML 是 main-content）
  const main = document.querySelector('.main-content');

  // ✅ 卷期/日期/頁碼那行（Vol.62, No.3 / 2025 / 11 / pp. 217 - 220）
  const metaLine = document.querySelector('.font-Space_Grotesk');

  // ✅ DOI link
  const doiA = document.querySelector('a[href^=""https://doi.org/""]');

  // ✅ 作者區塊（先抓整段文字，後面你再自行拆）
  const authorBlock = document.querySelector('.detail-card .card-body');

  // ✅ PDF download art id
  const pdfBtn = document.querySelector('.btn-download-pdf');

  const obj = {
    // 基本可視資訊
    mainTitle: text('.main-title'),
    subTitle: text('.sub-title'),
    metaLineText: metaLine ? norm(metaLine.textContent) : null,
    doiHref: doiA ? (doiA.getAttribute('href') || '').trim() : null,

    // 作者整塊 raw（你要更細拆也行，但你目前要純 raw）
    authorText: authorBlock ? norm(authorBlock.innerText) : null,
    authorHtml: authorBlock ? norm(authorBlock.outerHTML) : null,

    // 下載資訊
    pdfArtId: pdfBtn ? (pdfBtn.getAttribute('data-art-id') || '').trim() : null,

    // 主內容 raw（最重要：讓你之後自己解析欄位）
    mainText: main ? norm(main.innerText) : null,
    mainHtml: main ? norm(main.outerHTML) : null
  };

  return JSON.stringify(obj);
}");
        }
        private sealed class ToajVolumeListMeta
        {
            [JsonPropertyName("articleId")]
            public string? ArticleId { get; set; }

            [JsonPropertyName("href")]
            public string? Href { get; set; }

            [JsonPropertyName("langText")]
            public string? LangText { get; set; }

            [JsonPropertyName("typeTexts")]
            public List<string>? TypeTexts { get; set; }
        }
        /// <summary>
        /// ✅ 卷期清單 rawJson -> meta dict（key: articleId）
        /// </summary>
        private static Dictionary<string, ToajVolumeListMeta> BuildToajVolumeMetaDict(string? volumeRawJson)
        {
            // 1) 宣告變數
            var dict = new Dictionary<string, ToajVolumeListMeta>(StringComparer.OrdinalIgnoreCase);
            if (string.IsNullOrWhiteSpace(volumeRawJson)) return dict;

            // 2) 執行 function
            try
            {
                var list = JsonSerializer.Deserialize<List<ToajVolumeListMeta>>(volumeRawJson, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                }) ?? new List<ToajVolumeListMeta>();

                foreach (var x in list)
                {
                    var key = (x.ArticleId ?? string.Empty).Trim();
                    if (string.IsNullOrWhiteSpace(key)) continue;
                    if (dict.ContainsKey(key)) continue;

                    dict[key] = x;
                }
            }
            catch
            {
                return new Dictionary<string, ToajVolumeListMeta>(StringComparer.OrdinalIgnoreCase);
            }

            // 3) return
            return dict;
        }
        /// <summary>
        /// 從 TOAJ articleUrl 抽 articleId（最後一段）
        /// </summary>
        private static string? GetToajArticleIdFromUrl(string? articleUrl)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(articleUrl)) return null;

            // 2) 執行 function
            try
            {
                var uri = Uri.TryCreate(articleUrl, UriKind.Absolute, out var abs)
                    ? abs
                    : new Uri(new Uri("https://toaj.stpi.niar.org.tw"), articleUrl);

                var path = uri.AbsolutePath.TrimEnd('/');
                var idx = path.LastIndexOf("/article/", StringComparison.OrdinalIgnoreCase);
                if (idx < 0) return null;

                var id = path[(idx + "/article/".Length)..].Trim();
                return string.IsNullOrWhiteSpace(id) ? null : id;
            }
            catch
            {
                return null;
            }
        }
        /// <summary>
        /// TOAJ 卷期清單語言 pill：中文/英文 -> LangCode
        /// </summary>
        private static LangCode ParseToajLangText(string? langText)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(langText)) return LangCode.zhtw;
            var s = langText.Trim();

            // 2) 執行 function
            if (s == "中文") return LangCode.zhtw;
            if (s == "英文" || s.Equals("en", StringComparison.OrdinalIgnoreCase)) return LangCode.en;

            // 3) return
            return LangCode.zhtw;
        }


        private static void FormatToaj(ToajArticleParsed model, List<TagSet> tagSets, List<SpecJournalIndexSet> journalIndexSets, List<SpecJournalSet> journalSets)
        {
            string tagId = null;
            model.TypesFromList.ForEach(typeText =>
            {
                var typeName = (typeText ?? string.Empty).Replace("類型：", "").Trim();
                if (string.IsNullOrWhiteSpace(typeName)) return;
                var exists = tagSets.Any(ts => ts.TagDetail != null && ts.TagDetail.Any(td => td.TagName == typeName && td.Lang == LangCode.zhtw));
                if (!exists)
                {
                    tagId = $"CrawTag-{tagSets.Count + 1}";
                    tagSets.Add(new TagSet
                    {
                        TagData = new TagData { TagId = tagId, ProgId = PGID.SpecJournal },
                        TagDetail = new List<TagDetail> { new TagDetail { TagId = tagId, RowId = 1, TagName = typeName, Lang = LangCode.zhtw } }
                    });
                    return;
                }
                var existTagSet = tagSets.First(ts => ts.TagDetail != null && ts.TagDetail.Any(td => td.TagName == typeName && td.Lang == LangCode.zhtw));
                tagId = existTagSet.TagData.TagId;
            });

            string year = model.Year;
            DateOnly? publishDate = new DateOnly(int.Parse(year), model.Month.ToInt32(), 1);
            int volume = model.Vol.ToInt32();
            string issue = model.Issue;

            var indexSet = journalIndexSets.Find(x => x.SpecJournalIndex?.IndexName == year);
            var indexDetail = indexSet?.SpecJournalIndexDetail.FirstOrDefault(d => d.Volume == volume && d.Issue == issue);
            if (indexSet == null)
            {
                indexSet = new SpecJournalIndexSet
                {
                    SpecJournalIndex = new SpecJournalIndexModel
                    {
                        IndexId = $"CrawIndex-{journalSets.Count + 1}",
                        IndexName = year
                    },
                    SpecJournalIndexDetail = []
                };

                journalIndexSets.Add(indexSet);
            }
            if (indexDetail == null)
            {
                indexDetail = new SpecJournalIndexDetail
                {
                    IndexId = indexSet.SpecJournalIndex.IndexId,
                    RowId = indexSet.SpecJournalIndexDetail.Count + 1,
                    Volume = volume,
                    Issue = issue,
                    PublishDate = publishDate,
                    IsSpecial = (issue ?? "").Contains("Special", StringComparison.OrdinalIgnoreCase), // ✅ Special Issue
                    PublishStatus = PublishStatus.Published,
                    SeasonNo = string.Empty
                };
                indexSet.SpecJournalIndexDetail.Add(indexDetail);
            }
            var refFormats = new List<SpecJournalRefFormat>();


            var keywords = new List<SpecJournalKeywords>();
            if (model.Keywords != null && model.Keywords.Count > 0)
                keywords.AddRange(model.Keywords.Where(x => !string.IsNullOrWhiteSpace(x)).Select(kw => new SpecJournalKeywords { Keyword = kw, LangCode = LangCode.zhtw }));
            if (model.Keywords_en != null && model.Keywords_en.Count > 0)
                keywords.AddRange(model.Keywords_en.Where(x => !string.IsNullOrWhiteSpace(x)).Select(kw => new SpecJournalKeywords { Keyword = kw, LangCode = LangCode.en }));


            if (journalSets.Find(p =>
            p.SpecJournal.JournalIndexId == indexSet.SpecJournalIndex.IndexId
            && p.SpecJournal.JournalIndexRowId == indexDetail.RowId
            && p.SpecJournal.PageStart == model.PageStart
            && p.SpecJournal.PageEnd == model.PageEnd
            ) == null)
            {
                journalSets.Add(new SpecJournalSet
                {
                    SpecJournal = new SpecJournalModel
                    {
                        JournalId = $"CrawJournal-{journalSets.Count + 1}",
                        JournalIndexId = indexSet.SpecJournalIndex.IndexId,
                        JournalIndexRowId = indexDetail.RowId,
                        Title = model.Title??"",
                        Title_en = model.Title_en??"",
                        PageStart = model.PageStart,
                        PageEnd = model.PageEnd,
                        DOIUrl = model.DoiUrl ?? "",
                        ArticleLang = model.ArticleLangFromList,
                        Memo = model.Memo ?? "",
                        Memo_en = model.Memo_en ?? ""
                    },
                    SpecJournalAuthor = model.Authors?.Select(author => new SpecJournalAuthor { AuthorName = author.Name??"", AuthorName_en = author.Name_en??"", ORCID = string.Empty }).ToList(),
                    SpecJournalRefFormat = refFormats.Count > 0 ? refFormats : [],
                    SpecJournalTypes = !string.IsNullOrWhiteSpace(tagId) ? [new SpecJournalTypes { TagId = tagId }] : [],
                    SpecJournalKeywords = keywords.Count > 0 ? keywords : []
                });
            }
        }
        #region Model
        private static class ToajArticleParser
        {
            private static readonly JsonSerializerOptions _jsonOpt = new()
            {
                PropertyNameCaseInsensitive = true
            };

            /// <summary>
            /// ✅ TOAJ rawJson -> 解析後欄位
            /// </summary>
            public static ToajArticleParsed ParseFromRawJson(string? rawJson)
            {
                // 1) 宣告變數
                var parsed = new ToajArticleParsed();
                if (string.IsNullOrWhiteSpace(rawJson)) return parsed;

                var raw = SafeDeserialize(rawJson);

                // 2) 執行 function
                parsed.Title = raw.MainTitle;
                parsed.Title_en = raw.SubTitle;
                parsed.DoiUrl = raw.DoiHref;

                ApplyMetaLine(raw.MetaLineText, parsed);
                ApplyPagesFromMainHtml(raw.MainHtml, parsed);
                ApplyAuthorsFromAuthorHtml(raw.AuthorHtml, parsed);
                ApplyAbstractAndKeywordsFromAuthorHtml(raw.AuthorHtml, parsed);

                // 3) return
                return parsed;
            }

            /// <summary>
            /// 解析 (Vol.62, No.3 / 2025 / 11)
            /// </summary>
            /// <summary>
            /// 解析 (Vol.62, No.3 / 2025 / 11) 或 (Vol.51, Special Issue / 2014 / 12)
            /// </summary>
            private static void ApplyMetaLine(string? metaLineText, ToajArticleParsed parsed)
            {
                if (string.IsNullOrWhiteSpace(metaLineText)) return;

                // (Vol.48 No.4 / 2011 / 6) -> Vol.48 No.4 / 2011 / 6
                var s = metaLineText.Trim().Trim('(', ')').Trim();

                // ✅ Case A：Vol.48 No.4 / 2011 / 6
                // ✅ Case A2：Vol.48, No.4 / 2011 / 6
                // ✅ Case A3：Vol 48 No 4 / 2011 / 6
                var m = Regex.Match(
                    s,
                    @"Vol\.?\s*(?<vol>\d+)\s*(?:,?\s*)?(?:No\.?\s*(?<no>[^/]+?)\s*)?/\s*(?<y>\d{4})\s*/\s*(?<m>\d{1,2})",
                    RegexOptions.IgnoreCase);

                if (m.Success)
                {
                    parsed.Vol = TryInt(m.Groups["vol"].Value);
                    parsed.Issue = (m.Groups["no"].Value ?? "").Trim();
                    parsed.Year = (m.Groups["y"].Value ?? "").Trim();
                    parsed.Month = TryInt(m.Groups["m"].Value);
                    return;
                }

                // ✅ Case B：Vol.51 Special Issue / 2014 / 12（逗號可有可無）
                var mSp = Regex.Match(
                    s,
                    @"Vol\.?\s*(?<vol>\d+)\s*(?:,?\s*)?(?<issue>Special\s*Issue)\s*/\s*(?<y>\d{4})\s*/\s*(?<m>\d{1,2})",
                    RegexOptions.IgnoreCase);

                if (mSp.Success)
                {
                    parsed.Vol = TryInt(mSp.Groups["vol"].Value);
                    parsed.Issue = "Special Issue";
                    parsed.Year = (mSp.Groups["y"].Value ?? "").Trim();
                    parsed.Month = TryInt(mSp.Groups["m"].Value);
                    return;
                }
            }


            /// <summary>
            /// 從 mainHtml 抓 pp. 313 - 350
            /// </summary>
            private static void ApplyPagesFromMainHtml(string? mainHtml, ToajArticleParsed parsed)
            {
                // 1) 宣告變數
                if (string.IsNullOrWhiteSpace(mainHtml)) return;

                // 2) 執行 function
                var m = Regex.Match(mainHtml, @"pp\.\s*(?<s>\d+)\s*[-–]\s*(?<e>\d+)", RegexOptions.IgnoreCase);
                if (m.Success)
                {
                    parsed.PageStart = TryInt(m.Groups["s"].Value) ?? 0;
                    parsed.PageEnd = TryInt(m.Groups["e"].Value) ?? 0;
                    if (parsed.PageStart > 0 && parsed.PageEnd == 0) parsed.PageEnd = parsed.PageStart;
                    return;
                }

                // 若只有單頁（保底）
                var m2 = Regex.Match(mainHtml, @"pp\.\s*(?<s>\d+)", RegexOptions.IgnoreCase);
                if (m2.Success)
                {
                    parsed.PageStart = TryInt(m2.Groups["s"].Value) ?? 0;
                    parsed.PageEnd = parsed.PageStart;
                }

                // 3) return
                return;
            }

            /// <summary>
            /// 從 authorHtml 抓作者（只取 mobile-hide，避免 mobile-show 重複）
            /// - 能把「吳柏毅 Bo-Yi Wu」切成 (中文名, 英文名)
            /// - 會忽略 affiliation 那行（(國立...）
            /// - 會去掉星號 *、多餘空白
            /// </summary>
            private static void ApplyAuthorsFromAuthorHtml(string? authorHtml, ToajArticleParsed parsed)
            {
                if (string.IsNullOrWhiteSpace(authorHtml)) return;

                // ✅ 1) 只取 mobile-hide（避免 mobile-show 造成同一作者被抓兩次）
                var block = ExtractFirst(
                    authorHtml,
                    @"<div class=""mobile-hide"">(?<x>[\s\S]*?)</div>\s*<div class=""mobile-show"">"
                );
                if (string.IsNullOrWhiteSpace(block)) block = authorHtml;

                // ✅ 2) 僅抓「作者」區塊，避免掃到「中文摘要/英文摘要...」裡的 div
                // 以 <div class="brown-label">作者</div> 之後開始，直到下一個 brown-label 為止
                var authorArea = ExtractFirst(
                    block,
                    @"<div class=""brown-label"">\s*作者\s*</div>(?<x>[\s\S]*?)(?=<div class=""brown-label"">|\z)"
                );
                if (string.IsNullOrWhiteSpace(authorArea)) authorArea = block;

                // ✅ 3) 抓每個作者列：<div class="d-flex gap-1"> <div>姓名</div> <div>(affiliation)</div> </div>
                // 只取第一個 <div> ... </div> 裡面的內容當作姓名
                var matches = Regex.Matches(
                    authorArea,
                    @"<div\s+class=""d-flex\s+gap-1"">\s*<div>\s*(?<name>[\s\S]*?)\s*</div>",
                    RegexOptions.IgnoreCase
                );

                foreach (Match mm in matches)
                {
                    var rawName = mm.Groups["name"].Value;
                    if (string.IsNullOrWhiteSpace(rawName)) continue;

                    // 去 tag、decode、整理空白
                    var nameText = HtmlText(rawName);
                    nameText = Regex.Replace(nameText, @"<[^>]+>", " ");  // 移除任何殘餘 tag
                    nameText = Regex.Replace(nameText, @"\s+", " ").Trim();

                    // 避免把 affiliation 或空行當作者
                    if (string.IsNullOrWhiteSpace(nameText)) continue;
                    if (nameText.StartsWith("(", StringComparison.OrdinalIgnoreCase)) continue;

                    // 去掉星號與尾端符號（有些星號會在下一行或黏在名字旁）
                    nameText = nameText.Replace("*", " ").Trim();
                    nameText = Regex.Replace(nameText, @"\s+", " ").Trim();

                    // ✅ 必須至少含英文才算「中英作者名」那種格式
                    if (!Regex.IsMatch(nameText, @"[A-Za-z]")) continue;

                    var (zh, en) = SplitZhEnName(nameText);

                    // 若兩者都空就略過
                    if (string.IsNullOrWhiteSpace(zh) && string.IsNullOrWhiteSpace(en)) continue;

                    parsed.Authors.Add(new ToajAuthorParsed
                    {
                        Name = zh,
                        Name_en = en
                    });
                }

                // ✅ 4) 去重（同一作者可能因 HTML 小差異被抓到兩次）
                parsed.Authors = parsed.Authors
                    .Where(a => !(string.IsNullOrWhiteSpace(a.Name) && string.IsNullOrWhiteSpace(a.Name_en)))
                    .GroupBy(a => $"{(a.Name ?? "").Trim()}|{(a.Name_en ?? "").Trim()}")
                    .Select(g => g.First())
                    .ToList();

                // ---------------- local helpers ----------------
                static (string? Zh, string? En) SplitZhEnName(string full)
                {
                    // 以第一個英文字符開始切：前面視為中文名，後面視為英文名
                    // e.g. "吳柏毅 Bo-Yi Wu" => zh="吳柏毅" en="Bo-Yi Wu"
                    // e.g. "鄭琨鴻 Kun-Hung Cheng" => zh="鄭琨鴻" en="Kun-Hung Cheng"
                    var s = (full ?? "").Trim();
                    s = Regex.Replace(s, @"\s+", " ").Trim();

                    var m = Regex.Match(s, @"(?<zh>.*?)(?<en>[A-Za-z].*)$");
                    if (!m.Success)
                    {
                        // 沒切到就全當中文（保底）
                        return (string.IsNullOrWhiteSpace(s) ? null : s, null);
                    }

                    var zh = m.Groups["zh"].Value.Trim();
                    var en = m.Groups["en"].Value.Trim();

                    return (
                        string.IsNullOrWhiteSpace(zh) ? null : zh,
                        string.IsNullOrWhiteSpace(en) ? null : en
                    );
                }
            }

            /// <summary>
            /// 從 authorHtml 抓 摘要 / 關鍵字（brown-label 對應下一段 <p>）
            /// </summary>
            private static void ApplyAbstractAndKeywordsFromAuthorHtml(string? authorHtml, ToajArticleParsed parsed)
            {
                // 1) 宣告變數
                if (string.IsNullOrWhiteSpace(authorHtml)) return;

                // 2) 執行 function
                parsed.Memo = ExtractLabelParagraph(authorHtml, "中文摘要");
                parsed.Memo_en = ExtractLabelParagraph(authorHtml, "英文摘要");

                var kwCt = ExtractLabelParagraph(authorHtml, "中文關鍵字");
                var kwEn = ExtractLabelParagraph(authorHtml, "英文關鍵字");

                parsed.Keywords = SplitKeywords(kwCt);
                parsed.Keywords_en = SplitKeywords(kwEn);

                // 3) return
                return;
            }

            // ---------- helpers ----------

            private static ToajArticleRaw SafeDeserialize(string rawJson)
            {
                // 1) 宣告變數
                try
                {
                    // 2) 執行 function
                    var raw = JsonSerializer.Deserialize<ToajArticleRaw>(rawJson, _jsonOpt);
                    // 3) return
                    return raw ?? new ToajArticleRaw();
                }
                catch
                {
                    return new ToajArticleRaw();
                }
            }

            private static int? TryInt(string? s)
            {
                if (int.TryParse((s ?? "").Trim(), out var v)) return v;
                return null;
            }

            private static string? ExtractFirst(string html, string pattern)
            {
                var m = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
                return m.Success ? m.Groups["x"].Value : null;
            }

            private static string HtmlText(string s)
            {
                // 簡易 decode（這裡只先處理你常見的 &amp;）
                return s.Replace("&amp;", "&").Replace("&nbsp;", " ");
            }

            private static (string? Zh, string? En) SplitZhEn(string full)
            {
                // 1) 宣告變數
                full = full.Replace("*", "").Trim();

                // 2) 執行 function
                // 以「最後一段英文」為主：找第一個英文單字開始的位置
                var m = Regex.Match(full, @"(?<zh>.*?)(?<en>[A-Za-z].*)$");
                if (!m.Success) return (full, null);

                var zh = m.Groups["zh"].Value.Trim();
                var en = m.Groups["en"].Value.Trim();

                // 3) return
                return (string.IsNullOrWhiteSpace(zh) ? null : zh, string.IsNullOrWhiteSpace(en) ? null : en);
            }

            private static string? ExtractLabelParagraph(string html, string label)
            {
                // 尋找：<div class="brown-label">中文摘要</div> ... <p>...</p>
                var pattern =
                    $@"<div class=""brown-label"">\s*{Regex.Escape(label)}\s*</div>[\s\S]*?<p>(?<p>[\s\S]*?)</p>";
                var m = Regex.Match(html, pattern, RegexOptions.IgnoreCase);
                if (!m.Success) return null;

                var t = HtmlText(m.Groups["p"].Value);
                t = Regex.Replace(t, @"<[^>]+>", " "); // 移除殘餘 tag
                t = Regex.Replace(t, @"\s+", " ").Trim();

                return string.IsNullOrWhiteSpace(t) ? null : t;
            }

            private static List<string> SplitKeywords(string? raw)
            {
                if (string.IsNullOrWhiteSpace(raw)) return new List<string>();

                return raw
                    .Split(';', StringSplitOptions.RemoveEmptyEntries)
                    .Select(x => x.Trim())
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .ToList();
            }
        }

        private sealed class ToajArticleRaw
        {
            [JsonPropertyName("mainTitle")]
            public string? MainTitle { get; set; }

            [JsonPropertyName("subTitle")]
            public string? SubTitle { get; set; }

            [JsonPropertyName("metaLineText")]
            public string? MetaLineText { get; set; }

            [JsonPropertyName("doiHref")]
            public string? DoiHref { get; set; }

            [JsonPropertyName("authorHtml")]
            public string? AuthorHtml { get; set; }

            [JsonPropertyName("mainHtml")]
            public string? MainHtml { get; set; }
        }

        private sealed class ToajArticleParsed
        {
            public string? Year { get; set; }
            public int? Month { get; set; }
            public int? Vol { get; set; }
            public string? Issue { get; set; }
            public int PageStart { get; set; }
            public int PageEnd { get; set; }
            public string? DoiUrl { get; set; }
            public string? Title { get; set; }
            public string? Title_en { get; set; }
            public List<ToajAuthorParsed> Authors { get; set; } = new();
            public string? Memo { get; set; }
            public string? Memo_en { get; set; }
            public List<string> Keywords { get; set; } = new();
            public List<string> Keywords_en { get; set; } = new();
            public LangCode ArticleLangFromList { get; set; }
            public List<string> TypesFromList { get; set; } = new();
        }
        private sealed class ToajAuthorParsed
        {
            public string? Name { get; set; }
            public string? Name_en { get; set; }
        }
        #endregion

        #endregion

        #region Joemls
        /// <summary>
        /// https://joemls.reding.work/
        /// </summary>
        /// <returns></returns>
        private static async Task GetJoemls(List<TagSet> tagSets, List<SpecJournalIndexSet> journalIndexSets, List<SpecJournalSet> journalSets,
            int maxIssues = 0, [FromQuery] int maxArticlesPerIssue = 0, CancellationToken ct = default)
        {
            // 1) 宣告變數
            var tocUrl = "https://joemls.reding.work/%e6%9c%9f%e5%88%8a%e7%9b%ae%e6%ac%a1/";
            using var playwright = await Playwright.CreateAsync();
            await using var browser = await CreateBrowserAsync(playwright);

            var issueUrls = new List<string>();
            var issueRaw = new List<string>();
            var listRaw = new List<string>();
            var pageIds = new List<string>();

            // 2) 執行 function
            var (issueUrlsAll, issueRawAll) = await GetIssueUrlsRawAsync(tocUrl, browser, ct);
            issueUrls = ApplyLimit(issueUrlsAll, maxIssues);
            issueRaw = issueRawAll; // 你也可同步 limit 後再取 raw（看你要不要）

            foreach (var issueUrl in issueUrls)
            {
                ct.ThrowIfCancellationRequested();

                var (ids, listJson) = await GetPageIdsFromIssueAsync(issueUrl, browser, maxArticlesPerIssue, ct);
                listRaw.Add(listJson);
                pageIds.AddRange(ids);

                foreach (var pid in ids)
                {
                    if (pid.Contains("articleId=61155") || pid.Contains("articleId=61166")) continue;
                    ct.ThrowIfCancellationRequested();

                    var detailJson = await GetArticleDetailRawAsync(pid, browser, ct);
                    if (!string.IsNullOrWhiteSpace(detailJson))
                    {
                        FormatJoemls(detailJson, tagSets, journalIndexSets, journalSets);
                    }
                }
            }
        }
        /// <summary>
        /// ✅ TOC 抓卷期連結：只回傳 issueUrls + rawJson
        /// </summary>
        private static async Task<(List<string> IssueUrls, List<string> IssueRawJson)> GetIssueUrlsRawAsync(string tocUrl, IBrowser browser, CancellationToken ct)
        {
            // 1) 宣告變數
            var page = await browser.NewPageAsync();
            var urls = new List<string>();
            var raws = new List<string>();

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(tocUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                var frame = await EnsureTocFrameReadyAsync(page, ct);
                await EnsureTocContentLoadedAsync(frame, ct);

                var json = await ExtractTocRawJsonAsync(frame, ct);
                raws.Add(json);

                urls = ExtractUrlsFromRawJson(json);
            }
            finally
            {
                await page.CloseAsync();
            }

            // 3) return
            return (urls, raws);
        }
        /// <summary>
        /// ✅ 卷期清單頁：回傳 pageIds（用 detailUrl 當 pageId） + rawJson
        /// </summary>
        private static async Task<(List<string> PageIds, string ListRawJson)> GetPageIdsFromIssueAsync(string issueUrl, IBrowser browser, int maxArticles, CancellationToken ct)
        {
            // 1) 宣告變數
            var page = await browser.NewPageAsync();
            var pageIds = new List<string>();
            var listJson = "";

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(issueUrl, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                var frame = await EnsureIframeListReadyAsync(page, ct);
                await EnsureIssueListLoadedAsync(frame, ct);

                listJson = await ExtractIssueListRawJsonAsync(frame, ct);

                pageIds = ExtractDetailUrlsFromIssueListRawJson(listJson);
                pageIds = ApplyLimit(pageIds, maxArticles);
            }
            catch
            {
                // crawler 不中斷
                return (new List<string>(), "");
            }
            finally
            {
                await page.CloseAsync();
            }

            // 3) return
            return (pageIds, listJson);
        }
        /// <summary>
        /// ✅ 文章內頁 raw：只回傳 JSON string
        /// </summary>
        private static async Task<string> GetArticleDetailRawAsync(string pageId, IBrowser browser, CancellationToken ct)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(pageId)) return "";
            var page = await browser.NewPageAsync();

            // 2) 執行 function
            try
            {
                await SetCrawlerHeadersAsync(page);
                await page.GotoAsync(pageId, new PageGotoOptions { WaitUntil = WaitUntilState.DOMContentLoaded });

                // Case A：本頁就有內容
                var hasContentOnPage = await page.Locator("#ToC_article").CountAsync() > 0;
                if (hasContentOnPage)
                {
                    return await ExtractArticleDetailRawJsonAsync(page.MainFrame, ct);
                }

                // Case B：iframe_list
                var frame = await EnsureIframeListReadyAsync(page, ct);
                await frame.WaitForSelectorAsync("#ToC_article", new FrameWaitForSelectorOptions { Timeout = 30000 });

                return await ExtractArticleDetailRawJsonAsync(frame, ct);
            }
            catch (Exception ex)
            {
                return "";
            }
            finally
            {
                await page.CloseAsync();
            }
        }
        /// <summary>
        /// ✅ crawler header 統一
        /// </summary>
        private static async Task SetCrawlerHeadersAsync(IPage page)
        {
            await page.SetExtraHTTPHeadersAsync(new Dictionary<string, string>
            {
                ["Accept-Language"] = "zh-TW,zh;q=0.9,en;q=0.7"
            });
        }
        /// <summary>
        /// ✅ TOC raw：把所有卷期 anchor 抓成 json（不做解析）
        /// </summary>
        private static async Task<string> ExtractTocRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            return await frame.EvaluateAsync<string>(
        @"() => {
    const norm = (s) => (s || '').replace(/\s+/g,' ').trim();
    const yearRe = /^(19\d{2})(-20\d{2})?$|^(20\d{2})(-20\d{2})?$/;
    const volRe  = /^Vol\.?\s*\d+\s*,\s*No\.?\s*\d+/i;

    const out = [];
    const anchors = Array.from(document.querySelectorAll('a'));

    for (const a of anchors) {
        const text = norm(a.textContent);
        if (!text) continue;
        if (!(volRe.test(text) || /special\s*issue/i.test(text))) continue;

        const tr = a.closest('tr');
        const ytd = tr?.querySelector('td.ToC_year');
        const yearLabel = norm(ytd?.textContent);
        const url = a.href || '';

        out.push({ yearLabel: yearRe.test(yearLabel) ? yearLabel : '', text, url });
    }

    return JSON.stringify(out);
}");
        }
        /// <summary>
        /// ✅ Issue list raw：把清單 table 的每列抓成 json（不做解析）
        /// </summary>
        private static async Task<string> ExtractIssueListRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            return await frame.EvaluateAsync<string>(
        @"() => {
    const norm = (s) => (s || '').replace(/\s+/g,' ').trim();

    const rows = Array.from(document.querySelectorAll('table#ToC_journal tbody tr'));
    const out = [];

    for (const tr of rows) {
        const a = tr.querySelector('td.journal_title a');
        const href = a?.href || '';
        const titleCt = norm(tr.querySelector('div.journal_title_ct')?.textContent);
        const titleEn = norm(tr.querySelector('div.journal_title_en')?.textContent);

        out.push({
            href,
            titleCt,
            titleEn,
            rowText: norm(tr.textContent)
        });
    }

    return JSON.stringify(out);
}");
        }
        /// <summary>
        /// ✅ Article detail raw：把 detail 頁所有需要的區塊抓成 json（不做轉換）
        /// </summary>
        private static async Task<string> ExtractArticleDetailRawJsonAsync(IFrame frame, CancellationToken ct)
        {
            ct.ThrowIfCancellationRequested();

            await EnsureArticleDetailLoadedAsync(frame, ct);

            return await frame.EvaluateAsync<string>(
        @"() => {
  const norm = (s) => {
    const t = (s ?? '').replace(/\s+/g, ' ').trim();
    return t.length ? t : null;
  };

  const getTextOrNull = (sel, root = document) => {
    const el = root.querySelector(sel);
    if (!el) return null;
    return norm(el.textContent);
  };

  const getAttrOrNull = (sel, attr, root = document) => {
    const el = root.querySelector(sel);
    if (!el) return null;
    const v = (el.getAttribute(attr) || '').trim();
    return v.length ? v : null;
  };

  const getListTextOrNull = (sel, root = document) => {
    const els = Array.from(root.querySelectorAll(sel));
    if (!els.length) return null;
    const arr = els.map(x => norm(x.textContent)).filter(Boolean);
    return arr.length ? arr : null;
  };

  const getAnchorTextListOrNull = (sel, root = document) => {
    const els = Array.from(root.querySelectorAll(sel));
    if (!els.length) return null;
    const arr = els.map(a => norm(a.textContent)).filter(Boolean);
    return arr.length ? arr : null;
  };

  const getAuthorsOrNull = () => {
    const containers = Array.from(document.querySelectorAll('#article_author > div > div'));
    const nodes = containers.filter(n =>
      n.querySelector('span.author_ct') ||
      n.querySelector('span.author_en') ||
      n.querySelector('.author_orcid')
    );

    if (!nodes.length) return null;

    const authors = nodes.map(n => {
      const authorCt = getTextOrNull('span.author_ct', n);
      const authorEn = getTextOrNull('span.author_en', n);

      const orcidEl = n.querySelector('.author_orcid a');
      const authorOrcid = orcidEl ? norm(orcidEl.textContent) : null;

      return {
        author_ct: authorCt,
        author_en: authorEn,
        author_orcid: authorOrcid
      };
    });

    return authors.length ? authors : null;
  };

  const getCitationContentOrNull = (idSel) => {
    const root = document.querySelector(idSel);
    if (!root) return null;

    const clone = root.cloneNode(true);
    Array.from(clone.querySelectorAll('.article_subtitle')).forEach(x => x.remove());

    const t = norm(clone.innerText);
    return t;
  };

  const obj = {
    title_ct: getTextOrNull('#article_title .title_ct'),
    title_en: getTextOrNull('#article_title .title_en'),

    article_author: getAuthorsOrNull(),

    author_doi: getAttrOrNull('#article_author .author_doi a', 'href'),

    detail_date: getTextOrNull('#article_detail .detail_date'),
    detail_vol_no: getTextOrNull('#article_detail .detail_vol_no'),
    detail_page: getTextOrNull('#article_detail .detail_page'),
    detail_language: getTextOrNull('#article_detail .detail_language'),

    detail_type: getListTextOrNull('#article_detail .detail_type'),

    detail_keyword_ct: getAnchorTextListOrNull('#article_detail .detail_keyword_ct a'),
    detail_keyword_en: getAnchorTextListOrNull('#article_detail .detail_keyword_en a'),

    abstract_ct: getTextOrNull('#article_abstract .abstract_ct'),
    abstract_en: getTextOrNull('#article_abstract .abstract_en'),

    article_apa: getCitationContentOrNull('#article_apa'),
    article_chicago: getCitationContentOrNull('#article_chicago')
  };

  return JSON.stringify(obj);
}
");
        }
        /// <summary>
        /// ✅ 從 TOC rawJson 抽 issue urls
        /// </summary>
        private static List<string> ExtractUrlsFromRawJson(string json)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(json)) return new List<string>();

            // 2) 執行 function
            try
            {
                using var doc = JsonDocument.Parse(json);
                return doc.RootElement
                    .EnumerateArray()
                    .Select(x => x.TryGetProperty("url", out var v) ? v.GetString() : null)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList()!;
            }
            catch
            {
                return new List<string>();
            }
        }
        /// <summary>
        /// ✅ 從 issue list rawJson 抽 detail urls（pageIds）
        /// </summary>
        private static List<string> ExtractDetailUrlsFromIssueListRawJson(string json)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(json)) return new List<string>();

            // 2) 執行 function
            try
            {
                using var doc = JsonDocument.Parse(json);
                return doc.RootElement
                    .EnumerateArray()
                    .Select(x => x.TryGetProperty("href", out var v) ? v.GetString() : null)
                    .Where(x => !string.IsNullOrWhiteSpace(x))
                    .Distinct()
                    .ToList()!;
            }
            catch
            {
                return new List<string>();
            }
        }
        /// <summary>
        /// list 限制（0 表示不限）
        /// </summary>
        private static List<T> ApplyLimit<T>(List<T> list, int max)
        {
            if (max <= 0) return list;
            return list.Take(max).ToList();
        }
        /// <summary>
        /// 建立 Browser
        /// - 初始匯入建議 Headless=false（避免被擋，debug 也好看）
        /// </summary>
        private static async Task<IBrowser> CreateBrowserAsync(IPlaywright playwright)
        {
            return await playwright.Chromium.LaunchAsync(new BrowserTypeLaunchOptions
            {
                Headless = false,
                SlowMo = 30,
                Args = new[]
                {
                    "--no-sandbox",
                    "--disable-dev-shm-usage"
                }
            });
        }
        /// <summary>
        /// TOC 內容在 iframe#mainframe
        /// </summary>
        private static async Task<IFrame> EnsureTocFrameReadyAsync(IPage page, CancellationToken ct)
        {
            await page.WaitForSelectorAsync("iframe#mainframe", new PageWaitForSelectorOptions { Timeout = 30000 });
            ct.ThrowIfCancellationRequested();

            var frame = page.Frame("mainframe");
            frame ??= page.Frames.FirstOrDefault(f => f.Url.Contains("custom/tableOfContent.php", StringComparison.OrdinalIgnoreCase));

            if (frame == null)
            {
                var frames = string.Join("\n", page.Frames.Select(f => $"- {f.Name} | {f.Url}"));
                throw new InvalidOperationException($"Cannot locate TOC iframe 'mainframe'. Frames:\n{frames}");
            }

            await frame.WaitForLoadStateAsync(LoadState.DOMContentLoaded, new FrameWaitForLoadStateOptions { Timeout = 30000 });
            return frame;
        }
        /// <summary>
        /// 第二頁 / 第三頁：內容在 iframe#iframe_list
        /// 找不到就回 null（讓上層略過，不要直接 throw）
        /// </summary>
        private static async Task<IFrame> EnsureIframeListReadyAsync(IPage page, CancellationToken ct)
        {
            await page.WaitForSelectorAsync("iframe#iframe_list", new PageWaitForSelectorOptions { Timeout = 30000 });
            ct.ThrowIfCancellationRequested();

            var frame = page.Frame("iframe_list");
            frame ??= page.Frames.FirstOrDefault(f => string.Equals(f.Name, "iframe_list", StringComparison.OrdinalIgnoreCase));

            if (frame == null)
            {
                var frames = string.Join("\n", page.Frames.Select(f => $"- {f.Name} | {f.Url}"));
                throw new InvalidOperationException($"Cannot locate iframe 'iframe_list'. Frames:\n{frames}");
            }

            // ✅ 避免 about:blank / 尚未 ready
            await frame.WaitForLoadStateAsync(LoadState.DOMContentLoaded, new FrameWaitForLoadStateOptions { Timeout = 30000 });
            return frame;
        }
        /// <summary>
        /// TOC iframe 內容 ready
        /// </summary>
        private static async Task EnsureTocContentLoadedAsync(IFrame frame, CancellationToken ct)
        {
            await frame.WaitForSelectorAsync("body", new FrameWaitForSelectorOptions { Timeout = 30000 });

            for (var i = 0; i < 30; i++)
            {
                ct.ThrowIfCancellationRequested();

                var hasIssue = await HasIssueAnchorAsync(frame);
                if (hasIssue) return;

                await frame.EvaluateAsync("() => window.scrollBy(0, Math.max(600, window.innerHeight))");
                await frame.Page.WaitForTimeoutAsync(500);
            }

            if (!await HasIssueAnchorAsync(frame))
                throw new TimeoutException("TOC iframe did not render any issue links (Vol.xx, No.x).");
        }
        /// <summary>
        /// 第二頁文章清單 ready（table#ToC_journal）
        /// </summary>
        private static async Task EnsureIssueListLoadedAsync(IFrame frame, CancellationToken ct)
        {
            await frame.WaitForSelectorAsync("table#ToC_journal", new FrameWaitForSelectorOptions { Timeout = 30000 });
            await frame.WaitForSelectorAsync("td.journal_title a", new FrameWaitForSelectorOptions { Timeout = 30000 });
            ct.ThrowIfCancellationRequested();
        }
        /// <summary>
        /// 第三頁文章 detail ready（#article_title / #article_detail）
        /// </summary>
        private static async Task EnsureArticleDetailLoadedAsync(IFrame frame, CancellationToken ct)
        {
            // ✅ 等主區塊
            await frame.WaitForSelectorAsync("#article_detail");
        }
        /// <summary>
        /// TOC iframe 內是否有 Vol/No link
        /// </summary>
        private static async Task<bool> HasIssueAnchorAsync(IFrame frame)
        {
            var hit = await frame.EvaluateAsync<int>(
@"() => {
    const norm = (s) => (s || '').replace(/\s+/g,' ').trim();
    const volRe = /^Vol\.?\s*\d+\s*,\s*No\.?\s*\d+/i;

    const anchors = Array.from(document.querySelectorAll('a'));
    let hit = 0;

    for (const a of anchors) {
        const t = norm(a.textContent);
        if (!t) continue;
        if (volRe.test(t) || /special\s*issue/i.test(t)) {
            hit++;
            if (hit >= 3) break;
        }
    }
    return hit;
}");
            return hit > 0;
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="detailJson"></param>
        /// <param name="tagSets"></param>
        /// <param name="journalIndexSets"></param>
        /// <param name="journalSets"></param>
        private static void FormatJoemls(string detailJson, List<TagSet> tagSets, List<SpecJournalIndexSet> journalIndexSets, List<SpecJournalSet> journalSets)
        {
            var model = JsonSerializer.Deserialize<ArticleRawModel>(detailJson, new JsonSerializerOptions() { PropertyNameCaseInsensitive = true });
            string tagId = null;
            model.DetailTypes.ForEach(typeText =>
            {
                var typeName = (typeText ?? string.Empty).Replace("類型：", "").Trim();
                if (string.IsNullOrWhiteSpace(typeName)) return;
                var exists = tagSets.Any(ts => ts.TagDetail != null && ts.TagDetail.Any(td => td.TagName == typeName && td.Lang == LangCode.zhtw));
                if (!exists)
                {
                    tagId = $"CrawTag-{tagSets.Count + 1}";
                    tagSets.Add(new TagSet
                    {
                        TagData = new TagData { TagId = tagId, ProgId = PGID.SpecJournal },
                        TagDetail = new List<TagDetail> { new TagDetail { TagId = tagId, RowId = 1, TagName = typeName, Lang = LangCode.zhtw } }
                    });
                    return;
                }
                var existTagSet = tagSets.First(ts => ts.TagDetail != null && ts.TagDetail.Any(td => td.TagName == typeName && td.Lang == LangCode.zhtw));
                tagId = existTagSet.TagData.TagId;
            });

            string year = string.Empty;
            DateOnly? publishDate = null;
            int volume = 0;
            string issue = string.Empty;
            if (!string.IsNullOrWhiteSpace(model.DetailDate))
            {
                var dateMatch = Regex.Match(model.DetailDate, @"(?<y>\d{4})\s*年\s*(?<m>\d{1,2})\s*月");
                if (dateMatch.Success)
                {
                    year = dateMatch.Groups["y"].Value;
                    var month = int.Parse(dateMatch.Groups["m"].Value);
                    publishDate = new DateOnly(int.Parse(year), month, 1);
                }
            }
            if (!string.IsNullOrWhiteSpace(model.DetailVolNo))
            {
                var volMatch = Regex.Match(model.DetailVolNo, @"(?<vol>\d+)\s*卷\s*(?<issue>[\d/]+)\s*期");
                if (volMatch.Success)
                {
                    volume = int.Parse(volMatch.Groups["vol"].Value);
                    issue = volMatch.Groups["issue"].Value;
                }
            }
            var indexSet = journalIndexSets.Find(x => x.SpecJournalIndex?.IndexName == year);
            var indexDetail = indexSet?.SpecJournalIndexDetail.FirstOrDefault(d => d.Volume == volume && d.Issue == issue);
            if (indexSet == null)
            {
                indexSet = new SpecJournalIndexSet
                {
                    SpecJournalIndex = new SpecJournalIndexModel
                    {
                        IndexId = $"CrawIndex-{journalSets.Count + 1}",
                        IndexName = year
                    },
                    SpecJournalIndexDetail = []
                };

                journalIndexSets.Add(indexSet);
            }
            if (indexDetail == null)
            {
                indexDetail = new SpecJournalIndexDetail
                {
                    IndexId = indexSet.SpecJournalIndex.IndexId,
                    RowId = indexSet.SpecJournalIndexDetail.Count + 1,
                    Volume = volume,
                    Issue = issue,
                    PublishDate = publishDate,
                    IsSpecial = false,
                    PublishStatus = PublishStatus.Published,
                    SeasonNo = string.Empty
                };
                indexSet.SpecJournalIndexDetail.Add(indexDetail);
            }
            (int pageStart, int pageEnd) = ParsePageNum(model.DetailPage);
            var refFormats = new List<SpecJournalRefFormat>();
            if (!string.IsNullOrWhiteSpace(model.ArticleApa))
                refFormats.Add(new SpecJournalRefFormat { Title = "APA 引文格式", Content = model.ArticleApa });
            if (!string.IsNullOrWhiteSpace(model.ArticleChicago))
                refFormats.Add(new SpecJournalRefFormat { Title = "芝加哥 引文格式", Content = model.ArticleChicago });
            var keywords = new List<SpecJournalKeywords>();
            if (model.DetailKeywordCt != null && model.DetailKeywordCt.Count > 0)
                keywords.AddRange(model.DetailKeywordCt.Where(x => !string.IsNullOrWhiteSpace(x)).Select(kw => new SpecJournalKeywords { Keyword = kw, LangCode = LangCode.zhtw }));
            if (model.DetailKeywordEn != null && model.DetailKeywordEn.Count > 0)
                keywords.AddRange(model.DetailKeywordEn.Where(x => !string.IsNullOrWhiteSpace(x)).Select(kw => new SpecJournalKeywords { Keyword = kw, LangCode = LangCode.en }));
            journalSets.Add(new SpecJournalSet
            {
                SpecJournal = new SpecJournalModel
                {
                    JournalId = $"CrawJournal-{journalSets.Count + 1}",
                    JournalIndexId = indexSet.SpecJournalIndex.IndexId,
                    JournalIndexRowId = indexDetail.RowId,
                    Title = model.TitleCt??"",
                    Title_en = model.TitleEn??"",
                    PageStart = pageStart,
                    PageEnd = pageEnd,
                    DOIUrl = model.AuthorDoiUrl ?? "",
                    ArticleLang = ParseLangCode(model.DetailLanguage),
                    Memo = model.AbstractCt ?? "",
                    Memo_en = model.AbstractEn ?? ""
                },
                SpecJournalAuthor = model.ArticleAuthors?.Select(author => new SpecJournalAuthor { AuthorName = author.AuthorCt??"", AuthorName_en = author.AuthorEn??"", ORCID = author.AuthorOrcid??"" }).ToList(),
                SpecJournalRefFormat = refFormats.Count > 0 ? refFormats : [],
                SpecJournalTypes = !string.IsNullOrWhiteSpace(tagId) ? [new SpecJournalTypes { TagId = tagId }] : [],
                SpecJournalKeywords = keywords.Count > 0 ? keywords : []
            });
        }
        /// <summary>
        /// 解析頁碼範圍：回傳 (PageStart, PageEnd)，解析不到回 (0,0)
        /// </summary>
        private static (int PageStart, int PageEnd) ParsePageNum(string? detailPage)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(detailPage)) return (0, 0);

            var s = detailPage.Trim();

            // 2) 執行 function：抓所有數字（不管前面有沒有「頁」）
            var nums = Regex.Matches(s, @"\d+")
                .Select(m => m.Value)
                .ToList();

            if (nums.Count == 0) return (0, 0);

            if (!int.TryParse(nums[0], out var start)) start = 0;

            var end = start;
            if (nums.Count >= 2)
            {
                if (!int.TryParse(nums[1], out end)) end = 0;
            }

            // 3) return（保底：如果 end 解析失敗，至少等於 start）
            if (start > 0 && end == 0) end = start;
            return (start, end);
        }
        /// <summary>
        /// 解析 detail_language：中文/英文 -> LangCode
        /// </summary>
        private static LangCode ParseLangCode(string? detailLanguage)
        {
            // 1) 宣告變數
            if (string.IsNullOrWhiteSpace(detailLanguage)) return LangCode.zhtw;

            var s = detailLanguage.Trim();

            // 2) 執行 function
            // 支援：語言：中文 / 語言:英文 / Language: English... 等簡單變化
            if (s.Contains("英文", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("English", StringComparison.OrdinalIgnoreCase))
            {
                return LangCode.en;
            }

            if (s.Contains("中文", StringComparison.OrdinalIgnoreCase) ||
                s.Contains("Chinese", StringComparison.OrdinalIgnoreCase))
            {
                return LangCode.zhtw;
            }

            // 3) return
            return LangCode.zhtw;
        }
        #region Joemls Model
        private sealed class ArticleRawModel
        {
            // 1) title_ct
            [JsonPropertyName("title_ct")]
            public string? TitleCt { get; set; }

            // 2) title_en
            [JsonPropertyName("title_en")]
            public string? TitleEn { get; set; }

            // 3) article_author (list)
            [JsonPropertyName("article_author")]
            public List<ArticleAuthorRawModel>? ArticleAuthors { get; set; }

            // 4) author_doi (url)
            [JsonPropertyName("author_doi")]
            public string? AuthorDoiUrl { get; set; }

            // 5) detail_date
            [JsonPropertyName("detail_date")]
            public string? DetailDate { get; set; }

            // 6) detail_vol_no
            [JsonPropertyName("detail_vol_no")]
            public string? DetailVolNo { get; set; }

            // 7) detail_page
            [JsonPropertyName("detail_page")]
            public string? DetailPage { get; set; }

            // 8) detail_language
            [JsonPropertyName("detail_language")]
            public string? DetailLanguage { get; set; }

            // 9) detail_type (list)
            [JsonPropertyName("detail_type")]
            public List<string>? DetailTypes { get; set; }

            // 10) detail_keyword_ct (list)
            [JsonPropertyName("detail_keyword_ct")]
            public List<string>? DetailKeywordCt { get; set; }

            // 11) detail_keyword_en (list)
            [JsonPropertyName("detail_keyword_en")]
            public List<string>? DetailKeywordEn { get; set; }

            // 12) abstract_ct
            [JsonPropertyName("abstract_ct")]
            public string? AbstractCt { get; set; }

            // 13) abstract_en
            [JsonPropertyName("abstract_en")]
            public string? AbstractEn { get; set; }

            // 14) article_apa
            [JsonPropertyName("article_apa")]
            public string? ArticleApa { get; set; }

            // 15) article_chicago
            [JsonPropertyName("article_chicago")]
            public string? ArticleChicago { get; set; }
        }
        private sealed class ArticleAuthorRawModel
        {
            // 3a) author_ct
            [JsonPropertyName("author_ct")]
            public string? AuthorCt { get; set; }

            // 3b) author_en
            [JsonPropertyName("author_en")]
            public string? AuthorEn { get; set; }

            // 3c) author_orcid
            [JsonPropertyName("author_orcid")]
            public string? AuthorOrcid { get; set; }
        }
        #endregion
        #endregion

        #endregion
#endif
    }
}
