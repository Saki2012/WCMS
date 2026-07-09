using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.Globalization;
using System.Net;
using WCMS.SysCore.FeatureDriver.Resx;
using WCMS.SysCore.I18n;

namespace WCMS.SysCore.Library.LibAttribute
{
    /// <summary>
    /// 欄位/Function名稱描述 
    /// (透過.resx支援多語系)
    /// </summary>
    [AttributeUsage(AttributeTargets.All, Inherited = false, AllowMultiple = false)]
    public sealed class LibDescAttribute : DescriptionAttribute, ILibDisplayAttr
    {
        #region Property
        private string? _resourceKey;
        private string? _aliasKey;
        #endregion

        #region Public
        /// <summary>
        /// 主要顯示名稱資源 Key。
        /// </summary>
        public string? DescKey => _resourceKey;

        /// <summary>
        /// 別名顯示名稱資源 Key。
        /// </summary>
        public string? AliasKey => _aliasKey;

        /// <summary>
        /// 建立欄位顯示名稱描述，第二參數會優先作為顯示名稱。
        /// </summary>
        public LibDescAttribute(string resKey = "", string aliasKey = "")
        {
            SetInitialKeys(resKey, aliasKey);
        }

        /// <summary>
        /// 沒有指定資源 Key 時，補上欄位名稱作為預設 Key。
        /// </summary>
        public void SetResourceKey(string key)
        {
            _resourceKey = key;
        }

        /// <summary>
        /// 取得多語系描述文字。
        /// </summary>
        public override string Description
        {
            get
            {
                var result = GetDescriptionText();
                return result;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 初始化主要 Key 與別名 Key。
        /// </summary>
        private void SetInitialKeys(string resKey, string aliasKey)
        {
            if (!resKey.IsNullOrEmpty()) _resourceKey = resKey;
            if (!aliasKey.IsNullOrEmpty()) _aliasKey = aliasKey;
        }

        /// <summary>
        /// 依序取得別名、主要名稱、 fallback 名稱。
        /// </summary>
        private string GetDescriptionText()
        {
            var result = LibDisplayAttributeHelper.GetDescriptionText(this);
            return result;
        }
        #endregion
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
