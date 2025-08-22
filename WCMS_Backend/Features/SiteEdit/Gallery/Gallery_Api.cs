using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.FileArchive;
using WCMS.Features.SiteEdit.Gallery;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class GalleryController : ApiDataController<GallerySet, GallerySet_DTO>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            GallerySet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<GallerySet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<GallerySet_DTO> result = [];

            Dictionary<string, string> sqls = new()
            {
                { "Gallery", "Select * From Gallery" },
                { "Gallery_Lang", "Select * From Gallery_Lang" },
                { "Gallery_Album", "Select * From Gallery_Album" },
                { "Gallery_Album_Lang", "Select * From Gallery_Album_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.BizQueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.BizQuerySetAsync(id);
                fileSets.Add(data);
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow srcHeader in ds.Tables["Gallery"].Rows)
            {
                GallerySet_DTO set = new()
                {
                    Gallery = new Gallery_DTO()
                    {
                        GalleryId = srcHeader["Sn"].ToString(),
                        Categories = srcHeader["Category"].ToString(),
                        ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                        Tags = srcHeader["Tag"].ToString(),
                    }
                };
                int galleryRowId = 1;
                ds.Tables["Gallery_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Gallery.GalleryId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty())
                    {
                        string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                        if(usedInternalIds.Count!=0) updateFileSets.AddRange(fileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                        set.GalleryInfo.Add(new GalleryInfo_DTO()
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
                    var photo = new GalleryPhotos_DTO()
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
                            set.GalleryPhotosInfo.Add(new GalleryPhotosInfo_DTO()
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
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set);
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


    public class GallerySet_DTO
    {
        public Gallery_DTO Gallery { get; set; } = new();
        public List<GalleryInfo_DTO> GalleryInfo { get; set; } = [];
        public List<GalleryPhotos_DTO> GalleryPhotos { get; set; } = [];
        public List<GalleryPhotosInfo_DTO> GalleryPhotosInfo { get; set; } = [];
    }

    /// <summary>
    /// 相簿
    /// </summary>
    public class Gallery_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 類別ID(多個)
        /// </summary>
        [LibDesc, Required] public string Categories { get; set; }
        /// <summary>
        /// 標籤ID(多個)
        /// </summary>
        [LibDesc, Required] public string Tags { get; set; }
        /// <summary>
        /// 狀態:置頂/熱門/隱藏
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 封面照 (透過功能從相簿裡的PicSrcId直接取得，保存時紀錄，供之後list查看時減少效能使用)
        /// </summary>
        public string CoverPicSrcId { get; set; }
        /// <summary>
        /// 相簿排序
        /// </summary>
        public int Sort { get; set; }
    }
    /// <summary>
    /// 相簿資訊
    /// </summary>
    public class GalleryInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        public string Content { get; set; }
    }
    /// <summary>
    /// 相簿裡的相片
    /// </summary>
    public class GalleryPhotos_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 圖片來源
        /// </summary>
        public string PicSrcId { get; set; }
        /// <summary>
        /// 相片排序
        /// </summary>
        public int Sort { get; set; }
    }
    /// <summary>
    /// 相簿裡的相片資訊
    /// </summary>
    public class GalleryPhotosInfo_DTO
    {
        /// <summary>
        /// 檔案分類ID
        /// </summary>
        [LibDesc, Required, Key] public string GalleryId { get; set; }
        /// <summary>
        /// 父行主鍵 - (GalleryPhotos)
        /// </summary>
        [LibDesc, Key] public int ParentRowId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc, Key] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string Title { get; set; }
    }
}
