using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecResearchController : ApiDataController<SpecResearchSet,SpecResearchSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            SpecResearchSet_DTO[] datas = ConvertToApiModel();
            return await InitialCreateData(datas,ct);
        }
        private static SpecResearchSet_DTO[] ConvertToApiModel()
        {
            List<SpecResearchSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "ResearchProject", "SELECT * FROM ResearchProject" },
                { "ResearchProject_Lang", "SELECT * FROM ResearchProject_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["ResearchProject"].Rows)
            {
                SpecResearchSet_DTO set = new() { };
                result.Add(set);
                set.SpecResearch.ResearchId = row["Sn"].ToString();
                set.SpecResearch.CategoryId = $"Res_{row["Category"]}";
                set.SpecResearch.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.SpecResearch.Tags = row["Tag"].ToString();
                int rowId = 1;
                ds.Tables["ResearchProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecResearch.ResearchId).ToList().ForEach(dRow =>
                {
                    SpecResearchDetailModel_DTO detail = new()
                    {
                        ResearchId = set.SpecResearch.ResearchId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        Year = dRow["Year"].ToString(),
                        AcademicYear = dRow["AcademicYear"].ToString(),
                        Semester = dRow["Semester"].ToString(),
                        DuringExecution = dRow["DuringExecution"].ToString(),
                        ContractPeriod = dRow["ContractPeriod"].ToString(),
                        ClassTime = dRow["ClassTime"].ToString(),
                        ProjectLeader = dRow["ProjectLeader"].ToString(),
                        Name = dRow["Name"].ToString(),
                        TeachingStaffOfOurSchool = dRow["TeachingStaffOfOurSchool"].ToString(),
                        ApprovalNumber = dRow["ApprovalNumber"].ToString(),
                        ApprovedAmount = dRow["ApprovedAmount"].ToString(),
                        College = dRow["College"].ToString(),
                        Department = dRow["Department"].ToString(),
                        GraduationDegree = dRow["GraduationDegree"].ToString(),
                        CooperatingUnits = dRow["CooperatingUnits"].ToString(),
                        CooperationProject = dRow["CooperationProject"].ToString(),
                        Courses = dRow["Courses"].ToString(),
                        ProjectName = dRow["ProjectName"].ToString(),
                        PaperTitle = dRow["PaperTitle"].ToString(),
                        Remark = dRow["Remark"].ToString(),
                        Cohost1 = dRow["Cohost1"].ToString(),
                        Cohost2 = dRow["Cohost2"].ToString(),
                        Commissioned = dRow["Commissioned"].ToString(),
                        PlanAmount = dRow["PlanAmount"].ToString(),
                        PlanContent = dRow["PlanContent"].ToString(),
                    };
                    set.SpecResearchDetail.Add(detail);
                });
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
        #endregion
    }

    public class SpecResearchSet_DTO:ITSet_DTO
    {
        public SpecResearchModel_DTO SpecResearch { get; set; } = new();
        public List<SpecResearchDetailModel_DTO> SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchModel_DTO: DTOBasicDataModel
    {
        /// <summary>
        /// 橫幅ID
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearchId), Key]public string ResearchId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Categories)]public string CategoryId { get; set; }
        /// <summary>
        /// 狀態 (多個)
        /// </summary>
        [LibDesc(ModelDisplayName.Common_ContentStatus)] public ContentStatus ContentStatus { get; set; }
        /// <summary>
        /// 標籤 (多個) 
        /// </summary>
        [LibDesc(ModelDisplayName.SpecResearch_Tags)] public string? Tags { get; set; } = string.Empty;

        public List<SpecResearchDetailModel_DTO> SpecResearchDetail { get; set; } = [];
    }
    public class SpecResearchDetailModel_DTO
    {
        [LibDesc(ModelDisplayName.SpecResearchId), Key] public string ResearchId { get; set; }
        [LibDesc(ModelDisplayName.Common_RowId), Key] public int RowId { get; set; }
        [LibDesc(ModelDisplayName.Common_Lang),StringLength(5)] public string Lang { get; set; } = default!;
        [LibDesc(ModelDisplayName.SpecResearch_Year),StringLength(10)] public string? Year { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_AcademicYear), StringLength(10)] public string? AcademicYear { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Semester),StringLength(10)] public string? Semester { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_DuringExecution),StringLength(200)] public string? DuringExecution { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ContractPeriod),StringLength(200)] public string? ContractPeriod { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ClassTime),StringLength(200)] public string? ClassTime { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ProjectLeader), StringLength(200)] public string? ProjectLeader { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Name), StringLength(200)] public string? Name { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_FacultySchedule), StringLength(200)] public string? TeachingStaffOfOurSchool { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ApprovalNumber), StringLength(200)] public string? ApprovalNumber { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ApprovedAmount), StringLength(200)] public string? ApprovedAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_College), StringLength(200)] public string? College { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Department), StringLength(200)] public string? Department { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Degree), StringLength(200)] public string? GraduationDegree { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_CoUnits), StringLength(200)] public string? CooperatingUnits { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_CoProject), StringLength(200)] public string? CooperationProject { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Courses), StringLength(200)] public string? Courses { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_ProjectName)] public string? ProjectName { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PaperTitle), StringLength(200)] public string? PaperTitle { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Remark)] public string? Remark { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Cohost1), StringLength(200)] public string? Cohost1 { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Cohost2), StringLength(200)] public string? Cohost2 { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_Commissioned), StringLength(200)] public string? Commissioned { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PlanAmount), StringLength(200)] public string? PlanAmount { get; set; }
        [LibDesc(ModelDisplayName.SpecResearch_PlanContent)] public string? PlanContent { get; set; }
    }
}
