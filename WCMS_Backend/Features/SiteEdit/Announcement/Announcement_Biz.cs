using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ProgId("Announcement")]
    public class AnnouncementBiz(BizDeps bizDeps) : BizService<AnnouncementSet>(bizDeps), IBizService<AnnouncementSet>
    {
        #region Migration Old Data
        public async Task Migrate(string importFileLabel = "1810",IList<FileManageSet> srcFileSets = default)
        {
            AnnouncementSet[] datas = ConvertToApiModel(importFileLabel,srcFileSets);
            await BizInitCreateSetsAsync(datas);
        }
        private AnnouncementSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets)
        {
            List<AnnouncementSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Announcement", "SELECT * FROM News" },
                { "AnnouncementDetail", "SELECT * FROM News_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["Announcement"].Rows)
            {
                AnnouncementSet set = new() { };
                result.Add(set);
                set.Announcement.AnnouncementId = row["Sn"].ToString();
                set.Announcement.Categories = row["Category"].ToString();
                set.Announcement.Tags = row["Tag"].ToString();
                set.Announcement.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.Announcement.Validate_Start = Convert.ToDateTime(row["StartDate"]);
                set.Announcement.Validate_End = Convert.ToDateTime(row["EndDate"]);
                set.Announcement.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.Announcement.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                string picFileName = row["Pic"].ToString();
                string picDescription = row["PicDescription"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageSet fileInfo = GetSetByPicture(picFileName, srcFileSets);
                    if (fileInfo != null)
                    {
                        updateFileSets.Add(fileInfo);
                        fileInfo.FileManage.FileName = picFileName;
                        if (!picDescription.IsNullOrEmpty()) fileInfo.FileManage.FileDescription = picDescription;
                        set.Announcement.PictureId = fileInfo.FileManage.InternalId;
                    }
                }
                set.Announcement.PicDescription = picDescription;
                if (row["ViewCount"] != DBNull.Value && int.TryParse(row["ViewCount"].ToString(), out int r))
                    set.Announcement.ViewCount = r;

                int rowId = 1;
                ds.Tables["AnnouncementDetail"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Announcement.AnnouncementId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty() && !dRow["Content"].IsNullOrEmpty())
                    {
                        string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                        updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                        AnnouncementDetail detail = new()
                        {
                            AnnouncementId = set.Announcement.AnnouncementId,
                            RowId = rowId,
                            Lang = dRow["Lang"].ToString(),
                            Title = dRow["Title"].ToString(),
                            Content = contentXml,
                            SubTitle = dRow["SubTitle"].ToString(),
                            Url = dRow["Url"].ToString(),
                        };
                        set.AnnouncementDetail.Add(detail);
                        for (int i = 1; i < 10; i++)
                        {
                            string subFileName = dRow[$"Filename{i}"].ToString();
                            string subFileRName = dRow[$"File{i}"].ToString();
                            if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
                            {
                                FileManageSet fileInfo = GetSetByPicture(subFileRName, srcFileSets);
                                updateFileSets.Add(fileInfo);
                                fileInfo.FileManage.FileName = subFileName;
                                fileInfo.FileManage.FileDescription = subFileName;
                                AnnouncementDetailFile detailFile = new()
                                {
                                    AnnouncementId = set.Announcement.AnnouncementId,
                                    ParentRowId = rowId,
                                    RowId = i,
                                    FileId = fileInfo.FileManage.InternalId,
                                    FileName = subFileName
                                };
                                set.AnnouncementDetailFile.Add(detailFile);
                            }
                        }
                        rowId++;
                    }
                });
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
        private static FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/News/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion

        #region Protected
        protected override async Task BeforeUpdate(AnnouncementSet set, FuncAction act)
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
        private void CheckData(AnnouncementSet set)
        {
            CheckDateIsEmpty(set);
        }

        private void SetData(AnnouncementSet set)
        {
            DoRemergeData(set.Announcement);
        }

        private void CheckDateIsEmpty(AnnouncementSet set)
        {
            if (set.Announcement.Validate_Start == null) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Announcement_DTO>(x => x.Validate_Start));
            if (set.Announcement.Validate_End != null && set.Announcement.Validate_Start >= set.Announcement.Validate_End) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00014, I18nCache.GetLabel<Announcement_DTO>(x => x.Validate_End), I18nCache.GetLabel<Announcement_DTO>(x => x.Validate_Start));
            if (set.Announcement.Categories == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<Announcement_DTO>(x => x.Categories));
            if(set.AnnouncementDetail.FirstOrDefault(p=>p.Lang.Equals("zh-tw")) == null || set.AnnouncementDetail.FirstOrDefault(p => p.Lang.Equals("zh-tw")).Title.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, "繁體中文", I18nCache.GetLabel<AnnouncementDetail_DTO>(x => x.Title));
        }

        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(Announcement header)
        {
            header.Categories = header.Categories.Remerge(",");
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion
    }
}
