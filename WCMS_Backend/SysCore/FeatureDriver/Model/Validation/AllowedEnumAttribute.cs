using System.ComponentModel.DataAnnotations;

namespace WCMS.SysCore.FeatureDriver.Model.Validation;
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