using System.Collections;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Repo.Graph;
using WCMS.SysCore.FeatureDriver.Runtime;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write;

/// <summary>
/// 解析與遍歷 Form Aggregate 內的 Root、Detail 與 SubDetail。
/// </summary>
internal sealed class FormGraphCollector<TFormModel>(
    FormGraphRepoScope<TFormModel> graphRepo,
    ModelTypeMetadataCache modelMetadata,
    PropertyAccessorCache propertyAccessor)
    where TFormModel : class
{
    #region Property
    private FormGraphRepoScope<TFormModel> GraphRepo { get; } = graphRepo;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    #endregion

    #region Internal
    /// <summary>
    /// 取得 Form Aggregate 的 Header Root。
    /// </summary>
    internal HeaderModel GetHeader(TFormModel data)
    {
        DbModel rootModel = FormModelMetadataResolver.GetRootModel(data);
        return rootModel as HeaderModel ?? throw new InvalidOperationException($"Root DbModel must inherit HeaderModel: {rootModel.GetType().FullName}");
    }
    /// <summary>
    /// 取得 Form Aggregate 內所有 Detail / SubDetail 集合。
    /// </summary>
    internal IReadOnlyList<IList> CollectDetailCollections(TFormModel data)
    {
        return [.. CollectDetailLists(data).Select(item => item.Items)];
    }
    /// <summary>
    /// 收集聚合內所有 Detail / SubDetail 資料。
    /// </summary>
    internal List<object> CollectDetailItems(object source)
    {
        List<object> result = [];
        foreach ((string _, IList items) in CollectDetailLists(source))
            foreach (object item in items)
                if (item != null) result.Add(item);
        return result;
    }
    /// <summary>
    /// 依型別收集聚合內所有 Detail / SubDetail 資料。
    /// </summary>
    internal Dictionary<Type, List<object>> CollectDetailItemsByType(
        object source)
    {
        Dictionary<Type, List<object>> result = [];
        foreach (object item in CollectDetailItems(source))
        {
            Type type = item.GetType();
            if (!result.TryGetValue(type, out List<object>? list))
                result[type] = list = [];
            list.Add(item);
        }
        return result;
    }
    #endregion

    #region Private
    /// <summary>
    /// 收集目前 Form Graph 內所有集合屬性。
    /// </summary>
    private List<(string Name, IList Items)> CollectDetailLists(object source)
    {
        List<(string Name, IList Items)> result = [];
        CollectDetailListsCore(source, result, [], []);
        return result;
    }
    /// <summary>
    /// 依 Form Model 與 InverseProperty 規則遞迴收集 Graph 集合。
    /// </summary>
    private void CollectDetailListsCore(
        object source,
        List<(string Name, IList Items)> result,
        HashSet<object> visitedModels,
        HashSet<object> visitedLists)
    {
        if (source == null || !visitedModels.Add(source)) return;
        bool isFormContainer = source.GetType() == typeof(TFormModel)
            && source is not DbModel;
        foreach (PropertyInfo prop in ModelMetadata.GetProperties(source.GetType()))
            CollectProperty(
                source,
                prop,
                isFormContainer,
                result,
                visitedModels,
                visitedLists);
    }
    /// <summary>
    /// 收集單一 Graph Property，並繼續向下遍歷。
    /// </summary>
    private void CollectProperty(
        object source,
        PropertyInfo prop,
        bool isFormContainer,
        List<(string Name, IList Items)> result,
        HashSet<object> visitedModels,
        HashSet<object> visitedLists)
    {
        Type? childType = GetGraphPropertyType(prop);
        if (childType == null || !GraphRepo.ContainsRepo(childType)) return;
        object? value = PropertyAccessor.Get(source, prop.Name);
        if (value is IList list
            && (isFormContainer
                || prop.IsDefined(typeof(InversePropertyAttribute), true)))
        {
            CollectList(
                prop.Name,
                list,
                result,
                visitedModels,
                visitedLists);
            return;
        }
        if (isFormContainer && value is DbModel childModel)
            CollectDetailListsCore(
                childModel,
                result,
                visitedModels,
                visitedLists);
    }
    /// <summary>
    /// 加入一個 Detail 集合並遞迴處理集合內容。
    /// </summary>
    private void CollectList(
        string name,
        IList list,
        List<(string Name, IList Items)> result,
        HashSet<object> visitedModels,
        HashSet<object> visitedLists)
    {
        if (visitedLists.Add(list)) result.Add((name, list));
        foreach (object item in list)
            CollectDetailListsCore(
                item,
                result,
                visitedModels,
                visitedLists);
    }
    /// <summary>
    /// 取得 Property 對應的 DbModel 或集合元素型別。
    /// </summary>
    private static Type? GetGraphPropertyType(PropertyInfo prop)
    {
        Type propertyType = prop.PropertyType;
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
