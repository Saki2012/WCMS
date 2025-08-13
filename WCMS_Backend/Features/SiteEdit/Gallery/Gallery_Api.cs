using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.FileArchive;
using WCMS.Features.SiteEdit.Gallery;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class GalleryController : ApiDataController<GallerySet>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            GallerySet[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<GallerySet[]> ConvertToApiModel(string importFileLabel)
        {
            List<GallerySet> result = [];

            Dictionary<string, string> sqls = new()
            {
                { "Gallery", "Select * From Gallery" },
                { "Gallery_Lang", "Select * From Gallery_Lang" },
                { "Gallery_Album", "Select * From Gallery_Album" },
                { "Gallery_Album_Lang", "Select * From Gallery_Album_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.QueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Data.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.QuerySetAsync(id);
                fileSets.Add(data.Data.LastOrDefault());
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow srcHeader in ds.Tables["Gallery"].Rows)
            {
                GallerySet set = new()
                {
                    Gallery = new Gallery()
                    {
                        GalleryId = srcHeader["Sn"].ToString(),
                        Categories = srcHeader["Category"].ToString(),
                        ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                        Tags = srcHeader["Tag"].ToString(),
                        IsIniData = true,
                    }
                };
                int galleryRowId = 1;
                ds.Tables["Gallery_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Gallery.GalleryId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty())
                    {
                        string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                        if(usedInternalIds.Count!=0) updateFileSets.AddRange(fileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                        set.GalleryInfo.Add(new GalleryInfo()
                        {
                            GalleryId = set.Gallery.GalleryId,
                            RowId = galleryRowId,
                            Lang = dRow["Lang"].ToString(),
                            Title = dRow["Title"].ToString(),
                            Content = contentXml,
                        });
                        galleryRowId++;
                    }
                });

                int photoRowId= 1;
                ds.Tables["Gallery_Album"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Gallery.GalleryId).OrderBy(dr => dr["PhotoName"].ToString()).ToList().ForEach(dRow =>
                {

                    var photoSet = GetSetByPicture(dRow["PhotoName"].ToString(), fileSets);
                    updateFileSets.Add(photoSet);
                    photoSet.FileManage.FileName = dRow["PhotoName"].ToString();
                    var photo = new GalleryPhotos()
                    {
                        GalleryId = set.Gallery.GalleryId,
                        RowId = photoRowId,
                        PicSrcId = photoSet.FileManage.InternalId,
                        Sort = photoRowId,
                    };

                    set.GalleryPhotos.Add(photo);

                    if (dRow["PhotoID"].ToString() == srcHeader["Cover"].ToString()) set.Gallery.CoverPicSrcId = photo.PicSrcId;

                    int subPhotoRowId = 1;
                    ds.Tables["Gallery_Album_Lang"].AsEnumerable().Where(dr => dr["PhotoID"] == dRow["PhotoID"]).ToList().ForEach(subDRow =>
                    {
                        if (!subDRow["Title"].IsNullOrEmpty())
                        {
                            set.GalleryPhotosInfo.Add(new GalleryPhotosInfo()
                            {
                                GalleryId = set.Gallery.GalleryId,
                                ParentRowId = photoRowId,
                                RowId = subPhotoRowId,
                                Lang = subDRow["Lang"].ToString(),
                                Title = subDRow["Title"].ToString(),
                            });
                            if (subDRow["Lang"].ToString().Equals("zh-tw", StringComparison.InvariantCultureIgnoreCase)) photoSet.FileManage.FileDescription = subDRow["Title"].ToString();
                            subPhotoRowId++;
                        }
                    });
                    photoRowId++;
                });
                result.Add(set);
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.UpdateSetAsync(set.FileManage.InternalId, set);
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
        private static FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Contains($@"{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion
    }
}
