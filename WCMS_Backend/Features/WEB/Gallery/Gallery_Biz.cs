using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;
namespace WCMS.Features.WEB.Gallery;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.Gallery)]
public class GalleryBiz(BizDeps bizDeps) : BizService<Gallery>(bizDeps), IBizService<Gallery> 
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets = default)
    {
        Gallery[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateDatasAsync(datas);
    }
    private Gallery[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets = default)
    {
        List<Gallery> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "Gallery", "Select * From Gallery" },
            { "Gallery_Lang", "Select * From Gallery_Lang" },
            { "Gallery_Album", "Select * From Gallery_Album" },
            { "Gallery_Album_Lang", "Select * From Gallery_Album_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);
        var fileSrcIdDic = srcFileSets.SelectMany(s => s._FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageModel> updateFileSets = [];

        foreach (DataRow srcHeader in ds.Tables["Gallery"].Rows)
        {
            Gallery set = new()
            {
                GalleryId = srcHeader["Sn"].ToString(),
                CoverPicSrcId = string.Empty,
                Categories = srcHeader["Category"].ToString(),
                ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                Tags = srcHeader["Tag"].ToString(),
                CreateTime = srcHeader["CreateTime"].ToString().ToDateTime(),
                ModifyTime = srcHeader["UpdateTime"].ToString().ToDateTime(),
                Validate_Start = srcHeader["StartDate"].ToString().ToDateTime(),
            };
            int galleryRowId = 1;
            ds.Tables["Gallery_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.GalleryId).ToList().ForEach(dRow =>
            {
                if (!dRow["Title"].IsNullOrEmpty())
                {
                    string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                    if (usedInternalIds.Count != 0) updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.InternalId)));
                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    set._GalleryInfo.Add(new GalleryInfo()
                    {
                        GalleryId = set.GalleryId,
                        RowId = galleryRowId,
                        Lang = lang,
                        Title = dRow["Title"].ToString(),
                        Content = contentXml,
                    });
                    galleryRowId++;
                }
            });

            int photoRowId = 1;
            ds.Tables["Gallery_Album"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.GalleryId).OrderBy(dr => dr["PhotoName"].ToString()).ToList().ForEach(dRow =>
            {

                var photoSet = GetSetByPicture(dRow["Sn"].ToString(),dRow["PhotoName"].ToString(), srcFileSets);
                updateFileSets.Add(photoSet);
                photoSet.FileName = dRow["PhotoName"].ToString();
                var photo = new GalleryPhotos()
                {
                    GalleryId = set.GalleryId,
                    RowId = photoRowId,
                    PicSrcId = photoSet.InternalId,
                    Sort = photoRowId,
                };

                set._GalleryPhotos.Add(photo);

                if (dRow["PhotoID"].ToString() == srcHeader["Cover"].ToString()) set.CoverPicSrcId = photo.PicSrcId;

                int subPhotoRowId = 1;
                ds.Tables["Gallery_Album_Lang"].AsEnumerable().Where(dr => dr["PhotoID"].ToString() == dRow["PhotoID"].ToString()).ToList().ForEach(subDRow =>
                {
                    if (!subDRow["Title"].IsNullOrEmpty())
                    {
                        LangCodeExt.TryParse(subDRow["Lang"].ToString(), out LangCode lang);
                        photo._GalleryPhotosInfo.Add(new GalleryPhotosInfo()
                        {
                            GalleryId = set.GalleryId,
                            ParentRowId = photoRowId,
                            RowId = subPhotoRowId,
                            Lang = lang,
                            Title = subDRow["Title"].ToString(),
                        });
                        if (lang==LangCode.zhtw) photoSet.FileDescription = subDRow["Title"].ToString();
                        subPhotoRowId++;
                    }
                });
                photoRowId++;
            });
            result.Add(set);
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.ProgId = ProgId;
        }
        return [.. result];
    }
    private static ContentStatus GetContentStatus(string status)
    {
        ContentStatus result = ContentStatus.None;
        foreach (string s in status.Split(','))
        {
            switch (s.Trim().ToLower())
            {
                case "hide":
                    result |= ContentStatus.Hidden;
                    break;
                case "hot":
                    result |= ContentStatus.Hot;
                    break;
                case "top":
                    result |= ContentStatus.Top;
                    break;
            }
        }
        return result;
    }
    private static FileManageModel GetSetByPicture(string albumId,string srcPic, IList<FileManageModel> fileSets)
    {
        return fileSets.Where(x => x._FileManage_SyncInfo.Any(y =>
                    y.SrcFullPath.Contains($"file/image/album/{albumId}/{srcPic}", StringComparison.InvariantCultureIgnoreCase) &&
                    y.SrcFullPath.Contains(srcPic, StringComparison.InvariantCultureIgnoreCase))).FirstOrDefault();
    }
    #endregion

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
        if (set.Validate_Start == default) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Gallery>(x => x.Validate_Start));

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
        for(int i = set._GalleryPhotos.Count - 1; i >= 0; i--)
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
        galleryInfo.ForEach(info => { 
            if (info.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00001, info.Lang.ToLabel(), I18nCache.GetLabel<GalleryInfo>(x => x.Title));
        });
    }
    /// <summary>
    /// AA檢查-相片有無輸入標題
    /// </summary>
    /// <param name="photoInfo"></param>
    private void AA_CheckPhotoTitle(List<GalleryPhotosInfo> photoInfo)
    {
        photoInfo.ForEach(info => {
            if(info.Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.AACode00002, info.Lang.ToLabel(), I18nCache.GetLabel<GalleryPhotosInfo>(x => x.Title));
        });
    }
    #endregion
}
