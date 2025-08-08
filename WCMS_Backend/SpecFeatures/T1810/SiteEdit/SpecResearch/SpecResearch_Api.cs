using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecResearchController(IBizService<SpecResearchSet> service, IBizService<FileManageSet> fileService) : ApiDataController<SpecResearchSet>(service)
    {

        #region property
        private readonly FileManagementBiz _fileService = (FileManagementBiz)fileService;
        #endregion

#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            SpecResearchSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static SpecResearchSet[] ConvertToApiModel()
        {
            List<SpecResearchSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "ResearchProject", "SELECT * FROM ResearchProject" },
                { "ResearchProject_Lang", "SELECT * FROM ResearchProject_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["ResearchProject"].Rows)
            {
                SpecResearchSet set = new() { };
                result.Add(set);
                set.SpecResearch.ResearchId = row["Sn"].ToString();
                set.SpecResearch.CategoryId = $"Res_{row["Category"]}";
                set.SpecResearch.ContentStatus = GetContentStatus(row["Status"].ToString());
                set.SpecResearch.Tags = row["Tag"].ToString();
                set.SpecResearch.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.SpecResearch.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.SpecResearch.IsIniData = true;
                int rowId = 1;
                ds.Tables["ResearchProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecResearch.ResearchId).ToList().ForEach(dRow =>
                {
                    SpecResearchDetailModel detail = new()
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
#endif
    }
}
