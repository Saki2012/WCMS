using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.SpecCategory
{
    [ProgId("SpecCategory")]
    public class SpecCategoryBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<SpecCategorySet>(repo, message), IBizService<SpecCategorySet> 
    {
        #region Protected
        protected override void BeforeUpdate(SpecCategorySet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.SpecCategory);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(SpecCategoryModel header)
        {
            header.ShowColumnItems = header.ShowColumnItems.Remerge(",");
        }
        #endregion
    }
}
