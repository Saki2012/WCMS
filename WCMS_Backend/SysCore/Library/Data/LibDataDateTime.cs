namespace WCMS.SysCore.Library;

/// <summary>
/// 提供工作日、月份邊界與民國／西元日期轉換。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 依工作日表取得指定日期前後的營業日。
    /// </summary>
    public static DateTime GetWorkDate(Dictionary<DateTime, bool> workDateDic, DateTime date, int days = 0, bool isNext = true)
    {
        return isNext ?
            workDateDic.Where(p => p.Value == true && p.Key >= date).OrderBy(p => p.Key).ElementAt(Math.Abs(days)).Key :
            workDateDic.Where(p => p.Value == true && p.Key <= date).OrderByDescending(p => p.Key).ElementAt(Math.Abs(days)).Key;
    }
    /// <summary>
    /// 取得日期所在月份的第一天。
    /// </summary>
    public static DateTime GetFirstDate(this DateTime val)
    {
        return val.AddDays(-(val.Day - 1));
    }
    /// <summary>
    /// 取得日期所在月份的最後一天。
    /// </summary>
    public static DateTime GetLastDate(this DateTime val)
    {
        return val.GetFirstDate().AddMonths(1).AddDays(-1);
    }
    /// <summary>
    /// 將日期字串轉換為 DateTime。
    /// </summary>
    public static DateTime ToDateTime(this string val)
    {
        val = val.ToADDateFormat();
        return Convert.ToDateTime(val);
    }
    /// <summary>
    /// 將西元日期轉換為民國年月日字串。
    /// </summary>
    public static string ToROCDate(this DateTime datetime)
    {
        string[] strsDate = datetime.AddYears(-1911).ToString("yyy/MM/dd").Split('/');
        return $"{strsDate[0]}{strsDate[1]}{strsDate[2]}";
    }
    /// <summary>
    /// 將八碼西元日期轉換為 yyyy/MM/dd 格式。
    /// </summary>
    public static string ToADDateFormat(this string val)
    {
        return val.Length == 8 ? $"{val.Substring(0, 4)}/{val.Substring(4, 2)}/{val.Substring(6, 2)}" : val;
    }
    /// <summary>
    /// 將七碼民國日期轉換為西元日期。
    /// </summary>
    public static DateTime ROCDateToCEDate(this string val)
    {
        return val.Length == 7 ? $"{val.Substring(0, 3).ToInt32() + 1911}/{val.Substring(3, 2)}/{val.Substring(5, 2)}".ToDateTime() : DateTime.MinValue;
    }
    #endregion
}
