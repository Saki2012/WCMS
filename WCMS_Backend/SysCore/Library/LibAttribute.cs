using System.ComponentModel;
using System.Globalization;
using System.Reflection;
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
        private readonly ResourceManager _resourceManager;
        private string? _resourceKey;

        public LibDescAttribute()
        {
            // 可以改成從 DI 注入或集中設定資源路徑
            _resourceManager = new ResourceManager("WCMS.SysCore.Resx.ModelDisplayName", Assembly.GetExecutingAssembly());
        }

        public void SetResourceKey(string key) => _resourceKey = key;

        public override string Description
        {
            get
            {
                if (string.IsNullOrEmpty(_resourceKey)) return "";
                var culture = CultureInfo.CurrentUICulture;
                var localized = $"[{_resourceKey}]";
                try
                {
                    localized = _resourceManager.GetString(_resourceKey, culture) ?? _resourceManager.GetString(_resourceKey, new CultureInfo("zh-TW"));
                }
                catch
                {
                    Console.WriteLine("Resx資料辨識異常");
                }
                return localized;
            }
        }
    }



    [AttributeUsage(AttributeTargets.Class, Inherited = false)]
    public sealed class LibProgIdAttribute(string progId = "") : Attribute
    {
        private readonly string _progId = progId;

        public string Value { get; }
    }



}
