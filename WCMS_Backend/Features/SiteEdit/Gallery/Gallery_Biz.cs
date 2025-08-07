using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.Gallery;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ProgId("Gallery")]
    public class GalleryBiz(IRepositoryMapProvider repoMapProvider) : BizService<GallerySet>(repoMapProvider), IBizService<GallerySet> {


        #region Protected
        protected override void BeforeUpdate(GallerySet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.Gallery);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(Gallery header)
        {
            header.Categories = header.Categories.Remerge(",");
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion

    }
}
