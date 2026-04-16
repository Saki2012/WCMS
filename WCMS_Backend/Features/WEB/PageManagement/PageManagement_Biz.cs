using System.Data;
using WCMS.Features._Resx;
using WCMS.SysCore;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.WEB.PageManagement;
   
[LibBiz(ProgKeys.WEB.Code, ProgKeys.WEB.PageManagement)]
public class PageManagementBiz(BizDeps bizDeps) : BizService<PageManagementSet>(bizDeps), IBizService<PageManagementSet>
{
    #region Migration Old Data
    public async Task Migrate(string importFileLabel = "1810", IList<FileManageSet> srcFileSets = default)
    {
        PageManagementSet[] datas = ConvertToApiModel(importFileLabel, srcFileSets);
        await BizInitCreateSetsAsync(datas);
    }
    private PageManagementSet[] ConvertToApiModel(string importFileLabel, IList<FileManageSet> srcFileSets = default)
    {
        List<PageManagementSet> result = [];
        Dictionary<string, string> sqls = new()
        {
            { "Page", "Select * From Page" },
            { "Page_Lang", "Select * From Page_Lang" },
        };
        DataSet ds = MigrateOldData.GetOldData(sqls);

        var fileSrcIdDic = srcFileSets.SelectMany(s => s.FileManage_SyncInfo).GroupBy(d => d.SrcFullPath).ToDictionary(g => g.Key, g => g.First().InternalId);
        List<FileManageSet> updateFileSets = [];

        foreach (DataRow row in ds.Tables["Page"].Rows)
        {
            PageManagementSet set = new();
            result.Add(set);
            set.PageManagement.PageId = row["Sn"].ToString();
            set.PageManagement.CategoryId = row["Category"].ToString();
            set.PageManagement.CreateTime = row["CreateTime"].ToString().ToDateTime();
            set.PageManagement.ModifyTime = row["UpdateTime"].ToString().ToDateTime();
            int rowId = 1;
            foreach (var dRow in ds.Tables["Page_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.PageManagement.PageId).ToList())
            {
                if (dRow["Title"].IsNullOrEmpty()) continue;
                string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic, out List<string> usedInternalIds);
                updateFileSets.AddRange(srcFileSets.Where(p => usedInternalIds.Contains(p.FileManage.InternalId)));
                LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                PageManagementDetail detail = new()
                {
                    PageId = set.PageManagement.PageId,
                    RowId = rowId++,
                    Lang = lang,
                    Title = dRow["Title"].ToString(),
                    Content = contentXml,
                };
                set.PageManagementDetail.Add(detail);
            }
        }
        foreach (var set in updateFileSets.Distinct())
        {
            set.FileManage.ProgId = ProgId;
        }
        return [.. result];
    }
    #endregion
}
