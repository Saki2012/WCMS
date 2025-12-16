using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
using System.Reflection;
using System.Resources;
using System.Runtime.InteropServices;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;

namespace WCMS.SysCore.Library
{
    /// <summary>
    /// 欄位/Function名稱描述 
    /// (透過.resx支援多語系)
    /// </summary>
    [AttributeUsage(AttributeTargets.All, Inherited = false, AllowMultiple = false)]
    public sealed class LibDescAttribute : DescriptionAttribute
    {
        private readonly ResourceManager _coreResourceManager;
        private readonly ResourceManager? _specResourceManager;
        private string? _resourceKey;
        private readonly string CurrentSpecCode = SpecSettings.SpecCode; // 之後換成從 appsettings / 環境變數讀
        public LibDescAttribute(string resKey="")
        {
            if(!resKey.IsNullOrEmpty()) _resourceKey = resKey;
            // 可以改成從 DI 注入或集中設定資源路徑
            _coreResourceManager = new ResourceManager(typeof(ModelDisplayName).FullName, Assembly.GetExecutingAssembly());
            if (!string.IsNullOrEmpty(CurrentSpecCode))
            {
                var specBaseName = $"WCMS.SpecFeatures.{CurrentSpecCode}.Resx.SpecModelDisplayName";
                _specResourceManager = new ResourceManager(specBaseName, Assembly.GetExecutingAssembly());
            }
        }
        public void SetResourceKey(string key) => _resourceKey = key;
        public override string Description
        {
            get
            {
                if (string.IsNullOrEmpty(_resourceKey)) return string.Empty;
                var culture = CultureInfo.CurrentUICulture;
                string? value = null;
                if (_specResourceManager != null)
                {
                    try
                    {
                        value = _specResourceManager.GetString(_resourceKey, culture);
                    }
                    catch (MissingManifestResourceException)
                    {
                        value = null;
                    }
                }
                if (string.IsNullOrEmpty(value))
                {
                    try
                    {
                        value = _coreResourceManager.GetString(_resourceKey, culture);
                    }
                    catch (MissingManifestResourceException)
                    {
                        value = null;
                    }
                }
                // ③ 都找不到就回傳 [Key] 方便 debug
                return string.IsNullOrEmpty(value) ? $"[{_resourceKey}]" : value;
            }
        }
    }

    [AttributeUsage(AttributeTargets.Method)]
    public sealed class LocalhostOnlyAttribute : Attribute, IActionFilter
    {
        public void OnActionExecuting(ActionExecutingContext context)
        {
            var remoteIp = context.HttpContext.Connection.RemoteIpAddress;
            if (!IPAddress.IsLoopback(remoteIp))
            {
                context.Result = new ForbidResult(); // 403 禁止存取
            }
        }
        public void OnActionExecuted(ActionExecutedContext context)
        {
            // 不需要做事
        }
    }
    /// <summary>
    /// 
    /// </summary>
    [AttributeUsage(AttributeTargets.Property, AllowMultiple = false)]
    public class AllowedEnumAttribute(params object[] allowed) : ValidationAttribute
    {
        private readonly object[] _allowed = allowed;
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            if (value == null) return ValidationResult.Success;
            if (!_allowed.Contains(value))
            {
                return new ValidationResult($"欄位 {validationContext.MemberName} 只能是: {string.Join(", ", _allowed)}");
            }
            return ValidationResult.Success;
        }
    }

    /// <summary>
    /// DTO 物件專用，標示此欄位為唯讀，API 不允許修改
    /// </summary>
    [AttributeUsage(AttributeTargets.Property)]
    public sealed class DTOReadOnlyAttribute : Attribute { }
}
