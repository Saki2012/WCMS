using System.Reflection;
using System.Text.RegularExpressions;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
namespace WCMS.SysCore.FeatureDriver.Model.Form;

/// <summary>
/// 解析一般 DbModel 與組合式 Form Model 的 Root、組裝與查詢路徑。
/// </summary>
public static partial class FormModelMetadataResolver
{
    #region Public
    /// <summary>
    /// 取得 Form Model 對應的 Root DbModel 型別。
    /// </summary>
    public static Type GetRootDbModelType(Type formModelType)
    {
        if (typeof(DbModel).IsAssignableFrom(formModelType)) return formModelType;
        Type? contract = GetFormModelContract(formModelType);
        if (contract != null) return contract.GetGenericArguments()[0];
        throw new InvalidOperationException($"Form Model must inherit DbModel or implement IFormModel<TRootDbModel>: {formModelType.FullName}");
    }
    /// <summary>
    /// 取得 Form Model 目前的 Root DbModel。
    /// </summary>
    public static DbModel GetRootModel(object formModel)
    {
        if (formModel is DbModel dbModel) return dbModel;
        if (formModel is IFormModel composite) return composite.GetRootModel();
        throw new InvalidOperationException($"Invalid Form Model instance: {formModel.GetType().FullName}");
    }
    /// <summary>
    /// 將 Root DbModel 組裝成指定 Form Model。
    /// </summary>
    public static TFormModel CreateFormModel<TFormModel>(DbModel rootModel) where TFormModel : class
    {
        if (rootModel is TFormModel directModel) return directModel;
        object instance = Activator.CreateInstance(typeof(TFormModel))
            ?? throw new InvalidOperationException($"Cannot create Form Model: {typeof(TFormModel).FullName}");
        if (instance is not IFormModel composite) throw new InvalidOperationException($"Form Model does not implement IFormModel: {typeof(TFormModel).FullName}");
        composite.SetRootModel(rootModel);
        return (TFormModel)instance;
    }
    /// <summary>
    /// 將外部 Form Model 欄位路徑轉成 Root DbModel 路徑。
    /// </summary>
    public static string MapFieldPathToRoot(Type formModelType, string fieldPath, ModelTypeMetadataCache modelMetadata)
    {
        if (string.IsNullOrWhiteSpace(fieldPath) || typeof(DbModel).IsAssignableFrom(formModelType)) return fieldPath;
        string[] parts = fieldPath.Split('.', StringSplitOptions.RemoveEmptyEntries);
        parts = TrimFormTypePrefix(formModelType, parts);
        if (parts.Length == 0) return fieldPath;
        PropertyInfo? rootProperty = GetRootProperty(formModelType, modelMetadata);
        if (rootProperty != null && parts[0] == rootProperty.Name)
            return parts.Length > 1 ? string.Join('.', parts.Skip(1)) : fieldPath;
        return MapGraphPropertyPath(formModelType, parts, modelMetadata) ?? fieldPath;
    }
    /// <summary>
    /// 將查詢條件內的 Form Model 欄位路徑轉成 Root DbModel 路徑。
    /// </summary>
    public static string MapExpressionToRoot(Type formModelType, string expression, ModelTypeMetadataCache modelMetadata)
    {
        if (string.IsNullOrWhiteSpace(expression) || typeof(DbModel).IsAssignableFrom(formModelType)) return expression;
        return FieldPathRegex().Replace(expression, match => IsInsideQuotedValue(expression, match.Index)
            ? match.Value
            : MapKnownFieldPath(formModelType, match.Value, modelMetadata));
    }
    #endregion

    #region Private
    /// <summary>
    /// 取得 IFormModel 泛型契約。
    /// </summary>
    private static Type? GetFormModelContract(Type formModelType)
    {
        return formModelType.GetInterfaces().FirstOrDefault(type => type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IFormModel<>));
    }
    /// <summary>
    /// 取得標示為 Root 的公開 Property。
    /// </summary>
    private static PropertyInfo? GetRootProperty(Type formModelType, ModelTypeMetadataCache modelMetadata)
    {
        return modelMetadata.GetProperties(formModelType).FirstOrDefault(prop => prop.IsDefined(typeof(FormRootAttribute), true));
    }
    /// <summary>
    /// 欄位路徑以完整 Form 型別名稱開頭時移除該前綴。
    /// </summary>
    private static string[] TrimFormTypePrefix(Type formModelType, string[] parts)
    {
        if (parts.Length < 2) return parts;
        bool isPrefix = parts[0].Equals(formModelType.Name, StringComparison.OrdinalIgnoreCase);
        return isPrefix ? parts[1..] : parts;
    }
    /// <summary>
    /// 將 Form Model Graph Property 轉成 Root Graph Path。
    /// </summary>
    private static string? MapGraphPropertyPath(Type formModelType, string[] parts, ModelTypeMetadataCache modelMetadata)
    {
        PropertyInfo? property = modelMetadata.GetProperty(formModelType, parts[0]);
        FormGraphPathAttribute? mapping = property?.GetCustomAttribute<FormGraphPathAttribute>(true);
        if (mapping == null) return null;
        string suffix = parts.Length > 1 ? "." + string.Join('.', parts.Skip(1)) : string.Empty;
        return mapping.RootPath + suffix;
    }
    /// <summary>
    /// 只轉換可確認屬於 Form Model 的欄位 Token。
    /// </summary>
    private static string MapKnownFieldPath(Type formModelType, string token, ModelTypeMetadataCache modelMetadata)
    {
        string[] parts = token.Split('.', StringSplitOptions.RemoveEmptyEntries);
        parts = TrimFormTypePrefix(formModelType, parts);
        if (parts.Length == 0) return token;
        PropertyInfo? property = modelMetadata.GetProperty(formModelType, parts[0]);
        return property == null ? token : MapFieldPathToRoot(formModelType, token, modelMetadata);
    }
    /// <summary>
    /// 判斷指定位置是否位於單引號或雙引號字串內。
    /// </summary>
    private static bool IsInsideQuotedValue(string expression, int targetIndex)
    {
        bool inSingleQuote = false;
        bool inDoubleQuote = false;
        for (int index = 0; index < targetIndex; index++)
        {
            char value = expression[index];
            if (value == '\'' && !inDoubleQuote)
            {
                if (inSingleQuote && index + 1 < targetIndex && expression[index + 1] == '\'') index++;
                else inSingleQuote = !inSingleQuote;
            }
            else if (value == '"' && !inSingleQuote)
            {
                if (inDoubleQuote && index + 1 < targetIndex && expression[index + 1] == '"') index++;
                else inDoubleQuote = !inDoubleQuote;
            }
        }
        return inSingleQuote || inDoubleQuote;
    }
    /// <summary>
    /// 取得查詢條件中的識別字路徑。
    /// </summary>
    [GeneratedRegex(@"\b[A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*\b", RegexOptions.Compiled)]
    private static partial Regex FieldPathRegex();
    #endregion
}
