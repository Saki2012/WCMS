using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
namespace WCMS.SysCore.FeatureDriver.Model.Base;

/// <summary>
/// 網站資料
/// </summary>
public abstract class WEBModel : HeaderModel
{
    /// <summary>
    /// 網站代號
    /// </summary>
    [ForeignKey(nameof(SiteIndexId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public SiteMenu_Index? SiteIndex { get; set; }
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.ID, DisplayName.SiteIndexId, DisplayName.SiteIndexName)]
    public string? SiteIndexId { get; set; }
}
