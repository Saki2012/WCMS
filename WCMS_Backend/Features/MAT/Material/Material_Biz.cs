using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.MAT.Material;

[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.Material)]
public class MaterialBiz(BizDeps bizDeps) : BizService<MaterialSet>(bizDeps), IBizService<MaterialSet>
{
    #region Protected
    /// <summary>
    /// 儲存前統一整理物件相片排序序號。
    /// </summary>
    protected override async Task BeforeUpdate(MaterialSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                NormalizePictureRowNo(set.MaterialPicture);
                break;
        }
        
    }
    #endregion

    #region Private
    /// <summary>
    /// 依 RowNo、RowId 穩定排序後，重排為連續序號。
    /// </summary>
    private static void NormalizePictureRowNo(IList<MaterialPicture> pictures)
    {
        var orderedPictures = pictures
            .OrderBy(picture => picture.RowNo > 0 ? picture.RowNo : int.MaxValue)
            .ThenBy(picture => picture.RowId)
            .ToList();

        for (int index = 0; index < orderedPictures.Count; index++)
        {
            orderedPictures[index].RowNo = index + 1;
        }
    }

    #endregion
}
