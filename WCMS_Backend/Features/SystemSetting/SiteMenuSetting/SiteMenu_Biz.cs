using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Banner;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SystemSetting.SiteMenuSetting
{
    [ProgId("SiteMenu")]
    public class SiteMenuBiz(IRepositoryMapProvider repo) : BizService<SiteMenuSet>(repo), IBizService<SiteMenuSet>
    {
        #region Property
        protected override bool IsAutoGenerateId { get; set; } = false;
        #endregion

        #region Protected
        protected override void BeforeUpdate(SiteMenuSet set, FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    //SetData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void CheckData(SiteMenuSet set)
        {

        }
        private void SetData(SiteMenuSet set)
        {
            SetItemFullUrl(set);
        }



        private void SetItemFullUrl(SiteMenuSet set)
        {
            foreach (var item in set.SiteMenu_Item)
                if (item.RowState.In(RowState.Insert, RowState.Update))
                    SetFullUrl(item);
        }
        private void SetFullUrl(SiteMenu_Item item)
        {
            string parentFullUrl = GetParentFullUrl(item.SiteIndex, item.ParentRowId);
            item.FullUrl = LibData.Merge('/', false, parentFullUrl, item.ItemSiteUrl);
        }
        private string GetParentFullUrl(string sideIndex, int? parentRowId)
        {
            //this.QueryListAsync([])
            return string.Empty;
        }

        #endregion
    }
}
