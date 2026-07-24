using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Metadata;
using System.Globalization;
using System.Reflection;

namespace WCMS.SysCore.Persistence.Normalization;

/// <summary>
/// 統一正規化並驗證 EF 字串外鍵，避免空白與隱藏字元進入關聯欄位。
/// </summary>
internal static class StringForeignKeyValueNormalizer
{
    #region Internal
    /// <summary>
    /// 正規化尚未寫入 Repository 的 Aggregate Entity。
    /// </summary>
    internal static void NormalizeEntities(DbContext db, IEnumerable<object> entities)
    {
        HashSet<object> visited = new(ReferenceEqualityComparer.Instance);
        foreach (object entity in entities)
        {
            if (!visited.Add(entity)) continue;
            NormalizeEntity(db, entity);
        }
    }
    /// <summary>
    /// 正規化目前 DbContext 中即將新增或修改的 Entity。
    /// </summary>
    internal static void NormalizeTrackedEntries(DbContext db)
    {
        IEnumerable<EntityEntry> entries = db.ChangeTracker.Entries()
            .Where(entry => entry.State is EntityState.Added or EntityState.Modified);
        foreach (EntityEntry entry in entries) NormalizeEntry(entry);
    }
    #endregion

    #region Private
    /// <summary>
    /// 正規化單一尚未追蹤 Entity 的字串外鍵。
    /// </summary>
    private static void NormalizeEntity(DbContext db, object entity)
    {
        IEntityType? entityType = ResolveEntityType(db, entity.GetType());
        if (entityType == null) return;
        foreach (IProperty property in GetStringForeignKeyProperties(entityType))
            NormalizeClrProperty(entityType, property, entity);
    }
    /// <summary>
    /// 正規化單一已追蹤 Entity 的字串外鍵。
    /// </summary>
    private static void NormalizeEntry(EntityEntry entry)
    {
        IEntityType entityType = entry.Metadata;
        foreach (IProperty property in GetStringForeignKeyProperties(entityType))
        {
            PropertyEntry propertyEntry = entry.Property(property.Name);
            string? current = propertyEntry.CurrentValue as string;
            string? normalized = NormalizeValue(entityType, property, current);
            if (!string.Equals(current, normalized, StringComparison.Ordinal))
                propertyEntry.CurrentValue = normalized;
        }
    }
    /// <summary>
    /// 以 CLR Property 讀寫尚未進入 ChangeTracker 的外鍵值。
    /// </summary>
    private static void NormalizeClrProperty(IEntityType entityType, IProperty property, object entity)
    {
        PropertyInfo? propertyInfo = property.PropertyInfo;
        if (propertyInfo?.CanRead != true || propertyInfo.CanWrite != true) return;
        string? current = propertyInfo.GetValue(entity) as string;
        string? normalized = NormalizeValue(entityType, property, current);
        if (!string.Equals(current, normalized, StringComparison.Ordinal))
            propertyInfo.SetValue(entity, normalized);
    }
    /// <summary>
    /// 解析 Entity 實際對應的 EF Metadata，並相容 Proxy 型別。
    /// </summary>
    private static IEntityType? ResolveEntityType(DbContext db, Type runtimeType)
    {
        IEntityType? direct = db.Model.FindEntityType(runtimeType);
        if (direct != null) return direct;
        return db.Model.GetEntityTypes()
            .FirstOrDefault(item => item.ClrType.IsAssignableFrom(runtimeType));
    }
    /// <summary>
    /// 取得 Entity 中不重複的字串 Foreign Key Property。
    /// </summary>
    private static IProperty[] GetStringForeignKeyProperties(IEntityType entityType)
    {
        return [.. entityType.GetForeignKeys()
            .SelectMany(foreignKey => foreignKey.Properties)
            .Where(property => property.ClrType == typeof(string))
            .GroupBy(property => property.Name, StringComparer.Ordinal)
            .Select(group => group.First())];
    }
    /// <summary>
    /// 依 Nullable 與字元安全規則正規化單一字串外鍵。
    /// </summary>
    private static string? NormalizeValue(IEntityType entityType, IProperty property, string? value)
    {
        if (value == null)
        {
            if (property.IsNullable) return null;
            throw CreateValidationException(entityType, property, "必要外鍵不可為 null");
        }
        if (value.Length == 0) return property.IsNullable ? null : string.Empty;
        if (string.IsNullOrWhiteSpace(value))
        {
            if (property.IsNullable) return null;
            throw CreateValidationException(entityType, property, "必要外鍵不可只包含空白");
        }
        if (HasOuterWhitespace(value))
            throw CreateValidationException(entityType, property, "外鍵前後不可包含空白");
        if (value.Any(IsUnsafeIdentifierCharacter))
            throw CreateValidationException(entityType, property, "外鍵不可包含控制或隱藏格式字元");
        return value;
    }
    /// <summary>
    /// 判斷識別值開頭或結尾是否含有空白字元。
    /// </summary>
    private static bool HasOuterWhitespace(string value)
    {
        return char.IsWhiteSpace(value[0]) || char.IsWhiteSpace(value[^1]);
    }
    /// <summary>
    /// 判斷是否為控制字元或 Unicode 隱藏格式字元。
    /// </summary>
    private static bool IsUnsafeIdentifierCharacter(char value)
    {
        UnicodeCategory category = char.GetUnicodeCategory(value);
        return char.IsControl(value) || category == UnicodeCategory.Format;
    }
    /// <summary>
    /// 建立不含原始輸入值的安全驗證例外。
    /// </summary>
    private static ForeignKeyValueValidationException CreateValidationException(IEntityType entityType, IProperty property, string reason)
    {
        return new ForeignKeyValueValidationException(entityType.ClrType.Name, property.Name, reason);
    }
    #endregion
}

/// <summary>
/// 表示字串外鍵含有不可接受的空白或隱藏字元。
/// </summary>
internal sealed class ForeignKeyValueValidationException : InvalidOperationException
{
    #region Property
    /// <summary>
    /// 發生錯誤的 Entity 名稱。
    /// </summary>
    internal string EntityName { get; }
    /// <summary>
    /// 發生錯誤的 Property 名稱。
    /// </summary>
    internal string PropertyName { get; }
    #endregion

    #region Public
    /// <summary>
    /// 建立不攜帶原始輸入值的外鍵驗證例外。
    /// </summary>
    internal ForeignKeyValueValidationException(string entityName, string propertyName, string reason)
        : base($"Invalid string foreign key: {entityName}.{propertyName}. {reason}.")
    {
        EntityName = entityName;
        PropertyName = propertyName;
    }
    #endregion
}
