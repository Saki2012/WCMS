using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.WEB.SiteMenuSetting;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.SysCore.FeatureDriver.Model;

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
public SiteMenu_IndexModel? SiteIndex { get; set; }
[LibStr(ApiFieldMode.ReadWrite, SysLengthParam.ID, DisplayName.SiteIndexId, DisplayName.SiteIndexName)]
public string? SiteIndexId { get; set; }
}
