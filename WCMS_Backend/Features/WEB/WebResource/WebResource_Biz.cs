using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.WebResource;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.WebResource)]
public class WebResourceBiz(BizDeps bizDeps) : BizService<WebResource>(bizDeps)
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(WebResource set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                SetData(set);
                break;
        }
    }
    #endregion

    #region Protected
    protected void CheckData(WebResource set)
    {
        CheckIsEmpty(set);
    }
    protected void CheckIsEmpty(WebResource set)
    {
        if (set._WebResourceInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang) == null || set._WebResourceInfo.FirstOrDefault(p => p.Lang == SiteDefaultLang).Title.IsNullOrEmpty())
            Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18n.GetLabel<WebResourceInfo>(x => x.Title));
    }
    #endregion  

    #region Private

    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(WebResource header)
    {
        header.Categories = header.Categories.Remerge(",");
        header.Tags = header.Tags.Remerge(",");
    }
    private static void SetData(WebResource set)
    {
        DoRemergeData(set);
        foreach (var dt in set._WebResourceInfo)
        {
            SetYoutubeUrl(dt);
        }
    }
    /// <summary>
    /// 自動轉譯Youtube短網址
    /// </summary>
    /// <param name="set"></param>
    private static void SetYoutubeUrl(WebResourceInfo dt)
    {
        dt.ResUrl = YouTubeUrlHelper.NormalizeToShortUrlOrOriginal(dt.ResUrl);
    }
    #endregion
}
