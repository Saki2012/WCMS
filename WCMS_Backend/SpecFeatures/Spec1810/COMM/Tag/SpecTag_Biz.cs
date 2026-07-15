using WCMS.Features.COMM.Tag;
using WCMS.Features._Resx;
using WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;
using WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
namespace WCMS.SpecFeatures.Spec1810.COMM.Tag;

[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Tag)]
public class SpecTag_Biz(BizDeps bizDeps) : TagBiz(bizDeps)
{
    #region Protected
    protected override async Task SpecCheckIsUsed(string progId, string tagId, string tagName)
    {
        await base.SpecCheckIsUsed(progId, tagId, tagName);
        await CheckIsUsedAsync(progId, tagId, tagName);
    }
    #endregion

    #region Private
    private async Task CheckIsUsedAsync(string progId, string tagId, string tagName)
    {
        int useCount = 0;
        switch (progId)
        {
            case "SpecUSR":
                useCount = await DoQueryListCountAsync<SpecUSRModel>($@"{nameof(SpecUSRModel.Tags)} HasAny {tagId}");
                break;
            case "SpecResearch":
                useCount = await DoQueryListCountAsync<SpecResearchModel>($@"{nameof(SpecResearchModel.Tags)} HasAny {tagId}");
                break;
        }
        if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00017, tagName);
    }
    #endregion
}
