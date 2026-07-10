using System.Reflection;
using System.Text.Json.Serialization;
using WCMS.SysCore.FeatureDriver.Api;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// WCMS 外部 API 欄位政策共用工具。
    /// 只處理 API 邊界的欄位可見、可寫與查詢能力，不限制 Biz / Repo 內部流程。
    /// </summary>
    public static class LibApiFieldPolicyHelper
    {
        #region Property
        /// <summary>
        /// 未標示 LibField / LibStr 時的預設 API 欄位模式。
        /// </summary>
        public const ApiFieldMode DefaultApiMode = ApiFieldMode.ReadWrite;
        #endregion

        #region Public
        /// <summary>
        /// 取得欄位的 API 欄位模式。
        /// </summary>
        public static ApiFieldMode GetApiMode(PropertyInfo? property)
        {
            if (property == null) return DefaultApiMode;

            var attr = property.GetCustomAttributes(inherit: true).OfType<ILibFieldAttr>().FirstOrDefault();
            var result = attr?.ApiMode ?? DefaultApiMode;
            return result;
        }


        /// <summary>
        /// 檢查 Query 欄位是否存在於 Form Model 且符合 ApiFieldMode select / sort 規則。
        /// </summary>
        public static bool CheckQueryParam<TFormModel>(QueryListParam? param) where TFormModel : class
        {
            if (param == null) return false;
            if (!CheckFields(typeof(TFormModel), param.Fields, CanSelect)) return false;
            if (!CheckOrderBy(typeof(TFormModel), param.OrderBy)) return false;
            return CheckRankGroups(typeof(TFormModel), param.RankGroups);
        }

        /// <summary>
        /// 判斷欄位是否允許 API 輸出。
        /// </summary>
        public static bool CanRead(PropertyInfo? property)
        {
            var result = CanRead(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否允許 API 輸出。
        /// </summary>
        public static bool CanRead(ApiFieldMode apiMode)
        {
            var result = apiMode is ApiFieldMode.ReadWrite or ApiFieldMode.ReadOnly;
            return result;
        }

        /// <summary>
        /// 判斷欄位是否允許外部 API 寫入。
        /// </summary>
        public static bool CanWrite(PropertyInfo? property)
        {
            var result = CanWrite(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否允許外部 API 寫入。
        /// </summary>
        public static bool CanWrite(ApiFieldMode apiMode)
        {
            var result = apiMode is ApiFieldMode.ReadWrite or ApiFieldMode.WriteOnly;
            return result;
        }

        /// <summary>
        /// 判斷欄位是否允許進入 Query 條件。
        /// </summary>
        public static bool CanQuery(PropertyInfo? property)
        {
            var result = CanQuery(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否允許進入 Query 條件。
        /// </summary>
        public static bool CanQuery(ApiFieldMode apiMode)
        {
            var result = apiMode is ApiFieldMode.ReadWrite or ApiFieldMode.ReadOnly;
            return result;
        }

        /// <summary>
        /// 判斷欄位是否允許 Query select。
        /// </summary>
        public static bool CanSelect(PropertyInfo? property)
        {
            var result = CanSelect(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否允許 Query select。
        /// </summary>
        public static bool CanSelect(ApiFieldMode apiMode)
        {
            var result = CanRead(apiMode);
            return result;
        }

        /// <summary>
        /// 判斷欄位是否允許 Query sort。
        /// </summary>
        public static bool CanSort(PropertyInfo? property)
        {
            var result = CanSort(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否允許 Query sort。
        /// </summary>
        public static bool CanSort(ApiFieldMode apiMode)
        {
            var result = CanQuery(apiMode);
            return result;
        }

        /// <summary>
        /// 判斷欄位是否應從 Swagger / API Schema 隱藏。
        /// </summary>
        public static bool ShouldHideFromSchema(PropertyInfo? property)
        {
            if (property == null) return false;
            if (HasJsonIgnore(property)) return true;

            var result = ShouldHideFromSchema(GetApiMode(property));
            return result;
        }

        /// <summary>
        /// 判斷欄位模式是否應從 Swagger / API Schema 隱藏。
        /// </summary>
        public static bool ShouldHideFromSchema(ApiFieldMode apiMode)
        {
            var result = apiMode == ApiFieldMode.Ignore;
            return result;
        }
        #endregion

        #region Private

        /// <summary>
        /// 檢查 Select 欄位清單。
        /// </summary>
        private static bool CheckFields(Type rootType, IEnumerable<string>? fields, Func<PropertyInfo?, bool> policy)
        {
            foreach (string field in fields ?? []) if (!CheckFieldPath(rootType, field, policy)) return false;
            return true;
        }
        /// <summary>
        /// 檢查排序欄位清單。
        /// </summary>
        private static bool CheckOrderBy(Type rootType, IReadOnlyList<QueryListParam.OrderBySpec>? orderBy)
        {
            if (orderBy == null) return true;
            foreach (var item in orderBy) if (!CheckFieldPath(rootType, item.Col, CanSort)) return false;
            return true;
        }
        /// <summary>
        /// 檢查 RankGroup 的排序欄位。
        /// </summary>
        private static bool CheckRankGroups(Type rootType, IReadOnlyList<QueryListParam.RankGroupsSpec>? groups)
        {
            if (groups == null) return true;
            foreach (var group in groups) if (!CheckOrderBy(rootType, group.OrderBy)) return false;
            return true;
        }
        /// <summary>
        /// 檢查欄位路徑是否存在且符合欄位政策。
        /// </summary>
        private static bool CheckFieldPath(Type rootType, string field, Func<PropertyInfo?, bool> policy)
        {
            if (string.IsNullOrWhiteSpace(field)) return false;
            Type currentType = rootType;
            string[] parts = field.Split('.', StringSplitOptions.RemoveEmptyEntries);
            int startIndex = parts.Length > 1 && IsRootSegment(rootType, parts[0]) ? 1 : 0;
            for (int index = startIndex; index < parts.Length; index++)
            {
                PropertyInfo? property = PropertyAccessorCache.GetProperty(currentType, parts[index])
                    ?? PropertyAccessorCache.GetProperty(currentType, "_" + parts[index]);
                if (property == null || !policy(property)) return false;
                currentType = GetListItemType(property.PropertyType) ?? property.PropertyType;
            }
            return startIndex < parts.Length;
        }
        /// <summary>
        /// 判斷欄位路徑第一段是否為 Root Header 表名。
        /// </summary>
        private static bool IsRootSegment(Type rootType, string part)
        {
            string rootName = rootType.Name;
            string trimName = rootName.EndsWith("Model", StringComparison.Ordinal) ? rootName[..^"Model".Length] : rootName;
            return string.Equals(part, rootName, StringComparison.OrdinalIgnoreCase) || string.Equals(part, trimName, StringComparison.OrdinalIgnoreCase);
        }
        /// <summary>
        /// 取得集合項目型別。
        /// </summary>
        private static Type? GetListItemType(Type type)
        {
            if (type == typeof(string) || type == typeof(byte[])) return null;
            if (type.IsArray) return type.GetElementType();
            if (type.IsGenericType) return type.GetGenericArguments().FirstOrDefault();
            return type.GetInterfaces().FirstOrDefault(p => p.IsGenericType && p.GetGenericTypeDefinition() == typeof(IEnumerable<>))?.GetGenericArguments().FirstOrDefault();
        }

        /// <summary>
        /// 判斷欄位是否已有 System.Text.Json 忽略標記。
        /// </summary>
        private static bool HasJsonIgnore(PropertyInfo property)
        {
            var attr = property.GetCustomAttribute<JsonIgnoreAttribute>(inherit: true);
            var result = attr != null && attr.Condition != JsonIgnoreCondition.Never;
            return result;
        }
        #endregion
    }
}
