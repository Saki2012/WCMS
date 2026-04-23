using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features._Resx;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.Features.WEB.Timeline;

/// <summary>
/// 紀事表單
/// </summary>
public class TimelineSet:ITSet
{
    public Timeline Timeline { get; set; } = new Timeline();
    public List<TimelineItem> TimelineItem { get; set; } = [];
    public List<TimelineLangDetail> TimelineLangDetail { get; set; } = [];
}
/// <summary>
/// 紀事表
/// </summary>
public class Timeline: MasterDataModel
{
    /// <summary>
    /// 紀事表ID
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId), Key, StringLength(SysLengthParam.ID)] public string TimelineId { get; set; }
    /// <summary>
    /// 紀事表名稱
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineName), StringLength(SysLengthParam.Name)] public string TimelineName { get; set; } = string.Empty;

    #region 主子表關聯
    [InverseProperty(nameof(TimelineItem._Timeline))] public List<TimelineItem> _TimelineItem { get; set; }
    #endregion
}
/// <summary>
/// 紀事發生日
/// </summary>
public class TimelineItem : DetailRowModel
{
    /// <summary>
    /// 紀事代碼
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId), Key, StringLength(SysLengthParam.ID)] public string TimelineId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 日期
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Date)] public DateTime Date { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(TimelineId))] public Timeline _Timeline { get; set; } = null!;
    [InverseProperty(nameof(TimelineLangDetail._TimelineItem))] public List<TimelineLangDetail> _TimelineLangDetail { get; set; }
    #endregion
}
/// <summary>
/// 紀事說明
/// </summary>
public class TimelineLangDetail : DetailRowModel
{
    /// <summary>
    /// 紀事代碼
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId), Key, StringLength(SysLengthParam.ID)] public string TimelineId { get; set; }
    /// <summary>
    /// 父行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId), Key] public int ParentRowId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode Lang { get; set; }
    /// <summary>
    /// 事件標題
    /// </summary>
    [LibDesc(ModelDisplayName.Timeline_Title),StringLength(SysLengthParam.Title)] public string Title { get; set; }
    /// <summary>
    /// 事件內容
    /// </summary>
    [LibDesc(ModelDisplayName.Timeline_Content)] public string Content { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(TimelineId)},{nameof(ParentRowId)}")] public TimelineItem _TimelineItem { get; set; }
    #endregion
}
