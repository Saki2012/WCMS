using System.Text;
using System.Text.RegularExpressions;

namespace WCMS.SysCore.Library;

/// <summary>
/// 提供字串格式、合併、編碼長度與隨機字串處理。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 將參數轉為可引用字串後套用格式化內容。
    /// </summary>
    public static string Format(string str, params object[] vals)
    {
        int len = vals.Length;
        string[] qVals = new string[len];
        for (int i = 0; i < len; i++)
        {
            qVals[i] = vals[i].Quote();
        }
        return string.Format(str, qVals);
    }
    /// <summary>
    /// 將字串值包覆單引號，其餘型別轉為文字。
    /// </summary>
    public static string Quote(this object val)
    {
        string result = val.GetType() switch
        {
            Type stringType when stringType == typeof(string) => $"'{val}'",
            null => "Is Null",
            _ => val.ToString(),
        };
        return result;
    }
    /// <summary>
    /// 重新排序並組合分隔字串資料。
    /// </summary>
    public static string Remerge(this string val, string mergeStr, bool hasEmpty = false, bool isDesc = false, bool isRemoveDuplicates = false, RemergeSortMode sortMode = RemergeSortMode.Auto)
    {
        if (string.IsNullOrWhiteSpace(val)) return string.Empty;
        var data = val.Split(mergeStr, StringSplitOptions.None).Where(p => hasEmpty || !string.IsNullOrWhiteSpace(p)).ToList();
        if (isRemoveDuplicates) data = [.. data.Distinct()];
        RemergeSortMode finalMode = sortMode == RemergeSortMode.Auto ? DetectSortMode(data) : sortMode;
        switch (finalMode)
        {
            case RemergeSortMode.Number:
                data = [.. data.OrderBy(p => int.TryParse(p, out var num) ? num : int.MaxValue)];
                break;
            case RemergeSortMode.Natural:
                data = [.. data.OrderBy(p => Regex.Replace(p, @"\d+", match => match.Value.PadLeft(10, '0')))];
                break;
            case RemergeSortMode.String:
                data = [.. data.OrderBy(p => p)];
                break;
            case RemergeSortMode.None:
            default: break;
        }
        if (isDesc) data.Reverse();
        return Merge(mergeStr, hasEmpty, data.ToArray());
    }
    /// <summary>
    /// 以指定字元合併資料。
    /// </summary>
    public static string Merge(char mergeStr, bool hasEmpty, params object[] strs)
    {
        return Merge(mergeStr.ToString(), hasEmpty, strs);
    }
    /// <summary>
    /// 以指定字串合併資料。
    /// </summary>
    public static string Merge(string mergeStr, bool hasEmpty, params object[] strs)
    {
        if (strs == null || strs.Length == 0) return string.Empty;
        var parts = new List<string>();
        foreach (var item in strs)
        {
            var str = item?.ToString() ?? string.Empty;
            if (hasEmpty || !string.IsNullOrEmpty(str)) parts.Add(str);
        }
        return string.Join(mergeStr, parts);
    }
    /// <summary>
    /// 依 Big5 編碼截取指定位元組範圍的字串。
    /// </summary>
    public static string ByteSubString(this string str, int idx, int len)
    {
        return str.ByteSubString(idx, len, Encoding.GetEncoding(950));
    }
    /// <summary>
    /// 依指定編碼截取指定位元組範圍的字串。
    /// </summary>
    public static string ByteSubString(this string str, int idx, int len, Encoding encoding)
    {
        byte[] arr = encoding.GetBytes(str);
        return encoding.GetString(arr, idx, len);
    }
    /// <summary>
    /// 取得字串的 Big5 編碼位元組長度。
    /// </summary>
    public static int ByteLen(this string str)
    {
        return str.ByteLen(Encoding.GetEncoding(950));
    }
    /// <summary>
    /// 取得字串的指定編碼位元組長度。
    /// </summary>
    public static int ByteLen(this string str, Encoding encoding)
    {
        return encoding.GetBytes(str).Length;
    }
    /// <summary>
    /// 將文字轉換為駝峰式命名。
    /// </summary>
    public static string ToCamelCase(this string s)
    {
        var x = s.Replace("_", "");
        if (x.Length == 0) return s;
        x = Regex.Replace(x, "([A-Z])([A-Z]+)($|[A-Z])",
            m => m.Groups[1].Value + m.Groups[2].Value.ToLower() + m.Groups[3].Value);
        return char.ToLower(x[0]) + x.Substring(1);
    }
    /// <summary>
    /// 將物件轉換為字串。
    /// </summary>
    public static string ToString(this object val)
    {
        return Convert.ToString(val);
    }
    /// <summary>
    /// 產生指定長度的英數隨機字串。
    /// </summary>
    public static string GenRandomString(int len)
    {
        Random rd = new Random(Convert.ToInt32(DateTime.Now.Ticks % int.MaxValue));
        return GenRandomString(rd, len);
    }
    /// <summary>
    /// 使用指定亂數來源產生英數隨機字串。
    /// </summary>
    public static string GenRandomString(Random rd, int len)
    {
        string result = string.Empty;
        for (int i = 0; i < len; i++)
        {
            char c = ' ';
            while (c == ' ')
            {
                int num = rd.Next(48, 122);
                if (num >= 48 && num <= 57 || num >= 65 && num <= 90 || num >= 97 && num <= 122)
                {
                    c = (char)num;
                }
            }
            result += c.ToString();
        }
        return result;
    }
    #endregion

    #region Private
    /// <summary>
    /// 自動判斷重新組合字串的排序模式。
    /// </summary>
    private static RemergeSortMode DetectSortMode(List<string> items)
    {
        bool allNumber = items.All(x => int.TryParse(x, out _));
        if (allNumber) return RemergeSortMode.Number;
        bool hasDigit = items.Any(x => Regex.IsMatch(x, @"\d"));
        bool hasAlpha = items.Any(x => Regex.IsMatch(x, @"[a-zA-Z]"));
        if (hasDigit && hasAlpha) return RemergeSortMode.Natural;
        return RemergeSortMode.String;
    }
    #endregion
}

/// <summary>
/// 排序方式
/// </summary>
public enum RemergeSortMode
{
    /// <summary>
    /// 自動偵測
    /// </summary>
    Auto,
    /// <summary>
    /// 不排序
    /// </summary>
    None,
    /// <summary>
    /// 純文字
    /// </summary>
    String,
    /// <summary>
    /// 數字
    /// </summary>
    Number,
    /// <summary>
    /// 自然語言
    /// </summary>
    Natural
}