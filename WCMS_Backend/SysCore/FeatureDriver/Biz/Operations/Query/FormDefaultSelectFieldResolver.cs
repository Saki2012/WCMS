using System.Collections;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
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
    /// 建立 QueryList 預設欄位，維持既有集合 Detail 展開規則。
    /// </summary>
    internal string[] Resolve()
    {
        return ResolveFields(includeReferenceDetails: false);
    }
    /// <summary>
    /// 建立 QueryData 完整 Aggregate 欄位，包含一對一 Detail 與 Composite FormGraphPath。
    /// </summary>
    internal string[] ResolveForQueryData()
    {
        return ResolveFields(includeReferenceDetails: true);
    }
    #endregion

    #region Private
    /// <summary>
    /// 依查詢用途建立預設欄位並避免循環展開。
    /// </summary>
    private string[] ResolveFields(bool includeReferenceDetails)
    {
        List<string> result = [];
        HashSet<Type> graphPath = [];
        AddFields(GraphRepo.RootDbModelType, string.Empty, result, graphPath, includeReferenceDetails);
        if (includeReferenceDetails) AddCompositeFormGraphFields(result, graphPath, includeReferenceDetails);
        return [.. result.Distinct(StringComparer.Ordinal)];
    }
    /// <summary>
    /// 將 Composite FormModel 對外公開的 FormGraphPath 一併加入 QueryData Projection。
    /// Root 內部 Navigation 即使為 ApiFieldMode.Ignore，仍可由可讀取的 FormModel Proxy 安全對外提供。
    /// </summary>
    private void AddCompositeFormGraphFields(List<string> result, HashSet<Type> graphPath, bool includeReferenceDetails)
    {
        if (typeof(DbModel).IsAssignableFrom(typeof(TFormModel))) return;
        foreach (PropertyInfo property in ModelMetadata.GetProperties(typeof(TFormModel)))
        {
            FormGraphPathAttribute? mapping = property.GetCustomAttribute<FormGraphPathAttribute>(true);
            if (mapping == null || !LibApiFieldPolicyHelper.CanRead(property)) continue;
            AddMappedGraphFields(mapping.RootPath, result, graphPath, includeReferenceDetails);
        }
    }
    /// <summary>
    /// 依 Root DbModel Graph Path 解析最終 DbModel 型別，並加入該 Graph 的完整查詢欄位。
    /// </summary>
    private void AddMappedGraphFields(string rootPath, List<string> result, HashSet<Type> graphPath, bool includeReferenceDetails)
    {
        string[] parts = rootPath.Split('.', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return;
        Type currentType = GraphRepo.RootDbModelType;
        string prefix = string.Empty;
        foreach (string part in parts)
        {
            PropertyInfo? property = ModelMetadata.GetProperty(currentType, part);
            if (property == null) return;
            Type? childType = GetGraphPropertyType(property);
            if (childType == null) return;
            prefix += part + ".";
            currentType = childType;
        }
        if (!GraphRepo.ContainsRepo(currentType)) return;
        AddFields(currentType, prefix, result, graphPath, includeReferenceDetails);
    }
    /// <summary>
    /// 遞迴加入目前 Entity 的 Scalar 與 Aggregate Detail 欄位。
    /// </summary>
    private void AddFields(Type modelType, string prefix, List<string> result, HashSet<Type> graphPath, bool includeReferenceDetails)
    {
        if (!graphPath.Add(modelType)) return;
        foreach (PropertyInfo property in ModelMetadata.GetProperties(modelType))
            AddField(property, prefix, result, graphPath, includeReferenceDetails);
        graphPath.Remove(modelType);
    }
    /// <summary>
    /// 加入單一 Scalar，或繼續展開 Aggregate Detail Graph。
    /// </summary>
    private void AddField(PropertyInfo property, string prefix, List<string> result, HashSet<Type> graphPath, bool includeReferenceDetails)
    {
        if (!property.CanWrite) return;
        Type? childType = GetGraphPropertyType(property);
        if (childType == null)
        {
            if (IsSelectableScalar(property)) result.Add(prefix + property.Name);
            return;
        }
        if (!IsSelectableDetail(property, childType, includeReferenceDetails)) return;
        AddFields(childType, prefix + property.Name + ".", result, graphPath, includeReferenceDetails);
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
    /// 判斷 Navigation 是否為目前查詢可展開的 Aggregate Detail。
    /// </summary>
    private bool IsSelectableDetail(PropertyInfo property, Type childType, bool includeReferenceDetails)
    {
        if (!property.IsDefined(typeof(InversePropertyAttribute), true)) return false;
        if (!LibApiFieldPolicyHelper.CanRead(property)) return false;
        if (!GraphRepo.ContainsRepo(childType)) return false;
        return includeReferenceDetails || IsCollection(property.PropertyType);
    }
    /// <summary>
    /// 判斷型別是否為集合，但排除字串與位元組陣列。
    /// </summary>
    private static bool IsCollection(Type type)
    {
        return type != typeof(string)
            && type != typeof(byte[])
            && typeof(IEnumerable).IsAssignableFrom(type);
    }
    /// <summary>
    /// 取得 Property 對應的 DbModel 或集合元素型別。
    /// </summary>
    private static Type? GetGraphPropertyType(PropertyInfo property)
    {
        Type propertyType = property.PropertyType;
        if (typeof(DbModel).IsAssignableFrom(propertyType)) return propertyType;
        if (propertyType == typeof(string) || propertyType == typeof(byte[])) return null;
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
