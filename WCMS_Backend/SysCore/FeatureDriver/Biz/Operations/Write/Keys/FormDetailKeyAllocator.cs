using System.Collections;
using WCMS.SysCore.FeatureDriver.Model.Base;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;

/// <summary>
/// 分配 Form Aggregate 內標準 Detail / SubDetail 的 RowId。
/// </summary>
internal static class FormDetailKeyAllocator
{
    #region Internal
    /// <summary>
    /// 依既有與送入資料的最大 RowId，補齊尚未設定的明細主鍵。
    /// </summary>
    internal static void AllocateMissingRowIds(
        IEnumerable<IList> detailLists,
        IEnumerable<IList>? existingDetailLists = null)
    {
        List<IList> lists = [.. detailLists];
        Dictionary<Type, int> nextRowIds = BuildNextRowIds(
            lists,
            existingDetailLists ?? Array.Empty<IList>());
        foreach (IList rows in lists)
            AllocateList(rows, nextRowIds);
    }
    #endregion

    #region Private
    /// <summary>
    /// 依明細實際型別建立下一個可使用的 RowId。
    /// </summary>
    private static Dictionary<Type, int> BuildNextRowIds(
        IEnumerable<IList> newLists,
        IEnumerable<IList> existingLists)
    {
        Dictionary<Type, int> result = [];
        foreach (FormDetailModel row in EnumerateRows(existingLists))
            RegisterRowId(result, row);
        foreach (FormDetailModel row in EnumerateRows(newLists))
            RegisterRowId(result, row);
        return result;
    }

    /// <summary>
    /// 將單筆既有 RowId 納入型別最大值計算。
    /// </summary>
    private static void RegisterRowId(
        Dictionary<Type, int> nextRowIds,
        FormDetailModel row)
    {
        if (row.RowId <= 0) return;
        Type rowType = row.GetType();
        int nextRowId = row.RowId + 1;
        if (!nextRowIds.TryGetValue(rowType, out int current)
            || nextRowId > current)
            nextRowIds[rowType] = nextRowId;
    }

    /// <summary>
    /// 依集合順序配置缺少的 RowId，並維持同型別單調遞增。
    /// </summary>
    private static void AllocateList(
        IList rows,
        Dictionary<Type, int> nextRowIds)
    {
        foreach (object? item in rows)
        {
            if (item is not FormDetailModel row || row.RowId > 0) continue;
            Type rowType = row.GetType();
            int nextRowId = nextRowIds.GetValueOrDefault(rowType, 1);
            row.RowId = nextRowId;
            nextRowIds[rowType] = nextRowId + 1;
        }
    }

    /// <summary>
    /// 從多個 Graph 集合展開所有標準表單明細。
    /// </summary>
    private static IEnumerable<FormDetailModel> EnumerateRows(
        IEnumerable<IList> detailLists)
    {
        foreach (IList rows in detailLists)
            foreach (object? item in rows)
                if (item is FormDetailModel row)
                    yield return row;
    }
    #endregion
}
