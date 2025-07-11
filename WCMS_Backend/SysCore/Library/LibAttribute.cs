using System.ComponentModel;
using System.Globalization;
using System.Resources;
using System.Runtime.InteropServices;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// 欄位/Function名稱描述 
    /// (透過.resx支援多語系)
    /// </summary>
    [AttributeUsage(AttributeTargets.All, Inherited = false, AllowMultiple = false)]
    public sealed class LibDescAttribute : DescriptionAttribute
    {
        private readonly string _resourceKey;
        private readonly ResourceManager _resourceManager;

        public LibDescAttribute(string resourceKey="", Type resourceType=null) : base(resourceKey) // 預設值，如果無法取資源就用 key
        {
            return;
            _resourceKey = resourceKey ?? throw new ArgumentNullException(nameof(resourceKey));
            if (resourceType == null) throw new ArgumentNullException(nameof(resourceType));
            var property = resourceType.GetProperty("ResourceManager", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Public);
            if (property == null) throw new ArgumentException("resourceType 必須有 ResourceManager 屬性", nameof(resourceType));
            _resourceManager = (ResourceManager)property.GetValue(null, null);
        }

        public override string Description
        {
            get
            {
                return "";
                string localized = _resourceManager.GetString(_resourceKey, CultureInfo.CurrentUICulture);
                return localized ?? $"[{_resourceKey}]"; // 若找不到資源則返回 key
            }
        }
    }
    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class LibProgIdAttribute: Attribute
    {
        private readonly string _progId;
        public LibProgIdAttribute(string progId="") 
        {
            
        
        
        }
        public string Value { get; }
    }
}
