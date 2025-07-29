using System.ComponentModel.DataAnnotations;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    public class SpecCategorySet
    {
        public SpecCategoryModel SpecCategory { get; set; } = new();
        public List<SpecCategoryDetailModel> SpecCategoryDetail { get; set; } = [];
    }

    public class SpecCategoryModel : MasterDataModel
    {
        [LibDesc, Key] public string CategoryId { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get; set; }
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
        [LibDesc, Key] public string CategoryId { get;set; }
        [LibDesc, Key] public int RowId { get; set; }
        [LibDesc] public string Lang { get; set; }
        [LibDesc]public string CategoryName { get; set; }
    }

}
