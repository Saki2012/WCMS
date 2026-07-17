using WCMS.Features._Resx;
using WCMS.SysCore.Configuration;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.WEB.Gallery;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Gallery)]
public class GalleryBiz(BizDeps bizDeps) : BizService<Gallery>(bizDeps)
{
    #region Protected Virtual
    protected override async Task BeforeUpdate(Gallery set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                if (Message.HasError) return;
                SetData(set);
                break;
        }
    }
    #endregion

    #region Protected
    protected bool CheckData(Gallery set)
    {
        PreDelData(set);
        CheckIsEmpty(set);
        AACheck(set);
        return Message.HasError;
    }
    protected void SetData(Gallery set)
    {
        DoRemergeData(set);
        ResetPhotoSort(set._GalleryPhotos);
    }
    /// <summary>
    /// AA檢查
    /// </summary>
    /// <param name="set"></param>
    protected void AACheck(Gallery set)
    {
        if (!SpecSettings.AACheck) return;
        AA_CheckAlbumTitle(set._GalleryInfo);
        AA_CheckPhotoTitle(set._GalleryPhotos.SelectMany(photo => photo._GalleryPhotosInfo).ToList());
    }
    #endregion

    #region Private

    private void CheckIsEmpty(Gallery set)
    {
        if (set.Validate_Start == default) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<Gallery>(x => x.Validate_Start));

        if (!LibData.HasData(set._GalleryPhotos)) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00019);
    }

    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(Gallery header)
    {
        header.Categories = header.Categories.Remerge(",");
        header.Tags = header.Tags.Remerge(",");
    }
    /// <summary>
    /// 重新排序相簿順序(應該後續會拿掉)
    /// </summary>
    /// <param name="dt"></param>
    private static void ResetPhotoSort(List<GalleryPhotos> dt)
    {
        if (!dt.HasData()) return;
        List<GalleryPhotos> sorted = [.. dt.OrderBy(p => p.Sort).ThenByDescending(p => p.RowId)];
        for (int i = 0; i < sorted.Count; i++) sorted[i].Sort = (ushort)(i + 1);
    }
    /// <summary>
    /// 防呆刪除不需要的資料
    /// </summary>
    private static void PreDelData(Gallery set)
    {
        for (int i = set._GalleryPhotos.Count - 1; i >= 0; i--)
        {
            var data = set._GalleryPhotos[i];
            if (data.PicSrcId.IsNullOrEmpty()) set._GalleryPhotos.Remove(data);
        }
    }
    /// <summary>
    /// AA檢查-相本有無輸入標題
    /// </summary>
    /// <param name="galleryInfo"></param>
    private void AA_CheckAlbumTitle(List<GalleryInfo> galleryInfo)
    {
        galleryInfo.ForEach(info =>
        {
            if (info.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00001, info.Lang.ToLabel(), I18n.GetLabel<GalleryInfo>(x => x.Title));
        });
    }
    /// <summary>
    /// AA檢查-相片有無輸入標題
    /// </summary>
    /// <param name="photoInfo"></param>
    private void AA_CheckPhotoTitle(List<GalleryPhotosInfo> photoInfo)
    {
        photoInfo.ForEach(info =>
        {
            if (info.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00002, info.Lang.ToLabel(), I18n.GetLabel<GalleryPhotosInfo>(x => x.Title));
        });
    }
    #endregion
}
