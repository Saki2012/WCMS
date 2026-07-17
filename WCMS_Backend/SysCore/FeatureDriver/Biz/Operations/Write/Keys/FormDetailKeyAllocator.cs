using System.Collections;
using System.Reflection;
using WCMS.SysCore.FeatureDriver.Model.Metadata;
using WCMS.SysCore.FeatureDriver.Runtime;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;

/// <summary>
/// 分配 Form Aggregate 內 Detail / SubDetail 的 RowId。
/// </summary>
internal static class FormDetailKeyAllocator
{
    #region Property
    private const string RowIdPropertyName = "RowId";
    #endregion

    #region Internal
    /// <summary>
    /// 逐一處理 Form Graph 內缺少 RowId 的 Detail 集合。
    /// </summary>
    internal static void AllocateMissingRowIds(
        IEnumerable<IList> detailLists,
        ModelTypeMetadataCache modelMetadata,
        PropertyAccessorCache propertyAccessor)
    {
        foreach (IList rows in detailLists)
            AllocateList(rows, modelMetadata, propertyAccessor);
    }
    #endregion

    #region Private
    /// <summary>
    /// 分配單一 Detail 集合內尚未設定的 RowId。
    /// </summary>
    private static void AllocateList(
        IList rows,
        ModelTypeMetadataCache modelMetadata,
        PropertyAccessorCache propertyAccessor)
    {
        PropertyInfo? rowIdProperty = FindRowIdProperty(rows, modelMetadata);
        if (rowIdProperty == null) return;
        HashSet<int> usedIds = CollectUsedIds(rows, propertyAccessor);
        int nextRowId = 1;
        foreach (object? row in rows)
        {
            if (row == null || ReadRowId(row, propertyAccessor) > 0) continue;
            nextRowId = FindNextAvailableId(usedIds, nextRowId);
            propertyAccessor.Set(row, rowIdProperty.Name, nextRowId);
            usedIds.Add(nextRowId++);
        }
    }
    /// <summary>
    /// 取得集合元素上可自動分配的 RowId 主鍵欄位。
    /// </summary>
    private static PropertyInfo? FindRowIdProperty(
        IList rows,
        ModelTypeMetadataCache modelMetadata)
    {
        object? row = rows.Cast<object?>().FirstOrDefault(item => item != null);
        if (row == null) return null;
        PropertyInfo? property = modelMetadata.GetProperty(row.GetType(), RowIdPropertyName);
        bool isValid = property?.CanRead == true
            && property.CanWrite
            && property.PropertyType == typeof(int);
        return isValid ? property : null;
    }
    /// <summary>
    /// 收集集合內已使用的正整數 RowId。
    /// </summary>
    private static HashSet<int> CollectUsedIds(
        IList rows,
        PropertyAccessorCache propertyAccessor)
    {
        HashSet<int> result = [];
        foreach (object? row in rows)
        {
            int rowId = ReadRowId(row, propertyAccessor);
            if (rowId > 0) result.Add(rowId);
        }
        return result;
    }
    /// <summary>
    /// 讀取 Detail 目前的 RowId；不存在時視為零。
    /// </summary>
    private static int ReadRowId(
        object? row,
        PropertyAccessorCache propertyAccessor)
    {
        if (row == null) return 0;
        object? value = propertyAccessor.Get(row, RowIdPropertyName);
        return value is int rowId ? rowId : 0;
    }
    /// <summary>
    /// 尋找尚未被使用的下一個 RowId。
    /// </summary>
    private static int FindNextAvailableId(HashSet<int> usedIds, int start)
    {
        int result = start;
        while (usedIds.Contains(result)) result++;
        return result;
    }
    #endregion
}
