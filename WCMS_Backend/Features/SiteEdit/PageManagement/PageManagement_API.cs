using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Category;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.PageManagement
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class PageManagementController(IBizService<PageManagementSet> service) : ApiDataController<PageManagementSet>(service)
    {


#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            PageManagementSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static PageManagementSet[] ConvertToApiModel()
        {
            List<PageManagementSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Page", "Select * From Page" },
                { "Page_Lang", "Select * From Page_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
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
                    PageManagementDetail detail = new()
                    {
                        PageId = set.PageManagement.PageId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        Title = dRow["Title"].ToString(),
                        Content = dRow["Content"].ToString()
                    };
                    set.PageManagementDetail.Add(detail);
                }
            }
            return [.. result];
        }
#endif
    }
}
