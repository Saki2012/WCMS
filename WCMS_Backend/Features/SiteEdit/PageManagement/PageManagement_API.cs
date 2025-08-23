using Microsoft.AspNetCore.Mvc;
using System.ComponentModel.DataAnnotations.Schema;
using System.Data;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Library.LibData;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController : ApiDataController<PageManagementSet, PageManagementSet_DTO>
    {


        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct, string importFileLabel = "1810")
        {
            PageManagementSet_DTO[] datas = await ConvertToApiModel(importFileLabel);
            return await InitialCreateData(datas,ct);
        }
        private async Task<PageManagementSet_DTO[]> ConvertToApiModel(string importFileLabel)
        {
            List<PageManagementSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Page", "Select * From Page" },
                { "Page_Lang", "Select * From Page_Lang" },
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


            foreach (DataRow row in ds.Tables["Page"].Rows)
            {
                PageManagementSet_DTO set = new();
                result.Add(set);
                set.PageManagement.PageId = row["Sn"].ToString();
                set.PageManagement.CategoryId = row["Category"].ToString();
                set.PageManagement.ViewCount = row["ViewCount"].ToInt32();
                int rowId = 1;
                foreach (var dRow in ds.Tables["Page_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.PageManagement.PageId).ToList())
                {
                    if (dRow["Title"].IsNullOrEmpty()) continue;
                    string contentXml = HtmlInternalIdByFullPath.TransformHtml_ReplaceSrcWithDataInternalId(dRow["Content"].ToString(), fileSrcIdDic,out List<string> usedInternalIds);
                    updateFileSets.AddRange(fileSets.Where(p=> usedInternalIds.Contains(p.FileManage.InternalId)));
                    PageManagementDetail_DTO detail = new()
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
                set.FileManage.ProgId = this.Service.ProgId;
                await FileService.BizUpdateSetAsync(set.FileManage.InternalId, set);
            }
            return [.. result];
        }
        #endregion
    }
    public class PageManagementSet_DTO :ITSet_DTO
    {
        public PageManagement_DTO PageManagement { get; set; } = new();
        public List<PageManagementDetail_DTO> PageManagementDetail { get; set; } = [];
    }
    public class PageManagement_DTO : DTOBasicDataModel
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc] public string? PageId { get; set; }
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc] public string? CategoryId { get; set; }
        /// <summary>
        /// 查看次數
        /// </summary>
        [LibDesc] public int? ViewCount { get; set; }
    }
    public class PageManagementDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc] public string? PageId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc] public int? RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string? Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        [LibDesc] public string? Title { get; set; }
        /// <summary>
        /// 內容
        /// </summary>
        [LibDesc] public string? Content { get; set; }
    }
}
