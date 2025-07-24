using WCMS.SysCore.Interface;
using WCMS.SysCore;
using System.Runtime.InteropServices;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.FileArchive
{
    [ProgId("FileArchive")]
    public class FileArchiveBiz(IRepositoryMapProvider repoMapProvider) : BizService<FileArchiveSet>(repoMapProvider), IBizService<FileArchiveSet> {

        #region Protected
        protected override void BeforeUpdate(FileArchiveSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.FileArchive);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(FileArchive header)
        {
            header.CategoriesId = header.CategoriesId.Remerge(",");
            header.Status = header.Status.Remerge(",");
            header.TagsId = header.TagsId.Remerge(",");
        }
        #endregion
    }
}
