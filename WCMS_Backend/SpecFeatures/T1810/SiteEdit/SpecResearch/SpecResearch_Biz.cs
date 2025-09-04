using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    public class SpecResearchBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<SpecResearchSet>(repo, message), IBizService<SpecResearchSet> {

        #region Protected
        protected override void BeforeUpdate(SpecResearchSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.SpecResearch);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(SpecResearchModel header)
        {
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion
    }
}
