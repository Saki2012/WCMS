using System.Collections;
using System.ComponentModel.DataAnnotations.Schema;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;

namespace WCMS.SysCore;

/// <summary>
/// 表單 Graph Root / Detail / SubDetail Repository Scope。
/// </summary>
public class FormGraphRepoScope<TFormModel> : IFormGraphRepoScope<TFormModel> where TFormModel : class
{
    #region Property
    private readonly IDbRepositoryProvider _dbRepositoryProvider;
    private readonly Dictionary<string, object> _repos = [];
    /// <summary>
    /// 表單 Root DbModel 型別。
    /// </summary>
    public Type RootDbModelType { get; }
    /// <summary>
    /// 表單 Root DbModel 的 Repository。
    /// </summary>
    public object RootRepo { get; }
    /// <summary>
    /// Root Repository 使用的 DbContext。
    /// </summary>
    public ApplicationDbContext DataAccess => ((dynamic)RootRepo).DataAccess;
    /// <summary>
    /// 表單 Graph 內 Root / Detail / SubDetail Repository 對照。
    /// </summary>
    public IReadOnlyDictionary<string, object> GraphRepos => _repos;
    #endregion

    #region Public
    /// <summary>
    /// 初始化目前表單 Graph 內的 Repository Scope。
    /// </summary>
    public FormGraphRepoScope(IDbRepositoryProvider dbRepositoryProvider)
    {
        _dbRepositoryProvider = dbRepositoryProvider;
        RootDbModelType = FormModelMetadataResolver.GetRootDbModelType(typeof(TFormModel));
        RootRepo = _dbRepositoryProvider.GetRepo(RootDbModelType);
        AddRepo(RootDbModelType);
        AddFormGraphRepos(typeof(TFormModel), []);
    }
    /// <summary>
    /// 判斷 DB Model 是否屬於目前表單 Graph。
    /// </summary>
    public bool ContainsRepo(Type dbModelType)
    {
        return _repos.ContainsKey(dbModelType.Name);
    }
    /// <summary>
    /// 取得目前表單 Graph 內指定 DB Model 的 Repository。
    /// </summary>
    public object GetRepo(Type dbModelType)
    {
        if (_repos.TryGetValue(dbModelType.Name, out object? repo)) return repo;
        throw new InvalidOperationException($"Model is not in form graph: {dbModelType.FullName}");
    }
    /// <summary>
    /// 取得目前表單 Graph 內指定 DB Model 的 Repository。
    /// </summary>
    public IBasicRepository<TDbModel> GetRepo<TDbModel>() where TDbModel : DbModel
    {
        return (IBasicRepository<TDbModel>)GetRepo(typeof(TDbModel));
    }
    #endregion

    #region Private
    /// <summary>
    /// 解析 Form Model 明確持有的 Root 與 Graph Property。
    /// </summary>
    private void AddFormGraphRepos(Type formModelType, HashSet<Type> visited)
    {
        if (typeof(DbModel).IsAssignableFrom(formModelType))
        {
            AddDbGraphRepos(formModelType, visited);
            return;
        }
        foreach (PropertyInfo prop in formModelType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            Type? childType = GetFormGraphChildType(prop);
            if (childType == null) continue;
            AddRepo(childType);
            AddDbGraphRepos(childType, visited);
        }
    }
    /// <summary>
    /// 遞迴加入 DbModel 的 InverseProperty Detail / SubDetail Repository。
    /// </summary>
    private void AddDbGraphRepos(Type modelType, HashSet<Type> visited)
    {
        if (!visited.Add(modelType)) return;
        foreach (PropertyInfo prop in modelType.GetProperties(BindingFlags.Public | BindingFlags.Instance))
        {
            Type? childType = GetDbGraphChildType(prop);
            if (childType == null) continue;
            AddRepo(childType);
            AddDbGraphRepos(childType, visited);
        }
    }
    /// <summary>
    /// 加入單一 DB Model Repository。
    /// </summary>
    private void AddRepo(Type dbModelType)
    {
        if (_repos.ContainsKey(dbModelType.Name)) return;
        _repos[dbModelType.Name] = _dbRepositoryProvider.GetRepo(dbModelType);
    }
    /// <summary>
    /// 取得 Form Model 明確宣告的 Graph 子節點型別。
    /// </summary>
    private static Type? GetFormGraphChildType(PropertyInfo prop)
    {
        bool isRoot = prop.IsDefined(typeof(FormRootAttribute), true);
        bool isGraph = prop.IsDefined(typeof(FormGraphPathAttribute), true);
        if (!isRoot && !isGraph) return null;
        Type? listItemType = GetListItemType(prop.PropertyType);
        if (listItemType != null && typeof(DbModel).IsAssignableFrom(listItemType)) return listItemType;
        return typeof(DbModel).IsAssignableFrom(prop.PropertyType) ? prop.PropertyType : null;
    }
    /// <summary>
    /// 取得 DbModel 的 Aggregate Graph 子節點型別。
    /// </summary>
    private static Type? GetDbGraphChildType(PropertyInfo prop)
    {
        if (prop.GetCustomAttribute<InversePropertyAttribute>() == null) return null;
        if (LibApiFieldPolicyHelper.ShouldHideFromSchema(prop)) return null;
        Type? listItemType = GetListItemType(prop.PropertyType);
        if (listItemType != null && typeof(DbModel).IsAssignableFrom(listItemType)) return listItemType;
        return typeof(DbModel).IsAssignableFrom(prop.PropertyType) ? prop.PropertyType : null;
    }
    /// <summary>
    /// 取得集合元素型別。
    /// </summary>
    private static Type? GetListItemType(Type type)
    {
        if (type == typeof(string) || type == typeof(byte[])) return null;
        if (!typeof(IEnumerable).IsAssignableFrom(type)) return null;
        if (type.IsArray) return type.GetElementType();
        if (type.IsGenericType) return type.GetGenericArguments().FirstOrDefault();
        return type.GetInterfaces().FirstOrDefault(IsEnumerableInterface)?.GetGenericArguments().FirstOrDefault();
    }
    /// <summary>
    /// 判斷是否為 IEnumerable 泛型介面。
    /// </summary>
    private static bool IsEnumerableInterface(Type type)
    {
        return type.IsGenericType && type.GetGenericTypeDefinition() == typeof(IEnumerable<>);
    }
    #endregion
}
