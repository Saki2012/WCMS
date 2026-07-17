using System.Collections;
using WCMS.SysCore.FeatureDriver.Model.Base;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;

/// <summary>
/// 補齊 Form Aggregate 內標準 Detail / SubDetail 的 RowNo。
/// </summary>
internal static class FormDetailRowNoAllocator
{
    #region Internal
    /// <summary>
    /// 逐一整理每個明細集合缺少或重複的 RowNo。
    /// </summary>
    internal static void AllocateMissingRowNos(
        IEnumerable<IList> detailLists)
    {
        foreach (IList rows in detailLists)
            AllocateList(rows);
    }
    #endregion

    #region Private
    /// <summary>
    /// 保留第一個有效序號，並依集合順序補齊其餘序號。
    /// </summary>
    private static void AllocateList(IList rows)
    {
        List<FormDetailModel> pendingRows = [];
        HashSet<int> usedRowNos = [];
        foreach (object? item in rows)
        {
            if (item is not FormDetailModel row) continue;
            if (row.RowNo > 0 && usedRowNos.Add(row.RowNo)) continue;
            pendingRows.Add(row);
        }
        AssignPendingRowNos(pendingRows, usedRowNos);
    }

    /// <summary>
    /// 由最小可用正整數開始配置尚未確定的 RowNo。
    /// </summary>
    private static void AssignPendingRowNos(
        IEnumerable<FormDetailModel> pendingRows,
        HashSet<int> usedRowNos)
    {
        int nextRowNo = 1;
        foreach (FormDetailModel row in pendingRows)
        {
            while (usedRowNos.Contains(nextRowNo)) nextRowNo++;
            row.RowNo = nextRowNo;
            usedRowNos.Add(nextRowNo++);
        }
    }
    #endregion
}
