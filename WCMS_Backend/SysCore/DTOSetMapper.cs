using SharpCompress.Readers.Arc;
using System.Collections;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using System.Runtime.CompilerServices;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
namespace WCMS.SysCore
{

    public sealed class MapperOptions
    {
        /// <summary>當來源為 null 時是否忽略不覆蓋（預設 true）。</summary>
        public bool IgnoreNull { get; set; } = true;
        /// <summary>Detail 長度不一致時，是否允許自動擴充目標 List（預設 true）。</summary>
        public bool AutoExpandDetail { get; set; } = true;
        /// <summary>是否清空目標 List 後重建（預設 false；若 true 則用 DTO 的數量重建）。</summary>
        public bool RebuildDetail { get; set; } = false;
        /// <summary>Header/Detail 的屬性名稱（大小寫不敏感）。預設尋找 "Header" 與 "Detail"/"Details"。</summary>
        public string HeaderPropertyName { get; set; } = "Header";
        public string DetailPropertyName { get; set; } = "Detail"; // 同時會嘗試 "Details"
        /// <summary>當屬性缺少可寫入權限時，是忽略（預設）還是拋例外。</summary>
        public bool ThrowOnNoPermission { get; set; } = false;
    }

    public static class DTOHelper
    {
        public static TSet MapToSet<TSet, TSetDto>(TSetDto srcDTO) where TSet : ITSet where TSetDto : ITSet_DTO
        {
            var set = PropertyAccessorCache.CreateInstance<TSet>();
            CopyObject(srcDTO!, set!, toSet: true, ctx: new MapCtx());
            return set;
        }

        public static TSetDto MapToDTO<TSet, TSetDto>(TSet srcSet) where TSet : ITSet where TSetDto : ITSet_DTO
        {
            var dto = PropertyAccessorCache.CreateInstance<TSetDto>();
            CopyObject(srcSet!, dto!, toSet: false, ctx: new MapCtx());
            return dto;
        }

        public static bool CheckQueryParam<TSetDTO>(QueryListParam param)
        {
            var fields = GetDTOFields<TSetDTO>();
            return CheckFields<TSetDTO>(fields, param.Fields) && CheckCondition<TSetDTO>(fields, param.Condition);
        }
        #region Private

        /// <summary>
        /// 物件對物件：以「目的端屬性」為主，名稱對得上才拷貝；遇到複合型別與 List 會遞迴
        /// </summary>
        /// <param name="src"></param>
        /// <param name="dst"></param>
        /// <param name="toSet"></param>
        private static void CopyObject(object? src, object? dst, bool toSet, MapCtx ctx)
        {
            if (src is null || dst is null) return;
            if (!ctx.Enter(src, dst.GetType())) return;
            try
            {
                foreach (var dp in PropertyAccessorCache.GetProperties(dst.GetType()))
                {
                    if (!dp.CanWrite) continue;
                    var sp = PropertyAccessorCache.GetProperty(src.GetType(), dp.Name);
                    if (sp is null || ShouldSkip(sp, dp, toSet)) continue;
                    var sv = PropertyAccessorCache.Get(src, dp.Name);
                    AssignValue(dst, dp, sv, toSet, ctx);
                }
            }
            finally { ctx.Exit(src, dst.GetType()); }
        }
        private static void AssignValue(object dst, PropertyInfo dp, object? sv, bool toSet, MapCtx ctx)
        {
            var dt = dp.PropertyType;
            if (sv is null)
            {
                if (dt.IsValueType && Nullable.GetUnderlyingType(dt) == null)return; // 直接略過，不呼叫 setter
                // 其他型別（class 或 Nullable<T>）才 Set(null)
                PropertyAccessorCache.Set(dst, dp.Name, null);
                return;
            }
            if (IsListType(dt)) PropertyAccessorCache.Set(dst, dp.Name, MapList(sv as IEnumerable, dt, toSet, ctx));
            else if (IsComplexType(dt)) PropertyAccessorCache.Set(dst, dp.Name, MapComplex(sv, dt, toSet, ctx));
            else PropertyAccessorCache.Set(dst, dp.Name, ConvertSimple(sv, dt));
        }

        private static object MapList(IEnumerable? srcEnum, Type dstListType, bool toSet, MapCtx ctx)
        {
            var elemType = GetElementType(dstListType) ?? typeof(object);
            var list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(elemType))!;
            foreach (var it in srcEnum ?? Array.Empty<object>())
                list.Add(it is null ? null : IsComplexType(elemType) ? MapComplex(it, elemType, toSet, ctx) : ConvertSimple(it, elemType));
            if (dstListType.IsArray) { var a = Array.CreateInstance(elemType, list.Count); list.CopyTo(a, 0); return a; }
            return list;
        }

        private static object MapComplex(object src, Type dstType, bool toSet, MapCtx ctx)
        {
            var dst = PropertyAccessorCache.CreateInstance(dstType);
            CopyObject(src, dst, toSet, ctx);
            return dst!;
        }

