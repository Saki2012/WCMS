using Microsoft.EntityFrameworkCore;
using Microsoft.VisualBasic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Model;

namespace WCMS.Features.SystemSetting.Calendar
{

    public class CalendarSet : ITSet
    {
        public CalendarModel Calendar { get; set; } = new();
        public List<CalendarDetail> CalendarDetail { get; set; } = [];
    }

    public class CalendarModel : MasterDataModel
    {
        /// <summary>
        /// 
        /// </summary>
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)] public int Year { get; set; }
        /// <summary>
        /// 匯入來源
        /// </summary>
        [StringLength(SysLengthParam.ID)] public string ImportSrc { get; set; }
        /// <summary>
        /// // 最後匯入時間
        /// </summary>
        public DateTime LastImportTime { get; set; }
        #region 主子表關聯
        [InverseProperty(nameof(CalendarDetail._Calendar))] public List<CalendarDetail> _CalendarDetail { get; set; }
        #endregion
    }

    public partial class CalendarDetail : DetailRowModel
    {
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)] public int Year { get; set; }
        [Key, DatabaseGenerated(DatabaseGeneratedOption.None)] public DateOnly Date { get; set; }
        public DayOfWeek DayOfWeek { get; set; }
        public bool IsHoliday { get; set; }
        [StringLength(SysLengthParam.Title)] public string HolidayName { get; set; }
        [StringLength(SysLengthParam.Title)] public string Description { get; set; }
        public bool IsEdit { get; set; }

        #region 主子表關聯
        [ForeignKey(nameof(Year))] public CalendarModel _Calendar { get; set; }
        #endregion
    }
}
