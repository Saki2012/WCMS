using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.SiteEdit.Category;
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
        [LibDesc, Key] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc] public string ProgId { get; set; } = string.Empty;
        /// <summary>
        /// 類別明細
        /// </summary>
        [ForeignKey(nameof(TagId)),LibDesc] public virtual ICollection<TagDetail>? TagDetail { get; set; }
    }
    public class TagDetail : DetailRowModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc, Key] public string TagId { get; set; } = string.Empty;
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; } = string.Empty;
        /// <summary>
        /// 標籤名稱
        /// </summary>
        [LibDesc] public string TagName { get; set; } = string.Empty;
    }
}
