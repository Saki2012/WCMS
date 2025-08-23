using SharpCompress.Readers.Arc;
using System.Collections;
using System.Reflection;
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
            TSet set = PropertyAccessorCache.CreateInstance<TSet>();
            foreach(var prop in PropertyAccessorCache.GetProperties<TSetDto>())
            {
                if (!prop.IsListPropertyType())
                {
                    var srcHeader = PropertyAccessorCache.Get(srcDTO, prop.Name);
                    var dstHeader = PropertyAccessorCache.Get(set, prop.Name);
                    var dtoProps = PropertyAccessorCache.GetProperties(prop.PropertyType);
                    MapToHeader(srcHeader, dstHeader, dtoProps,true);
                }
                else
                {
                    var srcDetails = PropertyAccessorCache.Get(srcDTO, prop.Name) as IList;
                    if (srcDetails == null) continue;
                    var dstDetails = PropertyAccessorCache.Get(set, prop.Name) as IList;
                    var dtoProps = PropertyAccessorCache.GetProperties(srcDetails.GetType().GenericTypeArguments.FirstOrDefault());
                    MapToDetail(srcDetails, dstDetails, dtoProps,true);
                }
            }
            return set;
        }

        public static TSetDto MapToDTO<TSet, TSetDto>(TSet srcSet) where TSet : ITSet where TSetDto : ITSet_DTO
        {
            TSetDto set = PropertyAccessorCache.CreateInstance<TSetDto>();
            foreach (var prop in PropertyAccessorCache.GetProperties<TSetDto>())
            {
                if (!prop.IsListPropertyType())
                {
                    var srcHeader = PropertyAccessorCache.Get(srcSet, prop.Name);
                    var dstHeader = PropertyAccessorCache.Get(set, prop.Name);
                    var dtoProps = PropertyAccessorCache.GetProperties(prop.PropertyType);
                    MapToHeader(srcHeader, dstHeader, dtoProps,false);
                }
                else
                {
                    var srcDetails = PropertyAccessorCache.Get(srcSet, prop.Name) as IList;
                    if (srcDetails == null) continue;
                    var dstDetails = PropertyAccessorCache.Get(set, prop.Name) as IList;
                    var dtoProps = PropertyAccessorCache.GetProperties(dstDetails.GetType().GenericTypeArguments.FirstOrDefault());
                    MapToDetail(srcDetails, dstDetails, dtoProps,false);
                }
            }
            return set;
        }

        public static bool CheckQueryParam<TSetDTO>(QueryListParam param)
        {
            var fields = GetDTOFields<TSetDTO>();
            return CheckFields<TSetDTO>(fields, param.Fields) && CheckCondition<TSetDTO>(fields, param.Condition);
        }

        #region Private
        /// <summary>
        /// 
        /// </summary>
        /// <param name="srcHeader"></param>
        /// <param name="dstHeader"></param>
        /// <param name="dtoProps"></param>
        private static void MapToHeader(dynamic srcHeader,dynamic dstHeader, PropertyInfo[] dtoProps,bool isReadOnly)
        {
            foreach (var fieldProp in dtoProps)
            {
                if (fieldProp.IsListPropertyType()) continue;
                if (isReadOnly&&PropertyAccessorCache.TryGetAttribute<DTOReadOnlyAttribute>(fieldProp,out _)) continue;
                var field = PropertyAccessorCache.Get(srcHeader, fieldProp.Name);
                if (field != null) PropertyAccessorCache.Set(dstHeader, fieldProp.Name, field);
            }
        }
        /// <summary>
        /// 
        /// </summary>
        /// <param name="srcDetails"></param>
        /// <param name="dstDetails"></param>
        /// <param name="dstType"></param>
        /// <param name="dtoProps"></param>
        private static void MapToDetail(IList srcDetails,IList dstDetails,PropertyInfo[] dtoProps,bool isReadOnly)
        {
            var dstType = dstDetails.GetType().GetGenericArguments().FirstOrDefault();
            foreach (var srcData in srcDetails)
            {
                var dstData = PropertyAccessorCache.CreateInstance(dstType);
                dstDetails.Add(dstData);
                foreach(var fieldProp in dtoProps)
                {
                    if (fieldProp.IsListPropertyType()) continue;
                    if (isReadOnly&&PropertyAccessorCache.TryGetAttribute<DTOReadOnlyAttribute>(fieldProp, out _)) continue;
                    var field = PropertyAccessorCache.Get(srcData, fieldProp.Name);
                    if (field != null) PropertyAccessorCache.Set(dstData, fieldProp.Name, field);
                }
            }
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
                    if (!dictFields.ContainsKey(f[0])) return false;
                    if (!dictFields[f[0]].Contains(f[1])) return false;
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
        #endregion
    }

}
