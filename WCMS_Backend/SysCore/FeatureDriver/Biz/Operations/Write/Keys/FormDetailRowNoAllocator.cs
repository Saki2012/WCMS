using System.Collections;
using WCMS.SysCore.FeatureDriver.Model.Base;

namespace WCMS.SysCore.FeatureDriver.Biz.Operations.Write.Keys;

/// <summary>
/// 正規化 Form Aggregate 內標準 Detail / SubDetail 的 RowNo。
/// </summary>
internal static class FormDetailRowNoAllocator
{
    #region Internal
    /// <summary>
    /// 依每個父層明細集合分別重排連續 RowNo。
    /// </summary>
    internal static void NormalizeRowNos(IEnumerable<IList> detailLists)
    {
        foreach (IList rows in detailLists)
            NormalizeList(rows);
    }
    #endregion

    #region Private
    /// <summary>
    /// 依原 RowNo、RowId 穩定排序後重新配置 1 至 N。
    /// </summary>
    private static void NormalizeList(IList rows)
    {
        List<FormDetailModel> ordered = [.. rows
            .OfType<FormDetailModel>()
            .OrderBy(row => row.RowNo > 0 ? row.RowNo : int.MaxValue)
            .ThenBy(row => row.RowId)];
        for (int index = 0; index < ordered.Count; index++)
            ordered[index].RowNo = index + 1;
    }
    #endregion
}
