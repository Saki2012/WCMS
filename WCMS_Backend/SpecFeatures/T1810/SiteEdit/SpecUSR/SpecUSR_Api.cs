using GraphQL;
using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

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
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate(string importFileLabel = "1810")
        {
            SpecUSRSet[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas);
        }
        private async Task<SpecUSRSet[]> ConvertToApiModel(string importFileLabel)
        {
            List<SpecUSRSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "USRProject", "SELECT * FROM USRProject" },
                { "USRProject_Lang", "SELECT * FROM USRProject_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);

            var importFileInternalIds = await _fileService.QueryListAsync([nameof(FileManageModel.InternalId)], $"{nameof(FileManageModel.ImportLabel)} = {importFileLabel}", 0, 0);
            List<FileManageSet> fileSets = [];
            foreach (var id in importFileInternalIds.Data.Select(p => p.FileManage.InternalId).ToList().Distinct())
            {
                var data = await _fileService.QuerySetAsync(id);
                fileSets.Add(data.Data.LastOrDefault());
            }
            var fileSrcIdDic = fileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
            List<FileManageSet> updateFileSets = [];

            foreach (DataRow row in ds.Tables["USRProject"].Rows)
            {
                SpecUSRSet set = new() { };
                result.Add(set);
                set.SpecUSR.USRId = row["Sn"].ToString();
                set.SpecUSR.CategoryId = $"USR_{row["Category"]}";
                set.SpecUSR.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.SpecUSR.Tags = row["Tag"].ToString();
                string picFileName = row["Pic"].ToString();
                string picDescription = row["PicDescription"].ToString();
                if (!picFileName.IsNullOrEmpty())
                {
                    FileManageSet fileInfo = GetSetByPicture(picFileName, fileSets);
                    updateFileSets.Add(fileInfo);
                    fileInfo.FileManage.ProgId = this._service.ProgId;
                    fileInfo.FileManage.FileName = picFileName;
                    if (!picDescription.IsNullOrEmpty())
                    {
                        fileInfo.FileManage.FileDescription = picDescription;
                    }
                    picFileName= fileInfo.FileManage.InternalId;
                }
                set.SpecUSR.PictureId= picFileName;
                set.SpecUSR.PicDescription = picDescription;
                set.SpecUSR.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.SpecUSR.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.SpecUSR.IsIniData = true;
                
                int rowId = 1;
                ds.Tables["USRProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecUSR.USRId).ToList().ForEach(dRow =>
                {
                    SpecUSRDetail detail = new()
                    {
                        USRId = set.SpecUSR.USRId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        Year = dRow["Year"].ToString(),
                        AcademicYear = dRow["AcademicYear"].ToString(),
                        Courses = dRow["Courses"].ToString(),
                        PracticeField = dRow["PracticeField"].ToString(),
                        ProjectName = dRow["ProjectName"].ToString(),
                        ExternalCooperationUnit = dRow["ExternalCooperationUnit"].ToString(),
                        Department = dRow["Department"].ToString(),
                        DuringExecution = dRow["DuringExecution"].ToString(),
                        PlanAmount = dRow["PlanAmount"].ToString(),
                        ExecutionStrategy = dRow["ExecutionStrategy"].ToString(),
                        ContentIntroduction = dRow["ContentIntroduction"].ToString(),
                        ProjectConcept = dRow["ProjectConcept"].ToString(),
                        ProjectHighlights = dRow["ProjectHighlights"].ToString(),
                        ProjectLeader = dRow["ProjectLeader"].ToString(),
                        Cohost1 = dRow["Cohost1"].ToString(),
                        Cohost2 = dRow["Cohost2"].ToString(),
                        Commissioned = dRow["Commissioned"].ToString(),
                        Remark = dRow["Remark"].ToString(),
                    };
                    set.SpecUSRDetail.Add(detail);
                });
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this._service.ProgId;
                await _fileService.UpdateSetAsync(set.FileManage.InternalId, set);
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
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/USRProject/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
#endif
    }
}
