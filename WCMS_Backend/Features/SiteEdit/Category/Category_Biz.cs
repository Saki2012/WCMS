using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using System.Runtime.InteropServices;
using WCMS.SysCore;
using WCMS.SysCore.Enum;
using WCMS.SysCore.I18n;
using WCMS.SysCore.I18n.Resx;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Model;
using static WCMS.SysCore.Enum.SysEnum;

namespace WCMS.Features.SiteEdit.Category
{
    [ProgId("Category")]
    public class CategoryBiz(BizDeps bizDeps) : BizService<CategoryDataSet>(bizDeps), IBizService<CategoryDataSet> 
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
                    LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
                    CategoryDetail detail = new()
                    {
                        CategoryId = set.Category.CategoryId,
                        RowId = rowId++,
                        Lang = lang,
                        CategoryName = dRow["CategoryName"].ToString()
                    };
                    set.CategoryDetail.Add(detail);
                }
            }
            return [.. result];
        }
        #endregion


        #region Protected
        protected override async Task BeforeUpdate(CategoryDataSet set, SysEnum.FuncAction act)
        {
            await base.BeforeUpdate(set, act);
            switch (act)
            {
                case SysEnum.FuncAction.Create:
                case SysEnum.FuncAction.Update:
                    CheckData(set);
                    break;
                case SysEnum.FuncAction.Delete:
                    await CheckIsUsed(set);
                    break;
            }
        }

        protected virtual Task SpecCheckIsUsed(string progId, string categoryId, string categoryName) => Task.CompletedTask;
        #endregion

        private void CheckData(CategoryDataSet set)
        {
            CheckCategoryName(set.CategoryDetail, LangCode.zhtw);
        }

        private void CheckCategoryName(IList<CategoryDetail> datail, LangCode lang)
        {
            if (datail.Any(p => p.Lang.Equals(lang) && p.CategoryName.IsNullOrEmpty())) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<CategoryDetail>(x => x.CategoryName));
        }

        private async Task CheckIsUsed(CategoryDataSet set)
        {
            string progId = set.Category.ProgId;
            string categoryId = set.Category.CategoryId;
            string categoryName = set.CategoryDetail.FirstOrDefault(p => p.Lang==EffectiveLang).CategoryName;
            int useCount = 0;
            switch (progId)
            {
                case "Announcement":
                    useCount = await DoQueryListCountAsync<Announcement.Announcement>([nameof(BasicDataModel.InternalId)], $@"{nameof(Announcement.Announcement.Categories)} HasAny {categoryId}");
                    break;
                case "FileArchive":
                    useCount = await DoQueryListCountAsync<FileArchive.FileArchive>([nameof(BasicDataModel.InternalId)], $@"{nameof(FileArchive.FileArchive.CategoriesId)} HasAny {categoryId}");
                    break;
                case "Gallery":
                    useCount = await DoQueryListCountAsync<Gallery.Gallery>([nameof(BasicDataModel.InternalId)], $@"{nameof(Gallery.Gallery.Categories)} HasAny {categoryId}");
                    break;
                case "PageManagement":
                    useCount = await DoQueryListCountAsync<PageManagement.PageManagement>([nameof(BasicDataModel.InternalId)], $@"{nameof(PageManagement.PageManagement.CategoryId)} = {categoryId}");
                    break;
                default:
                    await SpecCheckIsUsed(progId, categoryId, categoryName);
                    break;
            }
            if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00018, categoryName);
        }
    }
}
