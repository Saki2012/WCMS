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
[LibDesc(ModelDisplayName.TimelineSet)] public class TimelineSet_DTO : ITSet_DTO
{
    [LibDesc] public Timeline_DTO Timeline { get; set; } = new();
    [LibDesc] public List<TimelineItem_DTO> TimelineItem { get; set; } = [];
    [LibDesc(ModelDisplayName.TimelineLangDetail)] public List<TimelineLangDetail_DTO> TimelineLangDetail { get; set; } = [];
}
/// <summary>
/// 紀事表
/// </summary>
[LibDesc] public class Timeline_DTO : DTOBasicDataModel
{
    /// <summary>
    /// 紀事表ID
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId),StringLength(SysLengthParam.ID)] public string? TimelineId { get; set; }
    /// <summary>
    /// 紀事表名稱
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineName), StringLength(SysLengthParam.Name)] public string? TimelineName { get; set; } = string.Empty;

    #region 主子表關聯
    public List<TimelineItem_DTO>? _TimelineItem { get; set; }
    #endregion
}
/// <summary>
/// 明細
/// </summary>
[LibDesc] public class TimelineItem_DTO
{
    /// <summary>
    /// 代碼
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId), StringLength(SysLengthParam.ID)] public string? TimelineId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }
    /// <summary>
    /// 日期
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Date)] public DateTime? Date { get; set; }

    #region 主子表關聯
    [ForeignKey(nameof(TimelineId))] public Timeline_DTO? _Timeline { get; set; } = null!;
    [InverseProperty(nameof(TimelineLangDetail_DTO._TimelineItem))] public List<TimelineLangDetail_DTO>? _TimelineLangDetail { get; set; }
    #endregion
}
/// <summary>
/// 明細檔案關聯
/// </summary>
[LibDesc]
public class TimelineLangDetail_DTO
{
    /// <summary>
    /// 代碼
    /// </summary>
    [LibDesc(ModelDisplayName.TimelineId), StringLength(SysLengthParam.ID)] public string? TimelineId { get; set; }
    /// <summary>
    /// 父行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_ParentRowId)] public int? ParentRowId { get; set; }
    /// <summary>
    /// 行代碼
    /// </summary>
    [LibDesc(ModelDisplayName.Common_RowId)] public int? RowId { get; set; }

    /// <summary>
    /// 語系
    /// </summary>
    [LibDesc(ModelDisplayName.Common_Lang)] public LangCode? Lang { get; set; }
    /// <summary>
    /// 事件標題
    /// </summary>
    [LibDesc(ModelDisplayName.Timeline_Title), StringLength(SysLengthParam.Title)] public string? Title { get; set; }
    /// <summary>
    /// 事件內容
    /// </summary>
    [LibDesc(ModelDisplayName.Timeline_Content)] public string? Content { get; set; }

    #region 主子表關聯
    [ForeignKey($@"{nameof(TimelineId)},{nameof(ParentRowId)}")] public TimelineItem_DTO? _TimelineItem { get; set; }
    #endregion
}
