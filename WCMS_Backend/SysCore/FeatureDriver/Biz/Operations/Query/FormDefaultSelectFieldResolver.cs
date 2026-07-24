using System.Collections;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Repo.Graph;
using WCMS.SysCore.Library;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Query;

/// <summary>
/// 建立 Form Aggregate 查詢預設使用的 Root 與 Detail 欄位清單。
/// </summary>
internal sealed class FormDefaultSelectFieldResolver<TFormModel>(FormGraphRepoScope<TFormModel> graphRepo, ModelTypeMetadataCache modelMetadata)
    where TFormModel : class
{
    #region Property
    private FormGraphRepoScope<TFormModel> GraphRepo { get; } = graphRepo;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    #endregion

    #region Internal
    /// <summary>
    /// 建立 Root Entity 完整 Graph 的預設查詢欄位。
    /// </summary>
    internal string[] Resolve()
    {
        List<string> result = [];
        AddFields(GraphRepo.RootDbModelType, string.Empty, result);
        return [.. result.Distinct(StringComparer.Ordinal)];
    }
    #endregion

    #region Private
    /// <summary>
    /// 遞迴加入目前 Entity 的 Scalar 與 InverseProperty Detail 欄位。
    /// </summary>
    private void AddFields(Type modelType, string prefix, List<string> result)
    {
        foreach (PropertyInfo property in ModelMetadata.GetProperties(modelType))
            AddField(property, prefix, result);
    }
    /// <summary>
    /// 加入單一 Scalar，或繼續展開 Detail Graph。
    /// </summary>
    private void AddField(PropertyInfo property, string prefix, List<string> result)
    {
        if (!property.CanWrite) return;
        Type? childType = GetGraphPropertyType(property);
        if (childType == null)
        {
            if (IsSelectableScalar(property))
                result.Add(prefix + property.Name);
            return;
        }
        if (!IsSelectableDetail(property, childType)) return;
        AddFields(childType, prefix + property.Name + ".", result);
    }
    /// <summary>
    /// 判斷 Property 是否為預設 Projection 可選取的 Scalar。
    /// </summary>
    private static bool IsSelectableScalar(PropertyInfo property)
    {
        bool isScalar = property.PropertyType == typeof(byte[])
            || (!LibData.IsListPropertyType(property) && !typeof(DbModel).IsAssignableFrom(property.PropertyType));
        return isScalar
            && !property.IsDefined(typeof(NotMappedAttribute), true);
    }
    /// <summary>
    /// 判斷 Navigation 是否為可展開的 Detail Collection。
    /// </summary>
    private bool IsSelectableDetail(PropertyInfo property, Type childType)
    {
        bool isCollection = property.PropertyType != typeof(string)
            && typeof(IEnumerable).IsAssignableFrom(property.PropertyType);
        return isCollection
            && property.IsDefined(typeof(InversePropertyAttribute), true)
            && GraphRepo.ContainsRepo(childType);
    }
    /// <summary>
    /// 取得 Property 對應的 DbModel 或集合元素型別。
    /// </summary>
    private static Type? GetGraphPropertyType(PropertyInfo property)
    {
        Type propertyType = property.PropertyType;
        if (typeof(DbModel).IsAssignableFrom(propertyType)) return propertyType;
        if (propertyType == typeof(string) || propertyType == typeof(byte[]))
            return null;
        if (!typeof(IEnumerable).IsAssignableFrom(propertyType)) return null;
        Type? itemType = propertyType.IsArray
            ? propertyType.GetElementType()
            : propertyType.GetGenericArguments().FirstOrDefault();
        return itemType != null && typeof(DbModel).IsAssignableFrom(itemType)
            ? itemType
            : null;
    }
    #endregion
}
