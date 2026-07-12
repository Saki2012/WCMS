using WCMS.Features._Resx;
using WCMS.Features.COMM.Category;
using MaterialModel = WCMS.Features.MAT.Material.Material;
using WCMS.SysCore.FeatureDriver.Biz;
using WCMS.SysCore.I18n;
using WCMS.SysCore.Library.LibAttribute;
using static WCMS.SysCore.Enum.SysEnum;
namespace WCMS.Features.MAT.MatCategory;

/// <summary>
/// MAT 類別組合式表單 Biz。
/// </summary>
[LibBiz(ProgKeys.MAT.Code, ProgKeys.MAT.MatCategory)]
public class MatCategoryBiz(BizDeps bizDeps) : CategoryBizBase<MatCategoryFormModel>(bizDeps)
{
    #region Protected Virtual
    /// <summary>
    /// 限制目前表單只管理 MAT 類別。
    /// </summary>
    protected override string ManagedProgId => ProgKeys.MAT.MatCategory;
    /// <summary>
    /// 更新前回填 MAT Graph 關聯鍵並執行欄位驗證。
    /// </summary>
    protected override async Task BeforeUpdate(MatCategoryFormModel data, FuncAction act, CancellationToken ct = default)
    {
        await base.BeforeUpdate(data, act, ct);
        if (act is not FuncAction.Create and not FuncAction.Update) return;
        PrepareInfoFields(GetCategory(data), data.MatCategoryInfoField);
        CheckInfoFields(data.MatCategoryInfoField);
    }
    /// <summary>
    /// 檢查 MAT 類別是否已被物件資料使用。
    /// </summary>
    protected override async Task<int> SpecGetCategoryUseCountAsync(string progId, string categoryId, string categoryName)
    {
        if (progId != ManagedProgId) return await base.SpecGetCategoryUseCountAsync(progId, categoryId, categoryName);
        return await DoQueryListCountAsync<MaterialModel>($"{nameof(MaterialModel.CategoryId)} = \"{categoryId}\"");
    }
    #endregion

    #region Private
    /// <summary>
    /// 由 Root Category 統一回填自訂欄位與顯示名稱關聯鍵。
    /// </summary>
    private static void PrepareInfoFields(Category category, IEnumerable<MatCategoryInfoField> fields)
    {
        List<MatCategoryInfoField> fieldList = [.. fields];
        int nextFieldRowId = fieldList.Where(item => item.RowId > 0).Select(item => item.RowId).DefaultIfEmpty().Max() + 1;
        int nextDisplayRowId = fieldList.SelectMany(item => item._MatCategoryInfoFieldDisplay).Where(item => item.RowId > 0).Select(item => item.RowId).DefaultIfEmpty().Max() + 1;
        foreach (MatCategoryInfoField field in fieldList)
        {
            if (field.RowId <= 0) field.RowId = nextFieldRowId++;
            field.CategoryId = category.CategoryId;
            nextDisplayRowId = PrepareFieldDisplays(category.CategoryId, field, nextDisplayRowId);
        }
    }
    /// <summary>
    /// 回填單一自訂欄位的多語顯示名稱關聯鍵與缺少的 RowId。
    /// </summary>
    private static int PrepareFieldDisplays(string categoryId, MatCategoryInfoField field, int nextRowId)
    {
        foreach (MatCategoryInfoFieldDisplay display in field._MatCategoryInfoFieldDisplay)
        {
            if (display.RowId <= 0) display.RowId = nextRowId++;
            display.CategoryId = categoryId;
            display.ParentRowId = field.RowId;
        }
        return nextRowId;
    }
    /// <summary>
    /// 驗證自訂欄位代號與預設語系顯示名稱。
    /// </summary>
    private void CheckInfoFields(IReadOnlyCollection<MatCategoryInfoField> fields)
    {
        bool hasEmptyField = fields.Any(item => string.IsNullOrWhiteSpace(item.Field));
        bool hasEmptyDisplay = fields.Any(item => !item._MatCategoryInfoFieldDisplay.Any(display => display.Lang == SiteDefaultLang && !string.IsNullOrWhiteSpace(display.FieldDisplayName)));
        if (hasEmptyField) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00012, I18nCache.GetLabel<MatCategoryInfoField>(item => item.Field));
        if (hasEmptyDisplay) Message.AddMessage(MessageStatus.Error, SysMessageCode.BECode00015, SiteDefaultLang.ToLabel(), I18nCache.GetLabel<MatCategoryInfoFieldDisplay>(item => item.FieldDisplayName));
    }
    #endregion
}
