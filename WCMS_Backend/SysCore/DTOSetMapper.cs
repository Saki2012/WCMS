using System.Globalization;
using WCMS.Features.SiteEdit.Tag;
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
        public static TSet MapSet<TSet, TSetDto>(TSetDto sourceDto) where TSet : class where TSetDto : class
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

        public static bool CheckQueryParam<TSetDTO>(QueryListParam param)
        {
            return CheckFields<TSetDTO>(param.Fields) && CheckCondition<TSetDTO>(param.Condition);
        }

        #region Private

        private static bool CheckFields<TSetDTO>(string[] fields)
        {
            foreach(var field in fields)
            {
                
            }
        }

        private static bool CheckCondition<TSetDTO>(string condition)
        {

        }
        #endregion
    }

}
