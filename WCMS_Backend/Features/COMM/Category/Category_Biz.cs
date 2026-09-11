using WCMS.Features._Resx;
using WCMS.Features.WEB.Announcement;
using WCMS.Features.WEB.FileArchive;
using WCMS.Features.WEB.Gallery;
using WCMS.Features.WEB.WebResource;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.FeatureDriver.Biz.Metadata;
using WCMS.SysCore.FeatureDriver.Model.Contracts;
using WCMS.SysCore.FeatureDriver.Model.Form;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library;
using WCMS.SysCore.Security.IdentityAccess.Authorization;
namespace WCMS.Features.COMM.Category;

/// <summary>
/// Category 家族共用 Biz 基底。
/// </summary>
public abstract class CategoryBizBase<TFormModel>(BizDeps bizDeps) : BizService<TFormModel>(bizDeps) where TFormModel : class
{
    #region Protected Virtual
    /// <summary>
    /// 固定管理的 Category ProgId；空值代表一般 Category 可管理多功能類別。
    /// </summary>
    protected virtual string ManagedProgId => string.Empty;
    /// <summary>
    /// 固定 Category 功能的查詢資料範圍。
    /// </summary>
    protected override string DataScopeCondition => ManagedProgId.IsNullOrEmpty() ? string.Empty : $"{nameof(Category.ProgId)} = \"{ManagedProgId}\"";
    /// <summary>
    /// 更新前套用 Category 隔離與共用驗證。
    /// </summary>
    protected override async Task BeforeUpdate(TFormModel data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        Category category = GetCategory(data);
        if (act is FuncAction.Create or FuncAction.Update) PrepareCategory(category);
        if (act is FuncAction.Create or FuncAction.Update) CheckData(category);
        if (act == FuncAction.Delete) await CheckIsUsedAsync(category);
    }
    /// <summary>
    /// 子類別擴充 Category 使用檢查。
    /// </summary>
    protected virtual Task<int> SpecGetCategoryUseCountAsync(string progId, string categoryId, string categoryName)
    {
        return Task.FromResult(0);
    }
    #endregion

    #region Protected
    /// <summary>
    /// 取得 Form Model 的 Category Root。
    /// </summary>
    protected static Category GetCategory(TFormModel data)
    {
        return FormModelMetadataResolver.GetRootModel(data) as Category
            ?? throw new InvalidOperationException($"Category Form Model Root must be {nameof(Category)}.");
    }
    /// <summary>
    /// 固定受管 Category 的 ProgId。
    /// </summary>
    protected void PrepareCategory(Category category)
    {
        if (!ManagedProgId.IsNullOrEmpty()) category.ProgId = ManagedProgId;
    }
    /// <summary>
    /// 執行 Category 共用資料檢查。
    /// </summary>
    protected void CheckData(Category category)
    {
        CheckCategoryName(category._CategoryDetail, LangCode.zhtw);
    }
    #endregion

    #region Private
    /// <summary>
    /// 檢查指定語系名稱是否為空。
    /// </summary>
    private void CheckCategoryName(IList<CategoryDetail> details, LangCode lang)
    {
        bool hasEmpty = details.Any(item => item.Lang == lang && item.CategoryName.IsNullOrEmpty());
        if (hasEmpty) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18n.GetLabel<CategoryDetail>(item => item.CategoryName));
    }
    /// <summary>
    /// 檢查類別是否已被其他功能資料使用。
    /// </summary>
    private async Task CheckIsUsedAsync(Category category)
    {
        string categoryName = category._CategoryDetail.FirstOrDefault(item => item.Lang == EffectiveLang)?.CategoryName ?? string.Empty;
        int useCount = await GetCategoryUseCountAsync(category.ProgId, category.CategoryId, categoryName);
        if (useCount > 0) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00018, categoryName);
    }
    /// <summary>
    /// 依 Category ProgId 取得使用筆數。
    /// </summary>
    private async Task<int> GetCategoryUseCountAsync(string progId, string categoryId, string categoryName)
    {
        return progId switch
        {
            ProgKeys.WEB.Announcement => await DoQueryListCountAsync<Announcement>($"{nameof(Announcement.Categories)} HasAny {categoryId}"),
            ProgKeys.WEB.FileArchive => await DoQueryListCountAsync<FileArchive>($"{nameof(FileArchive.CategoriesId)} HasAny {categoryId}"),
            ProgKeys.WEB.Gallery => await DoQueryListCountAsync<Gallery>($"{nameof(Gallery.Categories)} HasAny {categoryId}"),
            ProgKeys.WEB.WebResource => await DoQueryListCountAsync<WebResource>($"{nameof(WebResource.Categories)} HasAny {categoryId}"),
            _ => await SpecGetCategoryUseCountAsync(progId, categoryId, categoryName)
        };
    }
    #endregion
}

/// <summary>
/// 一般 Category Biz。
/// </summary>
[LibBiz(ProgKeys.COMM.Code, ProgKeys.COMM.Category)]
public class CategoryBiz(BizDeps bizDeps) : CategoryBizBase<Category>(bizDeps)
{
}