using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Announcement;

/// <summary>
/// 公告資料維護與內容驗證。
/// </summary>
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Announcement)]
public class AnnouncementBiz(BizDeps bizDeps) : BizService<Announcement>(bizDeps), IBizService<Announcement>
{
    #region Protected Virtual
    /// <summary>
    /// 保存前驗證並整理公告資料。
    /// </summary>
    protected override async Task BeforeUpdate(Announcement data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is not FuncAction.Create and not FuncAction.Update) return;
        CheckData(data);
        RemergeData(data);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 驗證公告日期、類別與 AA 內容。
    /// </summary>
    protected void CheckData(Announcement data)
    {
        CheckAAContent(data._AnnouncementDetail);
        CheckRequiredData(data);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查公告多語標題與內容 AA 規則。
    /// </summary>
    private void CheckAAContent(IEnumerable<AnnouncementDetail> details)
    {
        if (!SpecSettings.AACheck) return;
        foreach (AnnouncementDetail detail in details)
        {
            if (detail.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00003, detail.Lang.ToLabel(), I18n.GetLabel<AnnouncementDetail>(item => item.Title));
            if (LibAAData.CheckAAContent(detail.Content, Message, I18n, out string content)) detail.Content = content;
        }
    }
    /// <summary>
    /// 檢查公告日期與類別必填規則。
    /// </summary>
    private void CheckRequiredData(Announcement data)
    {
        if (data.Validate_Start == default) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Announcement>(item => item.Validate_Start));
        if (data.Validate_End != default && data.Validate_Start >= data.Validate_End) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, I18n.GetLabel<Announcement>(item => item.Validate_End), I18n.GetLabel<Announcement>(item => item.Validate_Start));
        if (data.Categories.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Announcement>(item => item.Categories));
    }
    /// <summary>
    /// 正規化公告類別與標籤字串。
    /// </summary>
    private static void RemergeData(Announcement data)
    {
        data.Categories = data.Categories.Remerge(",");
        data.Tags = data.Tags.Remerge(",");
    }
    #endregion
}
