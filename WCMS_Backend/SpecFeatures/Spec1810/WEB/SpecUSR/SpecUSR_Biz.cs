using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.SpecFeatures.Spec1810.WEB.SpecUSR;

[LibBiz(ProgKeys.WEB.Code, ProgKeys.Spec.SpecUSR)]
public class SpecUSRBiz(BizDeps bizDeps) : BizService<SpecUSRModel>(bizDeps), IBizService<SpecUSRModel> 
{
    #region Migration Old Data
    [HttpPost(nameof(Migrate)), LocalhostOnly]
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageModel> srcFileSets=default)
    {
        SpecUSRModel[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateDatasAsync(datas);
    }
    private SpecUSRModel[] ConvertToApiModel(string importFileLabel, IList<FileManageModel> srcFileSets)
    {
        List<SpecUSRModel> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "USRProject", "SELECT * FROM USRProject" },
            { "USRProject_Lang", "SELECT * FROM USRProject_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);

        var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageModel> updateFileSets = [];

        foreach (DataRow row in ds.Tables["USRProject"].Rows)
        {
            SpecUSRModel set = new() { };
            result.Add(set);
            set.SpecUSR.USRId = row["Sn"].ToString();
            set.SpecUSR.CategoryId = $"USR_{row["Category"]}";
            set.SpecUSR.ContentStatus = GetContentStatus(row["Status"].ToString());
            set.SpecUSR.Tags = row["Tag"].ToString();
            set.SpecUSR.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.SpecUSR.ModifyTime = row["UpdateTime"].ToString().ToDateTime();
            string picFileName = row["Pic"].ToString();
            string picDescription = row["PicDescription"].ToString();
            if (!picFileName.IsNullOrEmpty())
            {
                FileManageModel fileInfo = GetSetByPicture(picFileName, srcFileSets);
                updateFileSets.Add(fileInfo);
                fileInfo.FileManage.ProgId = ProgId;
                fileInfo.FileManage.FileName = picFileName;
                if (!picDescription.IsNullOrEmpty())
                {
                    fileInfo.FileManage.FileDescription = picDescription;
                }
                picFileName = fileInfo.FileManage.InternalId;
            }
            set.SpecUSR.PictureId = picFileName;
            set.SpecUSR.PicDescription = picDescription;
            int rowId = 1;
            ds.Tables["USRProject_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.SpecUSR.USRId).ToList().ForEach(dRow =>
            {
                int.TryParse(dRow["AcademicYear"].ToString(), out int academicYear);
                decimal.TryParse(dRow["PlanAmount"].ToString().Replace(",", ""), out decimal planAmount);
                LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                SpecUSRDetail detail = new()
                {
                    USRId = set.SpecUSR.USRId,
                    RowId = rowId++,
                    Lang = lang,
                    Year = dRow["Year"].ToString(),
                    AcademicYear = academicYear,
                    Courses = dRow["Courses"].ToString(),
                    PracticeField = dRow["PracticeField"].ToString(),
                    ProjectName = dRow["ProjectName"].ToString(),
                    ExternalCooperationUnit = dRow["ExternalCooperationUnit"].ToString(),
                    Department = dRow["Department"].ToString(),
                    DuringExecution = dRow["DuringExecution"].ToString(),
                    PlanAmount = planAmount,
                    ExecutionStrategy = dRow["ExecutionStrategy"].ToString(),
                    ContentIntroduction = dRow["ContentIntroduction"].ToString(),
                    ProjectConcept = dRow["ProjectConcept"].ToString(),
                    ProjectHighlights = dRow["ProjectHighlights"].ToString(),
                    ProjectLeader = dRow["ProjectLeader"].ToString(),
                    Cohost1 = dRow["Cohost1"].ToString(),
                    Cohost2 = dRow["Cohost2"].ToString(),
                    Commissioned = dRow["Commissioned"].ToString(),
                    Remark = dRow["Remark"].ToString(),
                    ProjectItem = dRow["ProjectItem"].ToString(),
                    Url = dRow["Url"].ToString(),
                    UrlDescription = $@"{dRow["ProjectName"]} 相關網址(另開新視窗)"
                };
                set.SpecUSRDetail.Add(detail);
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
    private static FileManageModel GetSetByPicture(string srcPic, IList<FileManageModel> fileSets)
    {
        return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/USRProject/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
    }
    #endregion

    #region Protected
    protected override async Task BeforeUpdate(SpecUSRModel set, FuncAction act, CancellationToken ct = default)
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
    private void CheckData(SpecUSRModel set)
    {
        CheckIsEmpty(set);
    }
    private void SetData(SpecUSRModel set)
    {
        DoRemergeData(set.SpecUSR);
        SetFileEmptyToNull(set.SpecUSR);
    }
    private void CheckIsEmpty(SpecUSRModel set)
    {
        if (set.SpecUSR.CategoryId.IsNullOrEmpty()) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<SpecUSRModel>(x => x.CategoryId));
    }
    /// <summary>
    /// 重新組合多筆資料(類別、狀態、標籤)
    /// </summary>
    /// <param name="header"></param>
    private static void DoRemergeData(SpecUSRModel header)
    {
        header.Tags = header.Tags.Remerge(",");
    }
    /// <summary>
    /// 將空白的圖片(無檔案)設置為null，避免報錯
    /// </summary>
    /// <param name="header"></param>
    private static void SetFileEmptyToNull(SpecUSRModel header) 
    {
        if (header.PictureId.IsNullOrEmpty()) header.PictureId = null;
    }
    #endregion
}
