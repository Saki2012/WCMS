using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Linq;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.Features.SiteEdit.WebResource;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;

namespace WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory
{
    [ApiController, Route(SysParam.ServiceRoute)]
    public class SpecCategoryController : ApiDataController<SpecCategorySet,SpecCategorySet_DTO>
    {

        #region Migration Old Data
        [HttpPost(nameof(Migrate)), LocalhostOnly]
        public async Task<IActionResult> Migrate(CancellationToken ct)
        {
            List<SpecCategorySet_DTO> datas=[.. ConvertResCategoryModel(), .. ConvertUSRCategoryModel()];
            return await InitialCreateData([.. datas],ct);
        }
        private static SpecCategorySet_DTO[] ConvertResCategoryModel()
        {
            List<SpecCategorySet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "ResearchProjectCategory", "Select * From ResearchProjectCategory" },
                { "ResearchProjectCategory_Lang", "Select * From ResearchProjectCategory_Lang" },
                { "ResearchProjectItem", "Select * From ResearchProjectItem" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["ResearchProjectCategory"].Rows)
            {
                SpecCategorySet_DTO set = new() { };
                result.Add(set);
                string id = $"Res_{row["Sn"]}";
                set.SpecCategory.CategoryId =id;
                set.SpecCategory.ProgId = "SpecResearch";
                set.SpecCategory.ShowColumnItems = GetShowColumnItems(row["ShowItems"].ToString(), ds.Tables["ResearchProjectItem"]);
                int rowId = 1;
                foreach (var dRow in ds.Tables["ResearchProjectCategory_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == row["Sn"].ToString()).ToList())
                {
                    SpecCategoryDetailModel_DTO detail = new()
                    {
                        CategoryId = id,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        CategoryName = dRow["CategoryName"].ToString(),
                    };
                    set.SpecCategoryDetail.Add(detail);
                }
            }
            return [.. result];
        }
        private static SpecCategorySet_DTO[] ConvertUSRCategoryModel()
        {
            List<SpecCategorySet_DTO> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "USRProjectCategory", "Select * From USRProjectCategory" },
                { "USRProjectCategory_Lang", "Select * From USRProjectCategory_Lang" },
                { "USRProjectItem", "Select * From USRProjectItem" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["USRProjectCategory"].Rows)
            {
                SpecCategorySet_DTO set = new() { };
                result.Add(set);
                string id = $"USR_{row["Sn"]}";
                set.SpecCategory.CategoryId = id;
                set.SpecCategory.ProgId = "SpecUSRModel";
                set.SpecCategory.ShowColumnItems = GetShowColumnItems(row["ShowItems"].ToString(), ds.Tables["USRProjectItem"]);
                int rowId = 1;
                foreach (var dRow in ds.Tables["USRProjectCategory_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == row["Sn"].ToString()).ToList())
                {
                    SpecCategoryDetailModel_DTO detail = new()
                    {
                        CategoryId = id,
                        RowId = rowId++,
                        Lang = dRow["Lang"].ToString(),
                        CategoryName = dRow["CategoryName"].ToString(),
                    };
                    set.SpecCategoryDetail.Add(detail);
                }
            }
            return [.. result];
        }

        private static string GetShowColumnItems(string showItems,DataTable itemDt)
        {
            Dictionary<string, string> items = [];
            foreach(DataRow row in itemDt.Rows) items.Add(row["Sn"].ToString(), row["Name"].ToString());
            var i= showItems.Split(',');
            string result = string.Empty;
            foreach (var x in i)
            {
                if(items.TryGetValue(x,out string value)) result = LibData.Merge(",",false, result,value);
            }
            return result.Remerge(",");
        }
        #endregion
    }

    public class SpecCategorySet_DTO
    {
        public SpecCategoryModel_DTO SpecCategory { get; set; } = new();
        public List<SpecCategoryDetailModel_DTO> SpecCategoryDetail { get; set; } = [];
    }

    public class SpecCategoryModel_DTO
    {
        [LibDesc] public string CategoryId { get; set; }
        /// <summary>
        /// 功能Id
        /// </summary>
        public string ProgId { get; set; }
        /// <summary>
        /// 顯示欄位
        /// </summary>
        public string ShowColumnItems { get; set; }
    }

    public class SpecCategoryDetailModel_DTO
    {
        /// <summary>
        /// 
        /// </summary>
        [LibDesc] public string CategoryId { get; set; }
        [LibDesc] public int RowId { get; set; }
        [LibDesc] public string Lang { get; set; }
        [LibDesc] public string CategoryName { get; set; }
    }

}
