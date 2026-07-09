using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.Data;
using WCMS.Features._Resx;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.PageManagement;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Interface;
using WCMS.SysCore.Library;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.COMM.Category;

/// <summary>
/// Category 家族共用 Biz 基底
/// </summary>
public abstract class CategoryBizBase<TSet>(BizDeps bizDeps) : BizService<TSet>(bizDeps), IBizService<TSet> where TSet : CategoryDataSet, new()
{
    #region Protected Virtual
    /// <summary>
    /// 更新前共用檢查
    /// </summary>
    protected override async Task BeforeUpdate(TSet set, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(set, act, ct);
        switch (act)
        {
            case FuncAction.Create:
            case FuncAction.Update:
                CheckData(set);
                break;
            case FuncAction.Delete:
                await CheckIsUsedAsync(set);
                break;
        }
    }
    /// <summary>
    /// 子類別檢查被用
    /// </summary>
    protected virtual Task SpecCheckIsUsedAsync(string progId, string categoryId, string categoryName) => Task.CompletedTask;
    #endregion

    #region Protected
    /// <summary>
    /// 資料檢查
    /// </summary>
    protected void CheckData(TSet set)
    {
        CheckCategoryName(set.CategoryDetail, LangCode.zhtw);
    }
    #endregion
    #region Private

    /// <summary>
    /// 檢查指定語系名稱是否為空
    /// </summary>
    private void CheckCategoryName(IList<CategoryDetail> detail, LangCode lang)
    {
        bool hasEmpty = detail.Any(p => p.Lang.Equals(lang) && p.CategoryName.IsNullOrEmpty());
        if (hasEmpty) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<CategoryDetail>(x => x.CategoryName));
    }
    /// <summary>
    /// 檢查類別是否已被使用
    /// </summary>
    private async Task CheckIsUsedAsync(TSet set)
    {
        string progId = set.Category.ProgId ?? string.Empty;
        string categoryId = set.Category.CategoryId ?? string.Empty;
        string categoryName = set.CategoryDetail.FirstOrDefault(p => p.Lang == EffectiveLang)?.CategoryName ?? string.Empty;
        int useCount = 0;
        switch (progId)
        {
            case ProgKeys.WEB.Announcement:
                useCount = await DoQueryListCountAsync<Announcement>($@"{nameof(Announcement.Categories)} HasAny {categoryId}");
                break;
            case ProgKeys.WEB.FileArchive:
                useCount = await DoQueryListCountAsync<FileArchive>($@"{nameof(FileArchive.CategoriesId)} HasAny {categoryId}");
                break;
            case ProgKeys.WEB.Gallery:
                useCount = await DoQueryListCountAsync<Gallery>($@"{nameof(Gallery.Categories)} HasAny {categoryId}");
                break;
            case ProgKeys.WEB.PageManagement:
                useCount = await DoQueryListCountAsync<PageManagement>($@"{nameof(PageManagement.CategoryId)} = {categoryId}");
                break;
            default:
                await SpecCheckIsUsedAsync(progId, categoryId, categoryName);
                break;
        }
        if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00018, categoryName);
    }
    #endregion
}
/// <summary>
/// 
/// </summary>
/// <param name="bizDeps"></param>
[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Category)]
public class CategoryBiz(BizDeps bizDeps) : CategoryBizBase<CategoryDataSet>(bizDeps)
{
    #region Migration Old Data
    /// <summary>
    /// 匯入舊版 Category 資料
    /// </summary>
    [HttpPost(nameof(Migrate)), LocalhostOnly]
    public async Task Migrate()
    {
        CategoryDataSet[] datas = ConvertToApiModel();
        await BizInitCreateSetsAsync(datas);
    }
    /// <summary>
    /// 舊資料轉成新 Set
    /// </summary>
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
            CategoryDataSet set = new();
            result.Add(set);
            set.Category.CategoryId = row["Sn"].ToString();
            set.Category.ProgId = MigrateOldData.ChangeProgId(row["Module"].ToString());
            int rowId = 1;
            foreach (var dRow in ds.Tables["Category_Lang"].AsEnumerable().Where(dr => dr["Sn"].ToString() == set.Category.CategoryId).ToList())
            {
                _ = LangCodeExt.TryParse(dRow["Lang"].ToString(), out LangCode lang);
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
}
