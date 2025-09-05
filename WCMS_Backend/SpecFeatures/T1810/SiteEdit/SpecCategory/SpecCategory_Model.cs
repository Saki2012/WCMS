using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Enum;
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
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string CategoryId { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        [StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; }
        /// <summary>
        /// 顯示欄位
        /// </summary>
        public string ShowColumnItems { get; set; }
    }

    public class SpecCategoryDetailModel : DetailRowModel
    {            
        /// <summary>
        /// 
        /// </summary>
        [LibDesc, Key, StringLength(SysLengthParam.ID)] public string CategoryId { get;set; }
        [LibDesc, Key] public int RowId { get; set; }
        [LibDesc, StringLength(SysLengthParam.Lang)] public string Lang { get; set; }
        [StringLength(SysLengthParam.Name)] public string CategoryName { get; set; }
    }

}