        /// <summary>
        /// 是否略過：NotMapped；DTO->Set 時尊重 DTOReadOnly
        /// </summary>
        /// <param name="sp"></param>
        /// <param name="dp"></param>
        /// <param name="toSet"></param>
        /// <returns></returns>
        private static bool ShouldSkip(PropertyInfo sp, PropertyInfo dp, bool toSet)
        {
            if (PropertyAccessorCache.TryGetAttribute<NotMappedAttribute>(sp, out _) || PropertyAccessorCache.TryGetAttribute<NotMappedAttribute>(dp, out _)) return true;
            return toSet && PropertyAccessorCache.TryGetAttribute<DTOReadOnlyAttribute>(sp, out _);
        }

        /// <summary>
        /// 識別類型
        /// </summary>
        /// <param name="t"></param>
        /// <returns></returns>
        private static bool IsComplexType(Type t) => t.IsClass && t != typeof(string) && !IsListType(t);
        private static bool IsListType(Type t) => t != typeof(string) && (typeof(IList).IsAssignableFrom(t) || t.IsArray || t.GetInterfaces().Any(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>)));
        private static Type? GetElementType(Type t)
        {
            if (t.IsArray) return t.GetElementType();
            if (t.IsGenericType) return t.GetGenericArguments().FirstOrDefault();
            var ie = t.GetInterfaces().FirstOrDefault(i => i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));
            return ie?.GetGenericArguments().FirstOrDefault();
        }
        /// <summary>
        /// 簡單型別轉換（含 Nullable/Enum/Guid/DateTime/字串布林）
        /// </summary>
        /// <param name="value"></param>
        /// <param name="dstType"></param>
        /// <returns></returns>
        private static object ConvertSimple(object value, Type dstType)
        {
            var t = Nullable.GetUnderlyingType(dstType) ?? dstType;
            if (t.IsInstanceOfType(value)) return value;
            if (t.IsEnum) return System.Enum.Parse(t, value.ToString()!, true);
            if (t == typeof(Guid)) return Guid.Parse(value.ToString()!);
            if (t == typeof(DateTime)) return Convert.ToDateTime(value);
            if (t == typeof(bool) && value is string s)
                return s == "1" || s.Equals("true", StringComparison.OrdinalIgnoreCase);
            return Convert.ChangeType(value, t);
        }

        /// <summary>
        /// 獲取DTO的各欄位名稱
        /// </summary>
        /// <typeparam name="TSetDTO"></typeparam>
        /// <returns></returns>
        private static Dictionary<string,List<string>> GetDTOFields<TSetDTO>()
        {
            Dictionary<string, List<string>> dictFields = [];
            foreach(var prop in PropertyAccessorCache.GetProperties<TSetDTO>())
            {
                string tableName= prop.Name;
                PropertyInfo[] propsInfo = !prop.IsListPropertyType() ? PropertyAccessorCache.GetProperties(prop.PropertyType) : PropertyAccessorCache.GetProperties(prop.PropertyType.GetGenericArguments().FirstOrDefault());
                dictFields.Add(tableName, []);
                foreach (var fieldProp in propsInfo) dictFields[tableName].Add(fieldProp.Name);
            }
            return dictFields;
        }
        /// <summary>
        /// 檢查Select欄位
        /// </summary>
        /// <typeparam name="TSetDTO"></typeparam>
        /// <param name="dictFields"></param>
        /// <param name="fields"></param>
        /// <returns></returns>
        private static bool CheckFields<TSetDTO>(Dictionary<string, List<string>> dictFields, string[] fields)
        {
            foreach(var field in fields)
            {
                if (!field.Contains('.'))
                {
                    if (!dictFields.FirstOrDefault().Value.Contains(field)) return false;
                }
                else
                {
                    string[] f = field.Split('.');
                    //關聯字段姑且先檢查關聯欄位
                    if(dictFields.FirstOrDefault().Value.FirstOrDefault(p => p == f[0]) != null)
                    {

                    }
                    else
                    { 
                        if (!dictFields.ContainsKey(f[0])) return false;
                        if (!dictFields[f[0]].Contains(f[1])) return false;
                    }
                }
            }
            return true;
        }
        /// <summary>
        /// 檢查Where條件
        /// </summary>
        /// <typeparam name="TSetDTO"></typeparam>
        /// <param name="dictFields"></param>
        /// <param name="condition"></param>
        /// <returns></returns>
        private static bool CheckCondition<TSetDTO>(Dictionary<string, List<string>> dictFields,string condition)
        {
            return true;
        }

        private sealed class MapCtx
        {
            private readonly HashSet<(object src, Type dst)> _seen = new(new RefPairCmp());
            public bool Enter(object src, Type dstType) => _seen.Add((src, dstType));
            public void Exit(object src, Type dstType) => _seen.Remove((src, dstType));

            private sealed class RefPairCmp : IEqualityComparer<(object, Type)>
            {
                public bool Equals((object, Type) x, (object, Type) y) =>
                    ReferenceEquals(x.Item1, y.Item1) && x.Item2 == y.Item2;
                public int GetHashCode((object, Type) o) =>
                    HashCode.Combine(RuntimeHelpers.GetHashCode(o.Item1), o.Item2);
            }
        }
        #endregion
    }

}
