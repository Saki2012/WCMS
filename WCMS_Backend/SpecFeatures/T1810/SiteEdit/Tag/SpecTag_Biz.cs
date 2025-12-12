using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Tag;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR;
using WCMS.SysCore;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.Tag
{
    [ProgId("Tag")]
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
                    useCount = await DoQueryListCountAsync<SpecUSRModel>([nameof(BasicDataModel.InternalId)], $@"{nameof(SpecUSRModel.Tags)} HasAny {tagId}");
                    break;
                case "SpecResearch":
                    useCount = await DoQueryListCountAsync<SpecResearchModel>([nameof(BasicDataModel.InternalId)], $@"{nameof(SpecResearchModel.Tags)} HasAny {tagId}");
                    break;
            }
            if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00017, tagName);
        }
        #endregion
    }
}
