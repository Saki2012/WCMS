using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.SpecFeatures.T1810.SiteEdit.SpecCategory;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;

namespace WCMS.Features.SiteEdit.SpecCategory
{
    [ProgId("SpecCategory")]
    public class SpecCategoryBiz(IRepositoryMapProvider repo, IErrorHelper message) : BizService<SpecCategorySet>(repo, message), IBizService<SpecCategorySet> 
    {

        #region Migration Old Data
        public async Task Migrate()
        {
            List<SpecCategorySet> datas = [.. ConvertResCategoryModel(), .. ConvertUSRCategoryModel()];
            await BizInitCreateSetsAsync([.. datas]);
        }
        private static SpecCategorySet[] ConvertResCategoryModel()
        {
            List<SpecCategorySet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "ResearchProjectCategory", "Select * From ResearchProjectCategory" },
                { "ResearchProjectCategory_Lang", "Select * From ResearchProjectCategory_Lang" },
                { "ResearchProjectItem", "Select * From ResearchProjectItem" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["ResearchProjectCategory"].Rows)
            {
                SpecCategorySet set = new() { };
                result.Add(set);
                string id = $"Res_{row["Sn"]}";
                set.SpecCategory.CategoryId = id;
                set.SpecCategory.ProgId = "SpecResearch";
                set.SpecCategory.ShowColumnItems = GetShowColumnItems(row["ShowItems"].ToString(), ds.Tables["ResearchProjectItem"]);
                int rowId = 1;
                foreach (var dRow in ds.Tables["ResearchProjectCategory_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == row["Sn"].ToString()).ToList())
                {
                    SpecCategoryDetailModel detail = new()
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
        private static SpecCategorySet[] ConvertUSRCategoryModel()
        {
            List<SpecCategorySet> result = [];
            Dictionary<string, string> sqls = new()
            {
                { "USRProjectCategory", "Select * From USRProjectCategory" },
                { "USRProjectCategory_Lang", "Select * From USRProjectCategory_Lang" },
                { "USRProjectItem", "Select * From USRProjectItem" },
            };
            DataSet ds = MigrateOldData.GetOldData(sqls);
            foreach (DataRow row in ds.Tables["USRProjectCategory"].Rows)
            {
                SpecCategorySet set = new() { };
                result.Add(set);
                string id = $"USR_{row["Sn"]}";
                set.SpecCategory.CategoryId = id;
                set.SpecCategory.ProgId = "SpecUSRModel";
                set.SpecCategory.ShowColumnItems = GetShowColumnItems(row["ShowItems"].ToString(), ds.Tables["USRProjectItem"]);
                int rowId = 1;
                foreach (var dRow in ds.Tables["USRProjectCategory_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == row["Sn"].ToString()).ToList())
                {
                    SpecCategoryDetailModel detail = new()
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
        private static string GetShowColumnItems(string showItems, DataTable itemDt)
        {
            Dictionary<string, string> items = [];
            foreach (DataRow row in itemDt.Rows) items.Add(row["Sn"].ToString(), row["Name"].ToString());
            var i = showItems.Split(',');
            string result = string.Empty;
            foreach (var x in i)
            {
                if (items.TryGetValue(x, out string value)) result = LibData.Merge(",", false, result, value);
            }
            return result.Remerge(",");
        }
        #endregion

        #region Protected
        protected override void BeforeUpdate(SpecCategorySet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    DoRemergeData(set.SpecCategory);
                    break;
            }
        }
        #endregion

        #region Private
        /// <summary>
        /// 重新組合多筆資料(類別、狀態、標籤)
        /// </summary>
        /// <param name="header"></param>
        private static void DoRemergeData(SpecCategoryModel header)
        {
            header.ShowColumnItems = header.ShowColumnItems.Remerge(",");
        }
        #endregion
    }
}
