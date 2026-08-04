using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
namespace WCMS.Features.WEB.PageManagement;

[LibDesc(DisplayName.PageManagement)]
public class PageManagement : WEBModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.PageId)]
    public string PageId { get; set; } = string.Empty;
    /// <summary>
    /// 所屬功能模塊
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ProgId, DisplayName.Common_ProgId)]
    public string ProgId { get; set; } = ProgKeys.WEB.PageManagement;
    /// <summary>
    /// 類別ID
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.Common_Category)]
    public string CategoryId { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(PageManagementDetail._PageManagement))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<PageManagementDetail> _PageManagementDetail { get; set; } = [];
    #endregion
}
[LibDesc(DisplayName.PageManagementDetail)]
public class PageManagementDetail : FormDetailModel
{
    /// <summary>
    /// 靜態客製頁面ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.PageId)]
    public string PageId { get; set; } = string.Empty;
    /// <summary>
    /// 語系 LangCode
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 內容
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Content)]
    public string Content { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey(nameof(PageId))]
    [LibField(ApiFieldMode.Ignore)]
    public PageManagement _PageManagement { get; set; }
    #endregion
}
