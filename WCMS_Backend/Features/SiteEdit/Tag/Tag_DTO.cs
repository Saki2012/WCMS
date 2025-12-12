using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Tag
{
    public class TagSet_DTO : ITSet_DTO
    {
        public TagData_DTO TagData { get; set; } = new();
        public List<TagDetail_DTO> TagDetail { get; set; } = [];
    }
    public class TagData_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.TagId)] public string? TagId { get; set; } = string.Empty;
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ProgId)] public string? ProgId { get; set; } = string.Empty;

        #region 主子表關聯
        public List<TagDetail_DTO>? _TagDetail { get; set; }
        #endregion
    }
    public class TagDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc(ModelDisplayName.TagId)] public string? TagId { get; set; } = string.Empty;
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc(ModelDisplayName.Common_RowId)] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
        /// <summary>
        /// 標籤名稱
        /// </summary>
        [LibDesc(ModelDisplayName.Tag_TagName)] public string? TagName { get; set; } = string.Empty;
    }
}
