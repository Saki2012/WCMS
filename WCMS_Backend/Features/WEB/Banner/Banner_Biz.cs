using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Banner;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Banner)]
public class BannerBiz(BizDeps bizDeps) : BizService<Banner>(bizDeps)
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(Banner set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                if (Message.HasError) return;
                SetData(set);
                break;
        }

    }
    #endregion

    #region Protected
    protected void CheckData(Banner set)
    {
        AACheck(set._BannerDetail.SelectMany(detail => detail._BannerDetailInfo).ToList());
    }
    protected static void SetData(Banner set)
    {
        ResetBannerSort(set._BannerDetail);
    }
    #endregion

    #region Private

    /// <summary>
    /// 檢查AAContent，將舊資料的AAContent轉成新的格式
    /// </summary>
    /// <param name="langDt"></param>
    private void AACheck(List<BannerDetailInfo> infos)
    {
        if (!SpecSettings.AACheck) return;
        infos.ForEach(dt =>
        {
            if (dt.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00004, I18n.GetLabel<BannerDetail>(), dt.ParentRowId, dt.Lang.ToLabel(), I18n.GetLabel<BannerDetailInfo>(x => x.Title));
        });
    }

    private static void ResetBannerSort(List<BannerDetail> dt)
    {
        if (!dt.HasData()) return;
        List<BannerDetail> sorted = [.. dt.OrderBy(p => p.Sort).ThenByDescending(p => p.RowId)];
        for (int i = 0; i < sorted.Count; i++) sorted[i].Sort = (ushort)(i + 1);
    }
    #endregion

}
