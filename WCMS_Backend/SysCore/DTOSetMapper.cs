using System.Collections;
using System.Collections.Concurrent;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using System.Runtime.CompilerServices;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.Model;

namespace WCMS.SysCore
{
    public sealed class MapperOptions
    {
        /// <summary>
        /// 當來源為 null 時是否忽略不覆蓋（預設 true）。
        /// 注意：DTO -> Set 時，若目標是 non-nullable（string/number/bool/struct），仍會依下方規則自動補預設值。
        /// </summary>
        public bool IgnoreNull { get; set; } = true;

        /// <summary>
        /// DTO -> Set 時，目標屬性是 non-nullable string，而來源為 null，是否自動補空字串（預設 true）。
        /// 注意：若目標是 string?（nullable），則不會套用此規則。
        /// </summary>
        public bool FillEmptyStringForNonNullableString { get; set; } = true;

        /// <summary>
        /// DTO -> Set 時，目標屬性是 non-nullable 數字型別（int/long/decimal/...），而來源為 null，是否自動補 0（預設 true）。
        /// </summary>
        public bool FillZeroForNonNullableNumber { get; set; } = true;

        /// <summary>
        /// DTO -> Set 時，目標屬性是 non-nullable bool，而來源為 null，是否自動補 false（預設 true）。
        /// </summary>
        public bool FillFalseForNonNullableBool { get; set; } = true;

        /// <summary>
        /// DTO -> Set 時，目標屬性是其他 non-nullable value type（如 DateTime/Guid/struct），而來源為 null，
        /// 是否自動補 default(T)（預設 true）。
        /// </summary>
        public bool FillDefaultForNonNullableValueType { get; set; } = true;

        /// <summary>Detail 長度不一致時，是否允許自動擴充目標 List（預設 true）。</summary>
        public bool AutoExpandDetail { get; set; } = true;

        /// <summary>是否清空目標 List 後重建（預設 false；若 true 則用 DTO 的數量重建）。</summary>
        public bool RebuildDetail { get; set; } = false;

        /// <summary>Header/Detail 的屬性名稱（大小寫不敏感）。預設尋找 "Header" 與 "Detail"/"Details"。</summary>
        public string HeaderPropertyName { get; set; } = "Header";

        /// <summary>Detail 的屬性名稱（大小寫不敏感）。預設尋找 "Detail"/"Details"。</summary>
        public string DetailPropertyName { get; set; } = "Detail"; // 同時會嘗試 "Details"

        /// <summary>當屬性缺少可寫入權限時，是忽略（預設）還是拋例外。</summary>
        public bool ThrowOnNoPermission { get; set; } = false;
    }

    public static class DTOHelper
    {
        public static TSet MapToSet<TSet, TSetDto>(TSetDto srcDTO)where TSet : ITSet where TSetDto : ITSet_DTO
        {
            var set = PropertyAccessorCache.CreateInstance<TSet>();
            CopyObject(srcDTO!, set!, toSet: true, ctx: new MapCtx());
            return set;
        }

        public static TSetDto MapToDTO<TSet, TSetDto>(TSet srcSet)
            where TSet : ITSet
            where TSetDto : ITSet_DTO
        {
            var dto = PropertyAccessorCache.CreateInstance<TSetDto>();
            CopyObject(srcSet!, dto!, toSet: false, ctx: new MapCtx());
            return dto;
        }

        /// <summary>
        /// 物件對物件：以「目的端屬性」為主，名稱對得上才拷貝；遇到複合型別與 List 會遞迴
        /// </summary>
        public static T CopyObject<T>(object? src, bool toSet)
        {
            T? dst = PropertyAccessorCache.CreateInstance<T>();
            var ctx = new MapCtx();

            if (src is null || dst is null) return dst;
            if (!ctx.Enter(src, dst.GetType())) return dst;

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
            finally
            {
                ctx.Exit(src, dst.GetType());
            }

            return dst!;
        }

        public static bool CheckQueryParam<TSetDTO>(QueryListParam param)
        {
            var fields = GetDTOFields<TSetDTO>();
            return CheckFields<TSetDTO>(fields, param.Fields) && CheckCondition<TSetDTO>(fields, param.Condition);
        }

