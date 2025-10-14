using Microsoft.AspNetCore.Mvc;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.Features.SiteEdit.Announcement;
using WCMS.Features.SiteEdit.Banner;
using WCMS.Features.SiteEdit.FileArchive;
using WCMS.Features.SiteEdit.PageManagement;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using WCMS.SysCore.Resx;
using WCMS.SysCore.SystemFunc.FileManagement;
using static WCMS.SysCore.Enum.SysEnum;

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


        #region Protected
        protected override void BeforeUpdate(CategoryDataSet set, SysEnum.FuncAction act)
        {
            base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    break;
                case SysEnum.FuncAction.Delete:
                    CheckIsUsed(set.Category.ProgId, set.Category.CategoryId);
                    break;
            }
        }
        #endregion

        private void CheckData(CategoryDataSet set)
        {
            for(int i = 0; i < set.CategoryDetail.Count; i++) 
            {
                CheckDate(set.CategoryDetail[i]);
            }
        }


        private void CheckDate(CategoryDetail datail)
        {
            if (datail.CategoryName == "") Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<CategoryDetail>(x => x.CategoryName));
        }


        private void CheckIsUsed(string progId, string categoryId)
        {
            switch (progId)
            {
                case "Announcement":
    

                    break;
                case "FileArchive":
                 
                    break;
                case "Gallery":
                
                    break;
                case "PageManagement":
                    //檢查是否有包含在內
            
                    break;
            }
        }


        private static FileManageSet GetSetByPicture(string srcPic, IList<FileManageSet> fileSets)
        {
            return fileSets.Where(x => x.FileManage_SyncInfo.Any(y => y.SrcFullPath.ToLowerInvariant().Equals($@"File/Banner/{srcPic}".ToLowerInvariant()))).FirstOrDefault();
        }

    }
}
