using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.Gallery;
using WCMS.Features.SiteEdit.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Gallery
{
    [ProgId("Gallery")]
    public class GalleryBiz(BizDeps bizDeps) : BizService<GallerySet>(bizDeps), IBizService<GallerySet> {


        #region Migration Old Data
        public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
        {
            GallerySet[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
            await BizInitCreateSetsAsync(datas);
        }
        private GallerySet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
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
            var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow srcHeader in ds.Tables["Gallery"].Rows)
            {
                GallerySet set = new()
                {
                    Gallery = new Gallery()
                    {
                        GalleryId = srcHeader["Sn"].ToString(),
                        CoverPicSrcId="",
                        Categories = srcHeader["Category"].ToString(),
                        ContentStatus = GetContentStatus(srcHeader["Status"].ToString()),
                        Tags = srcHeader["Tag"].ToString(),
                        CreateTime = srcHeader["CreateTime"].ToString().ToDateTime(),
                        ModifyTime = srcHeader["UpdateTime"].ToString().ToDateTime(),
                        Validate_Start= srcHeader["StartDate"].ToString().ToDateTime(),
                    }
                };
                int galleryRowId = 1;
                ds.Tables["Gallery_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Gallery.GalleryId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty())
                    {
                        string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                        if (usedInternalIds.Count != 0) updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
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

                int photoRowId = 1;
                ds.Tables["Gallery_Album"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Gallery.GalleryId).OrderBy(dr => dr["PhotoName"].ToString()).ToList().ForEach(dRow =>
                {

                    var photoSet = GetSetByPicture(dRow["Sn"].ToString(),dRow["PhotoName"].ToString(), srcFileSets);
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
                    ds.Tables["Gallery_Album_Lang"].AsEnumerable().Where(dr => dr["PhotoID"].ToString() == dRow["PhotoID"].ToString()).ToList().ForEach(subDRow =>
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
                set.FileManage.ProgId = ProgId;
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
        private static FileManageSet GetSetByPicture(string albumId,string srcPic, IList<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y =>
                        y.SrcFullPath.Contains($"file/image/album/{albumId}/{srcPic}", StringComparison.InvariantCultureIgnoreCase) &&
                        y.SrcFullPath.Contains(srcPic, StringComparison.InvariantCultureIgnoreCase))).FirstOrDefault();
        }
        #endregion

        #region Protected
        protected override async Task BeforeUpdate(GallerySet set, FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case FuncAction.Create:
                case FuncAction.Update:
                    CheckData(set);
                    SetData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void CheckData(GallerySet set)
        {
            CheckIsEmpty(set);
            AACheck(set);
        }

        private void SetData(GallerySet set)
        {
            DoRemergeData(set.Gallery);
            ResetPhotoSort(set.GalleryPhotos);
        }
        private void CheckIsEmpty(GallerySet set)
        {
            if (set.Gallery.Validate_Start == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Gallery_DTO>(x => x.Validate_Start));
            if (set.GalleryInfo.FirstOrDefault(p => p.Lang.Equals("zh-tw")) == null || set.GalleryInfo.FirstOrDefault(p => p.Lang.Equals("zh-tw")).Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00019, "繁體中文", I18nCache.GetLabel<GalleryInfo_DTO>(x => x.Title));
        }
        private void AACheck(GallerySet set)
        {
            return;//有強制要求AA時才檢測該段資料，後續做開關控管
            foreach(GalleryPhotosInfo photos in set.GalleryPhotosInfo)
            if (photos.Lang.Equals("zh-tw") && photos.Title.IsNullOrEmpty())
                    Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00020, "繁體中文", I18nCache.GetLabel<GalleryPhotosInfo_DTO>(x => x.Title));
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
        private static void ResetPhotoSort(List<GalleryPhotos> dt)
        {
            if (!LibData.HasData(dt)) return;
            List<GalleryPhotos> sorted = [.. dt.OrderBy(p => p.Sort).ThenByDescending(p => p.RowId)];
            for (int i = 0; i < sorted.Count; i++) sorted[i].Sort = (ushort)(i + 1);
        }
        #endregion

    }
}