        #region Private

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
            finally
            {
                ctx.Exit(src, dst.GetType());
            }
        }

        private static void AssignValue(object dst, PropertyInfo dp, object? sv, bool toSet, MapCtx ctx)
        {
            var dt = dp.PropertyType;

            // ======= DTO 來源為 null：DTO -> Set 時做自動轉換，避免 non-nullable 欄位被塞 null =======
            if (sv is null)
            {
                if (toSet)
                {
                    // 1) string?：保留 null（不做 null -> ""）
                    if (dt == typeof(string) && ctx.IsNullableRef(dp))
                    {
                        if (ctx.Options.IgnoreNull) return;

                        // NOTE: 目標允許 null，才真的 set null
                        PropertyAccessorCache.Set(dst, dp.Name, null);
                        return;
                    }

                    // 2) string（non-nullable）：null -> ""
                    if (dt == typeof(string)
                        && ctx.Options.FillEmptyStringForNonNullableString
                        && ctx.IsNonNullableRef(dp))
                    {
                        // NOTE: 避免 Required / StringLength / DB NOT NULL 因 null 失敗
                        PropertyAccessorCache.Set(dst, dp.Name, string.Empty);
                        return;
                    }

                    // 3) non-nullable number：null -> 0
                    if (ctx.Options.FillZeroForNonNullableNumber && IsNonNullableNumberType(dt))
                    {
                        PropertyAccessorCache.Set(dst, dp.Name, CreateZero(dt));
                        return;
                    }

                    // 4) non-nullable bool：null -> false
                    if (ctx.Options.FillFalseForNonNullableBool && dt == typeof(bool))
                    {
                        PropertyAccessorCache.Set(dst, dp.Name, false);
                        return;
                    }

                    // 5) 其他 non-nullable value type：null -> default(T)
                    if (ctx.Options.FillDefaultForNonNullableValueType
                        && dt.IsValueType
                        && Nullable.GetUnderlyingType(dt) == null)
                    {
                        PropertyAccessorCache.Set(dst, dp.Name, Activator.CreateInstance(dt)!);
                        return;
                    }

                    // 6) 其他 reference type / Nullable<T>：若 IgnoreNull=true 則不覆蓋（patch/update 常用）
                    if (ctx.Options.IgnoreNull) return;
                }

                // 非 DTO->Set 或 IgnoreNull=false：原始行為
                // value type 且非 Nullable：避免塞 null
                if (dt.IsValueType && Nullable.GetUnderlyingType(dt) == null) return;

                // 其他型別（class 或 Nullable<T>）才 Set(null)
                PropertyAccessorCache.Set(dst, dp.Name, null);
                return;
            }

            // ======= 非 null：維持原本邏輯 =======
            if (IsListType(dt))
            {
                PropertyAccessorCache.Set(dst, dp.Name, MapList(sv as IEnumerable, dt, toSet, ctx));
                return;
            }

            if (IsComplexType(dt))
            {
                PropertyAccessorCache.Set(dst, dp.Name, MapComplex(sv, dt, toSet, ctx));
                return;
            }

            PropertyAccessorCache.Set(dst, dp.Name, ConvertSimple(sv, dt));
        }

        private static object MapList(IEnumerable? srcEnum, Type dstListType, bool toSet, MapCtx ctx)
        {
            var elemType = GetElementType(dstListType) ?? typeof(object);
            var list = (IList)Activator.CreateInstance(typeof(List<>).MakeGenericType(elemType))!;

            foreach (var it in srcEnum ?? Array.Empty<object>())
            {
                list.Add(it is null
                    ? null
                    : IsComplexType(elemType)
                        ? MapComplex(it, elemType, toSet, ctx)
                        : ConvertSimple(it, elemType));
            }

