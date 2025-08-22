using System.Collections;
using System.Reflection;
using WCMS.SysCore.Library;

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
        public static TSet MapToSet<TSet, TSetDto>(TSetDto srcDTO) where TSet : class where TSetDto : class
        {
            TSet set = PropertyAccessorCache.CreateInstance<TSet>();
            foreach(var prop in PropertyAccessorCache.GetProperties<TSetDto>())
            {
                if (!prop.PropertyType.IsGenericType)
                {

                }
                else
                {

                }
            }
            return set;
        }

        public static TSetDto MapToDTO<TSet, TSetDto>(TSet srcSet) where TSet : class where TSetDto : class
        {
            TSetDto set = PropertyAccessorCache.CreateInstance<TSetDto>();
            foreach (var prop in PropertyAccessorCache.GetProperties<TSetDto>())
            {
                if (!prop.PropertyType.IsGenericType)
                {
                    var srcheader = PropertyAccessorCache.Get(srcSet, prop.Name);
                    var dstheader = PropertyAccessorCache.Get(set, prop.Name);
                    foreach(var fieldProp in PropertyAccessorCache.GetProperties(dstheader.GetType()))
                    {
                        var field = PropertyAccessorCache.Get(srcheader, fieldProp.Name);
                        if (field != null)
                        {
                            PropertyAccessorCache.Set(dstheader, fieldProp.Name, field);
                        }
                    }
                }
                else
                {
                    var srcDetails = PropertyAccessorCache.Get(srcSet, prop.Name) as IList;
                    var dstDetails = PropertyAccessorCache.Get(set, prop.Name) as IList;

                    foreach(var srcDetail in srcDetails)
                    {



                        //dstDetails.Add();
                    }


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
        private static Dictionary<string,List<string>> GetDTOFields<TSetDTO>()
        {
            Dictionary<string, List<string>> dictFields = [];
            foreach(var prop in PropertyAccessorCache.GetProperties<TSetDTO>())
            {
                string tableName= prop.Name;
                PropertyInfo[] propsInfo = !prop.PropertyType.IsGenericType ? PropertyAccessorCache.GetProperties(prop.PropertyType) : PropertyAccessorCache.GetProperties(prop.PropertyType.GetGenericArguments().FirstOrDefault());
                dictFields.Add(tableName, []);
                foreach (var fieldProp in propsInfo) dictFields[tableName].Add(fieldProp.Name);
            }
            return dictFields;
        }
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
        private static bool CheckCondition<TSetDTO>(Dictionary<string, List<string>> dictFields,string condition)
        {
            return true;
        }
        #endregion
    }

}
