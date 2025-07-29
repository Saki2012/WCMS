using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Category
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class CategoryController(IBizService<CategoryDataSet> service) : ApiDataController<CategoryDataSet>(service)
    {


#if DEBUG //轉移舊系統資料
        [HttpPost(nameof(Migrate))]
        public async Task<IActionResult> Migrate()
        {
            CategoryDataSet[] datas = ConvertToApiModel();
            return await InitialCreateData(datas);
        }
        private static CategoryDataSet[] ConvertToApiModel()
        {
            List<CategoryDataSet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Category", "Select * From Category" },
                { "Category_Lang", "Select * From Category_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["Category"].Rows)
            {
                CategoryDataSet set = new() { };
                result.Add(set);
                set.Category.CategoryId = row["Sn"].ToString();
                set.Category.ProgId = MigrateOldData.ChangeProgId(row["Module"].ToString());
                set.Category.IsIniData = true;
                int rowId = 1;
                foreach (var dRow in ds.Tables["Category_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Category.CategoryId).ToList())
                {
                    CategoryDetail detail = new()
                    {
                        CategoryId = set.Category.CategoryId,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        CategoryName = dRow["CategoryName"].ToString()
                    };
                    set.CategoryDetail.Add(detail);
                }
            }
            return [.. result];
        }
#endif
    }
}
