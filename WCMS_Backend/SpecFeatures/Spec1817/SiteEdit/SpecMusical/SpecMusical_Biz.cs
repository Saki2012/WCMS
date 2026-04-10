using System.Runtime.InteropServices;
using WCMS.Features.BizResx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.Spec1817.SiteEdit.SpecMusical
{
    [ProgId(PGID.SpecMusical)]
    public class SpecMusical_Biz(BizDeps bizDeps) : BizService<SpecMusicalSet>(bizDeps), IBizService<SpecMusicalSet> 
    {
        #region Virtual Override
        protected override async Task BeforeUpdate(SpecMusicalSet set, FuncAction act, CancellationToken ct = default)
        {
            await base.BeforeUpdate(set, act, ct);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    SetData(set);
                    break;
            }
        }
        #endregion

        #region Protected
        protected void CheckData() { }
        protected void SetData(SpecMusicalSet set) 
        {
            SetCoverPic(set);
            ResetPhotoSort(set.SpecMusicalPictureList);
        }
        #endregion

        #region Private
        /// <summary>
        /// 如果封面圖片不存在，則取第一張圖片為封面
        /// </summary>
        /// <param name="set"></param>
        private void SetCoverPic(SpecMusicalSet set) 
        {
            string picId = set.SpecMusical.CoverPicId;
            if (picId.IsNullOrEmpty() || set.SpecMusicalPictureList.Find(x => x.PicSrcId == picId) == null)
            {
                set.SpecMusical.CoverPicId = set.SpecMusicalPictureList.FirstOrDefault()?.PicSrcId;
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="dt"></param>
        private static void ResetPhotoSort(List<SpecMusicalPictureList> dt)
        {
            if (!LibData.HasData(dt)) return;
            List<SpecMusicalPictureList> sorted = [.. dt.OrderBy(p => p.Sort).ThenByDescending(p => p.RowId)];
            for (int i = 0; i < sorted.Count; i++) sorted[i].Sort = (ushort)(i + 1);
        }
        #endregion
    }
}
