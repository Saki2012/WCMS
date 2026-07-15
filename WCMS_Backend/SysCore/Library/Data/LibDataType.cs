using System.Collections;
using System.Linq.Expressions;
using System.Reflection;

namespace WCMS.SysCore.Library;

/// <summary>
/// 提供一般型別空值判斷、動態建立與集合型別辨識。
/// </summary>
public static partial class LibData
{
    #region Public
    /// <summary>
    /// 判斷資料是否為空值、零值或型別預設空狀態。
    /// </summary>
    public static bool IsNullOrEmpty(this object val)
    {
        if (null == val)
        {
            return true;
        }
        return val.GetType() switch
        {
            Type type when type == typeof(string) => string.IsNullOrEmpty(val.ToString()),
            Type type when type == typeof(byte) => val.ToByte() == 0,
            Type type when type == typeof(short) => val.ToInt16() == 0,
            Type type when type == typeof(int) => val.ToInt32() == 0,
            Type type when type == typeof(long) => val.ToInt64() == 0,
            Type type when type == typeof(decimal) => val.ToDecimal() == decimal.Zero,
            Type type when type == typeof(float) => val.ToFloat() == 0f,
            Type type when type == typeof(double) => val.ToDouble() == 0f,
            Type type when type == typeof(DateTime) => (DateTime)val == DateTime.MinValue,
            _ => null == val || DBNull.Value == val,
        };
    }
    /// <summary>
    /// 建立使用物件陣列呼叫第一個建構函式的委派。
    /// </summary>
    public static Func<object[], T> Build<T>()
    {
        var t = typeof(T);
        var param = Expression.Parameter(typeof(object[]), "args");
        var ctor = t.GetConstructors()[0];
        var argsExp = ctor.GetParameters().Select(
            (p, i) =>
            {
                Expression index = Expression.Constant(i);
                Expression paramAccessorExp = Expression.ArrayIndex(param, index);
                Expression paramCastExp = Expression.Convert(paramAccessorExp, p.ParameterType);
                return paramCastExp;
            });
        var exp = Expression.New(ctor, argsExp);
        return Expression.Lambda<Func<object[], T>>(exp, param).Compile();
    }
    /// <summary>
    /// 判斷屬性是否為 List 或其他可列舉集合型別。
    /// </summary>
    public static bool IsListPropertyType(this PropertyInfo prop)
    {
        Type type = Nullable.GetUnderlyingType(prop.PropertyType) ?? prop.PropertyType;
        if (type.IsGenericType && type.GetGenericTypeDefinition() == typeof(List<>)) return true;
        if (type != typeof(string) && typeof(IEnumerable).IsAssignableFrom(type)) return true;
        return false;
    }
    #endregion
}
