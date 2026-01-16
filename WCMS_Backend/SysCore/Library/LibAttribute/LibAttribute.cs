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

namespace WCMS.SysCore.Library.LibAttribute
{
    /// <summary>
    /// 欄位/Function名稱描述 
    /// (透過.resx支援多語系)
    /// </summary>
    [AttributeUsage(AttributeTargets.All, Inherited = false, AllowMultiple = false)]
    public sealed class LibDescAttribute : DescriptionAttribute
    {
        private string? _resourceKey;
        private readonly string CurrentSpecCode = SpecSettings.SpecCode;
        public LibDescAttribute(string resKey = ""){if (!resKey.IsNullOrEmpty()) _resourceKey = resKey;}
        public void SetResourceKey(string key) => _resourceKey = key;
        public override string Description
        {
            get
            {
                // 1) 沒 key 就回空
                if (string.IsNullOrWhiteSpace(_resourceKey)) return string.Empty;
                // 2) 組 baseName（Spec 可空）
                var coreBaseName = typeof(ModelDisplayName).FullName!;
                var specBaseName = string.IsNullOrWhiteSpace(CurrentSpecCode) ? null : $"WCMS.SpecFeatures.{CurrentSpecCode}.Resx.SpecModelDisplayName";
                // 3) 共用 reader：Spec -> Core
                var asm = typeof(ModelDisplayName).Assembly;
                var value = LibResxReader.TryGetSpecOrCore(coreBaseName, specBaseName, asm, _resourceKey, CultureInfo.CurrentUICulture);
                // 4) 找不到就回 [key]
                return string.IsNullOrWhiteSpace(value) ? $"[{_resourceKey}]" : value;
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
