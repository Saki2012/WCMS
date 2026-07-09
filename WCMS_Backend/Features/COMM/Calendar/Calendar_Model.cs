using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.Enum;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Library.LibAttribute;
namespace WCMS.Features.COMM.Calendar;

public class CalendarModel : HeaderModel
{
    /// <summary>
    /// 
    /// </summary>
[Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
[LibField(ApiFieldMode.ReadOnly)]
public int Year { get; set; }
    /// <summary>
    /// 匯入來源
    /// </summary>
[StringLength(SysLengthParam.ID)]
[LibField(ApiFieldMode.ReadWrite)]
public string ImportSrc { get; set; } = string.Empty;
    /// <summary>
    /// // 最後匯入時間
    /// </summary>
[LibField(ApiFieldMode.ReadWrite)]
public DateTime LastImportTime { get; set; }

    #region 主子表關聯
[InverseProperty(nameof(CalendarDetail._Calendar))]
[LibField(ApiFieldMode.ReadWrite)]
public List<CalendarDetail> _CalendarDetail { get; set; } = [];
    #endregion
}

public partial class CalendarDetail : DetailModel
{
[Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
[LibField(ApiFieldMode.ReadOnly)]
public int Year { get; set; }
[Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
[LibField(ApiFieldMode.ReadOnly)]
public DateOnly Date { get; set; }
[LibField(ApiFieldMode.ReadWrite)]
public DayOfWeek DayOfWeek { get; set; }
[LibField(ApiFieldMode.ReadWrite)]
public bool IsHoliday { get; set; }
[StringLength(SysLengthParam.Title)]
[LibField(ApiFieldMode.ReadWrite)]
public string HolidayName { get; set; } = string.Empty;
[StringLength(SysLengthParam.Title)]
[LibField(ApiFieldMode.ReadWrite)]
public string Description { get; set; } = string.Empty;
[LibField(ApiFieldMode.ReadWrite)]
public bool IsEdit { get; set; }
    /// <summary>
    /// 修改時間
    /// </summary>
[LibField(ApiFieldMode.ReadOnly)]
public DateTime ModifyTime { get; set; }
    /// <summary>
    /// 修改人ID
    /// </summary>
[ForeignKey(nameof(ModifyUserId))]
[LibField(ApiFieldMode.ReadOnly)]
public AccountModel? ModifyUser { get; set; }
[StringLength(SysLengthParam.ID)]
[LibField(ApiFieldMode.ReadOnly)]
public string? ModifyUserId { get; set; }

    #region 主子表關聯
[ForeignKey(nameof(Year))]
[LibField(ApiFieldMode.ReadOnly)]
public CalendarModel _Calendar { get; set; }
    #endregion
}
