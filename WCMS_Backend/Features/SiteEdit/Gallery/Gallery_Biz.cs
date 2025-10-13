using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
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
    public class GalleryBiz(IRepositoryMapProvider repoMapProvider, IErrorHelper message) : BizService<GallerySet>(repoMapProvider, message), IBizService<GallerySet> {


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
        protected override void BeforeUpdate(GallerySet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    DoRemergeData(set.Gallery);
                    break;
            }
        }
        #endregion

        private void CheckData(GallerySet set)
        {
            CheckDate(set.Gallery);
        }


        private void CheckDate(Gallery header)
        {
            if (header.Validate_Start == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Gallery>(x => x.Validate_Start));
            //if (header.Validate_End == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Gallery>(x => x.Validate_End));
            //if (header.Validate_End != null && header.Validate_Start > header.Validate_End) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, I18nCache.GetLabel<Gallery>(x => x.Validate_End) , I18nCache.GetLabel<WebResource>(x => x.Validate_Start));

            if (header.Categories == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Gallery>(x => x.Categories));

        }


        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(Gallery header)
        {
            header.Categories = header.Categories.Remerge(",");
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion

    }
}
