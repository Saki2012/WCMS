using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.Features.IAM.Account;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Validation;
namespace WCMS.Features.COMM.Calendar;

public class Calendar : HeaderModel
{
    /// <summary>
    /// 行事曆年度。
    /// </summary>
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [LibField(ApiFieldMode.ReadOnly)]
    public int Year { get; set; }
    /// <summary>
    /// 匯入來源。
    /// </summary>
    [StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string ImportSrc { get; set; } = string.Empty;
    /// <summary>
    /// 最後匯入時間。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DateTime LastImportTime { get; set; }

    #region 主子表關聯
    /// <summary>
    /// 年度內的每日行事曆資料。
    /// </summary>
    [InverseProperty(nameof(CalendarDetail._Calendar))]
    [LibField(ApiFieldMode.ReadWrite)]
    public List<CalendarDetail> _CalendarDetail { get; set; } = [];
    #endregion
}

public partial class CalendarDetail : DetailModel
{
    /// <summary>
    /// 行事曆年度。
    /// </summary>
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [LibField(ApiFieldMode.ReadOnly)]
    public int Year { get; set; }
    /// <summary>
    /// 行事曆日期。
    /// </summary>
    [Key, DatabaseGenerated(DatabaseGeneratedOption.None)]
    [LibField(ApiFieldMode.ReadOnly)]
    public DateOnly Date { get; set; }
    /// <summary>
    /// 星期。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public DayOfWeek DayOfWeek { get; set; }
    /// <summary>
    /// 是否為假日。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public bool IsHoliday { get; set; }
    /// <summary>
    /// 假日名稱。
    /// </summary>
    [StringLength(DbStrLen.Title)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string HolidayName { get; set; } = string.Empty;
    /// <summary>
    /// 日期說明。
    /// </summary>
    [StringLength(DbStrLen.Title)]
    [LibField(ApiFieldMode.ReadWrite)]
    public string Description { get; set; } = string.Empty;
    /// <summary>
    /// 是否已人工編輯。
    /// </summary>
    [LibField(ApiFieldMode.ReadWrite)]
    public bool IsEdit { get; set; }
    /// <summary>
    /// 修改時間。
    /// </summary>
    [LibField(ApiFieldMode.ReadOnly)]
    public DateTime ModifyTime { get; set; }
    /// <summary>
    /// 修改人。
    /// </summary>
    [ForeignKey(nameof(ModifyUserId))]
    [LibField(ApiFieldMode.ReadOnly)]
    public Account? ModifyUser { get; set; }
    /// <summary>
    /// 修改人 ID。
    /// </summary>
    [StringLength(DbStrLen.ID)]
    [LibField(ApiFieldMode.ReadOnly)]
    public string? ModifyUserId { get; set; }

    #region 主子表關聯
    /// <summary>
    /// 所屬年度行事曆。
    /// </summary>
    [ForeignKey(nameof(Year))]
    [LibField(ApiFieldMode.Ignore)]
    public Calendar? _Calendar { get; set; }
    #endregion
}
