using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;

namespace WCMS.SpecFeatures.Spec1817.WEB.SpecMusical;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecMusical)]
public class SpecMusical_Biz(BizDeps bizDeps) : BizService<SpecMusical>(bizDeps), IBizService<SpecMusical>
{
    #region Protected Virtual
    /// <summary>
    /// 儲存前整理封面圖片與相片排序。
    /// </summary>
    protected override async Task BeforeUpdate(SpecMusical data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act != FuncAction.Create && act != FuncAction.Update) return;
        SetData(data);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 整理樂器表單的系統欄位。
    /// </summary>
    protected void SetData(SpecMusical data)
    {
        SetCoverPic(data);
        ResetPhotoSort(data._SpecMusicalPictureList);
    }
    #endregion

    #region Private
    /// <summary>
    /// 封面不存在於相片清單時，改用第一張相片。
    /// </summary>
    private static void SetCoverPic(SpecMusical data)
    {
        string? coverPicId = data.CoverPicId;
        bool coverExists = data._SpecMusicalPictureList.Any(item => item.PicSrcId == coverPicId);
        if (!coverPicId.IsNullOrEmpty() && coverExists) return;
        data.CoverPicId = data._SpecMusicalPictureList.FirstOrDefault()?.PicSrcId;
    }
    /// <summary>
    /// 依目前排序及 RowId 重新編排相片順序。
    /// </summary>
    private static void ResetPhotoSort(List<SpecMusicalPictureList> items)
    {
        if (!items.HasData()) return;
        List<SpecMusicalPictureList> sorted = [.. items.OrderBy(item => item.Sort).ThenByDescending(item => item.RowId)];
        for (int index = 0; index < sorted.Count; index++) sorted[index].Sort = index + 1;
    }
    #endregion
}
