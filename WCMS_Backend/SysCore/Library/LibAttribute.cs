using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
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

        public LibDescAttribute(string resKey="")
        {
            if(!resKey.IsNullOrEmpty()) _resourceKey = resKey;
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
