using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SystemSetting.SiteInfo.SiteMenuSetting;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    public class SpecCategorySet:ITSet
    {
        public SpecCategoryModel SpecCategory { get; set; } = new();
        public List<SpecCategoryDetailModel> SpecCategoryDetail { get; set; } = [];
    }

    public class SpecCategoryModel : MasterDataModel
    {
        [Key, StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; }
        /// <summary>
        /// 顯示欄位
        /// </summary>
        public string ShowColumnItems { get; set; }

        #region 主子表關聯
        [InverseProperty(nameof(SpecCategoryDetailModel._SpecCategory))] public List<SpecCategoryDetailModel> _SpecCategoryDetail { get; set; }
        #endregion
    }

    public class SpecCategoryDetailModel : DetailRowModel
    {            
        /// <summary>
        /// 
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string CategoryId { get;set; }
        [Key] public int RowId { get; set; }
        [StringLength(SysLengthParam.Lang)] public LangCode Lang { get; set; }
        [StringLength(SysLengthParam.Name)] public string CategoryName { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(CategoryId))] public SpecCategoryModel _SpecCategory { get; set; }
        #endregion
    }

}
