using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SiteEdit.Category;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Tag
{
    public class TagSet:ITSet
    {
        public TagData TagData { get; set; } = new TagData();
        public List<TagDetail> TagDetail { get; set; } = [];
    }
    public class TagData : MasterDataModel
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [StringLength(SysLengthParam.ProgId)] public string ProgId { get; set; } = string.Empty;

        #region 主子表關聯
        [InverseProperty(nameof(TagDetail._TagData))] public List<TagDetail>? _TagDetail { get; set; }
        #endregion
    }
    public class TagDetail : DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [Key, StringLength(SysLengthParam.ID)] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 行主鍵
        /// </summary>
        [Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [StringLength(SysLengthParam.Lang)] public string Lang { get; set; } = string.Empty;
        /// <summary>
        /// 標籤名稱
        /// </summary>
        [StringLength(SysLengthParam.Title)] public string TagName { get; set; } = string.Empty;

        #region 主子表關聯
        [ForeignKey(nameof(TagId))] public TagData _TagData { get; set; }
        #endregion
    }
}
