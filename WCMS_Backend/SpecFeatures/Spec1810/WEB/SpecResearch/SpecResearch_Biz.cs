using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecResearch;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecResearch)]
public class SpecResearchBiz(BizDeps bizDeps) : BizService<SpecResearchModel>(bizDeps), IBizService<SpecResearchModel>
{

    #region Migration Old Data
    [HttpPost(nameof(Migrate)), LocalhostOnly]
    public async Task Migrate()
    {
        SpecResearchModel[] datas = ConvertToApiModel();
        await BizInitCreateDatasAsync(datas);
    }
    private static SpecResearchModel[] ConvertToApiModel()
    {
        List<SpecResearchModel> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "ResearchProject", "SELECT * FROM ResearchProject" },
            { "ResearchProject_Lang", "SELECT * FROM ResearchProject_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);
        foreach (DataRow row in ds.Tables["ResearchProject"].Rows)
        {
            SpecResearchModel set = new() { };
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
    protected override async Task BeforeUpdate(SpecResearchModel set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
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
    private void CheckData(SpecResearchModel set)
    {
        CheckIsEmpty(set);
    }
    private void SetData(SpecResearchModel set)
    {
        DoRemergeData(set.SpecResearch);
    }


    private void CheckIsEmpty(SpecResearchModel set)
    {
        if (set.SpecResearch.CategoryId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<SpecResearchModel>(x => x.CategoryId));
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
