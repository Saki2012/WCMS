using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController(IBizService<PageManagementSet> service, IBizService<FileManageSet> fileService) : ApiDataController<PageManagementSet>(service)
    {
        #region property
        private readonly FileManagementBiz _fileService = (FileManagementBiz)fileService;
        #endregion

#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate(string importFileLabel = "1810")
        {
            PageManagementSet[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas);
        }
        private async Task<PageManagementSet[]> ConvertToApiModel(string importFileLabel)
        {
            List<PageManagementSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Page", "Select * From Page" },
                { "Page_Lang", "Select * From Page_Lang" },
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


            foreach (DataRow row in ds.Tables["Page"].Rows)
            {
                PageManagementSet set = new();
                result.Add(set);
                set.PageManagement.PageId = row["Sn"].ToString();
                set.PageManagement.CategoryId = row["Category"].ToString();
                set.PageManagement.ViewCount = row["ViewCount"].ToInt32();
                set.PageManagement.CreateTime = Convert.ToDateTime(row["CreateTime"]);
                set.PageManagement.ModifyTime = Convert.ToDateTime(row["UpdateTime"]);
                set.PageManagement.IsIniData = true;
                int rowId = 1;
                foreach (var dRow in ds.Tables["Page_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.PageManagement.PageId).ToList())
                {
                    if (dRow["Title"].IsNullOrEmpty()) continue;
                    string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic,out List<string> usedInternalIds);
                    updateFileSets.AddRange(fileSets.Where(p=> usedInternalIds.Contains(p.FileManage.InternalId)));
                    PageManagementDetail detail = new()
                    {
                        PageId = set.PageManagement.PageId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        Title = dRow["Title"].ToString(),
                        Content = contentXml
                    };
                    set.PageManagementDetail.Add(detail);
                }
            }
            foreach (var set in updateFileSets.Distinct())
            {
                set.FileManage.ProgId = this._service.ProgId;
                await _fileService.UpdateSetAsync(set.FileManage.InternalId, set);
            }
            return [.. result];
        }
#endif
    }
}
