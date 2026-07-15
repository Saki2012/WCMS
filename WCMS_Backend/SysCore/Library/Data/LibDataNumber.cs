using System.Text.RegularExpressions;

namespace WCMS.SysCore.Library;

/// <summary>
/// 提供數值字串判斷與基礎數值型別轉換。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 判斷字串是否只包含數字。
    /// </summary>
    public static bool IsNumberString(this string str)
    {
        return Regex.IsMatch(str, "^[0-9]*$");
    }
    /// <summary>
    /// 將資料轉換為 Int16，失敗時回傳零。
    /// </summary>
    public static short ToInt16(this object val)
    {
        try
        {
            return Convert.ToInt16(val);
        }
        catch
        {
            return 0;
        }
    }
    /// <summary>
    /// 將資料轉換為 Int32，失敗時回傳零。
    /// </summary>
    public static int ToInt32(this object val)
    {
        try
        {
            return Convert.ToInt32(val);
        }
        catch
        {
            return 0;
        }
    }
    /// <summary>
    /// 將資料轉換為 Int64，失敗時回傳零。
    /// </summary>
    public static long ToInt64(this object val)
    {
        try
        {
            return Convert.ToInt64(val);
        }
        catch
        {
            return 0;
        }
    }
    /// <summary>
    /// 將資料轉換為 Decimal，空值時回傳零。
    /// </summary>
    public static decimal ToDecimal(this object val)
    {
        if (null == val || DBNull.Value == val) return decimal.Zero;
        return Convert.ToDecimal(val);
    }
    /// <summary>
    /// 將資料轉換為 Double。
    /// </summary>
    public static double ToDouble(this object val)
    {
        return Convert.ToDouble(val);
    }
    /// <summary>
    /// 將資料轉換為 Single。
    /// </summary>
    public static float ToFloat(this object val)
    {
        return Convert.ToSingle(val);
    }
    /// <summary>
    /// 將資料轉換為 Byte。
    /// </summary>
    public static byte ToByte(this object val)
    {
        return Convert.ToByte(val);
    }
    #endregion
}
