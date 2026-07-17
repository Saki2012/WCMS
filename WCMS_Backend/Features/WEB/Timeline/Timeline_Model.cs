using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;
namespace WCMS.Features.WEB.Timeline;

/// <summary>
/// 紀事表
/// </summary>
public class Timeline : HeaderModel
{
    /// <summary>
    /// 紀事表ID
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.TimelineId)]
    public string TimelineId { get; set; } = string.Empty;
    /// <summary>
    /// 紀事表名稱
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Name, DisplayName.TimelineName)]
    public string TimelineName { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(TimelineItem._Timeline))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<TimelineItem> _TimelineItem { get; set; } = [];
    #endregion
}
/// <summary>
/// 紀事發生日
/// </summary>
public class TimelineItem : FormDetailModel
{
    /// <summary>
    /// 紀事代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.TimelineId)]
    public string TimelineId { get; set; } = string.Empty;
    /// <summary>
    /// 日期
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Date)]
    public DateTime Date { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(TimelineId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Timeline _Timeline { get; set; } = null!;
    [InverseProperty(nameof(TimelineLangDetail._TimelineItem))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<TimelineLangDetail> _TimelineLangDetail { get; set; } = [];
    #endregion
}
/// <summary>
/// 紀事說明
/// </summary>
public class TimelineLangDetail : FormDetailModel
{
    /// <summary>
    /// 紀事代碼
    /// </summary>
    [Key]
    [LibStr(ApiFieldMode.ReadOnly, DbStrLen.ID, DisplayName.TimelineId)]
    public string TimelineId { get; set; } = string.Empty;
    /// <summary>
    /// 父行代碼
    /// </summary>
    [Key]
    [LibField(ApiFieldMode.ReadOnly, DisplayName.Common_ParentRowId)]
    public int ParentRowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Common_Lang)]
    public LangCode Lang { get; set; }
    /// <summary>
    /// 事件標題
    /// </summary>
    [LibStr(ApiFieldMode.ReadWrite, DbStrLen.Title, DisplayName.Timeline_Title)]
    public string Title { get; set; } = string.Empty;
    /// <summary>
    /// 事件內容
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite, DisplayName.Timeline_Content)]
    public string Content { get; set; } = string.Empty;

    #region 主子表關聯
    [ForeignKey($@"{nameof(TimelineId)},{nameof(ParentRowId)}")]
    [LibField(ApiFieldMode.ReadOnly)]
    public TimelineItem _TimelineItem { get; set; }
    #endregion
}
