using System.Collections;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Api.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Base;
using WCMS.SysCore.FeatureDriver.Model.MetaData;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
namespace WCMS.SysCore.FeatureDriver.Model.Form;

/// <summary>
/// Form Model 模型顯示名稱。
/// </summary>
/// <typeparam name="TFormModel">外部 API Form Model 型別。</typeparam>
public class ModelDisplay<TFormModel> where TFormModel : IFormModel
{
    #region Property
    /// <summary>
    /// Form Model 與 Detail Graph 欄位描述。
    /// </summary>
    public ModelMetadata Model
    {
        get
        {
            var result = new ModelMetadata
            {
                ModelId = typeof(TFormModel).Name,
                ModelDisplayName = I18nCache.GetLabel<TFormModel>(),
                Tables = []
            };
            if (typeof(DbModel).IsAssignableFrom(typeof(TFormModel))) AddTable(result.Tables, typeof(TFormModel), ResolveTableId(typeof(TFormModel)));
            else AddFormTables(result.Tables);
            return result;
        }
    }

    public class ModelMetadata
    {
        public string ModelId { get; set; }
        public string ModelDisplayName { get; set; }
        public List<TableMetadata> Tables { get; set; } = [];
    }
    public class TableMetadata
    {
        public string TableId { get; set; }
        public string TableDisplayName { get; set; }
        public List<ColumnMetadata> Columns { get; set; } = [];
    }
    public class ColumnMetadata
    {
        public string ColumnId { get; set; }
        public string ColumnDisplayName { get; set; }
    }
    #endregion

    #region Private
    /// <summary>
    /// 加入組合式 Form Model 明確宣告的 Root 與 Graph 資料表。
    /// </summary>
    private static void AddFormTables(List<TableMetadata> tables)
    {
        foreach (PropertyInfo prop in PropertyAccessorCache.GetProperties(typeof(TFormModel)))
        {
            bool isRoot = prop.IsDefined(typeof(FormRootAttribute), true);
            bool isGraph = prop.IsDefined(typeof(FormGraphPathAttribute), true);
            if (!isRoot && !isGraph) continue;
            Type? modelType = GetListItemType(prop.PropertyType) ?? prop.PropertyType;
            if (typeof(DbModel).IsAssignableFrom(modelType)) AddTable(tables, modelType, ResolveTableId(prop));
        }
    }
    /// <summary>
    /// 加入目前型別的欄位表，並遞迴加入 Detail 集合表。
    /// </summary>
    private static void AddTable(List<TableMetadata> tables, Type modelType, string tableId)
    {
        if (tables.Any(p => p.TableId == tableId)) return;
        TableMetadata table = BuildTable(modelType, tableId);
        tables.Add(table);
        foreach (var prop in PropertyAccessorCache.GetProperties(modelType).Where(p => IsListType(p.PropertyType) && !LibApiFieldPolicyHelper.ShouldHideFromSchema(p)))
        {
            Type? itemType = GetListItemType(prop.PropertyType);
            if (itemType == null) continue;
            AddTable(tables, itemType, ResolveTableId(prop));
        }
    }

    /// <summary>
    /// 建立單一資料表欄位描述。
    /// </summary>
    private static TableMetadata BuildTable(Type modelType, string tableId)
    {
        TableMetadata result = new() { TableId = tableId, TableDisplayName = I18nCache.GetLabel(modelType), Columns = [] };
        foreach (var prop in PropertyAccessorCache.GetProperties(modelType).Where(p => !IsListType(p.PropertyType) && !LibApiFieldPolicyHelper.ShouldHideFromSchema(p)))
        {
            result.Columns.Add(new ColumnMetadata() { ColumnId = prop.Name, ColumnDisplayName = I18nCache.GetLabel(prop) });
        }
        return result;
    }

    /// <summary>
    /// 解析 Root Header 的 TableId。
    /// </summary>
    private static string ResolveTableId(Type type)
    {
        return TrimModelSuffix(type.Name);
    }

    /// <summary>
    /// 解析 Detail 集合的 TableId。
    /// </summary>
    private static string ResolveTableId(PropertyInfo prop)
    {
        return prop.Name.TrimStart('_');
    }

    /// <summary>
    /// 移除常見 Model 後綴。
    /// </summary>
    private static string TrimModelSuffix(string name)
    {
        return name.EndsWith("Model", StringComparison.Ordinal) ? name[..^"Model".Length] : name;
    }

    /// <summary>
    /// 判斷型別是否為集合。
    /// </summary>
    private static bool IsListType(Type type)
    {
        if (type == typeof(string) || type == typeof(byte[])) return false;
        return typeof(IEnumerable).IsAssignableFrom(type);
    }

    /// <summary>
    /// 取得集合項目型別。
    /// </summary>
    private static Type? GetListItemType(Type type)
    {
        if (type == typeof(string) || type == typeof(byte[])) return null;
        if (type.IsArray) return type.GetElementType();
        if (type.IsGenericType) return type.GetGenericArguments().FirstOrDefault();
        return type.GetInterfaces().FirstOrDefault(p => p.IsGenericType && p.GetGenericTypeDefinition() == typeof(IEnumerable<>))?.GetGenericArguments().FirstOrDefault();
    }
    #endregion
}