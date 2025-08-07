using Microsoft.AspNetCore.Mvc;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.SystemFunc.FileManagement;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecUSRController(IBizService<SpecUSRSet> service, IBizService<FileManageSet> fileService) : ApiDataController<SpecUSRSet>(service)
    {
        #region property
        private readonly FileManagementBiz _fileService = (FileManagementBiz)fileService;
        #endregion

#if DEBUG //轉移舊系統資料
        //[HttpPost(nameof(Migrate))]
        //public async Task<IActionResult> Migrate(string importFileLabel = "1810")
        //{
        //    SpecUSRSet[] datas = await ConvertToApiModel(importFileLabel);
        //    return await InitialCreateData(datas);
        //}
        //private async Task<SpecUSRSet[]> ConvertToApiModel(string importFileLabel)
        //{
        //    List<SpecUSRSet> result = [];
        //    Dictionary<string, string> sqls = new()
        //    {
        //        { "Announcement", "SELECT * FROM News" },
        //        { "AnnouncementDetail", "SELECT * FROM News_Lang" },
        //    };
        //    DataSet ds = MigrateOldData.GetOldData(sqls);

        //    var importFileInternalIds = await _fileService.QueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
        //    List<FileManageSet> fileSets = [];
        //    foreach (var id in importFileInternalIds.Data.Select(p => p.FileManage.InternalId).ToList().Distinct())
        //    {
        //        var data = await _fileService.QuerySetAsync(id);
        //        fileSets.Add(data.Data.LastOrDefault());
        //    }
        //    var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        //    List<FileManageSet> updateFileSets = [];

        //    foreach (DataRow row in ds.Tables["Announcement"].Rows)
        //    {
        //        SpecUSRSet set = new() { };
        //        result.Add(set);
        //        set.Announcement.AnnouncementId = row["Sn"].ToString();
        //        set.Announcement.Categories = row["Category"].ToString();
        //        set.Announcement.Tags = row["Tag"].ToString();
        //        set.Announcement.ContentStatus = GetContentStatus(row["Status"].ToString());
        //        string picFileName = row["Pic"].ToString();
        //        string picDescription = row["PicDescription"].ToString();
        //        if (!picFileName.IsNullOrEmpty())
        //        {
        //            FileManageSet fileInfo = GetSetByPicture(picFileName, fileSets);
        //            updateFileSets.Add(fileInfo);
        //            fileInfo.FileManage.FileName = picFileName;
        //            if (!picDescription.IsNullOrEmpty()) fileInfo.FileManage.FileDescription = picDescription;
        //            set.Announcement.PictureId = fileInfo.FileManage.InternalId;
        //        }
        //        set.Announcement.PicDescription = picDescription;
        //        set.Announcement.CreateTime = Convert.ToDateTime(row["CreateTime"]);
        //        set.Announcement.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
        //        set.Announcement.IsIniData = true;
        //        int r = 0;
        //        if (row["ViewCount"] != DBNull.Value) _ = int.TryParse(row["ViewCount"].ToString(), out r);
        //        set.Announcement.ViewCount = r;
        //        set.Announcement.Validate_Start = Convert.ToDateTime(row["StartDate"]);
        //        set.Announcement.Validate_End = Convert.ToDateTime(row["EndDate"]);
        //        int rowId = 1;
        //        ds.Tables["AnnouncementDetail"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Announcement.AnnouncementId).ToList().ForEach(dRow =>
        //        {
        //            if (!dRow["Title"].IsNullOrEmpty() && !dRow["Content"].IsNullOrEmpty())
        //            {
        //                string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
        //                updateFileSets.AddRange(fileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
        //                AnnouncementDetail detail = new()
        //                {
        //                    AnnouncementId = set.Announcement.AnnouncementId,
        //                    RowId = rowId,
        //                    Lang = dRow["Lang"].ToString(),
        //                    Title = dRow["Title"].ToString(),
        //                    Content = contentXml,
        //                    SubTitle = dRow["SubTitle"].ToString(),
        //                    Url = dRow["URL"].ToString(),
        //                };
        //                set.AnnouncementDetail.Add(detail);
        //                for (int i = 1; i < 10; i++)
        //                {
        //                    string subFileName = dRow[$"Filename{i}"].ToString();
        //                    string subFileRName = dRow[$"File{i}"].ToString();
        //                    if (!subFileName.IsNullOrEmpty() && !subFileRName.IsNullOrEmpty())
        //                    {
        //                        FileManageSet fileInfo = GetSetByPicture(subFileRName, fileSets);
        //                        fileInfo.FileManage.FileName = subFileName;
        //                        fileInfo.FileManage.FileDescription = subFileName;
        //                        AnnouncementDetailFile detailFile = new()
        //                        {
        //                            AnnouncementId = set.Announcement.AnnouncementId,
        //                            ParentRowId = rowId,
        //                            RowId = i,
        //                            FileId = fileInfo.FileManage.InternalId,
        //                        };
        //                        set.AnnouncementDetailFile.Add(detailFile);
        //                    }
        //                }
        //                rowId++;
        //            }
        //        });
        //    }
        //    foreach (var set in updateFileSets.Distinct())
        //    {
        //        set.FileManage.ProgId = this._service.ProgId;
        //        await _fileService.UpdateSetAsync(set.FileManage.InternalId, set);
        //    }
        //    return [.. result];
        //}
        //private ContentStatus GetContentStatus(string status)
        //{
        //    ContentStatus result = ContentStatus.None;
        //    foreach (string s in status.Split(','))
        //    {
        //        switch (s.Trim().ToLower())
        //        {
        //            case "hide":
        //                result |= ContentStatus.Hidden;
        //                break;
        //            case "hot":
        //                result |= ContentStatus.Hot;
        //                break;
        //            case "top":
        //                result |= ContentStatus.Top;
        //                break;
        //        }
        //    }
        //    return result;
        //}

        //private FileManageSet GetSetByPicture(string srcPic, List<FileManageSet> fileSets)
        //{
        //    return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/News/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        //}
#endif
    }
}
