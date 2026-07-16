using WCMS.Features._Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecResearch)]
public class SpecResearchBiz(BizDeps bizDeps) : BizService<SpecResearch>(bizDeps), IBizService<SpecResearch>
{
    #region Protected
    protected override async Task BeforeUpdate(SpecResearch set, FuncAction act, CancellationToken ct = default)
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

    #region Private
    private void CheckData(SpecResearch set)
    {
        CheckIsEmpty(set);
    }
    private void SetData(SpecResearch set)
    {
        DoRemergeData(set.SpecResearch);
    }


    private void CheckIsEmpty(SpecResearch set)
    {
        if (set.SpecResearch.CategoryId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecResearch>(x => x.CategoryId));
    }
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(SpecResearch header)
    {
        header.Tags = header.Tags.Remerge(",");
    }
    #endregion
}
