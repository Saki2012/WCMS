using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Runtime;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write;

/// <summary>
/// 比對並同步 Form Aggregate 的 Detail / SubDetail 新增、修改與刪除。
/// </summary>
internal sealed class FormAggregateSynchronizer<TFormModel>(FormGraphCollector<TFormModel> graphCollector, ModelTypeMetadataCache modelMetadata, PropertyAccessorCache propertyAccessor, Func<Type, object> repoResolver)
    where TFormModel : class
{
    #region Property
    private FormGraphCollector<TFormModel> GraphCollector { get; } = graphCollector;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    private Func<Type, object> RepoResolver { get; } = repoResolver;
    #endregion

    #region Internal
    /// <summary>
    /// 同步 Aggregate 內所有 Detail / SubDetail。
    /// </summary>
    internal async Task SyncAsync(TFormModel oldData, TFormModel newData, CancellationToken ct)
    {
        Dictionary<Type, List<object>> oldItems =
            GraphCollector.CollectDetailItemsByType(oldData);
        Dictionary<Type, List<object>> newItems =
            GraphCollector.CollectDetailItemsByType(newData);
        foreach (Type type in oldItems.Keys.Union(newItems.Keys))
            await SyncTypeAsync(type, oldItems.GetValueOrDefault(type) ?? [], newItems.GetValueOrDefault(type) ?? [], ct);
    }
    #endregion

    #region Private
    /// <summary>
    /// 同步單一 Detail 型別資料。
    /// </summary>
    private async Task SyncTypeAsync(Type type, List<object> oldItems, List<object> newItems, CancellationToken ct)
    {
        dynamic repo = RepoResolver(type);
        PropertyInfo[] keyProperties = ModelMetadata.GetAttrProperties(type, typeof(System.ComponentModel.DataAnnotations.KeyAttribute));
        HashSet<string> keyNames = [.. keyProperties.Select(item => item.Name)];
        List<PropertyInfo> compareProperties = [.. ModelMetadata.GetProperties(type)
            .Where(property => !keyNames.Contains(property.Name))];
        Dictionary<string, object> oldByKey = BuildItemMap(oldItems, keyProperties);
        Dictionary<string, object> newByKey = BuildItemMap(newItems, keyProperties);
        await UpdateExistingAsync(repo, oldByKey, newByKey, compareProperties, ct);
        await DeleteRemovedAsync(repo, oldByKey, newByKey, ct);
        await CreateAddedAsync(repo, oldByKey, newByKey, ct);
    }
    /// <summary>
    /// 依複合 Key 建立 Detail 對照表。
    /// </summary>
    private Dictionary<string, object> BuildItemMap(IEnumerable<object> items, IEnumerable<PropertyInfo> keyProperties)
    {
        return items.ToDictionary(item => BuildKey(item, keyProperties));
    }
    /// <summary>
    /// 更新前後內容不同的既有 Detail。
    /// </summary>
    private async Task UpdateExistingAsync(dynamic repo, Dictionary<string, object> oldItems, Dictionary<string, object> newItems, IReadOnlyList<PropertyInfo> compareProperties, CancellationToken ct)
    {
        foreach (string key in oldItems.Keys.Intersect(newItems.Keys))
        {
            if (!HasDifferentValue(oldItems[key], newItems[key], compareProperties)) continue;
            dynamic oldItem = oldItems[key];
            dynamic newItem = newItems[key];
            await repo.UpdateAsync(oldItem, newItem, ct);
        }
    }
    /// <summary>
    /// 刪除新資料中已不存在的 Detail。
    /// </summary>
    private static async Task DeleteRemovedAsync(dynamic repo, Dictionary<string, object> oldItems, Dictionary<string, object> newItems, CancellationToken ct)
    {
        foreach (string key in oldItems.Keys.Except(newItems.Keys))
        {
            dynamic oldItem = oldItems[key];

            await repo.DeleteAsync(oldItem, ct);
        }
    }
    /// <summary>
    /// 新增舊資料中不存在的 Detail。
    /// </summary>
    private static async Task CreateAddedAsync(dynamic repo, Dictionary<string, object> oldItems, Dictionary<string, object> newItems, CancellationToken ct)
    {
        foreach (string key in newItems.Keys.Except(oldItems.Keys))
        {
            dynamic newItem = newItems[key];

            await repo.CreateAsync(newItem, ct);
        }
    }
    /// <summary>
    /// 建立 Detail 複合 Key 字串。
    /// </summary>
    private string BuildKey(object item, IEnumerable<PropertyInfo> keyProperties)
    {
        return string.Join("|", keyProperties.Select(property => PropertyAccessor.Get(item, property.Name)?.ToString() ?? "null"));
    }
    /// <summary>
    /// 判斷非主鍵欄位是否有變更。
    /// </summary>
    private bool HasDifferentValue(object oldItem, object newItem, IEnumerable<PropertyInfo> properties)
    {
        foreach (PropertyInfo property in properties)
            if (!Equals(PropertyAccessor.Get(oldItem, property.Name), PropertyAccessor.Get(newItem, property.Name)))
                return true;
        return false;
    }
    #endregion
}
