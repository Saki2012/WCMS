using GraphQL;
using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR
{
    [ProgId("SpecUSR")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecUSRController : ApiDataController<SpecUSRSet, SpecUSRSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct,string importFileLabel = "1810")
        {
            SpecUSRSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas, ct);
        }
        private async Task<SpecUSRSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<SpecUSRSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "USRProject", "SELECT * FROM USRProject" },
                { "USRProject_Lang", "SELECT * FROM USRProject_Lang" },
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

            foreach (DataRow row in ds.Tables["USRProject"].Rows)
            {
                SpecUSRSet_DTO set = new() { };
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
                    fileInfo.FileManage.ProgId = this.Service.ProgId;
                    fileInfo.FileManage.FileName = picFileName;
                    if (!picDescription.IsNullOrEmpty())
                    {
                        fileInfo.FileManage.FileDescription = picDescription;
                    }
                    picFileName= fileInfo.FileManage.InternalId;
                }
                set.SpecUSR.PictureId= picFileName;
                set.SpecUSR.PicDescription = picDescription;
                int rowId = 1;
                ds.Tables["USRProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecUSR.USRId).ToList().ForEach(dRow =>
                {
                    SpecUSRDetail_DTO detail = new()
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
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/USRProject/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }
        #endregion
    }

    public class SpecUSRSet_DTO:ITSet_DTO
    {
        public SpecUSRModel_DTO SpecUSR { get; set; } = new();
        public List<SpecUSRDetail_DTO> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRModel_DTO:DTOBasicDataModel
    {
        /// <summary>
        /// USR Id
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSRId), Key] public string USRId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Categories)] public string CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Tags)] public string? Tags { get; set; } = string.Empty;
        /// <summary>
        /// 圖片 (關聯檔案資料)
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSR_PictureId)] public string? PictureId { get; set; } = string.Empty;
        /// <summary>
        /// 圖片描述
        /// </summary>
        [LibDesc(ModelDisplayName.SpecUSR_PicDescription)] public string? PicDescription { get; set; } = string.Empty;
        public List<SpecUSRDetail_DTO> SpecUSRDetail { get; set; } = [];
    }

    public class SpecUSRDetail_DTO
    {
        [LibDesc(ModelDisplayName.SpecUSRId), Key] public string USRId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang), Required, StringLength(5)] public string Lang { get; set; } = default!;
        [LibDesc(ModelDisplayName.SpecUSR_Year), StringLength(10)] public string? Year { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_AcademicYear), StringLength(10)] public string? AcademicYear { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_PracticeField), StringLength(200)] public string? PracticeField { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectName), StringLength(200)] public string? ProjectName { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ExternalCoUnits), StringLength(200)] public string? ExternalCooperationUnit { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_DuringExecution), StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_PlanAmount), StringLength(200)] public string? PlanAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ExternalCoUnits)] public string? ExecutionStrategy { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ContentIntro)] public string? ContentIntroduction { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectConcept)] public string? ProjectConcept { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_KeyHighlights)] public string? ProjectHighlights { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(ModelDisplayName.SpecUSR_Remark)] public string? Remark { get; set; }
    }
}
