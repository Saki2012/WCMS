using System.Collections;
using System.ComponentModel.DataAnnotations;
using System.Linq.Expressions;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Biz.Operations.Write;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Runtime;
using WCMS.SysCore.Persistence;
using WCMS.SysCore.Persistence.Normalization;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;

/// <summary>
/// 協調 Header 業務編號、Root Key 傳遞與 Detail RowId 分配。
/// </summary>
internal sealed class FormAggregateKeyCoordinator<TFormModel>(
    Type rootDbModelType,
    FormGraphCollector<TFormModel> graphCollector,
    ModelTypeMetadataCache modelMetadata,
    PropertyAccessorCache propertyAccessor,
    Func<Type, object> repoResolver,
    Func<string> prefixAccessor,
    Func<bool> autoGenerateAccessor)
    where TFormModel : class
{
    #region Property
    private Type RootDbModelType { get; } = rootDbModelType;
    private FormGraphCollector<TFormModel> GraphCollector { get; } = graphCollector;
    private ModelTypeMetadataCache ModelMetadata { get; } = modelMetadata;
    private PropertyAccessorCache PropertyAccessor { get; } = propertyAccessor;
    private Func<Type, object> RepoResolver { get; } = repoResolver;
    private Func<string> PrefixAccessor { get; } = prefixAccessor;
    private Func<bool> AutoGenerateAccessor { get; } = autoGenerateAccessor;
    #endregion

    #region Internal
    /// <summary>
    /// 建立時準備 Header 業務編號、RowId 與 RowNo。
    /// </summary>
    internal async Task PrepareAsync(
        HeaderModel header,
        IReadOnlyList<IList> detailLists,
        CancellationToken ct)
    {
        await PrepareAsync(header, detailLists, Array.Empty<IList>(), ct);
    }

    /// <summary>
    /// 更新時依既有明細保留 RowId 單調遞增，並補齊 RowNo。
    /// </summary>
    internal async Task PrepareAsync(
        HeaderModel header,
        IReadOnlyList<IList> detailLists,
        IReadOnlyList<IList> existingDetailLists,
        CancellationToken ct)
    {
        NormalizeForeignKeyValues(header, detailLists);
        await EnsureBusinessIdAsync(header, detailLists, ct);
        FormDetailKeyAllocator.AllocateMissingRowIds(
            detailLists,
            existingDetailLists);
        FormDetailRowNoAllocator.AllocateMissingRowNos(detailLists);
    }
    /// <summary>
    /// 保留既有 Root Key，並同步回填新 Graph 的同名關聯鍵。
    /// </summary>
    internal void PreserveExistingKeys(TFormModel oldData, TFormModel newData)
    {
        DbModel oldRoot = FormModelMetadataResolver.GetRootModel(oldData);
        DbModel newRoot = FormModelMetadataResolver.GetRootModel(newData);
        List<object> details = GraphCollector.CollectDetailItems(newData);
        foreach (PropertyInfo key in ModelMetadata.GetAttrProperties(
            RootDbModelType,
            typeof(KeyAttribute)))
            PreserveKey(oldRoot, newRoot, details, key);
    }
    #endregion

    #region Private
    /// <summary>
    /// 在 Feature BeforeUpdate 前正規化 Root、Detail 與 SubDetail 的字串外鍵。
    /// </summary>
    private void NormalizeForeignKeyValues(
        HeaderModel header,
        IReadOnlyList<IList> detailLists)
    {
        List<object> entities = [header];
        foreach (IList rows in detailLists)
            foreach (object? row in rows)
                if (row != null) entities.Add(row);
        dynamic repo = RepoResolver(header.GetType());
        ApplicationDbContext dataAccess = (ApplicationDbContext)repo.DataAccess;
        StringForeignKeyValueNormalizer.NormalizeEntities(dataAccess, entities);
    }
    /// <summary>
    /// 確保 Header 業務編號存在，並同步至所有 Detail。
    /// </summary>
    private async Task EnsureBusinessIdAsync(
        HeaderModel header,
        IReadOnlyList<IList> detailLists,
        CancellationToken ct)
    {
        PropertyInfo? keyProperty = GetHeaderKeyProperty(header);
        if (keyProperty == null) return;
        object? id = PropertyAccessor.Get(header, keyProperty.Name);
        if (ShouldGenerateBusinessId(keyProperty, id))
            id = await GenerateBusinessIdAsync(header.GetType(), keyProperty, ct);
        PropertyAccessor.Set(header, keyProperty.Name, id);
        PropagateHeaderKey(detailLists, keyProperty.Name, id);
    }
    /// <summary>
    /// 判斷目前 Header 是否需要產生字串業務編號。
    /// </summary>
    private bool ShouldGenerateBusinessId(PropertyInfo keyProperty, object? id)
    {
        bool isStringKey = keyProperty.PropertyType == typeof(string);
        return AutoGenerateAccessor()
            && isStringKey
            && string.IsNullOrEmpty(id?.ToString());
    }
    /// <summary>
    /// 依每日前綴與既有最大值產生下一個業務編號。
    /// </summary>
    private async Task<string> GenerateBusinessIdAsync(
        Type modelType,
        PropertyInfo keyProperty,
        CancellationToken ct)
    {
        LambdaExpression selector = BuildIdSelectorLambda(modelType, keyProperty);
        string dailyPrefix = BusinessIdGenerator.BuildDailyPrefix(
            PrefixAccessor(),
            DateTime.Now);
        dynamic repo = RepoResolver(modelType);
        Task<string?> queryTask = (Task<string?>)repo
            .QueryMaxStringValueByPrefixAsync(selector, dailyPrefix, ct);
        string? maxId = await queryTask;
        return BusinessIdGenerator.BuildNextId(dailyPrefix, maxId);
    }
    /// <summary>
    /// 取得 Header 最後一個主鍵欄位，維持既有主鍵判定規則。
    /// </summary>
    private PropertyInfo? GetHeaderKeyProperty(HeaderModel header)
    {
        return ModelMetadata.GetProperties(header.GetType())
            .Where(property => property.IsDefined(typeof(KeyAttribute), true))
            .LastOrDefault();
    }
    /// <summary>
    /// 將 Header 主鍵同步至具有同名欄位的 Detail / SubDetail。
    /// </summary>
    private void PropagateHeaderKey(
        IReadOnlyList<IList> detailLists,
        string keyName,
        object? keyValue)
    {
        foreach (IList rows in detailLists)
            foreach (object? row in rows)
                if (row != null) SetMatchingProperty(row, keyName, keyValue);
    }
    /// <summary>
    /// 保留單一 Root Key 並傳遞至 Detail。
    /// </summary>
    private void PreserveKey(
        DbModel oldRoot,
        DbModel newRoot,
        IEnumerable<object> details,
        PropertyInfo key)
    {
        object? value = PropertyAccessor.Get(oldRoot, key.Name);
        PropertyAccessor.Set(newRoot, key.Name, value);
        foreach (object detail in details)
            SetMatchingProperty(detail, key.Name, value);
    }
    /// <summary>
    /// 回填物件上存在且可寫入的同名 Property。
    /// </summary>
    private void SetMatchingProperty(
        object target,
        string propertyName,
        object? value)
    {
        PropertyInfo? property = ModelMetadata.GetProperty(
            target.GetType(),
            propertyName);
        if (property?.CanWrite == true)
            PropertyAccessor.Set(target, propertyName, value);
    }
    /// <summary>
    /// 建立業務編號欄位 Selector。
    /// </summary>
    private static LambdaExpression BuildIdSelectorLambda(
        Type modelType,
        PropertyInfo property)
    {
        ParameterExpression parameter = Expression.Parameter(modelType, "p");
        Expression access = Expression.Property(parameter, property.Name);
        Expression body = access.Type == typeof(string)
            ? access
            : Expression.Call(access, nameof(object.ToString), Type.EmptyTypes);
        Type delegateType = typeof(Func<,>).MakeGenericType(
            modelType,
            typeof(string));
        return Expression.Lambda(delegateType, body, parameter);
    }
    #endregion
}
