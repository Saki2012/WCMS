using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
namespace WCMS.Features.MAT.Material;

[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.Material)]
public class MaterialBiz(BizDeps bizDeps) : BizService<Material>(bizDeps)
{
    #region Protected Virtual
    /// <summary>
    /// 儲存前統一整理物件相片排序序號。
    /// </summary>
    protected override async Task BeforeUpdate(Material set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        if (act is FuncAction.Create or FuncAction.Update) NormalizePictureRowNo(set._MaterialPicture);
    }
    #endregion

    #region Private
    /// <summary>
    /// 保留圖片 RowId，並依 RowNo、RowId 穩定排序後重排連續 RowNo。
    /// </summary>
    private static void NormalizePictureRowNo(IList<MaterialPicture> pictures)
    {
        List<MaterialPicture> ordered = [.. pictures
            .OrderBy(picture => picture.RowNo > 0 ? picture.RowNo : int.MaxValue)
            .ThenBy(picture => picture.RowId)];
        for (int index = 0; index < ordered.Count; index++) ordered[index].RowNo = index + 1;
    }
    #endregion
}
