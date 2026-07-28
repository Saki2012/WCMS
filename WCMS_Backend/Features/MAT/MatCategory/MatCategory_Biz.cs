using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using WCMS.SysCore;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MatCategory Biz
/// </summary>
[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory)]
public class MatCategoryBiz(BizDeps bizDeps) : CategoryBizBase<MatCategoryDataSet>(bizDeps)
{
    #region Protected Virtual
    /// <summary>
    /// 儲存前統一整理物件欄位排序序號。
    /// </summary>
    protected override async Task BeforeUpdate(MatCategoryDataSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                NormalizeInfoFieldRowNo(set.MatCategoryInfoField);
                break;  
        }
    }
    #endregion

    #region Private
    /// <summary>
    /// 依現有 RowNo 排序後重排為連續序號，重複時以 RowId 維持穩定順序。
    /// </summary>
    private static void NormalizeInfoFieldRowNo(IList<MatCategoryInfoField> rows)
    {
        var orderedRows = rows.OrderBy(row => row.RowNo).ThenBy(row => row.RowId).ToList();
        for (int index = 0; index < orderedRows.Count; index++) orderedRows[index].RowNo = index + 1;
    }
    #endregion
}