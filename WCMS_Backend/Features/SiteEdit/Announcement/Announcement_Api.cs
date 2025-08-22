using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using System.Linq.Dynamic.Core;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.Announcement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class AnnouncementController : ApiDataController<AnnouncementSet,AnnouncementSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            AnnouncementSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas,ct);
        }
        private async Task<AnnouncementSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<AnnouncementSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Announcement", "SELECT * FROM News" },
                { "AnnouncementDetail", "SELECT * FROM News_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await FileService.BizQueryListAsync([nameof(FileManageModel.InternalId)],$"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}",0,0);
            List<FileManageSet> fileSets=[];
            foreach(var id in importFileInternalIds.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await FileService.BizQuerySetAsync(id);
                fileSets.Add(data);
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["Announcement"].Rows)
            {
                AnnouncementSet_DTO set = new() {};
                result.Add(set);
                set.Announcement.AnnouncementId = row["Sn"].ToString();
                set.Announcement.Categories = row["Category"].ToString();
                set.Announcement.Tags = row["Tag"].ToString();
                set.Announcement.ContentStatus = GetContentStatus(row["Status"].ToString());
                string picFileName = row["Pic"].ToString();
                string picDescription = row["PicDescription"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageSet fileInfo = GetSetByPicture(picFileName, fileSets);
                    updateFileSets.Add(fileInfo);
                    fileInfo.FileManage.FileName = picFileName;
                    if (!picDescription.IsNullOrEmpty()) fileInfo.FileManage.FileDescription = picDescription;
                    set.Announcement.PictureId = fileInfo.FileManage.InternalId;
                }
                set.Announcement.PicDescription = picDescription;
                int r = 0;
                if (row["ViewCount"] != DBNull.Value) _ = int.TryParse(row["ViewCount"].ToString(), out r);
                set.Announcement.ViewCount = r;
                set.Announcement.Validate_Start = Convert.ToDateTime(row["StartDate"]);
                set.Announcement.Validate_End = Convert.ToDateTime(row["EndDate"]);
                int rowId = 1;
                ds.Tables["AnnouncementDetail"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Announcement.AnnouncementId).ToList().ForEach(dRow =>
                {
                    if (!dRow["Title"].IsNullOrEmpty() && !dRow["Content"].IsNullOrEmpty())
                    {
                        string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic,out List<string> usedInternalIds);
                        updateFileSets.AddRange(fileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                        AnnouncementDetail_DTO detail = new()
                        {
                            AnnouncementId = set.Announcement.AnnouncementId,
                            RowId = rowId,
                            Lang = dRow["Lang"].ToString(),
                            Title = dRow["Title"].ToString(),
                            Content = contentXml,
                            SubTitle = dRow["SubTitle"].ToString(),
                            Url = dRow["URL"].ToString(),
                        };
                        set.AnnouncementDetail.Add(detail);
                        for (int i = 1; i < 10; i++)
                        {
                            string subFileName = dRow[$"Filename{i}"].ToString();
                            string subFileRName = dRow[$"File{i}"].ToString();
                            if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
                            {
                                FileManageSet fileInfo = GetSetByPicture(subFileRName, fileSets);
                                updateFileSets.Add(fileInfo);
                                fileInfo.FileManage.FileName = subFileName;
                                fileInfo.FileManage.FileDescription = subFileName;
                                AnnouncementDetailFile_DTO detailFile = new()
                                {
                                    AnnouncementId = set.Announcement.AnnouncementId,
                                    ParentRowId = rowId,
                                    RowId = i,
                                    FileId = fileInfo.FileManage.InternalId,
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
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set); 
            }
            return [.. result];
        }
        private ContentStatus GetContentStatus(string status)
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
        private FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/News/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion
    }

    /// <summary>
    /// 公告功能
    /// </summary>
    [LibDesc]
    public class AnnouncementSet_DTO
    {
        [LibDesc] public Announcement_DTO Announcement { get; set; } = new();
        [LibDesc] public List<AnnouncementDetail_DTO> AnnouncementDetail { get; set; } = [];
        [LibDesc] public List<AnnouncementDetailFile_DTO> AnnouncementDetailFile { get; set; } = [];
    }
    /// <summary>
    /// 公告主表
    /// </summary>
    [LibDesc]
    public class Announcement_DTO
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 類別 (多個)
        /// </summary>
        [LibDesc] public string? Categories { get; set; } = string.Empty;
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc] public string? PicDescription { get; set; } = string.Empty;
        /// <summary>
        /// 觀看次數
        /// </summary>
        [LibDesc] public int? ViewCount { get; set; } = 0;

        /// <summary>
        /// 資料有效日期-起
        /// </summary>
        [LibDesc]
        public DateTime? Validate_Start { get; set; }
        /// <summary>
        /// 資料有效日期-迄
        /// </summary>
        [LibDesc]
        public DateTime? Validate_End { get; set; }

        #region Detail關聯
        [ForeignKey(nameof(AnnouncementId))] public virtual ICollection<AnnouncementDetail>? AnnouncementDetail { get; set; }
        #endregion
    }
    /// <summary>
    /// 公告明細
    /// </summary>
    [LibDesc]
    public class AnnouncementDetail_DTO
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc] public string? AnnouncementId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc] public int? RowId { get; set; }
        /// <summary>
        /// 語系
        /// </summary>
        [LibDesc] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc] public string? Title { get; set; }
        /// <summary>
        /// 副標題
        /// </summary>
        [LibDesc] public string? SubTitle { get; set; }
        /// <summary>
        /// 內文
        /// </summary>
        [LibDesc] public string? Content { get; set; }
        /// <summary>
        /// 網址
        /// </summary>
        [LibDesc] public string? Url { get; set; }
    }
    /// <summary>
    /// 明細檔案關聯
    /// </summary>
    [LibDesc]
    public class AnnouncementDetailFile_DTO
    {
        /// <summary>
        /// 公告代碼
        /// </summary>
        [LibDesc] public string AnnouncementId { get; set; }
        /// <summary>
        /// 父行代碼 - (AnnouncementDetail)
        /// </summary>
        [LibDesc] public int ParentRowId { get; set; }
        /// <summary>
        /// 行代碼
        /// </summary>
        [LibDesc] public int RowId { get; set; }
        /// <summary>
        /// 檔案來源
        /// </summary>
        [LibDesc] public string FileId { get; set; }
    }

}