            if (dstListType.IsArray)
            {
                var a = Array.CreateInstance(elemType, list.Count);
                list.CopyTo(a, 0);
                return a;
            }

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
        private static bool ShouldSkip(PropertyInfo sp, PropertyInfo dp, bool toSet)
        {
            if (PropertyAccessorCache.TryGetAttribute<NotMappedAttribute>(sp, out _) ||
                PropertyAccessorCache.TryGetAttribute<NotMappedAttribute>(dp, out _))
            {
                return true;
            }

            return toSet && PropertyAccessorCache.TryGetAttribute<DTOReadOnlyAttribute>(sp, out _);
        }


        // ======= Type 形狀判斷快取：避免大量重複反射 (GetInterfaces / IsAssignableFrom) =======
        // NOTE: 這些方法在每個屬性 mapping 時都會被呼叫，屬於高頻熱點。
        private static readonly ConcurrentDictionary<Type, bool> _isListTypeCache = new();
        private static readonly ConcurrentDictionary<Type, bool> _isComplexTypeCache = new();
        private static readonly ConcurrentDictionary<Type, Type?> _elementTypeCache = new();

        /// <summary>
        /// 判斷是否為複合型別（class 且非 string 且非 list/array）
        /// </summary>
        private static bool IsComplexType(Type t)
        {
            // NOTE: 使用快取避免每次都走反射/介面掃描
            return _isComplexTypeCache.GetOrAdd(t, static tt =>
            {
                if (!tt.IsClass) return false;
                if (tt == typeof(string)) return false;
                return !IsListType(tt);
            });
        }

        /// <summary>
        /// 判斷是否為 List/Array/IEnumerable 類型（但排除 string）
        /// </summary>
        private static bool IsListType(Type t)
        {
            // NOTE: 使用快取避免 GetInterfaces() 在大量 mapping 時形成熱點
            return _isListTypeCache.GetOrAdd(t, static tt =>
            {
                if (tt == typeof(string)) return false;
                if (typeof(IList).IsAssignableFrom(tt)) return true;
                if (tt.IsArray) return true;

                // 泛型 IEnumerable<T> / 介面
                return tt.GetInterfaces().Any(i =>
                    i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));
            });
        }

        /// <summary>
        /// 取得集合元素型別（array / List&lt;T&gt; / IEnumerable&lt;T&gt;）
        /// </summary>
        private static Type? GetElementType(Type t)
        {
            // NOTE: 使用快取避免重複掃描泛型介面
            return _elementTypeCache.GetOrAdd(t, static tt =>
            {
                if (tt.IsArray) return tt.GetElementType();
                if (tt.IsGenericType) return tt.GetGenericArguments().FirstOrDefault();

                var ie = tt.GetInterfaces().FirstOrDefault(i =>
                    i.IsGenericType && i.GetGenericTypeDefinition() == typeof(IEnumerable<>));

                return ie?.GetGenericArguments().FirstOrDefault();
            });
        }

        /// <summary>
        /// 判斷：是否為 non-nullable 數字型別（int/long/short/byte/float/double/decimal 等）
        /// </summary>
        private static bool IsNonNullableNumberType(Type t)
        {
            if (!t.IsValueType) return false;
            if (Nullable.GetUnderlyingType(t) != null) return false;
            return IsNumericType(t);
        }

        /// <summary>
        /// 判斷：是否為數字型別（不含 bool/enum/DateTime/Guid）
        /// </summary>
        private static bool IsNumericType(Type t)
        {
            return t == typeof(byte)
                || t == typeof(sbyte)
                || t == typeof(short)
                || t == typeof(ushort)
                || t == typeof(int)
                || t == typeof(uint)
                || t == typeof(long)
                || t == typeof(ulong)
                || t == typeof(float)
                || t == typeof(double)
                || t == typeof(decimal);
        }

        /// <summary>
        /// 依型別建立 0（型別安全）
        /// </summary>
        private static object CreateZero(Type t)
        {
            if (t == typeof(decimal)) return 0m;
            if (t == typeof(double)) return 0d;
            if (t == typeof(float)) return 0f;
            if (t == typeof(long)) return 0L;
            if (t == typeof(ulong)) return 0UL;
            if (t == typeof(int)) return 0;
            if (t == typeof(uint)) return 0U;
            if (t == typeof(short)) return (short)0;
            if (t == typeof(ushort)) return (ushort)0;
            if (t == typeof(byte)) return (byte)0;
            if (t == typeof(sbyte)) return (sbyte)0;

