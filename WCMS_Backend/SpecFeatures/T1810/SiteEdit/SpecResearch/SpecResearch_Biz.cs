using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecUSR;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecResearch
{
    [ProgId("SpecResearch")]
    public class SpecResearchBiz(BizDeps bizDeps) : BizService<SpecResearchSet>(bizDeps), IBizService<SpecResearchSet> {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task Migrate()
        {
            SpecResearchSet[] datas = ConvertToApiModel();
            await BizInitCreateSetsAsync(datas);
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
                set.SpecResearch.CreateTime = row["CreateTime"].ToString().ToDateTime();
                set.SpecResearch.ModifyTime = row["UpdateTime"].ToString().ToDateTime();
                int rowId = 1;
                ds.Tables["ResearchProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecResearch.ResearchId).ToList().ForEach(dRow =>
                {
                    
                    int.TryParse(dRow["Year"].ToString(), out int year);
                    int.TryParse(dRow["AcademicYear"].ToString(), out int academicYear);
                    decimal.TryParse(dRow["PlanAmount"].ToString().Replace(",", ""), out decimal planAmount);
                    decimal.TryParse(dRow["ApprovedAmount"].ToString().Replace(",", ""), out decimal approvedAmount);

                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    SpecResearchDetailModel detail = new()
                    {
                        ResearchId = set.SpecResearch.ResearchId,
                        RowId = rowId++,
                        Lang = lang,
                        Year = year,
                        AcademicYear = academicYear,
                        Semester = dRow["Semester"].ToString(),
                        DuringExecution = dRow["DuringExecution"].ToString(),
                        ContractPeriod = dRow["ContractPeriod"].ToString(),
                        ClassTime = dRow["ClassTime"].ToString(),
                        ProjectLeader = dRow["ProjectLeader"].ToString(),
                        Name = dRow["Name"].ToString(),
                        TeachingStaffOfOurSchool = dRow["TeachingStaffOfOurSchool"].ToString(),
                        ApprovalNumber = dRow["ApprovalNumber"].ToString(),
                        ApprovedAmount = approvedAmount,
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
                        PlanAmount = planAmount,
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

        #region Protected
        protected override async Task BeforeUpdate(SpecResearchSet set, SysEnum.FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    SetData(set);
                    break;
            }
        }
        #endregion

        #region Private
        private void CheckData(SpecResearchSet set)
        {
            CheckIsEmpty(set);
        }
        private void SetData(SpecResearchSet set)
        {
            DoRemergeData(set.SpecResearch);
        }


        private void CheckIsEmpty(SpecResearchSet set)
        {
            if(set.SpecResearch.CategoryId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SpecResearchModel>(x => x.CategoryId));
        }
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(SpecResearchModel header)
        {
            header.Tags = header.Tags.Remerge(",");
        }
        #endregion
    }
}
