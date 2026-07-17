using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Text.Json.Serialization;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features.COMM.Tag;

[LibDesc(DisplayName.Tag_Data)]
public class TagData : HeaderModel
{
    /// <summary>
    /// 標籤ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.TagId)]
    public string TagId { get; set; } = string.Empty;
    /// <summary>
    /// 對應功能模塊ID
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.Common_ProgId)]
    public string ProgId { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(TagDetail._TagData))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<TagDetail> _TagDetail { get; set; } = [];
    #endregion
}
public class TagDetail : FormDetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.TagId)]
    public string TagId { get; set; } = string.Empty;
    /// <summary>
    /// 語系 LangCode
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標籤名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Tag_TagName)]
    public string TagName { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(TagId)), JsonIgnore]
    [LibField(ApiFieldMode.Ignore)]
    public TagData _TagData { get; set; }
    #endregion
}