            return Activator.CreateInstance(t)!;
        }

        /// <summary>
        /// 簡單型別轉換（含 Nullable/Enum/Guid/DateTime/字串布林）
        /// </summary>
        private static object ConvertSimple(object value, Type dstType)
        {
            var t = Nullable.GetUnderlyingType(dstType) ?? dstType;

            if (t.IsInstanceOfType(value)) return value;

            if (t == typeof(string)) return value.ToString() ?? string.Empty;

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
        private static Dictionary<string, List<string>> GetDTOFields<TSetDTO>()
        {
            Dictionary<string, List<string>> dictFields = [];
            foreach (var prop in PropertyAccessorCache.GetProperties<TSetDTO>())
            {
                string tableName = prop.Name;

                PropertyInfo[] propsInfo = !prop.IsListPropertyType()
                    ? PropertyAccessorCache.GetProperties(prop.PropertyType)
                    : PropertyAccessorCache.GetProperties(prop.PropertyType.GetGenericArguments().FirstOrDefault());

                dictFields.Add(tableName, []);

                foreach (var fieldProp in propsInfo)
                    dictFields[tableName].Add(fieldProp.Name);
            }

            return dictFields;
        }

        /// <summary>
        /// 檢查Select欄位
        /// </summary>
        private static bool CheckFields<TSetDTO>(Dictionary<string, List<string>> dictFields, string[] fields)
        {
            foreach (var field in fields)
            {
                if (!field.Contains('.'))
                {
                    if (!dictFields.FirstOrDefault().Value.Contains(field)) return false;
                }
                else
                {
                    string[] f = field.Split('.');
                    if (dictFields.FirstOrDefault().Value.FirstOrDefault(p => p == f[0]) != null)
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
        private static bool CheckCondition<TSetDTO>(Dictionary<string, List<string>> dictFields, string condition)
        {
            return true;
        }

        private sealed class MapCtx
        {
            // NOTE: NullabilityInfoContext.Create 可能有成本，所以做快取（每個 PropertyInfo 只算一次）
            private static readonly NullabilityInfoContext _nullabilityCtx = new();

            private static readonly ConditionalWeakTable<PropertyInfo, NullabilityStateCache> _nullabilityCache = new();

            public MapperOptions Options { get; } = new MapperOptions();

            private readonly HashSet<(object src, Type dst)> _seen = new(new RefPairCmp());

            public bool Enter(object src, Type dstType) => _seen.Add((src, dstType));

            public void Exit(object src, Type dstType) => _seen.Remove((src, dstType));

            /// <summary>
            /// 判斷目標屬性是否為「不可為 null」的 reference type（例如 string）
            /// </summary>
            public bool IsNonNullableRef(PropertyInfo prop)
            {
                var s = GetWriteState(prop);
                return s == NullabilityState.NotNull;
            }

            /// <summary>
            /// 判斷目標屬性是否為「可為 null」的 reference type（例如 string?）
            /// </summary>
            public bool IsNullableRef(PropertyInfo prop)
            {
                var s = GetWriteState(prop);
                return s == NullabilityState.Nullable;
            }

            private static NullabilityState GetWriteState(PropertyInfo prop)
            {
                // NOTE: ConditionalWeakTable 取不到才會計算一次，之後不再 try/catch
                var cache = _nullabilityCache.GetValue(prop, CreateCacheOnce);
                return cache.WriteState;
            }

            private static NullabilityStateCache CreateCacheOnce(PropertyInfo prop)
            {
                try
                {
                    var info = _nullabilityCtx.Create(prop);
                    return new NullabilityStateCache(info.WriteState);
                }
                catch
                {
                    // NOTE: 若專案未啟用 nullable 或反射資訊不足，就保守視為 Unknown（不套用 string? 規則）
                    return new NullabilityStateCache(NullabilityState.Unknown);
                }
            }

            private sealed class NullabilityStateCache
            {
                public NullabilityStateCache(NullabilityState state) { WriteState = state; }
                public NullabilityState WriteState { get; }
            }

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
