using Microsoft.AspNetCore.Mvc;
using System.Data;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.Features.SiteEdit.Category
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class CategoryController : ApiDataController<CategoryDataSet, CategoryDataSet_DTO>
    {
        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            CategoryDataSet_DTO[] datas = ConvertToApiModel();
            return await InitialCreateData(datas, ct);
        }
        private static CategoryDataSet_DTO[] ConvertToApiModel()
        {
            List<CategoryDataSet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "Category", "Select * From Category" },
                { "Category_Lang", "Select * From Category_Lang" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["Category"].Rows)
            {
                CategoryDataSet_DTO set = new() { };
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
        #endregion
    }

    public class CategoryDataSet_DTO
    {
        public Category Category { get; set; } = new();
        public List<CategoryDetail> CategoryDetail { get; set; } = [];
    }
    public class Category_DTO
    {
        /// <summary>
        /// 類別ID
        /// </summary>
        [LibDesc] public string? CategoryId { get; set; }
        /// <summary>
        /// 對應功能模塊ID
        /// </summary>
        [LibDesc] public string? ProgId { get; set; }
        /// <summary>
        /// 類別明細
        /// </summary>
        public virtual ICollection<CategoryDetail>? CategoryDetail { get; set; }
    }
    public class CategoryDetail_DTO
    {
        /// <summary>
        /// 靜態客製頁面ID
        /// </summary>
        [LibDesc] public string CategoryId { get; set; }
        /// <summary>
        /// 行主鍵
        /// </summary>
        [LibDesc] public int RowId { get; set; }
        /// <summary>
        /// 語系 SysEnum.Lang
        /// </summary>
        [LibDesc] public string Lang { get; set; }
        /// <summary>
        /// 標題
        /// </summary>
        public string CategoryName { get; set; }
    }
}
