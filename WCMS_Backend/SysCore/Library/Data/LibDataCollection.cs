using System.Collections;
using System.Linq.Expressions;
namespace WCMS.SysCore.Library;

/// <summary>
/// 提供集合包含、內容檢查與唯一性判斷。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 判斷指定資料是否存在於候選集合中。
    /// </summary>
    public static bool In(this object val, params dynamic[] elements)
    {
        foreach (dynamic element in elements)
            if (element.GetType() == val.GetType() && string.Compare(element.ToString(), val.ToString()) == 0) return true;
        return false;
    }
    /// <summary>
    /// 判斷列表是否包含資料。
    /// </summary>
    public static bool HasData(this IList val)
    {
        return null != val && val.Count > 0;
    }
    /// <summary>
    /// 保留既有列表資料彙總入口並回傳原列表。
    /// </summary>
    public static List<T> SumListData<T>(this List<T> val, Expression<Func<T, T, object>> propertyExpression)
    {
        return val;
    }
    /// <summary>
    /// 檢查指定欄位值是否皆為唯一。
    /// </summary>
    public static bool CheckItemUnique<T>(this List<T> details, Func<T, string> keySelector)
    {
        if (details == null || details.Count == 0) return true;
        if (details.Count > 10000)
        {
            var seen = new HashSet<string>();
            foreach (var item in details)
            {
                var key = keySelector(item);
                if (string.IsNullOrEmpty(key)) continue;
                if (!seen.Add(key)) return false;
            }
            return true;
        }
        return details
            .Select(keySelector)
            .Where(k => !string.IsNullOrEmpty(k))
            .GroupBy(k => k)
            .All(g => g.Count() == 1);
    }
    #endregion
}
