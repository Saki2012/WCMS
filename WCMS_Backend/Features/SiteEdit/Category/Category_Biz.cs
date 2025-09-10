using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SysCore;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.Category
{
    [ProgId("Category")]
    public class CategoryBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<CategoryDataSet>(repo,message), IBizService<CategoryDataSet> 
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task Migrate()
        {
            CategoryDataSet[] datas = ConvertToApiModel();
            await BizInitCreateSetsAsync(datas);
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
        #endregion
    }
}
