using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.Content;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Metadata;
using WCMS.SysCore.PlatformServices.FileManagement;
namespace WCMS.Features.WEB.WebResource;

/// <summary>
/// 網路資源
/// </summary>
[LibDesc(DisplayName.WebResource)]
public class WebResource : HeaderModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.WebResourceId)]
    public string WebResourceId { get; set; } = string.Empty;
    /// <summary>
    /// 類別ID(多個)
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Category)]
    public string Categories { get; set; } = string.Empty;
    /// <summary>
    /// 標籤ID(多個)
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Common_Tag)]
    public string Tags { get; set; } = string.Empty;
    /// <summary>
    /// 狀態:置頂/熱門/隱藏
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_ContentStatus)]
    public ContentStatus ContentStatus { get; set; }
    /// <summary>
    /// 圖片顯示
    /// </summary>
    [ForeignKey(nameof(PicId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public FileManage? Pic { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.InternalId, DisplayName.WebResource_PicId)]
    public string? PicId { get; set; }
    /// <summary>
    /// 圖片顯示描述
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Memo, DisplayName.WebResource_PicDescription)]
    public string PicDescription { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(WebResourceInfo._WebResource))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<WebResourceInfo> _WebResourceInfo { get; set; } = [];
    #endregion
}
/// <summary>
/// 網路資源資訊
/// </summary>
[LibDesc(DisplayName.WebResourceInfo)]
public class WebResourceInfo : FormDetailModel
{
    /// <summary>
    /// 檔案分類ID
    /// </summary>
    [Required, Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.WebResourceId)]
    public string WebResourceId { get; set; } = string.Empty;
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
    /// <summary>
    /// 超連結
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Url, DisplayName.Common_Url)]
    public string ResUrl { get; set; } = string.Empty;
    /// <summary>
    /// 超連結開啟方式。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_UrlOpen)]
    public WindowTarget Url_OpenType { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(WebResourceId))]
    [LibField(ApiFieldMode.Ignore)]
    public WebResource _WebResource { get; set; }
    #endregion
}
